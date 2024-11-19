import './App.css';
import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Login, Dashboard, ProtectedLayout, Tools, Profile, Accounts, TimeSheet } from './pages/index';
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/time" element={<TimeSheet />} />
        </Route>

        {/* Catch-all route to redirect to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
