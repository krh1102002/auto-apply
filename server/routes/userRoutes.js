const express = require('express');
const multer = require('multer');
const { getProfile, updateProfile, uploadResume, getAutomationSettings, updateAutomationSettings } = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// Memory storage for simple parsing without saving to disk for now
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/resume', auth, upload.single('resume'), uploadResume);
router.get('/automation-settings', auth, getAutomationSettings);
router.put('/automation-settings', auth, updateAutomationSettings);

module.exports = router;
