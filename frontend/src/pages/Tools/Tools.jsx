import { FeatureBlock } from '../../components'
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 

export default function Tools() {
  const { user } = useContext(UserContext); 

  // Helper function to find a specific feature by name
  const findFeature = (featureName) => 
    user.features.find((feature) => feature.feature_name === featureName && feature.is_active);

  return (
    <>
      <div className='bg-white rounded m-6 p-6'>
        <p>Hello {user.first}.</p>
      </div>
      <div className='bg-white rounded m-6 p-6 flex flex-col'>
        <h2 className='pl-6 pt-3 pb-3 text-lg '>Manage Users</h2>
        <div className='flex'>
          {/* Accounts Feature */}
          {findFeature("View Accounts") && (
            <FeatureBlock feature="User Permissions" />
          )}

          {/* Patinets Feature */}
          {findFeature("Patient Records") && (
            <FeatureBlock feature="Add Users" />
          )}
          {/* Patinets Feature */}
          {findFeature("Patient Records") && (
            <FeatureBlock feature="Remove Users" />
          )}
          {/* Patinets Feature */}
          {findFeature("Patient Records") && (
            <FeatureBlock feature="View Users" />
          )}
        </div>
      </div>
    </>
  )
}
