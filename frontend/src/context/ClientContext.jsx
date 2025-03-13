import { createContext, useState } from 'react';

export const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [clientId, setClientId] = useState(null);

  return (
    <ClientContext.Provider value={{ client, setClient, clientId, setClientId }}>
      {children}
    </ClientContext.Provider>
  );
};
