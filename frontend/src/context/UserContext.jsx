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

      if (user !== null) {
        console.log("User already loaded");
        return;
      }

      try {
        // Fetch user data
        const response = await axios.get(ENDPOINTS.userData, {
          withCredentials: true, // Send cookies with the request
        });

        if (response.data.user) {
          console.log("User fetched and in context: ", response.data.user);
          setUser(response.data.user); // Set user data if valid
        } else {
          console.log("User not logged in. Redirecting to login.");
          setUser(null); // In case no user data is returned
        }
      } catch (error) {
        console.log("Error fetching user data or verifying JWT:", error);
        setUser(null); // If an error occurs, ensure user state is cleared
      } finally {
        setLoading(false); // Set loading to false after the fetch completes
      }
    };

    fetchUser();
  }, [user]); // Run the effect whenever the user state changes -> still deciding whether to remove this or not, as it might lead to unncessary re-renders. If removed, will only run on mount

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
