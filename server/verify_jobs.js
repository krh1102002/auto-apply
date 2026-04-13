const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('./models/Job');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await Job.countDocuments();
  console.log(`Total Jobs in DB: ${count}`);
  
  const entryCount = await Job.countDocuments({ experienceLevel: 'Entry' });
  console.log(`Entry-Level/Fresher Jobs: ${entryCount}`);

  const sources = await Job.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } }
  ]);
  console.log('Jobs by Source:', sources);

  const samples = await Job.find().sort({ detectedAt: -1 }).limit(5);
  console.log('Latest 5 Jobs:', samples.map(j => `${j.title} @ ${j.company} (${j.source})`));

  process.exit(0);
}

check();
