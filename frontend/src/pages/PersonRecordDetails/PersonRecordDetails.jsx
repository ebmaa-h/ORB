import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { InputField } from '../../components';
import BackButton from '../../utility/BackButton';
import { Table } from '../../components';

export default function PersonRecordDetails() {
  const { recordId } = useParams();
  const [record, setRecord] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Fetch record details
  useEffect(() => {
    const getRecordDetails = async () => {
      try {
        const response = await axios.get(`${ENDPOINTS.records}/${recordId}`, {
          withCredentials: true,
        });

        // console.log(response.data.record.person);

        // Extract
        const { person, addresses, accounts, invoices } = response.data.record;
    
        // Set
        setRecord(person || []);
        setAddresses(addresses || []);
        setAccounts(accounts || []);
        setInvoices(invoices || []);
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
      {record ? (
        <div className="flex flex-col gap-4 m-4 p-4 bg-white rounded text-gray-dark">
          <div className='flex gap-4 w-full'>
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
            <InputField
              label="Email"
              value={record.email}
              id="email"
              onChange={handleChange}
            />
          </div>

          <div className="bg-white rounded gap-4 flex">
            <div className='w-[50%] flex flex-col'>
              <h3 className="text-sm uppercase font-bold pb-4">Accounts</h3>
              <Table 
                data={accounts}
                columns={['Account ID','Balance', 'Doctor', 'Active Invoices']}
                linkPrefix="accounts"
                idField="account_id"
              />
            </div>
              <div className='w-[50%] flex flex-col'>
              <h3 className="text-sm uppercase font-bold pb-4">Invoices</h3>
              <Table 
                data={invoices}
                columns={['Invoice ID','Date of Service', 'Status', 'Balance' ,'Date Created' , 'Date Updated']}
                linkPrefix="invoices"
                idField="invoice_id"
                />
              </div>
          </div>
            <div className='flex justify-end gap-4'>
              <BackButton />
              <button
                type='submit'
                className='btn-class w-[100px]'
              >
                Update
              </button>
            </div>
        </div>
      ) : (
        <p>Loading record details...</p>
      )}
    </>
  );
}
