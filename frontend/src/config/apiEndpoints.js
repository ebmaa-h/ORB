const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("API_URL is not defined. Check .env file.");
}

const ENDPOINTS = {
  // getUser: `${API_URL}/auth/login`,
  logout : `${API_URL}/auth/logout`,
  auth : `${API_URL}/auth/me`, 
  googleAuth : `https://accounts.google.com/o/oauth2/v2/auth`, 

  clientInvoices: (clientId) => `${API_URL}/invoices/clients/${clientId}`, // Client specific invoices
  invoiceDetails: (invoiceId) => `${API_URL}/invoices/${invoiceId}`, // Invoice Page
  newInvoice: (accountId) => `${API_URL}/invoices/new/${accountId}`,
  updateInvoice: `${API_URL}/invoices/update`,
  clientAccounts: (clientId) => `${API_URL}/accounts/clients/${clientId}`, // Client specific accounts
  partialAcc : (accountId) => `${API_URL}/accounts/partial/${accountId}`, // Account Page
  profileDetails : (profileId) => `${API_URL}/profiles/${profileId}`, // profile details
  profiles : `${API_URL}/profiles`, // All profiles
  records : `${API_URL}/records`, // All records
  fetchNotes: (tableName, id) => `${API_URL}/notes/${tableName}/${id}`,
  addNote: (tableName, id) => `${API_URL}/notes/${tableName}/${id}`,
  addLog: `${API_URL}/logs/add`,
  fetchLogs: (tableName, id) => `${API_URL}/logs/${tableName}/${id}`,
  recordDetails :  (recordId) => `${API_URL}/records/${recordId}`, // profile details
  // clientInfo : `${API_URL}/client/info`,
};

export default ENDPOINTS;
