import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { InputField } from '../../components';
import BackButton from '../../utility/BackButton';
import { use } from 'react';

export default function NewInvoice() {
  const { accountId } = useParams();

  const [invoice, setInvoice] = useState({});
  const [patient, setPatient] = useState({});
  const [member, setMember] = useState({});
  const [client, setClient] = useState([]);
  const [refClient, setRefClient] = useState([]);
  // const [account, setAccount] = useState([]);
  // const [account, setAccount] = useState([]);

  useEffect(() => {
    const getAccountDetails = async () => {
      try {
        const response = await axios.get(ENDPOINTS.fullAcc(accountId), {
          withCredentials: true,
        });
        console.log('response',response)
        const { member, patient, client, refClient } = response.data.account;
        setClient(client[0] || []);
        setRefClient(refClient || []);
        setMember(member || {});
        setPatient(patient || {});
      } catch (error) {
        console.error('Error fetching record details:', error);
      }
    };

    if (accountId) {
      getAccountDetails();
    }
  }, [accountId]);
  

  return (
    <>
      {accountId ? (
        <>
          <div className="container-col">
          <h1><strong>accountId Nr: {accountId}</strong></h1>
          {/* <p>Account ID: {invoice.account_id}</p>
          <p>Account ID: {invoice.account_id}</p> */}
          </div>
          <div className="container-col">

            <div className='flex flex-row gap-4'>
              <div className="flex-1 ">
                {/* <p>{medical.medical_aid_name} - {medical.medical_aid_plan_name}</p>
                <p>Medical Aid Number: {medical.profile_medical_aid_nr}</p>
                <p>Auth: {medical.profile_authorization_nr}</p> */}
                <p>{client.client_name}</p>
                <p>{client.client_type}</p>
                <br></br>
                <p>{client.tell_nr}</p>
                <p>{client.email}</p>
                <br></br>
                <p>Practice Number: {client.practice_nr}</p>
                <p>{client.registration_nr}</p>

              </div>
                {console.log(refClient)}
              <div className="flex-1 ">
                <select
                  className="border rounded border-gray-light px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
                  value={invoice.refClientId || ""}
                  onChange={(e) => {
                    setInvoice(prev => ({
                      ...prev,
                      refClientId: e.target.value, // Store the refClient ID
                    }));
                  }}
                >
                  <option className='' value="" disabled>
                    Select Ref Doctor
                  </option>
                  {refClient?.map((client, index) => (
                    <option value={client.ref_client_id} key={index}>Dr {client.first} {client.last}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 border-l border-gray-light pl-2">
                <h2><strong>Guarantor</strong></h2>
                {/* <p>{member[0].title} {member[0].first} {member[0].last}</p>
                <p>{member[0].id_nr}</p>
                <p>{member[0].gender}</p> */}

                <br></br>
                {/* Loop through addresses */}
                <h2><strong>Addresses</strong></h2>
                {member.addresses?.map((address, index) => (
                  <p key={index}>{address.address}</p>
                ))}

                <br></br>
                {/* Loop through contact numbers */}
                <h2><strong>Contact</strong></h2>
                {member.contactNumbers?.map((contact, index) => (
                  <p key={index}>{contact.num_type}: {contact.num}</p>
                ))}
                
                <br></br>
                {/* Loop through emails */}
                <h2><strong>Email</strong></h2>
                {member.emails?.map((email, index) => (
                  <p key={index}>{email.email}</p>
                ))}
              </div>

              <div className="flex-1 border-l border-gray-light pl-2">
                <h2><strong>Patient</strong></h2>
                {/* <p>{patient[0].title} {patient[0].first} {patient[0].last}</p>
                <p>{patient[0].id_nr}</p>
                <p>{patient[0].gender}</p> */}

                <br></br>

                {/* Loop through addresses */}
                <h2><strong>Addresses</strong></h2>
                {patient.addresses?.map((address, index) => (
                  <p key={index}>{address.address}</p>
                ))}

                <br></br>
                {/* Loop through contact numbers */}
                <h2><strong>Contact</strong></h2>
                {patient.contactNumbers?.map((contact, index) => (
                  <p key={index}>{contact.num_type}: {contact.num}</p>
                ))}

                <br></br>
                {/* Loop through emails */}
                <h2><strong>Email</strong></h2>
                {patient.emails?.map((email, index) => (
                  <p key={index}>{email.email}</p>
                ))}
              </div>

            </div>

            <div className="flex flex-row gap-4 justify-end">
              <div className='flex flex-row gap-4 w-full'>
                  <InputField
                    label="Procedure Date"
                    // value={invoice.date_of_service}
                    id="procedure_date"
                    // onChange={handleChange}
                    type='date'
                  />
                  <InputField
                    label="Invoice Balance"
                    // value={invoice.invoice_balance}
                    id="invoice_balance"
                    // onChange={handleChange}
                  />
                </div>
              <label className='flex items-center'>Status:</label>
                <select
                  className="border rounded border-gray-light px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
                  value={invoice.status || ""}
                  onChange={(e) => {
                    setInvoice(prev => ({
                      ...prev,
                      status: e.target.value,
                    }));
                  }}
                >
                  <option className='' value="" disabled>
                    Select Status
                  </option>
                  <option className='' value="Processing">
                    Processing
                  </option>
                  <option className='' value="Billed">
                    Billed
                  </option>
                  <option className='' value="Archived">
                    Archived
                  </option>
                </select>
              {/* <BackButton /> */}
              <BackButton />
              <button
                type="button"
                className="btn-class w-[100px]"
                // onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className='container-col items-center'>
          <p>Loading invoice details...</p>
        </div>
      )}
    </>
  );
}
