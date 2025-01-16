import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { DoctorContext } from '../../context/DoctorContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ENDPOINTS from '../../config/apiEndpoints';

export default function Logout() {
  const { setUser } = useContext(UserContext);
  const { setDoctorId } = useContext(DoctorContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Make a request to the backend to clear the JWT cookie
      await axios.post(`${ENDPOINTS.logout}`, { withCredentials: true });
      
      // Clear the user context
      setUser(null);
      setDoctorId(null);
      

      // Redirect to the login page
      navigate('/');
    
      console.log('logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div>

      <button
      type='submit'
      onClick={handleLogout} 
      className='link-class'
      aria-label='Log out' // Accessibility
    >
      Log out
    </button>
    </div>
    
  );
}
