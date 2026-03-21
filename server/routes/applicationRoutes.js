const express = require('express');
const { applyForJob, getApplications, getApplicationStats, getFailureDiagnostics } = require('../controllers/applicationController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/apply', auth, applyForJob);
router.get('/', auth, getApplications);
router.get('/stats', auth, getApplicationStats);
router.get('/failed-diagnostics', auth, getFailureDiagnostics);

module.exports = router;
