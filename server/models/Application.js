const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Applied', 'Failed', 'Interviewing', 'Rejected', 'Accepted'], 
    default: 'Pending' 
  },
  appliedAt: { type: Date, default: Date.now },
  notes: { type: String },
  platformUsed: { type: String },
  screenshot: { type: String },
  retryCount: { type: Number, default: 0 },
  lastError: { type: String },
  lastTriedAt: { type: Date },
  debugRequired: { type: Boolean, default: false }
});

module.exports = mongoose.model('Application', applicationSchema);
