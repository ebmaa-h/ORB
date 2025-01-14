import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';

export default function InvoiceDetails() {
  const { invoiceId } = useParams(); 
  const [invoice, setInvoice] = useState({}); // Stores the invoice


  // Fetch invoice details
  useEffect(() => {
    const getInvoiceDetails  = async () => {
      try {
        console.log('Fetching invoice data for ID:', invoiceId); // Log the invoice ID being fetched
        const response = await axios.get(`${ENDPOINTS.invoices}/${invoiceId}`, {
          withCredentials: true,
        });

        const { invoices } = response.data.invoice; 

        console.log("invoices",invoices);

        setInvoice(invoice || []);
      } catch (error) {
        console.error('Error fetching invoice details:', error);
      }
    };

    if (invoiceId) {
      getInvoiceDetails ();
    }
  }, [invoiceId]);

  return (
    <>
      {invoice && Object.keys(invoice).length > 0 ? (
        <>
          {/* Invoice */}
          <div className="bg-white rounded m-3">
            {/* Will render invoice here */}
          </div>
        </>
      ) : (
        <p>Loading invoice details...</p>
      )}
    </>
  );
}
