import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

// eslint-disable-next-line react/prop-types
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if the user is logged in by calling the /verify route
        const response = await axios.get('http://localhost:4000/verify', {
          withCredentials: true, // Make sure cookies are sent with the request
        });
        setUser(response.data.user); // Set user data if logged in
      } catch (error) {
        setUser(null); // Set user to null if not logged in or token expired
      }
    };

    fetchUser(); // Check user status when the app loads or page refreshes
  }, []); // Run only once when the app loads

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
