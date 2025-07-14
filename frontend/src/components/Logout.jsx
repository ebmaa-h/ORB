import { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { ClientContext } from '../context/ClientContext';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../config/axiosClient';
import ENDPOINTS from '../config/apiEndpoints';

export default function Logout() {
  const { user, setUser } = useContext(UserContext);
  const { setClientId } = useContext(ClientContext);
  const navigate = useNavigate();
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    const logout = async () => {
      try {
        const response = await axiosClient.post(`${ENDPOINTS.logout}`, {}, { withCredentials: true });

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
        {!loggedOut ? (
          <p>Logging out....</p>
        ) :
          <div className='flex gap-3 flex-col text-center'>
            <p className='text-gray-900'>Successfully logged out.</p>
            <button
            onClick={backToLogin}
            type='submit'
            className='btn-class px-6'
            >
              Back to login
            </button>
          </div>
          }
      </div>
    </div>  
    
  );
}
