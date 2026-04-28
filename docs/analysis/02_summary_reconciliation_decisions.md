# Summary reconciliation decisions

This decision pack records all 19 non-exact summary-layer discrepancies, including the canonical winner, normalized wording, losing sources, and future lint posture.

## STATE_SUBMISSION_ENVELOPE - SubmissionEnvelope.state owns draft and pre-promotion lifecycle

- Classification: `underspecified_summary`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: blueprint-init.md, phase-cards.md
- Normalized wording: Use `SubmissionEnvelope.state = draft | evidence_pending | ready_to_promote | promoted | abandoned | expired`; do not model draft as `Request.workflowState`.
- Summary patch required: `yes`
- Future lint rule: `Reject any canonical schema or summary text that stores draft state on `Request.workflowState`.`
- Related requirement ids: GAP-FINDING-001, REQ-INV-003, REQ-OBJ-submissionenvelope

## STATE_WORKFLOW_MILESTONES - Request.workflowState is milestone-only

- Classification: `canonical_conflict`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: forensic-audit-findings.md, phase-4-the-booking-engine.md, phase-6-the-pharmacy-loop.md
- Normalized wording: Normalize `Request.workflowState` to milestone-only values: `submitted`, `intake_normalized`, `triage_ready`, `triage_active`, `handoff_active`, `outcome_recorded`, `closed`.
- Summary patch required: `yes`
- Future lint rule: `Fail any new summary, schema, or projection contract that introduces blocker or reconciliation labels into `Request.workflowState`.`
- Related requirement ids: GAP-FINDING-048, GAP-FINDING-053, GAP-FINDING-054, GAP-FINDING-056, GAP-FINDING-070, GAP-FINDING-073, GAP-FINDING-074, GAP-FINDING-078, GAP-FINDING-085, REQ-INV-012

## STATE_SAFETY_AXIS - Request.safetyState is a persisted orthogonal axis

- Classification: `underspecified_summary`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: blueprint-init.md, vecells-complete-end-to-end-flow.md
- Normalized wording: Persist `Request.safetyState` independently of workflow milestones and keep `urgent_diversion_required` separate from `urgent_diverted`.
- Summary patch required: `yes`
- Future lint rule: `Reject summary text that collapses urgent diversion requirement and completion into one state.`
- Related requirement ids: GAP-FINDING-049, REQ-EDGE-URGENT-STATE-SEPARATION, REQ-INV-008

## STATE_IDENTITY_AXIS_PATIENTREF - identityState plus nullable patientRef derived from IdentityBinding

- Classification: `canonical_conflict`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: forensic-audit-findings.md, blueprint-init.md
- Normalized wording: Use `identityState = anonymous | partial_match | matched | claimed`; treat `patientRef` as nullable and derive it only from settled `IdentityBinding`.
- Summary patch required: `yes`
- Future lint rule: `Reject any summary or schema that assumes unconditional `patientRef` or uses `ownershipState` instead of `identityState`.`
- Related requirement ids: GAP-FINDING-050, GAP-FINDING-055, REQ-INV-004, REQ-INV-005

## STATE_BLOCKER_ORTHOGONALITY - blockers remain orthogonal to workflow milestones

- Classification: `canonical_conflict`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: forensic-audit-findings.md, phase-4-the-booking-engine.md, phase-6-the-pharmacy-loop.md
- Normalized wording: Represent duplicate review, identity repair, fallback recovery, reachability repair, and confirmation ambiguity in blocker or gate refs, never as workflow milestones.
- Summary patch required: `yes`
- Future lint rule: `Fail any summary or codegen rule that serializes blockers as workflow milestones.`
- Related requirement ids: GAP-FINDING-052, GAP-FINDING-053, GAP-FINDING-073, GAP-FINDING-078, GAP-FINDING-085

## OWNERSHIP_LIFECYCLE_COORDINATOR - LifecycleCoordinator alone derives canonical Request milestone change and closure

