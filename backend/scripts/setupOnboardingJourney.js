const { User, OnboardingProgress, sequelize } = require('../models');

async function setupOnboardingJourney() {
  try {
    console.log('Starting onboarding journey setup...');
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'name', 'startDate']
    });
    
    console.log(`Found ${users.length} users to check for onboarding progress`);
    
    // For each user, create onboarding progress if it doesn't exist
    let created = 0;
    for (const user of users) {
      const existingProgress = await OnboardingProgress.findOne({
        where: { UserId: user.id }  // Changed from 'userId' to 'UserId'
      });
      
      if (!existingProgress) {
        // Create onboarding progress with default values
        await OnboardingProgress.create({
          UserId: user.id,  // Changed from 'userId' to 'UserId'
          stage: 'prepare',
          progress: 0,
          stageStartDate: user.startDate || new Date(),
          estimatedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        });
        created++;
      }
    }
    
    console.log(`Created ${created} new onboarding progress records`);
    console.log('Onboarding journey setup completed successfully.');
  } catch (error) {
    console.error('Error setting up onboarding journey:', error);
  } finally {
    process.exit();
  }
}

// Run the setup function
setupOnboardingJourney();