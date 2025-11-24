// src/components/Workflow/Row.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExpandedRowActions from "./ExpandedRowActions";

const METHOD_OPTIONS = [
  "email",
  "driver",
  "courier",
  "doctor",
  "fax",
  "collect",
  "relative",
  "other",
];

const EDITABLE_FIELD_ORDER = [
  "batch_size",
  "client_id",
  "date_received",
  "method_received",
  "cc_availability",
  "added_on_drive",
  "corrections",
  "bank_statements",
];

const EDITABLE_FIELDS = new Set(EDITABLE_FIELD_ORDER);

const EDITABLE_FIELD_ORDER_MAP = EDITABLE_FIELD_ORDER.reduce((acc, field, index) => {
  acc[field] = index;
  return acc;
}, {});

const formatDateForInput = (value) => {
  if (!value) return "";
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return "";
  return dateObj.toISOString().slice(0, 10);
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    return ["1", "true", "yes", "y"].includes(lowered);
  }
  return false;
};

const buildInitialValues = (batch) => ({
  batch_size: batch.batch_size ?? "",
  client_id: batch.client_id ?? "",
  date_received: formatDateForInput(batch.date_received),
  method_received: batch.method_received || METHOD_OPTIONS[0],
  bank_statements: toBoolean(batch.bank_statements),
  added_on_drive: toBoolean(batch.added_on_drive),
  corrections: toBoolean(batch.corrections),
  cc_availability: batch.cc_availability ?? "",
});

const flattenForCompare = (values) => ({
  batch_size: String(values.batch_size ?? ""),
  client_id: String(values.client_id ?? ""),
  date_received: values.date_received || "",
  method_received: values.method_received || "",
  bank_statements: Boolean(values.bank_statements),
  added_on_drive: Boolean(values.added_on_drive),
  corrections: Boolean(values.corrections),
  cc_availability: values.cc_availability ?? "",
});

