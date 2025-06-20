import axios from 'axios';
import ENDPOINTS from '../config/apiEndpoints';
/**
 * Logs out the user by clearing the JWT cookie and resetting the user context.
 * @param {Function} setUser - The function to reset the user in context.
 * @param {Function} navigate - The function to navigate the user to a specific route.
 */
export const handleLogout = async (setUser, navigate) => {
  try {
    // Make a request to the backend to clear the JWT cookie
    await axios.post(`${ENDPOINTS.logout}`, { withCredentials: true });

    // Clear the user context
    setUser(null);

    // Redirect to the login page
    navigate('/');
    
    console.log('Logged out');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
