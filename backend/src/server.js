const http = require('http');
const app = require('./app');
const { attachSocket } = require('./socket');
const { connectRedis } = require('./config/redis');
const server = http.createServer(app);
attachSocket(server);
if (require.main === module) {
  connectRedis(); // Redis is optional: API reads still use PostgreSQL if it is down.
  server.listen(Number(process.env.PORT || 4000), () => console.log(`Server running on http://localhost:${process.env.PORT || 4000}`));
}
module.exports = server;
