// src/pages/Workflow.jsx
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import socket from "../utils/socket";
import ENDPOINTS from "../utils/apiEndpoints";
import axiosClient from "../utils/axiosClient";
import WorkflowEngine from "../components/Workflow/WorkflowEngine";

export default function Workflow() {
  const { user } = useContext(UserContext);

  // compute available departments from user's permissions (optional)
  // Here we map some permissions to departments; adapt as needed
  const departmentPermissions = [

    { perm: "no-workflow", label: "none" },
    /* just a test, landing when no department is assigned 
    -> a waiting room for when management is still adding permissions of new employee
    -> or employees whose permissions are tempt disabled, meaning user has access to nothing
    */
    { perm: "reception-workflow", label: "reception" },
    { perm: "admittance-workflow", label: "admittance" },
    { perm: "billing-workflow", label: "billing" },
  ];

  const availableDepts = departmentPermissions.filter((d) =>
    user?.permissions?.includes(d.perm)
  ).map(d => d.label);
  console.log(availableDepts.length)

  const defaultDept = availableDepts.length ? availableDepts[0] : "none";
  const [activeDept, setActiveDept] = useState(defaultDept);

  useEffect(() => {
    // if user permissions change or activeDept is no longer available, switch
    if (!availableDepts.includes(activeDept) && availableDepts.length) {
      setActiveDept(availableDepts[0]);
    }
  }, [availableDepts, activeDept]);

  return (
    <div className="container-col">
      <div className="flex gap-2 mb-4">
        {availableDepts.map((d) => (
          <button
            key={d}
            className={`btn-class ${activeDept === d ? "font-bold bg-gray-100" : ""}`}
            onClick={() => setActiveDept(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div>
        <WorkflowEngine department={activeDept} />
      </div>
    </div>
  );
}
