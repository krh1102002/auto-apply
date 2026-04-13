const express = require('express');
const { getJobs, triggerCrawl, refreshJobs, markAsApplied } = require('../controllers/jobController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', auth, getJobs);
router.post('/crawl', auth, triggerCrawl);
router.post('/refresh', auth, refreshJobs);
router.post('/:id/apply', auth, markAsApplied);

module.exports = router;
