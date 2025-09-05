import { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient";
import ENDPOINTS from "../config/apiEndpoints";

export default function AllWorkflow() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all batches
  const fetchAllBatches = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(ENDPOINTS.workflow); //allWorkflow
      setBatches(response.data || []);
    } catch (err) {
      console.error("Error fetching all batches:", err);
      setError("Failed to fetch all batches");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + polling
  useEffect(() => {
    fetchAllBatches();
    const interval = setInterval(fetchAllBatches, 60000); // 60s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("All batches:", batches);
  }, [batches]);

  if (loading) return <p>Loading All Batches...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="container-col h-[100px]">All Batches (list view later)</div>
    </div>
  );
}
