import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import { Outlet, Navigate } from 'react-router-dom';
import { Nav, SideNav } from '../../components'; // Ensure the import path is correct

const ProtectedLayout = () => {
  const { user, loading } = useContext(UserContext);
  const [navWidth, setNavWidth] = useState('4rem'); // Default width of the SideNav

  // If loading user data, show a loading message
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="">
      {/* SideNav with dynamic width */}
      {/* <SideNav setNavWidth={setNavWidth} /> */}
      {/* Main content area */}
      {/* <div
        className="flex-1 flex flex-col"
        style={{
          marginLeft: navWidth, // Dynamic margin based on SideNav width
          transition: 'margin-left 0.2s ease',
        }}
      > */}
        <Nav />
        <main className="h-dvh overflow-y-auto"> 
          <Outlet />
        </main>
      {/* </div> */}
    </div>
  );
};

export default ProtectedLayout;