- Classification: `canonical_conflict`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: phase-3-the-human-checkpoint.md, phase-4-the-booking-engine.md, phase-5-the-network-horizon.md, phase-6-the-pharmacy-loop.md
- Normalized wording: Triage, booking, hub, pharmacy, support, and assistive domains emit facts, milestones, blockers, and evidence; only `LifecycleCoordinator` derives canonical request milestone change and closure.
- Summary patch required: `yes`
- Future lint rule: `Block any summary or schema implying a child domain writes canonical request close/reopen state directly.`
- Related requirement ids: GAP-FINDING-045, GAP-FINDING-074, GAP-FINDING-075, GAP-FINDING-076, GAP-FINDING-077, REQ-INV-012, REQ-OBJ-lifecyclecoordinator

## OWNERSHIP_VISIBILITY_POLICY - VisibilityProjectionPolicy owns materialization and calmness eligibility

- Classification: `underspecified_summary`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: blueprint-init.md, patient-account-and-communications-blueprint.md
- Normalized wording: Visibility, masking, and section posture must resolve through `VisibilityProjectionPolicy` and related contracts before projection materialization or calm trust cues render.
- Summary patch required: `yes`
- Future lint rule: `Reject summary-layer language that implies projections can materialize before visibility or masking policy is compiled.`
- Related requirement ids: GAP-FINDING-087, REQ-EDGE-VISIBILITY-PROJECTION-BEFORE-MATERIALIZATION, REQ-INV-044, REQ-INV-047, REQ-OBJ-minimumnecessarycontract, REQ-OBJ-visibilityprojectionpolicy

## UI_SHELL_FAMILY_OWNERSHIP - ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency

- Classification: `terminology_drift`
- Canonical winner: `platform-frontend-blueprint.md`
- Losing sources: phase-cards.md, blueprint-init.md
- Normalized wording: Shell residency is governed by `ShellFamilyOwnershipContract` and `RouteFamilyOwnershipClaim`, not route prefixes, feature names, or layout resemblance.
- Summary patch required: `yes`
- Future lint rule: `Fail any new summary or IA doc that infers shell ownership from URL prefix or feature area alone.`
- Related requirement ids: none

## UI_CHANNEL_PROFILE_CONSTRAINTS - channel profiles constrain shell posture without redefining the shell family

- Classification: `terminology_drift`
- Canonical winner: `platform-frontend-blueprint.md`
- Losing sources: blueprint-init.md, phase-cards.md
- Normalized wording: Embedded, constrained-browser, and browser handoff change channel posture and affordances, but not the owning shell family; NHS App remains a deferred channel-expansion phase rather than a present hard gate.
- Summary patch required: `yes`
- Future lint rule: `Reject summary language that treats NHS App embedded delivery as a current baseline hard gate or separate native workflow.`
- Related requirement ids: GAP-FINDING-090, GAP-FINDING-091, GAP-FINDING-096, GAP-FINDING-115, GAP-FINDING-116, GAP-FINDING-117, GAP-FINDING-120, REQ-CTRL-patient-portal-experience-architecture-blueprint-md-005-control-priorities, REQ-CTRL-phase-1-the-red-flag-gate-md-002-control-priorities, REQ-CTRL-phase-4-the-booking-engine-md-002-booking-surface-control-priorities, REQ-CTRL-phase-7-inside-the-nhs-app-md-003-what-phase-7-must-prove-before-phase-8-starts, REQ-CTRL-phase-7-inside-the-nhs-app-md-006-what-phase-7-must-prove-before-phase-8-starts, REQ-CTRL-platform-runtime-and-release-blueprint-md-002-cross-layer-control-priorities, REQ-CTRL-self-care-content-and-admin-resolution-blueprint-md-001-cross-layer-control-priorities, REQ-CTRL-self-care-content-and-admin-resolution-blueprint-md-005-cross-layer-control-priorities, REQ-EDGE-RELEASE-CHANNEL-TRUST-FENCE, REQ-INV-038, REQ-INV-045, REQ-INV-048, REQ-INV-062, REQ-OBJ-channelreleasefreezerecord, REQ-OBJ-patientembeddedsessionprojection, REQ-SRC-design-token-foundation-md, REQ-TEST-phase-4-the-booking-engine-md-119, REQ-TEST-phase-5-the-network-horizon-md-057, REQ-TEST-phase-5-the-network-horizon-md-058, REQ-TEST-phase-5-the-network-horizon-md-061, REQ-TEST-phase-5-the-network-horizon-md-112, REQ-TEST-phase-6-the-pharmacy-loop-md-071, REQ-TEST-phase-7-inside-the-nhs-app-md-002, REQ-TEST-phase-7-inside-the-nhs-app-md-012, REQ-TEST-phase-7-inside-the-nhs-app-md-013, REQ-TEST-phase-7-inside-the-nhs-app-md-029, REQ-TEST-phase-7-inside-the-nhs-app-md-040, REQ-TEST-phase-7-inside-the-nhs-app-md-043, REQ-TEST-phase-7-inside-the-nhs-app-md-052, REQ-TEST-phase-7-inside-the-nhs-app-md-055, REQ-TEST-phase-7-inside-the-nhs-app-md-064, REQ-TEST-phase-7-inside-the-nhs-app-md-065, REQ-TEST-phase-7-inside-the-nhs-app-md-067, REQ-TEST-phase-7-inside-the-nhs-app-md-069, REQ-TEST-phase-7-inside-the-nhs-app-md-070, REQ-TEST-phase-7-inside-the-nhs-app-md-078, REQ-TEST-phase-7-inside-the-nhs-app-md-080

