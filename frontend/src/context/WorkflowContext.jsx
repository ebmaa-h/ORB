import { createContext, useState, useEffect, useContext } from "react";
import { UserContext } from "./UserContext";

export const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
  const { user } = useContext(UserContext);

  // get available departments from user permissions
  const departmentPermissions = [
    { perm: "no-workflow", label: "none" },
    { perm: "reception-workflow", label: "reception" },
    { perm: "admittance-workflow", label: "admittance" },
    { perm: "billing-workflow", label: "billing" },
  ];

  const availableDepts = departmentPermissions
    .filter((d) => user?.permissions?.includes(d.perm))
    .map((d) => d.label);

  const [activeDept, setActiveDept] = useState(availableDepts.length ? availableDepts[0] : "none");

  // update activeDept if permissions change or current dept is unavailable
  useEffect(() => {
    if (!availableDepts.includes(activeDept) && availableDepts.length) {
      setActiveDept(availableDepts[0]);
    }
  }, [availableDepts, activeDept]);

  return (
    <WorkflowContext.Provider value={{ activeDept, setActiveDept, availableDepts }}>
      {children}
    </WorkflowContext.Provider>
  );
};