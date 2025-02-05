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

  useEffect(() => {
    const getRecordDetails = async () => {
      try {
        const response = await axios.get(ENDPOINTS.recordDetails(recordId), {
          withCredentials: true,
        });
        console.log(response)
        const { record, addresses, accounts, invoices, contactNumbers, emails } = response.data.record;
        setRecord(record || {});
        setAddresses(addresses || []);
        setAccounts(accounts || []);
        setInvoices(invoices || []);
        setContactNumbers(contactNumbers || []);
        setEmails(emails || []);
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
      { email_id: Date.now(), email: '' }, // Temporary ID for frontend
    ]);
  };

  const addNewContact = () => {
    setContactNumbers((prev) => [
      ...prev,
      { number_id: Date.now(), num_type: 'Other', num: '' }, // Temporary ID for frontend
    ]);
  };

  return (
    <>
      {record ? (
        // Main container
        <>
          {/* Details Container */}
          <div className="container-col">
            {/* Heading */}
            <h3 className="uppercase font-bold">Details</h3>
  
            {/* Main Details */}
            <div className="grid grid-cols-4 gap-4 w-full">

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 w-full">
                {/* Column 1 */}
                <div className="flex flex-col gap-4">
                  <InputField label="Title" value={record.title} id="title" onChange={handleChange} />
                  <InputField label="Name" value={record.first} id="first" onChange={handleChange} />
                  <InputField label="Surname" value={record.last} id="last" onChange={handleChange} />
                </div>

                {/* Column 2 */}
                <div className="flex flex-col gap-4">
                  <InputField label="Date of Birth" value={record.date_of_birth} id="date_of_birth" onChange={handleChange} />
                  <InputField label="ID Nr" value={record.id_nr} id="id_nr" onChange={handleChange} />
                  <InputField label="Gender" value={record.gender} id="gender" onChange={handleChange} />
                </div>
              </div>



              {/* Contact Numbers */}
              <div className="grid grid-cols-2 gap-4 w-full">
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
                  <div key={address.address_id} className="grid grid-cols-1">
                    <input
                      type="checkbox"
                      checked={address.is_domicilium}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          prev.map((addr) =>
                            addr.address_id === address.address_id
                              ? { ...addr, is_domicilium: e.target.checked }
                              : addr
                          )
                        )
                      }
                      className="w-4 h-4 checked:bg-ebmaa-purple"
                    />
                    <InputField
                      value={address.address}
                      id={`address-${address.address_id}`}
                      onChange={(e) =>
                        setAddresses((prev) =>
                          prev.map((addr) =>
                            addr.address_id === address.address_id
                              ? { ...addr, address: e.target.value }
                              : addr
                          )
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Accounts & Invoices */}
          <div className="container-col">
              <h3 className="uppercase font-bold">Accounts</h3> {/* Should also show a checkmark if patient is guarantor or patient */}
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

            {/* Bottom Buttons */}
            <div className="flex justify-end gap-4">
              <BackButton />
              <button type="submit" className="btn-class w-[100px]">Update</button>
            </div>
          </div>
        </>
      ) : (
        <div className="container-col items-center">
          <p>Loading record details...</p>
        </div>
      )}
    </>
  );
}
