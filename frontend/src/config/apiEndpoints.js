const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("API_URL is not defined. Check .env file.");
}

const ENDPOINTS = {
  login: `${API_URL}/login`,
  logout : `${API_URL}/logout`,
  
  userData : `${API_URL}/users/data`,

  
  // invoices : `${API_URL}/invoices`,
  clientInvoices: (clientId) => `${API_URL}/invoices/clients/${clientId}`, // Client specific invoices
  invoiceDetails: (invoiceId) => `${API_URL}/invoices/${invoiceId}`, // Invoice Page
  
  newInvoice  : `${API_URL}/invoices/new`,
  
  updateInvoice: `${API_URL}/invoices/update`,

  // accounts : `${API_URL}/accounts`,
  clientAccounts: (clientId) => `${API_URL}/accounts/clients/${clientId}`, // Client specific accounts
  partialAcc : (accountId) => `${API_URL}/accounts/partial/${accountId}`, // Account Page
  // fullAcc : (accountId) => `${API_URL}/accounts/${accountId}`,
  fullAcc : (accountId) => `${API_URL}/accounts/${accountId}`, // Account Page
  // fullAcc : (accountId) => `${API_URL}/accounts/${accountId}`,

  profileDetails : (profileId) => `${API_URL}/profiles/${profileId}`, // profile details
  profiles : `${API_URL}/profiles`, // All profiles
  
  records : `${API_URL}/records`, // All records

  recordDetails :  (recordId) => `${API_URL}/records/${recordId}`, // profile details
  // clientInfo : `${API_URL}/client/info`,
};

export default ENDPOINTS;
