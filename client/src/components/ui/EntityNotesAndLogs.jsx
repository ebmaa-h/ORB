import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const getFuBatchId = (meta = {}) =>
  meta.foreign_urgent_batch_id ?? meta.fu_batch_id ?? meta.foreignUrgentBatchId ?? null;

const extractBatchId = (item) => {
  const metadata = item?.metadata || {};
  const fuId = getFuBatchId(metadata);
  const fallback = metadata.batch_id ?? metadata.batchId ?? item.entity_id ?? null;
  if (isForeignUrgentMeta(metadata)) {
    return fuId || fallback || null; // allow batch_id fallback when FU id is missing in metadata
  }
  return fallback;
};

const isForeignUrgentMeta = (meta = {}) => {
  const batchType = (meta.batch_type || "").toLowerCase();
  return (
    Boolean(meta.foreign_urgent_batch_id) ||
    Boolean(meta.is_pure_foreign_urgent) ||
    Boolean(meta.is_foreign_urgent) ||
    batchType === "foreign_urgent"
  );
};

const getChangeEntries = (metadata) => {
  if (!metadata || typeof metadata !== "object" || !metadata.changes) return [];
  return Object.entries(metadata.changes).filter(([_, diff]) => diff && (diff.before !== diff.after));
};

const formatChangeValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    // Normalize ISO-like date strings to date-only.
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return value.split("T")[0];
    }
    return value;
  }
  return String(value);
};

const FIELD_LABELS = {
  "invoice.type": "Invoice Type",
  "invoice.date_of_service": "Date of Service",
  "invoice.nr_in_batch": "Nr in Batch",
  "invoice.balance": "Balance",
  "invoice.status": "Status",
  "invoice.file_nr": "File #",
  "invoice.auth_nr": "Auth #",
  "invoice.plan_name": "Plan",
  "invoice.plan_code": "Plan Code",
  "invoice.medical_aid_name": "Medical Aid",
  "invoice.medical_aid_nr": "Medical Aid #",
  "invoice.main_member_dependent_nr": "Main Member Dep #",
  "invoice.patient_dependent_nr": "Patient Dep #",
  "invoice.main_member_id_nr": "Main Member ID",
  "invoice.patient_id_nr": "Patient ID",
  "invoice.main_member_first": "Main Member First",
  "invoice.main_member_last": "Main Member Last",
  "invoice.patient_first": "Patient First",
  "invoice.patient_last": "Patient Last",
  "member.first": "Member First",
  "member.last": "Member Last",
  "member.title": "Member Title",
  "member.date_of_birth": "Member DOB",
  "member.dob": "Member DOB",
  "member.gender": "Member Gender",
  "member.id": "Member ID",
  "member.id_nr": "Member ID Nr",
  "member.dependent_nr": "Member Dep #",
  "member.dependent_number": "Member Dep #",
  "patient.first": "Patient First",
  "patient.last": "Patient Last",
  "patient.title": "Patient Title",
  "patient.date_of_birth": "Patient DOB",
  "patient.dob": "Patient DOB",
  "patient.gender": "Patient Gender",
  "patient.id": "Patient ID",
  "patient.id_nr": "Patient ID Nr",
  "patient.dependent_nr": "Patient Dep #",
  "patient.dependent_number": "Patient Dep #",
};

const formatChangeFieldLabel = (field) => {
  if (!field) return "Field";
  const raw = String(field).trim();
  const lowered = raw.toLowerCase();
  if (FIELD_LABELS[lowered]) return FIELD_LABELS[lowered];

  const cleaned = lowered
    .replace(/^(data\.|invoice\.|member\.|patient\.|account\.)+/, "")
    .replace(/[._]+/g, " ")
    .trim();
  if (!cleaned) return "Field";

  const special = {
    id: "ID",
    dob: "DOB",
    nr: "Nr",
    dep: "Dep",
  };

  return cleaned
    .split(" ")
    .map((part) => {
      if (special[part]) return special[part];
      return part ? part[0].toUpperCase() + part.slice(1) : "";
    })
    .join(" ");
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
  showBatchLink = true,
}) {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogs, setShowLogs] = useState(initialShowLogs);
  const navigate = useNavigate();
  const [openChangesId, setOpenChangesId] = useState(null);
  const [openChangesPayload, setOpenChangesPayload] = useState(null);
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
    (itemOrId, explicitId = null) => {
      const meta = typeof itemOrId === "object" && itemOrId !== null ? itemOrId.metadata || {} : {};
      const batchId =
        explicitId ??
        (typeof itemOrId === "object" && itemOrId !== null ? extractBatchId(itemOrId) : String(itemOrId || ""));
      if (!batchId) return;

      if (typeof onBatchNavigate === "function") {
        const handled = onBatchNavigate({ batchId, meta });
        if (handled) return;
      }
      const fromPath = `${location.pathname}${location.search}`;
      const basePath = isForeignUrgentMeta(meta) ? "/fu-batches" : "/batches";
      navigate(`${basePath}/${batchId}`, { state: { from: fromPath, meta } });
    },
    [navigate, onBatchNavigate, location.pathname, location.search],
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

