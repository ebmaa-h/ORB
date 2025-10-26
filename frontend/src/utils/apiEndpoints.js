const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("API_URL is not defined. Check .env file.");
}

const ENDPOINTS = {
  // getUser: `${API_URL}/auth/login`,
  logout : `${API_URL}/auth/logout`,
  auth : `${API_URL}/auth/me`, 
  googleAuth : `https://accounts.google.com/o/oauth2/v2/auth`, 
  workflow : `${API_URL}/batches`, 
  receptionWorkflow : `${API_URL}/batches/reception`, 
  admittanceWorkflow : `${API_URL}/batches/admittance`, 
  billingWorkflow : `${API_URL}/batches/billing`, 

  moveToAdmittance : `${API_URL}/batches/move-to-admittance`,

  addBatch : `${API_URL}/batches`, 

  clientInvoices: (clientId) => `${API_URL}/clients/${clientId}/invoices`,
  clientInvoice: (clientId, invoiceId) => `${API_URL}/clients/${clientId}/invoices/${invoiceId}`, 
  updateInvoice: (clientId, invoiceId) => `${API_URL}/clients/${clientId}/invoices/${invoiceId}`,
  newInvoice: (clientId, accountId) => `${API_URL}/clients/${clientId}/accounts/${accountId}/invoices`, 
  clientAccounts: (clientId) => `${API_URL}/clients/${clientId}/accounts`,
  clientAccount : (clientId, accountId) => `${API_URL}/clients/${clientId}/accounts/${accountId}`,
  profiles : `${API_URL}/profiles`,
  profileDetails : (profileId) => `${API_URL}/profiles/${profileId}`,
  records : `${API_URL}/records`,
  recordDetails :  (recordId) => `${API_URL}/records/${recordId}`, // good, independant records view/edit is enough.
  fetchNotes: (tableName, id) => `${API_URL}/notes/${tableName}/${id}`, 
  addNote: (tableName, id) => `${API_URL}/notes/${tableName}/${id}`,
  fetchLogs: (tableName, id) => `${API_URL}/logs/${tableName}/${id}`,
  addLog: `${API_URL}/logs`,
  // clientInfo : `${API_URL}/client/info`,


  // temp backup
  // clientInvoices: (clientId) => `${API_URL}/invoices/clients/${clientId}`, // Client specific invoices
  // invoiceDetails: (invoiceId) => `${API_URL}/invoices/${invoiceId}`, // Invoice Page
  // newInvoice: (accountId) => `${API_URL}/invoices/new/${accountId}`,
  // updateInvoice: `${API_URL}/invoices/update`,
  // clientAccounts: (clientId) => `${API_URL}/accounts/clients/${clientId}`, // Client specific accounts
  // partialAcc : (accountId) => `${API_URL}/accounts/partial/${accountId}`, // Account Page
  // profileDetails : (profileId) => `${API_URL}/profiles/${profileId}`, // profile details
  // profiles : `${API_URL}/profiles`, // All profiles
  // records : `${API_URL}/records`, // All records
  // fetchNotes: (tableName, id) => `${API_URL}/notes/${tableName}/${id}`,
  // addNote: (tableName, id) => `${API_URL}/notes/${tableName}/${id}`,
  // addLog: `${API_URL}/logs/add`,
  // fetchLogs: (tableName, id) => `${API_URL}/logs/${tableName}/${id}`,
  // recordDetails :  (recordId) => `${API_URL}/records/${recordId}`, // profile details
};

export default ENDPOINTS;
