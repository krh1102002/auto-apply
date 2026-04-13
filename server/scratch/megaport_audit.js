const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('../models/Job');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check all Megaport roles shown in the user's screenshot
    const leaks = await Job.find({ company: 'MEGAPORT' });

    console.log(`--- MEGAPORT LEAK AUDIT ---`);
    console.log(`Found ${leaks.length} Megaport roles.`);
    
    leaks.forEach((l, i) => {
        console.log(`${i+1}. [${l.title}]`);
        console.log(`   - Seniority: ${l.experienceLevel}`);
        console.log(`   - ID: ${l._id}`);
    });

    // Also check the total counts in the database
    const totalJobs = await Job.countDocuments({});
    const entryJobs = await Job.countDocuments({ experienceLevel: 'Entry' });
    const seniorJobs = await Job.countDocuments({ experienceLevel: { $in: ['Mid', 'Senior', 'Mid/Senior'] } });
    const unknownJobs = await Job.countDocuments({ experienceLevel: 'Unknown' });

    console.log(`\n--- DATABASE TOTALS ---`);
    console.log(`Total Jobs : ${totalJobs}`);
    console.log(`Entry      : ${entryJobs}`);
    console.log(`Senior/Mid : ${seniorJobs}`);
    console.log(`Unknown    : ${unknownJobs}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
