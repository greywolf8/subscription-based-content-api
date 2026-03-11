const express = require('express');
const path = require('path');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const CSVGenerator = require('../utils/csvGenerator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await ActivityLog.getAll(parseInt(limit));
    
    res.json({
      message: 'Activity logs retrieved successfully',
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/logs/premium', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await ActivityLog.getPremiumAccessLogs(parseInt(limit));
    
    res.json({
      message: 'Premium access logs retrieved successfully',
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching premium logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await ActivityLog.getAccessStats();
    const users = await User.getAll();
    
    const premiumUsers = users.filter(user => user.role === 'premium').length;
    const freeUsers = users.filter(user => user.role === 'free').length;
    
    res.json({
      message: 'Statistics retrieved successfully',
      data: {
        ...stats,
        total_users: users.length,
        premium_users: premiumUsers,
        free_users: freeUsers
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    
    res.json({
      message: 'Users retrieved successfully',
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports/monthly/:year/:month', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month parameters' });
    }

    const activityData = await ActivityLog.getMonthlyActivity(yearNum, monthNum);
    
    if (activityData.length === 0) {
      return res.status(404).json({ error: 'No activity data found for the specified period' });
    }

    const filePath = CSVGenerator.generateMonthlyUsageReport(activityData, yearNum, monthNum);
    
    res.json({
      message: 'Monthly usage report generated successfully',
      year: yearNum,
      month: monthNum,
      file_path: filePath,
      records_count: activityData.length,
      download_url: `/admin/reports/download/${path.basename(filePath)}`
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports/user/:userId/:year/:month', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, year, month } = req.params;
    const userIdNum = parseInt(userId);
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(userIdNum) || isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const user = await User.findById(userIdNum);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activityData = await ActivityLog.getUserMonthlyActivity(userIdNum, yearNum, monthNum);
    
    if (activityData.length === 0) {
      return res.status(404).json({ error: 'No activity data found for this user in the specified period' });
    }

    const filePath = CSVGenerator.generateUserActivityReport(activityData, userIdNum, yearNum, monthNum);
    
    res.json({
      message: 'User activity report generated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      year: yearNum,
      month: monthNum,
      file_path: filePath,
      records_count: activityData.length,
      download_url: `/admin/reports/download/${path.basename(filePath)}`
    });
  } catch (error) {
    console.error('Error generating user report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports/premium-content/:year/:month', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month parameters' });
    }

    const contentData = await ActivityLog.getPremiumContentStats(yearNum, monthNum);
    
    if (contentData.length === 0) {
      return res.status(404).json({ error: 'No premium content data found for the specified period' });
    }

    const filePath = CSVGenerator.generatePremiumContentReport(contentData, yearNum, monthNum);
    
    res.json({
      message: 'Premium content report generated successfully',
      year: yearNum,
      month: monthNum,
      file_path: filePath,
      records_count: contentData.length,
      download_url: `/admin/reports/download/${path.basename(filePath)}`
    });
  } catch (error) {
    console.error('Error generating premium content report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports/download/:filename', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../reports', filename);

    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ error: 'Report file not found' });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reports/available', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const fs = require('fs');
    const reportsDir = path.join(__dirname, '../reports');
    
    if (!fs.existsSync(reportsDir)) {
      return res.json({
        message: 'No reports directory found',
        reports: []
      });
    }

    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => {
        const stats = fs.statSync(path.join(reportsDir, file));
        return {
          filename: file,
          size: stats.size,
          created_at: stats.birthtime,
          download_url: `/admin/reports/download/${file}`
        };
      })
      .sort((a, b) => b.created_at - a.created_at);

    res.json({
      message: 'Available reports retrieved successfully',
      count: files.length,
      reports: files
    });
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
