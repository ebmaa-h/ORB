import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // For accessing profile_id from the URL
import axios from 'axios';
import { Nav, SearchBar, Table } from '../../components';
import ENDPOINTS from '../../config/apiEndpoints';

export default function ProfileDetails() {
  const { profileId } = useParams(); 
  const [profile, setProfile] = useState(null); // Stores the overall profile details
  const [dependents, setDependents] = useState([]); // Stores the dependents
  const [accounts, setAccounts] = useState([]); // Stores the accounts
  const [invoices, setInvoices] = useState([]); // Stores the invoices
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState(''); // Search term for filtering invoices

  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(invoiceSearchTerm.toLowerCase())
  );

  // Fetch profile details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('Fetching profile data for ID:', profileId); // Log the profile ID being fetched
        const response = await axios.get(`${ENDPOINTS.profiles}/${profileId}`, {
          withCredentials: true,
        });
        
        console.log('Profile data response:', response.data.profile); // Log the response data
        
        const { dependents, accounts, invoices, ...profileData } = response.data.profile;
        
        // Logging each extracted part
        // console.log('Dependents:', dependents);
        // console.log('Accounts:', accounts);
        // console.log('Invoices:', invoices);
        // console.log('Profile Data:', profileData);

        setProfile(profileData);
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
      <Nav />

      {profile ? (
        <>
          <div className="bg-white rounded m-4 p-4 flex flex-row justify-between items-center text-center text-sm text-gray-dark">
            <p><strong>Profile ID:</strong> {profile.profile_id}</p>
            <p><strong>Medical Aid Nr:</strong> {profile.medical_aid_nr}</p>
            <p><strong>Authorization Nr:</strong> {profile.authorization_nr}</p>
            <p><strong>Medical Aid:</strong> {profile.medical_aid_name} - {profile.plan_name}</p>
            <p><strong>Dependent Nr:</strong> {profile.main_member_dependent_nr
            }</p>
            <p><strong>Main Member:</strong> {profile.main_member_name
            }</p>
            <p><strong>ID:</strong> {profile.main_member_id_nr
            }</p>
          </div>

          <div className="bg-white rounded m-4 p-4 gap-4 flex">
            {/* Dependents Table */}
            <div className='w-[50%]'>
              <h3 className="text-sm uppercase font-bold pb-3">Accounts</h3>
              <Table
                data={accounts}
                columns={['Account ID', 'Doctor', 'Patient', 'ID', 'Balance', 'Invoices']}
                linkPrefix="accounts"
                idField="account_id"
              />
            </div>
            {/* Accounts Table */}
            <div className='w-[50%]'>
              <h3 className="text-sm uppercase font-bold pb-3">Dependents</h3>
              <Table
                data={dependents}
                columns={['Dependent ID', 'Dependent', 'Date of Birth', 'ID' ,'Dependent Nr', 'Accounts']}
                linkPrefix="dependents"
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
            {console.log("DATA FOR TABLE ", filteredInvoices)}
            <Table
              data={filteredInvoices}
              columns={['Invoice ID', 'Account ID', 'Profile ID', 'Patient', 'ID', 'Main Member', 'ID', 'Balance', 'Date of Service', 'Status', 'Doctor', 'Practice Nr']}
              linkPrefix="invoices"
            />
          </div>
        </>
      ) : (
        <p>Loading profile details...</p>
      )}
    </>
  );
}