## MUTATION_ROUTE_INTENT_BINDING - RouteIntentBinding is the canonical post-submit mutation fence

- Classification: `underspecified_summary`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: blueprint-init.md, phase-cards.md, vecells-complete-end-to-end-flow.md
- Normalized wording: Every post-submit mutation binds one live `RouteIntentBinding` over route family, session, subject binding, fence epoch, and publication posture.
- Summary patch required: `yes`
- Future lint rule: `Reject patient or staff mutation summaries that describe live actions without a bound route-intent tuple.`
- Related requirement ids: GAP-FINDING-091, GAP-FINDING-096, REQ-CTRL-phase-1-the-red-flag-gate-md-003-control-priorities, REQ-CTRL-phase-3-the-human-checkpoint-md-003-control-priorities, REQ-CTRL-phase-8-the-assistive-layer-md-004-assistive-evidence-and-operator-control-priorities, REQ-CTRL-phase-9-the-assurance-ledger-md-002-control-priorities, REQ-CTRL-staff-operations-and-support-blueprint-md-003-control-priorities, REQ-EDGE-ROUTE-INTENT-AND-SETTLEMENT, REQ-INV-025, REQ-INV-035, REQ-INV-036, REQ-INV-044, REQ-INV-045, REQ-INV-062, REQ-OBJ-routeintentbinding

## MUTATION_COMMAND_ACTION_RECORD - CommandActionRecord is the canonical mutation envelope

- Classification: `underspecified_summary`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: phase-cards.md, phase-3-the-human-checkpoint.md
- Normalized wording: Every consequence-bearing post-submit mutation emits one durable `CommandActionRecord` tied to the active route-intent tuple and governing object version.
- Summary patch required: `yes`
- Future lint rule: `Fail route summaries that mention mutation without a durable action-envelope record.`
- Related requirement ids: GAP-FINDING-091, REQ-CTRL-phase-1-the-red-flag-gate-md-003-control-priorities, REQ-CTRL-phase-3-the-human-checkpoint-md-003-control-priorities, REQ-CTRL-staff-operations-and-support-blueprint-md-003-control-priorities, REQ-INV-025, REQ-OBJ-commandactionrecord

## MUTATION_COMMAND_SETTLEMENT_RECORD - CommandSettlementRecord is the authoritative outcome for visible mutation state

