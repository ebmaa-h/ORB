import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Login, Dashboard } from './pages/index';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />}/>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;