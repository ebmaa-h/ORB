import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <>
      <div className="bg-white rounded m-4 p-4 flex gap-6">
        <Link
          to={`/accounts`}
          className="text-blue-500 underline hover:text-blue-700"
        >
          Accounts
        </Link>
        <Link
          to={`/profiles`}
          className="text-blue-500 underline hover:text-blue-700"
        >
          Profiles
        </Link>
        <Link
          to={`/invoices`}
          className="text-blue-500 underline hover:text-blue-700"
        >
          Invoices
        </Link>
      </div>
    </>
  )
}
