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

        console.log(response.data.record.addresses);


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


  // Handle input change for addresses
  const handleAddressChange = (id, field, value) => {
    if (field === 'is_domicilium') {
      // Set all other addresses' is_domicilium to false
      setAddresses((prevAddresses) =>
        prevAddresses.map((address) => ({
          ...address,
          is_domicilium: address.address_id === id ? value : false,
        }))
      );
    } else {
      // Update specific field for the selected address
      setAddresses((prevAddresses) =>
        prevAddresses.map((address) =>
          address.address_id === id ? { ...address, [field]: value } : address
        )
      );
    }
  };

  return (
    <>
      {record ? (
        <>
          <div className="m-4 p-4 bg-white rounded text-gray-dark">
            {/* Top container */}
            <div className='flex flex-row gap-4'>
              {/* Details*/}
              <div className='flex flex-col gap-4 w-full'>
                <h3 className=" uppercase font-bold pb-4">Details</h3>
                <div className="grid grid-cols-3 gap-4">
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
                    label="ID Nr"
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
                    label="Cell Nr"
                    value={record.cell_nr}
                    id="cell_nr"
                    onChange={handleChange}
                  />
                  <InputField
                    label="Tel Nr"
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
              </div>

              {/* Addresses */}
              <div className="flex flex-col gap-4 w-[40%]">
                <h3 className=" uppercase font-bold pb-4">Addresses</h3>
                <div className='flex flex-col gap-4'>
                  {addresses.map((address) => (
                    <div
                      key={address.address_id}
                      className="flex items-center gap-4"
                    >
                      <input
                        type="checkbox"
                        checked={address.is_domicilium}
                        onChange={(e) =>
                          handleAddressChange(
                            address.address_id,
                            'is_domicilium',
                            e.target.checked
                          )
                        }
                        className="appearance-none w-3 h-3 border border-gray-300 cursor-pointer checked:bg-ebmaa-purple checked:border-none checked:before:content-['✔'] checked:before:text-white checked:before:block checked:before:text-center checked:before:text-uxss"
                        />

                      <InputField
                        value={address.address}
                        classes=" w-[500px]"
                        id={`address-${address.address_id}`}
                        onChange={(e) =>
                          handleAddressChange(
                            address.address_id,
                            'address',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons container / bottom */}
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
            
          {/* Accounts & Invoices container*/}
          <div className="flex flex-row gap-4 m-4 p-4 bg-white rounded text-gray-dark">
            <div className='w-[50%] flex flex-col'>
              <h3 className=" uppercase font-bold pb-4">Accounts</h3>
              <Table 
                data={accounts}
                columns={['Account ID','Balance', 'Doctor', 'Active Invoices']}
                linkPrefix="accounts"
                idField="account_id"
              />
            </div>
            <div className='w-[50%] flex flex-col'>
              <h3 className=" uppercase font-bold pb-4">Invoices</h3>
              <Table 
                data={invoices}
                columns={['Invoice ID','Date of Service', 'Status', 'Balance' ,'Date Created' , 'Date Updated']}
                linkPrefix="invoices"
                idField="invoice_id"
              />
            </div>
          </div>


        </>
      ) : (
        <p>Loading record details...</p>
      )}
    </>
  );
}
