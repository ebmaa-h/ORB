const receptionWorkflow = require("./receptionWorkflow");

module.exports = function registerSockets(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // attach workflow handlers
    receptionWorkflow(io, socket);

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};
