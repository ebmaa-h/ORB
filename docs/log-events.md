# Log & Action Events

> Purpose: make workflow actions auditable and consistent across UI + backend. Keep behavior as-is; this just codifies the contract.

- **Event shape (backend)**
  - `log_id`, `entity_type` (`batch/account/client/user`), `entity_id`
  - `action` (see `client/src/domain/logEvents.js`)
  - `metadata` (JSON): `{ changes: { field: { before, after } }, context?: {}, batch_type?, department? }`
  - `created_at`, `user_id`, `email`

- **Frontend usage**
  - `EntityNotesAndLogs` consumes `action`, `metadata`, and `changes` to render context and “diffs”.
  - `LOG_EVENT_TYPES` & `LOG_ENTITY_TYPES` live in `client/src/domain/logEvents.js` to prevent ad-hoc strings.
  - Navigation to a batch from logs uses `deriveBatchNavigation` so FU vs normal routing stays correct.

- **Recommended event types (current set)**
  - `BATCH_CREATED`, `BATCH_UPDATED`, `STATUS_CHANGED`, `DEPARTMENT_CHANGED`
  - `ASSIGNED` (batch assigned/reassigned)
  - `ACCOUNT_ADDED`, `ACCOUNT_UPDATED`, `ACCOUNT_REMOVED`
  - `NOTES_ADDED`, `FILE_ATTACHED`, `ARCHIVED`

- **When to emit**
  - After a controller/service completes the action (e.g., move to billing, accept batch, archive).
  - Include `changes` for any field transitions; prefer normalized field keys (same labels used in UI).
  - Emit via `LogService` (planned) and broadcast via Socket.IO alongside the batch update.
