// This script deletes all ChecklistProgress records and re-creates them for every assigned checklist and user.
const { ChecklistCombined, ChecklistItem, ChecklistProgress } = require('../models');
const sequelize = require('../config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');
    // Delete all progress records
    await ChecklistProgress.destroy({ where: {}, truncate: true });
    console.log('All ChecklistProgress records deleted.');
    let createdCount = 0;
    const assignments = await ChecklistCombined.findAll();
    for (const assignment of assignments) {
      const items = await ChecklistItem.findAll({ where: { checklistId: assignment.checklistId } });
      for (const item of items) {
        const progress = await ChecklistProgress.create({
          userId: assignment.userId,
          checklistItemId: item.id,
          isCompleted: false,
          notes: '',
          verificationStatus: 'pending',
        });
        createdCount++;
      }
    }
    console.log(`ChecklistProgress records created: ${createdCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Error fixing checklist progress:', err);
    process.exit(1);
  }
})(); 