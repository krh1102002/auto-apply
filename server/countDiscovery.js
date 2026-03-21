const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('./models/Company');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const count = await Company.countDocuments({ careerPage: { $ne: null } });
    console.log(`Companies with Career Pages: ${count}`);
    const samples = await Company.find({ careerPage: { $ne: null } }).limit(5);
    console.log('Sample Active Companies:', samples.map(s => `${s.name}: ${s.careerPage}`));
    process.exit(0);
  });
