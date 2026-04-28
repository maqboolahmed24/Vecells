
# 278 Phase 4 Booking Lineage, Epoch, and Identity Repair Rules

This pack fixes the security and recovery invariants that must survive every later Phase 4 implementation.

## Binding rules

| Binding | Enforcement rule |
| --- | --- |
| sourceDecisionEpochRef | Case creation, search, select, confirm, waitlist, callback fallback, and hub fallback must validate the current unsuperseded triage decision epoch before mutating. |
| sourceDecisionSupersessionRef | If supersession appears after shell open, selected slot and summary provenance may remain visible but every mutation degrades to governed same-shell recovery. |
| lineageCaseLinkRef | Case creation moves the booking child link from proposed to acknowledged and later child links must not overwrite it. |
| requestLifecycleLeaseRef | Confirm, waitlist, hub fallback, callback fallback, cancel, reschedule, reminder, and staff-assisted actions must present the current request lifecycle lease. |
| ownershipEpoch | Ownership drift creates or reuses stale-owner recovery and freezes mutation until reacquire. |
| identityRepairBranchDispositionRef | Pending_freeze, quarantined, and compensation_pending preserve summary provenance only; live booking returns only after released settlement. |
| patientShellConsistencyProjectionRef | Same-shell booking and appointment routes may mutate only when shell continuity remains current. |
| patientEmbeddedSessionProjectionRef | Embedded mode without a current embedded-session projection must degrade to route freeze or release recovery. |
| surfaceRouteContractRef | Every booking child route remains publication-governed and same-shell. |
| surfacePublicationRef | Stale, conflict, or withdrawn publication freezes in place rather than silently leaving controls live. |
| runtimePublicationBundleRef | Shell writability depends on the live bundle, not only local route state. |
| routeFreezeDispositionRef | Select, confirm, cancel, and reschedule surfaces must freeze in place with explicit recovery posture. |
| releaseRecoveryDispositionRef | Release recovery applies to booking routes and appointment manage flows before any local browser heuristics. |

## Fail-closed invariants

1. Source decision supersession freezes booking mutation before search, select, confirm, waitlist join, callback fallback, hub fallback, cancel, or reschedule.
2. Wrong-patient correction preserves summary provenance only; live booking may return only after released identity-repair settlement.
3. Request lifecycle lease drift or ownership epoch drift creates stale-owner recovery and blocks mutation in place.
4. Publication drift or release recovery freezes routes in place rather than redirecting to detached fallback pages.
5. Booking branch closure is not request closure; only `LifecycleCoordinator` may derive request closure after downstream milestones converge.

## Explicit non-goals

- no browser-local booking truth
- no route-local success pages that bypass confirmation truth
- no booking-local closure authority
- no implicit lineage repair by hiding old references
