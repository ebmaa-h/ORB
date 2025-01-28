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

  useEffect(() => {
    const getRecordDetails = async () => {
      try {
        const response = await axios.get(`${ENDPOINTS.records}/${recordId}`, {
          withCredentials: true,
        });

        const { person, addresses, accounts, invoices } = response.data.record;

        setRecord(person || {});
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

  const handleChange = (e) => {
    const { id, value } = e.target;
    setRecord((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleAddressChange = (id, field, value) => {
    if (field === 'is_domicilium') {
      setAddresses((prevAddresses) =>
        prevAddresses.map((address) => ({
          ...address,
          is_domicilium: address.address_id === id ? value : false,
        }))
      );
    } else {
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

          <div className="flex gap-4">
            {/* Left Container: Details and Addresses */}
            <div className="container-col">
              {/* Record details */}
              <h3 className="uppercase font-bold">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Title" value={record.title} id="title" onChange={handleChange} />
                <InputField label="Name" value={record.first} id="first" onChange={handleChange} />
                <InputField label="Surname" value={record.last} id="last" onChange={handleChange} />
                <InputField label="Date of Birth" value={record.date_of_birth} id="date_of_birth" onChange={handleChange} />
                <InputField label="ID Nr" value={record.id_nr} id="id_nr" onChange={handleChange} />
                <InputField label="Gender" value={record.gender} id="gender" onChange={handleChange} />
                <InputField label="Cell Nr" value={record.cell_nr} id="cell_nr" onChange={handleChange} />
                <InputField label="Tel Nr" value={record.tell_nr} id="tell_nr" onChange={handleChange} />
                <InputField label="Work Number" value={record.work_nr} id="work_nr" onChange={handleChange} />
                <InputField label="Email" value={record.email} id="email" onChange={handleChange} />
              </div>

              {/* Record addresses */}
              <div className="flex flex-col gap-4">
              <h3 className="font-bold">Addresses</h3>
                  {addresses.map((address) => (
                    <div key={address.address_id} className=" grid grid-cols-1">
                      <input
                        type="checkbox"
                        checked={address.is_domicilium}
                        onChange={(e) =>
                          handleAddressChange(address.address_id, 'is_domicilium', e.target.checked)
                        }
                        className="w-4 h-4 checked:bg-ebmaa-purple"
                      />
                      <InputField
                        value={address.address}
                        classes="flex-1"
                        id={`address-${address.address_id}`}
                        onChange={(e) =>
                          handleAddressChange(address.address_id, 'address', e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

            {/* Right Container: Accounts and Invoices */}
            <div className="container-col justify-between">
              <div className="">
                <h3 className="uppercase font-bold pb-4">Accounts</h3>
                <Table
                  data={accounts}
                  columns={['Account ID', 'Balance', 'Client', 'Active Invoices']}
                  linkPrefix="accounts"
                  idField="account_id"
                />
              </div>

              <div>
                <h3 className="uppercase font-bold pb-4">Invoices</h3>
                <Table
                  data={invoices}
                  columns={['Invoice ID', 'Date of Service', 'Status', 'Balance', 'Date Created', 'Date Updated']}
                  linkPrefix="invoices"
                  idField="invoice_id"
                />
              </div>
          {/* Bottom Buttons (optional) */}
          <div className="flex justify-end gap-4">
            <BackButton />
            <button type="submit" className="btn-class w-[100px]">
              Update
            </button>
          </div>
            </div>
          </div>

      ) : (
        <div className='container-col items-center'>
          <p>Loading record details...</p>
        </div>
      )}
    </>
  );
}
