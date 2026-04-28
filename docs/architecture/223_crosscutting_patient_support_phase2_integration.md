# 223 Crosscutting Patient and Support Phase 2 Integration

## Task

- Task id: `seq_223_crosscutting_merge_Playwright_or_other_appropriate_tooling_integrate_patient_account_and_support_surfaces_with_phase2_identity_and_status_models`
- Visual mode: `Portal_Support_Identity_Status_Integration_Lab`
- Truth kernel: `PatientSupportPhase2TruthKernel`

## Source trace

This merge implements the frozen Phase 2 and patient/support contracts from:

1. `blueprint/phase-2-identity-and-echoes.md`
   - trust contract and capability gates
   - auth and local session rules
   - authenticated request ownership and portal uplift
   - hardening and exit-gate sections
2. `blueprint/patient-account-and-communications-blueprint.md`
3. `blueprint/patient-portal-experience-architecture-blueprint.md`
4. `blueprint/staff-operations-and-support-blueprint.md`
5. `blueprint/callback-and-clinician-messaging-loop.md`
6. validated outputs from `195`, `197`, `215`, `216`, `217`, `220`, `221`, and `222`

## Integration outcome

The repository now carries one explicit merge kernel for patient portal and support workspace routes. The shared kernel binds:

- `request_211_a`
- `lineage_211_a`
- `cluster_214_derm`
- `thread_214_primary`
- `support_ticket_218_delivery_failure`
- `support_lineage_binding_218_delivery_failure_v1`

That registry is exported from `@vecells/domain-kernel` and consumed directly by the patient portal routes and the support workspace shell.

## One identity and session truth

The merge normalizes the same cause classes across patient and support:

- `session_current`
- `session_recovery_required`
- `identity_hold`
- `wrong_patient_freeze`
- `repair_required`
- `step_up_required`
- `read_only_recovery`

The following route families now expose the same kernel-backed state markers:

- `/home`
- `/requests`
- `/requests/:requestId`
- `/requests/:requestId/more-info/*`
- `/requests/:requestId/callback/*`
- `/contact-repair/:repairCaseRef/*`
- `/records/*`
- `/messages/*`
- `/auth/*`
- `/portal/claim/*`
- `/ops/support/tickets/:supportTicketId`
- `/ops/support/tickets/:supportTicketId/history`
- `/ops/support/tickets/:supportTicketId/knowledge`
- `/ops/support/tickets/:supportTicketId/actions/:actionKey`
- `/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId`
- `/ops/support/replay/:supportReplaySessionId`

## One request status and ownership truth

For the shared fixture, patient and support surfaces now agree on:

- canonical request status: `Reply needed`
- same authoritative request lineage: `lineage_211_a`
- same communication chain: `cluster_214_derm` and `thread_214_primary`
- same patient-facing next action: `Reply with more information`
- same support-side framing of that obligation: `Guide the patient back to the same reply-needed step`

Repair, step-up, signed-out, identity-hold, and replay-safe fallback routes all derive from the same cause ladder instead of route-local labels.

## Contact domain separation

The merged surfaces now render five distinct contact or identity domains without collapsing them:

1. `Auth claim`
2. `Identity evidence`
3. `Demographic evidence`
4. `Patient preference`
5. `Support reachability`

Those are rendered in both patient and support UI so the operator and patient views do not reuse one ambiguous contact field.

## Restriction and fallback parity

The merge deliberately keeps different shells for portal recovery and support fallback, but the meaning now aligns:

- patient signed-out routes and support replay fallback both point to the same recovery-oriented cause ladder
- patient record step-up and support disclosure ceilings both point to `step_up_required`
- patient callback/contact repair and support delivery repair both point to `repair_required`
- patient read-only claim posture and support read-only replay posture both point to `read_only_recovery`

## Merge-time seam resolution

The major merge seam was the mismatch between the patient request identity (`211`), the communication chain (`214`), and the support ticket (`218`). Rather than silently choosing one side, `223` publishes that relationship in the shared kernel and the machine-readable bundle. The seam log in `data/analysis/223_merge_gap_log.json` records the resolved adapter explicitly.

## Browser proof

Playwright proves:

- signed-in patient request and support ticket parity
- signed-out and identity-hold patient recovery routes
- repair-required patient callback and communication routes
- step-up record restrictions
- support history, knowledge, and read-only replay fallback
- keyboard traversal, ARIA snapshots, reduced motion, and contrast checks

## Files

- shared kernel: `/Users/test/Code/V/packages/domain-kernel/src/patient-support-phase2-integration.ts`
- patient surfaces: `/Users/test/Code/V/apps/patient-web/src`
- support shell: `/Users/test/Code/V/apps/clinical-workspace/src/support-workspace-shell.tsx`
- bundle: `/Users/test/Code/V/data/contracts/223_crosscutting_identity_status_surface_bundle.json`
- matrix: `/Users/test/Code/V/data/analysis/223_patient_support_status_parity_matrix.csv`
- lab: `/Users/test/Code/V/docs/frontend/223_patient_support_identity_status_integration_lab.html`
