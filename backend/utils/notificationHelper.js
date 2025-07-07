const { Notification, NotificationTemplate } = require('../models');

/**
 * Send a notification to a user, optionally using a template.
 * @param {Object} params
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.type - Notification type (e.g., 'reminder', 'feedback_available')
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message (can use template)
 * @param {Object} [params.metadata] - Optional metadata (JSON)
 * @param {string} [params.templateName] - Optional template name to use
 * @param {Object} [params.templateVars] - Optional variables for template interpolation
 */
async function sendNotification({ userId, type, title, message, metadata = {}, templateName, templateVars = {} }) {
  let finalTitle = title;
  let finalMessage = message;

  // If a template is specified, fetch and interpolate
  if (templateName) {
    const template = await NotificationTemplate.findOne({ where: { name: templateName, type, isActive: true } });
    if (template) {
      finalTitle = interpolate(template.title, templateVars) || title;
      finalMessage = interpolate(template.message, templateVars) || message;
    }
  }

  return Notification.create({
    userId,
    type,
    title: finalTitle,
    message: finalMessage,
    metadata,
    isRead: false,
  });
}

// Simple string interpolation: replaces {{var}} with value from vars
function interpolate(str, vars) {
  if (!str) return str;
  return str.replace(/{{\s*(\w+)\s*}}/g, (_, key) => vars[key] || '');
}

module.exports = { sendNotification }; 