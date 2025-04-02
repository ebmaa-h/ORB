import { useEffect, useState } from 'react';
import axios from 'axios';
import ENDPOINTS from '../../config/apiEndpoints';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext'; 

export default function Notes({ tableName, id }) {
  const { user } = useContext(UserContext); 
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  
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

  }, [tableName, id]);
  
  // Handle adding a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) return; // Prevent empty note submission
    
    setLoading(true);
    try {
      const response = await axios.post(
        ENDPOINTS.addNote(tableName, id),
        { userId: user.user_id, note: newNote },
        { withCredentials: true }
      );
      console.log(response);
      
      // Append new note to state (so we don’t need another fetch)
      setNotes((prevNotes) => [...prevNotes, response.data.note]);
      setNewNote(""); // Clear input after submission
    } catch (error) {
      console.error('Error adding note:', error);
    }
    setLoading(false);
  };
  
  return (
    <div className="container-col">
      <h3 className="uppercase font-bold">Notes</h3>
      <div className="">
        {notes.length ? (
          notes.map((note) => (
            <div key={note.note_id} className="flex gap-4 items-center">
              <p className="text-sm text-gray-900">
                {new Date(note.created_at).toLocaleString()}
              </p>
              <p className="font-semibold">{note.user_name}</p>
              <p>{note.note}</p>
            </div>
          ))
        ) : (
          <p>No notes available.</p>
        )}
      </div>

      <div className="flex gap-4 mt-4">
        <input
          type="text"
          placeholder="New Note"
          className="flex-1 btn-class"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()} // Allow Enter key submission
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleAddNote}
          className="btn-class w-[100px] cursor-pointer"
          disabled={!newNote.trim() || loading}
        >
          {loading ? "Adding..." : "Add Note"}
        </button>
      </div>
    </div>
  );
}
