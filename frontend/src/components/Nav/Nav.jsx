import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';

import { UserContext } from '../../context/UserContext';
import { DoctorContext } from '../../context/DoctorContext';
import Logout from '../Logout/Logout';

export default function Nav() {
  const { user } = useContext(UserContext);
  const { doctorId, setDoctorId } = useContext(DoctorContext);
  const location = useLocation(); // Get the current path
  

  const accLinkClass = doctorId
    ? `link-class`
    : `link-class hidden`;

  return (
    <div className="bg-white flex justify-between items-center flex-row h-[60px]">
      <div className='flex flex-row gap-4 ml-4'>
        <select
          className="border rounded border-gray-light text-sm px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
          value={doctorId || ""}
          onChange={(e) => {
            setDoctorId(e.target.value);
          }}
        >
          <option className='' value="" disabled>
            Select Doctor
          </option>
          {user.doctor_access.map((doctor, i) => (
            <option key={i} className='hover:bg-ebmaa-purple' value={doctor.doctor_id}>
              {doctor.doctor_name}
            </option>
          ))}
        </select>

        <Link
          to={doctorId ? "/accounts" : "#"}
          className={`${accLinkClass} ${location.pathname === '/accounts' ? 'active-link' : ''}`}
        >
          Accounts
        </Link>

        <Link
          to={doctorId ? "/invoices" : "#"}
          className={`${accLinkClass} ${location.pathname === '/invoices' ? 'active-link' : ''}`}
        >
          Invoices
        </Link>

        <p className="text-gray-light">|</p>
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
      </div>
      <div className='flex flex-row gap-4 mr-4'>
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
