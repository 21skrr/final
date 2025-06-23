// Check the IDs in the checklistitems table
const { sequelize } = require('./models');

async function checkIds() {
  try {
    console.log('Getting sample IDs from the checklistitems table...');
    
    const items = await sequelize.query(
      'SELECT id FROM checklistitems LIMIT 5',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Sample IDs:', items.map(item => item.id));
    
    // Check if the item with this specific ID exists
    const targetId = '1c1678d4-2788-405f-8900-81c2c1adb301';
    
    const specificItem = await sequelize.query(
      'SELECT * FROM checklistitems WHERE id = :id',
      { 
        replacements: { id: targetId },
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    if (specificItem && specificItem.length > 0) {
      console.log('Item found:', specificItem[0]);
    } else {
      console.log('Item not found with ID:', targetId);
      
      // Try a case-insensitive match
      const caseInsensitiveItems = await sequelize.query(
        'SELECT * FROM checklistitems WHERE LOWER(id) = LOWER(:id)',
        { 
          replacements: { id: targetId },
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      if (caseInsensitiveItems && caseInsensitiveItems.length > 0) {
        console.log('Found with case-insensitive match:', caseInsensitiveItems[0]);
      } else {
        console.log('No case-insensitive match found either');
      }
    }
    
    // Close the connection
    await sequelize.close();
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
checkIds(); 