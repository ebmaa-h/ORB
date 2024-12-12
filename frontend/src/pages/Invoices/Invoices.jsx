import { useEffect, useState } from 'react';
import axios from 'axios';
import ENDPOINTS from '../../config/apiEndpoints';
import { Nav, SearchBar, Table } from '../../components';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(ENDPOINTS.invoices);
        console.log(response)
        setInvoices(response.data.invoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };
    fetchInvoices();
  }, []);

  const columns = ['Invoice ID', 'Account ID', 'Patient', 'Patient ID', 'Guarantor', 'Guarantor ID', 'Balance', 'Date of Service', 'Status', 'Doctor', 'Practice Nr', 'Last Update'];

  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Nav />
      <div className='flex flex-col gap-4 m-4 p-4 bg-white rounded'>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <Table 
          data={filteredInvoices.map(invoice => ({
            ...invoice
          }))}
          columns={columns} 
          idField="invoice_id" 
          linkPrefix="invoices" 
        />
      </div>
    </>
  );
}
