const axios = require('axios');
const cheerio = require('cheerio');
const Job = require('../models/Job');
const Company = require('../models/Company');

const HTTP_TIMEOUT_MS = 30000;

const TARGET_KEYWORDS = [
  'fresher', 'entry level', 'junior', 'intern', 'associate', 'graduate', 'trainee',
  'software engineer', 'full stack', 'backend', 'frontend', 'developer', 'react', 'node', 'java', 'python'
];

const GREENHOUSE_BOARDS = [
  'canonical', 'databricks', 'mongodb', 'okta', 'robinhood', 'datadog', 'samsara', 'sofi',
  'spacex', 'sonatype', 'yelp', 'stripe', 'airtable', 'asana', 'coinbase', 'discord', 'dropbox',
  'fivetran', 'hubspot', 'instacart', 'lyft', 'plaid', 'reddit', 'shopify', 'slack', 'twilio',
  'zoom', 'notion', 'figma', 'grammarly', 'openai', 'snowflake', 'dataiku', 'newrelic', 'elastic',
  'doordash', 'affirm', 'wayfair', 'zillow', 'roblox', 'hashicorp', 'duolingo', 'natera', 'rippling',
  'zapier', 'atlassian', 'spotify', 'nvidia', 'uber', 'pinterest', 'snapchat', 'kraken', 'cruise'
];

const LEVER_BOARDS = [
  'netflix', 'coinbase', 'palantir', 'postman', 'whoop', 'veeva', 'octoenergy', 'rewaatech',
  '3pillarglobal', 'supernovacompanies', 'bloomon', 'megaport', 'addx', 'zocks', 'mixpanel',
  'calendly', 'gitlab', 'canva', 'monday', 'coursera', 'udemy', 'bolt', 'airwallex', 'wise',
  'contentful', 'personio', 'snyk', 'algolia', 'intercom', 'sourcegraph', 'figma', 'revolut', 'klarna'
];

const MAX_AGE_DAYS = 30;

const isRelevant = (title = '', description = '') => {
  const lowerTitle = title.toLowerCase();
  const text = `${title} ${description}`.toLowerCase();
  
  // 1. Strict Title Blacklist - These roles are NEVER technical engineering roles
  const strictTitleBlacklist = [
    'customer support', 'customer success', 'customer service', 'technical support analyst',
    'sales representative', 'marketing associate', 'human resources', 'hr associate',
    'accountant', 'finance', 'administrative', 'receptionist', 'marketing manager',
    'sales manager', 'bpo', 'voice process', 'non-voice', 'content writer',
    'seo specialist', 'social media', 'crm specialist', 'business development',
    'office manager', 'banker', 'teller', 'nurse', 'doctor', 'support specialist',
    'it support' // IT Support is infrastructure support, not engineering/coding
  ];

  if (strictTitleBlacklist.some(k => lowerTitle.includes(k))) return false;

  // 2. Tech Whitelist
  const techKeywords = [
    'software', 'engineer', 'developer', 'full stack', 'backend', 'frontend', 
    'fullstack', 'react', 'node', 'java', 'python', 'golang', 'rust', 'c++', 
    'devops', 'cloud', 'infrastructure', 'security', 'cyber', 'data scientist', 
    'data engineer', 'machine learning', 'ai engineer', 'mobile developer', 
    'ios', 'android', 'embedded', 'coder', 'programmer', 'sre', 'quality assurance',
    'qa engineer', 'test engineer', 'architect', 'blockchain', 'firmware', 'sql',
    'mern', 'mean', 'aws', 'azure', 'gcp', 'kubernetes', 'docker'
  ];

  // 3. Generic Blacklist (covers description too)
  const generalBlacklist = [
    'legal', 'paralegal', 'attorney', 'lawyer', 'counsel', 'human resources', 
    'banker', 'nurse', 'doctor', 'account executive', 'sales executive'
  ];

  const hasTechInTitle = techKeywords.some(k => lowerTitle.includes(k));
  const hasTechInDesc = techKeywords.some(k => text.includes(k));
  const hasBlacklisted = generalBlacklist.some(k => text.includes(k));

  if ((hasTechInTitle || hasTechInDesc) && !hasBlacklisted) {
    // 4. Stricter check: If no tech keyword is in the title, it MUST NOT have non-tech indicators in the title
    if (!hasTechInTitle) {
      const nonTechTitleKeywords = ['coordinator', 'recruiter', 'support', 'specialist', 'manager', 'lead', 'operations', 'marketing', 'hr'];
      if (nonTechTitleKeywords.some(k => lowerTitle.includes(k))) return false;
    }
    
    // 5. Special check for "Associate" or "Assistant" roles - must have a tech word IN THE TITLE
    const genericRoles = ['associate', 'assistant', 'executive', 'analyst', 'specialist'];
    const isGeneric = genericRoles.some(k => lowerTitle.includes(k));
    
    if (isGeneric) {
      // If it's a generic word like "Associate", the TITLE must also contain a tech keyword
      // (e.g., "Software Associate" is OK, "Associate - German Speaking" is NOT)
      const titleHasTech = techKeywords.some(k => lowerTitle.includes(k));
      if (!titleHasTech) return false;
    }

    // 5. Exclude non-CS engineering
    const genericEngineeringTitles = ['civil', 'mechanical', 'chemical', 'structural', 'industrial'];
    const isOtherEngineer = genericEngineeringTitles.some(k => lowerTitle.includes(k));
    if (isOtherEngineer) return false;
    
    return true;
  }

  return false;
};

