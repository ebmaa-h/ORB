import { useEffect, useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

export default function LoginBox() {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true); // Swap to retry button after delay
    }, 10000);

    window.location.href = `${API_URL}/auth/google`;

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-300">
      <div className="min-w-[300px] min-h-[300px] bg-white shadow flex flex-col justify-evenly items-center rounded-lg">
        <img className='max-w-[190px] h-auto translate-x-[-15px]' src="/ebmaa-orb-logo.svg" alt="logo" />

        {!showRetry ? (
          <p className='text-gray-900'>Logging in...</p>
        ) : (
          <button
            onClick={handleGoogleLogin}
            type='button'
            className='btn-class px-6'
            aria-label='Retry Login'
          >
            Login with Google
          </button>
        )}
      </div>
    </div>
  );
}
