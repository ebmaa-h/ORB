import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';

import { UserContext } from '../../context/UserContext';
import { ClientContext } from '../../context/ClientContext';
import Logout from '../Logout/Logout';

export default function Nav() {
  const { user } = useContext(UserContext);
  const { clientId, setClientId } = useContext(ClientContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if user has access to link for use later
  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active-link' : '';
  };
  

  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-4 ml-4'>
          <>
            <select
              className="cursor-pointer border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300"
              value={clientId || ""}
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
          
            {clientId && (
              <>
                <Link 
                  to="/accounts" 
                  className={`link-class ${isActive('/accounts')}`}
                >
                  Accounts
                </Link>
                <Link 
                  to="/invoices" 
                  className={`link-class ${isActive('/invoices')}`}
                >
                  Invoices
                </Link>
                <Link 
                  to="/client/info" 
                  className={`link-class ${isActive('/client/info')}`}
                >
                  Client Info
                </Link>
              </>
            )}

          </>
      </div>
      <div className='flex flex-row gap-4 mr-4'>
          <>
          <Link 
            to="/records" 
            className={`link-class ${isActive('/records')}`}
            onClick={() => setClientId("")} 
          >
            Records
          </Link>
          <Link 
            to="/dashboard" 
            onClick={() => setClientId("")} 
            className={`link-class ${isActive('/dashboard')}`}
          >
            Dashboard
          </Link>
            <p className="text-gray-300">|</p>
            <Logout />
          </>
      </div>
    </div>
  );
}
