// src/config/workflowConfig.js
const WORKFLOW_CONFIG = {
  reception: {
    socketRoom: "reception",
    endpointKey: "receptionWorkflow", // will be resolved against ENDPOINTS

    columns: [
      {name: "batch_id", label: "Batch ID"},
      {name: "client_name", label: "Client"},
      {name: "batch_size", label: "Size"},
      {name: "created_by_email", label: "Created By"},
      {name: "date_received", label: "Date", formatter: (v) => new Date(v).toLocaleDateString()},
      {name: "type", label: "Type"}, // "normal"|"urgent & foreign"
    ],
    actions: [
      {
        name: "sendToAdmittance",
        label: "Send to Admittance",
        method: "post",
        endpointKey: "moveToAdmittance" // map to ENDPOINTS.moveToAdmittance
      },

    ],
  },

  admittance: {
    socketRoom: "admittance",
    endpointKey: "admittanceWorkflow",
    columns: [
      {name: "batch_id", label: "Batch ID"},
      {name: "client_name", label: "Client"},
      {name: "batch_size", label: "Size"},
      {name: "created_by_email", label: "Created By"},
      {name: "date_received", label: "Date", formatter: (v) => new Date(v).toLocaleDateString()},
      {name: "type", label: "Type"},
    ],
    actions: [
      {
        name: "sendToBilling",
        label: "Send to Billing",
        method: "post",
        endpointKey: "moveToBilling"
      }
    ],
  },

  billing: {
    socketRoom: "billing",
    endpointKey: "billingWorkflow",
    columns: [
      {name: "batch_id", label: "Batch ID"},
      {name: "client_name", label: "Client"},
      {name: "batch_size", label: "Size"},
      {name: "created_by_email", label: "Created By"},
      {name: "date_received", label: "Date", formatter: (v) => new Date(v).toLocaleDateString()},
      {name: "status", label: "Status"},
    ],
    actions: [
      {
        name: "archiveBatch",
        label: "Archive",
        method: "post",
        endpointKey: "archiveBatch"
      }
    ],
  }
};

export default WORKFLOW_CONFIG;
