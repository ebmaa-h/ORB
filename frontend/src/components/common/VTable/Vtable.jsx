/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function VTable({ data, linkPrefix, idField, excludedCol, type}) {
  const navigate = useNavigate();

  // Mapping of object keys to human-readable column names
  const columnMapping = {
    medical_aid_name: 'Medical Aid Name',
    medical_aid_nr: 'Medical Aid Nr',
    plan_code: 'Plan Code',
    plan_name: 'Plan Name',
    profile_id: 'Profile ID',
    // Add more as needed...
  };

  const handleRowClick = (id) => {
    if (id && linkPrefix) {
      navigate(`/${linkPrefix}/${id}`);
    }
  };

  return (
    <table className="table-auto w-full border-collapse border-y border-gray-blue-100 text-gray-dark">
      <thead>
        <tr>
          <th colSpan="2" className="border border-gray-blue-100 p-2">{type}</th>
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
                .filter(([key]) => !excludedCol.includes(key)) // Exclude columns based on the passed list
                .map(([key, value]) => {
                  const label = columnMapping[key] || key; // Get human-readable label from mapping or use key as fallback
                  return (
                    <tr key={key} className="cursor-pointer hover:bg-gray-blue-100">
                      <th className="border border-gray-blue-100 p-2">{label}</th>
                      <td className="border border-gray-blue-100 p-2">
                        {value !== null && value !== undefined ? value : '-'}
                      </td>
                    </tr>
                  );
                })}
            </tr>
          ))
        ) : (
          <tr>
            <td className="border border-gray-blue-100 p-2" colSpan="2">
              No data found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
