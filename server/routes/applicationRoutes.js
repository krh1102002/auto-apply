const express = require('express');
const { applyForJob, getApplications } = require('../controllers/applicationController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/apply', auth, applyForJob);
router.get('/', auth, getApplications);

module.exports = router;
