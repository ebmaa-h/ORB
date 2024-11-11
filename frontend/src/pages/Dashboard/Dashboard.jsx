import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 
import { Nav } from '../../components/index';
import './dashboard.css';

export default function Dashboard() {
  const { user } = useContext(UserContext); 

  return (
    <div>
      <Nav />
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.email}.</h2>
        </div>
      ) : (
        <h2>Please log in to see your dashboard.</h2>
      )}
    </div>
  );
}
