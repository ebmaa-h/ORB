import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';

import { UserContext } from '../context/UserContext';
import { ClientContext } from '../context/ClientContext';
import { getUserFeaturesByCategory, findUserFeature, getCategoryByRoute } from '../utility/featureAccess';
import { FEATURES } from "../config/featureConfig";

export default function Nav() {
  const { user } = useContext(UserContext);
  const { clientId, setClientId } = useContext(ClientContext);
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
  
  // Check page cateogory 
  const currentCategory = getCategoryByRoute(location.pathname);

  // Check if path ends with ID 
  const isOnSpecificPage = /\/(accounts|invoices)\/\d+/.test(location.pathname);
  
  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-8 ml-4'>

        {currentCategory == 'clients'&&
          <select
            className={`cursor-pointer border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300 w-[200px] h-[30px]`}
            value={clientId || ""}
            disabled={isOnSpecificPage}
            onChange={(e) => {
              const selectedClientId = e.target.value;
              setClientId(selectedClientId);
              }}
              >
            <option>Select Client</option>
            {user.client_access.map((client, i) => (
              <option key={i} className='hover:bg-ebmaa-purple' value={client.client_id}>
                {client.client_name}
              </option>
            ))}
          </select>
        }
        <div className="flex gap-4">
          {getUserFeaturesByCategory(user, currentCategory).map(({ name, label, path }) => (
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
          >
            {(() => {
              const path = location.pathname;
              if (
                path.includes('/accounts') ||
                path.includes('/invoices') ||
                path.includes('/crq') ||
                path.includes('/reports')
              ) {
                return 'Clients';
              }
              if (path.includes('/records')) return 'Records';
              if (path.includes('/profiles')) return 'Profiles';
              if (path.includes('/notes')) return 'Notes';
              if (path.includes('/logs')) return 'Logs';
              if (path.includes('/workflow')) return 'Workflow';
              return 'More';
            })()}
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
