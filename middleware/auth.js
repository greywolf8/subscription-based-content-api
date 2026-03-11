const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userQuery = await db.query(
      'SELECT id, username, email, role, subscription_expires_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    const user = userQuery.rows[0];
    
    if (user.role === 'premium' && user.subscription_expires_at) {
      const now = new Date();
      const expiresAt = new Date(user.subscription_expires_at);
      
      if (now > expiresAt) {
        await db.query(
          'UPDATE users SET role = $1 WHERE id = $2',
          ['free', user.id]
        );
        user.role = 'free';
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'premium') {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      message: 'This content is only available to premium subscribers'
    });
  }

  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const isAdminByEmail = req.user.email === 'admin@example.com';
  const isAdminByRole = req.user.role === 'admin';

  if (!isAdminByEmail && !isAdminByRole) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requirePremium,
  requireAdmin
};
