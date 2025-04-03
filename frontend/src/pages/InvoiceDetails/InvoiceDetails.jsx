import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { InputField, BackButton, Notes, Table, VTable } from '../../components';
import { useOutletContext } from "react-router-dom";

export default function InvoiceDetails() {
  const { accountId, invoiceId } = useParams();
  const { triggerToast } = useOutletContext(); 
  const [invoice, setInvoice] = useState({});
  const [patient, setPatient] = useState({});
  const [member, setMember] = useState({});
  const [client, setClient] = useState([]);
  const [refClient, setRefClient] = useState([]);
  const [medical, setMedical] = useState([]);
  const [newInvoiceId, setNewInvoiceId  ] = useState();

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
          setNewInvoiceId(response.data.invoice.invoiceId);
        } else if (invoiceId) {
          // Fetch invoice details using invoiceId
          response = await axios.get(ENDPOINTS.invoiceDetails(invoiceId), {
            withCredentials: true,
          });
          
        }
        
        console.log('response.data.invoice',response.data.invoice)
        const { member, patient, client, refClient, medical, details } = response.data.invoice;
        setClient(client || []);
        setRefClient(refClient || []);
        setMember(member || {});
        setPatient(patient || {});
        setInvoice(details || {});
        setMedical(medical || []);
        setOgData(response.data.invoice.details);
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
      let oldValue = ogData[updateFields[i]];

      if (newValue !== oldValue) {

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
        }));
      return hasChanges;
    }
  }
}

const formatRecordData = (record) => {
  if (!record) return [];

  const details = record.details?.[0] || {};
  return [{
    name: `${details.title} ${details.first} ${details.last}`,
    gender: details.gender === 'M' ? 'Male' : 'Female',
    id_nr: details.id_nr,
    date_of_birth: details.date_of_birth,
    addresses: record.addresses?.map(a => a.address).join(' | ') || '-',
    contactNumbers: record.contactNumbers?.map(c => `${c.num_type}: ${c.num}`).join(' | ') || '-',
    emails: record.emails?.map(e => e.email).join(' | ') || '-',
    dependent_nr: details.dependent_nr,
  }];
};

  

  const handleSave = async () => {
    const updatedInvoice = {
      invoice_id: invoiceId ? invoiceId : newInvoiceId,
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

  return (
    <>
      {invoiceId || newInvoiceId ? (
        <>
          <div className="container-col gap-4">
            <h2 className='font-bold'>Invoice #{invoiceId || newInvoiceId}</h2>
            <div className='flex flex-row gap-4'>
              <VTable
                data={[client]} 
                // linkPrefix="medical" 
                type="Client"
                idField="client_id"
                excludedCol={['client_id']}
              />
              <VTable
                  data={[medical]} 
                  // linkPrefix="medical" 
                  type="Medical Aid"
                  idField="medical_id"
                  excludedCol={['profile_id']}
                />
                {console.log("medical",medical)}
                {console.log("patient",patient)}
              <VTable
                  data={formatRecordData(patient)} 
                  // linkPrefix="medical" 
                  type="Patient"
                  idField="record_id"
                />
              <VTable
                  data={formatRecordData(member)} 
                  // linkPrefix="medical" 
                  type="Guarantor"
                  idField="record_id"
                />
            </div>
          </div>
          <div className="container-row justify-between items-center">
            <div className='flex flex-row gap-4'>
              <InputField label="Procedure Date" 
                value={invoice.date_of_service ? invoice.date_of_service : ""} 
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
                value={invoice.file_nr ? invoice.file_nr : ""} 
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
                value={invoice.auth_nr ? invoice.auth_nr : ""} 
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
            id={invoiceId ? invoiceId : newInvoiceId   }
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
