import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // For accessing account_id from the URL
import axios from 'axios';
import { Nav, SearchBar, Table } from '../../components';
import ENDPOINTS from '../../config/apiEndpoints';

export default function AccountDetails() {
  const { accountId } = useParams(); 
  const [account, setAccount] = useState({}); // Stores the accounts
  const [invoices, setInvoices] = useState([]); // Stores the invoices
  const [patient, setPatient] = useState([]); // Stores the invoices
  const [member, setMember] = useState([]); // Stores the invoices
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState(''); // Search term for filtering invoices

  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(invoiceSearchTerm.toLowerCase())
  );

  // Fetch account details
  useEffect(() => {
    const fetchAccountDetails  = async () => {
      try {
        console.log('Fetching account data for ID:', accountId); // Log the account ID being fetched
        const response = await axios.get(`${ENDPOINTS.accounts}/${accountId}`, {
          withCredentials: true,
        });

        const { account, invoices, member, patient } = response.data.account;

        console.log("Account:", response.data);
        // console.log("Account:", response.data.account);
        // console.log("Invoices:", response.data.account.invoices);
        // console.log("Member:", response.data.member);
        // console.log("Patient:", response.data.patient);

        setAccount(account || {});
        setInvoices(invoices || []);
        setMember(member || {});
        setPatient(patient || {});

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
          <div className="bg-white rounded m-4 p-4 flex flex-row justify-between items-center text-center text-sm text-gray-dark">
            <p><strong>Account ID:</strong> {account.account_id}</p>
            <p><strong>Profile ID:</strong> {account.profile_id}</p>
            <p><strong>Medical Aid:</strong></p>
            <p><strong>Medical Aid Nr:</strong> {account.medical_aid_nr}</p>
            <p><strong>Doctor:</strong> {account.doctor_name}</p>
            <p><strong>Auth:</strong> {account.authorization_nr}</p>
            <p><strong>Balance:</strong> 0.00</p>
          </div>

          <div className="bg-white rounded m-4 p-4 gap-4 flex">
            {/* Member Table */}
            <div className='w-[50%]'>
              <h3 className="text-sm uppercase font-bold pb-3">Main Member / GUARANTOR</h3>
              <Table
                data={Array.isArray(member) ? member : [member]} 
                columns={['Record ID', 'Name', 'Cell', 'Email', 'Date of Birth', 'Gender']}
                linkPrefix="records"
                idField="record_id"
              />
            </div>
            {/* Patient Table */}
            <div className='w-[50%]'>
              <h3 className="text-sm uppercase font-bold pb-3">Patient</h3>
              <Table
                data={Array.isArray(patient) ? patient : [patient]} 
                columns={['Record ID', 'Name', 'Cell', 'Email', 'Date of Birth', 'Gender']}
                linkPrefix="records"
                idField="record_id"
              />
            </div>
          </div>

          {/* Invoices Table with Search */}
          <div className="bg-white rounded m-4 p-4 flex flex-col gap-4">
            <h3 className="text-sm uppercase font-bold">Invoices</h3>
            <SearchBar
              searchTerm={invoiceSearchTerm}
              setSearchTerm={setInvoiceSearchTerm}
            />
            {/* {console.log("DATA FOR TABLE ", filteredInvoices)} */}
            <Table
              data={filteredInvoices}
              columns={['Invoice ID', 'Account ID', 'Profile ID', 'Patient', 'ID', 'Main Member', 'ID', 'Balance', 'Date of Service', 'Status', 'Doctor', 'Practice Nr']}
              linkPrefix="invoices"
              idField="invoice_id"
            />
          </div>
        </>
      ) : (
        <p>Loading account details...</p>
      )}
    </>
  );
}
