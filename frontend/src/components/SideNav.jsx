import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logout } from '../components';

function SideNav({ setNavWidth }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev); // Toggle expanded/collapsed state
    setNavWidth(isExpanded ? '4rem' : '12rem'); // Toggle width based on expanded/collapsed state
  };

  return (
    <nav
    className={`fixed top-0 left-0 h-full bg-white text-black flex flex-col p-4 transition-all duration-200 ease-in-out ${
      isExpanded ? 'w-48' : 'w-16'
    }`}
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="text-2xl mb-4 focus:outline-none material-symbols-outlined"
      >
      menu
      </button>

      {/* Navigation links */}
      <ul className="flex flex-col h-full justify-between">
        <div className="space-y-4">
          <li>
            <Link to="/dashboard" className="flex items-center justify-center w-full">
              <span className={`text-base whitespace-nowrap ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
                {isExpanded ? 'Dashboard' : 'dashboard'}
              </span>        
            </Link>
          </li>
          <li className="flex justify-center">
            <Link to="/records" className="flex items-center justify-center w-full">
              <span className={`text-base whitespace-nowrap ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
                {isExpanded ? 'Records' : 'library_add'}
              </span>
            </Link>
          </li>
          <li className="flex justify-center">
            <Link to="/profiles" className="flex items-center justify-center w-full">
              <span className={`text-base whitespace-nowrap ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
                {isExpanded ? 'Profiles' : 'library_add'}
              </span>
            </Link>
          </li>
          <li className="flex justify-center">
            <Link to="/tools" className="flex items-center justify-center w-full">
              <span className={`text-base whitespace-nowrap ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
                {isExpanded ? 'Management Tools' : 'library_add'}
              </span>
            </Link>
          </li>
          <li className="flex justify-center">
            <Link to="/time" className="flex items-center justify-center w-full">
              <span className={`text-base whitespace-nowrap ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
                {isExpanded ? 'Timesheet' : 'schedule'}
              </span>
            </Link>
          </li>
        </div>
        <li className="flex justify-center">
          <span className="text-base whitespace-nowrap">{isExpanded ? <Logout /> : ''}</span>
        </li>
    </ul>
  </nav>
  );
}

export default SideNav;
