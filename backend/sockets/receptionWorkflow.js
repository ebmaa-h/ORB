const receptionController = require("../controllers/receptionController");

module.exports = function receptionWorkflow(io, socket) {
  console.log(`🔌 Reception workflow socket loaded for ${socket.id}`);

  socket.on("joinReception", () => {
    socket.join("reception-workflow");
    console.log(`📌 ${socket.id} joined reception`);
  });

  socket.on("newForeignUrgentBatch", async (data) => {
  try {
    io.to("reception-workflow").emit("foreignUrgentBatchCreated", data);
    console.log("🌍 New foreign/urgent batch broadcast:", data.foreign_urgent_batch_id);
  } catch (err) {
    console.error("❌ Error in newForeignUrgentBatch socket event:", err);
  }
});


  // Create new batch
  socket.on("newBatch", async (data) => {
    try {
     io.to("reception-workflow").emit("batchCreated", data); 
     console.log("📦 New batch broadcast:", data.batch_id);
    } catch (err) {
      console.error("❌ Error in newBatch socket event:", err);
    }
  });

  // Add note to reception 
  socket.on("addReceptionNote", async (data) => {
    try {
      const note = await receptionController.createNote(data);
      io.to("reception-workflow").emit("receptionNoteAdded", note);
    } catch (err) {
      console.error("❌ Error adding reception note:", err);
    }
  });

  // Log reception actions
  socket.on("logReceptionAction", async (data) => {
    try {
      const log = await receptionController.createLog(data);
      io.to("reception-workflow").emit("receptionLogAdded", log);
    } catch (err) {
      console.error("❌ Error logging reception action:", err);
    }
  });
};
