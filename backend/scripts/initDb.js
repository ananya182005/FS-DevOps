require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
(async () => {
  try { await db.query(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8')); console.log('Database initialized'); }
  catch (err) { console.error('Database initialization failed:', err.message); process.exitCode = 1; }
  finally { await db.end(); }
})();
