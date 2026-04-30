# Patient intake request does not reach the clinical workspace

## Issue

Submitting a patient intake request can show a successful patient receipt, but the request is not visible in the clinical workspace.

The current clinical workspace at `http://127.0.0.1:4301` opens a seeded support ticket:

`/ops/support/tickets/support_ticket_218_delivery_failure`

That page is not the real destination for a newly submitted patient intake request.

## Expected flow

1. Patient completes the intake form.
2. Patient app submits to `/phase1/intake/submit`.
3. Backend promotes the draft into an authoritative request.
4. Backend creates receipt/status projections.
5. Backend creates a queued triage task.
6. Clinical workspace reads the real triage queue/request.
7. A clinician test account can then view and action the request.

## Current behavior

If `VITE_PHASE1_INTAKE_API_BASE_URL` is not configured, patient-web does not call the integrated intake API.

Instead, the patient app falls back to a local receipt route:

`/start-request/:draftPublicId/receipt`

This makes the patient side look successful, but no real clinical request is created for the clinical workspace.

## Root cause

This is not fixed by only creating a clinician test account.

The missing long-term wiring is:

- patient-web must submit to the real Phase 1 intake API
- the backend-created triage task must be persisted and queryable
- clinical workspace must load the real queue/request instead of the seeded support ticket route
- auth/test accounts must map clinicians to the correct practice/team queue

## Verified code references

- `apps/patient-web/src/phase1-integrated-intake-client.ts`
  - Reads `VITE_PHASE1_INTAKE_API_BASE_URL`
  - Posts integrated submissions to `/phase1/intake/submit`

- `apps/patient-web/src/patient-intake-mission-frame.tsx`
  - Falls back to local receipt/urgent-guidance routes when integrated submit is unavailable

- `services/command-api/src/intake-submit.ts`
  - Promotes submitted drafts into authoritative requests
  - Emits `triage.task.created` when a triage task is created

- `apps/clinical-workspace/src/App.tsx`
  - Defaults to `/ops/support/tickets/support_ticket_218_delivery_failure`
  - This is a seeded support workspace route, not the real intake destination

## Fix direction

Short-term development fix:

- run the API gateway and command API locally
- configure patient-web with `VITE_PHASE1_INTAKE_API_BASE_URL`
- submit a test intake request and verify the backend returns a `requestPublicId` and `triageTask`

Long-term product fix:

- add a real clinical intake queue surface
- connect it to backend triage task/query data
- route submitted requests by practice/team queue
- add clinician test accounts only after the queue and request data path is working

