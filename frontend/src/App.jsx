import './App.css';
import { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import { Login, Workflow, ProtectedLayout, NotFound, BatchView } from './pages';
import { Logout } from './components';
import { UserContext } from './context/UserContext';

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
          <Route path="/batches/:batchId" element={<BatchView />} />
        </Route>

        {/* catch all // Not found*/}
        <Route path="/not-found" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/not-found" />} />

      </Routes>
  );
}

export default App;
