const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  website: { type: String },
  description: { type: String },
  careerPage: { type: String }, // To be populated by Career Finder service
  industry: { type: String },
  location: { type: String },
  status: { type: String, enum: ['Active', 'Pending_Discovery', 'Inactive'], default: 'Pending_Discovery' },
  lastCrawled: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema);
