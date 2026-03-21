const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();
const Company = require('../models/Company');

const COMMON_PATHS = [
  '/careers',
  '/jobs',
  '/about/careers',
  '/work-with-us',
  '/join-us'
];

const findCareerPage = async (company) => {
  let website = company.website;
  if (!website) return null;
  if (!website.startsWith('http')) website = `https://${website}`;

  // Strategy 1: Common Paths
  for (const path of COMMON_PATHS) {
    try {
      const url = `${website.replace(/\/$/, '')}${path}`;
      const response = await axios.get(url, { timeout: 10000, validateStatus: false });
      
      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        const text = $('body').text().toLowerCase();
        
        // Basic keywords to verify it's a career page
        if (text.includes('career') || text.includes('job') || text.includes('open position') || text.includes('apply')) {
          return url;
        }
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // Strategy 2: Check for a link with text 'Careers' on the homepage
  try {
    const response = await axios.get(website, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    let careerLink = null;
    
    $('a').each((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href');
      if (href && (text === 'careers' || text === 'jobs' || text.includes('working at') || text.includes('open roles'))) {
        careerLink = href;
        return false; // Break
      }
    });

    if (careerLink) {
      if (careerLink.startsWith('/')) {
        return `${website.replace(/\/$/, '')}${careerLink}`;
      }
      return careerLink;
    }
  } catch (e) {}

  return null;
};

const runDiscovery = async (limit = 100) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected for Discovery');

    const companies = await Company.find({ careerPage: null, status: 'Pending_Discovery' }).limit(limit);
    console.log(`🔍 Starting career discovery for ${companies.length} companies...`);

    for (const company of companies) {
      process.stdout.write(`Analyzing ${company.name}... `);
      const url = await findCareerPage(company);
      
      if (url) {
        company.careerPage = url;
        company.status = 'Active';
        await company.save();
        console.log(`✅ Found: ${url}`);
      } else {
        company.status = 'Inactive'; // Mark for human review or secondary search
        await company.save();
        console.log('❌ Not found');
      }
    }

    console.log('\n✨ Discovery batch complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Discovery error:', err);
    process.exit(1);
  }
};

// Run discovery on a batch of 500 to scale up
runDiscovery(500);
