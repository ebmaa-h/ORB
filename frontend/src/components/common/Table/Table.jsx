import { useNavigate } from 'react-router-dom';

export default function Table({ data, columns, linkPrefix, idField }) {
  const navigate = useNavigate();

  const handleRowClick = (id) => {
    // Navigate to the relevant page
    if (id) {
      navigate(`/${linkPrefix}/${id}`);  
    };
  }


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
              key={item[idField]} //?? crypto.randomUUID()
              className="cursor-pointer hover:bg-gray-blue-100"
              onClick={() => handleRowClick(item[idField])} // Handle row click
              >
                {Object.values(item).map((value, key) => (
                  <td 
                    key={key} 
                    className="border-y border-gray-blue-100 p-2 text-center "
                    >
                      {/* Not really rquired as most data is 'required' so table data wont really be empty, come back later */}
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
