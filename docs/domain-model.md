# Domain Model (Frontend-Oriented)

> Scope: current workflow/batches/accounts UI. Mechanics stay as-is; this document just pins shared concepts and IDs so new features (billing, permissions, delegation) have a common language.

- **User**
  - `user_id`, `email`, `name`, `permissions` (array of strings/roles)
  - Derived `role` maps to permissions (future: managed on Users/Permissions pages)

- **Client**
  - `client_id`, `client_first`, `client_last`

- **Batch**
  - Identity: `batch_id | batchId | id` → normalized to `primary_id` (string)
  - Flags: `is_fu` (foreign/urgent), `is_pure_foreign_urgent`
  - Links: `client_id`, `foreign_urgent_batch_id` (if FU child), `parent_batch_id`
  - State: `current_department`, `status` (`inbox/current/outbox/filing/...`)
  - Meta: `batch_size`, `method_received`, `date_received/completed`, `notes`, audit fields (`created_by`, etc.)

- **Foreign & Urgent Batch**
  - Identity: `foreign_urgent_batch_id | fu_batch_id | FULID`
  - Inherits many `Batch` fields; uses `is_fu = true`

- **Account / Invoice**
  - Linked to a batch; carries patient/member data, financials, status
  - (Future) billing config will live per batch type/department

- **Log Event**
  - `log_id`, `entity_type` (`batch/account/client/user`), `entity_id`
  - `action` (enum-like string), `metadata` (JSON with `changes`), `created_at`, `user_id`, `email`

- **Navigation Contract (batch links)**
  - Path: `/batches/:id` or `/fu-batches/:id` (if `is_fu`)
  - State: `{ batch, isFu, from: { path, activeStatus, filterType } }`

- **Normalization helpers (code)**
  - `getPrimaryId(batch)`: stable string ID for a batch
  - `isForeignUrgentEntity(batch)`: detects FU/urgent flavor
  - `normalizeIsPureFlag(value)`: coerces truthy/falsey mixed types
  - `normalizeBatchIdentity(batch, fallbackDept?)`: returns `{ ...batch, primary_id, is_fu }`
