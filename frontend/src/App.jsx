import './App.css';
import axios from 'axios';
import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Logout } from './components/index'
import { UserContext } from './context/UserContext';
import { Login, Dashboard, ProtectedLayout, Tools, TimeSheet, Profiles, Profile, AccountDetails, Invoice, ClientAccounts, ClientInvoices, Records, Record, ClientInfo } from './pages/index';

// Set Axios to include cookies by default
axios.defaults.withCredentials = true;
// Still need to remove withcredentials from old requests

function App() {
  const { user, loading  } = useContext(UserContext);

  if (loading) return <div>Loading...</div>;

  console.log(user);

  return (

    <Routes>
      {/* Login route */}
      <Route path="/" element={
        user ? <Navigate to="/dashboard" /> : <Login />
      } />

      <Route path="/logout" element={<Logout />} />

      {/* Protected routes */}
      <Route element={user ? <ProtectedLayout /> : <Navigate to="/" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/profiles/:profileId" element={<Profile />} />
        <Route path="/client/info" element={<ClientInfo />} />
        <Route path="/accounts" element={<ClientAccounts />} />
        <Route path="/accounts/:accountId" element={<AccountDetails />} />
        <Route path="/invoices" element={<ClientInvoices />} />
        <Route path="/invoices/:invoiceId" element={<Invoice />} />
        <Route path="/invoices/new/:accountId" element={<Invoice />} />
        <Route path="/records" element={<Records />} />
        <Route path="/records/:recordId" element={<Record />} />
        <Route path="/time" element={<TimeSheet />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>


  );
}

export default App;
