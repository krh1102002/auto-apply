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
        console.log('✅ Connected to MongoDB');

        const ROLES_TO_TRACK = Object.keys(ROLE_MAP);
        const stats = {};
        
        for (const role of ROLES_TO_TRACK) {
            const count = await Job.countDocuments({
                status: 'Open',
                experienceLevel: 'Entry',
                title: { $regex: ROLE_MAP[role] }
            });
            stats[role] = count;
        }

        console.log('DEBUG_STATS_RESULT:', JSON.stringify(stats, null, 2));

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();
