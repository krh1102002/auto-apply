/**
 * Minimal user object for Puppeteer — loaded from DB so Redis job payloads stay tiny (~30MB Redis).
 */
const User = require('../models/User');

async function loadUserProfileForAutomation(userId) {
  const u = await User.findById(userId)
    .select('name email preferences resumeUrl')
    .lean();

  if (!u) {
    throw new Error(`User not found: ${userId}`);
  }

  const prefs = u.preferences || {};
  return {
    name: u.name,
    email: u.email,
    phone: prefs.phone,
    resumePath: process.env.RESUME_FILE_PATH || prefs.resumePath,
    preferences: {
      linkedin: prefs.linkedin,
      github: prefs.github,
    },
  };
}

module.exports = { loadUserProfileForAutomation };
