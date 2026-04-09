# Summary reconciliation matrix

The reconciliation matrix compares 29 summary-layer concepts across 15 required sources, using task 001's registry as the canonical term and requirement backbone.

## Classification counts

| Classification | Count |
| --- | --- |
| `canonical_conflict` | 5 |
| `exact_match` | 10 |
| `terminology_drift` | 8 |
| `underspecified_summary` | 6 |

## Concept matrix

| Concept | Dimension | Classification | Canonical winner | Summary patch | Lint |
| --- | --- | --- | --- | --- | --- |
| `STATE_SUBMISSION_ENVELOPE` SubmissionEnvelope.state owns draft and pre-promotion lifecycle | `state_vocabulary` | `underspecified_summary` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `STATE_WORKFLOW_MILESTONES` Request.workflowState is milestone-only | `state_vocabulary` | `canonical_conflict` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `STATE_SAFETY_AXIS` Request.safetyState is a persisted orthogonal axis | `state_vocabulary` | `underspecified_summary` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `STATE_IDENTITY_AXIS_PATIENTREF` identityState plus nullable patientRef derived from IdentityBinding | `state_vocabulary` | `canonical_conflict` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `STATE_BLOCKER_ORTHOGONALITY` blockers remain orthogonal to workflow milestones | `state_vocabulary` | `canonical_conflict` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `OWNERSHIP_REQUEST_SUBMISSION_CHILD_CASE` SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | `object_ownership` | `exact_match` | `phase-0-the-foundation-protocol.md` | `no` | `no` |
| `OWNERSHIP_LIFECYCLE_COORDINATOR` LifecycleCoordinator alone derives canonical Request milestone change and closure | `object_ownership` | `canonical_conflict` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `OWNERSHIP_VISIBILITY_POLICY` VisibilityProjectionPolicy owns materialization and calmness eligibility | `object_ownership` | `underspecified_summary` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `UI_SHELL_FAMILY_OWNERSHIP` ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency | `ui_shell_semantics` | `terminology_drift` | `platform-frontend-blueprint.md` | `yes` | `yes` |
| `UI_SAME_OBJECT_SAME_SHELL` same object, same shell | `ui_shell_semantics` | `exact_match` | `platform-frontend-blueprint.md` | `no` | `no` |
| `UI_CHANNEL_PROFILE_CONSTRAINTS` channel profiles constrain shell posture without redefining the shell family | `ui_shell_semantics` | `terminology_drift` | `platform-frontend-blueprint.md` | `yes` | `yes` |
| `MUTATION_ROUTE_INTENT_BINDING` RouteIntentBinding is the canonical post-submit mutation fence | `patient_continuity_and_mutation_controls` | `underspecified_summary` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `MUTATION_COMMAND_ACTION_RECORD` CommandActionRecord is the canonical mutation envelope | `patient_continuity_and_mutation_controls` | `underspecified_summary` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `MUTATION_COMMAND_SETTLEMENT_RECORD` CommandSettlementRecord is the authoritative outcome for visible mutation state | `patient_continuity_and_mutation_controls` | `underspecified_summary` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `MUTATION_RECOVERY_ENVELOPES` same-shell recovery uses typed recovery and continuation envelopes | `patient_continuity_and_mutation_controls` | `exact_match` | `patient-account-and-communications-blueprint.md` | `no` | `no` |
| `TRUTH_RESERVATION_TRUTH` reservation truth comes from CapacityReservation and ReservationTruthProjection | `booking_hub_pharmacy_truth_semantics` | `terminology_drift` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `TRUTH_EXTERNAL_CONFIRMATION_GATE` ExternalConfirmationGate governs ambiguous booking and dispatch truth | `booking_hub_pharmacy_truth_semantics` | `terminology_drift` | `phase-0-the-foundation-protocol.md` | `yes` | `yes` |
| `TRUTH_DISPATCH_PROOF` pharmacy calmness depends on dispatch proof, not transport acceptance alone | `booking_hub_pharmacy_truth_semantics` | `terminology_drift` | `phase-6-the-pharmacy-loop.md` | `yes` | `yes` |
| `TRUTH_REOPEN_AND_BOUNCE_BACK` bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth | `booking_hub_pharmacy_truth_semantics` | `terminology_drift` | `vecells-complete-end-to-end-flow.md` | `yes` | `no` |
| `TRUTH_CHILD_DOMAIN_STATE_WRITES` child domains emit milestones and evidence; they do not write canonical Request state directly | `booking_hub_pharmacy_truth_semantics` | `canonical_conflict` | `forensic-audit-findings.md` | `yes` | `yes` |
| `RUNTIME_RELEASE_APPROVAL_FREEZE` ReleaseApprovalFreeze binds the promotable approval tuple | `runtime_release` | `exact_match` | `platform-runtime-and-release-blueprint.md` | `no` | `no` |
| `RUNTIME_CHANNEL_RELEASE_FREEZE` ChannelReleaseFreezeRecord fences mutable channel posture | `runtime_release` | `exact_match` | `phase-0-the-foundation-protocol.md` | `no` | `no` |
| `RUNTIME_ASSURANCE_SLICE_TRUST` AssuranceSliceTrustRecord governs degraded or quarantined operational truth | `runtime_release` | `exact_match` | `phase-9-the-assurance-ledger.md` | `no` | `no` |
| `RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT` RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple | `runtime_release` | `terminology_drift` | `platform-runtime-and-release-blueprint.md` | `yes` | `yes` |
| `ASSURANCE_EVIDENCE_GRAPH` AssuranceEvidenceGraphSnapshot plus AssuranceGraphCompletenessVerdict are authoritative assurance proof | `assurance_semantics` | `exact_match` | `phase-9-the-assurance-ledger.md` | `no` | `no` |
| `ASSURANCE_CONTINUITY_EVIDENCE` continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence | `assurance_semantics` | `terminology_drift` | `phase-9-the-assurance-ledger.md` | `yes` | `yes` |
| `ASSURANCE_OPERATIONAL_READINESS` OperationalReadinessSnapshot and recovery-control tuples govern restore and failover authority | `assurance_semantics` | `exact_match` | `phase-9-the-assurance-ledger.md` | `no` | `no` |
| `PROGRAMME_CONFORMANCE_SCORECARD` CrossPhaseConformanceScorecard defines machine-auditable programme alignment | `assurance_semantics` | `exact_match` | `phase-cards.md` | `no` | `no` |
| `SCOPE_DEFERRED_NHS_APP` NHS App embedded delivery is deferred baseline scope, not a current hard gate | `programme_scope` | `exact_match` | `phase-cards.md` | `no` | `yes` |

