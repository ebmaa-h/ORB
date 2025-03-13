

export default function Notes({ tableName, tableId }) {

  // Get Notes from API
  // Call Notes that includes the table + id
  // Display notes

  return (
    <div className="container-col">
      <h3 className="uppercase font-bold">Notes</h3>
      <div className="bg-gray-100 p-2">
        <p>2024-07-12 | 10:00 | Hello this is a random note text</p>
        <p>2024-07-12 | 10:00 | Hello this is a random note text. Hello this is a random note text. Hello this is a random note text</p>
        <p>2024-07-12 | 10:00 | Hello this is a random note text. Hello this is a random note text. Hello this is a random note text. Hello this is a random note text. Hello this is a random note text</p>
        <p>2024-07-12 | 10:00 | Hello this is a random note text. Hello this is a random note text. Hello this is a random note text</p>
        <p>2024-07-12 | 10:00 | Hello this is a random note text</p>
        {/* {tableName}
        {tableId} */}

       {/* <label className=" whitespace-nowrap">
          New Note
        </label> */}

      </div>
      <input
        type='text'
        placeholder="New Note"
        // id={id || label.toLowerCase()}

        className={`p-2 w-full border`}
      />
    </div>
  )
}
