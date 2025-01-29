const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("API_URL is not defined. Check .env file.");
}

const ENDPOINTS = {
  login: `${API_URL}/login`,
  userData : `${API_URL}/users/data`,

  invoices : `${API_URL}/invoices`,
  newInvoice : (accountId) => `${API_URL}/invoices/new/${accountId}`,
  clientInvoices: (clientId) => `${API_URL}/invoices/clients/${clientId}`,

  accounts : `${API_URL}/accounts`,

  partialAcc : (accountId) => `${API_URL}/accounts/partial/${accountId}`,
  clientAccounts: (clientId) => `${API_URL}/accounts/clients/${clientId}`,
  
  fullAcc : (accountId) => `${API_URL}/accounts/${accountId}`,

  profiles : `${API_URL}/profiles`,
  logout : `${API_URL}/logout`,
  records : `${API_URL}/records`,
  clientInfo : `${API_URL}/client/info`,
};

export default ENDPOINTS;
