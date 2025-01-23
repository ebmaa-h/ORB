import { useEffect, useState } from 'react';
import axios from 'axios';
import ENDPOINTS from '../../config/apiEndpoints';
import { useContext } from 'react';
import { DoctorContext } from '../../context/DoctorContext'; 
import { SearchBar, Table } from '../../components';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { doctorId } = useContext(DoctorContext); 

  // Fetch Invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(ENDPOINTS.doctorInvoices(doctorId));
        setInvoices(response.data.invoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };
    fetchInvoices();
  }, [doctorId]);

  const columns = ['Invoice Nr', 'Patient', 'Patient ID', 'Guarantor', 'Guarantor ID', 'Balance', 'Date of Service', 'Status', 'Last Update'];
  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {doctorId ? 
        <div className='flex flex-col gap-4 m-4 p-4 bg-white shadow rounded'>
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <Table data={filteredInvoices} columns={columns} linkPrefix="invoices" idField="invoice_id"/>
        </div>
        : 
        <div> 
          Invoice Info Here
        </div> 
        }
    </>
  );
}