const Row = ({
  batch,
  primaryId,
  columns,
  onSelect,
  isSelected,
  isExpanded = false,
  mainActions,
  actions,
  onExecute,
  expandedColumns,
  canEdit = false,
  onBatchUpdate,
  onArchiveDraft,
  clients = [],
  onToggleExpand = () => {},
}) => {
  const entityId = primaryId ?? batch?.foreign_urgent_batch_id ?? batch?.batch_id;
  const navigate = useNavigate();
  const foreignUrgentCount = useMemo(() => {
    const parsed = Number(batch?.total_urgent_foreign ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [batch?.total_urgent_foreign]);
  const minBatchSize = Math.max(foreignUrgentCount, 1);
  const [editValues, setEditValues] = useState(buildInitialValues(batch));
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initialValues = useMemo(() => buildInitialValues(batch), [batch]);

  useEffect(() => {
    if (isExpanded) {
      setEditValues(initialValues);
      setSaveError("");
      setSaveSuccess(false);
    }
  }, [isExpanded, initialValues]);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = setTimeout(() => setSaveSuccess(false), 2000);
    return () => clearTimeout(timer);
  }, [saveSuccess]);

  const normalizedInitial = useMemo(() => flattenForCompare(initialValues), [initialValues]);
  const normalizedCurrent = useMemo(() => flattenForCompare(editValues), [editValues]);

  const isDirty = useMemo(() => {
    return Object.keys(normalizedInitial).some((key) => normalizedInitial[key] !== normalizedCurrent[key]);
  }, [normalizedInitial, normalizedCurrent]);

  const busy = saving || archiving;
  const editableColumns = useMemo(() => {
    return expandedColumns
      .filter((col) => EDITABLE_FIELDS.has(col.name))
      .sort((a, b) => {
        const orderA = EDITABLE_FIELD_ORDER_MAP[a.name] ?? Number.MAX_SAFE_INTEGER;
        const orderB = EDITABLE_FIELD_ORDER_MAP[b.name] ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
  }, [expandedColumns]);
  const systemColumns = useMemo(
    () => expandedColumns.filter((col) => !EDITABLE_FIELDS.has(col.name)),
    [expandedColumns],
  );
  const sectionGridClasses =
    "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  const updateField = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!canEdit || !isDirty || busy) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    const payload = {
      batch_size: editValues.batch_size === "" ? "" : Number(editValues.batch_size),
      client_id: editValues.client_id === "" ? "" : Number(editValues.client_id),
      date_received: editValues.date_received,
      method_received: editValues.method_received,
      bank_statements: Boolean(editValues.bank_statements),
      added_on_drive: Boolean(editValues.added_on_drive),
      corrections: Boolean(editValues.corrections),
      cc_availability: editValues.cc_availability,
    };
    const result = await onBatchUpdate(entityId, payload);
    if (!result?.success) {
      setSaveError(result?.error || "Failed to save changes");
    } else {
      setSaveSuccess(true);
    }
    setSaving(false);
  };

  const handleArchive = async () => {
    if (!canEdit || busy) return;
    setArchiving(true);
    setSaveError("");
    setSaveSuccess(false);
    const result = await onArchiveDraft(batch);
    if (!result?.success) {
      setSaveError(result?.error || "Failed to archive batch");
    }
    setArchiving(false);
  };

  const renderDisplayValue = (col) => {
    const raw = batch[col.name];
    const value = col.formatter ? col.formatter(raw, batch) : raw;
    if (value === null || value === undefined || value === "") return "N/A";
    return value;
  };

  const renderEditableField = (col) => {
    const field = col.name;
    const commonInputClasses = "mt-1 w-full border border-gray-blue-200 rounded px-2 py-1 text-sm";

    switch (field) {
      case "batch_size":
        return (
          <>
            <input
              type="number"
              min={minBatchSize}
              className={commonInputClasses}
              value={editValues.batch_size}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  updateField(field, "");
                  return;
                }
                const parsed = Number(raw);
                if (Number.isNaN(parsed)) return;
                const enforced = Math.max(minBatchSize, parsed);
                updateField(field, String(enforced));
              }}
            />
            {foreignUrgentCount > 0 && (
              <p className="mt-1 text-xs text-gray-blue-500">
                Minimum size {minBatchSize} to cover {foreignUrgentCount} foreign/urgent accounts.
              </p>
            )}
          </>
        );
      case "client_id":
        return (
          <>
            <select
              className={commonInputClasses}
              value={String(editValues.client_id ?? "")}
              onChange={(e) => updateField(field, e.target.value)}
              disabled={clients.length === 0}
            >
              {/* <option value="" disabled className=" text-sm">
                {clients.length === 0 ? "Loading clients..." : "Select client"}
              </option> */}
              {clients.map((client) => {
                const label = `Dr ${(client.first || "").trim()} ${(client.last || "").trim()}`.trim();
                return (
                  <option className="text-gray-dark text-sm" key={client.client_id} value={client.client_id}>
                    {label || `Client #${client.client_id}`}
                  </option>
                );
              })}
            </select>
            {clients.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">Clients list unavailable.</p>
            )}
          </>
        );
      case "date_received":
        return (
          <input
            type="date"
            className={commonInputClasses}
            value={editValues.date_received}
            onChange={(e) => updateField(field, e.target.value)}
          />
        );
      case "method_received":
        return (
          <select
            className={commonInputClasses}
            value={editValues.method_received || ""}
            onChange={(e) => updateField(field, e.target.value)}
          >
            {METHOD_OPTIONS.map((option) => (
              <option key={option} value={option} className="text-gray-dark text-sm">
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );
      case "bank_statements":
      case "added_on_drive":
      case "corrections":
        return (
          <label className="mt-1 flex items-center gap-2 text-sm text-gray-900">
            <input
              type="checkbox"
              checked={Boolean(editValues[field])}
              onChange={(e) => updateField(field, e.target.checked)}
            />
            <span>{Boolean(editValues[field]) ? "Yes" : "No"}</span>
          </label>
        );
      case "cc_availability":
        return (
          <input
            type="text"
            className={commonInputClasses}
            value={editValues.cc_availability || ""}
            onChange={(e) => updateField(field, e.target.value)}
          />
        );
      default:
        return renderDisplayValue(col);
    }
  };

  const location = useLocation();

  const handleViewBatch = (selected) => {
    if (!entityId) return;
    const fromPath = `${location.pathname}${location.search}`;
    const isFu = Boolean(
      selected.is_fu ||
        selected.foreign_urgent_batch_id ||
        (selected.batch_type || "").toLowerCase() === "foreign_urgent",
    );
    const basePath = isFu ? "/fu-batches" : "/batches";
    navigate(`${basePath}/${entityId}`, { state: { batch: selected, from: fromPath } });
  };

  return (
    <>
      <tr
        className={`cursor-pointer hover:bg-gray-50  ${
          isExpanded ? "border-x border-gray-blue-200 bg-gray-50" : "border-b  border-gray-blue-200"
        } ${isSelected ? "bg-gray-50" : ""}`}
        onClick={() => {
          onSelect(batch);
          onToggleExpand(entityId);
        }}
      >
        {columns.map((col) => {
          const raw = batch[col.name];
          const value = col.formatter ? col.formatter(raw, batch) : raw;

          if (col.name === "client_name") {
            return (
              <td key={col.name} className="px-2 py-2 align-top text-sm ">
                <span className="font-semibold">{batch.client_first} {batch.client_last}</span>
                <br />
                <span className="text-xs uppercase tracking-wide text-gray-blue-600">{batch.client_type}</span>
              </td>
            );
          }

          return (
            <td key={col.name} className="px-2 py-2 align-top text-sm text-gray-dark">
              <span>{value ?? ""}</span>
            </td>
          );
        })}
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50 border-x border-b border-gray-blue-200">
          <td colSpan={columns.length} className="px-2 pb-4 pt-1">
            <div className="flex flex-col gap-4">
              {editableColumns.length > 0 && (
                <section className="border border-gray-blue-200 bg-white/70 p-3">
                  <div className={sectionGridClasses}>
                    {editableColumns.map((col) => {
                      const isEditable = canEdit && EDITABLE_FIELDS.has(col.name);
                      return (
                        <div key={col.name} className="text-sm text-gray-900">
                          <span className="text-xs uppercase tracking-wide text-gray-blue-600 block">{col.label}</span>
                          {isEditable ? (
                            renderEditableField(col)
                          ) : (
                            <span className="font-semibold">{renderDisplayValue(col)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {systemColumns.length > 0 && (
                <section className="border border-gray-blue-200 bg-white/30 p-3">
                  <div className={sectionGridClasses}>
                    {systemColumns.map((col) => (
                      <div key={col.name} className="text-sm text-gray-900">
                        <span className="text-xs uppercase tracking-wide text-gray-blue-600 block">{col.label}</span>
                        <span className="">{renderDisplayValue(col)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {canEdit && (
              <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
                <button
                  type="button"
                  className="button-pill tab-pill-white-hover cursor-pointer hover:bg-red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive();
                  }}
                  disabled={busy}
                >
                  {archiving ? "Archiving..." : "Archive"}
                </button>
                <button
                  type="button"
                  className="button-pill cursor-pointer hover:bg-green hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={!isDirty || busy}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {saveSuccess && <span className="text-xs text-green-600">Changes saved</span>}
                {saveError && <span className="text-xs text-red-600">{saveError}</span>}
              </div>
            )}

            <ExpandedRowActions
              mainActions={mainActions}
              actions={actions}
              selectedBatch={batch}
              onExecute={onExecute}
              onViewBatch={handleViewBatch}
            />
          </td>
        </tr>
      )}
    </>
  );
};

export default Row;
