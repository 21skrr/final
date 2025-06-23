require('dotenv').config();
const sequelize = require('./config/database');

async function checkItem() {
  try {
    // Check in checklistitems table
    console.log('Checking checklistitems table...');
    const checklistItems = await sequelize.query(
      "SELECT * FROM checklistitems WHERE id = '1c1678d4-2788-405f-8900-81c2c1adb301'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (checklistItems.length > 0) {
      console.log('Item found in checklistitems:', JSON.stringify(checklistItems, null, 2));
    } else {
      console.log('Item not found in checklistitems table');
    }
    
    // Check if userchecklistitems exists and check there
    try {
      console.log('\nChecking userchecklistitems table...');
      const userChecklistItems = await sequelize.query(
        "SELECT * FROM userchecklistitems WHERE id = '1c1678d4-2788-405f-8900-81c2c1adb301'",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      if (userChecklistItems.length > 0) {
        console.log('Item found in userchecklistitems:', JSON.stringify(userChecklistItems, null, 2));
      } else {
        console.log('Item not found in userchecklistitems table');
      }
    } catch (error) {
      console.log('Error checking userchecklistitems (table might not exist):', error.message);
    }
    
    // Show schema of checklistitems table
    console.log('\nChecking schema of checklistitems table...');
    const checklistItemsSchema = await sequelize.query(
      "DESCRIBE checklistitems",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('checklistitems schema:', JSON.stringify(checklistItemsSchema, null, 2));
    
    // Show sample items from checklistitems
    console.log('\nSample items from checklistitems table:');
    const sampleItems = await sequelize.query(
      "SELECT * FROM checklistitems LIMIT 3",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(JSON.stringify(sampleItems, null, 2));
    
    // Close connection
    await sequelize.close();
    
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkItem(); 