import { useEffect, useState } from 'react';
import axios from 'axios';
import ENDPOINTS from '../config/apiEndpoints';
import { useContext } from 'react';
import { ClientContext } from '../context/ClientContext'; 
import { SearchBar, Table } from '../components';

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { clientId } = useContext(ClientContext); 

  // Fetch Invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(ENDPOINTS.clientInvoices(clientId));
        setInvoices(response.data.invoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };
    if (clientId) {
      fetchInvoices();
    }
  }, [clientId]);

  const columns = ['Invoice Nr','File Nr','Auth Nr', 'Patient', 'Patient ID', 'Guarantor', 'Guarantor ID', 'Balance', 'Date of Service', 'Status', 'Last Update'];
  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {clientId ? (
        <div className='container-col'>
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <Table data={filteredInvoices} columns={columns} linkPrefix="invoices" idField="invoice_id"/>
        </div>
      ) : (
        <div className='container-col items-center'>
          <p>Select a client.</p>
        </div>
      )}
    </>
  );
}
