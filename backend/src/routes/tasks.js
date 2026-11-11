const router = require('express').Router();
const db = require('../config/db');
const { cacheGet, cacheSet, cacheDelete } = require('../config/redis');
const { emit } = require('../socket');
const STATUSES = ['todo', 'in_progress', 'done'];
const CACHE_KEY = 'tasks:all';
const validId = value => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function validate(body, creation = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'JSON object required';
  if (creation && !has(body, 'title')) return 'Title is required';
  if (has(body, 'title') && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200)) return 'Title must be 1-200 non-whitespace characters';
  if (has(body, 'description') && body.description !== null && typeof body.description !== 'string') return 'Description must be text or null';
  if (has(body, 'status') && !STATUSES.includes(body.status)) return 'Status must be todo, in_progress, or done';
  if (!creation && !['title', 'description', 'status'].some(k => has(body, k))) return 'Provide at least one field to update';
  if (Object.keys(body).some(k => !['title', 'description', 'status'].includes(k))) return 'Unknown task field';
  return null;
}
router.get('/', async (req, res, next) => {
  try {
    const cached = await cacheGet(CACHE_KEY);
    if (cached !== null) { console.log('CACHE HIT'); res.set('X-Cache', 'HIT'); return res.json(JSON.parse(cached)); }
    console.log('CACHE MISS');
    const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at DESC, id DESC');
    await cacheSet(CACHE_KEY, JSON.stringify(rows));
    res.set('X-Cache', 'MISS'); res.json(rows);
  } catch (err) { next(err); }
});
router.get('/:id', async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
  try {
    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ error });
  const { title, description = null, status = 'todo' } = req.body;
  try {
    const { rows } = await db.query('INSERT INTO tasks (title, description, status) VALUES ($1, $2, $3) RETURNING *', [title.trim(), description, status]);
    await cacheDelete(CACHE_KEY); emit('task:created', rows[0]); res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});
router.put('/:id', async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const { rows } = await db.query(`UPDATE tasks SET title = COALESCE($2, title), description = CASE WHEN $3 THEN $4 ELSE description END, status = COALESCE($5, status), updated_at = NOW() WHERE id = $1 RETURNING *`, [req.params.id, has(req.body, 'title') ? req.body.title.trim() : null, has(req.body, 'description'), req.body.description ?? null, req.body.status ?? null]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    await cacheDelete(CACHE_KEY); emit('task:updated', rows[0]); res.json(rows[0]);
  } catch (err) { next(err); }
});
router.delete('/:id', async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid task id' });
  try {
    const { rows } = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    await cacheDelete(CACHE_KEY); emit('task:deleted', rows[0].id); res.json({ id: rows[0].id });
  } catch (err) { next(err); }
});
module.exports = router;
