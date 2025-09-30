// scripts/fixMissingSupervisorAssessments.js
// Script to retroactively create supervisor assessments for all employees who completed Phase 1

const { User, OnboardingProgress, OnboardingTask, UserTaskProgress, SupervisorAssessment } = require('../models');
const { sendNotification } = require('../utils/notificationHelper');
const { Op } = require('sequelize');

async function fixMissingSupervisorAssessments() {
  try {
    console.log('Starting to fix missing supervisor assessments...');
    
    // Get all users who are employees
    const employees = await User.findAll({
      where: { 
        role: 'employee',
        deletedAt: null // Only active employees
      }
    });

    console.log(`Found ${employees.length} employees`);

    let assessmentsCreated = 0;
    let assessmentsSkipped = 0;
    let errors = 0;

    for (const employee of employees) {
      try {
        console.log(`\nProcessing employee: ${employee.name} (ID: ${employee.id})`);
        
        // Check if they have a supervisor
        if (!employee.supervisorId) {
          console.log(`  - No supervisor assigned, skipping`);
          continue;
        }

        // Get their onboarding progress
        const onboardingProgress = await OnboardingProgress.findOne({
          where: { UserId: employee.id }
        });

        if (!onboardingProgress) {
          console.log(`  - No onboarding progress found, skipping`);
          continue;
        }

        console.log(`  - Onboarding stage: ${onboardingProgress.stage}`);

        // Check if supervisor assessment already exists
        const existingAssessment = await SupervisorAssessment.findOne({
          where: { OnboardingProgressId: onboardingProgress.id }
        });

        if (existingAssessment) {
          console.log(`  - Supervisor assessment already exists (status: ${existingAssessment.status}), skipping`);
          assessmentsSkipped++;
          continue;
        }

        // Check if Phase 1 is completed using the NEW system (phase_1 stage)
        let phase1Completed = false;
        
        if (onboardingProgress.stage === "phase_1" || onboardingProgress.stage === "phase_2") {
          // New system - check phase_1 tasks
          const phase1Tasks = await OnboardingTask.findAll({
            where: { 
              stage: "phase_1",
              journeyType: { [Op.or]: [onboardingProgress.journeyType, "both"] }
            },
          });

          if (phase1Tasks.length > 0) {
            const userTaskProgress = await UserTaskProgress.findAll({
              where: { 
                UserId: employee.id,
                OnboardingTaskId: { [Op.in]: phase1Tasks.map(task => task.id) }
              },
            });

            phase1Completed = phase1Tasks.length > 0 && 
              userTaskProgress.length === phase1Tasks.length &&
              userTaskProgress.every(task => task.isCompleted);

            console.log(`  - New system - Phase 1 tasks: ${phase1Tasks.length}, User progress: ${userTaskProgress.length}, All completed: ${phase1Completed}`);
          }
        } else {
          // Legacy system - check orient, land, integrate, excel progress
          const orientCompleted = onboardingProgress.orientProgress >= 100;
          const landCompleted = onboardingProgress.landProgress >= 100;
          const integrateCompleted = onboardingProgress.integrateProgress >= 100;
          const excelCompleted = onboardingProgress.excelProgress >= 100;
          
          // Consider Phase 1 completed if orient and land are both 100%
          phase1Completed = orientCompleted && landCompleted;
          
          console.log(`  - Legacy system - Orient: ${onboardingProgress.orientProgress}%, Land: ${onboardingProgress.landProgress}%, Integrate: ${onboardingProgress.integrateProgress}%, Excel: ${onboardingProgress.excelProgress}%`);
          console.log(`  - Legacy system - Phase 1 completed (orient + land): ${phase1Completed}`);
        }

        if (phase1Completed) {
          // Create supervisor assessment
          const assessment = await SupervisorAssessment.create({
            OnboardingProgressId: onboardingProgress.id,
            UserId: employee.id,
            SupervisorId: employee.supervisorId,
            status: "pending_certificate",
            phase1CompletedDate: new Date(),
          });

          console.log(`  - ✓ Supervisor assessment created with ID: ${assessment.id}`);

          // Send notification to supervisor
          try {
            await sendNotification({
              userId: employee.supervisorId,
              type: 'supervisor_assessment_required',
              title: 'Supervisor Assessment Required',
              message: `${employee.name} has completed Phase 1 of onboarding and requires your assessment. Please review their progress and complete the assessment.`,
              metadata: {
                assessmentId: assessment.id,
                employeeId: employee.id,
                employeeName: employee.name,
                type: 'supervisor_assessment'
              }
            });
            console.log(`  - ✓ Notification sent to supervisor`);
          } catch (notificationError) {
            console.error(`  - ✗ Failed to send notification to supervisor:`, notificationError.message);
          }

          // Send notification to employee
          try {
            await sendNotification({
              userId: employee.id,
              type: 'assessment_pending',
              title: 'Assessment Pending',
              message: 'You have completed Phase 1! Your supervisor will now assess your progress before you can proceed to Phase 2.',
              metadata: {
                assessmentId: assessment.id,
                type: 'supervisor_assessment_pending'
              }
            });
            console.log(`  - ✓ Notification sent to employee`);
          } catch (notificationError) {
            console.error(`  - ✗ Failed to send notification to employee:`, notificationError.message);
          }

          assessmentsCreated++;
        } else {
          console.log(`  - Phase 1 not completed, skipping`);
        }

      } catch (employeeError) {
        console.error(`  - ✗ Error processing employee ${employee.name}:`, employeeError.message);
        errors++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total employees processed: ${employees.length}`);
    console.log(`Assessments created: ${assessmentsCreated}`);
    console.log(`Assessments skipped (already exist): ${assessmentsSkipped}`);
    console.log(`Errors: ${errors}`);

    if (assessmentsCreated > 0) {
      console.log(`\n✓ Successfully created ${assessmentsCreated} missing supervisor assessments!`);
    } else {
      console.log(`\nℹ No missing assessments found.`);
    }

  } catch (error) {
    console.error('Error in fixMissingSupervisorAssessments:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixMissingSupervisorAssessments(); 