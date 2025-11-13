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
    <div className="bg-white border-b border-gray-blue-200 rounded flex justify-between items-center flex-row h-[60px] px-6">
      {/* left */}
      <div className="flex gap-6">
        <div className="relative" ref={workflowRef}>
          <button
            type="button"
            className={`nav-dropdown-trigger ${isWorkflowOpen ? "nav-dropdown-trigger-active" : ""}`}
            onClick={() => setIsWorkflowOpen((prev) => !prev)}
          >
            <span>{activeDept.charAt(0).toUpperCase() + activeDept.slice(1)}</span>
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
            <div className="nav-dropdown-panel absolute top-full left-0">
              {availableDepts.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`nav-dropdown-item ${activeDept === dept ? "nav-dropdown-item-active" : ""}`}
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
      </div>
      {/* right */}
      <div className="flex gap-6">
        {/* <Link
          to="/settings"
          className="text-gray-dark hover:text-ebmaa-purple transition-colors duration-500"
        >
          Settings
        </Link> */}
        <Link
          to="/logout"
          className="nav-dropdown-trigger hover:nav-dropdown-trigger-active"
        >
          Logout
        </Link>
      </div>
    </div>
  );
}
