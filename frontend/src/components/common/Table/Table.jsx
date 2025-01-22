/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';

export default function Table({ data, columns, linkPrefix, idField }) {
  const navigate = useNavigate();

  const handleRowClick = (id) => {
    // Navigate to the relevant page
    navigate(`/${linkPrefix}/${id}`);
  };

  // console.log("DATA: ",data); // {patient_full: 'Mrs Jo-Anne Smith', patient_id: '7207240000000'}

  return (
      <table className="table-auto w-full border-collapse border border-gray-light text-sm text-gray-dark">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="border border-gray-light p-2">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item) => (
              <tr
              key={item[idField]}
              className="cursor-pointer hover:bg-gray-light"
              onClick={() => handleRowClick(item[idField])} // Handle row click
              >
                {Object.values(item).map((value, key) => (
                  <td 
                    key={key} 
                    className="border border-gray-light p-2 text-center"
                    >

                    {value}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-gray-light p-2 text-center" colSpan={columns.length}>
                No data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
  );
}
