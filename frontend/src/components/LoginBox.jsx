import { useEffect } from 'react';
import ENDPOINTS from '../config/apiEndpoints';

export default function LoginBox() {

  useEffect(() => {
    window.location.href = 'http://localhost:4000/auth/google';
  }, []);

  const handleGoogleLogin = async () => {
    window.location.href = 'http://localhost:4000/auth/google';
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-300 ">
      <div className="min-w-[300px] min-h-[300px] bg-white shadow flex flex-col justify-evenly items-center rounded-lg">
        <img className='max-w-[190px] h-auto translate-x-[-15px]' src="/ebmaa-orb-logo.svg" alt="" />
          <button
            onClick={handleGoogleLogin}
            type='submit'
            className='btn-class px-6'
            aria-label='Log In' // Accessibility
          >
            Log In
          </button>
      </div>
    </div>  
  );
}
