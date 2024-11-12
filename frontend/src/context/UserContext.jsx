import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

// eslint-disable-next-line react/prop-types
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      console.log('Attempting user verify.');
      try {
        // Check if the user is logged in by calling the /verify route
        // const response = await axios.get('http://167.99.196.172:4000/verify', {
        const response = await axios.get('http://localhost:4000/verify', {
          withCredentials: true, // Make sure cookies are sent with the request
        });
        console.log(response.data.user);
        setUser(response.data.user); // Set user data if logged in
      } catch (error) {
        if (error.response.data.message) {
          console.log(error.response.data.message); // Log the error message from the server
        } else {
          console.log('An unknown error occurred.'); // Catch-all for unexpected errors
        }
        setUser(null); // Set user to null if not logged in or token expired
      }
    };

    fetchUser(); // Verify JWT when the app loads or page refreshes
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
