const cron = require("node-cron");
const { User, Notification, Feedback, Event, EventParticipant } = require("./models");
const { Op } = require("sequelize");

// Helper: Calculate months between two dates
function monthsBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d2.getFullYear() * 12 +
    d2.getMonth() -
    (d1.getFullYear() * 12 + d1.getMonth())
  );
}

// Feedback reminder logic
async function sendFeedbackReminders() {
  const users = await User.findAll({ where: { role: "employee" } });
  const today = new Date();
  for (const user of users) {
    if (!user.startDate) continue;
    const months = monthsBetween(user.startDate, today);
    let dueType = null;
    if (months === 3) dueType = "3-month";
    if (months === 6) dueType = "6-month";
    if (months === 12) dueType = "12-month";
    if (!dueType) continue;
    // Check if feedback already exists
    const existing = await Feedback.findOne({
      where: { employeeId: user.id, type: dueType },
    });
    if (!existing) {
      await Notification.create({
        userId: user.id,
        type: "feedback",
        message: `Please complete your ${dueType} feedback survey.`,
      });
    }
  }
}

// Trial period reminder logic (assume 3-month trial)
async function sendTrialReminders() {
  const users = await User.findAll({ where: { role: "employee" } });
  const today = new Date();
  for (const user of users) {
    if (!user.startDate) continue;
    const trialEnd = new Date(user.startDate);
    trialEnd.setMonth(trialEnd.getMonth() + 3);
    const diffDays = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 7) {
      // Notify HR and manager
      const hrUsers = await User.findAll({ where: { role: "rh" } });
      const manager = user.managerId
        ? await User.findByPk(user.managerId)
        : null;
      for (const hr of hrUsers) {
        await Notification.create({
          userId: hr.id,
          type: "trial",
          message: `Trial period for ${user.name} ends in 1 week.`,
        });
      }
      if (manager) {
        await Notification.create({
          userId: manager.id,
          type: "trial",
          message: `Trial period for ${user.name} ends in 1 week.`,
        });
      }
    }
  }
}

// Event day notification logic
async function sendEventDayNotifications() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  try {
    // Find events that start today
    const eventsToday = await Event.findAll({
      where: {
        startDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        {
          model: EventParticipant,
          as: "participants",
          attributes: ["id", "eventId", "userId"],
          include: [
            {
              model: User,
              as: "participant",
              attributes: ["id", "name", "email"]
            }
          ]
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"]
        }
      ]
    });

    for (const event of eventsToday) {
      // Get all users to notify everyone about today's events
      const allUsers = await User.findAll({
        attributes: ['id', 'name', 'email']
      });

      // Notify all users about the event
      for (const user of allUsers) {
        await Notification.create({
          userId: user.id,
          type: "reminder",
          title: "Event Today",
          message: `There is an event "${event.title}" today at ${new Date(event.startDate).toLocaleTimeString()}. Location: ${event.location || 'TBD'}`,
          metadata: {
            eventId: event.id,
            eventTitle: event.title,
            eventStartDate: event.startDate,
            eventLocation: event.location
          }
        });
      }
    }

    if (eventsToday.length > 0) {
      console.log(`Event day notifications sent for ${eventsToday.length} events.`);
    }
  } catch (error) {
    console.error("Error sending event day notifications:", error);
  }
}

// Event starting soon notification logic (for events starting in the next hour)
async function sendEventStartingSoonNotifications() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  try {
    // Find events that start within the next hour
    const eventsStartingSoon = await Event.findAll({
      where: {
        startDate: {
          [Op.between]: [now, oneHourFromNow]
        }
      },
      include: [
        {
          model: EventParticipant,
          as: "participants",
          attributes: ["id", "eventId", "userId"],
          include: [
            {
              model: User,
              as: "participant",
              attributes: ["id", "name", "email"]
            }
          ]
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"]
        }
      ]
    });

    for (const event of eventsStartingSoon) {
      const timeUntilEvent = Math.round((new Date(event.startDate) - now) / (1000 * 60));
      
      // Get all users to notify everyone about events starting soon
      const allUsers = await User.findAll({
        attributes: ['id', 'name', 'email']
      });

      // Notify all users about the event starting soon
      for (const user of allUsers) {
        await Notification.create({
          userId: user.id,
          type: "reminder",
          title: "Event Starting Soon",
          message: `Event "${event.title}" starts in ${timeUntilEvent} minutes at ${new Date(event.startDate).toLocaleTimeString()}. Location: ${event.location || 'TBD'}`,
          metadata: {
            eventId: event.id,
            eventTitle: event.title,
            eventStartDate: event.startDate,
            eventLocation: event.location,
            minutesUntilStart: timeUntilEvent
          }
        });
      }
    }

    if (eventsStartingSoon.length > 0) {
      console.log(`Event starting soon notifications sent for ${eventsStartingSoon.length} events.`);
    }
  } catch (error) {
    console.error("Error sending event starting soon notifications:", error);
  }
}

// Schedule: run every day at 7am for daily reminders
cron.schedule("0 7 * * *", async () => {
  await sendFeedbackReminders();
  await sendTrialReminders();
  await sendEventDayNotifications();
  console.log("Daily automated reminders sent.");
});

// Schedule: run every 30 minutes to check for events starting soon
cron.schedule("*/30 * * * *", async () => {
  await sendEventStartingSoonNotifications();
});

// Export functions for manual testing
module.exports = {
  sendEventDayNotifications,
  sendEventStartingSoonNotifications,
  sendFeedbackReminders,
  sendTrialReminders
};
