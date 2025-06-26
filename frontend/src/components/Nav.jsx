import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';

import { UserContext } from '../context/UserContext';
import { ClientContext } from '../context/ClientContext';
import { getAccessibleFeaturesByCategory, featureLabels, getCategoryByRoute } from '../utility/featureAccess';

export default function Nav() {
  const { user } = useContext(UserContext);
  const { clientId, setClientId } = useContext(ClientContext);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active-link' : '';
  };
  
  // Get user features & category features
  const currentCategory = getCategoryByRoute(location.pathname);
  // console.log('🧭 Current category:', currentCategory);
  const features = getAccessibleFeaturesByCategory(user, currentCategory);
  // console.log('features:', features);
  
  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-4 ml-4'>
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
      <div className='flex flex-row gap-4 mr-4'>
          <>
          <Link 
            to="/dashboard" 
            onClick={() => setClientId("")} 
            className={`link-class ${isActive('/dashboard')}`}
          >
            Dashboard
          </Link>
          <p className="text-gray-300">|</p>
          {/* <Link 
            to="/logout" 
            onClick={() => setClientId("")} 
            className={`link-class`}
          >
            Logout
          </Link> */}
          </>
      </div>
    </div>
  );
}
