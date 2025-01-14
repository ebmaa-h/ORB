import { useEffect, useState } from 'react';
import axios from 'axios';
import { SearchBar, Table } from '../../components';
import ENDPOINTS from '../../config/apiEndpoints';

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Profiles on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axios.get(ENDPOINTS.profiles);
        setProfiles(response.data.profiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };
    fetchProfiles();
  }, []);

  const columns = ['Profile ID', 'Main Member', 'Medical Aid', 'Plan', 'Medical Aid Number', 'Auth', 'Balance', 'Accounts', 'Dependents', 'Invoices'];
  const filteredProfiles = profiles.filter((profile) =>
    Object.values(profile).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log (filteredProfiles);
  return (
    <>
      <div className='flex flex-col gap-4 m-4 p-4 bg-white rounded'>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <Table data={filteredProfiles} columns={columns} linkPrefix="profiles" idField="profile_id"/>
      </div>
    </>
  );
}
