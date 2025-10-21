import './App.css';
import { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';


import {NotFound } from './pages/index'
import { Logout } from './components/index'
import { UserContext } from './context/UserContext';
import { Login, Workflow, ProtectedLayout} from './pages/index';

function App() {
  const { user, loading  } = useContext(UserContext);
  if (loading) return <div>Loading...</div>;

  return (
      <Routes>
        {/* login/logout routes */}
        <Route path="/" element={user ? <Navigate to="/workflow" /> : <Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/workflow" element={<Workflow />} />
        </Route>

        {/* catch all // Not found*/}
        <Route path="/not-found" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/not-found" />} />

      </Routes>
  );
}

export default App;
