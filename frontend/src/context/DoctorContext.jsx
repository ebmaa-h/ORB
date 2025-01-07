import { createContext, useState } from 'react';

export const DoctorContext = createContext();

// eslint-disable-next-line react/prop-types
export const DoctorProvider = ({ children }) => {
  const [doctor, setDoctor] = useState(null);

  return (
    <DoctorContext.Provider value={{ doctor, setDoctor }}>
      {children}
    </DoctorContext.Provider>
  );
};
