
import { Link } from 'react-router-dom';

export default function FeatureBlock({ link, text }) {
  return (
    <Link to={link}>
    {/* <Link to={`/${link.toLowerCase().replace(/\s+/g, '-')}`}> */}
      <div className='rounded border-gray-300 border w-24 h-24 flex flex-col justify-center  text-center gap-2'>
        {/* <span className="material-symbols-outlined">file_open</span> */}
        <p>{text}</p>
      </div>
    </Link>
  );
}