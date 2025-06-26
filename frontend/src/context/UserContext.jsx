import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import ENDPOINTS from '../config/apiEndpoints';
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
        const response = await axios.get(ENDPOINTS.auth, { withCredentials: true });
        
        if (response.data) setUser(response.data);
        console.log('✅ User data retrieved: ', response.data);
      } catch (e) {
        setUser(null);
        navigate('/not-found?reason=session-expired');
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
