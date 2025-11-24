// src/components/Workflow/WorkflowEngine.jsx
import React, {
  useEffect,
  useContext,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import WORKFLOW_CONFIG from "../../config/workflowConfig";
import ENDPOINTS from "../../utils/apiEndpoints";
import WorkflowTable from "./WorkflowTable";
import { UserContext } from "../../context/UserContext";
import { NewBatch } from "../index";
import EntityNotesAndLogs from "../ui/EntityNotesAndLogs";
import SearchBar from "../ui/SearchBar";
import { LOGS_TAB } from "./constants";
import { getPrimaryId, isForeignUrgentEntity } from "../../domain/batch";
import { deriveBatchNavigation } from "../../utils/batchNavigation";
import { useWorkflowData } from "./hooks/useWorkflowData";
import { useWorkflowFilters } from "./hooks/useWorkflowFilters";
import { useWorkflowActions } from "./hooks/useWorkflowActions";
import { useWorkflowClients } from "./hooks/useWorkflowClients";

export default function WorkflowEngine({ department = "none" }) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const config = WORKFLOW_CONFIG[department];
  const endpoint = config?.endpointKey ? ENDPOINTS[config.endpointKey] : null;

  const hasAppliedActiveStatusRef = useRef(false);
  const hasAppliedFilterTypeRef = useRef(false);

  const { batches, fuBatches, loading, applyBatchUpdate } = useWorkflowData({
    department,
    endpoint,
  });

  const {
    filterType,
    setFilterType,
    activeStatus,
    setActiveStatus,
    searchTerm,
    setSearchTerm,
    normalizedBatchType,
    statusTabs,
    filingTab,
    showLogsTab,
    visibleBatches,
    tableColumns,
  } = useWorkflowFilters({
    config,
    department,
    batches,
    fuBatches,
    initialActiveStatus: location.state?.activeStatus,
    initialFilterType: location.state?.filterType,
  });

  const { clients } = useWorkflowClients();

  const { handleReceptionUpdate, handleArchiveDraft, executeAction } = useWorkflowActions({
    user,
    department,
    applyBatchUpdate,
  });

  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    const desiredStatus = location.state?.activeStatus;
    if (hasAppliedActiveStatusRef.current) return;
    if (desiredStatus) {
      hasAppliedActiveStatusRef.current = true;
      if (desiredStatus !== activeStatus) {
        setActiveStatus(desiredStatus);
      }
    }
  }, [location.state?.activeStatus, activeStatus, setActiveStatus]);

  useEffect(() => {
    const desiredFilter = location.state?.filterType;
    if (hasAppliedFilterTypeRef.current) return;
    if (desiredFilter) {
      hasAppliedFilterTypeRef.current = true;
      if (desiredFilter !== filterType) {
        setFilterType(desiredFilter);
      }
    }
  }, [location.state?.filterType, filterType, setFilterType]);

  const handleNavigateToBatch = useCallback(
    (target) => {
      const nav = deriveBatchNavigation({
        target,
        batches,
        fuBatches,
        activeStatus,
        filterType,
        pathname: location.pathname,
        search: location.search,
      });
      if (!nav) return false;
      navigate(nav.path, { state: nav.state });
      return true;
    },
    [batches, fuBatches, navigate, location.pathname, location.search, activeStatus, filterType],
  );

  useEffect(() => {
    setShowNewBatchForm(false);
  }, [department]);

  useEffect(() => {
    if (activeStatus === LOGS_TAB) {
      setShowNewBatchForm(false);
    }
  }, [activeStatus]);

  // sync selected batch
  useEffect(() => {
    if (!selectedBatch) return;
    const updated = [...batches, ...fuBatches].find(
      (b) => getPrimaryId(b) === getPrimaryId(selectedBatch),
    );
    if (!updated) setSelectedBatch(null);
    else if (updated !== selectedBatch) setSelectedBatch(updated);
  }, [batches, fuBatches, selectedBatch]);

  const mainActionsForTable = useMemo(() => {
    if (!config) return [];
    if (showLogsTab) return [];
    if (activeStatus === "inbox") return config.inboxActions || [];
    if (activeStatus === "outbox") return config.outboxActions || [];
    if (activeStatus === "filing" && config.filingActions) return config.filingActions;
    return config.expandedActionsMain || config.mainActions || [];
  }, [activeStatus, config, showLogsTab]);

  const dropdownActionsForTable = useMemo(() => {
    if (!config) return [];
    if (showLogsTab) return [];
    if (activeStatus === "inbox" || activeStatus === "outbox") return [];
    return config.expandedActions || config.actions || [];
  }, [activeStatus, config, showLogsTab]);

  return (
    <div className="">
      <div className="tab-panel w-full">
        <div className="flex gap-2 flex-wrap items-center">
          {statusTabs.map((table) => {
            const label = table.label || table.name;
            const active = activeStatus === table.name;
            return (
              <button
                key={table.name}
                className={`tab-pill ${active ? "tab-pill-active" : ""}`}
                onClick={() => setActiveStatus(table.name)}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </button>
            );
          })}
        </div>

        <span className="hidden h-6 w-px bg-gray-blue-100 md:block" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center">
          <button
            className={`tab-pill ${showLogsTab ? "tab-pill-active" : ""}`}
            onClick={() => setActiveStatus(LOGS_TAB)}
          >
            Logs
          </button>
          {filingTab && (
            <button
              className={`tab-pill ${activeStatus === "filing" ? "tab-pill-active" : ""}`}
              onClick={() => setActiveStatus("filing")}
            >
              {filingTab.label || "Filing"}
            </button>
          )}
          {department === "reception" && (
            <button
              className={`tab-pill ${showNewBatchForm ? "tab-pill-active" : ""}`}
              onClick={() => setShowNewBatchForm((prev) => !prev)}
            >
              Add Batch
            </button>
          )}
        </div>

        <span className="hidden h-6 w-px bg-gray-blue-100 md:block" aria-hidden="true" />

        <div className="flex gap-2 flex-wrap items-center ml-auto">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} classes="max-w-md" />
          <button
            className={`tab-pill ${filterType === "normal" ? "tab-pill-active" : ""}`}
            onClick={() => setFilterType("normal")}
          >
            Normal
          </button>
          <button
            className={`tab-pill ${filterType === "fu" ? "tab-pill-active" : ""}`}
            onClick={() => setFilterType("fu")}
          >
            Foreign & Urgent
          </button>
        </div>
      </div>

      {!config ? (
        <div>{department} doesn't exist</div>
      ) : loading ? (
        <div>Loading batches...</div>
      ) : showLogsTab ? (
        <div className="container-col-outer gap-4">
          <EntityNotesAndLogs
            department={department}
            batchType={normalizedBatchType}
            context="workflow"
            requireEntitySelection={false}
            initialShowLogs
            listMaxHeight={600}
            headerDescription={`Logs for ${department} (${filterType === "fu" ? "Foreign & Urgent" : "Normal"})`}
            title="Logs"
            allowedTypes={["log"]}
            enableLogToggle={false}
            allowNotesInput={false}
            includeNotes={false}
            searchTermOverride={searchTerm}
            onSearchTermChange={setSearchTerm}
            showSearchInput={false}
            onBatchNavigate={handleNavigateToBatch}
          />
        </div>
      ) : (
        <div className="tab-pill4">
          {department === "reception" && showNewBatchForm && (
            <NewBatch onBatchCreated={() => setShowNewBatchForm(false)} />
          )}
          <WorkflowTable
            columns={tableColumns}
            batches={visibleBatches.filter(
              (b) => b.status === activeStatus && b.current_department === department,
            )}
            selectedBatch={selectedBatch}
            onSelect={setSelectedBatch}
            mainActions={mainActionsForTable}
            actions={dropdownActionsForTable}
            onExecute={executeAction}
            filterType={filterType}
            department={department}
            activeStatus={activeStatus}
            onBatchUpdate={handleReceptionUpdate}
            onArchiveDraft={handleArchiveDraft}
            clients={clients}
          />
        </div>
      )}
    </div>
  );
}
