import { createContext, useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';
import ENDPOINTS from '../utils/apiEndpoints';
import { useNavigate } from 'react-router-dom';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {

    const getAuthUser = async () => {
      try {
        console.log('Authenticating session & retrieving user data...');
        const response = await axiosClient.get(ENDPOINTS.auth, { withCredentials: true });
        
        if (response.data) setUser(response.data);
        console.log('✅ User data retrieved: ', response.data);
      } catch (e) {
        setUser(null);
          if (e.response?.status === 401) {
            // Only redirect if the user is not already on the login page
            if (location.pathname !== '/') {
              navigate('/not-found?reason=session-expired');
            }
          }
      } finally {
        setLoading(false);
      }
    };
    getAuthUser();
  }, []);


  return (
    <UserContext.Provider value={{ user, setUser, loading  }}>
      {children}
    </UserContext.Provider>
  );
};
