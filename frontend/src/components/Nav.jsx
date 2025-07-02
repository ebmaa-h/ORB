import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';

import { UserContext } from '../context/UserContext';
import { ClientContext } from '../context/ClientContext';
import { getAccessibleFeaturesByCategory, featureLabels, getCategoryByRoute } from '../utility/featureAccess';

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

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active-link' : '';
  };

  const findFeature = (featureName) => 
  user.features.find((feature) => feature.feature_name === featureName && feature.is_active);
  
  // Get user features & category features
  const currentCategory = getCategoryByRoute(location.pathname);
  // console.log('🧭 Current category:', currentCategory);
  const features = getAccessibleFeaturesByCategory(user, currentCategory);
  // console.log('features:', features);
  
  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-8 ml-4'>
        {currentCategory === 'main' && (
          <select
            className="cursor-pointer border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300"
            value={clientId || ""}
            onChange={(e) => {
              const selectedClientId = e.target.value;
              setClientId(selectedClientId);
              // if (selectedClientId) {
              //   navigate('/client/crq');
              // }
            }}
          >
            <option disabled={!!clientId}>Select Client</option>
            {user.client_access.map((client, i) => (
              <option key={i} value={client.client_id}>
                {client.client_name}
              </option>
            ))}
          </select>
        )}

        {features.map((feature, index) => {
          const label = featureLabels[feature.feature_name] || feature.feature_name;
          if (!currentCategory) return;
          return (
            <>
              <Link
                key={index}
                to={`/${(feature.feature_name.replace('-', '/')).toLowerCase()}`}
                className="link-class"
              >
                {label}
              </Link>
            </>
          );
        })}

      </div>
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
              if (path.includes('/dashboard')) return 'Dashboard';
              return 'More';
            })()}
            <span className="ml-1">▾</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 gap-2 p-2 w-40 bg-white rounded shadow-md z-10">
              <ul className="flex flex-col divide-y divide-gray-100">
                <li>
                  <Link to="/dashboard" className="dropdown-link">Dashboard</Link>
                </li>
                {findFeature("records") && (
                  <li><Link to="/records" className="dropdown-link">Records</Link></li>
                )}
                {findFeature("crq") && (
                  <li><Link to="/invoices" className="dropdown-link">Clients</Link></li>
                )}
                {findFeature("profiles") && (
                  <li><Link to="/profiles" className="dropdown-link">Profiles</Link></li>
                )}
                {findFeature("notes") && (
                  <li><Link to="/notes" className="dropdown-link">Notes</Link></li>
                )}
                {findFeature("logs") && (
                  <li><Link to="/logs" className="dropdown-link">Logs</Link></li>
                )}
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
