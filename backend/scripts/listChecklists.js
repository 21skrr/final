const { Checklist, ChecklistItem, User, sequelize } = require('../models');

async function listChecklists() {
  try {
    console.log('Listing all checklists and their items...\n');
    
    const checklists = await Checklist.findAll({
      include: [
        {
          model: ChecklistItem,
          attributes: ['id', 'title', 'phase', 'orderIndex'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [
        ['createdAt', 'DESC'],
        [ChecklistItem, 'phase', 'ASC'],
        [ChecklistItem, 'orderIndex', 'ASC'],
      ],
    });
    
    if (checklists.length === 0) {
      console.log('No checklists found in the database.');
      return;
    }
    
    console.log(`Found ${checklists.length} checklists:\n`);
    
    // Display checklist details
    for (const checklist of checklists) {
      console.log(`===== CHECKLIST: ${checklist.title} =====`);
      console.log(`ID: ${checklist.id}`);
      console.log(`Description: ${checklist.description}`);
      console.log(`Created by: ${checklist.creator ? checklist.creator.name : 'Unknown'}`);
      console.log(`Program Type: ${checklist.programType}`);
      console.log(`Stage: ${checklist.stage}`);
      console.log(`Created: ${checklist.createdAt}`);
      
      if (!checklist.ChecklistItems || checklist.ChecklistItems.length === 0) {
        console.log('No items in this checklist.\n');
        continue;
      }
      
      console.log(`\nItems (${checklist.ChecklistItems.length}):`);
      
      // Group items by phase
      const itemsByPhase = {};
      
      for (const item of checklist.ChecklistItems) {
        if (!itemsByPhase[item.phase]) {
          itemsByPhase[item.phase] = [];
        }
        itemsByPhase[item.phase].push(item);
      }
      
      // Display items by phase
      for (const phase of ['prepare', 'orient', 'land', 'integrate', 'excel']) {
        if (itemsByPhase[phase] && itemsByPhase[phase].length > 0) {
          console.log(`\n  -- ${phase.toUpperCase()} PHASE: ${itemsByPhase[phase].length} items --`);
          
          for (const item of itemsByPhase[phase]) {
            console.log(`  [${item.orderIndex}] ${item.title}`);
          }
        }
      }
      
      console.log('\n');
    }
    
    console.log('Listing completed successfully.');
  } catch (error) {
    console.error('Error listing checklists:', error);
  } finally {
    process.exit();
  }
}

// Run the script
listChecklists(); 