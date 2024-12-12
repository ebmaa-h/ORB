import { useEffect, useState } from 'react';
import axios from 'axios';
import ENDPOINTS from '../../config/apiEndpoints';
import { Nav, SearchBar, Table } from '../../components';

export default function PersonRecords() {
  const [persons, setPersons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch person records on component mount
  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const response = await axios.get(ENDPOINTS.records);
        console.log(response)
        setPersons(response.data.persons);
      } catch (error) {
        console.error('Error fetching persons:', error);
      }
    };
    fetchPersons();
  }, []);

  const columns = ['Person ID', 'Name','Gender' , 'Date of Birth', 'ID', 'Email',  'Date Created'];
  const filteredPersons = persons.filter((person) =>
    Object.values(person).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Nav />
      <div className='flex flex-col gap-4 m-4 p-4 bg-white rounded'>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <Table 
          data={filteredPersons.map(person => ({
            ...person
          }))}
          columns={columns} 
          idField="person_id" 
          linkPrefix="records" 
        />
      </div>
    </>
  );
}
