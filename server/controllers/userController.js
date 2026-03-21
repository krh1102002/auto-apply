const User = require('../models/User');
const { parseResume } = require('../services/resumeService');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const user = await User.findById(req.user.id);
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

module.exports = { getProfile, updateProfile, uploadResume };
