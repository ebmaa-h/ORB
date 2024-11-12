import './App.css';
import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Login, Dashboard, ProtectedLayout, Profile, UserManagement, Accounts, TimeSheet } from './pages/index';
import { UserContext } from './context/UserContext';

function App() {
  const { user } = useContext(UserContext); // Access user state from UserContext

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        {/* Routes under ProtectedLayout will include SideNav */}
        <Route element={user ? <ProtectedLayout /> : <Navigate to="/" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} /> 
          <Route path="/users" element={<UserManagement />} />
          <Route path="/accounts" element={<Accounts />} /> 
          <Route path="/time" element={<TimeSheet />} /> 
        </Route>
      </Routes>
    </Router>

  );
}

export default App;