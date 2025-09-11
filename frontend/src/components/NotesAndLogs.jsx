import { useEffect, useState, useContext } from 'react';
import axiosClient from '../config/axiosClient';
import ENDPOINTS from '../config/apiEndpoints';
import { UserContext } from '../context/UserContext';
import { SearchBar } from '../components';

export default function NotesAndLogs({ tableName, id, refreshTrigger }) {
  const { user } = useContext(UserContext);
  const [items, setItems] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchNotesAndLogs = async () => {
      setLoading(true);
      try {
        const [notesRes, logsRes] = await Promise.all([
          axiosClient.get(ENDPOINTS.fetchNotes(tableName, id)),
          axiosClient.get(ENDPOINTS.fetchLogs(tableName, id)),
        ]);

        // console.log(logsRes)

        const formattedNotes = notesRes.data.notes.map(note => ({
          type: 'note',
          id: `note-${note.note_id}`,
          created_at: note.created_at,
          email: note.email,
          content: note.note,
        }));

        // console.log(logsRes)
        const formattedLogs = logsRes.data.map(log => ({
          type: 'log',
          id: `log-${log.log_id}`,
          action: log.action,
          target_table: log.target_table,
          target_id: log.target_id,
          created_at: log.timestamp,
          email: log.email,
          content: formatLogContent(log),
        }));

        // Combine notes and logs then sort by date
        const combined = [...formattedNotes, ...formattedLogs].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

 

        setItems(combined);
      } catch (error) {
        console.error("Error fetching notes/logs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotesAndLogs();
    }
  }, [tableName, id, refreshTrigger]);

  const columnNames = {
    file_nr: 'File Nr',
    auth_nr: 'Auth Nr',
    date_of_service: 'Date of Service',
    status: 'Status',
    ref_client_id: 'Referring Client',
  }

  const friendlyTableNames = {
    invoices: 'Invoice',
    accounts: 'Account',
  };

  const formatLogContent = (log) => {
    const action = log.action;
    const tableName = log.target_table;
    const targetId = log.target_id;
  
    if (action === 'create') {
      const readableTable = friendlyTableNames[tableName] || tableName;
      return `${log.email} created ${readableTable} #${targetId}.`;
    }
  
    if (action === 'delete') {
      const readableTable = friendlyTableNames[tableName] || tableName;
      return `${log.email} deleted ${readableTable} #${targetId}.`;
    }
  
    if (action === 'update') {
      if (!log.changes) return `${log.email} made an update`;
  
      let parsedChanges = {};
      try {
        parsedChanges = JSON.parse(log.changes);
      } catch (e) {
        return `${log.email} made an update (invalid change log format)`;
      }
  
      const parts = Object.entries(parsedChanges).map(
        ([field, { new: newVal, old: oldVal }]) =>
          `changed ${columnNames[field] || field} from ${oldVal ?? 'none'} to ${newVal ?? '-'}`
      );
  
      return `${log.email} ${parts.join(' | ')}`;
    }
  
    return `${log.email} performed unknown action "${action}"`;
  };
  

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setLoading(true);
    try {
      const res = await axiosClient.post(
        ENDPOINTS.addNote(tableName, id),
        { userId: user.user_id, note: newNote },
        { withCredentials: true }
      );
      const addedNote = res.data.note;

    // console.log('addedNote, ', addedNote)

      const formatted = {
        type: 'note',
        id: `note-${addedNote.note_id}`,
        created_at: addedNote.created_at,
        email: addedNote.email,
        content: `${addedNote.note}`,
      };

      // console.log('formatted, ', formatted)

      setItems((prev) => [...prev, formatted].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      ));
      setNewNote("");
    } catch (err) {
      console.error("Error adding note:", err);
    }
    setLoading(false);
  };

  const filteredHistory = items.filter((item) =>
    Object.values(item).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-col">
      <div className='flex flex-row items-center justify-start gap-6'>
        <h3 className="font-bold">History</h3>

          <label className='flex gap-2 items-center text-gray-800'>
            {/* Toggling logs visibility */}
            <input
              type="checkbox"
              checked={showLogs}
              onChange={() => setShowLogs(!showLogs)}
            />
            {/* {showLogs ? "Hide Logs" : "Show Logs"} */}
            Logs
          </label>
          {/* Filter */}
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="h-[25px] text-sm btn-class"/>
      </div>
      <div className="flex flex-col gap-1 justify-center">
        {filteredHistory.length ? (
          filteredHistory.map((item) => (
            <div key={item.id} className={`flex gap-4 items-start ${item.type === 'log' && !showLogs ? 'hidden' : ''}`}>
              <p className="text-gray-700 w-[160px] shrink-0">
                {new Date(item.created_at).toLocaleString()}
              </p>
              <p className={` ${item.type === 'log' ? 'text-gray-700 italic' : ''}`}>
                {item.type === 'note'
                  ? `${item.email} - ${item.content}`
                  : item.content}
              </p>
            </div>
          ))
        ) : (
          <p>No notes or logs yet.</p>
        )}
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="New Note"
          className="flex-1 btn-class"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
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
