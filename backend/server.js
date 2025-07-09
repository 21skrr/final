require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");
const cron = require('node-cron');
const { autoScheduleEvaluations } = require('./services/evaluationScheduler');
const { getSystemSetting } = require('./utils/systemSettingsService');

let evaluationCronJobs = {};

async function startEvaluationSchedulers() {
  const cron3 = (await getSystemSetting('evaluationAutomationCron_3month')) || '0 2 * * *';
  const cron6 = (await getSystemSetting('evaluationAutomationCron_6month')) || '0 3 * * *';
  const cron12 = (await getSystemSetting('evaluationAutomationCron_12month')) || '0 4 * * *';

  // Stop existing jobs
  Object.values(evaluationCronJobs).forEach(job => job.stop && job.stop());
  evaluationCronJobs = {};

  evaluationCronJobs['3month'] = cron.schedule(cron3, () => {
    console.log('Running auto-schedule 3-month evaluations...');
    autoScheduleEvaluations('3-month');
  });
  evaluationCronJobs['6month'] = cron.schedule(cron6, () => {
    console.log('Running auto-schedule 6-month evaluations...');
    autoScheduleEvaluations('6-month');
  });
  evaluationCronJobs['12month'] = cron.schedule(cron12, () => {
    console.log('Running auto-schedule 12-month evaluations...');
    autoScheduleEvaluations('12-month');
  });

  console.log('Evaluation automation scheduled:', { cron3, cron6, cron12 });
}

// Call on server start
startEvaluationSchedulers();

// Expose a way to restart the schedulers (for use in settings update controller)
module.exports.restartEvaluationSchedulers = startEvaluationSchedulers;

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Sync all models without modifying existing tables
    await sequelize.sync({ alter: false, force: false });
    console.log("Database synchronized successfully.");

    // Try to start server on PORT, if that fails try PORT + 1
    const server = app
      .listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
          app.listen(PORT + 1, () => {
            console.log(`Server is running on port ${PORT + 1}`);
          });
        } else {
          console.error("Server error:", err);
        }
      });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startServer();
