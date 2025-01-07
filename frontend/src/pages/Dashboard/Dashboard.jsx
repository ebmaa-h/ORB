import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 
import './dashboard.css';
import { Nav } from '../../components';

export default function Dashboard() {
  const { user } = useContext(UserContext); 

  // Helper function to find a specific feature by name
  // const findFeature = (featureName) => 
  //   user.features.find((feature) => feature.feature_name === featureName && feature.is_active);

  return (
    <>        
      {/* <div className='bg-white rounded m-4 p-4'>
        <p>Hello {user.first}.</p>
      </div>
      <div className='bg-white rounded m-4 p-4 flex gap-4'>
        {findFeature("profiles") && (
          <FeatureBlock feature="Profiles" />
        )}
        {findFeature("accounts") && (
          <FeatureBlock feature="Accounts" />
        )}
        {findFeature("invoices") && (
          <FeatureBlock feature="Invoices" />
        )}
        {findFeature("records") && (
          <FeatureBlock feature="Records" />
        )}
      </div> */}

      <Nav />
    </>
  );
}
