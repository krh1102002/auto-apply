const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config({ path: './.env' });
const Job = require('./models/Job');

const TARGET_KEYWORDS = [
  'software engineer',
  'full stack',
  'full-stack',
  'backend',
  'frontend',
  'java developer',
  'android',
  'ios',
  'mobile',
  'react',
  'angular',
  'node',
  'spring'
];

const GREENHOUSE_BOARDS = [
  'canonical', 'databricks', 'mongodb', 'okta', 'robinhood', 'datadog', 'samsara', 'sofi',
  'spacex', 'sonatype', 'yelp', 'stripe', 'airtable', 'asana', 'coinbase', 'discord', 'dropbox',
  'fivetran', 'hubspot', 'instacart', 'lyft', 'plaid', 'reddit', 'shopify', 'slack', 'twilio',
  'zoom', 'notion', 'figma', 'grammarly', 'openai', 'snowflake', 'dataiku', 'newrelic', 'elastic',
  'doordash', 'affirm', 'wayfair', 'zillow', 'roblox', 'hashicorp', 'duolingo', 'natera', 'rippling',
  'zapier', 'atlassian', 'spotify', 'nvidia'
];

const LEVER_BOARDS = [
  'netflix', 'coinbase', 'palantir', 'postman', 'whoop', 'veeva', 'octoenergy', 'rewaatech',
  '3pillarglobal', 'supernovacompanies', 'bloomon', 'megaport', 'addx', 'zocks', 'mixpanel',
  'calendly', 'gitlab', 'canva', 'monday', 'coursera', 'udemy', 'bolt', 'airwallex', 'wise',
  'contentful', 'personio', 'snyk', 'algolia', 'intercom', 'sourcegraph'
];

const isRelevant = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  return TARGET_KEYWORDS.some((k) => text.includes(k));
};

const normalizeGreenhouse = (company, item) => ({
  title: item.title,
  company: company.charAt(0).toUpperCase() + company.slice(1),
  location: item.location?.name || 'Global/Remote',
  description: item.content || '',
  url: item.absolute_url,
  source: 'Greenhouse',
  experienceLevel: 'Entry',
  status: 'Open'
});

const normalizeLever = (company, item) => ({
  title: item.text,
  company: company.charAt(0).toUpperCase() + company.slice(1),
  location: item.categories?.location || 'Global/Remote',
  description: item.descriptionPlain || item.description || '',
  url: item.applyUrl || item.hostedUrl,
  source: 'Lever',
  experienceLevel: 'Entry',
  status: 'Open'
});

const upsertJobs = async (jobs) => {
  if (!jobs.length) return 0;
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

const discoverFromGreenhouse = async () => {
  const discovered = [];
  for (const company of GREENHOUSE_BOARDS) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`;
      const { data } = await axios.get(url, { timeout: 20000 });
      const jobs = (data.jobs || [])
        .filter((item) => isRelevant(item.title, item.content))
        .map((item) => normalizeGreenhouse(company, item));
      discovered.push(...jobs);
      console.log(`[Greenhouse] ${company}: ${jobs.length} matched jobs`);
    } catch (error) {
      console.log(`[Greenhouse] ${company}: skipped (${error.message})`);
    }
  }
  return discovered;
};

const discoverFromLever = async () => {
  const discovered = [];
  for (const company of LEVER_BOARDS) {
    try {
      const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
      const { data } = await axios.get(url, { timeout: 20000 });
      const jobs = (Array.isArray(data) ? data : [])
        .filter((item) => isRelevant(item.text, item.descriptionPlain || item.description))
        .map((item) => normalizeLever(company, item));
      discovered.push(...jobs);
      console.log(`[Lever] ${company}: ${jobs.length} matched jobs`);
    } catch (error) {
      console.log(`[Lever] ${company}: skipped (${error.message})`);
    }
  }
  return discovered;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const [greenhouseJobs, leverJobs] = await Promise.all([
      discoverFromGreenhouse(),
      discoverFromLever()
    ]);
    const merged = [...greenhouseJobs, ...leverJobs];
    const savedCount = await upsertJobs(merged);
    console.log(`\n🎯 Total discovered matching jobs: ${merged.length}`);
    console.log(`💾 Upserted/updated job records: ${savedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Discovery failed:', err.message);
    process.exit(1);
  }
};

run();
