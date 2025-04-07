import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { InputField } from '../../components';
import { BackButton } from '../../components/index';
import { Table } from '../../components';

export default function PersonRecordDetails() {
  const { recordId } = useParams();
  const [record, setRecord] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [emails, setEmails] = useState([]);
  const [contactNumbers, setContactNumbers] = useState([]);
  const [originalRecord, setOriginalRecord] = useState(null); // Store initial data


  useEffect(() => {
    const getRecordDetails = async () => {
      try {
        const response = await axios.get(ENDPOINTS.recordDetails(recordId), {
          withCredentials: true,
        });
        const { record, addresses, accounts, invoices, contactNumbers, emails } = response.data.record;
        // console.log('addresses', addresses)
        
        setRecord(record || {});
        setAddresses(addresses || []);
        setContactNumbers(contactNumbers || []);
        setEmails(emails || []);
        setAccounts(accounts || []);
        setInvoices(invoices || []);
        setOriginalRecord(response.data.record);

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

  const handleContactChange = (id, field, value) => {
    setContactNumbers((prev) =>
      prev.map((contact) =>
        contact.number_id === id ? { ...contact, [field]: value } : contact
      )
    );
  };

  const handleEmailChange = (id, value) => {
    setEmails((prev) =>
      prev.map((email) => (email.email_id === id ? { ...email, email: value } : email))
    );
  };

  const addNewEmail = () => {
    setEmails((prev) => [
      ...prev,
      { email_id: Date.now(), email: '' },
    ]);
  };

  const addNewContact = () => {
    setContactNumbers((prev) => [...prev,
      { num_type: 'Other', num: '' },
    ]);
  };
  const addNewAddress = () => {
    setAddresses((prev) => [
      ...prev,
      { address_id: Date.now(), address: '', is_domicilium: false },
    ]);
  };
  
  const handleDomChange = (id) => {
    setAddresses((prev) =>
      prev.map((address) => ({
        ...address,
        is_domicilium: address.address_id === id, 
      }))
    );
  };
  
  const handleAddressChange = (id, value) => {
    setAddresses((prev) =>
      prev.map((address) =>
        address.address_id === id ? { ...address, address: value } : address
      )
    );
  };

  /*
   Compares the updated fields in the record, addresses, emails, and contact numbers
   with the original record and returns an object containing only the fields
   that have changed. Though for instance, one change in a address, returns the whole address related info, not just changed field.
   */
  const getUpdatedFields = () => {
    const updatedFields = {};
  
    // Compare entire record
    if (JSON.stringify(record) !== JSON.stringify(originalRecord?.record)) {
      updatedFields.record = record;
    }
  
    // Compare and only send updated addresses
    const updatedAddresses = addresses.filter(address => 
      JSON.stringify(address) !== JSON.stringify(originalRecord?.addresses?.find(a => a.address_id === address.address_id))
    );
    if (updatedAddresses.length > 0) {
      updatedFields.addresses = updatedAddresses;
    }
  
    // Compare and only send updated emails
    const updatedEmails = emails.filter(email => 
      JSON.stringify(email) !== JSON.stringify(originalRecord?.emails?.find(e => e.email_id === email.email_id))
    );
    if (updatedEmails.length > 0) {
      updatedFields.emails = updatedEmails;
    }
  
    // Compare and only send updated contact numbers
    const updatedContacts = contactNumbers.filter(contact => 
      JSON.stringify(contact) !== JSON.stringify(originalRecord?.contactNumbers?.find(c => c.number_id === contact.number_id))
    );
    if (updatedContacts.length > 0) {
      updatedFields.contactNumbers = updatedContacts;
    }
  
    return updatedFields;
  };
  
  
  const handleUpdateRecord = async () => {

    // Limit to only updated fields
    const updatedData = getUpdatedFields();
    if (Object.keys(updatedData).length === 0) {
      alert('No changes detected.');
      return;
    }

    console.log('Submitting updated data:', updatedData);

// Next to do.

    // try {
    //   const response = await axios.patch(ENDPOINTS.updatePerson, updatedData, {
    //     withCredentials: true,
    //   });

    //   alert("Invoice Created Successfully!");
    //   console.log("New Invoice:", response.message);
    // } catch (error) {
    //   console.error("Error creating invoice:", error);
    //   alert("Failed to create invoice.");
    // }
  };
  

  return (
    <>
      {record ? (
        <div className='flex gap-4'>
          <div className="container-col">
            <h3 className="uppercase font-bold">Details</h3>
              <div className="flex flex-row gap-4">
                <label className=" whitespace-nowrap">Title</label>
                <select
                  className="max-h-[20px] border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
                  value={record.title || ""} 
                  id="title"
                  onChange={handleChange}
                >
                  <option value="">Select Title</option>
                  <option value="Mr">Mr</option>
                  <option value="Dr">Dr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Ms">Ms</option>
                  <option value="Other">Other</option>
                </select>

                <InputField label="Name" value={record.first} id="first" onChange={handleChange} />
                <InputField label="Surname" value={record.last} id="last" onChange={handleChange} />
              </div>

              <div className="flex flex-row gap-4">
                <InputField label="Date of Birth" type='date' value={record.date_of_birth} id="date_of_birth" onChange={handleChange} />
                <InputField label="ID Nr" value={record.id_nr} id="id_nr" onChange={handleChange} />
                <InputField label="Gender" value={record.gender} id="gender" onChange={handleChange} />
              </div>

              {/* Contact Numbers */}
              <div className="flex flex-row gap-4 flex-wrap">
                {contactNumbers.map((contact) => (
                  <div key={contact.number_id} className="flex gap-4 items-start">
                    <select
                      className="max-h-[20px] border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-30 cursor-pointer"
                      value={contact.num_type}
                      onChange={(e) => handleContactChange(contact.number_id, 'num_type', e.target.value)}
                    >
                      <option value="Cell">Cell</option>
                      <option value="Work">Work</option>
                      <option value="Tell">Tell</option>
                      <option value="Other">Other</option>
                    </select>
                    <InputField
                      value={contact.num}
                      id={`num-${contact.number_id}`}
                      onChange={(e) => handleContactChange(contact.number_id, 'num', e.target.value)}
                    />
                  </div>
                ))}
                <button
                  className="text-white px-3 py-1 rounded w-fit"
                  onClick={addNewContact}
                >
                  ➕ Add Contact
                </button>
              </div>

              {/* Emails */}
              <div className="grid grid-cols-1 gap-4">
                {emails.map((email) => (
                  <div key={email.email_id} className="flex-1 items-start">
                    <InputField
                      value={email.email}
                      id={`email-${email.email_id}`}
                      onChange={(e) => handleEmailChange(email.email_id, e.target.value)}
                    />
                  </div>
                ))}
                <button
                  className="text-white px-3 py-1 rounded w-fit"
                  onClick={addNewEmail}
                >
                  ➕ Add Email
                </button>
              </div>

              {/* Addresses */}
              <div className="flex flex-col gap-4">
                {addresses.map((address) => (
                  <div key={address.address_id} className="flex gap-4 items-center">
                    {/* Domicilium Checkbox */}
                    <input
                      type="checkbox"
                      checked={address.is_domicilium}
                      onChange={() => handleDomChange(address.address_id)}
                      className="w-4 h-4 cursor-pointer accent-ebmaa-purple "
                    />
                    {/* Address Input */}
                    <InputField
                      value={address.address}
                      id={`address-${address.address_id}`}
                      onChange={(e) => handleAddressChange(address.address_id, e.target.value)}
                    />
                  </div>
                ))}
                <button
                  className="text-white px-3 py-1 rounded w-fit"
                  onClick={addNewAddress}
                >
                  ➕ Add Address
                </button>
              </div>
            <div className="flex justify-end gap-4">
              <BackButton />
              <button type="submit" onClick={handleUpdateRecord} className="btn-class w-[100px]">Update</button>
            </div>

          </div>
          {/* Accounts & Invoices */}
          <div className="container-col">
              <h3 className="uppercase font-bold">Accounts</h3>
              <Table
                data={accounts}
                columns={['Account ID', 'Balance', 'Client', 'Active Invoices']}
                linkPrefix="accounts"
                idField="account_id"
              />

              <h3 className="uppercase font-bold">Invoices</h3>
              <Table
                data={invoices}
                columns={['Invoice ID', 'Date of Service', 'Status', 'Balance', 'Date Created', 'Date Updated']}
                linkPrefix="invoices"
                idField="invoice_id"
              />
          </div>
        </div>
      ) : (
        <div className="container-col items-center">
          <p>Loading record details...</p>
        </div>
      )}
    </>
  );
}
