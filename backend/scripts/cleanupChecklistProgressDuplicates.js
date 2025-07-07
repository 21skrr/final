// This script removes duplicate ChecklistProgress records for each (userId, checklistItemId) pair, keeping only the most recently updated one.
const { ChecklistProgress } = require('../models');
const sequelize = require('../config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');
    // Find all duplicates
    const [results] = await sequelize.query(`
      SELECT userId, checklistItemId, COUNT(*) as cnt
      FROM checklistprogresses
      GROUP BY userId, checklistItemId
      HAVING cnt > 1
    `);
    let deletedCount = 0;
    for (const row of results) {
      const { userId, checklistItemId } = row;
      // Find all progress records for this pair, order by updatedAt DESC
      const records = await ChecklistProgress.findAll({
        where: { userId, checklistItemId },
        order: [["updatedAt", "DESC"]],
      });
      // Keep the first (most recent), delete the rest
      const toDelete = records.slice(1);
      for (const rec of toDelete) {
        await rec.destroy();
        deletedCount++;
      }
    }
    console.log(`ChecklistProgress duplicates deleted: ${deletedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning up duplicates:', err);
    process.exit(1);
  }
})(); 