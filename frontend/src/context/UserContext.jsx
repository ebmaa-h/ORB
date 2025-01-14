import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import ENDPOINTS from '../config/apiEndpoints';

export const UserContext = createContext();

// eslint-disable-next-line react/prop-types
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {

      // if (user !== null) {
      //   console.log("User fetch skipped, user already loaded.");
      //   //  add a pure JWT backend check here -> better security and no need to re
      //   return;
      // }

      try {
        // Fetch user data
        const response = await axios.get(ENDPOINTS.userData, {
          withCredentials: true, // Send cookies with the request
        });

        if (response.data.user) {
          console.log("User Set.", response.data.user);
          setUser(response.data.user); // Valid
        } else {
          console.log("User not logged in. Redirecting to login.");
          setUser(null); // No data
        }
      } catch (error) {
        console.log("No JWT/Cookie prob not set", error);
        setUser(null); // No jwt or fetch issue
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []); // should run on mount, on refresh, on page change -> which includes validate jwt and get/refresh user data

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
