import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

export default function NotFound() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const reason = params.get('reason');

  console.log(reason)

  const message = (() => {
    if (reason === 'unauthorized') return 'You are not authorized to access this page.'; // Google callback failure -> unregistered or failure on google's side.
    if (reason === 'forbidden') return 'Access denied. You do not have permission.';
    if (reason === 'session-expired') return 'Session expired. Please log in again.'; // Session expired, tampered with, missing, invalid session.
    return user ? 'Page not found.' : 'Unauthorized.';
  })();

  const buttonText = user ? 'Back to Dashboard' : 'Back to Login';
  const handleClick = () => navigate(user ? '/dashboard' : '/');

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-300">
      <div className="min-w-[300px] min-h-[110px] bg-white shadow flex flex-col justify-evenly items-center rounded-lg px-6 py-4">
        <div className="flex gap-3 flex-col text-center">
          <p className="text-gray-900">{message}</p>
          <button
            onClick={handleClick}
            type="button"
            className="btn-class px-6"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
