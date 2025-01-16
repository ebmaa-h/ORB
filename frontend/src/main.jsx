import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { UserProvider } from './context/UserContext';
import { DoctorProvider } from './context/DoctorContext';
import { NavigationProvider } from './context/NavigationContext';
import { BrowserRouter as Router } from 'react-router-dom';


createRoot(document.getElementById('root')).render(
  <Router>
    <UserProvider>
      <DoctorProvider>
        <NavigationProvider>
        <App />
        </NavigationProvider>
      </DoctorProvider>
    </UserProvider>
  </Router>,
)
