const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resumeUrl: { type: String },
  preferences: {
    skills: { type: [String], default: [] },
    roles: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    minSalary: Number,
    linkedin: { type: String },
    github: { type: String },
    phone: { type: String },
    resumePath: { type: String },
    automation: {
      roleKeywords: { type: [String], default: ['software engineer', 'full stack', 'java developer'] },
      experienceLevels: { type: [String], default: ['Entry'] },
      countries: { type: [String], default: [] },
      enabled: { type: Boolean, default: true }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
