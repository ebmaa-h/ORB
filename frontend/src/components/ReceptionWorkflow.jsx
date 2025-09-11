import { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";
import ENDPOINTS from "../config/apiEndpoints";
import NewBatch from "./NewBatch";
import NotesAndLogs from "./NotesAndLogs";
import BatchLists from "./BatchLists";

export default function ReceptionWorkflow() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch reception batches
  const fetchReceptionBatches = async () => {
    try {
      setLoading(true);
      // const response = await axiosClient.get(ENDPOINTS.workflow); //receptionWorkflow
      const response = []; //receptionWorkflow
      setBatches(response.data || []);
    } catch (err) {
      console.error("Error fetching reception batches:", err);
      setError("Failed to fetch reception batches");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + polling
  useEffect(() => {
    fetchReceptionBatches();
    const interval = setInterval(fetchReceptionBatches, 10000); // 60s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("Reception batches:", batches);
  }, [batches]);

  if (loading) return <p>Loading Reception...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="flex flex-col gap-4">
      <NewBatch />
      <BatchLists batches={batches} />
          <NotesAndLogs 
            tableName='workflows'
            id={1  }
            // refreshTrigger={refreshLogs}

          />
    </div>
  );
}
