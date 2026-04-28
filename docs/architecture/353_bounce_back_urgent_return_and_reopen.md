# 353 Bounce-Back, Urgent Return, and Reopen

## Purpose

`353` turns pharmacy return handling into one explicit backend workflow. The authoritative runtime is `/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-bounce-back-engine.ts`.

The engine consumes:

- `346` pharmacy case and lineage authority
- `348` provider and consent truth
- `350` dispatch settlement truth
- `351` patient-safe status and reachability projection inputs
- `352` outcome settlement and reopen-for-safety truth

It does not rely on mailbox notes, local queue labels, or UI-side inference.

## Core services

The backend publishes one bounded bounce-back family:

- `PharmacyBounceBackNormalizer`
- `PharmacyBounceBackRecordService`
- `PharmacyReopenPriorityCalculator`
- `PharmacyUrgentReturnChannelResolver`
- `PharmacyReopenLeaseService`
- `PharmacyReturnReachabilityBridge`
- `PharmacyBounceBackTruthProjectionBuilder`
- `PharmacyLoopSupervisorEscalationService`

The public service entrypoints are:

- `previewNormalizedBounceBack`
- `ingestBounceBackEvidence`
- `reopenCaseFromBounceBack`
- `getActiveBounceBackSummary`
- `getLoopRiskAndSupervisorPosture`
- `getReturnSpecificPatientMessagePreview`
- `resolveSupervisorReview`

## Workflow

1. Inbound evidence is normalized into the frozen seven-type vocabulary.
2. The engine computes `urgencyCarryFloor`, `materialChange`, `loopRisk`, `reopenSignal`, and `reopenPriorityBand` with the 6G thresholds.
3. The canonical `PharmacyBounceBackRecord` is created and bound to the same `PharmacyCase` lineage.
4. Urgent and safeguarding returns resolve an `UrgentReturnDirectRouteProfile` and explicitly forbid Update Record as the urgent return channel.
5. Contact-route truth is revalidated for `pharmacy_contact`, `outcome_confirmation`, and `urgent_return`. Broken routes reopen or continue repair.
6. The case is mutated into `urgent_bounce_back`, `no_contact_return_pending`, or `unresolved_returned` when the case is still in a mutable outcome stage.
7. A triage reacquisition target is derived:
   - `duty_task` for urgent or supervised bounce-backs
   - `original_request` for lower-band routine reopen flows
8. `LifecycleCoordinator` is used to reacquire the reopened lease and restore `triage_active` posture where allowed.
9. Practice visibility, patient notification intent, supervisor review, and server-side reopen truth are rebuilt from the canonical result.
10. Auto-redispatch and auto-close are blocked whenever the loop laws require it.

## Important laws

- Urgent return is a separate safety channel. It is not a calm outcome path and is not an Update Record completion path.
- No-contact return cannot assume old patient routes are still trustworthy.
- Repeated non-material returns escalate into supervisor review rather than cycling indefinitely.
- Reopen truth stays same-lineage. Later queue, operations, patient, and console tracks must consume this family directly.

## Idempotency and replay

- The engine persists a replay digest per normalized evidence envelope.
- Sequential duplicate delivery returns the previously stored truth.
- In-flight duplicate delivery shares one active computation so parallel duplicate messages do not create multiple bounce-back records.

## Current implementation notes

- If a return arrives after the case is already in a bounce-back state, the engine treats it as enrichment of the existing bounce-back shell instead of forcing a second illegal case transition.
- Reopen and supervisor-resolution paths rebuild practice visibility and bounce-back truth so later APIs do not retain stale projection references.
