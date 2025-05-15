const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/authMiddleware');

// @route   GET api/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/', authMiddleware, (req, res) => {
  res.json({ msg: 'Dashboard data accessed successfully' });
});

module.exports = router;