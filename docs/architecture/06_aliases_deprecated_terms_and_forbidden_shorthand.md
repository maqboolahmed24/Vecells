# 06 Aliases, Deprecated Terms, And Forbidden Shorthand

The alias map prevents terminology drift from collapsing orthogonal objects, state axes, or runtime contracts into vague prose.

## Alias Classes

| Resolution class | Count |
| --- | --- |
| ambiguous_phrase_requiring_context | 59 |
| deprecated_shorthand | 11 |
| exact_alias_to_canonical_object | 1 |
| not_an_object_phrase | 19 |

## Alias Registry

| Alias | Status | Resolution | Preferred term | Related objects |
| --- | --- | --- | --- | --- |
| SubmissionEnvelope.state owns draft and pre-promotion lifecycle | preferred | ambiguous_phrase_requiring_context | SubmissionEnvelope.state owns draft and pre-promotion lifecycle | SubmissionEnvelope |
| draft request | allowed | ambiguous_phrase_requiring_context | SubmissionEnvelope.state owns draft and pre-promotion lifecycle | SubmissionEnvelope |
| request draft state | allowed | ambiguous_phrase_requiring_context | SubmissionEnvelope.state owns draft and pre-promotion lifecycle | SubmissionEnvelope |
| Request(workflowState = draft) | deprecated | deprecated_shorthand | SubmissionEnvelope.state owns draft and pre-promotion lifecycle | SubmissionEnvelope |
| Request.workflowState is milestone-only | preferred | ambiguous_phrase_requiring_context | Request.workflowState is milestone-only | Request |
| workflow status | allowed | ambiguous_phrase_requiring_context | Request.workflowState is milestone-only | Request |
| reconciliation_required | allowed | ambiguous_phrase_requiring_context | Request.workflowState is milestone-only | Request |
| identity_hold | allowed | ambiguous_phrase_requiring_context | Request.workflowState is milestone-only | Request |
| reconciliation_required | forbidden | deprecated_shorthand | Request.workflowState is milestone-only | Request |
| identity_hold | forbidden | deprecated_shorthand | Request.workflowState is milestone-only | Request |
| Request.safetyState is a persisted orthogonal axis | preferred | ambiguous_phrase_requiring_context | Request.safetyState is a persisted orthogonal axis | SafetyDecisionRecord |
| urgent or not urgent | allowed | ambiguous_phrase_requiring_context | Request.safetyState is a persisted orthogonal axis | SafetyDecisionRecord |
| binary urgent state | allowed | ambiguous_phrase_requiring_context | Request.safetyState is a persisted orthogonal axis | SafetyDecisionRecord |
| identityState plus nullable patientRef derived from IdentityBinding | preferred | ambiguous_phrase_requiring_context | identityState plus nullable patientRef derived from IdentityBinding | IdentityBinding |
| ownershipState | allowed | ambiguous_phrase_requiring_context | identityState plus nullable patientRef derived from IdentityBinding | IdentityBinding |
| ownershipState | deprecated | deprecated_shorthand | identityState plus nullable patientRef derived from IdentityBinding | IdentityBinding |
| blockers remain orthogonal to workflow milestones | preferred | ambiguous_phrase_requiring_context | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| workflow holds | allowed | ambiguous_phrase_requiring_context | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| reconciliation workflow state | allowed | ambiguous_phrase_requiring_context | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| identity_hold | forbidden | deprecated_shorthand | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| reconciliation_required | forbidden | deprecated_shorthand | blockers remain orthogonal to workflow milestones | RequestClosureRecord |
| SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | preferred | ambiguous_phrase_requiring_context | SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | SubmissionEnvelope |
| single request shell | allowed | ambiguous_phrase_requiring_context | SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | SubmissionEnvelope |
| same request lineage shell | allowed | ambiguous_phrase_requiring_context | SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership | SubmissionEnvelope |
| LifecycleCoordinator alone derives canonical Request milestone change and closure | preferred | ambiguous_phrase_requiring_context | LifecycleCoordinator alone derives canonical Request milestone change and closure | LifecycleCoordinator |
| coordinator-owned closure | allowed | ambiguous_phrase_requiring_context | LifecycleCoordinator alone derives canonical Request milestone change and closure | LifecycleCoordinator |
| VisibilityProjectionPolicy owns materialization and calmness eligibility | preferred | not_an_object_phrase | VisibilityProjectionPolicy owns materialization and calmness eligibility |  |
| visibility policy ownership | allowed | not_an_object_phrase | VisibilityProjectionPolicy owns materialization and calmness eligibility |  |
| ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency | preferred | ambiguous_phrase_requiring_context | ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency | PersistentShell |
| route-prefix shell ownership | allowed | ambiguous_phrase_requiring_context | ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency | PersistentShell |
| layout resemblance shell ownership | allowed | ambiguous_phrase_requiring_context | ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency | PersistentShell |
| same object, same shell | preferred | ambiguous_phrase_requiring_context | same object, same shell | PersistentShell |
| same request shell | allowed | ambiguous_phrase_requiring_context | same object, same shell | PersistentShell |
| same-shell recovery | allowed | ambiguous_phrase_requiring_context | same object, same shell | PersistentShell |
| channel profiles constrain shell posture without redefining the shell family | preferred | not_an_object_phrase | channel profiles constrain shell posture without redefining the shell family |  |
| NHS App hard gate | allowed | not_an_object_phrase | channel profiles constrain shell posture without redefining the shell family |  |
| embedded shell as separate app | allowed | not_an_object_phrase | channel profiles constrain shell posture without redefining the shell family |  |
| RouteIntentBinding is the canonical post-submit mutation fence | preferred | ambiguous_phrase_requiring_context | RouteIntentBinding is the canonical post-submit mutation fence | RouteIntentBinding |
| route-local actionability | allowed | ambiguous_phrase_requiring_context | RouteIntentBinding is the canonical post-submit mutation fence | RouteIntentBinding |
| generic continuation link | allowed | ambiguous_phrase_requiring_context | RouteIntentBinding is the canonical post-submit mutation fence | RouteIntentBinding |
| CommandActionRecord is the canonical mutation envelope | preferred | ambiguous_phrase_requiring_context | CommandActionRecord is the canonical mutation envelope | CommandActionRecord |
| local action receipt | allowed | ambiguous_phrase_requiring_context | CommandActionRecord is the canonical mutation envelope | CommandActionRecord |
| CommandSettlementRecord is the authoritative outcome for visible mutation state | preferred | ambiguous_phrase_requiring_context | CommandSettlementRecord is the authoritative outcome for visible mutation state | CommandSettlementRecord |
| local acknowledgement | allowed | ambiguous_phrase_requiring_context | CommandSettlementRecord is the authoritative outcome for visible mutation state | CommandSettlementRecord |
| success toast | allowed | ambiguous_phrase_requiring_context | CommandSettlementRecord is the authoritative outcome for visible mutation state | CommandSettlementRecord |
| delivery-only reassurance | allowed | ambiguous_phrase_requiring_context | CommandSettlementRecord is the authoritative outcome for visible mutation state | CommandSettlementRecord |
| generic success toast | deprecated | deprecated_shorthand | CommandSettlementRecord is the authoritative outcome for visible mutation state | CommandSettlementRecord |
| same-shell recovery uses typed recovery and continuation envelopes | preferred | not_an_object_phrase | same-shell recovery uses typed recovery and continuation envelopes |  |
| expired link handling | allowed | not_an_object_phrase | same-shell recovery uses typed recovery and continuation envelopes |  |
| browser return | allowed | not_an_object_phrase | same-shell recovery uses typed recovery and continuation envelopes |  |
| reservation truth comes from CapacityReservation and ReservationTruthProjection | preferred | not_an_object_phrase | reservation truth comes from CapacityReservation and ReservationTruthProjection |  |
| countdown copy as hold | allowed | not_an_object_phrase | reservation truth comes from CapacityReservation and ReservationTruthProjection |  |
| offer implies exclusivity | allowed | not_an_object_phrase | reservation truth comes from CapacityReservation and ReservationTruthProjection |  |
| ExternalConfirmationGate governs ambiguous booking and dispatch truth | preferred | ambiguous_phrase_requiring_context | ExternalConfirmationGate governs ambiguous booking and dispatch truth | ExternalConfirmationGate |
| premature booked state | allowed | ambiguous_phrase_requiring_context | ExternalConfirmationGate governs ambiguous booking and dispatch truth | ExternalConfirmationGate |
| generic reconciliation_required | allowed | ambiguous_phrase_requiring_context | ExternalConfirmationGate governs ambiguous booking and dispatch truth | ExternalConfirmationGate |
| pharmacy calmness depends on dispatch proof, not transport acceptance alone | preferred | not_an_object_phrase | pharmacy calmness depends on dispatch proof, not transport acceptance alone |  |
| mailbox delivered equals referred | allowed | not_an_object_phrase | pharmacy calmness depends on dispatch proof, not transport acceptance alone |  |
| accepted for processing equals resolved | allowed | not_an_object_phrase | pharmacy calmness depends on dispatch proof, not transport acceptance alone |  |
| bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth | preferred | not_an_object_phrase | bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth |  |
| generic bounce-back | allowed | not_an_object_phrase | bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth |  |
| detached reopen workflow | allowed | not_an_object_phrase | bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth |  |
| child domains emit milestones and evidence; they do not write canonical Request state directly | preferred | ambiguous_phrase_requiring_context | child domains emit milestones and evidence; they do not write canonical Request state directly | BookingCase |
| domain-local request close | allowed | ambiguous_phrase_requiring_context | child domains emit milestones and evidence; they do not write canonical Request state directly | BookingCase |
| child workflow owns canonical milestone | allowed | ambiguous_phrase_requiring_context | child domains emit milestones and evidence; they do not write canonical Request state directly | BookingCase |
| ReleaseApprovalFreeze binds the promotable approval tuple | preferred | ambiguous_phrase_requiring_context | ReleaseApprovalFreeze binds the promotable approval tuple | ReleaseApprovalFreeze |
| bundle hash only release gate | allowed | ambiguous_phrase_requiring_context | ReleaseApprovalFreeze binds the promotable approval tuple | ReleaseApprovalFreeze |
| ChannelReleaseFreezeRecord fences mutable channel posture | preferred | ambiguous_phrase_requiring_context | ChannelReleaseFreezeRecord fences mutable channel posture | ChannelReleaseFreezeRecord |
| manifest-only channel guard | allowed | ambiguous_phrase_requiring_context | ChannelReleaseFreezeRecord fences mutable channel posture | ChannelReleaseFreezeRecord |
| AssuranceSliceTrustRecord governs degraded or quarantined operational truth | preferred | ambiguous_phrase_requiring_context | AssuranceSliceTrustRecord governs degraded or quarantined operational truth | AssuranceSliceTrustRecord |
| green dashboard despite degraded trust | allowed | ambiguous_phrase_requiring_context | AssuranceSliceTrustRecord governs degraded or quarantined operational truth | AssuranceSliceTrustRecord |
| RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple | preferred | ambiguous_phrase_requiring_context | RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple | RuntimePublicationBundle |
| token export as sidecar | allowed | ambiguous_phrase_requiring_context | RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple | RuntimePublicationBundle |
| route-local manifest convention | allowed | ambiguous_phrase_requiring_context | RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple | RuntimePublicationBundle |
| AssuranceEvidenceGraphSnapshot plus AssuranceGraphCompletenessVerdict are authoritative assurance proof | preferred | ambiguous_phrase_requiring_context | AssuranceEvidenceGraphSnapshot plus AssuranceGraphCompletenessVerdict are authoritative assurance proof | AssuranceEvidenceGraphSnapshot |
| parallel local evidence lists | allowed | ambiguous_phrase_requiring_context | AssuranceEvidenceGraphSnapshot plus AssuranceGraphCompletenessVerdict are authoritative assurance proof | AssuranceEvidenceGraphSnapshot |
| continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence | preferred | ambiguous_phrase_requiring_context | continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence | ExperienceContinuityControlEvidence |
| continuity as narrative only | allowed | ambiguous_phrase_requiring_context | continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence | ExperienceContinuityControlEvidence |
| OperationalReadinessSnapshot and recovery-control tuples govern restore and failover authority | preferred | ambiguous_phrase_requiring_context | OperationalReadinessSnapshot and recovery-control tuples govern restore and failover authority | OperationalReadinessSnapshot |
| runbooks and dashboards only | allowed | ambiguous_phrase_requiring_context | OperationalReadinessSnapshot and recovery-control tuples govern restore and failover authority | OperationalReadinessSnapshot |
| CrossPhaseConformanceScorecard defines machine-auditable programme alignment | preferred | not_an_object_phrase | CrossPhaseConformanceScorecard defines machine-auditable programme alignment |  |
| summary-only done definition | allowed | not_an_object_phrase | CrossPhaseConformanceScorecard defines machine-auditable programme alignment |  |
| NHS App embedded delivery is deferred baseline scope, not a current hard gate | preferred | ambiguous_phrase_requiring_context | NHS App embedded delivery is deferred baseline scope, not a current hard gate | PatientEmbeddedSessionProjection |
| NHS App hard gate | allowed | ambiguous_phrase_requiring_context | NHS App embedded delivery is deferred baseline scope, not a current hard gate | PatientEmbeddedSessionProjection |
| current hard-gate delivery | allowed | ambiguous_phrase_requiring_context | NHS App embedded delivery is deferred baseline scope, not a current hard gate | PatientEmbeddedSessionProjection |
| ownershipState | deprecated | deprecated_shorthand | identityState | IdentityBinding |
| identity_hold | forbidden | deprecated_shorthand | IdentityRepairCase + closure blocker metadata | RequestClosureRecord |
| reconciliation_required | forbidden | deprecated_shorthand | case-local gate or confirmation pending term, never canonical Request.workflowState | Request |
| Request(workflowState = draft) | forbidden | deprecated_shorthand | SubmissionEnvelope.state = draft | SubmissionEnvelope |
| generic success toast | deprecated | exact_alias_to_canonical_object | CommandSettlementRecord | CommandSettlementRecord |
