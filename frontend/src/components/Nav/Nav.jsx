import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';

import { UserContext } from '../../context/UserContext';
import { ClientContext } from '../../context/ClientContext';
import Logout from '../Logout/Logout';

export default function Nav() {
  const { user } = useContext(UserContext);
  const { clientId, setClientId } = useContext(ClientContext);
  const location = useLocation(); // Get the current path
  
  const disabled = 'opacity-40 cursor-not-allowed';
  const disabledPaths = ['/accounts', '/invoices', '/client/info'];


  const accLinkClass = clientId
    ? `link-class`
    : `link-class hidden`;

  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-4 ml-4'>
        <select
          className={`cursor-pointer border rounded border-gray-light  px-2 hover:border-ebmaa-purple transition duration-300 ${!!clientId && !disabledPaths.includes(location.pathname) ? disabled : ''}`}
          disabled={!!clientId && !disabledPaths.includes(location.pathname)}
          onChange={(e) => {
            setClientId(e.target.value);
          }}
        >
          <option disabled={!!clientId} value=""> {/* Disabled didnt work */}
            Select Client
          </option>
          {user.client_access.map((client, i) => (
            <option key={i} className='hover:bg-ebmaa-purple' value={client.client_id}>
              {client.client_name}
            </option>
          ))}
        </select>

        <Link
          to={clientId ? "/accounts" : "#"}
          className={`${accLinkClass} ${location.pathname === '/accounts' ? 'active-link' : ''}`}
          onClick={(e) => {
            if (!clientId) e.preventDefault();
          }}
        >
          Accounts
        </Link>

        <Link
          to={clientId ? "/invoices" : "#"}
          className={`${accLinkClass} ${location.pathname === '/invoices' ? 'active-link' : ''}`}
          onClick={(e) => {
            if (!clientId) e.preventDefault();
          }}
        >
          Invoices
        </Link>

        <Link
          to={clientId ? "/client/info" : "#"}
          className={`${accLinkClass} ${location.pathname === '/client/info' ? 'active-link' : ''}`}
          onClick={(e) => {
            if (!clientId) e.preventDefault();
          }}
        >
          Client Info
        </Link>
      </div>
      <div className='flex flex-row gap-4 mr-4'>

        <Link
          to="/records"
          className={`link-class ${location.pathname === '/records' ? 'active-link' : ''}`}
        >
          Records
        </Link>

        <Link
          to="/profiles"
          className={`link-class ${location.pathname === '/profiles' ? 'active-link' : ''}`}
        >
          Profiles
        </Link>

        <p className="text-gray-light">|</p>
        <Link
          to="/dashboard"
          className={`link-class ${location.pathname === '/dashboard' ? 'active-link' : ''}`}
        >
          Dashboard
        </Link>

        <Link
          to="/tools"
          className={`link-class ${location.pathname === '/tools' ? 'active-link' : ''}`}
        >
          Tools
        </Link>
        <p className="text-gray-light">|</p>
        <Logout />
      </div>
    </div>
  );
}