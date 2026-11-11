const { Server } = require('socket.io');
let io;
function attachSocket(server) {
  io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }, transports: ['websocket'] });
  io.on('connection', socket => {
    io.emit('users:count', io.engine.clientsCount);
    socket.on('disconnect', () => io.emit('users:count', io.engine.clientsCount));
  });
  return io;
}
function emit(event, payload) { if (io) io.emit(event, payload); }
module.exports = { attachSocket, emit };
