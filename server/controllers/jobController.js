const Job = require('../models/Job');
const { crawlPage } = require('../services/crawlerService');

const getJobs = async (req, res) => {
  try {
    const { title, location, company, daysAgo, experienceLevel } = req.query;
    const query = { status: 'Open' };
    
    if (title) query.title = { $regex: title, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };
    if (company) query.company = { $regex: company, $options: 'i' };
    if (experienceLevel) query.experienceLevel = experienceLevel;
    
    if (daysAgo) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(daysAgo));
      query.detectedAt = { $gte: date };
    }

    const jobs = await Job.find(query).sort({ detectedAt: -1 }).limit(50);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const triggerCrawl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    const discoveredJobs = await crawlPage(url);
    
    const savedJobs = [];
    for (const jobData of discoveredJobs) {
      // Avoid duplicates based on URL
      let job = await Job.findOne({ url: jobData.url });
      if (!job) {
        job = new Job(jobData);
        await job.save();
        savedJobs.push(job);
      }
    }

    res.json({ message: `Crawl complete. Discovered ${discoveredJobs.length} jobs. Saved ${savedJobs.length} new jobs.`, jobs: savedJobs });
  } catch (error) {
    res.status(500).json({ message: 'Crawl failed', error: error.message });
  }
};

module.exports = { getJobs, triggerCrawl };
