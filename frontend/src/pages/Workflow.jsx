import React, { useState, useEffect, useContext } from "react";
import axiosClient from "../config/axiosClient";
import ENDPOINTS from "../config/apiEndpoints";
import { UserContext } from "../context/UserContext";
import { ReceptionWorkflow, AllWorkflow } from "../components";

export default function Workflow() {
  const { user } = useContext(UserContext);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Map permissions to tabs + components
  const workflowTabs = [
    { perm: "reception-workflow", label: "Reception", component: ReceptionWorkflow },
    { perm: "all-workflow", label: "All", component: AllWorkflow },
  ];

  // Only include tabs user has permission for
  const availableTabs = workflowTabs.filter((tab) =>
    user?.permissions?.includes(tab.perm)
  );

  const [activeTab, setActiveTab] = useState(
    availableTabs.length > 0 ? availableTabs[0].label : null
  );

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

    // Poll every 60s
    const interval = setInterval(() => {
      if (user) fetchWorkflow();
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="container-col">
      {/* Tabs */}
      <div className="flex w-full mb-4">
        {availableTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex-1 p-2 border-gray-blue-100 ${
              activeTab === tab.label
                ? "text-gray-dark font-bold bg-gray-100"
                : "text-gray-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 border border-gray-blue-100 rounded">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          (() => {
            const ActiveComponent = availableTabs.find((tab) => tab.label === activeTab)?.component;
            return ActiveComponent ? <ActiveComponent batches={batches} /> : <p>No workflow available.</p>;
          })()
        )}
      </div>
    </div>
  );
}
