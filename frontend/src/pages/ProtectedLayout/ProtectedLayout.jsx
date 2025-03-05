import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../context/UserContext";
import { Outlet, Navigate } from "react-router-dom";
import { Nav } from "../../components";
import {StatusToast} from "../../components";

const ProtectedLayout = () => {
  const { user } = useContext(UserContext);
  const [showToast, setShowToast] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);
  const [message, setMessage] = useState("");

  if (!user) {
    return <Navigate to="/" />;
  }

  const triggerToast = (success, msg) => {
    setIsSuccess(success);
    setMessage(msg);
    setShowToast(true);
  };

  return (
    <div className="">
      <main className="h-dvh overflow-y-auto"> 
        <Nav />
        <div className='mx-4'>
          <Outlet context={{ triggerToast }} />
        </div>
      </main>
      {showToast && (
        <StatusToast isSuccess={isSuccess} message={message} show={showToast} onClose={() => setShowToast(false)} />
      )}
    </div>
  );
};

export default ProtectedLayout;
