import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext'; 
import axios from 'axios';
import { Link } from "react-router-dom";

export default function Accounts() {
  const { user } = useContext(UserContext); 
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get('http://localhost:4000/accounts');
        setAccounts(response.data.accounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    fetchAccounts();
  }, []);

  // Filter accounts based on the search term
  const filteredAccounts = accounts.filter((account) => 
    Object.values(account)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className='bg-white rounded m-6 p-6'>
        <p>Hello {user.first}.</p>
      </div>

      {/* Search Bar */}
      <div className='bg-white rounded m-6 p-6'>
        <input
          type='text'
          placeholder='Search accounts...'
          className='border border-gray-light p-2 rounded w-full'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Accounts Table */}
      <div className='bg-white rounded m-6 p-6'>
        <table className='table-auto w-full border-collapse border border-gray-light text-sm text-gray-dark'>
          <thead>
            <tr>
            {console.log(accounts)}
            {console.log("filteredAccounts",filteredAccounts)}
              <th className='border border-gray-light p-2'>Account ID</th>
              <th className='border border-gray-light p-2'>Member</th>
              <th className='border border-gray-light p-2'>Member ID</th>
              <th className='border border-gray-light p-2'>Patient</th>
              <th className='border border-gray-light p-2'>Patient ID</th>
              <th className='border border-gray-light p-2'>Doctor</th>
              <th className='border border-gray-light p-2'>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <tr key={account.account_id}>
                  <td className='border border-gray-light p-2 text-center text-ebmaa-purple'>
                  <Link
                    to={`/view-accounts/${account.account_id}`}
                    className="text-blue-500 underline hover:text-blue-700"
                  >
                    {account.account_id}
                  </Link>
                  </td>
                  <td className='border border-gray-light p-2 text-center'>{account.member_first} {account.member_last}</td>
                  <td className='border border-gray-light p-2 text-center'>{account.member_id_nr}</td>

                  <td className='border border-gray-light p-2 text-center'>{account.patient_first} {account.patient_last}</td>
                  <td className='border border-gray-light p-2 text-center'>{account.patient_id_nr}</td>

                  <td className='border border-gray-light p-2 text-center'>{account.doctor_first} {account.doctor_last}</td>
                  <td className='border border-gray-light p-2 text-center'>
                    {(() => {
                      const date = new Date(account.updated_at);
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className='border border-gray-light p-2 text-center' colSpan={7}>
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
