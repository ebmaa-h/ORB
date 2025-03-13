import { BackButton, InputField } from '../index';

export default function InvoiceDetails({ invoice, patient, member, client, refClient, medical, setInvoice, patientAddress, patientContact, patientEmail, memberAddress, memberContact, memberEmail }) {
  const renderInfo = (title, data) => {
    if (!data) return null; // Avoid rendering empty sections

    return (
      <div className="flex-1">
        <h2><strong>{title}</strong></h2>
        {Array.isArray(data)
          ? data.map((item, index) => <p key={index}>{item}</p>)
          : Object.entries(data).map(([key, value]) => <p key={key}>{value}</p>)
        }
      </div>
    );
  };

  return (
    <>
      <div className="container-col">
        <div className='flex flex-row gap-4'>
          {renderInfo("Guarantor", member?.[0])}
          {renderInfo("Guarantor Address", memberAddress)}
          {renderInfo("Guarantor Contact", memberContact)}
          {renderInfo("Guarantor Email", memberEmail)}
          {renderInfo("Patient", patient?.[0])}
          {renderInfo("Patient Address", patientAddress)}
          {renderInfo("Patient Contact", patientContact)}
          {renderInfo("Patient Email", patientEmail)}
          {renderInfo("Client", client)}
          {renderInfo("Medical Aid", medical)}
        </div>
      </div>

      <div className="container-row justify-between">
        <div className='flex gap-4'>
          <InputField label="Procedure Date" id="procedure_date" type='date' />
          <InputField label="Invoice Balance" id="invoice_balance" />
        </div>
        <div className='flex gap-4'>
          <select
            className="border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
            value={invoice?.refClientId || ""}
            onChange={(e) => setInvoice(prev => ({ ...prev, refClientId: e.target.value }))}>
            <option value="" disabled>Select Ref Doctor</option>
            {refClient?.map((client, index) => (
              <option value={client.ref_client_id} key={index}>Dr {client.first} {client.last}</option>
            ))}
          </select>

          <label className='flex items-center'>Status:</label>
          <select
            className="border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300 cursor-pointer"
            value={invoice?.status || ""}
            onChange={(e) => setInvoice(prev => ({ ...prev, status: e.target.value }))}>
            <option value="" disabled>Select Status</option>
            <option value="Processing">Processing</option>
            <option value="Billed">Billed</option>
            <option value="Archived">Archived</option>
          </select>

          <BackButton text='Cancel' />
          <button type="button" className="btn-class w-[100px]">Save</button>
        </div>
      </div>
    </>
  );
}
