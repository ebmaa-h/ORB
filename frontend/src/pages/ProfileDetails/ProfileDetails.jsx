import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // For accessing profile_id from the URL
import axios from 'axios';
import { SearchBar, Table } from '../../components';

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
        const response = await axios.get(`http://localhost:4000/profiles/${profileId}`, {
          withCredentials: true,
        });
        
        console.log('Profile data response:', response.data.profile); // Log the response data
        
        const { dependents, accounts, invoices, ...profileData } = response.data.profile;
        
        // Logging each extracted part
        console.log('Dependents:', dependents);
        console.log('Accounts:', accounts);
        console.log('Invoices:', invoices);
        console.log('Profile Data:', profileData);

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
      <div className="bg-white rounded m-6 p-6">
        <Link
          to={`/profiles`}
          className="text-blue-500 underline hover:text-blue-700"
        >
          Back to Profiles
        </Link>
      </div>

      {profile ? (
        <>
          <div className="bg-white rounded p-6 m-6">
            <h2 className="text-2xl font-bold">Profile Details</h2>
            <p><strong>Medical Aid Nr:</strong> {profile.medical_aid_nr}</p>
            <p><strong>Authorization Nr:</strong> {profile.authorization_nr}</p>
            <p><strong>Medical Aid:</strong> {profile.medical_aid_name}</p>
            <p><strong>Plan:</strong> {profile.plan_name}</p>
            <p><strong>Main Member:</strong> {profile.main_member_name}</p>
          </div>

          {/* Dependents Table */}
          <div className="bg-white rounded p-6 m-6">
            <h3 className="text-xl font-bold m-6">Dependents</h3>
            <Table
              data={dependents}
              columns={['Dependent ID', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Dependent Nr', 'Is Main Member']}
              linkPrefix="dependents"
            />
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded p-6 m-6">
            <h3 className="text-xl font-bold m-6">Accounts</h3>
            <Table
              data={accounts}
              columns={['Account ID', 'Doctor ID', 'Doctor', 'Main Member ID', 'Main Member', 'Dependent ID', 'Patient']}
              linkPrefix="accounts"
            />
          </div>

          {/* Invoices Table with Search */}
          <div className="bg-white rounded p-6 m-6">
            <h3 className="text-xl font-bold m-6">Invoices</h3>
            <SearchBar
              searchTerm={invoiceSearchTerm}
              setSearchTerm={setInvoiceSearchTerm}
            />
            <Table
              data={filteredInvoices}
              columns={['Invoice ID', 'Date of Service', 'Status', 'Patient Snapshot', 'Member Snapshot']}
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
