import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { Nav } from '../../components';

export default function PersonRecordDetails() {
  const { recordId } = useParams(); 
  const [record, setRecord] = useState({}); // Stores the record


  // Fetch record details
  useEffect(() => {
    const getRecordDetails  = async () => {
      try {
        console.log('Fetching record data for ID:', recordId); // Log the record ID being fetched
        const response = await axios.get(`${ENDPOINTS.records}/${recordId}`, {
          withCredentials: true,
        });

        const { records } = response.data.record; 

        console.log("records",records);

        setRecord(record || []);
      } catch (error) {
        console.error('Error fetching record details:', error);
      }
    };

    if (recordId) {
      getRecordDetails ();
    }
  }, [recordId]);

  return (
    <>
      <Nav />

      {record && Object.keys(record).length > 0 ? (
        <>
          {/* Record */}
          <div className="bg-white rounded m-3">
            {/* Will render record here */}
          </div>
        </>
      ) : (
        <p>Loading record details...</p>
      )}
    </>
  );
}
