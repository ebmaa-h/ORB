import { useEffect, useState } from 'react';
import axiosClient from '../config/axiosClient';
import ENDPOINTS from '../config/apiEndpoints';
import { SearchBar, Table } from '../components';

export default function Records() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch record records on component mount
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axiosClient.get(ENDPOINTS.records);
        console.log(response)
        setRecords(response.data.records);
      } catch (error) {
        console.error('Error fetching records:', error);
      }
    };
    fetchRecords();
  }, []);

  const columns = ['Record ID', 'Name','Gender' , 'Date of Birth', 'ID'];
  const filteredRecords = records.filter((record) =>
    Object.values(record).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className='container-col'>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <Table 
          data={filteredRecords.map(record => ({
            ...record
          }))}
          columns={columns} 
          idField="record_id" 
          linkPrefix="records" 
        />
      </div>
    </>
  );
}
