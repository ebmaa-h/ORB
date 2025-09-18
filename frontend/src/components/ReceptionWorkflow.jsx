// ReceptionWorkflow.jsx
import { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";
import ENDPOINTS from "../config/apiEndpoints";
import socket from "../config/socket";
import NewBatch from "./NewBatch";
import NotesAndLogs from "./NotesAndLogs";
import BatchLists from "./BatchLists";

export default function ReceptionWorkflow() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initial fetch from REST (fallback in case socket missed something)
  const fetchReceptionBatches = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(ENDPOINTS.receptionWorkflow);
      setBatches(response.data || []);
    } catch (err) {
      console.error("Error fetching reception batches:", err);
      setError("Failed to fetch reception batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionBatches();

    // --- Socket setup ---
    socket.emit("joinRoom", "reception");

    socket.on("batchCreated", (newBatch) => {
      console.log("📦 New batch:", newBatch);
      // Append only the new one -> no full reload
      setBatches((prev) => [...prev, newBatch]);
    });

    socket.on("batchUpdated", (updatedBatch) => {
      setBatches((prev) =>
        prev.map((b) => (b.batch_id === updatedBatch.batch_id ? updatedBatch : b))
      );
    });

    socket.on("batchDeleted", (deletedId) => {
      setBatches((prev) => prev.filter((b) => b.batch_id !== deletedId));
    });

    // Cleanup on unmount
    return () => {
      socket.emit("leaveRoom", "reception");
      socket.off("batchCreated");
      socket.off("batchUpdated");
      socket.off("batchDeleted");
    };
  }, []);

  if (loading) return <p>Loading Reception...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="flex flex-col gap-4">
      <NewBatch />
      <BatchLists batches={batches} />
      {/* Later: <NotesAndLogs ... /> */}
    </div>
  );
}
