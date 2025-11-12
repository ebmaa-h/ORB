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

const accountMatchesSearch = (account, term) => {
  if (!account || !term) return true;
  const normalized = term.toLowerCase();
  const values = [
    account.account_id,
    account.member_name,
    account.main_member_id,
    account.patient_name,
    account.patient_dependent_number,
    account.medical_aid_nr,
    account.plan_id,
    account.plan_code,
    account.total_invoice_balance,
    account.status,
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
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
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
    if (!batch?.client_id) {
      setAccounts([]);
      setAccountsError("Client ID unavailable for this batch.");
      return;
    }

    let cancelled = false;
    const fetchAccounts = async () => {
      setAccountsLoading(true);
      setAccountsError("");
      try {
        const res = await axiosClient.get(ENDPOINTS.clientAccounts(batch.client_id));
        if (!cancelled) {
          setAccounts(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setAccounts([]);
          setAccountsError(err?.response?.data?.error || "Failed to load accounts");
        }
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    };

    fetchAccounts();
    return () => {
      cancelled = true;
    };
  }, [batch]);

  const accountCount = accounts.length;
  const batchSize = Number(batch?.batch_size || 0);
  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts;
    return accounts.filter((account) => accountMatchesSearch(account, searchTerm.trim()));
  }, [accounts, searchTerm]);
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
    <div className="flex flex-col">
      <div className="container-row-outer flex-wrap gap-4 items-center border ">
        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            className={`btn-class ${isBatchTab ? "font-bold bg-gray-100" : ""}`}
            onClick={() => setActiveTab(TAB_KEYS.BATCH)}
          >
            View Batch
          </button>
          <button
            type="button"
            className={`btn-class ${activeTab === TAB_KEYS.NOTES ? "font-bold bg-gray-100" : ""}`}
            onClick={() => setActiveTab(TAB_KEYS.NOTES)}
          >
            Notes & Logs
          </button>
        </div>

        <span className="text-gray-400 select-none">|</span>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            className="btn-class opacity-70 cursor-not-allowed"
            disabled
            title="Coming soon"
          >
            CRQ
          </button>
        </div>

        <span className="text-gray-400 select-none">|</span>

        <div className="flex gap-2 flex-wrap items-center ml-auto">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="min-w-[220px]" />
          <button
            type="button"
            className="btn-class-dark bg-ebmaa-purple text-white px-4 hover:bg-ebmaa-purple-light whitespace-nowrap"
            onClick={() => navigate("/workflow")}
          >
            Back to Workflow
          </button>
        </div>
      </div>

      {isBatchTab ? (
        <>
      <section className="bg-white border border-gray-blue-100 rounded shadow-sm ">
        <div className="flex flex-row gap-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {/* <p className="text-xs uppercase tracking-wide text-gray-blue-600">Batch</p> */}
              {/* <h1 className="text-2xl font-semibold text-gray-dark">{batchType}</h1> */}
              {/* <p className="text-sm text-gray-blue-700 mt-1">#{batch.batch_id}</p> */}
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

      <section
        aria-label="Batch accounts workspace"
        className="rounded border border-gray-blue-100 bg-white p-4 text-gray-blue-700"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-blue-100 pb-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-blue-600">Accounts Linked to Batch</p>
            <p className="text-2xl font-semibold text-gray-dark">
              {accountCount} / {batchSize}
            </p>
            <p className="text-sm text-gray-blue-600">Current Accounts / Batch Size</p>
          </div>
          <div className="text-right">
            {/* <p className="text-xs uppercase tracking-wide text-gray-blue-600">Client ID</p>
            <p className="text-lg font-semibold text-gray-dark">{batch.client_id || "N/A"}</p> */}
          </div>
        </div>

        {accountsLoading ? (
          <p className="text-sm text-gray-blue-700">Loading accounts...</p>
        ) : accountsError ? (
          <p className="text-sm text-red-600">{accountsError}</p>
        ) : accountCount === 0 ? (
          <p className="text-sm text-gray-blue-700">No accounts linked to this batch yet.</p>
        ) : searchActive && filteredAccounts.length === 0 ? (
          <p className="text-sm text-gray-blue-700">No accounts match your search.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAccounts.map((account) => (
              <div key={account.account_id} className="border border-gray-blue-100 rounded-lg p-4 bg-gray-blue-50/30">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase text-gray-blue-600">Account ID</p>
                    <p className="text-lg font-semibold text-gray-dark">#{account.account_id}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-class min-w-[150px] opacity-70 cursor-not-allowed"
                    disabled
                    title="Coming soon"
                  >
                    View Account
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase text-gray-blue-600">Main Member</p>
                    <p className="text-sm font-semibold text-gray-dark">{account.member_name || "N/A"}</p>
                    <p className="text-xs text-gray-blue-600">ID: {account.main_member_id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-blue-600">Patient</p>
                    <p className="text-sm font-semibold text-gray-dark">{account.patient_name || "N/A"}</p>
                    <p className="text-xs text-gray-blue-600">
                      Dep #: {account.patient_dependent_number || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-blue-600">Medical Aid</p>
                    <p className="text-sm font-semibold text-gray-dark">{account.medical_aid_nr || "N/A"}</p>
                    <p className="text-xs text-gray-blue-600">
                      Plan: {account.plan_id || account.plan_code || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-blue-600">Status</p>
                    <p className="text-sm font-semibold text-gray-dark">
                      {account.is_active === false
                        ? "Inactive"
                        : account.is_active === true
                        ? "Active"
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-blue-600">Balance</p>
                    <p className="text-sm font-semibold text-gray-dark">
                      {account.total_invoice_balance || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="btn-class min-w-[160px] opacity-70 cursor-not-allowed"
            disabled
            title="Coming soon"
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
          listMaxHeight={600}
          searchTermOverride={searchTerm}
          onSearchTermChange={setSearchTerm}
          showSearchInput={false}
        />
      )}
    </div>
  );
};

export default BatchView;
