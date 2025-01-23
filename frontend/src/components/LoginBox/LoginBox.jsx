import './loginbox.css';
import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import ENDPOINTS from '../../config/apiEndpoints';
 
// Set Axios to include cookies by default
axios.defaults.withCredentials = true;

export default function LoginBox() {
  const { setUser } = useContext(UserContext);
  const [loginError, setLoginError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      const response = await axios.post(ENDPOINTS.login, {
        email: email,
        password: password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
    });

      // User logged in, set user in context
      setUser(response.data.user); 

      // Navigate to the dashboard
      navigate('/dashboard');
    } catch (error) {
      if (error.response.data.message) {
        console.log(error.response.data.message); // Log the error message from the server
      } else {
        console.log('An unknown login error occurred.'); // Catch-all for unexpected errors
      }
      setLoginError(true);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen ">
      <div className="min-w-[300px] min-h-[425px] bg-white shadow flex flex-col justify-evenly items-center rounded-lg">
        <img className='max-w-[190px] h-auto translate-x-[-15px]' src="/ebmaa-orb-logo.svg" alt="" />
        <form className="flex flex-col justify-center items-center gap-6" onSubmit={handleLogin}>
          <input 
            style={{ borderColor: loginError ? 'red' : 'silver' }}
            className={'border-b border-gray-light focus:outline-none text-center'}
            type="text" 
            name="email" 
            id="email" 
            placeholder='Email' 
            required 
            onFocus={() => setLoginError(false)} // Reset error when refocusing
          />
          <input 
            style={{ borderColor: loginError ? 'red' : 'silver' }}
            className={'border-b border-gray-light focus:outline-none text-center'}
            type="password" 
            name="password" 
            id="password" 
            placeholder='Password' 
            required 
            onFocus={() => setLoginError(false)} // Reset error when refocusing
          />
            <button
              type='submit'
              className='btn-class px-6'
              aria-label='Log In' // Accessibility
            >
              Log In
            </button>
        </form>
      </div>
    </div>  
  );
}
