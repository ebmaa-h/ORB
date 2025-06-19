import { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { ClientContext } from '../context/ClientContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ENDPOINTS from '../config/apiEndpoints';

export default function Logout() {
  const { user, setUser } = useContext(UserContext);
  const { setClientId } = useContext(ClientContext);
  const navigate = useNavigate();
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    const logout = async () => {
      try {
        const response = await axios.post(`${ENDPOINTS.logout}`, {}, { withCredentials: true });

        if (response.status === 200) {
          setUser(null);
          console.log('User Cleared & Session Cleared')
          setClientId(null);
          console.log('Logged out');
          setLoggedOut(true);

          // setTimeout(() => {
          //   navigate('/');
          // }, 1000); 
        }
      } catch (error) {
        console.error('Logout error:', error);
        setUser(null);
        setClientId(null);
        // Not sure, but logout error is huge prob. not sure how to best handle yet.
        navigate('/');
      }
    };

    logout();
  }, []);

  const toLogin = () => {
    navigate('/');
  }


  return (
    <div>
      {!loggedOut ? (
        <p>Logging out....</p>

      ) :
        <div>
          <p>logged out</p>
          <button onClick={toLogin}>Back to Login</button>
        </div>
      }
    </div>
    
  );
}
