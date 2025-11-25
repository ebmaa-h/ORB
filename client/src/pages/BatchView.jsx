import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EntityNotesAndLogs from "../components/ui/EntityNotesAndLogs";
import SearchBar from "../components/ui/SearchBar";
import axiosClient from "../utils/axiosClient";
import ENDPOINTS from "../utils/apiEndpoints";
import { normalizeIsFuFlag, normalizeIsPureFlag } from "../domain/batch";

const TAB_KEYS = {
  BATCH: "batch",
  NOTES: "notes",
};

const FU_INVOICE_TYPES = new Set(["foreign", "urgent_normal", "urgent_other"]);

const toForeignUrgentSequence = (invoices = []) => {
  let counter = 0;
  return invoices.reduce((map, invoice) => {
    const invoiceId = invoice?.invoice_id;
    if (!invoiceId) return map;
    if (!isForeignUrgentInvoice(invoice)) return map;
    counter += 1;
    map.set(invoiceId, counter);
    return map;
  }, new Map());
};

const isForeignUrgentInvoice = (invoice) => {
  if (!invoice) return false;
  if (invoice.foreign_urgent_batch_id) return true;
  const type = (invoice.invoice_type || invoice.type || "").toLowerCase();
  return FU_INVOICE_TYPES.has(type);
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

const hasPureForeignUrgentFlag = (batch) => normalizeIsPureFlag(batch?.is_pure_foreign_urgent);

const getMainBatchId = (batch) =>
  batch?.foreign_urgent_batch_id ??
  batch?.foreignUrgentBatchId ??
  batch?.batch_id ??
  batch?.batchId ??
  null;

const isForeignUrgentAccount = (batch) => {
  if (!batch) return false;
  return (
    normalizeIsFuFlag(batch.is_fu) ||
    Boolean(batch.foreign_urgent_batch_id || batch.foreignUrgentBatchId)
  );
};

const isForeignOrUrgentBatch = (batch) => {
  if (!batch) return false;
  if (isForeignUrgentAccount(batch)) return true;
  return hasPureForeignUrgentFlag(batch);
};

const getBatchType = (batch) => (isForeignOrUrgentBatch(batch) ? "foreign_urgent" : "normal");

const getEntityType = (batch) => {
  if (!batch) return "batch";
  return isForeignUrgentAccount(batch) ? "fu" : "batch";
};

const getNormalBatchSizeCount = (batch) => {
  if (!batch) return 0;
  const total = toNumber(batch.batch_size);
  const foreignUrgent = toNumber(batch.total_urgent_foreign);
  return Math.max(total - foreignUrgent, 0);
};

const computeBatchSize = (batch) => {
  if (!batch) return "N/A";
  if (isForeignOrUrgentBatch(batch)) return "1";
  return getNormalBatchSizeCount(batch).toString();
};

const firstNonEmpty = (values = []) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const resolveDependentNumber = (invoice, role = "member") => {
  if (!invoice) return "";
  const nestedSource = role === "member" ? invoice.member : invoice.patient;
  const nested = firstNonEmpty([
    nestedSource?.dependentNumber,
    nestedSource?.dependent_nr,
    nestedSource?.dependent_number,
    nestedSource?.dependentNo,
  ]);
  if (nested) return nested;

  const flatKeys =
    role === "member"
      ? [
          "main_member_dependent_nr",
          "main_member_dependent_number",
          "main_member_dependent",
          "member_dependent_nr",
          "member_dependent_number",
          "member_dependent",
        ]
      : [
          "patient_dependent_nr",
          "patient_dependent_number",
          "patient_dependent",
          "dependent_nr",
          "dependent_number",
        ];

  return firstNonEmpty(flatKeys.map((key) => invoice[key]));
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
  const initialBatch = location.state?.batch || null;
  const [batchState, setBatchState] = useState(initialBatch);
  const routeBatchId = useMemo(() => {
    if (!batchId) return null;
    const trimmed = String(batchId).trim();
    return trimmed || null;
  }, [batchId]);
  const mainBatchId = getMainBatchId(batchState) || routeBatchId;
  const isFuRoute = location.pathname.startsWith("/fu-batches");
  const explicitBatchType = (location.state?.batchType || "").toLowerCase();
  const isForeignUrgentChild =
    isForeignUrgentAccount(batchState) || isFuRoute || explicitBatchType === "foreign_urgent" || explicitBatchType === "fu";
  const isFuHint = isForeignUrgentChild || isFuRoute;
  const safeBatch =
    batchState ||
    {
      batch_id: isFuHint ? null : mainBatchId,
      foreign_urgent_batch_id: isFuHint ? mainBatchId : null,
      current_department: "",
      status: "",
      is_fu: isFuHint,
    };
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [activeTab, setActiveTab] = useState(TAB_KEYS.BATCH);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState("");

  const infoItems = useMemo(() => {
    if (!mainBatchId) return [];
    const typeLabel = isForeignOrUrgentBatch(batchState || safeBatch) ? "Foreign & Urgent" : "Normal";
    const batchLabel = mainBatchId
      ? `${isForeignOrUrgentBatch(batchState || safeBatch) ? "FU-Batch" : "Batch"} #${mainBatchId}`
      : "N/A";
    const statusLabel = (safeBatch.status || "unknown").toString().toUpperCase();
    const items = [
      { label: "Client", value: formatClientName(batchState || safeBatch) },
      { label: "Batch ID", value: batchLabel },
      { label: "Batch Size", value: computeBatchSize(batchState || safeBatch) },
      { label: "Date Received", value: formatDate((batchState || safeBatch)?.date_received) },
      { label: "Type", value: typeLabel },
      { label: "Workflow", value: (safeBatch.current_department || "Unknown").toUpperCase() },
      { label: "Tab", value: statusLabel },
    ];
    return items;
  }, [batchState, safeBatch, mainBatchId]);

  useEffect(() => {
    if (!mainBatchId) {
      setInvoices([]);
      setInvoicesError("Batch unavailable.");
      return;
    }

    let cancelled = false;
    const fetchInvoices = async () => {
      setInvoicesLoading(true);
      setInvoicesError("");
      try {
        const res = await axiosClient.get(ENDPOINTS.batchInvoices(mainBatchId), {
          params: { is_fu: isForeignUrgentChild ? 1 : 0 },
        });
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
  }, [mainBatchId, isForeignUrgentChild]);

  useEffect(() => {
    if (batchState && batchState.client_first) return;
    if (!mainBatchId) return;
    let cancelled = false;
    const fetchBatch = async () => {
      setBatchLoading(true);
      setBatchError("");
      try {
        const res = await axiosClient.get(ENDPOINTS.batchDetails(mainBatchId, isForeignUrgentChild));
        if (cancelled) return;
        if (res.data?.batch) {
          setBatchState(res.data.batch);
        }
      } catch (err) {
        if (cancelled) return;
        setBatchError(err?.response?.data?.error || "Failed to load batch");
      } finally {
        if (!cancelled) setBatchLoading(false);
      }
    };
    fetchBatch();
    return () => {
      cancelled = true;
    };
  }, [batchState, mainBatchId, isForeignUrgentChild]);

  const normalizedBatchId = Number(mainBatchId || 0);
  const relevantInvoices = useMemo(() => {
    if (!normalizedBatchId) return [];
    return invoices.filter((invoice) => {
      const invoiceBatchId = Number(invoice.foreign_urgent_batch_id ?? invoice.batch_id);
      if (invoiceBatchId !== normalizedBatchId) return false;
      const isFuInvoice = isForeignUrgentInvoice(invoice);
      return isForeignUrgentChild ? isFuInvoice : !isFuInvoice;
    });
  }, [invoices, normalizedBatchId, isForeignUrgentChild]);
  const trimmedSearch = searchTerm.trim();
  const searchActive = Boolean(trimmedSearch);
  const filteredInvoices = useMemo(() => {
    if (!searchActive) return relevantInvoices;
    return relevantInvoices.filter((invoice) => invoiceMatchesSearch(invoice, trimmedSearch));
  }, [relevantInvoices, trimmedSearch, searchActive]);
  const foreignUrgentSequence = useMemo(() => toForeignUrgentSequence(relevantInvoices), [relevantInvoices]);
  const displayInvoices = isForeignUrgentChild ? filteredInvoices.slice(0, 1) : filteredInvoices;
  const invoiceCount = displayInvoices.length;
  const isBatchTab = activeTab === TAB_KEYS.BATCH;

  const handleViewInvoice = useCallback(
    (invoice) => {
      if (!mainBatchId) return;
      const fromState = location.state?.from || { path: `${location.pathname}${location.search}` };
      const currentPath = `${location.pathname}${location.search}`;
      const basePath = isFuRoute || isForeignUrgentChild ? "/fu-batches" : "/batches";
      navigate(`${basePath}/${mainBatchId}/accounts/new`, {
        state: {
          batch: safeBatch,
          invoice,
          from: fromState || currentPath,
        },
      });
    },
    [batchState, location.pathname, location.search, navigate, location.state?.from, isFuRoute, isForeignUrgentChild, mainBatchId],
  );
  const originFrom = location.state?.from || null;
  const backPath = typeof originFrom === "string" ? originFrom : originFrom?.path;
  const backActiveStatus = typeof originFrom === "object" ? originFrom.activeStatus : null;
  const backFilterType = typeof originFrom === "object" ? originFrom.filterType : null;
  const fallbackFilterType = backFilterType || (isForeignUrgentChild || isFuRoute ? "fu" : "normal");
  const backTarget = backPath || "/workflow";
  const backOptions =
    backActiveStatus || backFilterType || fallbackFilterType
      ? { state: { activeStatus: backActiveStatus, filterType: fallbackFilterType } }
      : undefined;
  const handleBack = () => navigate(backTarget, backOptions);

  const batchType = isForeignOrUrgentBatch(safeBatch) ? "Foreign & Urgent" : "Normal";
  const departmentKey = (safeBatch.current_department || "").toLowerCase();
  const batchTypeKey = getBatchType(safeBatch);
  const entityType = getEntityType(safeBatch);
  const batchSize = isForeignUrgentChild ? 1 : getNormalBatchSizeCount(safeBatch);

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
          <button
            type="button"
            className="button-pill min-w-[100px] flex items-center justify-center"
            onClick={handleBack}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z" />
            </svg>
            <span className="sr-only">Back</span>
          </button>
        </div>
      </div>

      {isBatchTab ? (
        <>
      <section className="tab-panel m-0">
        <div className="flex flex-wrap items-center gap-3 rounded-lg w-full">
          {/* <p className="text-xs uppercase tracking-wide text-gray-blue-600">Batch</p> */}
          {infoItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full bg-gray-blue-100/60 px-3 py-2 text-sm text-gray-dark"
            >
              <span className="text-xs uppercase tracking-wide text-gray-blue-600 whitespace-nowrap">
                {item.label}:
              </span>
              <span className="font-semibold text-gray-dark whitespace-nowrap">{item.value}</span>
            </span>
          ))}
          <div className="ml-auto">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="min-w-[220px]" />
          </div>
        </div>
      </section>

      <section aria-label="Batch invoices workspace" className="tab-panel flex-col items-start w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-blue-100 pb-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-blue-600">Accounts Linked to Batch</p>
            <p className="text-2xl font-semibold text-gray-dark">
              {invoiceCount} / {batchSize}
            </p>
            {/* <p className="text-sm text-gray-blue-600">Current Accounts / Batch Size</p> */}
          </div>
          <div className="text-right">
            {/* reserved for future summary */}
          </div>
        </div>

        {invoicesLoading ? (
          <p className="text-sm text-gray-blue-700">Loading invoices...</p>
        ) : invoicesError ? (
          <p className="text-sm text-red-600">{invoicesError}</p>
        ) : invoiceCount === 0 ? (
          <p className="text-sm text-gray-blue-700">No accounts linked to this batch yet.</p>
        ) : searchActive && filteredInvoices.length === 0 ? (
          <p className="text-sm text-gray-blue-700">No accounts match your search.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayInvoices.map((invoice) => (
              <div
                key={invoice.invoice_id}
                className="border border-gray-blue-100 rounded p-4 bg-gray-blue-50/30 h-full flex flex-col"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {isForeignUrgentChild ? (
                    <div>
                      <p className="text-xs uppercase text-gray-blue-600">Foreign &amp; Urgent Account</p>
                      <p className="text-lg font-semibold text-gray-dark">Invoice #1</p>
                      <p className="text-xs text-gray-blue-600">Nr in batch: 1</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs uppercase text-gray-blue-600">Account</p>
                      <p className="text-lg font-semibold text-gray-dark">#{invoice.invoice_id}</p>
                      <p className="text-xs text-gray-blue-600">
                        Nr in batch: {invoice.nr_in_batch || "N/A"}
                      </p>
                    </div>
                  )}
                  <button type="button" className="tab-pill min-w-[150px]" onClick={() => handleViewInvoice(invoice)}>
                    View Account
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
                    <p className="text-sm text-gray-700">Dep #: {resolveDependentNumber(invoice, "member") || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-gray-blue-600">Patient</p>
                    <p className="text-sm font-semibold text-gray-dark">
                      {[invoice.patient_first, invoice.patient_last].filter(Boolean).join(" ") || "N/A"}
                    </p>
                    <p className="text-sm text-gray-700">ID: {invoice.patient_id_nr || "N/A"}</p>
                    <p className="text-sm text-gray-700">Dep #: {resolveDependentNumber(invoice, "patient") || "N/A"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="button-pill min-w-[160px] disabled:opacity-60"
            onClick={() =>
              navigate(`${isFuRoute || isForeignUrgentChild ? "/fu-batches" : "/batches"}/${mainBatchId}/accounts/new`, {
                state: {
                  batch: safeBatch,
                  from: originFrom || { path: `${location.pathname}${location.search}`, activeStatus: location.state?.activeStatus },
                },
              })
            }
            disabled={isForeignUrgentChild && invoiceCount >= 1}
            title={isForeignUrgentChild && invoiceCount >= 1 ? "Foreign & urgent batches allow one account" : ""}
          >
            {/* {isForeignUrgentChild ? "Add Foreign & Urgent Account" : "Add Account"} */}
            Add Account
          </button>
        </div>
      </section>
        </>
      ) : (
        <EntityNotesAndLogs
          entityId={mainBatchId}
          entityType={entityType}
          department={departmentKey}
          batchType={batchTypeKey}
          title="Batch Notes & Logs"
          searchTermOverride={searchTerm}
          onSearchTermChange={setSearchTerm}
          showSearchInput={false}
          showBatchLink={false}
        />
      )}
    </div>
  );
};

export default BatchView;
