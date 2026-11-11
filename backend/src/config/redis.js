require('dotenv').config();
const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379', socket: { reconnectStrategy: retries => Math.min(retries * 200, 3000) } });
client.on('error', err => { if (!client.isOpen) console.warn('Redis unavailable:', err.message); });
let connecting;
async function connectRedis() {
  if (client.isOpen) return;
  if (!connecting) connecting = client.connect().catch(err => console.warn('Redis unavailable; using PostgreSQL:', err.message)).finally(() => { connecting = null; });
  await connecting;
}
async function cacheGet(key) {
  if (!client.isReady) return null;
  try { return await client.get(key); } catch (err) { console.warn('Redis read failed:', err.message); return null; }
}
async function cacheSet(key, value) {
  if (!client.isReady) return;
  try { await client.set(key, value, { EX: 60 }); } catch (err) { console.warn('Redis write failed:', err.message); }
}
async function cacheDelete(key) {
  if (!client.isReady) return;
  try { await client.del(key); } catch (err) { console.warn('Redis invalidate failed:', err.message); }
}
module.exports = { client, connectRedis, cacheGet, cacheSet, cacheDelete };
