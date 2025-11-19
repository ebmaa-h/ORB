import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../utils/axiosClient";
import ENDPOINTS from "../../utils/apiEndpoints";
import { UserContext } from "../../context/UserContext";
import SearchBar from "./SearchBar";

const normalizeId = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (!Number.isNaN(Number(trimmed))) return String(Number(trimmed));
  return trimmed;
};

const sortByDateDesc = (list) =>
  [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

const safeParseJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const toNoteItem = (note) => ({
  type: "note",
  id: `note-${note.note_id}`,
  created_at: note.created_at,
  email: note.email,
  content: note.note,
  entity_id: note.entity_id,
  entity_type: note.entity_type,
});

const toLogItem = (log) => ({
  type: "log",
  id: `log-${log.log_id}`,
  created_at: log.created_at,
  email: log.email,
  content: log.message || "",
  action: log.action,
  metadata: typeof log.metadata === "string" ? safeParseJson(log.metadata) : log.metadata || null,
  entity_id: log.entity_id,
  entity_type: log.entity_type,
});

const extractBatchId = (item) => {
  const metadata = item?.metadata || {};
  return (
    metadata.batch_id ??
    metadata.batchId ??
    metadata.parent_batch_id ??
    metadata.foreign_urgent_batch_id ??
    item.entity_id ??
    null
  );
};

const getChangeEntries = (metadata) => {
  if (!metadata || typeof metadata !== "object" || !metadata.changes) return [];
  return Object.entries(metadata.changes).filter(([_, diff]) => diff && (diff.before !== diff.after));
};

const formatChangeValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const useLogDetailToggles = () => {
  const [collapsed, setCollapsed] = useState({});
  const toggle = useCallback((logId) => {
    if (!logId) return;
    setCollapsed((prev) => ({ ...prev, [logId]: !prev?.[logId] }));
  }, []);
  return { collapsed, toggle };
};

const CONTEXT_BUILDERS = {
  workflow: ({ department, batchType }) => {
    if (!department || !batchType) return null;
    return {
      notesEndpoint: ENDPOINTS.workflowNotes(department, batchType),
      logsEndpoint: ENDPOINTS.workflowLogs(department, batchType),
      notePayloadBuilder: ({ userId, note, entityType, entityId }) => ({
        userId,
        note,
        entityType,
        entityId,
      }),
    };
  },
};

export default function EntityNotesAndLogs({
  entityId,
  entityType = "batch",
  department,
  batchType = "normal",
  context = "workflow",
  customConfig = null,
  className = "",
  title = "Notes & Logs",
  headerDescription = null,
  onBatchNavigate = null,
  requireEntitySelection = true,
  initialShowLogs = true,
  listMaxHeight = null,
  allowedTypes = null,
  enableLogToggle = true,
  allowNotesInput = true,
  includeNotes = true,
  searchTermOverride = null,
  onSearchTermChange = null,
  showSearchInput = true,
}) {
  const { user } = useContext(UserContext);
  const [items, setItems] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogs, setShowLogs] = useState(initialShowLogs);
  const navigate = useNavigate();
  const { collapsed: collapsedChanges, toggle: toggleChanges } = useLogDetailToggles();
  const showLogsEffective = enableLogToggle ? showLogs : true;
  const effectiveSearchTerm =
    typeof searchTermOverride === "string" ? searchTermOverride : internalSearchTerm;
  const handleSearchTermChange = onSearchTermChange || setInternalSearchTerm;

  const normalizedEntityId = useMemo(() => normalizeId(entityId), [entityId]);
  const normalizedEntityType = useMemo(
    () => (entityType ? String(entityType).toLowerCase() : null),
    [entityType]
  );

  const contextConfig = useMemo(() => {
    if (customConfig) return customConfig;
    const builder = CONTEXT_BUILDERS[context];
    if (!builder) return null;
    return builder({ department, batchType });
  }, [context, department, batchType, customConfig]);

  useEffect(() => {
    setShowLogs(initialShowLogs);
  }, [initialShowLogs]);

  useEffect(() => {
    if (!enableLogToggle) {
      setShowLogs(true);
    }
  }, [enableLogToggle]);

  const matchesEntity = useCallback(
    (item) => {
      if (!normalizedEntityId) return true;
      const directId = normalizeId(item.entity_id || item.entityId);
      const typeFromItem = item.entity_type || item.entityType;
      const normalizedTypeFromItem = typeFromItem ? String(typeFromItem).toLowerCase() : null;

      if (directId === normalizedEntityId) {
        if (!normalizedEntityType || !normalizedTypeFromItem) return true;
        return normalizedTypeFromItem === normalizedEntityType;
      }

      const metadataBatchId = normalizeId(item.metadata?.batch_id);
      if (metadataBatchId && metadataBatchId === normalizedEntityId) {
        return true;
      }

      return false;
    },
    [normalizedEntityId, normalizedEntityType]
  );

  useEffect(() => {
    const hasLogsEndpoint = Boolean(contextConfig?.logsEndpoint);
    const hasNotesEndpoint = includeNotes && Boolean(contextConfig?.notesEndpoint);
    if (!contextConfig || !hasLogsEndpoint) {
      setItems([]);
      return;
    }

    let cancelled = false;

    const fetchNotesAndLogs = async () => {
      setIsLoading(true);
      try {
        const requests = [];
        if (hasNotesEndpoint) {
          requests.push(axiosClient.get(contextConfig.notesEndpoint));
        }
        requests.push(axiosClient.get(contextConfig.logsEndpoint));

        const responses = await Promise.all(requests);
        const notesResponse = hasNotesEndpoint ? responses.shift() : null;
        const logsResponse = responses[0];

        if (cancelled) return;

        const formattedNotes = hasNotesEndpoint
          ? (notesResponse?.data || []).map(toNoteItem).filter(matchesEntity)
          : [];
        const formattedLogs = (logsResponse?.data || []).map(toLogItem).filter(matchesEntity);

        setItems(sortByDateDesc([...formattedNotes, ...formattedLogs]));
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch entity notes/logs:", err);
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
  }, [contextConfig, matchesEntity, normalizedEntityId, includeNotes]);

  const handleAddNote = async () => {
    const trimmed = newNote.trim();
    if (!allowNotesInput || !includeNotes) return;
    if (!trimmed || !contextConfig?.notesEndpoint || !user?.user_id) return;
    if (requireEntitySelection && !normalizedEntityId) return;

    const payloadBuilder =
      contextConfig.notePayloadBuilder ||
      (({ userId, note }) => ({
        userId,
        note,
      }));

    setIsSubmitting(true);
    try {
      const response = await axiosClient.post(
        contextConfig.notesEndpoint,
        payloadBuilder({
          userId: user.user_id,
          note: trimmed,
          entityType,
          entityId,
        }),
        { withCredentials: true }
      );

      if (response?.data) {
        const noteItem = toNoteItem(response.data);
        if (matchesEntity(noteItem)) {
          setItems((prev) => sortByDateDesc([...prev, noteItem]));
        }
        setNewNote("");
      }
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchLink = useCallback(
    (batchId) => {
      if (!batchId) return;
      if (typeof onBatchNavigate === "function") {
        const handled = onBatchNavigate(batchId);
        if (handled) return;
      }
      navigate(`/batches/${batchId}`);
    },
    [navigate, onBatchNavigate],
  );

  const searchLower = effectiveSearchTerm.toLowerCase();
  const filteredItems = items.filter((item) => {
    if (allowedTypes && !allowedTypes.includes(item.type)) return false;
    if (item.type === "log" && !showLogsEffective) return false;
    const parts = [
      item.email,
      item.content,
      item.action,
      item.metadata ? JSON.stringify(item.metadata) : "",
    ];
    return parts.join(" ").toLowerCase().includes(searchLower);
  });

  const renderLogDetails = (item) => {
    if (item.type !== "log") return null;
    const metadata = item.metadata || {};
    const batchId = extractBatchId(item);
    const changes = getChangeEntries(metadata);
    const fromDept = metadata.from ?? metadata.fromDepartment;
    const toDept = metadata.to ?? metadata.toDepartment;
    const acceptedBy = metadata.accepted_by ?? metadata.acceptedBy;
    if (!batchId && !fromDept && !toDept && !acceptedBy && changes.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 text-xs text-gray-600 space-y-1">
        {(batchId || fromDept || toDept || acceptedBy) && (
          <div className="flex flex-wrap items-center gap-3">
            {batchId && (
              <button
                type="button"
                className="text-ebmaa-purple font-medium hover:underline"
                onClick={() => handleBatchLink(batchId)}
              >
                Batch #{batchId}
              </button>
            )}
            {fromDept && (
              <span>
                From: <strong>{fromDept}</strong>
              </span>
            )}
            {toDept && (
              <span>
                To: <strong>{toDept}</strong>
              </span>
            )}
            {acceptedBy && (
              <span>
                Accepted by: <strong>{acceptedBy}</strong>
              </span>
            )}
          </div>
        )}

        {changes.length > 0 && (() => {
          const isCollapsed = collapsedChanges[item.id] ?? true;
          return (
            <div className="rounded border border-gray-blue-100 bg-white/70 p-2">
              <button
                type="button"
                className="text-xs font-semibold uppercase tracking-wide text-gray-700 hover:text-gray-900"
                onClick={() => toggleChanges(item.id)}
              >
                {isCollapsed ? "Show Changes" : "Hide Changes"}
              </button>
              {!isCollapsed && (
                <ul className="mt-2 space-y-1">
                  {changes.map(([field, diff]) => (
                    <li key={field} className="flex flex-wrap gap-1">
                      <span className="font-semibold text-gray-800">{field}:</span>
                      <span className="text-gray-700">
                        {formatChangeValue(diff?.before)} → {formatChangeValue(diff?.after)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  const containerClasses = `container-col ${className} mt-0`.trim();

  if (!contextConfig) {
    return (
      <div className={containerClasses}>
        <p className="text-gray-dark text-sm">
          Notes & logs are unavailable because the required configuration is missing.
        </p>
      </div>
    );
  }

  if (requireEntitySelection && !normalizedEntityId) {
    return (
      <div className={containerClasses}>
        <p className="text-gray-dark text-sm">Select a batch to view its notes and logs.</p>
      </div>
    );
  }

  const listStyle = useMemo(() => {
    if (!listMaxHeight) return undefined;
    const resolvedHeight =
      typeof listMaxHeight === "number" ? `${listMaxHeight}px` : String(listMaxHeight);
    return { maxHeight: resolvedHeight, overflowY: "auto" };
  }, [listMaxHeight]);

  return (
    <div className={containerClasses}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-blue-600">{title}</p>
          {headerDescription ? (
            <p className="text-sm text-gray-blue-700">{headerDescription}</p>
          ) : normalizedEntityId ? (
            <p className="text-sm text-gray-blue-700">
              Viewing updates for #{normalizedEntityId} ({normalizedEntityType || "entity"})
            </p>
          ) : (
            <p className="text-sm text-gray-blue-700 capitalize">
              {department ? `${department} workflow` : "workflow"} ({batchType || "normal"})
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {enableLogToggle && (
            <label className="flex gap-2 items-center text-gray-800 text-sm">
              <input type="checkbox" checked={showLogs} onChange={() => setShowLogs((prev) => !prev)} />
              Show Logs
            </label>
          )}
          {showSearchInput && (
            <SearchBar
              searchTerm={effectiveSearchTerm}
              setSearchTerm={handleSearchTermChange}
              classes="h-[32px] text-sm tab-pill"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[80px]" style={listStyle}>
        {isLoading ? (
          <p>Loading notes and logs...</p>
        ) : filteredItems.length ? (
          filteredItems.map((item) => (
            <div key={item.id} className="flex gap-4 items-start text-sm">
              <p className="text-gray-700 w-[170px] shrink-0">
                {new Date(item.created_at).toLocaleString()}
              </p>
              <div className="flex-1">
                <p className={item.type === "log" ? "text-gray-700 italic" : ""}>
                  {item.email ? `${item.email} - ` : ""}
                  {item.type === "log" && item.action ? `[${item.action}] ` : ""}
                  {item.content || "(no details)"}
                </p>
                {renderLogDetails(item)}
              </div>
            </div>
          ))
        ) : (
          <p>No logs.</p>
        )}
      </div>

      {allowNotesInput && (
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="New note"
            className="flex-1 tab-pill"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            disabled={isSubmitting || !user?.user_id}
          />
          <button
            type="button"
            onClick={handleAddNote}
            className="tab-pill-dark w-[120px] cursor-pointer bg-ebmaa-purple text-white disabled:opacity-60 hover:bg-ebmaa-purple/70"
            disabled={isSubmitting || !newNote.trim() || !user?.user_id}
          >
            {isSubmitting ? "Adding..." : "Add Note"}
          </button>
        </div>
      )}
    </div>
  );
}
