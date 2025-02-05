/* eslint-disable react/prop-types */

import { Link } from 'react-router-dom';

export default function FeatureBlock({ feature }) {
  return (
    <Link to={`/${feature.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className='rounded border-gray-300 border w-24 h-24 flex flex-col justify-center  text-center gap-2'>
        {/* <span className="material-symbols-outlined">file_open</span> */}
        <p>{feature}</p>
      </div>
    </Link>
  );
}