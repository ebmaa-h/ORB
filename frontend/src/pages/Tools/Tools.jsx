import { FeatureBlock } from '../../components'
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 

export default function Tools() {
  const { user } = useContext(UserContext); 

  // Helper function to find a specific feature by name
  const findFeature = (featureName) => 
    user.features.find((feature) => feature.feature_name === featureName && feature.is_active);

  return (
    <div className='bg-white rounded m-4 p-4'>
      tools
    </div>
  )
}
