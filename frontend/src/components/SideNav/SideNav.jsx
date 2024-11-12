import { Link } from 'react-router-dom';


export default function SideNav() {
  return (
    <nav className="side-nav">
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/profile">Account</Link></li>  {/* Link to Account */}
      </ul>
    </nav>
  )
}
