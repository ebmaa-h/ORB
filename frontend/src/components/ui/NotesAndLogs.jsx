import { useContext, useEffect, useMemo, useState } from 'react';
import axiosClient from '../../utils/axiosClient';
import ENDPOINTS from '../../utils/apiEndpoints';
import { UserContext } from '../../context/UserContext';
import { SearchBar } from '../../components';
import socket from '../../utils/socket';

const normalizeFilterType = (filterType) => (filterType === 'fu' ? 'foreign_urgent' : 'normal');

const sortByDateDesc = (list) =>
  [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

const toNoteItem = (note) => ({
  type: 'note',
  id: `note-${note.note_id}`,
  created_at: note.created_at,
  email: note.email,
  content: note.note,
});

const toLogItem = (log) => ({
  type: 'log',
  id: `log-${log.log_id}`,
  created_at: log.created_at,
  email: log.email,
  content: log.message || '',
  action: log.action,
  metadata: log.metadata || null,
});

export default function NotesAndLogs({ department, filterType = 'normal' }) {
  const { user } = useContext(UserContext);
  const [items, setItems] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const batchType = useMemo(() => normalizeFilterType(filterType), [filterType]);

  useEffect(() => {
    if (!department) {
      setItems([]);
      return;
    }

    let cancelled = false;

    const fetchNotesAndLogs = async () => {
      setIsLoading(true);
      try {
        const [notesRes, logsRes] = await Promise.all([
          axiosClient.get(ENDPOINTS.workflowNotes(department, batchType)),
          axiosClient.get(ENDPOINTS.workflowLogs(department, batchType)),
        ]);

        if (cancelled) return;

        const formattedNotes = (notesRes.data || []).map(toNoteItem);
        const formattedLogs = (logsRes.data || []).map(toLogItem);
        setItems(sortByDateDesc([...formattedNotes, ...formattedLogs]));
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch workflow notes/logs:', err);
          setItems([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchNotesAndLogs();

    return () => {
      cancelled = true;
    };
  }, [department, batchType]);

  useEffect(() => {
    const handleNoteCreated = (payload) => {
      if (!payload || payload.department !== department || payload.batch_type !== batchType) return;
      const noteItem = toNoteItem(payload);
      setItems((prev) => {
        if (prev.some((item) => item.id === noteItem.id)) return prev;
        return sortByDateDesc([...prev, noteItem]);
      });
    };

    const handleLogCreated = (payload) => {
      if (!payload || payload.department !== department || payload.batch_type !== batchType) return;
      const logItem = toLogItem(payload);
      setItems((prev) => {
        if (prev.some((item) => item.id === logItem.id)) return prev;
        return sortByDateDesc([...prev, logItem]);
      });
    };

    socket.on('workflow:noteCreated', handleNoteCreated);
    socket.on('workflow:logCreated', handleLogCreated);

    return () => {
      socket.off('workflow:noteCreated', handleNoteCreated);
      socket.off('workflow:logCreated', handleLogCreated);
    };
  }, [department, batchType]);

  const handleAddNote = async () => {
    const trimmed = newNote.trim();
    if (!trimmed || !department || !user?.user_id) return;

    setIsSubmitting(true);
    try {
      const response = await axiosClient.post(
        ENDPOINTS.workflowNotes(department, batchType),
        { userId: user.user_id, note: trimmed },
        { withCredentials: true }
      );

      if (response?.data?.note_id) {
        const noteItem = toNoteItem(response.data);
        setItems((prev) => {
          if (prev.some((item) => item.id === noteItem.id)) return prev;
          return sortByDateDesc([...prev, noteItem]);
        });
      }

      setNewNote('');
    } catch (err) {
      console.error('Error adding workflow note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchLower = searchTerm.toLowerCase();
  const filteredHistory = items.filter((item) => {
    const parts = [item.email, item.content, item.action, item.metadata ? JSON.stringify(item.metadata) : ''];
    return parts.join(' ').toLowerCase().includes(searchLower);
  });

  const renderText = (item) => {
    if (item.email) {
      return `${item.email} - ${item.content}`;
    }
    return item.content;
  };

  return (
    <div className="container-col">
      <div className="flex flex-row items-center justify-start gap-6">
        <label className="flex gap-2 items-center text-gray-800">
          <input
            type="checkbox"
            checked={showLogs}
            onChange={() => setShowLogs((prev) => !prev)}
          />
          Logs
        </label>
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          classes="h-[25px] text-sm btn-class"
        />
      </div>

      <div className="flex flex-col gap-1 justify-center min-h-[10px]">
        {isLoading ? (
          <p>Loading notes and logs...</p>
        ) : filteredHistory.length ? (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className={`flex gap-4 items-start ${item.type === 'log' && !showLogs ? 'hidden' : ''}`}
            >
              <p className="text-gray-700 w-[160px] shrink-0">
                {new Date(item.created_at).toLocaleString()}
              </p>
              <p className={item.type === 'log' ? 'text-gray-700 italic' : ''}>
                {renderText(item)}
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
          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={handleAddNote}
          className="btn-class w-[100px] cursor-pointer"
          disabled={isSubmitting || !newNote.trim()}
        >
          {isSubmitting ? 'Adding...' : 'Add Note'}
        </button>
      </div>
    </div>
  );
}
