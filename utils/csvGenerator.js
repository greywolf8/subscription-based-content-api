const fs = require('fs');
const path = require('path');

class CSVGenerator {
  static generateMonthlyUsageReport(data, year, month) {
    const headers = [
      'User ID',
      'Username', 
      'Email',
      'Content ID',
      'Content Title',
      'Action',
      'Access Date',
      'IP Address'
    ];

    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
      const csvRow = [
        row.user_id || '',
        `"${(row.username || '').replace(/"/g, '""')}"`,
        `"${(row.email || '').replace(/"/g, '""')}"`,
        row.content_id || '',
        `"${(row.content_title || '').replace(/"/g, '""')}"`,
        row.action || '',
        row.created_at || '',
        row.ip_address || ''
      ];
      csvContent += csvRow.join(',') + '\n';
    });

    const fileName = `usage_report_${year}_${String(month).padStart(2, '0')}.csv`;
    const filePath = path.join(__dirname, '../reports', fileName);

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }

  static generateUserActivityReport(data, userId, year, month) {
    const headers = [
      'Content ID',
      'Content Title',
      'Action',
      'Access Date',
      'IP Address',
      'User Agent'
    ];

    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
      const csvRow = [
        row.content_id || '',
        `"${(row.content_title || '').replace(/"/g, '""')}"`,
        row.action || '',
        row.created_at || '',
        row.ip_address || '',
        `"${(row.user_agent || '').replace(/"/g, '""')}"`
      ];
      csvContent += csvRow.join(',') + '\n';
    });

    const fileName = `user_${userId}_activity_${year}_${String(month).padStart(2, '0')}.csv`;
    const filePath = path.join(__dirname, '../reports', fileName);

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }

  static generatePremiumContentReport(data, year, month) {
    const headers = [
      'Content ID',
      'Content Title',
      'Total Accesses',
      'Unique Users',
      'First Access',
      'Last Access'
    ];

    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
      const csvRow = [
        row.content_id || '',
        `"${(row.content_title || '').replace(/"/g, '""')}"`,
        row.total_accesses || 0,
        row.unique_users || 0,
        row.first_access || '',
        row.last_access || ''
      ];
      csvContent += csvRow.join(',') + '\n';
    });

    const fileName = `premium_content_${year}_${String(month).padStart(2, '0')}.csv`;
    const filePath = path.join(__dirname, '../reports', fileName);

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }
}

module.exports = CSVGenerator;
