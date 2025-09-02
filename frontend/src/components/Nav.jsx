import { Link, useLocation } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';

import { UserContext } from '../context/UserContext';

export default function Nav() {
  const { user } = useContext(UserContext);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  

  
  return (
    <div className="bg-white shadow flex justify-between items-center flex-row h-[60px]">



    </div>
  );
}
