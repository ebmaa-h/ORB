import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // For accessing profile_id from the URL
import axios from 'axios';
import { SearchBar, Table } from '../../components';
import ENDPOINTS from '../../config/apiEndpoints';

export default function ProfileDetails() {
  const { profileId } = useParams(); 
  const [profile, setProfile] = useState(null);
  const [dependents, setDependents] = useState([])
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');

  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(invoiceSearchTerm.toLowerCase())
  );

  // Fetch profile details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // console.log('Fetching profile data for ID:', profileId); // Log the profile ID being fetched
        const response = await axios.get(`${ENDPOINTS.profiles}/${profileId}`, {
          withCredentials: true,
        });
        
        // console.log('Profile data response:', response.data.profile); // Log the response data
        
        const { dependents, accounts, invoices, profileData } = response.data.profile;
        
        // Logging each extracted part
        // console.log('Dependents:', dependents);
        // console.log('Accounts:', accounts);
        console.log('Invoices:', invoices);
        // console.log('Profile Data:', profileData);

        setProfile(profileData || []);
        setDependents(dependents || []);
        setAccounts(accounts || []);
        setInvoices(invoices || []);
      } catch (error) {
        console.error('Error fetching profile details:', error);
      }
    };

    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  return (
    <>
      {profile ? (
        <>
          <div className="bg-white shadow rounded m-4 p-4 flex flex-row justify-between items-center text-center  text-gray-dark">
            <p><strong>Profile ID:</strong> {profile.profile_id}</p>
            <p><strong>Medical Aid Nr:</strong> {profile.medical_aid_nr}</p>
            <p><strong>Medical Aid:</strong> {profile.medical_aid_name} - {profile.plan_name}</p>
            <p><strong>Auth:</strong> {profile.authorization_nr}</p>
            <p><strong>Main Member:</strong> {profile.main_member_name}</p>
            <p><strong>Dependent Nr:</strong> {profile.main_member_dependent_nr}</p>
            <p><strong>Balance:</strong> {profile.profile_balance}</p>
          </div>

          <div className="bg-white shadow rounded m-4 p-4 gap-4 flex">
            {/* Accounts Table */}
            <div className='w-[50%] flex flex-col gap-4'>
              <h3 className=" uppercase font-bold">Accounts</h3>
              <Table
                data={accounts}
                columns={['Account ID', 'Doctor', 'Patient', 'Patient ID', 'Balance', 'Invoices']}
                linkPrefix="accounts"
                idField="account_id"
              />
  
            </div>
            {/* Dependents Table */}
            <div className='w-[50%]'>
              <h3 className=" uppercase font-bold pb-4">Dependents</h3>
              <Table
                data={dependents}
                columns={['Record ID','Name', 'Date of Birth', 'ID' ,'Gender' , 'Dependent Nr']}
                idField="person_id" 
                linkPrefix="records" 
              />
            </div>
          </div>

          {/* Invoices Table with Search */}
          <div className="bg-white shadow rounded m-4 p-4 flex flex-col gap-4">
            <h3 className=" uppercase font-bold">Invoices</h3>
            <SearchBar
              searchTerm={invoiceSearchTerm}
              setSearchTerm={setInvoiceSearchTerm}
            />
            {/* {console.log("DATA FOR TABLE ", filteredInvoices)} */}
            <Table
              data={filteredInvoices}
              columns={['Invoice ID', 'Patient', 'Patient ID', 'Guarantor', 'Guarantor ID', 'Balance', 'Date of Service', 'Status', 'Last Update']}
              linkPrefix="invoices"
              idField="invoice_id"
            />
          </div>
        </>
      ) : (
        <p>Loading profile details...</p>
      )}
    </>
  );
}
