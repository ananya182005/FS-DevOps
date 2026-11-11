require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const { client } = require('./config/redis');
const tasks = require('./routes/tasks');
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', exposedHeaders: ['X-Cache'] }));
app.use(express.json());
app.get('/api/health', async (req, res) => {
  let dbStatus = 'down';
  try { await db.query('SELECT 1'); dbStatus = 'up'; } catch (_) {}
  res.json({ status: 'ok', db: dbStatus, redis: client.isReady ? 'up' : 'down' });
});
app.use('/api/tasks', tasks);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) return res.status(400).json({ error: 'Invalid JSON' });
  console.error(err); res.status(500).json({ error: 'Internal server error' });
});
module.exports = app;
