import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext'; 
import axios from 'axios';
import { SearchBar, Table } from '../../components';
// import { Link } from "react-router-dom";

export default function Accounts() {
  const { user } = useContext(UserContext);
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Accounts on component mount
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

  const columns = ['Account ID', 'Profile ID', 'Amount', 'Status', 'Last Payment Date'];
  const filteredAccounts = accounts.filter((account) =>
    Object.values(account).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className='bg-white rounded m-6 p-6'>
        <p>Hello {user.first}.</p>
      </div>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <Table data={filteredAccounts} columns={columns} />
    </>
  );
}
