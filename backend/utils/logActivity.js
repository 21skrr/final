const { ActivityLog } = require("../models");

const logActivity = async ({ userId, action, entityType, entityId, details, req }) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : null,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (error) {
    console.error("ActivityLog failed:", error.message);
  }
};

module.exports = logActivity;
