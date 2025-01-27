import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { NavigationContext } from '../context/NavigationContext';

export default function BackButton() {
  const { previousPath } = useContext(NavigationContext);
  const navigate = useNavigate();


  return (
      <button
      onClick={() => previousPath ? navigate(previousPath) : navigate(-1)}
      type='submit'
      className='btn-class min-w-[100px] max-h-[35px]'
    >
      Back
    </button>
  );
}
