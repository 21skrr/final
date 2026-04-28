const { Sequelize } = require('sequelize');
const config = require('../config/config.js');
const cfg = config.development;

const seq = new Sequelize(cfg.database, cfg.username, cfg.password, {
  host: cfg.host,
  dialect: cfg.dialect,
  logging: false,
});

seq.query('ALTER TABLE Evaluations ADD COLUMN employeeComment TEXT NULL AFTER comments')
  .then(() => {
    console.log('SUCCESS: employeeComment column added to Evaluations table');
    seq.close();
  })
  .catch(e => {
    if (e.message && e.message.includes('Duplicate column')) {
      console.log('Column already exists — OK, nothing to do.');
    } else {
      console.error('ERROR:', e.message);
    }
    seq.close();
  });