const isIndiaOrRemote = (location = '') => {
  const loc = location.toLowerCase();
  const indiaHubs = [
    'india', 'bangalore', 'bengaluru', 'pune', 'hyderabad', 'gurgaon', 'gurugram', 
    'noida', 'chennai', 'mumbai', 'delhi', 'kolkata', 'ahmedabad', 'thane', 'pimpri', 'surat', 'jaipur'
  ];
  const remoteKeywords = ['remote', 'anywhere', 'wfh', 'work from home', 'global'];
  
  const isIndia = indiaHubs.some(hub => loc.includes(hub));
  const isRemote = remoteKeywords.some(key => loc.includes(key));
  
  return isIndia || isRemote;
};

const isWithinFreshnessWindow = (date) => {
  if (!date) return true; 
  const jobDate = new Date(date);
  if (isNaN(jobDate.getTime())) return true; // Fallback if date is unparseable
  const now = new Date();
  const diffTime = Math.abs(now - jobDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= MAX_AGE_DAYS;
};

const categorizeExperienceLevel = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  
  const isSenior = ['senior', 'sr.', 'lead', 'staff', 'principal', 'manager', 'director', 'vp', 'head', '5+ years', '8+ years', '10+ years'].some(k => text.includes(k));
  const isMid = ['mid', 'intermediate', 'ii', 'iii', 'level 2', 'level 3', '3+ years', '4+ years'].some(k => text.includes(k));
  const isFresher = [
    'fresher', 'entry', 'junior', 'intern', 'graduate', 'trainee', 'associate', 
    '0 years', '0-1 years', '0-2 years', 'l1', 'level 1', 'level i', 'internship'
  ].some(k => text.includes(k));

  // Prioritize Senior -> Mid -> Entry
  if (isSenior) return 'Senior';
  if (isMid) return 'Mid';
  if (isFresher) return 'Entry';
  
  return 'Entry'; // Default to Entry Level for maximal fresher visibility
};

const normalizeGreenhouse = (company, item) => {
  const exp = categorizeExperienceLevel(item.title, item.content);
  return {
    title: item.title,
    company: company.charAt(0).toUpperCase() + company.slice(1),
    location: item.location?.name || 'Global/Remote',
    description: item.content || '',
    url: item.absolute_url,
    source: 'Greenhouse',
    experienceLevel: exp,
    status: 'Open',
    detectedAt: new Date()
  };
};

const normalizeLever = (company, item) => {
  const exp = categorizeExperienceLevel(item.text, item.descriptionPlain || item.description);
  return {
    title: item.text,
    company: company.charAt(0).toUpperCase() + company.slice(1),
    location: item.categories?.location || 'Global/Remote',
    description: item.descriptionPlain || item.description || '',
    url: item.applyUrl || item.hostedUrl,
    source: 'Lever',
    experienceLevel: exp,
    status: 'Open',
    detectedAt: new Date()
  };
};

