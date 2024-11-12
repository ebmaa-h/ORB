import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 
import './dashboard.css';

export default function Dashboard() {
  const { user } = useContext(UserContext); 

  return (
    <div>
      <h1>Welcome, {user.first_name}.</h1>
      {user ? (
        <div>
          <br></br>
          <p>Display user specific data like: </p>
          <p>Annual Leave, Hours, Work time this month ? 
            accounts admitted today / this month?
          </p>
          <br></br>
          <p>Other stats...</p>
          <p>Show upcoming EBMAA events ? Price givings ? etc.</p>
        </div>
      ) : (
        <h2>Please log in to see your dashboard.</h2>
      )}
    </div>
  );
}
