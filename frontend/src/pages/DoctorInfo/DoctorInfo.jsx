import { useEffect, useState } from 'react';
import ENDPOINTS from '../../config/apiEndpoints';
import axios from 'axios';

export default function InvoiceDetails() {
  const [doctorId, setDoctorId] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);


  // Fetch invoice details
  useEffect(() => {
    const getDoctorDetails = async () => {
      try {
        const response = await axios.get(`${ENDPOINTS.doctorInfo}/${doctorId}`, {
          withCredentials: true,
        });

        const data = response.data.doctor;

        setDoctorInfo(data || {});

      } catch (error) {
        console.error('Error fetching invoice details:', error);
      }
    };

    if (doctorId) {
      getDoctorDetails();
    }
  }, []);


  return (
    <>
      {doctorId ? (
        <>
          <div className="bg-white shadow rounded m-4 p-4 flex flex-row gap-4  justify-between">
            Doctor Info page
          </div>
        </>
      ) : (
        <p>Loading invoice details...</p>
      )}
    </>
  );
}
