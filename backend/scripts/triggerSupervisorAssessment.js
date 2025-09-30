// scripts/triggerSupervisorAssessment.js
// Script to manually trigger supervisor assessment for Employee 2

const { User, OnboardingProgress, OnboardingTask, UserTaskProgress, SupervisorAssessment } = require('../models');
const { sendNotification } = require('../utils/notificationHelper');
const { Op } = require('sequelize');

async function triggerSupervisorAssessment() {
  try {
    console.log('Starting supervisor assessment trigger script...');
    
    // Find Employee 2 by name (assuming this is the user)
    const employee = await User.findOne({
      where: { name: 'Employee 2' }
    });

    if (!employee) {
      console.log('Employee 2 not found. Please check the user name.');
      return;
    }

    console.log(`Found employee: ${employee.name} (ID: ${employee.id})`);

    // Check if they have a supervisor
    if (!employee.supervisorId) {
      console.log('Employee does not have a supervisor assigned.');
      return;
    }

    // Get their onboarding progress
    const onboardingProgress = await OnboardingProgress.findOne({
      where: { UserId: employee.id }
    });

    if (!onboardingProgress) {
      console.log('No onboarding progress found for employee.');
      return;
    }

    console.log(`Onboarding progress found. Current stage: ${onboardingProgress.stage}`);

    // Check if supervisor assessment already exists
    const existingAssessment = await SupervisorAssessment.findOne({
      where: { OnboardingProgressId: onboardingProgress.id }
    });

    if (existingAssessment) {
      console.log('Supervisor assessment already exists:', existingAssessment.status);
      return;
    }

    // Check if all Phase 1 tasks are completed
    const phase1Tasks = await OnboardingTask.findAll({
      where: { 
        stage: "phase_1",
        journeyType: { [Op.or]: [onboardingProgress.journeyType, "both"] }
      },
    });

    const userTaskProgress = await UserTaskProgress.findAll({
      where: { 
        UserId: employee.id,
        OnboardingTaskId: { [Op.in]: phase1Tasks.map(task => task.id) }
      },
    });

    const allTasksCompleted = phase1Tasks.length > 0 && 
      userTaskProgress.length === phase1Tasks.length &&
      userTaskProgress.every(task => task.isCompleted);

    console.log(`Phase 1 tasks: ${phase1Tasks.length}`);
    console.log(`User task progress: ${userTaskProgress.length}`);
    console.log(`All tasks completed: ${allTasksCompleted}`);

    if (allTasksCompleted) {
      // Create supervisor assessment
      const assessment = await SupervisorAssessment.create({
        OnboardingProgressId: onboardingProgress.id,
        UserId: employee.id,
        SupervisorId: employee.supervisorId,
        status: "pending_certificate",
        phase1CompletedDate: new Date(),
      });

      console.log(`Supervisor assessment created with ID: ${assessment.id}`);

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
        console.log('Notification sent to supervisor');
      } catch (notificationError) {
        console.error('Failed to send notification to supervisor:', notificationError);
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
        console.log('Notification sent to employee');
      } catch (notificationError) {
        console.error('Failed to send notification to employee:', notificationError);
      }

      console.log('Supervisor assessment successfully triggered!');
    } else {
      console.log('Not all Phase 1 tasks are completed. Cannot trigger assessment.');
    }

  } catch (error) {
    console.error('Error triggering supervisor assessment:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
triggerSupervisorAssessment(); 