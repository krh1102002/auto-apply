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
  
  const isSenior = [
    'senior', 'sr.', 'lead', 'staff', 'principal', 'manager', 'director', 'vp', 'head', 
    'architect', 'expert', 'lead', 'director', 'l4', 'l5', 'l6', 'level 4', 'level 5',
    '8+ years', '10+ years', '12+ years'
  ].some(k => text.includes(k));

  const isMid = [
    'mid', 'intermediate', 'ii', 'iii', 'level 2', 'level 3', 'l2', 'l3',
    '3+ years', '4+ years', '5+ years', 'specialist'
  ].some(k => text.includes(k));

  const isFresher = [
    'fresher', 'entry', 'junior', 'intern', 'graduate', 'trainee', 'associate', 
    '0 years', '0-1 years', '0-2 years', 'l1', 'level 1', 'level i', 'internship', 'apprentice'
  ].some(k => text.includes(k));

  // Prioritize Senior -> Mid -> Entry
  if (isSenior) return 'Senior';
  if (isMid) return 'Mid';
  if (isFresher) return 'Entry';
  
  // If the title contains specific engineering "levels" or manager keywords, it's NOT Entry
  if (/ director| manager| principal| lead | staff | architect| ii | iii | iv | v /i.test(title)) {
    return 'Mid/Senior';
  }

  return 'Unknown'; // Safety first: don't default to Entry anymore
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

const discoverFromHackerNews = async () => {
  try {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (MAX_AGE_DAYS * 24 * 60 * 60);
    // 1. Find the latest "Who is Hiring" story
    const searchUrl = `https://hn.algolia.com/api/v1/search?tags=story,author:whoishiring&query="Who is hiring"&numericFilters=created_at_i>${thirtyDaysAgo}`;
    const { data: searchData } = await axios.get(searchUrl, { timeout: HTTP_TIMEOUT_MS });
    
    if (!searchData.hits || searchData.hits.length === 0) return [];
    
    const latestStory = searchData.hits[0];
    console.log(`🔍 [HackerNews] Scanning thread: "${latestStory.title}"`);
    
    // 2. Fetch all comments (each comment is a job post)
    const itemUrl = `https://hn.algolia.com/api/v1/items/${latestStory.objectID}`;
    const { data: itemData } = await axios.get(itemUrl, { timeout: HTTP_TIMEOUT_MS });
    
    const jobs = [];
    let count = 0;

    const processComments = (comments) => {
      for (const comment of comments) {
        if (!comment.text) continue;
        
        // HN jobs usually have the company name in the first bold part or first line
        const lines = comment.text.replace(/<[^>]*>/g, ' ').split('\n');
        const firstLine = lines[0] || '';
        
        // Simple extraction: Company | Title | Location
        // Often formatted as "Company Name | Job Title | Location"
        const parts = firstLine.split('|').map(p => p.trim());
        const company = parts[0] || 'Unknown HN Startup';
        const title = parts[1] || 'Software Engineer';
        const location = parts[2] || 'Remote / Multiple';

        if (isRelevant(title, comment.text) && isIndiaOrRemote(location)) {
          const exp = categorizeExperienceLevel(title, comment.text);
          jobs.push({
            title,
            company,
            location,
            description: comment.text,
            url: `https://news.ycombinator.com/item?id=${comment.id}`,
            source: 'HackerNews',
            experienceLevel: exp,
            status: 'Open',
            postedAt: new Date(comment.created_at),
            detectedAt: new Date()
          });
          count++;
        }
        
        // Note: HN comments are threaded, but Job posts are usually top-level. 
        // We only process children if needed, but usually top-level is best.
      }
    };

    processComments(itemData.children || []);
    console.log(`   - Found ${count} relevant HN roles.`);
    return jobs;
  } catch (error) {
    console.error('Hacker News discovery failed:', error.message);
    return [];
  }
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

const discoverFromJooble = async () => {
  try {
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) return [];

    const url = `https://jooble.org/api/${apiKey}`;
    const keywords = ['Software Engineer', 'Java Developer', 'SQL Developer', 'Fullstack'];
    const discovered = [];

    for (const kw of keywords) {
      const { data } = await axios.post(url, {
        keywords: kw,
        location: 'India',
        page: '1'
      }, { timeout: HTTP_TIMEOUT_MS });

      if (data.jobs) {
        data.jobs.forEach(item => {
          if (isRelevant(item.title, item.snippet)) {
            discovered.push({
              title: item.title,
              company: item.company || 'Jooble Listing',
              location: item.location || 'India',
              description: item.snippet || '',
              url: item.link,
              source: 'Jooble',
              experienceLevel: categorizeExperienceLevel(item.title, item.snippet),
              status: 'Open',
              detectedAt: new Date()
            });
          }
        });
      }
    }
    console.log(`🔍 [Jooble] Found ${discovered.length} roles.`);
    return discovered;
  } catch (error) {
    console.error('Jooble discovery failed (Check API Key)');
    return [];
  }
};

