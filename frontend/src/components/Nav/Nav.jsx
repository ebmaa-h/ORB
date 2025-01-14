import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';

import { UserContext } from '../../context/UserContext';
import { DoctorContext } from '../../context/DoctorContext';
import Logout from '../Logout/Logout';

export default function Nav() {
  const { user } = useContext(UserContext);
  const { doctorId, setDoctorId } = useContext(DoctorContext);
  const location = useLocation(); // Get the current path
  
  const linkClass = "text-sm py-1 px-2 mx-2 min-w-[100px] rounded hover:bg-ebmaa-purple hover:border-white hover:text-white transition duration-10 text-center";
  const activeLinkClass = "bg-ebmaa-purple text-white border-none"; 
  const accLinkClass = doctorId
    ? `${linkClass}`
    : `${linkClass} hidden`;

  return (
    <div className="bg-white flex justify-center items-center  h-[60px]">
      <select
        className="border rounded border-gray-light py-1 px-1 text-sm py-1 px-2  "
        value={doctorId || ""}
        onChange={(e) => {
          setDoctorId(e.target.value);
        }}
      >
        <option value="" disabled>
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
        className={`${accLinkClass} ${location.pathname === '/accounts' ? activeLinkClass : ''}`}
      >
        Accounts
      </Link>

      <Link
        to={doctorId ? "/invoices" : "#"}
        className={`${accLinkClass} ${location.pathname === '/invoices' ? activeLinkClass : ''}`}
      >
        Invoices
      </Link>

      <p className="text-gray-light px-2">|</p>
      <Link
        to="/records"
        className={`${linkClass} ${location.pathname === '/records' ? activeLinkClass : ''}`}
      >
        Records
      </Link>

      <Link
        to="/profiles"
        className={`${linkClass} ${location.pathname === '/profiles' ? activeLinkClass : ''}`}
      >
        Profiles
      </Link>

      <p className="text-gray-light px-2">|</p>
      <Link
        to="/dashboard"
        className={`${linkClass} ${location.pathname === '/dashboard' ? activeLinkClass : ''}`}
      >
        Dashboard
      </Link>

      <Link
        to="/tools"
        className={`${linkClass} ${location.pathname === '/tools' ? activeLinkClass : ''}`}
      >
        Tools
      </Link>
      <p className="text-gray-light px-2">|</p>
      <Logout />
    </div>
  );
}
