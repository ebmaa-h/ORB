import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { Button } from '../common/index';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Logout() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Make a request to the backend to clear the JWT cookie
      await axios.post('http://localhost:4000/logout', {}, { withCredentials: true });
      // await axios.post('http://167.99.196.172:4000/logout', {}, { withCredentials: true });
      
      // Clear the user context
      setUser(null);

      // Redirect to the login page
      navigate('/');
    
      console.log('logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div>
      <Button 
        btnName="Log out" 
        onClick={handleLogout} 
      />
    </div>
  );
}
