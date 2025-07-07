import { useContext } from 'react';
import { UserContext } from '../context/UserContext'; 

export default function Tools() {
  const { user } = useContext(UserContext); 

  // Helper function to find a specific feature by name
  const findFeature = (featureName) => 
    user.features.find((feature) => feature.feature_name === featureName);

  return (
    <div className='container-col'>
      1. manage users (ebmaa employees) permissions, access.
      <br></br>
      2. time management
      <br></br>
      3. etc.
    </div>
  )
}
