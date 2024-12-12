import { Link } from 'react-router-dom'

export default function Nav() {
  const linkClass = "border py-1 px-1 border-gray-light min-w-[100px] rounded hover:bg-gray-light hover:border-white transition duration-200";

  return (
    <>
      <div className="bg-white rounded m-4 p-4 flex gap-4 text-sm text-center">
        <Link
          to={`/profiles`}
          className={linkClass}
        >
          Profiles
        </Link>
        
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
      </div>
    </>
  )
}
