import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';

import { UserContext } from '../../context/UserContext';
import { ClientContext } from '../../context/ClientContext';
import Logout from '../Logout/Logout';

export default function Nav() {
  const { user } = useContext(UserContext);
  const { clientId, setClientId } = useContext(ClientContext);
  const navigate = useNavigate();
  const location = useLocation(); // Access the current route
  const [expanded, setExpanded] = useState(false);

  const toggleNav = () => {
    setExpanded(!expanded);
    navigate('/dashboard');
  };

  const handleBackToDashboard = () => {
    setExpanded(false);
    navigate('/dashboard');
  };

  // Helper function to determine if the link is active
  const isActive = (path) => {
    // Check if the current path starts with the given base path
    return location.pathname.startsWith(path) ? 'active-link' : '';
  };
  

  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-4 ml-4'>
        <span className="material-symbols-outlined cursor-pointer" onClick={toggleNav}>
          apps
        </span>
        {expanded && (
          <>
            <select
              className="cursor-pointer border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300"
              onChange={(e) => {
                const selectedClientId = e.target.value;
                setClientId(selectedClientId);
                if (selectedClientId) {
                  navigate('/client/info');
                }
              }}
            >
              <option disabled={!!clientId}>Select Client</option>
              {user.client_access.map((client, i) => (
                <option key={i} className='hover:bg-ebmaa-purple' value={client.client_id}>
                  {client.client_name}
                </option>
              ))}
            </select>

            <Link to={clientId ? "/accounts" : "#"} className={`link-class ${isActive('/accounts')}`}>
              Accounts
            </Link>
            <Link to={clientId ? "/invoices" : "#"} className={`link-class ${isActive('/invoices')}`}>
              Invoices
            </Link>
            <Link to={clientId ? "/client/info" : "#"} className={`link-class ${isActive('/client/info')}`}>
              Client Info
            </Link>
          </>
        )}
      </div>
      <div className='flex flex-row gap-4 mr-4'>
        {!expanded ? (
          <>
            <Link to="/dashboard" className={`link-class ${isActive('/dashboard')}`}>Dashboard</Link>
            <Link to="/records" className={`link-class ${isActive('/records')}`}>Records</Link>
            <Link to="/profiles" className={`link-class ${isActive('/profiles')}`}>Profiles</Link>
            <p className="text-gray-300">|</p>
            <Link to="/tools" className={`link-class ${isActive('/tools')}`}>Tools</Link>
            <p className="text-gray-300">|</p>
            <Logout />
          </>
        ) : (
          <button onClick={handleBackToDashboard} className='link-class'>
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
