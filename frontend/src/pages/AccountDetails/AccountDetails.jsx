import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // For accessing account_id from the URL
import axios from 'axios';
import { Nav, SearchBar, Table } from '../../components';

export default function AccountDetails() {
  const { accountId } = useParams(); 
  const [account, setAccount] = useState({}); // Stores the accounts
  const [invoices, setInvoices] = useState([]); // Stores the invoices
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState(''); // Search term for filtering invoices

  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(invoiceSearchTerm.toLowerCase())
  );

  // Fetch account details
  useEffect(() => {
    const fetchAccountDetails  = async () => {
      try {
        console.log('Fetching account data for ID:', accountId); // Log the account ID being fetched
        const response = await axios.get(`http://167.99.196.172/accounts/${accountId}`, {
          withCredentials: true,
        });

        const { account, invoices } = response.data.account; 

        console.log("account",account);
        console.log("invoices",invoices);
        console.log("response.data.account",response.data.account);

        setAccount(account || {});
        setInvoices(invoices || []);
      } catch (error) {
        console.error('Error fetching account details:', error);
      }
    };

    if (accountId) {
      fetchAccountDetails ();
    }
  }, [accountId]);

  return (
    <>
      <Nav />

      {account && Object.keys(account).length > 0 ? (
        <>
          {/* Accounts Table */}
          <div className="bg-white rounded m-3">
            <h3 className="text-xl font-bold pt-3 pl-3">Account</h3>
            <Table
              data={[account]}
              columns={['Account ID', 'Balance', 'Doctor', 'Practice Nr', 'Patient', 'Patient ID', 'Balance', 'Balance', 'Balance', 'Balance', 'Auth', 'M/A Number', 'M/A', 'M/A Plan', 'Balance']}
              linkPrefix="accounts"
              idField="account_id"
            />
          </div>

          {/* Invoices Table with Search */}
          <div className="bg-white rounded m-3">
            <h3 className="text-xl font-bold pt-3 pl-3">Invoices</h3>
            <SearchBar
              searchTerm={invoiceSearchTerm}
              setSearchTerm={setInvoiceSearchTerm}
            />

            <Table
              data={filteredInvoices}
              columns={['Invoice ID', 'Date of Service', 'Status', 'Balance']}
              linkPrefix="invoices"
            />
          </div>
        </>
      ) : (
        <p>Loading account details...</p>
      )}
    </>
  );
}