const discoverFromGreenhouse = async () => {
  const discovered = [];
  for (const company of GREENHOUSE_BOARDS) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`;
      const { data } = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
      const jobs = (data.jobs || [])
        .filter((item) => {
          const location = item.location?.name || 'Global/Remote';
          return isRelevant(item.title, item.content) && isIndiaOrRemote(location);
        })
        .map((item) => normalizeGreenhouse(company, item));
      discovered.push(...jobs);
    } catch (error) {
      // Small silent fail for individual boards
    }
  }
  return discovered;
};

const discoverFromLever = async () => {
  const discovered = [];
  for (const company of LEVER_BOARDS) {
    try {
      const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
      const { data } = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
      const jobs = (Array.isArray(data) ? data : [])
        .filter((item) => {
          const location = item.categories?.location || 'Global/Remote';
          return isRelevant(item.text, item.descriptionPlain || item.description) && isIndiaOrRemote(location);
        })
        .map((item) => normalizeLever(company, item));
      discovered.push(...jobs);
    } catch (error) {
      // Small silent fail
    }
  }
  return discovered;
};

const discoverFromArbeitnow = async () => {
  try {
    const url = 'https://www.arbeitnow.com/api/job-board-api';
    const { data } = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
    const jobs = (data.data || [])
      .filter(item => {
        return isRelevant(item.title, item.description) && 
               isWithinFreshnessWindow(item.created_at) && 
               isIndiaOrRemote(item.location);
      })
      .map(item => {
        const exp = categorizeExperienceLevel(item.title, item.description);
        return {
          title: item.title,
          company: item.company_name,
          location: item.location,
          description: item.description,
          url: item.url,
          source: 'Arbeitnow',
          experienceLevel: exp,
          status: 'Open',
          postedAt: item.created_at ? new Date(item.created_at) : new Date(),
          detectedAt: new Date()
        };
      });
    return jobs;
  } catch (error) {
    console.error('Arbeitnow fetch failed');
    return [];
  }
};

const discoverFromLinkedIn = async () => {
  try {
    // Search for Software Engineer roles (last 30 days via f_TPR=r2592000)
    const url = 'https://www.linkedin.com/jobs/search?keywords=Software%20Engineer&location=Worldwide&f_TPR=r2592000';
    const { data } = await axios.get(url, { 
      timeout: HTTP_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const jobs = [];
    
    $('.base-search-card').each((i, el) => {
      const title = $(el).find('.base-search-card__title').text().trim();
      const company = $(el).find('.base-search-card__subtitle').text().trim();
      const location = $(el).find('.job-search-card__location').text().trim();
      const link = $(el).find('.base-card__full-link').attr('href');
      const timeStr = $(el).find('.job-search-card__listdate').attr('datetime');
      
      if (title && company && link && isRelevant(title, '') && 
          isWithinFreshnessWindow(timeStr) && isIndiaOrRemote(location)) {
        const exp = categorizeExperienceLevel(title, '');
        jobs.push({
          title,
          company,
          location,
          url: link.split('?')[0],
          source: 'LinkedIn',
          experienceLevel: exp,
          status: 'Open',
          postedAt: timeStr ? new Date(timeStr) : new Date(),
          detectedAt: new Date()
        });
      }
    });
    
    return jobs;
  } catch (error) {
    console.error('LinkedIn public scrape failed');
    return [];
  }
};

const upsertJobs = async (jobs) => {
  if (!jobs.length) return 0;
  
  // First, upsert companies to ensure they exist
  const uniqueCompanies = [...new Set(jobs.map(j => j.company))];
  for (const compName of uniqueCompanies) {
    await Company.updateOne(
      { name: compName },
      { $setOnInsert: { status: 'Active', createdAt: new Date() } },
      { upsert: true }
    );
  }

  const ops = jobs.map((job) => ({
    updateOne: {
      filter: { url: job.url },
      update: { $set: job },
      upsert: true
    }
  }));
  const result = await Job.bulkWrite(ops, { ordered: false });
  return (result.upsertedCount || 0) + (result.modifiedCount || 0);
};

const discoverAllJobs = async () => {
  console.log('🚀 Starting global tech job discovery (Strict Tech-Only + 30-day window)...');
  const [gh, lv, an, li] = await Promise.all([
    discoverFromGreenhouse(),
    discoverFromLever(),
    discoverFromArbeitnow(),
    discoverFromLinkedIn()
  ]);
  
  const allJobs = [...gh, ...lv, ...an, ...li];
  const savedCount = await upsertJobs(allJobs);
  
  console.log(`✅ Discovery complete. Found ${allJobs.length} fresh tech roles. Updated/Saved ${savedCount} records.`);
  return { total: allJobs.length, saved: savedCount };
};

module.exports = { discoverAllJobs, isRelevant, isIndiaOrRemote, categorizeExperienceLevel };
