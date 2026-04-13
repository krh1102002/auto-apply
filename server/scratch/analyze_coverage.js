const mongoose = require('mongoose');
const Job = require('../models/Job');
require('dotenv').config();

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

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const expCounts = await Job.aggregate([
            { $group: { _id: '$experienceLevel', count: { $sum: 1 } } }
        ]);
        console.log('EXPERIENCE_DISTRIBUTION:', JSON.stringify(expCounts, null, 2));

        const totalJobs = await Job.countDocuments();
        let matchedSomething = 0;
        const allRegex = new RegExp(Object.values(ROLE_MAP).map(r => r.source).join('|'), 'i');
        
        const uncategorizedCount = await Job.countDocuments({
            title: { $not: allRegex }
        });

        console.log('TOTAL_JOBS:', totalJobs);
        console.log('UNCATEGORIZED_ROLES:', uncategorizedCount);

        const sampleUncategorized = await Job.find({
            title: { $not: allRegex }
        }).limit(10).select('title');
        
        console.log('SAMPLE_UNCATEGORIZED:', JSON.stringify(sampleUncategorized, null, 2));

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();
