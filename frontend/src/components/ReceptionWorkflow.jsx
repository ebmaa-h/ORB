import { useEffect } from 'react'
import NewBatch from "./NewBatch";

export default function ReceptionWorkflow({ batches }) {
  useEffect(() => {
    console.log("Reception batches:", batches);
  }, [batches]);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-row gap-4'>
        <div className='container-col w-[50%] h-[100px]'>
          Inbox
        </div>
        <div className='container-col w-[50%] h-[100px]'>
          Outbox
        </div>

      </div>
      <div className='container-col h-[100px]'>
        In Progress
      </div>
      {/* <NewBatch /> */}
    </div>
  )
}
