import { Link } from 'react-router-dom'

export default function Nav() {
  const linkClass = "border py-1 px-1 border-gray-light min-w-[100px] rounded hover:bg-gray-light hover:border-white transition duration-200";


  // Get user context
  // Get permissions in context
  // List access granted doctors

  // Selected practice number add to doctors context
  return (
    <>
      <div className="bg-white rounded m-4 p-4 flex gap-4 text-sm text-center">

        {/* dropdown to select a doctor */}
        {/* Depending on what doctor is selected: will show accounts/invoices/records (not profiles) of that doctor on click on the other links
        so this dropdown is only for selection. */}
                {/* Dropdown to select a doctor */}
                <select
          // value={selectedDoctor}
          // onChange={handleDoctorChange}
          className="border py-1 px-2 rounded focus:outline-none focus:ring focus:border-blue-300 transition duration-200"
        >
          <option value="" disabled>
            Select Doctor
          </option>
          <option value="doctor1">Dr. Smith</option>
          <option value="doctor2">Dr. Johnson</option>
          <option value="doctor3">Dr. Lee</option>
        </select>
        
        <Link
          to={`/accounts`}
          className={linkClass}
        >
          Accounts
        </Link>
        

        <Link
          to={`/invoices`}
          className={linkClass}
        >
          Invoices
        </Link>

        <Link
          to={`/records`}
          className={linkClass}
        >
          Records
        </Link>

        {/* Management Tool */}
        <Link
          to={`/profiles`}
          className={linkClass}
        >
          Profiles
        </Link>
      </div>
    </>
  )
}
