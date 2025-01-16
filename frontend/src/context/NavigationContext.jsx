import { createContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const NavigationContext = createContext();

// eslint-disable-next-line react/prop-types
export const NavigationProvider = ({ children }) => {
  const [previousPath, setPreviousPath] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const location = useLocation();

  // Log for debugging
  // console.log('clicked');
  // console.log(previousPath);

  useEffect(() => {
    setPreviousPath(currentPath); // Save the last path
    setCurrentPath(location.pathname); // Update with the current path
  }, [location.pathname]); // Only depend on location.pathname

  return (
    <NavigationContext.Provider value={{ previousPath, currentPath }}>
      {children}
    </NavigationContext.Provider>
  );
};
