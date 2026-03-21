const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  location: { type: String },
  salary: { type: String },
  description: { type: String },
  url: { type: String, required: true, unique: true },
  source: { type: String }, // e.g., 'Greenhouse', 'LinkedIn'
  experienceLevel: { type: String, enum: ['Entry', 'Mid', 'Senior', 'Lead'], default: 'Entry' },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  postedAt: { type: Date },
  detectedAt: { type: Date, default: Date.now }
});

jobSchema.index({ status: 1, detectedAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
