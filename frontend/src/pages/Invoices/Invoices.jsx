import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext'; 
import axios from 'axios';
import { SearchBar, Table } from '../../components';
// import { Link } from "react-router-dom";

export default function Invoices() {
  const { user } = useContext(UserContext);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get('http://localhost:4000/invoices');
        setInvoices(response.data.invoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };
    fetchInvoices();
  }, []);

  const columns = ['Invoice ID', 'Profile ID', 'Amount', 'Status', 'Date Issued'];
  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className='bg-white rounded m-6 p-6'>
        <p>Hello {user.first}.</p>
      </div>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <Table data={filteredInvoices} columns={columns} />
    </>
  );
}
