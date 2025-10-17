const receptionController = require("../controllers/receptionController");

module.exports = function receptionWorkflow(io, socket) {
  console.log(`🔌 Workflow socket loaded for ${socket.id}`);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room ${room}`);
  });

};
