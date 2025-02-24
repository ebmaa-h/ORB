import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';

import { UserContext } from '../../context/UserContext';
import { ClientContext } from '../../context/ClientContext';
import Logout from '../Logout/Logout';

export default function Nav() {
  const { user } = useContext(UserContext);
  const { clientId, setClientId } = useContext(ClientContext);
  const location = useLocation(); // Get the current path
  const navigate = useNavigate();

  // const accLinkClass = clientId
  //   ? `link-class`
  //   : `link-class hidden`;

  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-4 ml-4'>
        <span className=''></span>
        <select
          className={`cursor-pointer border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300`}
          // disabled={!!clientId}
          onChange={(e) => {
            const selectedClientId = e.target.value;
            setClientId(selectedClientId);
            if (selectedClientId) {
              navigate("/client/info");
            
            }
          }}
        >
          <option disabled={!!clientId}>
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
          className='link-class'

        >
          Accounts
        </Link>

        <Link
          to={clientId ? "/invoices" : "#"}
          className='link-class'

        >
          Invoices
        </Link>

        <Link
          to={clientId ? "/client/info" : "#"}
          className='link-class'

        >
          Client Info
        </Link>
      </div>
      <div className='flex flex-row gap-4 mr-4'>

        <Link
          to="/records"
          className='link-class'
        >
          Records
        </Link>

        <Link
          to="/profiles"
          className='link-class'
        >
          Profiles
        </Link>

        <p className="text-gray-300">|</p>
        <Link
          to="/dashboard"
          className='link-class'
        >
          Dashboard
        </Link>

        <Link
          to="/tools"
          className='link-class'
        >
          Tools
        </Link>
        <p className="text-gray-300">|</p>
        <Logout />
      </div>
    </div>
  );
}