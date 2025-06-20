import { useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

export default function LoginBox() {

  useEffect(() => {
    window.location.href = `${API_URL}/auth/google`;
  }, []);

  const handleGoogleLogin = async () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-300 ">
      <div className="min-w-[300px] min-h-[300px] bg-white shadow flex flex-col justify-evenly items-center rounded-lg">
        <img className='max-w-[190px] h-auto translate-x-[-15px]' src="/ebmaa-orb-logo.svg" alt="" />
          <p>Logging in...</p>
          {/* <button
            onClick={handleGoogleLogin}
            type='submit'
            className='btn-class px-6'
            aria-label='Log In' // Accessibility
          >
            Log In
          </button> */}
      </div>
    </div>  
  );
}
