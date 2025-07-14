import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../config/axiosClient';
import { useContext } from 'react';
import { ClientContext } from '../context/ClientContext';
import { SearchBar, Table, BackButton, NotesAndLogs } from '../components';
import ENDPOINTS from '../config/apiEndpoints';
import { useNavigate } from 'react-router-dom';

export default function ClientAccount() {
  const { clientId } = useContext(ClientContext);
  const { accountId } = useParams(); 
  const [account, setAccount] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [patient, setPatient] = useState({}); 
  const [member, setMember] = useState({});
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(invoiceSearchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!clientId) {
      navigate('/accounts');
    }
  }, [clientId]);

  // Fetch account details
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        console.log('requesting with', accountId);
        const response = await axiosClient.get(ENDPOINTS.clientAccount(clientId, accountId), {
          withCredentials: true,
        });

        const data = response.data.account; 
        console.log("response",response.data.account)
        const { account, invoices, member, patient } = data;

        setAccount(account || {});
        setInvoices(invoices || {});
        setMember(member || {});
        setPatient(patient || {});

      } catch (error) {
        console.error('Error fetching account details:', error);
      }
    };

    if (clientId && accountId) {
      fetchAccount();
    }
  }, [accountId, clientId]);

  return (
    <>

      {account.account_id ? (
        <>
          <div className='container-row justify-between items-center'>

            {/* <p
                onClick={() => navigate(`/profiles/${account.profile_id}`)}
                className="cursor-pointer underline text-blue-600 hover:text-blue-800"
              >
                View Profile
              </p> */}

            <p><strong>Account ID:</strong> {account.account_id}</p>
            <p><strong>Medical Aid Nr:</strong> {account.medical_aid_nr}</p>
            <p><strong>Medical Aid:</strong> {account.medical_aid_name} - {account.plan_name}</p>
            <p><strong>Client:</strong> {account.client_name}</p>
            <p><strong>Balance:</strong> 0.00</p>
            {/* <span className="material-symbols-outlined">two_pager</span> */}
          </div>

          <div className='container-row'>
            {/* Member Table */}
            <div className='w-[50%]'>
              <h3 className=" uppercase font-bold mb-4">GUARANTOR</h3>
              <Table
                data={Array.isArray(member) ? member : [member]} 
                columns={['Record ID', 'Name', 'ID', 'Dependent Nr']}
                // linkPrefix="records" 
                idField="record_id"
              />
            </div>
            {/* Patient Table */}
            <div className='w-[50%]'>
              <h3 className=" uppercase font-bold mb-4">Patient</h3>
              <Table
                data={Array.isArray(patient) ? patient : [patient]} 
                columns={['Record ID', 'Name', 'ID', 'Dependent Nr']}
                // linkPrefix="records" 
                idField="record_id"
              />
            </div>
          </div>

          {/* Invoices Table with Search */}
          <div className="container-col">
            <h3 className="uppercase font-bold">Invoices</h3>
            <SearchBar
              searchTerm={invoiceSearchTerm}
              setSearchTerm={setInvoiceSearchTerm}
            />
            {/* {console.log("DATA FOR TABLE ", filteredInvoices)} */}
            <Table
              data={filteredInvoices}
              columns={['Invoice ID','File Nr','Patient', 'Patient ID', 'Main Member', 'Guarantor ID', 'Balance', 'Date of Service', 'Status']}
              linkPrefix="invoices"
              idField="invoice_id"
            />
            <div className="flex justify-end gap-4">
              <BackButton />
              {/* Nav to invoice page */}
              <button
                type="submit"
                className="btn-class w-[100px]"
                onClick={() => navigate(`/invoices/new/${account.account_id}`)}
              >
                {console.log("Account ID:", account.account_id)}
                New Invoice
              </button>

            </div>
          </div>

          <NotesAndLogs 
            tableName='accounts'
            id={account.account_id}
            
          />
        </>
      ) : (
        <div className='container-col'>
          <p>Select a client.</p>
        </div>
      )}
    </>
  );
}
