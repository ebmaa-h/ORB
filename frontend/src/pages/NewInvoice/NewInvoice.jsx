import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';

export default function NewInvoice() {
  const { accountId } = useParams();

  return (
    <>
      {accountId ? (
        <div>
          <div className='container-col'>
            <p>Account ID: {accountId}</p>
          </div>
          <div className='container-col'>
            <p>Guarantor</p>
            <p>Patient</p>
          </div>
        </div>
      ) : (
        <div className='container-col items-center'>
          <p>Loading invoice...</p>
        </div>
      )}
    </>
  );
}
