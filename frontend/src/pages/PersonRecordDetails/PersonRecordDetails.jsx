import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { Nav } from '../../components';
import { Button, InputField } from '../../components';

export default function PersonRecordDetails() {
  const { recordId } = useParams();
  const [record, setRecord] = useState({});

  // Fetch record details
  useEffect(() => {
    const getRecordDetails = async () => {
      try {
        const response = await axios.get(`${ENDPOINTS.records}/${recordId}`, {
          withCredentials: true,
        });
        setRecord(response.data.record[0] || {});
      } catch (error) {
        console.error('Error fetching record details:', error);
      }
    };

    if (recordId) {
      getRecordDetails();
    }
  }, [recordId]);

  // Handle input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    setRecord((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  return (
    <>
      <Nav />

      {record ? (
        <div className="flex flex-col gap-4 m-4 p-4 bg-white rounded text-gray-dark">
          {/* Name */}
          <div className='flex flex-row gap-4'>
            <InputField
              label="Title"
              value={record.title}
              id="title"
              onChange={handleChange}
            />
            <InputField
              label="Name"
              value={record.first}
              id="first"
              onChange={handleChange}
            />
            <InputField
              label="Surname"
              value={record.last}
              id="last"
              onChange={handleChange}
            />
          </div>

          {/* Date of Birth */}
          <div className='flex flex-row gap-4'>
            <InputField
              label="Date of Birth"
              value={record.date_of_birth}
              id="date_of_birth"
              onChange={handleChange}
            />
            <InputField
              label="ID Number"
              value={record.id_nr}
              id="id_nr"
              onChange={handleChange}
            />
            <InputField
              label="Gender"
              value={record.gender}
              id="gender"
              onChange={handleChange}
            />
          </div>

          {/* Contact Information */}
          <div className='flex flex-row gap-4'>
            <InputField
              label="Cell Number"
              value={record.cell_nr}
              id="cell_nr"
              onChange={handleChange}
            />
            <InputField
              label="Tel Number"
              value={record.tell_nr}
              id="tell_nr"
              onChange={handleChange}
            />
            <InputField
              label="Work Number"
              value={record.work_nr}
              id="work_nr"
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div className='flex flex-row gap-4'>
            <InputField
              label="Email"
              value={record.email}
              id="email"
              onChange={handleChange}
            />
            <InputField
              label="Postal Address"
              value={record.post_address || 'N/A'}
              id="post_address"
              onChange={handleChange}
            />
            <InputField
              label="Street Address"
              value={record.str_address || 'N/A'}
              id="str_address"
              onChange={handleChange}
            />
          </div>

          <Button
            btnName="Update"
            className='w-[125px] text-sm'
          />
        </div>
      ) : (
        <p>Loading record details...</p>
      )}
    </>
  );
}
