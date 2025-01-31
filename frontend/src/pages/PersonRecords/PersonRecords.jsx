import { useEffect, useState } from 'react';
import axios from 'axios';
import ENDPOINTS from '../../config/apiEndpoints';
import { SearchBar, Table } from '../../components';

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

  const columns = ['Person ID', 'Name','Gender' , 'Date of Birth', 'ID'];
  const filteredPersons = persons.filter((person) =>
    Object.values(person).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className='container-col'>
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
