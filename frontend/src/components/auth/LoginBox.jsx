import { useEffect, useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

export default function LoginBox() {

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;

  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-300">
      <div className="min-w-[300px] min-h-[300px] bg-white border border-gray-blue-200 rounded flex flex-col justify-evenly items-center">
        <img className='max-w-[190px] h-auto translate-x-[-15px]' src="/ebmaa-orb-logo.svg" alt="logo" />
        <button
          onClick={handleGoogleLogin}
          type='button'
          className='btn-class px-6'
        >
          Login
        </button>
      </div>
    </div>
  );
}
