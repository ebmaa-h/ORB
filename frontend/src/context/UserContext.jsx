import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

// eslint-disable-next-line react/prop-types
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (user !== null) {
        // If user is already set, no need to make another request
        console.log("User already loaded");
        return;
      }

      try {
        // Fetch user data
        const response = await axios.get('http://167.99.196.172/user/getUserData', {
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
  }, [user]); // Run the effect whenever the user state changes

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
