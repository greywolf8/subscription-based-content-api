const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

class User {
  static async create(userData) {
    const { username, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `;
    
    const result = await db.query(query, [username, email, hashedPassword, 'free']);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, username, email, role, subscription_expires_at, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  static async upgradeToPremium(userId, durationDays = 30) {
    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setDate(subscriptionExpiresAt.getDate() + durationDays);
    
    const query = `
      UPDATE users 
      SET role = 'premium', subscription_expires_at = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email, role, subscription_expires_at
    `;
    
    const result = await db.query(query, [subscriptionExpiresAt, userId]);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT id, username, email, role, subscription_expires_at, created_at FROM users ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = User;
