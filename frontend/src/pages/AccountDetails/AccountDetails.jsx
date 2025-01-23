import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { SearchBar, Table } from '../../components';
import ENDPOINTS from '../../config/apiEndpoints';
import { useNavigate } from 'react-router-dom';

export default function AccountDetails() {
  const { accountId } = useParams(); 
  const [account, setAccount] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [patient, setPatient] = useState([]); 
  const [member, setMember] = useState([]);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const navigate = useNavigate();

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

      {account && Object.keys(account).length > 0 ? (
        <>
          <div className="bg-white rounded m-4 p-4 flex flex-row justify-between items-center text-center  text-gray-dark">
            <p>
              {/* <Button
                btnName={`Profile ID: ${account.profile_id}`}

                className=""
              /> */}
  
              <button
                value={`Profile ID: ${account.profile_id}`}
                onClick={() => navigate(`/profiles/${account.profile_id}`)} 
                type='submit'
                className='btn-class'
                aria-label='Log In' // Accessibility
              >
                {`Profile ID: ${account.profile_id}`}
              </button>
            </p>
            <p><strong>Account ID:</strong> {account.account_id}</p>
            <p><strong>Medical Aid Nr:</strong> {account.medical_aid_nr}</p>
            <p><strong>Medical Aid:</strong> {account.medical_aid_name} - {account.plan_name}</p>
            <p><strong>Doctor:</strong> {account.doctor_name}</p>
            <p><strong>Auth:</strong> {account.authorization_nr}</p>
            <p><strong>Balance:</strong> 0.00</p>
          </div>

          <div className="bg-white rounded m-4 p-4 gap-4 flex">
            {/* Member Table */}
            <div className='w-[50%]'>
              <h3 className=" uppercase font-bold pb-4">GUARANTOR</h3>
              <Table
                data={Array.isArray(member) ? member : [member]} 
                columns={['Record ID', 'Name', 'Cell', 'Email', 'Date of Birth', 'Gender', 'Depedent Nr']}
                idField="person_id" 
                linkPrefix="records" 
              />
            </div>
            {/* Patient Table */}
            <div className='w-[50%]'>
              <h3 className=" uppercase font-bold pb-4">Patient</h3>
              <Table
                data={Array.isArray(patient) ? patient : [patient]} 
                columns={['Record ID', 'Name', 'Cell', 'Email', 'Date of Birth', 'Gender', 'Dependent Nr']}
                idField="person_id" 
                linkPrefix="records" 
              />
            </div>
          </div>

          {/* Invoices Table with Search */}
          <div className="bg-white rounded m-4 p-4 flex flex-col gap-4">
            <h3 className=" uppercase font-bold">Invoices</h3>
            <SearchBar
              searchTerm={invoiceSearchTerm}
              setSearchTerm={setInvoiceSearchTerm}
            />
            {/* {console.log("DATA FOR TABLE ", filteredInvoices)} */}
            <Table
              data={filteredInvoices}
              columns={['Invoice ID','Patient', 'Patient ID', 'Main Member', 'Guarantor ID', 'Balance', 'Date of Service', 'Status']}
              linkPrefix="invoices"
              idField="invoice_id"
            />
            <div className="flex justify-start">
             {/* <button
                type='submit'
                className=' py-1 px-2 mx-2 min-w-[100px] border border-white rounded hover:border hover:border-ebmaa-purple text-center'
                aria-label='New Invoice' // Accessibility
              >
                New Invoice
              </button> */}
            </div>
          </div>
        </>
      ) : (
        <p>Loading account details...</p>
      )}
    </>
  );
}
