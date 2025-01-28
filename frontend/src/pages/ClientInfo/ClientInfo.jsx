import { useEffect, useState } from 'react';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';

export default function ClientInfo() {
  const [clientId, setClientId] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);

  ClientInfo
  // Fetch invoice details
  useEffect(() => {
    const getClientDetails = async () => {
      try {
        const response = await axios.get(`${ENDPOINTS.clientInfo}/${clientId}`, {
          withCredentials: true,
        });

        const data = response.data.client;

        setClientInfo(data || {});

      } catch (error) {
        console.error('Error fetching invoice details:', error);
      }
    };

    if (clientId) {
      getClientDetails();
    }
  }, []);


  return (
    <>
      {clientId ? (
        <>
          <div className="container-col">
            Client Info page
          </div>
        </>
      ) : (
        <div className='container-col items-center'>
          <p>Loading client details...</p>
        </div>
      )}
    </>
  );
}
