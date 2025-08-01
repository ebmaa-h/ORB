import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { ClientContext } from '../context/ClientContext';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../config/apiEndpoints';
import axiosClient from '../config/axiosClient';
import { InputField, BackButton, NotesAndLogs, Table, VTable, NotesPopup } from '../components';
import { useOutletContext } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

export default function ClientInvoice() {
  const { user } = useContext(UserContext); 
  const { clientId } = useContext(ClientContext);
  const { accountId, invoiceId } = useParams();
  const { triggerToast } = useOutletContext(); 
  const [invoice, setInvoice] = useState({});
  const [patient, setPatient] = useState({});
  const [member, setMember] = useState({});
  const [client, setClient] = useState([]);
  const [refClient, setRefClient] = useState([]);
  const [medical, setMedical] = useState([]);
  const [newInvoiceId, setNewInvoiceId  ] = useState();
  const [refreshLogs, setRefreshLogs] = useState(false);
  const navigate = useNavigate();

  const [ ogData, setOgData ] = useState({});
  const rowClass = "cursor-pointer hover:bg-gray-blue-100";
  const cellClass = "border border-gray-blue-100 p-2";

  useEffect(() => {
    if (!clientId) {
      navigate('/invoices');
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId || (!accountId && !invoiceId)) return;

    const getInvoiceDetails = async () => {
      try {
        let response;
  
        if (accountId) {
          // Means its a new invoice
          console.log('creating new invoice...')
          response = await axiosClient.put(ENDPOINTS.newInvoice(clientId, accountId),{
            params: { userId: user.user_id },
            withCredentials: true,
          });
          setNewInvoiceId(response.data.invoice.invoiceId);
          triggerToast(true, "New Invoice Created!");
        } else if (invoiceId) {
          // Fetch invoice details using invoiceId
          response = await axiosClient.get(ENDPOINTS.clientInvoice(clientId, invoiceId), {
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

         if (error.response?.status === 403) {
          navigate('/not-found?reason=forbidden');
        } else {
          triggerToast(false, "Error loading invoice.");
        }
      }
    };
  
    if ( accountId || invoiceId) {
      getInvoiceDetails();
    }
  
  }, [accountId, invoiceId]);


  const logChanges = async (invoiceId, changedFields) => {
    try {
      const payload = {
        userId: user.user_id,
        table: 'invoices',
        action: 'update',
        id: invoiceId,
        changes: changedFields,
      };
  
      await axiosClient.post(ENDPOINTS.addLog, payload, { withCredentials: true });
      console.log("Changes logged:", payload);
    } catch (error) {
      console.error("Failed to log changes:", error);
    }
  };


// how to refactor and how to comment
// Key Tip: Use comments to answer:

// Why does this exist?
// When or where is this useful?
// What problem does it solve elegantly?
// (Optionally): Any gotchas the next dev (or future-you) should know?

/**
 * Tracks changes between two objects based on a defined set of fields.
 * Used to detect what the user modified in a form or data entry before saving.
 * 
 * Returns an object containing the fields that were changed,
 * with both the original and updated values — or null if nothing changed.
 * 
 * This is useful for:
 * - Auditing or logging specific field changes.
 * - Avoiding unnecessary updates if nothing changed.
 * - Generating user-friendly "You changed X to Y" messages.
 */


const useChangeTracker = (original, fields) => {
  return (updated) => {
    const changes = {};
    fields.forEach(f => {
      if (updated[f] !== original[f]) {
        changes[f] = { old: original[f], new: updated[f] };
      }
    });
    return Object.keys(changes).length ? changes : null;
  };
};




const getChangedFields = (newData, originalData, updateFields) => {
  const changed = {};

  updateFields.forEach((field) => {
    if (newData[field] !== originalData[field]) {
      changed[field] = {
        old: originalData[field],
        new: newData[field]
      };
    }
  });

  return Object.keys(changed).length > 0 ? changed : null;
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

    const updateFields = [
      "file_nr",
      "auth_nr",
      "date_of_service",
      "status",
      "ref_client_id",
    ];

    const changes = getChangedFields(updatedInvoice, ogData, updateFields);

    if (!changes) {
      console.log("No changes detected, skipping save.");
      triggerToast(false, "No changes made.");
      return;
    }

    try {
      await axiosClient.patch(ENDPOINTS.updateInvoice(client.client_id, updatedInvoice.invoice_id), updatedInvoice, {
        withCredentials: true,
      });

      triggerToast(true, "Invoice Updated Successfully!");
      setOgData(updatedInvoice); // Update the original data state -> Resetting the changes
      setRefreshLogs(prev => !prev); // Refresh notes & logs
      await logChanges(updatedInvoice.invoice_id, changes);

    } catch (error) {
      if (error.response?.status === 403) {
        const code = error.response?.data?.code;

      if (code === 'CLIENT_ACCESS_DENIED') {
        console.warn('🔒 Unauthorized. CA');
        navigate('/not-found?reason=unauthorized');
      } else {
        console.warn('🔒 Unauthorized. FL');
        triggerToast(false, "Unauthorized");
        return;
      }
    }
      console.error('Error saving invoice details:', error);
      triggerToast(false, "Failed to update invoice.");
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
                // linkPrefix="client" 
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
                <table className="table-auto w-full border-collapse border-y border-gray-blue-100 text-gray-dark">
                  <thead>
                    <tr>
                    <th colSpan="2" className={cellClass}>Patient</th>
                    </tr>
                  </thead>
                  <tbody> 
                    <tr className={rowClass}><td className={cellClass}>Name</td><td className={cellClass}>{patient?.title} {patient?.first} {patient?.last}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Gender</td><td className={cellClass}>{patient?.gender === 'M' ? 'Male' : 'Female'}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>ID</td><td className={cellClass}>{patient?.id_nr}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Date of Birth</td><td className={cellClass}>{patient?.date_of_birth}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Addresses</td><td className={cellClass}>{patient.addresses?.map((address, index) => (<div key={index}>{address.address}</div>))}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Contact</td><td className={cellClass}>{patient.contactNumbers?.map((contact, index) => (<div key={index}>{contact.num_type}: {contact.num}</div>))}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Email</td><td className={cellClass}>{patient.emails?.map((email, index) => (<div key={index}>{email.email}</div>))}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Dependent Nr</td><td className={cellClass}>{patient?.dependent_nr}</td></tr>
                  </tbody>
                </table>
                <table className="table-auto w-full border-collapse border-y border-gray-blue-100 text-gray-dark">
                  <thead>
                    <tr>
                    <th colSpan="2" className={cellClass}>Member</th>
                    </tr>
                  </thead>
                  <tbody> 
                    <tr className={rowClass}><td className={cellClass}>Name</td><td className={cellClass}>{member?.title} {member?.first} {member?.last}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Gender</td><td className={cellClass}>{member?.gender === 'M' ? 'Male' : 'Female'}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>ID</td><td className={cellClass}>{member?.id_nr}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Date of Birth</td><td className={cellClass}>{member?.date_of_birth}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Addresses</td><td className={cellClass}>{member.addresses?.map((address, index) => (<div key={index}>{address.address}</div>))}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Contact</td><td className={cellClass}>{member.contactNumbers?.map((contact, index) => (<div key={index}>{contact.num_type}: {contact.num}</div>))}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Email</td><td className={cellClass}>{member.emails?.map((email, index) => (<div key={index}>{email.email}</div>))}</td></tr>
                    <tr className={rowClass}><td className={cellClass}>Dependent Nr</td><td className={cellClass}>{member?.dependent_nr}</td></tr>
                  </tbody>
                </table>
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
          <NotesAndLogs 
            tableName='invoices'
            id={invoiceId ? invoiceId : newInvoiceId   }
            refreshTrigger={refreshLogs}

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