- Classification: `underspecified_summary`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: phase-cards.md, blueprint-init.md, forensic-audit-findings.md
- Normalized wording: UI calmness, success, stale recovery, and continuation posture must advance from authoritative `CommandSettlementRecord`, not optimistic UI or delivery-only signals.
- Summary patch required: `yes`
- Future lint rule: `Reject summary or UI contracts that collapse local acknowledgement into final authoritative outcome.`
- Related requirement ids: GAP-FINDING-091, GAP-FINDING-097, GAP-FINDING-099, GAP-FINDING-100, GAP-FINDING-101, GAP-FINDING-107, GAP-FINDING-110, GAP-FINDING-112, GAP-FINDING-116, GAP-FINDING-119, REQ-CTRL-governance-admin-console-frontend-blueprint-md-004-release-guardrail-priorities, REQ-CTRL-governance-admin-console-frontend-blueprint-md-005-release-guardrail-priorities, REQ-CTRL-phase-1-the-red-flag-gate-md-003-control-priorities, REQ-CTRL-phase-1-the-red-flag-gate-md-005-control-priorities, REQ-CTRL-phase-3-the-human-checkpoint-md-003-control-priorities, REQ-CTRL-phase-3-the-human-checkpoint-md-005-control-priorities, REQ-CTRL-phase-4-the-booking-engine-md-004-booking-surface-control-priorities, REQ-CTRL-phase-8-the-assistive-layer-md-004-assistive-evidence-and-operator-control-priorities, REQ-CTRL-phase-9-the-assurance-ledger-md-002-control-priorities, REQ-CTRL-phase-9-the-assurance-ledger-md-004-control-priorities, REQ-CTRL-self-care-content-and-admin-resolution-blueprint-md-002-cross-layer-control-priorities, REQ-CTRL-staff-operations-and-support-blueprint-md-002-control-priorities, REQ-CTRL-staff-operations-and-support-blueprint-md-003-control-priorities, REQ-CTRL-staff-operations-and-support-blueprint-md-005-control-priorities, REQ-CTRL-staff-workspace-interface-architecture-md-005-additional-control-priorities, REQ-EDGE-ACCEPTED-RETRY-RETURNS-PRIOR-RESULT, REQ-EDGE-IDENTITY-REPAIR-CASE, REQ-EDGE-ROUTE-INTENT-AND-SETTLEMENT, REQ-INV-008, REQ-INV-037, REQ-INV-042, REQ-INV-043, REQ-INV-050, REQ-INV-051, REQ-INV-052, REQ-INV-053, REQ-INV-062, REQ-OBJ-adminresolutionsettlement, REQ-OBJ-advicerendersettlement, REQ-OBJ-commandsettlementrecord, REQ-OBJ-conversationcommandsettlement, REQ-OBJ-identityrepairreleasesettlement, REQ-OBJ-resilienceactionsettlement, REQ-OBJ-sessionterminationsettlement, REQ-OBJ-supportreplayrestoresettlement, REQ-OBJ-taskcompletionsettlementenvelope, REQ-OBJ-urgentdiversionsettlement, REQ-TEST-phase-3-the-human-checkpoint-md-005, REQ-TEST-phase-3-the-human-checkpoint-md-015, REQ-TEST-phase-3-the-human-checkpoint-md-020, REQ-TEST-phase-3-the-human-checkpoint-md-021, REQ-TEST-phase-3-the-human-checkpoint-md-023, REQ-TEST-phase-3-the-human-checkpoint-md-078, REQ-TEST-phase-3-the-human-checkpoint-md-115, REQ-TEST-phase-3-the-human-checkpoint-md-117, REQ-TEST-phase-4-the-booking-engine-md-123, REQ-TEST-phase-5-the-network-horizon-md-058, REQ-TEST-phase-5-the-network-horizon-md-064, REQ-TEST-phase-5-the-network-horizon-md-083, REQ-TEST-phase-5-the-network-horizon-md-110, REQ-TEST-phase-8-the-assistive-layer-md-010, REQ-TEST-phase-8-the-assistive-layer-md-056, REQ-TEST-phase-8-the-assistive-layer-md-075, REQ-TEST-phase-9-the-assurance-ledger-md-020, REQ-TEST-phase-9-the-assurance-ledger-md-044, REQ-TEST-phase-9-the-assurance-ledger-md-068, REQ-TEST-phase-9-the-assurance-ledger-md-103, REQ-TEST-phase-9-the-assurance-ledger-md-140, REQ-TEST-phase-9-the-assurance-ledger-md-142

## TRUTH_RESERVATION_TRUTH - reservation truth comes from CapacityReservation and ReservationTruthProjection

