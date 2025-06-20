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

  const backToLogin = () => {
    navigate('/');
  }


  return (


    <div className="flex justify-center items-center min-h-screen bg-gray-300 ">
      <div className="min-w-[300px] min-h-[110px] bg-white shadow flex flex-col justify-evenly items-center rounded-lg">
        {/* <img className='max-w-[190px] h-auto translate-x-[-15px]' src="/ebmaa-orb-logo.svg" alt="" /> */}

        {!loggedOut ? (
        <p>Logging out....</p>

      ) :
          <div className='flex gap-3 flex-col'>
            {/* <p className='text-gray-dark'>Logged Out.</p> */}
            <p className='text-gray-900'>Successfully logged out...</p>
            <button
            onClick={backToLogin}
            type='submit'
            className='btn-class px-6'
            aria-label='Log In' // Accessibility
            >
              Back to login
            </button>
          </div>
          }
      </div>
    </div>  
    
  );
}
