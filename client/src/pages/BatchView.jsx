import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EntityNotesAndLogs from "../components/ui/EntityNotesAndLogs";
import SearchBar from "../components/ui/SearchBar";
import axiosClient from "../utils/axiosClient";
import ENDPOINTS from "../utils/apiEndpoints";

const TAB_KEYS = {
  BATCH: "batch",
  NOTES: "notes",
};

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

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "R 0.00";
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return `R ${amount.toFixed(2)}`;
};

const invoiceMatchesSearch = (invoice, term) => {
  if (!invoice || !term) return true;
  const normalized = term.toLowerCase();
  const values = [
    invoice.invoice_id,
    invoice.nr_in_batch,
    invoice.medical_aid_nr,
    invoice.medical_aid_name,
    invoice.plan_name,
    invoice.plan_code,
    invoice.main_member_first,
    invoice.main_member_last,
    invoice.patient_first,
    invoice.patient_last,
    invoice.file_nr,
    invoice.auth_nr,
  ];

  return values.some((value) => {
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(normalized);
  });
};

const BatchView = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const batch = location.state?.batch || null;
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [activeTab, setActiveTab] = useState(TAB_KEYS.BATCH);
  const [searchTerm, setSearchTerm] = useState("");

  const infoItems = useMemo(() => {
    if (!batch) return [];
    return [
      { label: "Batch ID", value: batch.batch_id ? `#${batch.batch_id}` : "N/A" },
      { label: "Batch Size", value: computeBatchSize(batch) },
      { label: "Client", value: formatClientName(batch) },
      { label: "Date Received", value: formatDate(batch.date_received) },
    ];
  }, [batch]);

  useEffect(() => {
    if (!batch?.batch_id) {
      setInvoices([]);
      setInvoicesError("Batch unavailable.");
      return;
    }

    let cancelled = false;
    const fetchInvoices = async () => {
      setInvoicesLoading(true);
      setInvoicesError("");
      try {
        const res = await axiosClient.get(ENDPOINTS.batchInvoices(batch.batch_id));
        if (!cancelled) {
          const next = Array.isArray(res.data) ? res.data : res.data?.invoices;
          setInvoices(Array.isArray(next) ? next : []);
        }
      } catch (err) {
        if (!cancelled) {
          setInvoices([]);
          setInvoicesError(err?.response?.data?.error || "Failed to load invoices");
        }
      } finally {
        if (!cancelled) setInvoicesLoading(false);
      }
    };

    fetchInvoices();
    return () => {
      cancelled = true;
    };
  }, [batch]);

  const invoiceCount = invoices.length;
  const batchSize = Number(batch?.batch_size || 0);
  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    return invoices.filter((invoice) => invoiceMatchesSearch(invoice, searchTerm.trim()));
  }, [invoices, searchTerm]);
  const searchActive = Boolean(searchTerm.trim());
  const isBatchTab = activeTab === TAB_KEYS.BATCH;

  if (!batch) {
    return (
      <section className="container-col">
        <p className="text-gray-dark">
          Batch with ID <strong>#{batchId}</strong> not found...
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="button-pill min-w-[100px]"
            onClick={() => navigate("/workflow")}
          >
            Back
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
    <div className="flex flex-col">
      <div className="tab-panel w-full">
        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            className={`tab-pill ${isBatchTab ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab(TAB_KEYS.BATCH)}
          >
            View Batch
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === TAB_KEYS.NOTES ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab(TAB_KEYS.NOTES)}
          >
            Notes & Logs
          </button>
        </div>

        <span className="hidden h-6 w-px bg-gray-blue-100 md:block" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            className="tab-pill tab-pill-disabled"
            disabled
            title="Coming soon"
          >
            CRQ
          </button>
        </div>

        <span className="hidden h-6 w-px bg-gray-blue-100 md:block" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center ml-auto">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="min-w-[220px]" />
          <button
            type="button"
            className="button-pill min-w-[100px]"
            onClick={() => navigate("/workflow")}
          >
            Back
          </button>
        </div>
      </div>

      {isBatchTab ? (
        <>
      <section className="tab-panel m-0">
        <div className="flex flex-row gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-blue-600">Batch</p>
              <h1 className="text-2xl font-semibold text-gray-dark">{batchType}</h1>
              <p className="text-sm text-gray-blue-700 mt-1">#{batch.batch_id}</p>
            </div>
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

      <section aria-label="Batch invoices workspace" className="tab-panel flex-col items-start w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-blue-100 pb-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-blue-600">Invoices Linked to Batch</p>
            <p className="text-2xl font-semibold text-gray-dark">
              {invoiceCount} / {batchSize}
            </p>
            <p className="text-sm text-gray-blue-600">Current Invoices / Batch Size</p>
          </div>
          <div className="text-right">
            {/* <p className="text-xs uppercase tracking-wide text-gray-blue-600">Client ID</p>
            <p className="text-lg font-semibold text-gray-dark">{batch.client_id || "N/A"}</p> */}
          </div>
        </div>

        {invoicesLoading ? (
          <p className="text-sm text-gray-blue-700">Loading invoices...</p>
        ) : invoicesError ? (
          <p className="text-sm text-red-600">{invoicesError}</p>
        ) : invoiceCount === 0 ? (
          <p className="text-sm text-gray-blue-700">No invoices linked to this batch yet.</p>
        ) : searchActive && filteredInvoices.length === 0 ? (
          <p className="text-sm text-gray-blue-700">No invoices match your search.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.invoice_id} className="border border-gray-blue-100 rounded p-4 bg-gray-blue-50/30">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase text-gray-blue-600">Invoice</p>
                    <p className="text-lg font-semibold text-gray-dark">#{invoice.invoice_id}</p>
                    <p className="text-xs text-gray-blue-600">Nr in batch: {invoice.nr_in_batch || "N/A"}</p>
                  </div>
                  <button
                    type="button"
                    className="tab-pill min-w-[150px] opacity-70 cursor-not-allowed"
                    disabled
                    title="Coming soon"
                  >
                    View Invoice
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-gray-blue-600">Invoice Details</p>
                    <p className="text-sm text-gray-700">Date of service: {formatDate(invoice.date_of_service)}</p>
                    <p className="text-sm text-gray-700">Status: {invoice.status || "N/A"}</p>
                    <p className="text-sm text-gray-700">Balance: {formatCurrency(invoice.balance)}</p>
                    <p className="text-sm text-gray-700">File #: {invoice.file_nr || "N/A"}</p>
                    <p className="text-sm text-gray-700">Auth #: {invoice.auth_nr || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-gray-blue-600">Medical Aid</p>
                    <p className="text-sm font-semibold text-gray-dark">
                      {invoice.medical_aid_name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-700">Number: {invoice.medical_aid_nr || "N/A"}</p>
                    <p className="text-sm text-gray-700">Plan: {invoice.plan_name || invoice.plan_code || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-gray-blue-600">Main Member</p>
                    <p className="text-sm font-semibold text-gray-dark">
                      {[invoice.main_member_first, invoice.main_member_last].filter(Boolean).join(" ") || "N/A"}
                    </p>
                    <p className="text-sm text-gray-700">ID: {invoice.main_member_id_nr || "N/A"}</p>
                    <p className="text-sm text-gray-700">Dep #: {invoice.main_member_dependent_nr || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-gray-blue-600">Patient</p>
                    <p className="text-sm font-semibold text-gray-dark">
                      {[invoice.patient_first, invoice.patient_last].filter(Boolean).join(" ") || "N/A"}
                    </p>
                    <p className="text-sm text-gray-700">ID: {invoice.patient_id_nr || "N/A"}</p>
                    <p className="text-sm text-gray-700">Dep #: {invoice.patient_dependent_nr || "N/A"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="button-pill min-w-[160px]"
            onClick={() => navigate(`/batches/${batch.batch_id}/accounts/new`, { state: { batch } })}
          >
            Add Account
          </button>
        </div>
      </section>
        </>
      ) : (
        <EntityNotesAndLogs
          entityId={batch.batch_id}
          entityType={entityType}
          department={departmentKey}
          batchType={batchTypeKey}
          title="Batch Notes & Logs"
          searchTermOverride={searchTerm}
          onSearchTermChange={setSearchTerm}
          showSearchInput={false}
        />
      )}
    </div>
  );
};

export default BatchView;
