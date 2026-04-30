/**
 * Migration: Add frequency & recurrence fields to Checklists and ChecklistProgress
 * Run: node scripts/add-checklist-recurrence.js
 */
const sequelize = require('../config/database');

async function run() {
  console.log('=== Adding recurrence fields to Checklists ===\n');

  // --- Checklists table ---
  const [checklistCols] = await sequelize.query("SHOW COLUMNS FROM `Checklists`");
  const checklistColNames = checklistCols.map(c => c.Field);

  if (!checklistColNames.includes('frequency')) {
    await sequelize.query(`
      ALTER TABLE \`Checklists\`
      ADD COLUMN \`frequency\` ENUM('none','daily','weekly','monthly') NOT NULL DEFAULT 'none'
    `);
    console.log('✓ Added frequency to Checklists');
  } else {
    console.log('- frequency already exists in Checklists');
  }

  if (!checklistColNames.includes('targetRole')) {
    await sequelize.query(`
      ALTER TABLE \`Checklists\`
      ADD COLUMN \`targetRole\` ENUM('employee','team','department','all') NOT NULL DEFAULT 'all'
    `);
    console.log('✓ Added targetRole to Checklists');
  } else {
    console.log('- targetRole already exists in Checklists');
  }

  if (!checklistColNames.includes('department')) {
    await sequelize.query(`
      ALTER TABLE \`Checklists\`
      ADD COLUMN \`department\` VARCHAR(255) NULL DEFAULT NULL
    `);
    console.log('✓ Added department to Checklists');
  } else {
    console.log('- department already exists in Checklists');
  }

  if (!checklistColNames.includes('isActive')) {
    await sequelize.query(`
      ALTER TABLE \`Checklists\`
      ADD COLUMN \`isActive\` TINYINT(1) NOT NULL DEFAULT 1
    `);
    console.log('✓ Added isActive to Checklists');
  } else {
    console.log('- isActive already exists in Checklists');
  }

  // --- ChecklistProgress table ---
  console.log('\n=== Adding periodKey to checklistprogresses ===\n');
  const [progressCols] = await sequelize.query("SHOW COLUMNS FROM `checklistprogresses`");
  const progressColNames = progressCols.map(c => c.Field);

  if (!progressColNames.includes('periodKey')) {
    await sequelize.query(`
      ALTER TABLE \`checklistprogresses\`
      ADD COLUMN \`periodKey\` VARCHAR(20) NULL DEFAULT NULL
      COMMENT 'e.g. 2026-04-29 (daily), 2026-W17 (weekly), 2026-04 (monthly), NULL (no recurrence)'
    `);
    console.log('✓ Added periodKey to checklistprogresses');
  } else {
    console.log('- periodKey already exists in checklistprogresses');
  }

  // Also update the checklist_combined view columns if the table exists
  try {
    const [combinedCols] = await sequelize.query("SHOW COLUMNS FROM `checklist_combined`");
    const combinedColNames = combinedCols.map(c => c.Field);
    if (!combinedColNames.includes('frequency')) {
      await sequelize.query(`
        ALTER TABLE \`checklist_combined\`
        ADD COLUMN \`frequency\` ENUM('none','daily','weekly','monthly') NOT NULL DEFAULT 'none'
      `);
      console.log('✓ Added frequency to checklist_combined');
    }
  } catch (e) {
    console.log('- checklist_combined not found or not a table, skipping');
  }

  console.log('\n=== Migration complete ===');
  process.exit(0);
}

run().catch(e => {
  console.error('Migration error:', e.message);
  process.exit(1);
});
