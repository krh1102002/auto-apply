const mongoose = require('mongoose');
const Job = require('../models/Job');
const ApplicationModel = require('../models/Application');
const { crawlPage } = require('../services/crawlerService');
const { discoverAllJobs } = require('../services/discoveryService');

const ROLE_MAP = {
  'Frontend': /frontend|react|angular|vue|web/i,
  'Backend': /backend|node|python|java|golang|ruby|php|node\.js|spring|django|flask/i,
  'Fullstack': /fullstack|full-stack|mern|mean|software engineer|software developer|member of technical staff|systems engineer|technical staff/i,
  'Mobile': /mobile|ios|android|react native|flutter/i,
  'DevOps': /devops|sre|cloud|infrastructure|kubernetes|aws|azure|gcp/i,
  'Data': /data|analyst|scientist|machine learning|ai|ml|big data|analytics/i,
  'QA': /qa|test|quality assurance|automation engineer|verification/i,
  'Security': /security|cyber|pentest|soc|infosec/i
};

const ROLES_TO_TRACK = Object.keys(ROLE_MAP);

const getJobs = async (req, res) => {
  try {
    const { title, location, company, daysAgo, experienceLevel, tech, applicationStatus, region, role, page = 1, limit = 7 } = req.query;
    const userId = req.user.id;
    
    // 1. Build Base Match Conditions (Safety-First: Default to Entry)
    const andConditions = [{ status: 'Open' }];
    
    // Safety Fallback: Default to 'Entry' & 'Unknown' if no seniority filter is provided by the client (Signal Boosting)
    const activeExperience = experienceLevel || ['Entry', 'Unknown'];
    const expArray = (Array.isArray(activeExperience) ? activeExperience : [activeExperience]).filter(e => e && e.trim() !== '');
    
    if (expArray.length > 0) {
      andConditions.push({ experienceLevel: { $in: expArray } });
    }
    if (title && title.trim()) andConditions.push({ title: { $regex: title.trim(), $options: 'i' } });
    if (company && company.trim()) andConditions.push({ company: { $regex: company.trim(), $options: 'i' } });
    
    if (region === 'India') {
      const hubs = ['bangalore', 'bengaluru', 'pune', 'hyderabad', 'gurgaon', 'gurugram', 'noida', 'chennai', 'mumbai', 'delhi', 'india'];
      andConditions.push({ location: { $regex: hubs.join('|'), $options: 'i' } });
    } else if (location && location.trim()) {
      andConditions.push({ location: { $regex: location.trim(), $options: 'i' } });
    }
    
    if (tech) {
      const techArray = (Array.isArray(tech) ? tech : [tech]).filter(t => t && t.trim() !== '');
      if (techArray.length > 0) {
        const techOr = techArray.flatMap(t => [
          { title: { $regex: t.trim(), $options: 'i' } },
          { description: { $regex: t.trim(), $options: 'i' } }
        ]);
        andConditions.push({ $or: techOr });
      }
    }

    if (role && ROLE_MAP[role]) {
      andConditions.push({ title: { $regex: ROLE_MAP[role] } });
    }
    
    if (daysAgo) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(daysAgo));
      andConditions.push({ detectedAt: { $gte: date } });
    }

    const match = { $and: andConditions };
    
    // 2. Build Pipeline
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'applications',
          let: { jobId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$jobId', '$$jobId'] },
                    { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] }
                  ]
                }
              }
            }
          ],
          as: 'userApplication'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: 'name',
          as: 'companyData'
        }
      },
      {
        $addFields: {
          isApplied: { $gt: [{ $size: '$userApplication' }, 0] },
          companyInfo: { $arrayElemAt: ['$companyData', 0] }
        }
      }
    ];

    if (applicationStatus === 'Applied') {
      pipeline.push({ $match: { isApplied: true } });
    } else if (applicationStatus === 'Unapplied') {
      pipeline.push({ $match: { isApplied: false } });
    }

    // 3. Main Result Query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [totalResult, jobs] = await Promise.all([
      Job.aggregate([...pipeline, { $count: 'total' }]),
      Job.aggregate([
        ...pipeline,
        { $sort: { detectedAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $project: { userApplication: 0 } }
      ])
    ]);

    const totalJobs = totalResult[0]?.total || 0;

    // 4. Hardened Role Statistics Logic (Strictly Honor Workflow & Seniority)
    const statsPipeline = [
      ...pipeline, // Inherits status, seniority, location, and applicationStatus filters
      {
        $facet: ROLES_TO_TRACK.reduce((acc, roleName) => {
          acc[roleName] = [
            { $match: { title: { $regex: ROLE_MAP[roleName] } } },
            { $count: 'count' }
          ];
          return acc;
        }, {})
      }
    ];

    const [statsResult] = await Job.aggregate(statsPipeline);
    const roleStats = {};
    ROLES_TO_TRACK.forEach(r => {
      roleStats[r] = statsResult[r]?.[0]?.count || 0;
    });

    res.json({
      jobs,
      totalJobs,
      totalPages: Math.ceil(totalJobs / parseInt(limit)),
      currentPage: parseInt(page),
      stats: roleStats
    });
  } catch (error) {
    console.error('getJobs Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const markAsApplied = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await ApplicationModel.findOneAndUpdate(
      { userId, jobId: id },
      { $set: { status: 'Applied', appliedAt: new Date() } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Job marked as complete' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark job' });
  }
};

const triggerCrawl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });
    const discoveredJobs = await crawlPage(url);
    const savedJobs = [];
    for (const jobData of discoveredJobs) {
      let job = await Job.findOne({ url: jobData.url });
      if (!job) {
        job = new Job(jobData);
        await job.save();
        savedJobs.push(job);
      }
    }
    res.json({ message: `Crawl complete. Discovered ${discoveredJobs.length} jobs.`, jobs: savedJobs });
  } catch (error) {
    res.status(500).json({ message: 'Crawl failed', error: error.message });
  }
};

const refreshJobs = async (req, res) => {
  try {
    const result = await discoverAllJobs();
    res.json({ message: 'Refresh complete', ...result });
  } catch (error) {
    res.status(500).json({ message: 'Refresh failed', error: error.message });
  }
};

module.exports = { getJobs, triggerCrawl, refreshJobs, markAsApplied };
