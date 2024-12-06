import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext'; 
import axios from 'axios';
import { SearchBar, Table } from '../../components';
import { Link } from "react-router-dom";
import { Nav } from '../../components/index'

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

  const columns = ['Account ID', 'Doctor', 'Practice Nr', 'Patient', 'Dependent Nr', 'Main Member Name', 'Main Member ID', 'Invoices', 'Balance'];
  const filteredAccounts = accounts.filter((account) =>
    Object.values(account).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Nav />
      <div className='flex flex-col gap-4 m-4 p-4 bg-white rounded'>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <Table data={filteredAccounts} columns={columns} linkPrefix="accounts" idField="account_id"/>
      </div>
    </>
  );
}
