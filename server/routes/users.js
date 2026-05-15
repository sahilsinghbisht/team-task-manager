const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/users - list all users (for assigning to projects/tasks)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('name email role').sort({ name: 1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
