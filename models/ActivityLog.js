const db = require('../config/database');

class ActivityLog {
  static async create(logData) {
    const { user_id, content_id, action, ip_address, user_agent } = logData;
    
    const query = `
      INSERT INTO activity_logs (user_id, content_id, action, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [user_id, content_id, action, ip_address, user_agent]);
    return result.rows[0];
  }

  static async getByUserId(userId, limit = 50) {
    const query = `
      SELECT al.*, c.title as content_title, u.username
      FROM activity_logs al
      LEFT JOIN content c ON al.content_id = c.id
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2
    `;
    
    const result = await db.query(query, [userId, limit]);
    return result.rows;
  }

  static async getAll(limit = 100) {
    const query = `
      SELECT al.*, c.title as content_title, u.username
      FROM activity_logs al
      LEFT JOIN content c ON al.content_id = c.id
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    return result.rows;
  }

  static async getPremiumAccessLogs(limit = 100) {
    const query = `
      SELECT al.*, c.title as content_title, u.username
      FROM activity_logs al
      LEFT JOIN content c ON al.content_id = c.id
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action = 'premium_content_access'
      ORDER BY al.created_at DESC
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    return result.rows;
  }

  static async getAccessStats() {
    const query = `
      SELECT 
        COUNT(*) as total_accesses,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT content_id) as unique_content,
        COUNT(CASE WHEN action = 'premium_content_access' THEN 1 END) as premium_accesses
      FROM activity_logs
    `;
    
    const result = await db.query(query);
    return result.rows[0];
  }

  static async getMonthlyActivity(year, month) {
    const query = `
      SELECT al.*, u.username, u.email, c.title as content_title
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN content c ON al.content_id = c.id
      WHERE EXTRACT(YEAR FROM al.created_at) = $1 
        AND EXTRACT(MONTH FROM al.created_at) = $2
      ORDER BY al.created_at DESC
    `;
    
    const result = await db.query(query, [year, month]);
    return result.rows;
  }

  static async getUserMonthlyActivity(userId, year, month) {
    const query = `
      SELECT al.*, c.title as content_title
      FROM activity_logs al
      LEFT JOIN content c ON al.content_id = c.id
      WHERE al.user_id = $1 
        AND EXTRACT(YEAR FROM al.created_at) = $2 
        AND EXTRACT(MONTH FROM al.created_at) = $3
      ORDER BY al.created_at DESC
    `;
    
    const result = await db.query(query, [userId, year, month]);
    return result.rows;
  }

  static async getPremiumContentStats(year, month) {
    const query = `
      SELECT 
        c.id as content_id,
        c.title as content_title,
        COUNT(al.id) as total_accesses,
        COUNT(DISTINCT al.user_id) as unique_users,
        MIN(al.created_at) as first_access,
        MAX(al.created_at) as last_access
      FROM content c
      LEFT JOIN activity_logs al ON c.id = al.content_id 
        AND EXTRACT(YEAR FROM al.created_at) = $1 
        AND EXTRACT(MONTH FROM al.created_at) = $2
      WHERE c.is_premium = true
      GROUP BY c.id, c.title
      ORDER BY total_accesses DESC
    `;
    
    const result = await db.query(query, [year, month]);
    return result.rows;
  }
}

module.exports = ActivityLog;
