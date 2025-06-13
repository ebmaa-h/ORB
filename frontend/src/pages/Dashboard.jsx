import { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext'; 
import { ClientContext } from '../context/ClientContext';
import { Nav, FeatureBlock } from '../components';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useContext(UserContext); 
  const { clientId, setClientId } = useContext(ClientContext);
  const navigate = useNavigate();

  // Helper function to find a specific feature by name
  const findFeature = (featureName) => 
    user.features.find((feature) => feature.feature_name === featureName && feature.is_active);

  return (
    <div className='flex flex-col'>
      <div className='container-col'>
        <p>Hello {user.first}.</p>
        <p>Stats here</p>
        <p>Hello {user.first}.</p>
        <p>maybe other details graphs or workflow, not yet sure where ill put the workflow, its quite complicated, might take a full page or if displayed on dash ill have to make it smaller and with a scroll bar</p>
        <p>Hello {user.first}.</p>
        <p>Hello {user.first}.</p>
      </div>
      <div className='flex flex-row gap-4'>
        <div className='container-col'>
          <select
            className="cursor-pointer border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300 w-[200px] h-[30px]"
            value={clientId || ""}
            onChange={(e) => {
              const selectedClientId = e.target.value;
              setClientId(selectedClientId);
              // if (selectedClientId) {
                //   navigate('/client/info');
                // }
              }}
              >
            <option disabled={!!clientId}>Select Client</option>
            {user.client_access.map((client, i) => (
              <option key={i} className='hover:bg-ebmaa-purple' value={client.client_id}>
                {client.client_name}
              </option>
            ))}
          </select>
            <div className={`flex gap-4 ${clientId ? '' : 'disabled'}`}>

            {findFeature("profiles") && (
              <FeatureBlock text="Accounts" link="/accounts" />
            )}
            {findFeature("invoices") && (
              <FeatureBlock text="Invoices" link="/invoices" />
            )}
            {findFeature("crq") && (
              <FeatureBlock text="CRQ" link="/client/info" />
            )}
            {findFeature("crq") && (
              <FeatureBlock text="Reports" link="/client/info" />
            )}

          </div>
        </div>
        <div className='container-col'>
          <p>Other</p>
          <div className={`flex gap-4`}>
            {findFeature("records") && (
              <FeatureBlock text="Records" link="/records" />
            )}
            {findFeature("records") && (
              <FeatureBlock text="Profiles" link="/profiles" />
            )}
            {/* {findFeature("records") && (
              <FeatureBlock text="Records" link="/records" />
              )} */}
            {/* {findFeature("records") && (
              <FeatureBlock text="Profiles" link="/profiles" />
              )} */}
          </div>
        </div>
        <div className='container-col'>
          <p>Tools</p>
          <div className={`flex gap-4`}>
            {findFeature("records") && (
              <FeatureBlock text="Records" link="/records" />
            )}
            {findFeature("records") && (
              <FeatureBlock text="Profiles" link="/profiles" />
            )}
            {/* {findFeature("records") && (
              <FeatureBlock text="Records" link="/records" />
              )} */}
            {/* {findFeature("records") && (
              <FeatureBlock text="Profiles" link="/profiles" />
              )} */}
          </div>
        </div>
      </div>
    </div>
  );
}
