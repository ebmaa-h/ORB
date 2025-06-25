import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import ENDPOINTS from '../config/apiEndpoints';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchUser = async () => {
      try {
        console.log('Requesting user info...');
        const response = await axios.get(ENDPOINTS.auth, { withCredentials: true });
        
        if (response.data) setUser(response.data);
        console.log('✅ User data retrieved: ', response.data);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);


  return (
    <UserContext.Provider value={{ user, setUser, loading  }}>
      {children}
    </UserContext.Provider>
  );
};
