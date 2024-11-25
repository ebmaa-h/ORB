import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";

export default function AccountDetails() {
  // const { user } = useContext(UserContext); 
  const { accountId } = useParams(); // Get accountId from URL
  const [account, setAccount] = useState(null);


  // Fetch account details
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/accounts/${accountId}`, {
          withCredentials: true,
        });
        setAccount(response.data.account);
      } catch (error) {
        console.error('Error fetching account details:', error);
      }
    };

    fetchAccount();
  }, [accountId]);

  return (
    <>
      <div className="bg-white rounded m-6 p-6">
        <Link
          to={`/view-accounts`}
          className="text-blue-500 underline hover:text-blue-700"
        >
          Back to Accounts
        </Link>
      </div>
      <div className="bg-white rounded m-6 p-6">
        <h1 className="text-lg font-bold mb-4">Account Details</h1>
        {account ? (
          <form className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Account ID</label>
              <input
                type="text"
                value={account.account_id}
                readOnly
                className="border border-gray-light p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block font-medium">Member Name</label>
              <input
                type="text"
                value={`${account.member_first} ${account.member_last}`}
                readOnly
                className="border border-gray-light p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block font-medium">Patient Name</label>
              <input
                type="text"
                value={`${account.patient_first} ${account.patient_last}`}
                readOnly
                className="border border-gray-light p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="block font-medium">Last Updated</label>
              <input
                type="text"
                value={new Date(account.updated_at).toLocaleDateString('en-GB')}
                readOnly
                className="border border-gray-light p-2 rounded w-full"
              />
            </div>
          </form>
        ) : (
          <p>Loading account details...</p>
        )}
      </div>
    </>
  );
}