- Classification: `terminology_drift`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: phase-cards.md, blueprint-init.md
- Normalized wording: Visible booking exclusivity and hold truth come from `ReservationAuthority`, `CapacityReservation`, and `ReservationTruthProjection`, not countdown copy or supplier hints.
- Summary patch required: `yes`
- Future lint rule: `Reject booking summaries that imply exclusivity without reservation-truth contracts.`
- Related requirement ids: GAP-FINDING-030, REQ-INV-015, REQ-OBJ-capacityreservation, REQ-OBJ-reservationtruthprojection

## TRUTH_EXTERNAL_CONFIRMATION_GATE - ExternalConfirmationGate governs ambiguous booking and dispatch truth

- Classification: `terminology_drift`
- Canonical winner: `phase-0-the-foundation-protocol.md`
- Losing sources: phase-cards.md, phase-4-the-booking-engine.md, phase-6-the-pharmacy-loop.md
- Normalized wording: Use `ExternalConfirmationGate` and case-local truth projections for ambiguous external booking or dispatch states; never imply final booked or referred calmness before the gate clears.
- Summary patch required: `yes`
- Future lint rule: `Reject summary language that implies authoritative external success before confirmation-gate resolution.`
- Related requirement ids: GAP-FINDING-031, GAP-FINDING-072, GAP-FINDING-074, REQ-INV-016, REQ-OBJ-externalconfirmationgate

## TRUTH_DISPATCH_PROOF - pharmacy calmness depends on dispatch proof, not transport acceptance alone

- Classification: `terminology_drift`
- Canonical winner: `phase-6-the-pharmacy-loop.md`
- Losing sources: blueprint-init.md, vecells-complete-end-to-end-flow.md
- Normalized wording: Separate transport acceptance, provider acceptance, and authoritative dispatch proof, and keep patient or staff calmness pending until dispatch proof and any confirmation gate satisfy the transport class.
- Summary patch required: `yes`
- Future lint rule: `Fail pharmacy summary text that equates send acceptance with final referral truth.`
- Related requirement ids: none

## TRUTH_REOPEN_AND_BOUNCE_BACK - bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth

- Classification: `terminology_drift`
- Canonical winner: `vecells-complete-end-to-end-flow.md`
- Losing sources: blueprint-init.md, phase-6-the-pharmacy-loop.md
- Normalized wording: When accepted progress degrades, reopen or bounce back inside the same lineage using explicit fallback, exception, or recovery cases rather than detached secondary workflows.
- Summary patch required: `yes`
- Future lint rule: `not required`
- Related requirement ids: GAP-FINDING-019, GAP-FINDING-039, GAP-FINDING-075, GAP-FINDING-077, GAP-FINDING-082, REQ-CTRL-phase-6-the-pharmacy-loop-md-001-pharmacy-loop-control-priorities, REQ-CTRL-phase-6-the-pharmacy-loop-md-001-what-phase-6-must-prove-before-phase-7-starts, REQ-CTRL-phase-6-the-pharmacy-loop-md-006-what-phase-6-must-prove-before-phase-7-starts, REQ-CTRL-self-care-content-and-admin-resolution-blueprint-md-004-cross-layer-control-priorities, REQ-EDGE-FALLBACK-AFTER-ACCEPTED-PROGRESS, REQ-INV-026, REQ-INV-027, REQ-INV-045, REQ-INV-046, REQ-INV-050, REQ-INV-053, REQ-INV-060, REQ-OBJ-fallbackreviewcase, REQ-TEST-phase-3-the-human-checkpoint-md-012, REQ-TEST-phase-3-the-human-checkpoint-md-014, REQ-TEST-phase-3-the-human-checkpoint-md-058, REQ-TEST-phase-3-the-human-checkpoint-md-065, REQ-TEST-phase-3-the-human-checkpoint-md-069, REQ-TEST-phase-3-the-human-checkpoint-md-100, REQ-TEST-phase-3-the-human-checkpoint-md-101, REQ-TEST-phase-3-the-human-checkpoint-md-102, REQ-TEST-phase-3-the-human-checkpoint-md-112, REQ-TEST-phase-5-the-network-horizon-md-090, REQ-TEST-phase-5-the-network-horizon-md-122, REQ-TEST-phase-6-the-pharmacy-loop-md-005, REQ-TEST-phase-6-the-pharmacy-loop-md-006, REQ-TEST-phase-6-the-pharmacy-loop-md-086, REQ-TEST-phase-6-the-pharmacy-loop-md-088, REQ-TEST-phase-6-the-pharmacy-loop-md-091, REQ-TEST-phase-6-the-pharmacy-loop-md-093, REQ-TEST-phase-6-the-pharmacy-loop-md-094, REQ-TEST-phase-6-the-pharmacy-loop-md-102, REQ-TEST-phase-6-the-pharmacy-loop-md-108, REQ-TEST-phase-6-the-pharmacy-loop-md-111, REQ-TEST-phase-7-inside-the-nhs-app-md-026, REQ-TEST-phase-7-inside-the-nhs-app-md-035, REQ-TEST-phase-7-inside-the-nhs-app-md-036, REQ-TEST-phase-7-inside-the-nhs-app-md-050, REQ-TEST-phase-9-the-assurance-ledger-md-125

