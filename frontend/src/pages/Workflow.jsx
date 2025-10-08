import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { ReceptionWorkflow } from "../components";
import socket from "../utils/socket";

export default function Workflow() {
  const { user } = useContext(UserContext);

  const workflowTabs = [
    { perm: "reception-workflow", label: "Reception", component: ReceptionWorkflow },
    // add more later
  ];

  const availableTabs = workflowTabs.filter((tab) =>
    user?.permissions?.includes(tab.perm)
  );

  const [activeTab, setActiveTab] = useState(
    availableTabs.length > 0 ? availableTabs[0].label : null
  );

  const [batches, setBatches] = useState([]);

  // --- SOCKET CONNECTION ---
  useEffect(() => {
    if (!user) return;

    // connect
    socket.connect();

    // join all rooms user has permission for
    availableTabs.forEach((tab) => {
      const roomName = `${tab.perm}`; 
      socket.emit("joinRoom", roomName); 
    });


    // listen for batches
    socket.on("batchCreated", (newBatch) => {
      setBatches((prev) => [...prev, newBatch]); // append
    });

    // cleanup on unmount
    return () => {
      socket.off("batchCreated");
      socket.disconnect();
    };
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
      <div className="rounded">
        {(() => {
          const ActiveComponent = availableTabs.find(
            (tab) => tab.label === activeTab
          )?.component;
          return ActiveComponent ? (
            <ActiveComponent batches={batches} />
          ) : (
            <p>No workflow available.</p>
          );
        })()}
      </div>
    </div>
  );
}
