const { Op } = require('sequelize');
const ActivityLog = require('../models/ActivityLog');

// GET /api/activitylogs
// Query params: userId, action, entityType, dateFrom, dateTo, page, pageSize
exports.getActivityLogs = async (req, res) => {
  try {
    const { userId, action, entityType, dateFrom, dateTo, page = 1, pageSize = 20 } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(pageSize),
    });
    res.json({ total: count, results: rows });
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 