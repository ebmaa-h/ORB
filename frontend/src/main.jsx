import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { UserProvider } from './context/UserContext';
import { ClientProvider } from './context/ClientContext';
import { NavigationProvider } from './context/NavigationContext';
import { BrowserRouter as Router } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <Router>
    <UserProvider>
      <ClientProvider>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </ClientProvider>
    </UserProvider>
  </Router>,
)
