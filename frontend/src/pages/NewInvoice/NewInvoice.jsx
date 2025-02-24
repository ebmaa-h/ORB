import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { BackButton, InputField } from '../../components/index';

export default function NewInvoice() {
  const { accountId } = useParams();
  const [invoice, setInvoice] = useState({});
  const navigate = useNavigate();

  const [patient, setPatient] = useState({});
  const [member, setMember] = useState({});
  const [client, setClient] = useState([]);
  const [refClient, setRefClient] = useState([]);
  const [medical, setMedical] = useState([]);


  useEffect(() => {
    const getAccountDetails = async () => {
      try {
        const response = await axios.get(ENDPOINTS.fullAcc(accountId), {
          withCredentials: true,
        });
        console.log('response',response)
        const { member, patient, client, refClient, medical } = response.data.account;
        
        setClient(client || []);
        setRefClient(refClient || []);
        setMember(member || {});
        setPatient(patient || {});
        setMedical(medical || []);
      } catch (error) {
        console.error('Error fetching record details:', error);
      }
    };

    if (accountId) {
      getAccountDetails();
    }
  }, [accountId]);

  
  const renderPersonDetails = (title, person) => (
    <div className='flex-1'>
      <table className="table-auto w-full border-collapse border-gray-blue-100 text-gray-dark">
        <thead>
          <tr>
            <th colSpan="2" className="border border-gray-blue-100 p-2 ">{title}</th>
          </tr>
        </thead>
        <tbody> 
        <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Name</td><td className="border border-gray-blue-100 p-2">{person[0]?.title} {person[0]?.first} {person[0]?.last}</td></tr>
        <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Gender</td><td className="border border-gray-blue-100 p-2">{person[0]?.gender === 'M' ? 'Male' : 'Female'}</td></tr>
          <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">ID</td><td className="border border-gray-blue-100 p-2">{person[0]?.id_nr}</td></tr>
          <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Date of Birth</td><td className="border border-gray-blue-100 p-2">{person[0]?.date_of_birth}</td></tr>
          <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Addresses</td><td className="border border-gray-blue-100 p-2">{person.addresses?.map((address, index) => (<div key={index}>{address.address}</div>))}</td></tr>
          <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Contact</td><td className="border border-gray-blue-100 p-2">{person.contactNumbers?.map((contact, index) => (<div key={index}>{contact.num_type}: {contact.num}</div>))}</td></tr>
          <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Email</td><td className="border border-gray-blue-100 p-2">{person.emails?.map((email, index) => (<div key={index}>{email.email}</div>))}</td></tr>
          <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Dependent Nr</td><td className="border border-gray-blue-100 p-2">{person[0]?.dependent_nr}</td></tr>
        </tbody>
      </table>
    </div>
  );

  const handleCreateInvoice = async () => {
    // if (!selectedRefClient || !procedureDate || !selectedStatus) {
    //   alert("Eish fill add required for now for testing");
    //   return;
    // }

    const newInvoice = {
      account_id: accountId,
      main_member_id: member[0]?.record_id,
      patient_id: patient[0]?.record_id,
      file_nr: invoice.file_nr,
      auth_nr: invoice.auth_nr,
      dos: invoice.dos,
      invoice_status: invoice.invoice_status,
      ref_client_id: invoice.ref_client_id,
    };
    console.log("newInvoice", newInvoice);
    try {
      const response = await axios.post(ENDPOINTS.newInvoice, newInvoice, {
        withCredentials: true,
      });

      alert("Invoice Created Successfully!");
      navigate(-1);
      console.log("New Invoice:", response.message);
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Failed to create invoice.");
    }
  };

  return (
    <>
      {accountId ? (
        <>
          <div className="container-col gap-4">
            <h2 className='font-bold'>*New Invoice</h2>
            <div className='flex flex-row gap-4'>
              <div className='flex-1'>
                <table className="table-auto w-full border-collapse border-gray-blue-100 text-gray-dark">
                  <thead>
                    <tr className=""><th colSpan="2" className="border border-gray-blue-100 p-2">Client</th></tr>
                  </thead>
                  <tbody>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2 ">Name</td><td className="border border-gray-blue-100 p-2">{client.client_name}</td></tr>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Type</td><td className="border border-gray-blue-100 p-2">{client.client_type}</td></tr>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Email</td><td className="border border-gray-blue-100 p-2">{client.email}</td></tr>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Tell</td><td className="border border-gray-blue-100 p-2">{client.tell_nr}</td></tr>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Registration Nr</td><td className="border border-gray-blue-100 p-2">{client.registration_nr}</td></tr>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Practice Nr</td><td className="border border-gray-blue-100 p-2">{client.practice_nr}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className='flex-1'>
                <table className="table-auto w-full border-collapse border-gray-blue-100 text-gray-dark">
                  <thead>
                    <tr className=""><th colSpan="2" className="border border-gray-blue-100 p-2 ">Medical Aid</th></tr>
                  </thead>
                  <tbody>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Medical Aid</td><td className="border border-gray-blue-100 p-2">{medical.medical_aid_name}</td></tr>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Plan</td><td className="border border-gray-blue-100 p-2">{medical.plan_name}</td></tr>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Medical Aid Nr</td><td className="border border-gray-blue-100 p-2">{medical.medical_aid_nr}</td></tr>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Plan Code</td><td className="border border-gray-blue-100 p-2">{medical.plan_code}</td></tr>
                  </tbody>
                </table>
              </div>
              {renderPersonDetails('Guarantor', member)}
              {renderPersonDetails('Patient', patient)}
            </div>
          </div>
          <div className="container-row justify-between items-center">
            <div className='flex flex-row gap-4'>
              <InputField 
                label="Procedure Date"
                value={invoice.dos} 
                id="procedure_date" 
                type='date' 
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    dos: e.target.value,
                  }))
                }
              />
              {/* <p >Invoice Balance: {account.invoice_balance}</p> */}
              <InputField 
                label="File Nr"
                value={invoice.file_nr} 
                id="file_nr" 
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    file_nr: e.target.value,
                  }))
                }
              />
              <InputField 
                label="File Nr"
                value={invoice.auth_nr} 
                id="auth_nr" 
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    auth_nr: e.target.value,
                  }))
                }
              />
            </div>
            <div className='flex flex-row gap-4'>
              
              <select className="border rounded border-gray-blue-100 px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
                value={invoice.ref_client_id || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    ref_client_id: e.target.value,
                  }))
                }
                >
                <option value="" disabled>Select Ref Dr</option>
                {refClient?.map((client, index) => (
                  <option value={client.ref_client_id} key={index}>Dr {client.first} {client.last}</option>
                ))}
              </select>

              <label className='flex items-center'>Status:</label>
              <select
                className="border rounded border-gray-blue-100 px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
                value={invoice.invoice_status || ""}
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    invoice_status: e.target.value,
                  }))
                }
              >
                <option value="" disabled>Select Status</option>
                <option value="Processing">Processing</option>
                <option value="Billed">Billed</option>
                <option value="Archived">Archived</option>
              </select>
              <BackButton />
              <button type="button" onClick={handleCreateInvoice} className="btn-class w-[100px]">Create</button>
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
