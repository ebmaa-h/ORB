import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 
import './dashboard.css';

export default function Dashboard() {
  const { user } = useContext(UserContext); 

  return (
    <div>
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.first_name}.</h2>
          <br></br>
          <p>Annual Leave: 41 days</p>
          <p>Hours: -2:12</p>
        </div>
      ) : (
        <h2>Please log in to see your dashboard.</h2>
      )}
    </div>
  );
}
