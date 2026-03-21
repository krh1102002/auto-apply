const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('../models/Company');
const Job = require('../models/Job');

const TARGET_KEYWORDS = ['software engineer', 'developer', 'software developer', 'fullstack', 'frontend', 'backend'];
const EXPERIENCE_KEYWORDS = ['entry', 'junior', 'fresh', 'graduate', 'early career', 'associate'];

const scrapeCompanyJobs = async (company) => {
  console.log(`🚀 Scraping jobs for ${company.name} at ${company.careerPage}`);
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    await page.goto(company.careerPage, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for content to manifest
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 2000));

    // Extract all links
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors.map(a => ({
        text: a.innerText.trim(),
        href: a.href
      })).filter(a => a.href && a.text);
    });

    const foundJobs = [];
    for (const link of links) {
      const text = link.text.toLowerCase();
      
      // Match engineering roles
      const isEng = TARGET_KEYWORDS.some(kw => text.includes(kw));
      // Match entry/junior level
      const isEntry = EXPERIENCE_KEYWORDS.some(kw => text.includes(kw)) || !text.includes('senior') && !text.includes('lead') && !text.includes('staff') && !text.includes('principal');

      if (isEng && isEntry && !link.href.includes('linkedin.com') && !link.href.includes('twitter.com')) {
        foundJobs.push({
          title: link.text,
          company: company.name,
          url: link.href,
          source: company.careerPage.includes('greenhouse.io') ? 'Greenhouse' : 
                  company.careerPage.includes('lever.co') ? 'Lever' : 'Direct',
          experienceLevel: 'Entry',
          status: 'Open',
          location: 'Remote/Global'
        });
      }
    }

    console.log(`  Found ${foundJobs.length} potential matches.`);
    return foundJobs;

  } catch (err) {
    console.error(`  Error scraping ${company.name}:`, err.message);
    return [];
  } finally {
    await browser.close();
  }
};

const runGlobalScraper = async (limit = 10) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected for Global Scraping');

    const companies = await Company.find({ careerPage: { $ne: null }, status: 'Active' }).limit(limit);
    
    for (const company of companies) {
      const jobs = await scrapeCompanyJobs(company);
      
      if (jobs.length > 0) {
        // Upsert jobs
        for (const jobData of jobs) {
          await Job.updateOne(
            { url: jobData.url },
            { $set: jobData },
            { upsert: true }
          );
        }
      }
    }

    console.log('\n✨ Global Scraping batch complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Global Scraper error:', err);
    process.exit(1);
  }
};

// Run scraper on 50 companies for high-volume discovery
runGlobalScraper(50);
