import React from 'react'

function BatchLists({ batches }) {

  return (
    <div>
      <div className="flex flex-row gap-4">
        <div className="container-col w-[50%] h-[100px]">Filing</div>
        <div className="container-col w-[50%] h-[100px]">Outbox</div>
      </div>
      <div className="container-col h-[100px]">In Progress</div>
    </div>
  )
}

export default BatchLists
