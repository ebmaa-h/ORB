import { Outlet } from 'react-router-dom';
import { SideNav, Nav } from '../../components/index';

function ProtectedLayout() {
  return (
    <div>
      <Nav />  {/* Always shows on authenticated pages */}
      <div className="layout-container">
        <SideNav />  {/* Side navigation on the side */}
        <main className="content">
          <Outlet />  {/* Render the main content based on the selected route */}
        </main>
      </div>
    </div>
  );
}

export default ProtectedLayout;
