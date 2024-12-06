import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext'; 
import axios from 'axios';
import { Nav, SearchBar, Table } from '../../components';
// import { Link } from "react-router-dom";

export default function Invoices() {
  const { user } = useContext(UserContext);
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get('http://167.99.196.172/invoices');
        console.log(response)
        setInvoices(response.data.invoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };
    fetchInvoices();
  }, []);

  const columns = ['Invoice ID', 'Account ID','Date of Service' , 'Balance', 'Date Created', 'Date Updated', 'Doctor', 'Pratice Nr', 'Patient', 'ID', 'Member', 'ID'];
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
