/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Table({ data, columns, linkPrefix, idField, excludedCol, direction }) {
  const navigate = useNavigate();
  const [displayData, setDisplayData] = useState({})


  const handleRowClick = (id) => {
    // Navigate to the relevant page
    if (id && linkPrefix) {
      navigate(`/${linkPrefix}/${id}`);  
    };
  }

  console.log('table loaded')
  // console.log('excludedCol',excludedCol)


  // console.log("DATA: ",data); // {patient_full: 'Mrs Jo-Anne Smith', patient_id: '7207240000000'}

  return (
      <table className="table-auto w-full border-collapse border-y border-gray-blue-100 text-gray-dark">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="p-2">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item) => (
              <tr
                key={item[idField]}
                className="cursor-pointer hover:bg-gray-blue-100"
                onClick={() => handleRowClick(item[idField])}
              >
              {Object.entries(item)
                  .filter(([key]) => (excludedCol ?? []).includes(key) === false) // Default to [] to avoid error
                  .map(([key, value]) => (
                    <td key={key} className="border-y border-gray-blue-100 p-2 text-center">
                      {value !== null && value !== undefined ? value : '-'}
                    </td>
                  ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-gray-blue-100 p-2" colSpan={columns.length}>
                No data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
  );
}
