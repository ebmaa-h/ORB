import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import { WorkflowContext } from "../../context/WorkflowContext";

export default function Nav() {
  const { user } = useContext(UserContext);
  const { activeDept, setActiveDept, availableDepts } = useContext(WorkflowContext);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const workflowRef = useRef(null);
  const location = useLocation();

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (workflowRef.current && !workflowRef.current.contains(event.target)) {
        setIsWorkflowOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // close dropdown when navigating
  useEffect(() => {
    setIsWorkflowOpen(false);
  }, [location]);

  return (
    <div className="bg-white border-b border-gray-blue-100 rounded flex justify-between items-center flex-row h-[60px] px-6">
      {/* left */}
      <div className="flex gap-6">
        <div className="relative" ref={workflowRef}>
          <button
            className="text-gray-dark hover:text-ebmaa-purple transition-colors duration-500 flex items-center gap-1"
            onClick={() => setIsWorkflowOpen(!isWorkflowOpen)}
          >
            Workflow
            <svg
              className={`w-4 h-4 transform transition-transform ${isWorkflowOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isWorkflowOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-blue-100 rounded shadow-lg z-10">
              {availableDepts.map((dept) => (
                <button
                  key={dept}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-dark hover:bg-gray-100 ${
                    activeDept === dept ? "font-bold bg-gray-50" : ""
                  }`}
                  onClick={() => {
                    setActiveDept(dept);
                    setIsWorkflowOpen(false);
                  }}
                >
                  {dept.charAt(0).toUpperCase() + dept.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        <Link
          to="/tools"
          className="text-gray-dark hover:text-ebmaa-purple transition-colors duration-500"
        >
          Tools
        </Link>
      </div>
      {/* right */}
      <div className="flex gap-6">
        <Link
          to="/logout"
          className="text-gray-dark hover:text-red transition-colors duration-500"
        >
          Logout
        </Link>
      </div>
    </div>
  );
}