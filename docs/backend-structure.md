# Backend Structure Alignment (plan)

> Goal: keep current behavior, but provide a clear layering so new features (permissions, billing, delegation) stay organized.

- **Layering**
  - `routes/` → HTTP wiring only; no logic.
  - `controllers/` → validate input + call services; format responses.
  - `services/` → business logic per domain: `AuthService`, `BatchService`, `AccountService`, `WorkflowService`, `LogService`.
  - `data` (or `models/`) → DB access, schema helpers.
  - `sockets/` → only emit/subscribe; delegate business logic to services.

- **Batch/Workflow service responsibilities**
  - Normalize IDs/flags (reuse `domain/batch` logic on server).
  - Move batches between departments/status; enforce rules per department.
  - Emit structured log events (`LogService`) + Socket.IO payloads after mutations.

- **Account (invoice) service**
  - CRUD for accounts tied to a batch.
  - Handles FU vs normal account constraints (e.g., FU allows one account).
  - Emits `ACCOUNT_*` log events.

- **Log service**
  - Single entry point to write logs/notes with consistent `action` enums.
  - Accepts `{ action, entity_type, entity_id, user_id, metadata }`.
  - Broadcasts to sockets for real-time UI updates.

- **Permissions (future)**
  - Middleware layer to check `role/permissions` before controllers run.
  - Mirror the frontend `hasPermission` helper with the same role→permission map.

- **Routing/naming**
  - Keep batch navigation contract: `/batches/:id` vs `/fu-batches/:id`, with state `{ from, isFu }`.
  - Keep workflow endpoints keyed via `endpointKey` in `workflowConfig` to stay symmetric with the client.
