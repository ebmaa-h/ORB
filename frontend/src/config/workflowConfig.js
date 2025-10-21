const WORKFLOW_CONFIG = {
  reception: {
    socketRoom: "reception",
    endpointKey: "receptionWorkflow", // will be resolved against ENDPOINTS

    columns: [
      { name: 'batch_id', label: 'Batch ID' },
      { name: 'client_id', label: 'Client ID' },
      { name: 'date_received', label: 'Date Received', formatter: (val) => new Date(val).toLocaleDateString() },
      { name: 'method_received', label: 'Method Received' },
    ],
    foreignUrgentColumns: [
      { name: 'batch_id', label: 'Batch ID' },
      { name: 'client_id', label: 'Client ID' },
      { name: 'date_received', label: 'Date Received', formatter: (val) => new Date(val).toLocaleDateString() },
      { name: 'method_received', label: 'Method Received' },
      { name: 'patient_name', label: 'Patient Name' },
      { name: 'medical_aid_nr', label: 'Medical Aid Number' },
    ],
    actions: [
      {
        name: "sentToAdmittance",
        label: "Send to Admittance",
        method: "post",
        endpointKey: "moveToAdmittance" 
      },
      {
        name: "sentToBilling",
        label: "Send to Billing",
        method: "post",
        endpointKey: "moveToBilling" 
      },
    ],
    tables: [
      {name: "filing"},
      {name: "current"},
      {name: "outbox"},
    ],
  },
    admittance: {
    socketRoom: "admittance",
    endpointKey: "admittanceWorkflow",

    columns: [
      { name: 'batch_id', label: 'Batch ID' },
      { name: 'client_id', label: 'Client ID' },
      { name: 'date_received', label: 'Date Received', formatter: (val) => new Date(val).toLocaleDateString() },
      { name: 'method_received', label: 'Method Received' },
    ],
    foreignUrgentColumns: [
      { name: 'batch_id', label: 'Batch ID' },
      { name: 'client_id', label: 'Client ID' },
      { name: 'date_received', label: 'Date Received', formatter: (val) => new Date(val).toLocaleDateString() },
      { name: 'method_received', label: 'Method Received' },
      { name: 'patient_name', label: 'Patient Name' },
      { name: 'medical_aid_nr', label: 'Medical Aid Number' },
    ],
    actions: [
      {
        name: "sentToReception",
        label: "Send to Reception",
        method: "post",
        endpointKey: "moveToReception" 
      },
      {
        name: "sentToBilling",
        label: "Send to Billing",
        method: "post",
        endpointKey: "moveToBilling" 
      },
    ],
    tables: [
      {name: "inbox"},
      {name: "current"},
      {name: "outbox"},
    ],
  },
    billing: {
    socketRoom: "billing",
    endpointKey: "billingWorkflow",

    columns: [
      { name: 'batch_id', label: 'Batch ID' },
      { name: 'client_id', label: 'Client ID' },
      { name: 'date_received', label: 'Date Received', formatter: (val) => new Date(val).toLocaleDateString() },
      { name: 'method_received', label: 'Method Received' },
    ],
    foreignUrgentColumns: [
      { name: 'batch_id', label: 'Batch ID' },
      { name: 'client_id', label: 'Client ID' },
      { name: 'date_received', label: 'Date Received', formatter: (val) => new Date(val).toLocaleDateString() },
      { name: 'method_received', label: 'Method Received' },
      { name: 'patient_name', label: 'Patient Name' },
      { name: 'medical_aid_nr', label: 'Medical Aid Number' },
    ],
    actions: [
      {
        name: "sentToReception",
        label: "Send to Reception",
        method: "post",
        endpointKey: "moveToReception" 
      },
      {
        name: "sentToAdmittance",
        label: "Send to Admittance",
        method: "post",
        endpointKey: "moveToAdmittance" 
      },
    ],
    tables: [
      {name: "inbox"},
      {name: "current"},
      {name: "outbox"},
    ],
  },
};

export default WORKFLOW_CONFIG;
