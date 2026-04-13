const mongoose = require('mongoose');
const { isRelevant, isIndiaOrRemote } = require('../services/discoveryService');
const Job = require('../models/Job');
require('dotenv').config();

const wipeNonTech = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const allJobs = await Job.find({ status: 'Open' });
    console.log(`🔍 Inspecting ${allJobs.length} open jobs for technical and geographic relevance...`);

    const idsToDelete = [];
    for (const job of allJobs) {
      const technicalMatch = isRelevant(job.title, job.description);
      const geographicMatch = isIndiaOrRemote(job.location);

      if (!technicalMatch || !geographicMatch) {
        idsToDelete.push(job._id);
      }
    }

    if (idsToDelete.length > 0) {
      console.log(`🧹 Found ${idsToDelete.length} irrelevant roles. Deleting...`);
      await Job.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`✅ Successfully removed ${idsToDelete.length} roles from the database.`);
    } else {
      console.log('✨ No non-tech roles found.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
};

wipeNonTech();
