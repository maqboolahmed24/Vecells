# Surface Conflict And Gap Report

## Conflicts And Gaps

| ID | Class | Subject | Resolution | Status |
| --- | --- | --- | --- | --- |
| CONFLICT_004_001 | resolved_conflict | /workspace/pharmacy/* looks like workspace routing but belongs to the pharmacy shell. | ShellFamilyOwnershipContract(shellType = pharmacy) and RouteFamilyOwnershipClaim override the /workspace prefix. | resolved |
| CONFLICT_004_002 | resolved_conflict | /ops/support/* looks like operations routing but belongs to the support shell. | Support gets its own ticket-centric shell with explicit replay, observe, and repair routes. | resolved |
| CONFLICT_004_003 | resolved_conflict | /ops/governance/*, /ops/access/*, /ops/config/*, /ops/comms/*, and /ops/release/* sit under /ops but belong to the governance shell. | Governance/admin is modeled as a distinct control surface, not an operations subpanel. | resolved |
| CONFLICT_004_004 | resolved_conflict | /ops/audit, /ops/assurance, /ops/incidents, and /ops/resilience are operations-owned routes that governance may open as read-only pivots. | Operations retains ownership; governance gets bounded read-only pivots through return tokens rather than silent shell transfer. | resolved |
| CONFLICT_004_005 | resolved_conflict | Embedded NHS App posture can be mistaken for a separate shell or product. | Embedded mode is a channel profile and deferred channel expansion over the patient shell, not a separate shell family. | resolved |
| CONFLICT_004_006 | resolved_conflict | Telephony/IVR, secure-link continuation, and support-assisted capture can be mistaken for shell families. | They are ingress channels into the same governed lineage, not standalone back-office shells. | resolved |
| CONFLICT_004_007 | resolved_conflict | Patient public, authenticated, and grant-scoped recovery were previously conflated into one patient actor. | This inventory keeps patient_public, patient_authenticated, and patient_grant_scoped distinct, with secure-link recovery modeled as a derived audience posture. | resolved |
| CONFLICT_004_008 | resolved_conflict | The word staff was overloaded across clinician, practice ops, hub, pharmacy, support, operations, and governance roles. | This inventory splits those roles into explicit personas, tiers, and shell owners. | resolved |
| GAP_004_001 | bounded_gap | The corpus names intake continuity rules but does not yet publish final browser route contracts for intake or secure-link entry. | Derived route-family labels are used here and must be hardened by later endpoint mapping work. | open |
| GAP_004_002 | bounded_gap | Phase 0 allows standalone assistive evaluation, replay, monitoring, and release-control work but does not publish a concrete route family for it. | A conditional assistive-control route family is recorded here as a derived inventory label only. | open |

## Assumptions

- ASSUMPTION_AUDIENCE_004_001: Grant-scoped patient recovery is modeled as a derived audience tier over Phase 0 patient_public coverage because the corpus distinguishes secure-link recovery by purpose of use rather than by adding a third mandatory patient base tier.
- ASSUMPTION_CHANNEL_004_002: Telephony/IVR and secure-link continuation are mapped to constrained_browser shell posture where a current shell is preserved, because Phase 0 canonicalizes browser, embedded, and constrained_browser as the only shell channel profiles.
- ASSUMPTION_ROUTE_004_003: Pre-submit intake and standalone assistive-control route families are inventory labels derived from the corpus until later tasks publish concrete URL contracts.

## Risks

- RISK_ROUTE_004_001: Seq_005 must harden explicit intake and secure-link route contracts so later API and projection work does not drift between derived labels and implementation endpoints.
- RISK_CONTROL_004_002: Operations, governance, assurance, and break-glass audience rows are clearly required by Phase 0 but are not yet centralized in one dedicated machine-readable coverage registry.
- RISK_ASSISTIVE_004_003: Standalone assistive evaluation, replay, monitoring, and release-control tooling is named by function in the corpus, so any later concrete routes must preserve the bounded-secondary rule encoded here.
