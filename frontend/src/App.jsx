import './App.css';
import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';


import { Logout, NotFound } from './components/index'
import { UserContext } from './context/UserContext';
import { Login, Workflow, ProtectedLayout, Profiles, Profile, ClientAccount, ClientInvoice, ClientAccounts, ClientInvoices, Records, Record, UserAccess } from './pages/index';

function App() {
  const { user, loading  } = useContext(UserContext);
  if (loading) return <div>Loading...</div>;

  return (
      <Routes>
        {/* Login/logout routes */}
        <Route path="/" element={user ? <Navigate to="/workflow" /> : <Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profiles/:profileId" element={<Profile />} />
          <Route path="/accounts" element={<ClientAccounts />} />
          <Route path="/accounts/:accountId" element={<ClientAccount />} />
          <Route path="/invoices" element={<ClientInvoices />} />
          <Route path="/invoices/:invoiceId" element={<ClientInvoice />} />
          <Route path="/invoices/new/:accountId" element={<ClientInvoice />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/:recordId" element={<Record />} />
          
          <Route path="/users/access" element={<UserAccess />} />
        </Route>

        {/* Catch-all // Not found*/}
        <Route path="/not-found" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/not-found" />} />

      </Routes>
  );
}

export default App;