## TRUTH_CHILD_DOMAIN_STATE_WRITES - child domains emit milestones and evidence; they do not write canonical Request state directly

- Classification: `canonical_conflict`
- Canonical winner: `forensic-audit-findings.md`
- Losing sources: phase-3-the-human-checkpoint.md, phase-4-the-booking-engine.md, phase-5-the-network-horizon.md, phase-6-the-pharmacy-loop.md
- Normalized wording: Normalize triage, booking, hub, and pharmacy outputs to case-local milestones, gates, and leases that `LifecycleCoordinator` consumes to derive canonical request state.
- Summary patch required: `yes`
- Future lint rule: `Reject summary text or contracts that let a child domain claim final canonical request milestone ownership.`
- Related requirement ids: GAP-FINDING-074, GAP-FINDING-075, GAP-FINDING-076, GAP-FINDING-077

## RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT - RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple

- Classification: `terminology_drift`
- Canonical winner: `platform-runtime-and-release-blueprint.md`
- Losing sources: phase-cards.md, blueprint-init.md
- Normalized wording: Treat runtime publication, parity, route contracts, design contracts, and surface bindings as one exact published tuple before calm or writable posture remains live.
- Summary patch required: `yes`
- Future lint rule: `Fail any summary or publication contract that treats token export or route manifests as separable from the live runtime tuple.`
- Related requirement ids: GAP-FINDING-118, REQ-CTRL-governance-admin-console-frontend-blueprint-md-002-release-guardrail-priorities, REQ-CTRL-phase-1-the-red-flag-gate-md-001-control-priorities, REQ-CTRL-phase-3-the-human-checkpoint-md-001-control-priorities, REQ-CTRL-phase-4-the-booking-engine-md-001-booking-surface-control-priorities, REQ-CTRL-phase-9-the-assurance-ledger-md-001-control-priorities, REQ-CTRL-self-care-content-and-admin-resolution-blueprint-md-003-cross-layer-control-priorities, REQ-CTRL-staff-operations-and-support-blueprint-md-001-control-priorities, REQ-INV-044, REQ-INV-059, REQ-INV-060, REQ-INV-061, REQ-INV-062, REQ-OBJ-audiencesurfaceruntimebinding, REQ-OBJ-designcontractpublicationbundle, REQ-OBJ-runtimepublicationbundle

## ASSURANCE_CONTINUITY_EVIDENCE - continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence

- Classification: `terminology_drift`
- Canonical winner: `phase-9-the-assurance-ledger.md`
- Losing sources: phase-cards.md, forensic-audit-findings.md, vecells-complete-end-to-end-flow.md
- Normalized wording: Treat patient-home actionability, thread settlement, booking manage, support replay, assistive session, workspace completion, and pharmacy-console settlement as evidence-producing continuity controls with shared ops and governance consumption.
- Summary patch required: `yes`
- Future lint rule: `Reject summaries that describe calm continuity behavior without naming the continuity evidence tuple that proves it.`
- Related requirement ids: GAP-FINDING-102, GAP-FINDING-103, GAP-FINDING-104, GAP-FINDING-105, GAP-FINDING-108, GAP-FINDING-110, GAP-FINDING-111, REQ-TEST-phase-7-inside-the-nhs-app-md-006

