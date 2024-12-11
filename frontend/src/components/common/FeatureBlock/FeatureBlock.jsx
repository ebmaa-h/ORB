/* eslint-disable react/prop-types */

import { Link } from 'react-router-dom';

export default function FeatureBlock({ feature }) {
  return (
    <Link to={`/${feature.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className='rounded border-gray-light border w-32 h-32 flex flex-col justify-center text-center gap-3'>
        <span className="material-symbols-outlined">two_pager</span>
        <p>{feature}</p>
      </div>
    </Link>
  );
}