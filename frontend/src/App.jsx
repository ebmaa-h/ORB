import './App.css';
import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Login, Dashboard } from './pages/index';
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
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/" />} 
            />
          </Routes>
      </Router>

  );
}

export default App;