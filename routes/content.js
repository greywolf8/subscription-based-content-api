const express = require('express');
const Content = require('../models/Content');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, requirePremium } = require('../middleware/auth');
const { validate, contentSchema } = require('../middleware/validation');
const router = express.Router();

router.get('/free', async (req, res) => {
  try {
    const content = await Content.getFreeContent();
    res.json({
      message: 'Free content retrieved successfully',
      count: content.length,
      data: content
    });
  } catch (error) {
    console.error('Error fetching free content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/premium', authenticateToken, requirePremium, async (req, res) => {
  try {
    const content = await Content.getPremiumContent();
    
    await ActivityLog.create({
      user_id: req.user.id,
      content_id: null,
      action: 'premium_content_list_access',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      message: 'Premium content retrieved successfully',
      count: content.length,
      data: content
    });
  } catch (error) {
    console.error('Error fetching premium content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.getById(id);

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.is_premium) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          error: 'Access token required',
          message: 'This content is only available to premium subscribers'
        });
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const User = require('../models/User');
      const user = await User.findById(decoded.userId);
      
      if (!user || user.role !== 'premium') {
        return res.status(403).json({ 
          error: 'Premium subscription required',
          message: 'This content is only available to premium subscribers'
        });
      }

      await ActivityLog.create({
        user_id: user.id,
        content_id: content.id,
        action: 'premium_content_access',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    }

    res.json({
      message: 'Content retrieved successfully',
      data: content
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const content = await Content.getAll();
    res.json({
      message: 'All content retrieved successfully',
      count: content.length,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, validate(contentSchema), async (req, res) => {
  try {
    const { title, body, is_premium } = req.body;
    
    const newContent = await Content.create({ title, body, is_premium });

    await ActivityLog.create({
      user_id: req.user.id,
      content_id: newContent.id,
      action: 'content_created',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'Content created successfully',
      data: newContent
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
