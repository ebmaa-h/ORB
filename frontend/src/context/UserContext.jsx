import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

// eslint-disable-next-line react/prop-types
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {

      try {
        // Get user data
        const response = await axios.get('http://167.99.196.172:4000/getUserData', {

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
        setUser(null); 
      }
    };

    fetchUser(); // get user data on refresh/page laod
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
