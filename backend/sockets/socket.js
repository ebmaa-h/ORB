let io;

function init(server) {
  io = require('socket.io')(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://167.99.196.172', 'http://orb.ebmaa.co.za'],
      methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT'],
      credentials: true,
    },
  });
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}

module.exports = { init, getIO };
