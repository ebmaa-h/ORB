import React, { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { ReceptionWorkflow, AllWorkflow } from "../components";

export default function WorkflowForeign() {
  const { user } = useContext(UserContext);

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
      <div className="rounded">
        {(() => {
          const ActiveComponent = availableTabs.find(
            (tab) => tab.label === activeTab
          )?.component;
          return ActiveComponent ? <ActiveComponent /> : <p>No workflow available.</p>;
        })()}
      </div>
    </div>
  );
}
