import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { InputField, BackButton, Notes } from '../../components';
import { useOutletContext } from "react-router-dom";
import { useContext } from 'react';
import { NavigationContext } from '../../context/NavigationContext';

export default function InvoiceDetails() {
  const { accountId, invoiceId } = useParams();
  const { triggerToast } = useOutletContext(); 
  const { previousPath } = useContext(NavigationContext);
  const [invoice, setInvoice] = useState({});
  const [patient, setPatient] = useState({});
  const [member, setMember] = useState({});
  const [client, setClient] = useState([]);
  const [refClient, setRefClient] = useState([]);
  const [medical, setMedical] = useState([]);
  const [newInvoiceId, setNewInvoiceId  ] = useState([]);

  const [ ogData, setOgData ] = useState({});


  useEffect(() => {
    const getInvoiceDetails = async () => {
      try {
        let response;
  
        if (accountId) {
          // Fetch invoice data using accountId
          response = await axios.get(ENDPOINTS.newInvoice(accountId), {
            withCredentials: true,
          });
          console.log(response)
          setNewInvoiceId(response.data.invoice.invoiceId);
        } else if (invoiceId) {
          // Fetch invoice details using invoiceId
          response = await axios.get(ENDPOINTS.invoiceDetails(invoiceId), {
            withCredentials: true,
          });
        }
  
        const { member, patient, client, refClient, medical, invoice } = response.data.invoice;
        setClient(client || []);
        setRefClient(refClient || []);
        setMember(member || {});
        setPatient(patient || {});
        setInvoice(invoice || {});
        setMedical(medical || []);
        setOgData(response.data.invoice);
      } catch (error) {
        console.error('Error fetching invoice details:', error);
      }
    };
  
    // Trigger the effect when either accountId or invoiceId changes
    if (accountId || invoiceId) {
      getInvoiceDetails();
    }
  
  }, [accountId, invoiceId]);


  const checkChange = (fields, updateFields) => {
    let hasChanges = false;

    for (let i = 0; i < updateFields.length; i++) {
      let newValue = fields[updateFields[i]];
      let oldValue = ogData.invoice[updateFields[i]];

      if (newValue !== oldValue ) {
        // console.log('test')
        console.log('Change Detected');
        console.log(updateFields[i],": ",newValue)
        console.log(updateFields[i],": ",oldValue)
        hasChanges = true;
        
        setOgData((prev) => ({
          ...prev,
          invoice: {
            ...prev.invoice,
            [updateFields[i]]: newValue,
          }
        })
      ); 
      return hasChanges;
    }
  }
}
  

  const handleSave = async () => {

    const updatedInvoice = {
      invoice_id: invoiceId || newInvoiceId,
      file_nr: invoice.file_nr,
      auth_nr: invoice.auth_nr,
      date_of_service: invoice.date_of_service,
      status: invoice.status,
      ref_client_id: invoice.ref_client_id,
    };

    let updateFields = [
      "file_nr",
      "auth_nr",
      "date_of_service",
      "status",
      "ref_client_id",
    ]

    const hasChanges = checkChange(updatedInvoice, updateFields);

    if (!hasChanges) {
      console.log("No changes detected, skipping save.");
      triggerToast(false, "No changes made.");
      return; // Stop execution if nothing changed
    }


    try {
      await axios.patch(ENDPOINTS.updateInvoice, updatedInvoice, {
        withCredentials: true,
      });
      triggerToast(true, "Invoice Updated Successfully!");
      // navigate(-1);
    } catch (error) {
      console.error('Error saving invoice details:', error);
      triggerToast(false, "Failed to update invoice."); // Error toast
    }
  };

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

  return (
    <>
      {invoiceId || newInvoiceId ? (
        <>
          <div className="container-col gap-4">
            <h2 className='font-bold'>Invoice #{invoiceId || newInvoiceId}</h2>
            <div className='flex flex-row gap-4'>
              <div className='flex-1'>
                <table className="table-auto w-full border-collapse border-gray-blue-100 text-gray-dark">
                  <thead>
                    <tr><th colSpan="2" className="border border-gray-blue-100 p-2">Client</th></tr>
                  </thead>
                  <tbody>
                    <tr className="cursor-pointer hover:bg-gray-blue-100"><td className="border border-gray-blue-100 p-2">Name</td><td className="border border-gray-blue-100 p-2">{client.client_name}</td></tr>
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
                    <tr><th colSpan="2" className="border border-gray-blue-100 p-2 ">Medical Aid</th></tr>
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
              <InputField label="Procedure Date" 
                value={invoice.date_of_service} 
                id="procedure_date" 
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    date_of_service: e.target.value,
                  }))
                }
                type='date' 
              />
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
                label="Auth Nr"
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
                <option value="" disabled>Select Ref Doctor</option>
                {refClient?.map((client, index) => (
                  <option value={client.ref_client_id} key={index}>Dr {client.first} {client.last}</option>
                ))}
              </select>
              <label className='flex items-center'>Status:</label>
              <select className="border rounded border-gray-blue-100 px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
                value={invoice.status || ""} 
                onChange={(e) =>
                  setInvoice((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="" disabled>Select Status</option>
                <option value="Processing">Processing</option>
                <option value="Billed">Billed</option>
                <option value="Archived">Archived</option>
              </select>
              <BackButton />
              <button type="button" className="btn-class w-[100px]" onClick={handleSave}>Save</button>
            </div>
          </div>
          <Notes 
            tableName='invoices'
            id={invoiceId || newInvoiceId}
          />
        </>
      ) : (
        <div className='container-col items-center'>
          <p>Loading invoice details...</p>
        </div>
      )}
    </>
  );
}
