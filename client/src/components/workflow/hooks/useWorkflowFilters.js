import { useMemo, useState } from "react";
import { getPrimaryId } from "../../../domain/batch";
import { LOGS_TAB } from "../constants";

export const useWorkflowFilters = ({
  config,
  department,
  batches,
  fuBatches,
  initialActiveStatus = "current",
  initialFilterType = "normal",
}) => {
  const [filterType, setFilterType] = useState(initialFilterType || "normal");
  const [activeStatus, setActiveStatus] = useState(initialActiveStatus || "current");
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedBatchType = useMemo(
    () => (filterType === "fu" ? "foreign_urgent" : "normal"),
    [filterType],
  );

  const statusTabs = useMemo(() => {
    const base = config?.tables || [];
    return base.filter((tab) => tab.name !== "filing");
  }, [config]);

  const filingTab = useMemo(() => {
    return (config?.tables || []).find((tab) => tab.name === "filing") || null;
  }, [config]);

  const showLogsTab = activeStatus === LOGS_TAB;

  const { visibleBatches, tableColumns } = useMemo(() => {
    const baseColumns =
      filterType === "fu" && config?.foreignUrgentColumns
        ? config.foreignUrgentColumns
        : config?.columns || [];
    const columns = [...baseColumns];
    if (activeStatus === "inbox") {
      columns.push({
        name: "transfer_from_department",
        label: "Dept Received From",
        formatter: (val) => (val ? String(val).charAt(0).toUpperCase() + String(val).slice(1) : "N/A"),
      });
    } else if (activeStatus === "outbox") {
      columns.push({
        name: "transfer_to_department",
        label: "Dept Sent To",
        formatter: (val) => (val ? String(val).charAt(0).toUpperCase() + String(val).slice(1) : "N/A"),
      });
    }
    const filtered =
      filterType === "normal"
        ? batches.filter((b) => b.current_department === department)
        : fuBatches.filter((b) => b.current_department === department);

    const searchLower = searchTerm.toLowerCase();
    const searchedBatches = filtered.filter((batch) => {
      if (filterType === "normal") {
        return (
          String(getPrimaryId(batch) || "").toLowerCase().includes(searchLower) ||
          String(batch.client_id || "").toLowerCase().includes(searchLower) ||
          String(batch.created_by || "").toLowerCase().includes(searchLower) ||
          String(batch.client_first || "").toLowerCase().includes(searchLower) ||
          String(batch.client_last || "").toLowerCase().includes(searchLower)
        );
      }
      return (
        String(batch.foreign_urgent_batch_id || getPrimaryId(batch) || "")
          .toLowerCase()
          .includes(searchLower) ||
        String(batch.patient_name || "").toLowerCase().includes(searchLower) ||
        String(batch.medical_aid_nr || "").toLowerCase().includes(searchLower)
      );
    });

    return { visibleBatches: searchedBatches, tableColumns: columns };
  }, [batches, fuBatches, filterType, config, department, searchTerm, activeStatus]);

  return {
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
  };
};
