import './App.css';
import { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Login, Dashboard, ProtectedLayout, Profile, UserManagement, Accounts, TimeSheet } from './pages/index';
import { UserContext } from './context/UserContext';
import { useNavigate } from 'react-router-dom';
import AxiosInterceptor from './middleware/AxiosInterceptor'; 

function App() {
  const { user } = useContext(UserContext); // Access user state from UserContext
  const navigate = useNavigate();

  useEffect(() => {
    const axiosInterceptor = AxiosInterceptor.interceptors.request.use(
      async (config) => {
        // Sorted/Declared in middleware
        return config;
      },
      (error) => {
        // If JWT verification fails, handle redirection here
        console.log("JWT verification failed. Redirecting to login.");
        navigate('/');  // Redirect to login page
        return Promise.reject(error); // Propagate the error
      }
    );

    // Cleanup interceptor on component unmount
    return () => {
      AxiosInterceptor.interceptors.request.eject(axiosInterceptor);
    };
  }, [navigate]);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route element={user ? <ProtectedLayout /> : <Navigate to="/" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} /> 
          <Route path="/users" element={<UserManagement />} />
          <Route path="/accounts" element={<Accounts />} /> 
          <Route path="/time" element={<TimeSheet />} /> 
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