## Dimension notes

### assurance_semantics

- `ASSURANCE_EVIDENCE_GRAPH`: Assurance, retention, replay, recovery, and standards proof must converge through one deterministic evidence graph and completeness verdict.
- `ASSURANCE_CONTINUITY_EVIDENCE`: Treat patient-home actionability, thread settlement, booking manage, support replay, assistive session, workspace completion, and pharmacy-console settlement as evidence-producing continuity controls with shared ops and governance consumption.
- `ASSURANCE_OPERATIONAL_READINESS`: Restore, failover, and resilience posture must be justified through `OperationalReadinessSnapshot`, bound runbook records, and authoritative recovery settlements rather than loose runbooks or dashboards.
- `PROGRAMME_CONFORMANCE_SCORECARD`: Programme planning, runtime proof, governance proof, ops proof, and Phase 9 exit criteria reconcile through one `CrossPhaseConformanceScorecard` over machine-auditable rows.

### booking_hub_pharmacy_truth_semantics

- `TRUTH_RESERVATION_TRUTH`: Visible booking exclusivity and hold truth come from `ReservationAuthority`, `CapacityReservation`, and `ReservationTruthProjection`, not countdown copy or supplier hints.
- `TRUTH_EXTERNAL_CONFIRMATION_GATE`: Use `ExternalConfirmationGate` and case-local truth projections for ambiguous external booking or dispatch states; never imply final booked or referred calmness before the gate clears.
- `TRUTH_DISPATCH_PROOF`: Separate transport acceptance, provider acceptance, and authoritative dispatch proof, and keep patient or staff calmness pending until dispatch proof and any confirmation gate satisfy the transport class.
- `TRUTH_REOPEN_AND_BOUNCE_BACK`: When accepted progress degrades, reopen or bounce back inside the same lineage using explicit fallback, exception, or recovery cases rather than detached secondary workflows.
- `TRUTH_CHILD_DOMAIN_STATE_WRITES`: Normalize triage, booking, hub, and pharmacy outputs to case-local milestones, gates, and leases that `LifecycleCoordinator` consumes to derive canonical request state.

