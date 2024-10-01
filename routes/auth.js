const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User'); 
require('dotenv').config(); 
const { signToken, authMiddleware } = require('../utilities/auth'); // Adjust path as needed
const express = require('express');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utilities/auth'); // Import signToken
const User = require('../models/User'); // Your User model

const router = express.Router();


router.post(
  '/signup',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      
      user = new User({ email, password });

     
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      
      await user.save();

      
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);


router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }


      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

     
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);




// Login Route Example
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT Token
    const token = signToken(user);

    // Send back token and user details
    res.json({ token, user: { id: user._id, email: user.email, username: user.username } });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;


