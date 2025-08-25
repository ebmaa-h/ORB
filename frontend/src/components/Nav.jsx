import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';

import { UserContext } from '../context/UserContext';
import { ClientContext } from '../context/ClientContext';
import { getUserFeaturesByCategory, findUserFeature, getCategoryByRoute } from '../utility/featureAccess';
import { FEATURES } from "../config/featureConfig";

export default function Nav() {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  

  
  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-8 ml-4'>

        <div className="flex gap-4">
          {getUserFeaturesByCategory(user).map(({ name, label, path }) => (
            // <Link key={name} text={label} link={path} />
            <Link key={name} to={path} className="link-class">{label}</Link>

          ))}
        </div>

      </div>
      {/* Top Menu */}
      <div className="flex flex-row gap-4 mr-4 relative" ref={menuRef}>
        <div className="relative">
          <button
            className="link-class"
            onClick={() => setMenuOpen(!menuOpen)}
          > orb
            <span className="ml-1">▾</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 gap-2 p-2 w-40 bg-white rounded shadow-md z-10">
              <ul className="flex flex-col divide-y divide-gray-100">
                <li>
                  <Link to="/workflow" className="dropdown-link">Workflow</Link>
                </li>

                {/* Loop through features and output those user has access to */}
                {FEATURES.filter(f => findUserFeature(user, f.name)).map(({ name, label, path }) => (
                  <li key={name}>
                    <Link to={path} className="dropdown-link">{label}</Link>
                  </li>
                ))}

                <li>
                  <Link to="/logout" className="dropdown-link text-red-500">Logout</Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
