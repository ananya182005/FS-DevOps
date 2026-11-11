const request = require('supertest');
const { io: clientSocket } = require('socket.io-client');
const app = require('../src/app');
const db = require('../src/config/db');
const { client, connectRedis } = require('../src/config/redis');
const server = require('../src/server');
let baseURL, socket;
const created = [];
beforeAll(async () => {
  await db.query('SELECT 1');
  await connectRedis();
  await new Promise(resolve => server.listen(0, resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});
afterAll(async () => {
  if (socket) socket.disconnect();
  for (const id of created) await db.query('DELETE FROM tasks WHERE id=$1', [id]);
  await new Promise(resolve => server.close(resolve));
  if (client.isOpen) await client.quit();
  await db.end();
});
test('health check returns 200', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200); expect(res.body.db).toBe('up');
});
test('POST validates title and creates a task', async () => {
  expect((await request(app).post('/api/tasks').send({ description: 'no title' })).status).toBe(400);
  const res = await request(app).post('/api/tasks').send({ title: 'Test task' });
  expect(res.status).toBe(201); created.push(res.body.id);
});
test('GET list returns an array and second call is cached', async () => {
  const first = await request(app).get('/api/tasks');
  expect(first.status).toBe(200); expect(Array.isArray(first.body)).toBe(true);
  const second = await request(app).get('/api/tasks');
  if (client.isReady) expect(second.headers['x-cache']).toBe('HIT');
});
test('PUT validates status and updates task', async () => {
  const id = created[0];
  expect((await request(app).put(`/api/tasks/${id}`).send({ status: 'banana' })).status).toBe(400);
  const res = await request(app).put(`/api/tasks/${id}`).send({ status: 'done' });
  expect(res.status).toBe(200); expect(res.body.status).toBe('done');
});
test('DELETE removes a task', async () => {
  const res = await request(app).post('/api/tasks').send({ title: 'Delete me' });
  const id = res.body.id;
  expect((await request(app).delete(`/api/tasks/${id}`)).status).toBe(200);
  expect((await request(app).get(`/api/tasks/${id}`)).status).toBe(404);
});
test('WebSocket broadcasts task:created', async () => {
  socket = clientSocket(baseURL, { transports: ['websocket'], reconnection: false });
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  const event = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No task:created event')), 5000);
    socket.once('task:created', task => { clearTimeout(timer); resolve(task); });
  });
  const res = await request(app).post('/api/tasks').send({ title: 'Socket test' });
  created.push(res.body.id);
  expect((await event).id).toBe(res.body.id);
});
