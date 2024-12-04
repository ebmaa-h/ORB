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
      <div className='bg-white rounded m-4 p-4'>
        <p>Hello {user.first}.</p>
      </div>
      <div className='bg-white rounded m-3 flex'>
        {/* Profiles Feature */}
        {findFeature("profiles") && (
          <FeatureBlock feature="Profiles" />
        )}
        {/* Accounts Feature */}
        {findFeature("accounts") && (
          <FeatureBlock feature="Accounts" />
        )}
        {/* Invoices Feature */}
        {findFeature("invoices") && (
          <FeatureBlock feature="Invoices" />
        )}
      </div>
    </>
  );
}
