import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { InputField } from '../../components';
import BackButton from '../../utility/BackButton';

export default function InvoiceDetails() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [medical, setMedical] = useState([]);
  const [doctor, setDoctor] = useState([]);
  const [invoice, setInvoice] = useState([]);
  const [member, setMember] = useState([]);
  const [patient, setPatient] = useState([]);

  // Fetch invoice details
  useEffect(() => {
    const getInvoiceDetails = async () => {
      try {
        const response = await axios.get(`${ENDPOINTS.invoices}/${invoiceId}`, {
          withCredentials: true,
        });

        const data = response.data.invoice; 
        console.log(data.member)
        const { invoice, medical, member, doctor,  patient } = data; 

        setDoctor(doctor || {});
        setMedical(medical || {});
        setInvoice(invoice || {});
        setMember(member || {});
        setPatient(patient || {});

      } catch (error) {
        console.error('Error fetching invoice details:', error);
      }
    };

    if (invoiceId) {
      getInvoiceDetails();
    }
  }, [invoiceId]);

  // Handle input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    setInvoice((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      await axios.put(`${ENDPOINTS.invoices}/${invoiceId}`, invoice, {
        withCredentials: true,
      });
      // Redirect to the relevant account page or previous page
      navigate(-1);
    } catch (error) {
      console.error('Error saving invoice details:', error);
    }
  };

  // Handle discard changes
  const handleDiscard = () => {
    navigate(-1); // Go back to the previous page without saving
  };

  return (
    <>
      {invoice ? (
        <>
          <div className="bg-white rounded m-4 p-4 flex flex-row gap-4 text-sm justify-between">
          <h1><strong>Invoice Nr: {invoice.invoice_id}</strong></h1>
          {/* <p>Account ID: {invoice.account_id}</p>
          <p>Account ID: {invoice.account_id}</p> */}
          </div>
          <div className="bg-white rounded m-4 p-4 flex flex-col gap-4">

            <div className='flex flex-row gap-4'>
              <div className="flex-1 text-sm">
                <p>{medical.medical_aid_name} - {medical.medical_aid_plan_name}</p>
                <p>Medical Aid Number: {medical.profile_medical_aid_nr}</p>
                <p>Auth: {medical.profile_authorization_nr}</p>
                <p>Doctor: {doctor.doctor_name}</p>
                <br></br>
                <p>{doctor.doctor_name}</p>
                <p>Practice Number: {doctor.doctor_practice_number}</p>

              </div>
              
              <div className="flex-1 text-sm">
                <h2><strong>Guarantor</strong></h2>
                <p>{member.member_title} {member.member_first} {member.member_last}</p>
                <p>ID: {member.member_id_nr}</p>
              </div>

              <div className="flex-1 text-sm">
                <h2><strong>Patient</strong></h2>
                <p>{patient.patient_title} {patient.patient_first} {patient.patient_last}</p>
                <p>ID: {patient.patient_id_nr}</p>
              </div>

              <div className='flex flex-col gap-6'>
                <InputField
                  label="Procedure Date"
                  value={invoice.date_of_service}
                  id="procedure_date"
                  onChange={handleChange}
                  type='date'
                />
                <InputField
                  label="Invoice Balance"
                  value={invoice.invoice_balance}
                  id="invoice_balance"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="bg-white rounded mx-4 p-4 flex flex-row gap-4 justify-end text-sm">
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
                  <option className='' value="processing">
                    Processing
                  </option>
                  <option className='' value="archived">
                    Archived
                  </option>
                  <option className='' value="billed">
                    Billed
                  </option>
                </select>
              {/* <BackButton /> */}
              <button
                type="button"
                className="btn-class w-[100px]"
                onClick={handleDiscard}
              >
                Discard
              </button>

              <button
                type="button"
                className="btn-class w-[100px]"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <p>Loading invoice details...</p>
      )}
    </>
  );
}
