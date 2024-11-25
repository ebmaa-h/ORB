import './App.css';
import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Login, Dashboard, ProtectedLayout, Tools, Accounts, TimeSheet, PatientRecords, AccountDetails } from './pages/index';
import { UserContext } from './context/UserContext';

function App() {
  const { user } = useContext(UserContext); // Access user state from UserContext

  return (
    <Router>
      <Routes>
        {/* If the user is logged in, redirect to dashboard; else, show login */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        
        {/* Protect these routes with a layout that requires authentication */}
        <Route element={user ? <ProtectedLayout /> : <Navigate to="/" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/view-accounts" element={<Accounts />} />
          <Route path="/time" element={<TimeSheet />} />
          {/* <Route path="/view-accounts" element={<TimeSheet />} /> */}
          <Route path="/view-accounts/:accountId" element={<AccountDetails />} />
          <Route path="/patient-records" element={<PatientRecords />} />
        </Route>

        {/* Catch-all route to redirect to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