const renderLogDetails = () => null;

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

      <div className="flex flex-col gap-3" style={listStyle}>
        {isLoading ? (
          <p>Loading notes and logs...</p>
        ) : filteredItems.length ? (
          filteredItems.map((item) => (
            (() => {
              const isLog = item.type === "log";
              const changes = isLog ? getChangeEntries(item.metadata || {}) : [];
              const metadata = item.metadata || {};
              const fromDept = metadata.from ?? metadata.fromDepartment ?? metadata.from_department;
              const toDept = metadata.to ?? metadata.toDepartment ?? metadata.to_department;
              const acceptedBy = metadata.accepted_by ?? metadata.acceptedBy;
              const hasMetaDetails = Boolean(fromDept || toDept || acceptedBy);
              const hasChanges = changes.length > 0;
              const isOpen = openChangesId === item.id;
              const displayName = (item.email || "Unknown user").replace(/@ebmaa\.co\.za$/i, "");
              const transferInfo =
                fromDept || toDept
                  ? {
                      from: fromDept || "Unknown",
                      to: toDept || "Unknown",
                    }
                  : null;
              const changeRows = changes.map(([field, diff]) => [
                formatChangeFieldLabel(field),
                { before: formatChangeValue(diff?.before), after: formatChangeValue(diff?.after) },
              ]);
              const canOpenDetails = Boolean(transferInfo || changeRows.length);

              return (
                <div
                  key={item.id}
                  className="relative flex flex-col gap-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] uppercase tracking-wide text-gray-blue-600 min-w-[150px]">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <span className="min-w-[60px]">{displayName}</span>
                    {showBatchLink && isLog && extractBatchId(item) && (
                      <button
                        type="button"
                        className="button-pill cursor-pointer"
                        onClick={() => handleBatchLink(item)}
                      >
                        {isForeignUrgentMeta(item.metadata || {})
                          ? `FU-Batch #${extractBatchId(item)}`
                          : `Batch #${extractBatchId(item)}`}
                      </button>
                    )}
                    {isLog && item.action && (
                      <span className="text-[11px] uppercase tracking-wide text-gray-blue-700 rounded-full bg-gray-blue-100/80 px-2 py-1">
                        {item.action}
                      </span>
                    )}
                    <span className={isLog ? "text-gray-700" : "text-gray-700 italic"}>
                      {item.content || "(no details)"}
                    </span>
                    {canOpenDetails && (
                      <button
                        type="button"
                        className="tab-pill text-xs h-[28px]"
                        onClick={() => {
                          if (isOpen) {
                            setOpenChangesId(null);
                            setOpenChangesPayload(null);
                          } else {
                            setOpenChangesId(item.id);
                            setOpenChangesPayload({ item, transfer: transferInfo, changeRows });
                          }
                        }}
                      >
                        {isOpen ? "Hide Details" : "Show Details"}
                      </button>
                    )}
                  </div>
                  {renderLogDetails(item, { changes })}
                </div>
              );
            })()
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
            className="flex-1 input-pill"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            disabled={isSubmitting || !user?.user_id}
          />
          <button
            type="button"
            onClick={handleAddNote}
            className="button-pill min-w-[160px] disabled:opacity-60"
            disabled={isSubmitting || !newNote.trim() || !user?.user_id}
          >
            {isSubmitting ? "Adding..." : "Add Note"}
          </button>
        </div>
      )}
      {openChangesId && (openChangesPayload?.transfer || openChangesPayload?.changeRows?.length) ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => {
            setOpenChangesId(null);
            setOpenChangesPayload(null);
          }}
        >
          <div
            className="w-auto max-w-[90vw] p-2 overflow-hidden rounded-lg border border-gray-blue-100 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">Changes</p>
              <button
                type="button"
                className="text-xs uppercase tracking-wide text-gray-blue-600 hover:text-gray-800"
                onClick={() => {
                  setOpenChangesId(null);
                  setOpenChangesPayload(null);
                }}
              >
                Close
              </button>
            </div>
            {openChangesPayload.transfer ? (
              <div className="px-5 py-6">
                <div className="flex items-center gap-3 text-sm text-gray-900">
                  <span className="px-3 py-1 rounded-full bg-gray-blue-100/70 font-semibold">
                    {openChangesPayload.transfer.from}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 -960 960 960"
                    width="28"
                    height="28"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z" />
                  </svg>
                  <span className="px-3 py-1 rounded-full bg-gray-blue-100/70 font-semibold">
                    {openChangesPayload.transfer.to}
                  </span>
                </div>
              </div>
            ) : null}
            {!openChangesPayload.transfer && openChangesPayload.changeRows?.length ? (
              <div className="overflow-y-auto overflow-x-hidden max-h-[420px]">
                <table className="table-auto text-sm w-full">
                  <thead className="bg-gray-blue-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-blue-600">
                    <tr>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Field</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Previous</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">New</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-blue-50">
                    {openChangesPayload.changeRows.map(([field, diff]) => (
                      <tr key={field}>
                        <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">
                          {formatChangeFieldLabel(field)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatChangeValue(diff?.before)}
                        </td>
                        <td className="px-3 py-2 text-gray-800 font-semibold">
                          {formatChangeValue(diff?.after)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
