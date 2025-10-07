#!/usr/bin/env node

/**
 * Test script for event notifications
 * This script can be used to manually test the event notification functionality
 */

const { sendEventDayNotifications, sendEventStartingSoonNotifications } = require('../reminderScheduler');

async function testEventNotifications() {
  console.log('Testing event notifications...\n');
  
  try {
    console.log('1. Testing event day notifications...');
    await sendEventDayNotifications();
    console.log('✅ Event day notifications test completed\n');
    
    console.log('2. Testing event starting soon notifications...');
    await sendEventStartingSoonNotifications();
    console.log('✅ Event starting soon notifications test completed\n');
    
    console.log('🎉 All event notification tests completed successfully!');
  } catch (error) {
    console.error('❌ Error testing event notifications:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testEventNotifications()
    .then(() => {
      console.log('Test completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEventNotifications };
