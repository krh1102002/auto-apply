const express = require('express');
const { getJobs, triggerCrawl } = require('../controllers/jobController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', auth, getJobs);
router.post('/crawl', auth, triggerCrawl);

module.exports = router;
