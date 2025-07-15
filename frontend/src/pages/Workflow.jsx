import { useContext } from 'react';
import { UserContext } from '../context/UserContext'; 

export default function Workflow() {
  const { user } = useContext(UserContext); 


  return (
    <div className='flex flex-col'>
      <div className='container-col'>
        <p>Hello {user.first}.</p>
      </div>


      </div>
  );
}

  // const { clientId, setClientId } = useContext(ClientContext);
      {/* <div className='flex gap-4'>
        {['clients', 'other', 'users'].map((category) => (
          <div className="container-col" key={category}>
            <p>{category.charAt(0).toUpperCase() + category.slice(1)}</p>
            {category == 'clients'&&
              <select
                className="cursor-pointer border rounded border-gray-300 px-2 hover:border-ebmaa-purple transition duration-300 w-[200px] h-[30px]"
                value={clientId || ""}
                onChange={(e) => {
                  const selectedClientId = e.target.value;
                  setClientId(selectedClientId);
                  }}
                  >
                <option disabled={!!clientId}>Select Client</option>
                {user.client_access.map((client, i) => (
                  <option key={i} className='hover:bg-ebmaa-purple' value={client.client_id}>
                    {client.client_name}
                  </option>
                ))}
              </select>}
            <div className="flex gap-4">
              {getUserFeaturesByCategory(user, category).map(({ name, label, path }) => (
                <FeatureBlock key={name} text={label} link={path} />
              ))}
            </div>
          </div>
          
        ))}
      </div> */}