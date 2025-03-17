import { useEffect, useState } from 'react';
import axios from 'axios';
import ENDPOINTS from '../../config/apiEndpoints';

export default function Notes({ tableName, id }) {
  const [notes, setNotes] = useState([]);

  // Fetch Notes on component mount or id change
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axios.get(ENDPOINTS.fetchNotes(tableName, id));
        setNotes(response.data.notes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    if (id) {
      fetchNotes();
    }
  }, [id]);

  return (
    <div className="container-col">
      <h3 className="uppercase font-bold">Notes</h3>
      <div className="p-2">
        {notes.length ? (
          notes.map((note) => (
            <div key={note.note_id} className="mb-2">
              <p className="font-semibold">{note.user_name}</p>
              <p>{note.note}</p>
              <p className="text-sm text-gray-900">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p>No notes available.</p>
        )}
      </div>

      <input
        type="text"
        placeholder="New Note"
        className="p-2 w-full border mt-2"
      />
    </div>
  );
}
