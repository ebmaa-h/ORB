import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EntityNotesAndLogs from "../components/ui/EntityNotesAndLogs";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

const formatClientName = (batch) => {
  if (!batch) return "N/A";
  const withName =
    batch.client_name ||
    [batch.client_first, batch.client_last]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(" ");

  if (withName) return withName;
  if (batch.client_id) return `Client #${batch.client_id}`;
  return "N/A";
};

const isForeignOrUrgentBatch = (batch) => {
  if (!batch) return false;
  if (batch.parent_batch_id) return true;
  if (typeof batch.is_pure_foreign_urgent === "boolean") return batch.is_pure_foreign_urgent;
  if (batch.is_pure_foreign_urgent == null) return false;
  return ["1", 1, "true", "yes"].includes(batch.is_pure_foreign_urgent);
};

const getBatchType = (batch) => (isForeignOrUrgentBatch(batch) ? "foreign_urgent" : "normal");

const getEntityType = (batch) => {
  if (!batch) return "batch";
  return batch.parent_batch_id ? "fu" : "batch";
};

const computeBatchSize = (batch) => {
  if (!batch) return "N/A";
  if (isForeignOrUrgentBatch(batch)) return "1";

  const total = toNumber(batch.batch_size);
  const foreignUrgent = toNumber(batch.total_urgent_foreign);
  const realSize = Math.max(total - foreignUrgent, 0);
  return realSize.toString();
};

const BatchView = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const batch = location.state?.batch || null;

  const infoItems = useMemo(() => {
    if (!batch) return [];
    return [
      { label: "Batch ID", value: batch.batch_id ? `#${batch.batch_id}` : "N/A" },
      { label: "Batch Size", value: computeBatchSize(batch) },
      { label: "Client", value: formatClientName(batch) },
      { label: "Date Received", value: formatDate(batch.date_received) },
    ];
  }, [batch]);

  if (!batch) {
    return (
      <section className="container-col">
        <p className="text-gray-dark">
          Batch with ID <strong>#{batchId}</strong> not found...
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="btn-class-dark bg-ebmaa-purple text-white px-6 hover:bg-ebmaa-purple-light"
            onClick={() => navigate("/workflow")}
          >
            Back to Workflow
          </button>
        </div>
      </section>
    );
  }

  const batchType = isForeignOrUrgentBatch(batch) ? "Foreign & Urgent" : "Normal";
  const departmentKey = (batch.current_department || "").toLowerCase();
  const batchTypeKey = getBatchType(batch);
  const entityType = getEntityType(batch);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <section className="bg-white border border-gray-blue-200 rounded shadow-sm">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-blue-600">Batch</p>
              <h1 className="text-2xl font-semibold text-gray-dark">{batchType}</h1>
              <p className="text-sm text-gray-blue-700 mt-1">#{batch.batch_id}</p>
            </div>
            <button
              type="button"
              className="btn-class-dark bg-ebmaa-purple text-white min-w-[150px] hover:bg-ebmaa-purple-light"
              onClick={() => navigate("/workflow")}
            >
              Back to Workflow
            </button>
          </div>

          <div className="flex">
            <div className="flex flex-row gap-8 border-l-4 border-ebmaa-purple bg-gray-blue-100/40 px-6 py-5 rounded-r-lg min-w-[260px]">
              {infoItems.map((item) => (
                <div key={item.label}>
                  <p className="text-xs uppercase tracking-wide text-gray-blue-600">{item.label}</p>
                  <p className="text-lg font-semibold text-gray-dark">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Batch invoices workspace"
        className="rounded border border-gray-blue-200 bg-white min-h-[320px] p-4 text-gray-blue-700"
      >
        <p className="text-sm">
          Batch container space - invoices and related actions will appear here as we continue building this page.
        </p>
      </section>

      <EntityNotesAndLogs
        entityId={batch.batch_id}
        entityType={entityType}
        department={departmentKey}
        batchType={batchTypeKey}
        title="Batch Notes & Logs"
        listMaxHeight={250}
      />
    </div>
  );
};

export default BatchView;
