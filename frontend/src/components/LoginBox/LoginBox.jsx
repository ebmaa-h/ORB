import './loginbox.css';
import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { Button } from '../common/index'

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
      const response = await axios.post('http://167.99.196.172:4000/login', {
      // const response = await axios.post('http://localhost:4000/login', {
        email: email,
        password: password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
    });

      console.log(response.data.user);

      // User logged in, set user in context
      setUser(response.data.user); 

      // Navigate to the dashboard
      navigate('/dashboard');
    } catch (error) {
      console.log("LOGIN ERROR: ", error);
      setLoginError(true);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen text-sm">
      <div className="min-w-[300px] min-h-[425px] bg-white flex flex-col justify-between items-center rounded-lg py-8">
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
          <Button 
            btnName="Log In" 
            type="submit"
          />
        </form>
      </div>
    </div>  
  );
}
