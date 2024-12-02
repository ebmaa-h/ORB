import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext'; 
import axios from 'axios';
import { SearchBar, Table } from '../../components';
import { Link } from "react-router-dom";

export default function Profiles() {
  const { user } = useContext(UserContext);
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Profiles on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axios.get('http://localhost:4000/profiles');
        setProfiles(response.data.profiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };
    fetchProfiles();
  }, []);

  const columns = ['Profile ID', 'Medical Aid Nr', 'Auth Nr', 'Medical Aid', 'Plan', 'Main Member', 'Dependents', 'Accounts'];
  const filteredProfiles = profiles.filter((profile) =>
    Object.values(profile).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log (filteredProfiles);
  return (
    <>
      <div className='bg-white rounded m-6 p-6'>
        <p>Hello {user.first}.</p>
      </div>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <Table data={filteredProfiles} columns={columns} linkPrefix="profiles" idField="profile_id"/>
    </>
  );
}
