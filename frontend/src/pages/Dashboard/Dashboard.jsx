import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 
import './dashboard.css';
import { FeatureBlock } from '../../components';

export default function Dashboard() {
  const { user } = useContext(UserContext); 

  // Helper function to find a specific feature by name
  const findFeature = (featureName) => 
    user.features.find((feature) => feature.feature_name === featureName && feature.is_active);

  return (
    <>        
      <div className='bg-white rounded m-6 p-6'>
        <p>Hello {user.first}.</p>
      </div>
      <div className='bg-white rounded m-6 p-6 flex'>
        {/* Accounts Feature */}
        {findFeature("View Accounts") && (
          <FeatureBlock feature="View Accounts" />
        )}

        {/* Patinets Feature */}
        {findFeature("Patient Records") && (
          <FeatureBlock feature="Patient Records" />
        )}
      </div>
    </>
  );
}
