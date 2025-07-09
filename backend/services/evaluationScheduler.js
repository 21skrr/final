const { User, Evaluation } = require('../models');
const moment = require('moment');

async function autoScheduleEvaluations(type = '3-month') {
  let months = 3;
  if (type === '6-month') months = 6;
  if (type === '12-month') months = 12;

  const employees = await User.findAll({ where: { role: 'employee' } });

  for (const emp of employees) {
    if (!emp.startDate || !emp.supervisorId) continue;

    const dueDate = moment(emp.startDate).add(months, 'months');
    const now = moment();

    if (now.isAfter(dueDate)) {
      const existing = await Evaluation.findOne({
        where: { employeeId: emp.id, type }
      });
      if (!existing) {
        await Evaluation.create({
          employeeId: emp.id,
          evaluatorId: emp.supervisorId,
          type,
          dueDate: dueDate.toDate(),
          status: 'pending',
          title: `${months}-Month Evaluation`
        });
        console.log(`Scheduled ${months}-month evaluation for ${emp.name}`);
      }
    }
  }
}

module.exports = { autoScheduleEvaluations }; 