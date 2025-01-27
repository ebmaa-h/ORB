import { useEffect, useState } from 'react';
import axios from 'axios';
import ENDPOINTS from '../../config/apiEndpoints';
import { useContext } from 'react';
import { ClientContext } from '../../context/ClientContext'; 
import { SearchBar, Table } from '../../components';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { clientId } = useContext(ClientContext); 

  // Fetch Accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get(ENDPOINTS.clientAccounts(clientId));
        setAccounts(response.data.accounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };
    fetchAccounts();
  }, [clientId]);

  const columns = ['Account ID', 'Patient', 'Dependent Nr', 'Guarantor', 'Guarantor ID', 'Balance'];
  const filteredAccounts = accounts.filter((account) =>
    Object.values(account).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {clientId ? 
        <div className='container-col'>
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <Table data={filteredAccounts} columns={columns} linkPrefix="accounts" idField="account_id"/>
        </div>
      : 
        <div> 
          Accounts Info Here
        </div> 
      }
    </>
  );
}
