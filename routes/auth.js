const express = require('express');
const User = require('../models/User');
const { validate, userRegistrationSchema, userLoginSchema } = require('../middleware/validation');
const router = express.Router();

router.post('/register', validate(userRegistrationSchema), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const newUser = await User.create({ username, email, password });
    const token = User.generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', validate(userLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = User.generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscription_expires_at: user.subscription_expires_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/upgrade', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    if (user.role === 'premium') {
      return res.status(400).json({ error: 'User already has premium subscription' });
    }

    const paymentSuccessful = Math.random() > 0.1;
    
    if (!paymentSuccessful) {
      return res.status(402).json({ error: 'Payment failed' });
    }

    const updatedUser = await User.upgradeToPremium(user.id);
    const newToken = User.generateToken(updatedUser);

    res.json({
      message: 'Subscription upgraded successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        subscription_expires_at: updatedUser.subscription_expires_at
      },
      token: newToken
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
