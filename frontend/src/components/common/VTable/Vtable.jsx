/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function VTable({ data, linkPrefix, idField, excludedCol = [], type }) {
  const navigate = useNavigate();

  // Mapping of object keys to human-readable column names
  const columnMapping = {
    medical_aid_name: 'Medical Aid Name',
    medical_aid_nr: 'Medical Aid Nr',
    plan_code: 'Plan Code',
    plan_name: 'Plan Name',
    name: 'Full Name',
    gender: 'Gender',
    date_of_birth: 'Date of Birth',
    addresses: 'Addresses',
    contactNumbers: 'Contact Nrs',
    emails: 'Emails',
    dependent_nr: 'Dept Nr',

  };

  console.log(data)
  const handleRowClick = (id) => {
    if (id && linkPrefix) {
      navigate(`/${linkPrefix}/${id}`);
    }
  };

  return (
    <table className="table-auto w-full border-collapse border-y border-gray-blue-100 text-gray-dark">
      <thead>
        <tr>
          <th colSpan="2" className="border border-gray-blue-100 p-2 w-[50%]">{type}</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item) => (
            <tr
              key={item[idField]}
              className="cursor-pointer w-full"
              onClick={() => handleRowClick(item[idField])}
            >
              {Object.entries(item)
                .filter(([key]) => !excludedCol.includes(key)) // Exclude columns based on the passed list
                .map(([key, value]) => {
                  const label = columnMapping[key] || key; // Get human-readable label from mapping or use key as fallback
                  return (
                    <tr key={key} className="cursor-pointer hover:bg-gray-blue-100 w-full flex text-left">
                      <th className="border border-gray-blue-100 p-2 min-w-[150px]">{label}</th>
                      <td className="border border-gray-blue-100 p-2 w-full">
                        {/* {console.log(value)} */}
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
