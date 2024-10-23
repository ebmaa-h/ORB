import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 
import './dashboard.css';

export default function Dashboard() {
  const { user } = useContext(UserContext); 

  console.log(user);

  return (
    <div>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.first_name}.</h2>
        </div>
      ) : (
        <h2>Please log in to see your dashboard.</h2> // Message if user is not logged in
      )}
    </div>
  );
}