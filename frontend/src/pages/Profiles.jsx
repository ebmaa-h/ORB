import { useEffect, useState } from 'react';
import axiosClient from '../config/axiosClient';
import { SearchBar, Table } from '../components';
import ENDPOINTS from '../config/apiEndpoints';

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Profiles on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axiosClient.get(ENDPOINTS.profiles);
        setProfiles(response.data.profiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };
    fetchProfiles();
  }, []);

  const columns = ['Profile ID', 'Main Member', 'Medical Aid', 'Plan', 'Medical Aid Number', 'Balance'];
  const filteredProfiles = profiles.filter((profile) =>
    Object.values(profile).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log (filteredProfiles);
  return (
    <>
      <div className='container-col'>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <Table data={filteredProfiles} columns={columns} linkPrefix="profiles" idField="profile_id"/>
      </div>
    </>
  );
}