const discoverFromAdzuna = async () => {
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !apiKey) return [];

    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${apiKey}&what=Software%20Engineer&content-type=application/json`;
    const { data } = await axios.get(url, { timeout: HTTP_TIMEOUT_MS });
    
    const jobs = (data.results || [])
      .filter(item => isRelevant(item.title, item.description))
      .map(item => ({
        title: item.title,
        company: item.company?.display_name || 'Adzuna Listing',
        location: item.location?.display_name || 'India',
        description: item.description || '',
        url: item.redirect_url,
        source: 'Adzuna',
        experienceLevel: categorizeExperienceLevel(item.title, item.description),
        status: 'Open',
        postedAt: new Date(item.created),
        detectedAt: new Date()
      }));
    
    console.log(`🔍 [Adzuna] Found ${jobs.length} roles.`);
    return jobs;
  } catch (error) {
    console.error('Adzuna discovery failed (Check App ID/Key)');
    return [];
  }
};

const discoverFromLinkedIn = async () => {
  const keywords = [
    'Software Engineer',
    'Java Developer',
    'SQL Developer',
    'Frontend Developer',
    'Backend Developer',
    'Fullstack Developer',
    'Python Developer',
    'DevOps Engineer'
  ];
  
  const discovered = [];
  console.log(`🔍 [LinkedIn] Starting multi-keyword scan (${keywords.length} tracks)...`);

  for (const keyword of keywords) {
    try {
      // Search for specific roles (last 30 days via f_TPR=r2592000)
      const encodedKeyword = encodeURIComponent(keyword);
      const url = `https://www.linkedin.com/jobs/search?keywords=${encodedKeyword}&location=Worldwide&f_TPR=r2592000`;
      
      const { data } = await axios.get(url, { 
        timeout: HTTP_TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(data);
      let count = 0;
      
      $('.base-search-card').each((i, el) => {
        const title = $(el).find('.base-search-card__title').text().trim();
        const company = $(el).find('.base-search-card__subtitle').text().trim();
        const location = $(el).find('.job-search-card__location').text().trim();
        const link = $(el).find('.base-card__full-link').attr('href');
        const timeStr = $(el).find('.job-search-card__listdate').attr('datetime');
        
        if (title && company && link && isRelevant(title, '') && 
            isWithinFreshnessWindow(timeStr) && isIndiaOrRemote(location)) {
          const exp = categorizeExperienceLevel(title, '');
          discovered.push({
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
          count++;
        }
      });
      console.log(`   - [${keyword}]: Found ${count} relevant roles.`);
      
      // Small pause between keywords to be polite
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`   - [${keyword}] Scrape failed:`, error.message);
    }
  }
  
  return discovered;
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
  console.log('🚀 Starting global tech discovery mesh (Direct, Elite, & Aggregated)...');
  const [gh, lv, hn, an, jb, az, li] = await Promise.all([
    discoverFromGreenhouse(),
    discoverFromLever(),
    discoverFromHackerNews(),
    discoverFromArbeitnow(),
    discoverFromJooble(),
    discoverFromAdzuna(),
    discoverFromLinkedIn()
  ]);
  
  const allJobs = [...gh, ...lv, ...hn, ...an, ...jb, ...az, ...li];
  const savedCount = await upsertJobs(allJobs);
  
  console.log(`✅ Discovery complete. Pulled from 6 major streams. Found ${allJobs.length} tech roles. Updated/Saved ${savedCount} records.`);
  return { total: allJobs.length, saved: savedCount };
};

module.exports = { discoverAllJobs, isRelevant, isIndiaOrRemote, categorizeExperienceLevel };
