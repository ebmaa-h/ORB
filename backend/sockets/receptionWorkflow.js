module.exports = function receptionWorkflow(io, socket) {
  console.log(`🔌 Reception workflow socket loaded for ${socket.id}`);

  // Join room
  socket.on("joinReception", () => {
    socket.join("reception-workflow");
    console.log(`📌 ${socket.id} joined reception`);
  });

  // Batches
  socket.on("newBatch", (data) => {
    console.log(`📦 New reception batch:`, data);
    io.to("reception-workflow").emit("batchCreated", data);
  });

  // Notes
  socket.on("newReceptionNote", (note) => {
    console.log(`📝 New reception note:`, note);
    io.to("reception-workflow").emit("noteCreated", note);
  });

  // Logs
  socket.on("newReceptionLog", (log) => {
    console.log(`📜 New reception log:`, log);
    io.to("reception-workflow").emit("logCreated", log);
  });
};
