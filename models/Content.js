const db = require('../config/database');

class Content {
  static async create(contentData) {
    const { title, body, is_premium } = contentData;
    
    const query = `
      INSERT INTO content (title, body, is_premium)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [title, body, is_premium]);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT * FROM content ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async getById(id) {
    const query = 'SELECT * FROM content WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async getFreeContent() {
    const query = 'SELECT * FROM content WHERE is_premium = false ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async getPremiumContent() {
    const query = 'SELECT * FROM content WHERE is_premium = true ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async update(id, contentData) {
    const { title, body, is_premium } = contentData;
    
    const query = `
      UPDATE content 
      SET title = $1, body = $2, is_premium = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [title, body, is_premium, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM content WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Content;
