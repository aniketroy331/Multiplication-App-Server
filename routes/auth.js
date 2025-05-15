const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/User');
const Token = require('../models/Token');
const sendEmail = require('../utils/sendEmail');
const authMiddleware = require('../utils/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email,
        password
      });

      await user.save();

      // Create Json Web Tokens
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.jwtSecret,
        { expiresIn: config.jwtExpire },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
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
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // Create Json web tokens
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.jwtSecret,
        { expiresIn: config.jwtExpire },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Delete any existing token for this user which is used
    await Token.deleteMany({ userId: user._id });

    // reset tokens for user
    const resetToken = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: config.resetPasswordExpire
    });

    // Save token to database
    await new Token({
      userId: user._id,
      token: resetToken
    }).save();

    // reset password
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // email sending
    const message = `
      <h1>You requested a password reset</h1>
      <p>Please go to this link to reset your password:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: message
      });

      res.json({ msg: 'Email sent' });
    } catch (err) {
      console.error(err);
      await Token.deleteMany({ userId: user._id });
      res.status(500).json({ msg: 'Email could not be sent' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    // Verify the token 
    const decoded = jwt.verify(token, config.jwtSecret);

    // Check if token exists in database
    const tokenDoc = await Token.findOne({
      token,
      userId: decoded.userId
    });

    if (!tokenDoc) {
      return res.status(400).json({ msg: 'Invalid token' });
    }

    // Update user password from database
    const user = await User.findById(decoded.userId);
    user.password = password;
    await user.save();

    // Delete token from database
    await Token.deleteMany({ userId: user._id });

    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;