const User = require('../models/User');
const { parseResume } = require('../services/resumeService');

const withPreferenceDefaults = (user) => {
  if (!user.preferences) user.preferences = {};
  user.preferences.skills = user.preferences.skills || [];
  user.preferences.roles = user.preferences.roles || [];
  user.preferences.locations = user.preferences.locations || [];
  if (!user.preferences.automation) {
    user.preferences.automation = {
      roleKeywords: ['software engineer', 'full stack', 'java developer'],
      experienceLevels: ['Entry'],
      countries: [],
      enabled: true
    };
  }
  return user;
};

const getProfile = async (req, res) => {
  try {
    const user = withPreferenceDefaults(await User.findById(req.user.id).select('-password'));
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findById(req.user.id);
    withPreferenceDefaults(user);
    if (name) user.name = name;
    if (preferences) user.preferences = preferences;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const parsedData = await parseResume(req.file.buffer);
    
    const user = await User.findById(req.user.id);
    withPreferenceDefaults(user);
    user.preferences.skills = [...new Set([...user.preferences.skills, ...parsedData.skills])];
    // In a real app, we'd save the file to S3/Cloudinary and store the URL
    // Here we just acknowledge the upload and use the parsed data
    user.resumeUrl = 'local-buffer-simulated'; 
    
    await user.save();

    res.json({ 
      message: 'Resume uploaded and parsed successfully',
      parsedData,
      user: {
        id: user._id,
        name: user.name,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload/Parse Error', error: error.message });
  }
};

const getAutomationSettings = async (req, res) => {
  try {
    const user = withPreferenceDefaults(await User.findById(req.user.id).select('-password'));
    await user.save();
    res.json(user.preferences.automation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateAutomationSettings = async (req, res) => {
  try {
    const { roleKeywords, experienceLevels, countries, enabled } = req.body;
    const user = withPreferenceDefaults(await User.findById(req.user.id));
    user.preferences.automation = {
      roleKeywords: Array.isArray(roleKeywords) ? roleKeywords : user.preferences.automation.roleKeywords,
      experienceLevels: Array.isArray(experienceLevels) ? experienceLevels : user.preferences.automation.experienceLevels,
      countries: Array.isArray(countries) ? countries : user.preferences.automation.countries,
      enabled: typeof enabled === 'boolean' ? enabled : user.preferences.automation.enabled
    };
    await user.save();
    res.json(user.preferences.automation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getProfile, updateProfile, uploadResume, getAutomationSettings, updateAutomationSettings };
