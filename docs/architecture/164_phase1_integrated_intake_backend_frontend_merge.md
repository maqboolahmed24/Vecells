# Phase 1 Integrated Intake Backend And Frontend Merge

Task `seq_164` closes the Phase 1 split between the patient shell and the backend command/worker tracks. The implementation adds one gateway-owned integration seam for draft start, autosave, attachment mirroring, contact preference capture, governed submit, urgent or receipt settlement, projection reads, replay, and notification dispatch truth.

## Operating Contract

- Contract: `PHASE1_INTEGRATED_ROUTE_AND_SETTLEMENT_BUNDLE_V1`
- Route family: `rf_intake_self_service`
- Shell continuity key: `patient.portal.requests`
- Surface binding: `ASRB_050_PATIENT_PUBLIC_ENTRY_V1`
- Continuity rule: one Quiet Clarity Mission Frame shell from draft start through urgent diversion, routine receipt, and minimal tracking.
- Request types: `Symptoms`, `Meds`, `Admin`, `Results`

The browser no longer stitches unrelated endpoint meanings. It calls the gateway seam in `services/api-gateway/src/phase1-integrated-intake.ts`, and the gateway composes the command API submission application with the notification worker against the same confirmation repositories.

## Merge Decisions

| Seam | Prior risk | Integrated decision |
| --- | --- | --- |
| Route metadata | Frontend and backend agreed in prose but not field names | Every endpoint returns route family, lineage key, shell continuity key, selected anchor, posture, surface state, and projection tuple refs. |
| Submit result | UI could show success before authoritative result tuple | Submit returns only after promotion, outcome, receipt, tracking, and notification queue truth are read from one command-following chain. |
| Notification | Dispatch could become a UI side effect | The worker advances `Phase1ConfirmationTransportSettlement` and `Phase1ConfirmationDeliveryEvidence` from the queued envelope. |
| Receipt and tracking | ETA and promise state could drift | Both receipt and minimal tracking read from the same `PatientReceiptConsistencyEnvelope` family. |
| Replay | Retry could look like a second success | Exact replay returns the prior settlement and request public id; duplicate visible success is forbidden. |
| Stale promoted drafts | Old draft links could reopen editing | Stale promoted draft posture remains read-only or recovery-only in the same shell. |

## Runtime Flow

1. `POST /phase1/intake/start` creates the authoritative draft, lease, resume token, and continuity projection.
2. The mission frame stores the integrated session and keeps the same shell active.
3. Autosave calls `POST /phase1/intake/patch`; attachments are mirrored into the authoritative upload and scan pipeline on submit.
4. Contact preference data is captured through the Phase 1 contact/reachability contract.
5. `POST /phase1/intake/submit` patches the latest draft, promotes it immutably, evaluates safety, creates either urgent diversion or routine receipt, and queues confirmation communication.
6. The active shell morphs to urgent guidance or receipt by request public id without a detached confirmation page.
7. `GET /phase1/intake/projection` returns the same receipt/status/notification tuple after refresh or replay.
8. `POST /phase1/intake/notifications/advance` simulates downstream transport and delivery truth without treating queueing as delivery.

## Source Map

- Gateway seam: `services/api-gateway/src/phase1-integrated-intake.ts`
- Gateway runtime routing: `services/api-gateway/src/runtime.ts`
- Gateway surface definition: `services/api-gateway/src/service-definition.ts`
- Patient shell client: `apps/patient-web/src/phase1-integrated-intake-client.ts`
- Patient shell morph: `apps/patient-web/src/patient-intake-mission-frame.tsx`
- Notification worker: `services/notification-worker/src/confirmation-dispatch.ts`

## Verification Hooks

- Runtime integration: `services/api-gateway/tests/phase1-integrated-intake.integration.test.js`
- Browser/API proof: `tests/playwright/164_phase1_integrated_intake.spec.js`
- Artifact validator: `tools/analysis/validate_phase1_integrated_intake.py`
- Matrices: `data/analysis/164_phase1_endpoint_to_surface_binding_matrix.csv` and `data/analysis/164_phase1_same_lineage_transition_matrix.csv`
