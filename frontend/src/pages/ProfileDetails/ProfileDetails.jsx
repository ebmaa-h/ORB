import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // For accessing profile_id from the URL
import axios from 'axios';
import { SearchBar, Table } from '../../components';

export default function ProfileDetails() {
  const { profile_id } = useParams(); // Assume profile_id is passed in the URL
  const [profile, setProfile] = useState(null); // Stores the overall profile details
  const [dependents, setDependents] = useState([]); // Stores the dependents
  const [accounts, setAccounts] = useState([]); // Stores the accounts
  const [invoices, setInvoices] = useState([]); // Stores the invoices
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState(''); // Search term for filtering invoices

  useEffect(() => {
    const fetchProfileDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/profiles/${profile_id}`);
        const { dependents, accounts, invoices, ...profileData } = response.data;
        setProfile(profileData);
        setDependents(dependents || []);
        setAccounts(accounts || []);
        setInvoices(invoices || []);
      } catch (error) {
        console.error('Error fetching profile details:', error);
      }
    };
    fetchProfileDetails();
  }, [profile_id]);

  const filteredInvoices = invoices.filter((invoice) =>
    Object.values(invoice).join(' ').toLowerCase().includes(invoiceSearchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {profile && (
        <div className="bg-white rounded p-4 mb-6">
          <h2 className="text-2xl font-bold">Profile Details</h2>
          <p><strong>Medical Aid Nr:</strong> {profile.medical_aid_nr}</p>
          <p><strong>Authorization Nr:</strong> {profile.authorization_nr}</p>
          <p><strong>Medical Aid:</strong> {profile.medical_aid_name}</p>
          <p><strong>Plan:</strong> {profile.plan_name}</p>
          <p><strong>Main Member:</strong> {profile.main_member_name}</p>
        </div>
      )}

      {/* Dependents Table */}
      <div className="bg-white rounded p-4 mb-6">
        <h3 className="text-xl font-bold mb-4">Dependents</h3>
        <Table
          data={dependents}
          columns={['Dependent ID', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Dependent Nr', 'Is Main Member']}
          linkPrefix="dependents"
        />
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded p-4 mb-6">
        <h3 className="text-xl font-bold mb-4">Accounts</h3>
        <Table
          data={accounts}
          columns={['Account ID', 'Doctor ID', 'Main Member ID', 'Dependent ID']}
          linkPrefix="accounts"
        />
      </div>

      {/* Invoices Table with Search */}
      <div className="bg-white rounded p-4">
        <h3 className="text-xl font-bold mb-4">Invoices</h3>
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
    </div>
  );
}
