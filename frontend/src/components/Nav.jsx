import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';
import { Logout } from '../components'
import { UserContext } from '../context/UserContext';

export default function Nav() {
  const { user } = useContext(UserContext);

  return (
    <div className="bg-white border-b border-gray-blue-100 rounded flex justify-between items-center flex-row h-[60px] px-6">
      {/* Left */}
      <div className='flex gap-6'>
        <Link
          to="/workflow"
          className="text-gray-dark hover:text-ebmaa-purple transition-colors duration-500"
        >
          Workflow
        </Link>
        <Link
          to="/tools"
          className="text-gray-dark hover:text-ebmaa-purple transition-colors duration-500"
        >
          Tools
        </Link>
      </div>
      {/* Right */}
      <div className='flex gap-6'>
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
