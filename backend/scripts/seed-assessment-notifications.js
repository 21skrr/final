/**
 * Script to seed missing assessment notifications for HR and Supervisors.
 * Run once: node scripts/seed-assessment-notifications.js
 */
const { SupervisorAssessment, User, Notification } = require('../models');
const { Op } = require('sequelize');
const { sendNotification } = require('../utils/notificationHelper');

async function run() {
  console.log('=== Seeding missing assessment notifications ===\n');
  let total = 0;

  // ---------- HR: assessments awaiting HR approval ----------
  const hrPending = await SupervisorAssessment.findAll({
    where: { status: 'hr_approval_pending' },
    include: [{ model: User, as: 'employee', attributes: ['id', 'name'] }],
  });
  console.log(`Found ${hrPending.length} assessment(s) pending HR approval`);

  const hrUsers = await User.findAll({ where: { role: 'hr' } });
  for (const hr of hrUsers) {
    for (const assessment of hrPending) {
      const employeeName = assessment.employee ? assessment.employee.name : 'an employee';
      const existing = await Notification.findOne({
        where: {
          userId: hr.id,
          type: 'system_alert',
          title: 'HR Approval Required',
          createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!existing) {
        await sendNotification({
          userId: hr.id,
          type: 'system_alert',
          title: 'HR Approval Required',
          message: `Supervisor assessment for ${employeeName} is waiting for your approval.`,
          metadata: { assessmentId: assessment.id },
        });
        console.log(`  Created HR notification for ${hr.name} -> ${employeeName}`);
        total++;
      } else {
        console.log(`  Skipped (recent dupe) HR notification for ${hr.name} -> ${employeeName}`);
      }
    }
  }

  // ---------- Supervisors: assessments needing their action ----------
  const supervisorPending = await SupervisorAssessment.findAll({
    where: {
      status: { [Op.in]: ['pending_certificate', 'certificate_uploaded', 'assessment_completed'] },
    },
    include: [
      { model: User, as: 'employee', attributes: ['id', 'name'] },
      { model: User, as: 'supervisor', attributes: ['id', 'name'] },
    ],
  });
  console.log(`\nFound ${supervisorPending.length} assessment(s) pending supervisor action`);

  for (const assessment of supervisorPending) {
    if (!assessment.SupervisorId) continue;
    const supervisorName = assessment.supervisor ? assessment.supervisor.name : 'Unknown';
    const employeeName = assessment.employee ? assessment.employee.name : 'an employee';
    const actionLabel =
      assessment.status === 'pending_certificate' ? 'upload the certificate' :
      assessment.status === 'certificate_uploaded' ? 'conduct the assessment' :
      'make a decision';

    const existing = await Notification.findOne({
      where: {
        userId: assessment.SupervisorId,
        type: 'system_alert',
        title: 'Assessment Action Required',
        createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (!existing) {
      await sendNotification({
        userId: assessment.SupervisorId,
        type: 'system_alert',
        title: 'Assessment Action Required',
        message: `${employeeName} is waiting for you to ${actionLabel}.`,
        metadata: { assessmentId: assessment.id },
      });
      console.log(`  Created supervisor notification for ${supervisorName} -> ${employeeName} (${actionLabel})`);
      total++;
    } else {
      console.log(`  Skipped (recent dupe) supervisor notification for ${supervisorName} -> ${employeeName}`);
    }
  }

  console.log(`\n=== Done. Created ${total} notification(s) ===`);
  process.exit(0);
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
