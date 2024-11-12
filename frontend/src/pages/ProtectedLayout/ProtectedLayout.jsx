import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { SideNav } from '../../components/index';

function ProtectedLayout() {
  const [navWidth, setNavWidth] = useState('4rem'); // Default width of the SideNav

  return (
    <div className="flex h-screen">
      {/* SideNav with dynamic width */}
      <SideNav setNavWidth={setNavWidth} />

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col"
        style={{
          marginLeft: navWidth, // Dynamic margin
          transition: 'margin-left 0.2s ease',
        }}
      >
        {/* <Nav /> */}
        <main className="p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ProtectedLayout;

