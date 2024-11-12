// src/components/SideNav.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logout from '../Logout/Logout';

// eslint-disable-next-line react/prop-types
function SideNav({ setNavWidth }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev); // Toggle expanded/collapsed state
    setNavWidth(isExpanded ? '4rem' : '12rem'); // Toggle width based on expanded/collapsed state
  };

  return (
    <nav
    className={`fixed top-0 left-0 h-full bg-gray text-white flex flex-col p-4 transition-all duration-200 ease-in-out ${
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
    <ul className="space-y-4">
      <li className="flex justify-center">
        <Link to="/dashboard" className="flex items-center justify-center w-full">
        <span className={`text-base ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
            {isExpanded ? 'Dashboard' : 'dashboard'}
          </span>        </Link>
      </li>
      <li className="flex justify-center">
        <Link to="/accounts" className="flex items-center justify-center w-full">
        <span className={`text-base ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
            {isExpanded ? 'Accounts' : 'medical_services'}
          </span>        </Link>
      </li>
      <li className="flex justify-center">
        <Link to="/users" className="flex items-center justify-center w-full">
          <span className={`text-base ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
            {isExpanded ? 'Manage Users' : 'library_add'}
          </span>
        </Link>
      </li>
      <p className='flex justify-center'>-</p>
      <li className="flex justify-center">
        <Link to="/time" className="flex items-center justify-center w-full">
        <span className={`text-base ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
            {isExpanded ? 'Timesheet' : 'schedule'}
          </span>        </Link>
      </li>
      <li className="flex justify-center">
        <Link to="/profile" className="flex items-center justify-center w-full">
        <span className={`text-base ${!isExpanded ? 'material-symbols-outlined' : ''}`}>
            {isExpanded ? 'Profile' : 'person'}
          </span>        </Link>
      </li>
      <li className="flex justify-center">
        <span className="text-base">{isExpanded ? <Logout /> : ''}</span>
      </li>
    </ul>
  </nav>
  );
}

export default SideNav;
