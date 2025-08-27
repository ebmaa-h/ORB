import React, { useState, useEffect, useContext } from "react";
import axiosClient from "../config/axiosClient";
import { UserContext } from "../context/UserContext";
import ENDPOINTS from "../config/apiEndpoints";
import { NewBatch } from "../components";

export default function Workflow() {
  const { user } = useContext(UserContext);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const departments = ["Reception", "Admittance", "Billing", "All"];

  const [activeTab, setActiveTab] = useState("Reception");

  // Fetch workflow data
  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(ENDPOINTS.workflow);
        setBatches(response.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch workflow");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchWorkflow();
  }, [user]);

  // Filter by department tab
  const filterByTab = (tab) => {
    if (tab === "All") return batches;
    return batches.filter((b) => b.current_department === tab);
  };

  const columns = [
    "Batch ID",
    "Department",
    "Client",
    "Date Received",
    "Batch Size",
    "Pending",
  ];

  return (
    <div className="container-col">
      {/* Tabs */}
      <div className="flex w-full mb-4">
        {departments.map((dep) => (
          <button
            key={dep}
            onClick={() => setActiveTab(dep)}
            className={`flex-1 p-2 border-x border-gray-blue-100 ${
              activeTab === dep
                ? "text-gray-dark font-bold bg-gray-100"
                : "text-gray-dark"
            }`}
          >
            {dep}
          </button>
        ))}
      </div>


      {/* Content */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="table-auto w-full border-collapse border-y border-gray-blue-100 text-gray-dark">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="p-2">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filterByTab(activeTab).length > 0 ? (
              filterByTab(activeTab).map((batch) => (
                <tr
                  key={batch.id}
                  className="cursor-pointer hover:bg-gray-blue-100"
                >
                  <td className="border-y border-gray-blue-100 p-2 text-center">
                    {batch.id}
                  </td>
                  <td className="border-y border-gray-blue-100 p-2 text-center">
                    {batch.current_department}
                  </td>
                  <td className="border-y border-gray-blue-100 p-2 text-center">
                    {batch.client}
                  </td>
                  <td className="border-y border-gray-blue-100 p-2 text-center">
                    {batch.date_received}
                  </td>
                  <td className="border-y border-gray-blue-100 p-2 text-center">
                    {batch.batch_size}
                  </td>
                  <td className="border-y border-gray-blue-100 p-2 text-center">
                    {batch.pending ? "Yes" : "No"}
                  </td>
                </tr>
              ))
              
            ) : (
              <tr>
                <td
                  className="border border-gray-blue-100 p-2 text-center"
                  colSpan={columns.length}
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {activeTab === "Reception" && (
        <div className="mb-4 self-end">
          <NewBatch onBatchAdded={(newBatch) => setBatches([...batches, newBatch])} />
        </div>
      )}

    </div>
  );
}
