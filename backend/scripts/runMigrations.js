const { sequelize } = require("../models");
const addPhaseToChecklistItems = require("../migrations/add-phase-to-checklist-items");

async function runMigrations() {
  try {
    console.log("Running migrations...");

    console.log("Adding phase to ChecklistItems...");
    await addPhaseToChecklistItems.up(
      sequelize.getQueryInterface(),
      sequelize.Sequelize
    );

    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
  } finally {
    process.exit();
  }
}

// Run migrations
runMigrations();