### object_ownership

- `OWNERSHIP_REQUEST_SUBMISSION_CHILD_CASE`: Keep pre-submit capture on `SubmissionEnvelope`, canonical submitted work on `Request`, continuity on `RequestLineage`, and phase-local work on child cases linked through `LineageCaseLink`.
- `OWNERSHIP_LIFECYCLE_COORDINATOR`: Triage, booking, hub, pharmacy, support, and assistive domains emit facts, milestones, blockers, and evidence; only `LifecycleCoordinator` derives canonical request milestone change and closure.
- `OWNERSHIP_VISIBILITY_POLICY`: Visibility, masking, and section posture must resolve through `VisibilityProjectionPolicy` and related contracts before projection materialization or calm trust cues render.

### patient_continuity_and_mutation_controls

- `MUTATION_ROUTE_INTENT_BINDING`: Every post-submit mutation binds one live `RouteIntentBinding` over route family, session, subject binding, fence epoch, and publication posture.
- `MUTATION_COMMAND_ACTION_RECORD`: Every consequence-bearing post-submit mutation emits one durable `CommandActionRecord` tied to the active route-intent tuple and governing object version.
- `MUTATION_COMMAND_SETTLEMENT_RECORD`: UI calmness, success, stale recovery, and continuation posture must advance from authoritative `CommandSettlementRecord`, not optimistic UI or delivery-only signals.
- `MUTATION_RECOVERY_ENVELOPES`: Recover stale, expired, denied-scope, blocked-policy, and replay-return paths inside the same shell through typed continuation and return contracts.

### programme_scope

- `SCOPE_DEFERRED_NHS_APP`: Treat Phase 7 as deferred channel expansion while keeping its guardrail contracts visible in the summary layer.

### runtime_release

- `RUNTIME_RELEASE_APPROVAL_FREEZE`: Freeze runtime, schema, config, compatibility, and bridge posture through one `ReleaseApprovalFreeze` tuple before writable exposure or promotion.
- `RUNTIME_CHANNEL_RELEASE_FREEZE`: Freeze embedded or channel-specific mutability through `ChannelReleaseFreezeRecord` in combination with `ReleaseApprovalFreeze` and route recovery disposition.
- `RUNTIME_ASSURANCE_SLICE_TRUST`: Use `AssuranceSliceTrustRecord` as the authoritative trust fence for runtime, operations, governance, and assistive write posture.
- `RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT`: Treat runtime publication, parity, route contracts, design contracts, and surface bindings as one exact published tuple before calm or writable posture remains live.

### state_vocabulary

- `STATE_SUBMISSION_ENVELOPE`: Use `SubmissionEnvelope.state = draft | evidence_pending | ready_to_promote | promoted | abandoned | expired`; do not model draft as `Request.workflowState`.
- `STATE_WORKFLOW_MILESTONES`: Normalize `Request.workflowState` to milestone-only values: `submitted`, `intake_normalized`, `triage_ready`, `triage_active`, `handoff_active`, `outcome_recorded`, `closed`.
- `STATE_SAFETY_AXIS`: Persist `Request.safetyState` independently of workflow milestones and keep `urgent_diversion_required` separate from `urgent_diverted`.
- `STATE_IDENTITY_AXIS_PATIENTREF`: Use `identityState = anonymous | partial_match | matched | claimed`; treat `patientRef` as nullable and derive it only from settled `IdentityBinding`.
- `STATE_BLOCKER_ORTHOGONALITY`: Represent duplicate review, identity repair, fallback recovery, reachability repair, and confirmation ambiguity in blocker or gate refs, never as workflow milestones.

### ui_shell_semantics

- `UI_SHELL_FAMILY_OWNERSHIP`: Shell residency is governed by `ShellFamilyOwnershipContract` and `RouteFamilyOwnershipClaim`, not route prefixes, feature names, or layout resemblance.
- `UI_SAME_OBJECT_SAME_SHELL`: If the continuity keys remain valid, adjacent child states morph inside the existing shell and preserve selected anchor, status strip, and bounded recovery posture.
- `UI_CHANNEL_PROFILE_CONSTRAINTS`: Embedded, constrained-browser, and browser handoff change channel posture and affordances, but not the owning shell family; NHS App remains a deferred channel-expansion phase rather than a present hard gate.

