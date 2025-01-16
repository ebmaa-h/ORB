import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';
import { InputField, Table } from '../../components';
import BackButton from '../../utility/BackButton';

export default function InvoiceDetails() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState({
    procedure_date: '',
    invoice_balance: '',
  });
  const [member, setMember] = useState({
    member_full: '',
    member_id: '',
  });
  const [patient, setPatient] = useState({
    patient_full: '',
    patient_id: '',
  });

  // Fetch invoice details
  useEffect(() => {
    const getInvoiceDetails = async () => {
      try {
        const response = await axios.get(`${ENDPOINTS.invoices}/${invoiceId}`, {
          withCredentials: true,
        });

        const data = response.data.invoice;
        console.log(data.member_full)
   

        setInvoice(data.invoice || {});
        setMember({
          member_full: data.member_full || '',
          member_id: data.member_id || '',
        });
        setPatient({
          patient_full: data.patient_full || '',
          patient_id: data.patient_id || '',
        });
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

  // Handle save (create) functionality
  const handleSave = async () => {
    try {
      await axios.put(`${ENDPOINTS.invoices}/${invoiceId}`, invoice, {
        withCredentials: true,
      });
      // Redirect to the relevant account page or previous page
      navigate(-1); // Go back to the previous page
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
        <div className="flex flex-col gap-4 m-4 p-4 bg-white rounded text-gray-dark">
          {/* Back Button */}
          <BackButton />

          <div className="flex flex-row gap-4">
            <InputField
              label="Procedure Date"
              value={invoice.procedure_date}
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

          <div className="flex flex-row gap-4">
            <div className="flex-1">
              <Table 
                data={[patient]}
                columns={['Name', 'ID']}
                linkPrefix="invoices"
                idField="invoice_id"
              />
            </div>

            <div className="flex-1">
              <Table 
                data={[member]}
                columns={['Name', 'ID']}
                linkPrefix="invoices"
                idField="invoice_id"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
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
      ) : (
        <p>Loading invoice details...</p>
      )}
    </>
  );
}
