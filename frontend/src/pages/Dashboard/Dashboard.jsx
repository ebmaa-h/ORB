import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext'; 
import './dashboard.css';
import { Nav, FeatureBlock } from '../../components';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useContext(UserContext); 
  const [ notes, setNotes ] = useState(0);
  const [ west, setWest ] = useState(null);

  // Helper function to find a specific feature by name
  // const findFeature = (featureName) => 
  //   user.features.find((feature) => feature.feature_name === featureName && feature.is_active);

  return (
    <>        
      <div className='container-col'>
        <p>Hello {user.first}.</p>
      </div>

      <p>
        {notes.length ? "true" : "false"}
      </p>
      <p>
        {!west ? "true" : "false"}
      </p>

      {/* <div className='bg-white shadow rounded m-4 p-4 flex gap-4'>
        {findFeature("profiles") && (
          <FeatureBlock feature="Profiles" />
        )}
        {findFeature("records") && (
          <FeatureBlock feature="Records" />
        )}
      </div> */}
    </>
  );
}
