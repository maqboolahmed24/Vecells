# Canonical term glossary

This glossary maps preferred terms, allowed aliases, deprecated legacy phrases, and forbidden phrasings used by the summary layer.

| Alias | Preferred term | Status | Concept |
| --- | --- | --- | --- |
| `SubmissionEnvelope.state owns draft and pre-promotion lifecycle` | `SubmissionEnvelope.state owns draft and pre-promotion lifecycle` | `preferred` | `STATE_SUBMISSION_ENVELOPE` |
| `draft request` | `SubmissionEnvelope.state owns draft and pre-promotion lifecycle` | `allowed` | `STATE_SUBMISSION_ENVELOPE` |
| `request draft state` | `SubmissionEnvelope.state owns draft and pre-promotion lifecycle` | `allowed` | `STATE_SUBMISSION_ENVELOPE` |
| `Request(workflowState = draft)` | `SubmissionEnvelope.state owns draft and pre-promotion lifecycle` | `deprecated` | `STATE_SUBMISSION_ENVELOPE` |
| `Request.workflowState is milestone-only` | `Request.workflowState is milestone-only` | `preferred` | `STATE_WORKFLOW_MILESTONES` |
| `workflow status` | `Request.workflowState is milestone-only` | `allowed` | `STATE_WORKFLOW_MILESTONES` |
| `reconciliation_required` | `Request.workflowState is milestone-only` | `allowed` | `STATE_WORKFLOW_MILESTONES` |
| `identity_hold` | `Request.workflowState is milestone-only` | `allowed` | `STATE_WORKFLOW_MILESTONES` |
| `reconciliation_required` | `Request.workflowState is milestone-only` | `forbidden` | `STATE_WORKFLOW_MILESTONES` |
| `identity_hold` | `Request.workflowState is milestone-only` | `forbidden` | `STATE_WORKFLOW_MILESTONES` |
| `Request.safetyState is a persisted orthogonal axis` | `Request.safetyState is a persisted orthogonal axis` | `preferred` | `STATE_SAFETY_AXIS` |
| `urgent or not urgent` | `Request.safetyState is a persisted orthogonal axis` | `allowed` | `STATE_SAFETY_AXIS` |
| `binary urgent state` | `Request.safetyState is a persisted orthogonal axis` | `allowed` | `STATE_SAFETY_AXIS` |
| `identityState plus nullable patientRef derived from IdentityBinding` | `identityState plus nullable patientRef derived from IdentityBinding` | `preferred` | `STATE_IDENTITY_AXIS_PATIENTREF` |
| `ownershipState` | `identityState plus nullable patientRef derived from IdentityBinding` | `allowed` | `STATE_IDENTITY_AXIS_PATIENTREF` |
| `ownershipState` | `identityState plus nullable patientRef derived from IdentityBinding` | `deprecated` | `STATE_IDENTITY_AXIS_PATIENTREF` |
| `blockers remain orthogonal to workflow milestones` | `blockers remain orthogonal to workflow milestones` | `preferred` | `STATE_BLOCKER_ORTHOGONALITY` |
| `workflow holds` | `blockers remain orthogonal to workflow milestones` | `allowed` | `STATE_BLOCKER_ORTHOGONALITY` |
| `reconciliation workflow state` | `blockers remain orthogonal to workflow milestones` | `allowed` | `STATE_BLOCKER_ORTHOGONALITY` |
| `identity_hold` | `blockers remain orthogonal to workflow milestones` | `forbidden` | `STATE_BLOCKER_ORTHOGONALITY` |
| `reconciliation_required` | `blockers remain orthogonal to workflow milestones` | `forbidden` | `STATE_BLOCKER_ORTHOGONALITY` |
| `SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership` | `SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership` | `preferred` | `OWNERSHIP_REQUEST_SUBMISSION_CHILD_CASE` |
| `single request shell` | `SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership` | `allowed` | `OWNERSHIP_REQUEST_SUBMISSION_CHILD_CASE` |
| `same request lineage shell` | `SubmissionEnvelope, Request, RequestLineage, and child cases have separate ownership` | `allowed` | `OWNERSHIP_REQUEST_SUBMISSION_CHILD_CASE` |
| `LifecycleCoordinator alone derives canonical Request milestone change and closure` | `LifecycleCoordinator alone derives canonical Request milestone change and closure` | `preferred` | `OWNERSHIP_LIFECYCLE_COORDINATOR` |
| `coordinator-owned closure` | `LifecycleCoordinator alone derives canonical Request milestone change and closure` | `allowed` | `OWNERSHIP_LIFECYCLE_COORDINATOR` |
| `VisibilityProjectionPolicy owns materialization and calmness eligibility` | `VisibilityProjectionPolicy owns materialization and calmness eligibility` | `preferred` | `OWNERSHIP_VISIBILITY_POLICY` |
| `visibility policy ownership` | `VisibilityProjectionPolicy owns materialization and calmness eligibility` | `allowed` | `OWNERSHIP_VISIBILITY_POLICY` |
| `ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency` | `ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency` | `preferred` | `UI_SHELL_FAMILY_OWNERSHIP` |
| `route-prefix shell ownership` | `ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency` | `allowed` | `UI_SHELL_FAMILY_OWNERSHIP` |
| `layout resemblance shell ownership` | `ShellFamilyOwnershipContract plus RouteFamilyOwnershipClaim govern shell residency` | `allowed` | `UI_SHELL_FAMILY_OWNERSHIP` |
| `same object, same shell` | `same object, same shell` | `preferred` | `UI_SAME_OBJECT_SAME_SHELL` |
| `same request shell` | `same object, same shell` | `allowed` | `UI_SAME_OBJECT_SAME_SHELL` |
| `same-shell recovery` | `same object, same shell` | `allowed` | `UI_SAME_OBJECT_SAME_SHELL` |
| `channel profiles constrain shell posture without redefining the shell family` | `channel profiles constrain shell posture without redefining the shell family` | `preferred` | `UI_CHANNEL_PROFILE_CONSTRAINTS` |
| `NHS App hard gate` | `channel profiles constrain shell posture without redefining the shell family` | `allowed` | `UI_CHANNEL_PROFILE_CONSTRAINTS` |
| `embedded shell as separate app` | `channel profiles constrain shell posture without redefining the shell family` | `allowed` | `UI_CHANNEL_PROFILE_CONSTRAINTS` |
| `RouteIntentBinding is the canonical post-submit mutation fence` | `RouteIntentBinding is the canonical post-submit mutation fence` | `preferred` | `MUTATION_ROUTE_INTENT_BINDING` |
| `route-local actionability` | `RouteIntentBinding is the canonical post-submit mutation fence` | `allowed` | `MUTATION_ROUTE_INTENT_BINDING` |
| `generic continuation link` | `RouteIntentBinding is the canonical post-submit mutation fence` | `allowed` | `MUTATION_ROUTE_INTENT_BINDING` |
| `CommandActionRecord is the canonical mutation envelope` | `CommandActionRecord is the canonical mutation envelope` | `preferred` | `MUTATION_COMMAND_ACTION_RECORD` |
| `local action receipt` | `CommandActionRecord is the canonical mutation envelope` | `allowed` | `MUTATION_COMMAND_ACTION_RECORD` |
| `CommandSettlementRecord is the authoritative outcome for visible mutation state` | `CommandSettlementRecord is the authoritative outcome for visible mutation state` | `preferred` | `MUTATION_COMMAND_SETTLEMENT_RECORD` |
| `local acknowledgement` | `CommandSettlementRecord is the authoritative outcome for visible mutation state` | `allowed` | `MUTATION_COMMAND_SETTLEMENT_RECORD` |
| `success toast` | `CommandSettlementRecord is the authoritative outcome for visible mutation state` | `allowed` | `MUTATION_COMMAND_SETTLEMENT_RECORD` |
| `delivery-only reassurance` | `CommandSettlementRecord is the authoritative outcome for visible mutation state` | `allowed` | `MUTATION_COMMAND_SETTLEMENT_RECORD` |
| `generic success toast` | `CommandSettlementRecord is the authoritative outcome for visible mutation state` | `deprecated` | `MUTATION_COMMAND_SETTLEMENT_RECORD` |
| `same-shell recovery uses typed recovery and continuation envelopes` | `same-shell recovery uses typed recovery and continuation envelopes` | `preferred` | `MUTATION_RECOVERY_ENVELOPES` |
| `expired link handling` | `same-shell recovery uses typed recovery and continuation envelopes` | `allowed` | `MUTATION_RECOVERY_ENVELOPES` |
| `browser return` | `same-shell recovery uses typed recovery and continuation envelopes` | `allowed` | `MUTATION_RECOVERY_ENVELOPES` |
| `reservation truth comes from CapacityReservation and ReservationTruthProjection` | `reservation truth comes from CapacityReservation and ReservationTruthProjection` | `preferred` | `TRUTH_RESERVATION_TRUTH` |
| `countdown copy as hold` | `reservation truth comes from CapacityReservation and ReservationTruthProjection` | `allowed` | `TRUTH_RESERVATION_TRUTH` |
| `offer implies exclusivity` | `reservation truth comes from CapacityReservation and ReservationTruthProjection` | `allowed` | `TRUTH_RESERVATION_TRUTH` |
| `ExternalConfirmationGate governs ambiguous booking and dispatch truth` | `ExternalConfirmationGate governs ambiguous booking and dispatch truth` | `preferred` | `TRUTH_EXTERNAL_CONFIRMATION_GATE` |
| `premature booked state` | `ExternalConfirmationGate governs ambiguous booking and dispatch truth` | `allowed` | `TRUTH_EXTERNAL_CONFIRMATION_GATE` |
| `generic reconciliation_required` | `ExternalConfirmationGate governs ambiguous booking and dispatch truth` | `allowed` | `TRUTH_EXTERNAL_CONFIRMATION_GATE` |
| `pharmacy calmness depends on dispatch proof, not transport acceptance alone` | `pharmacy calmness depends on dispatch proof, not transport acceptance alone` | `preferred` | `TRUTH_DISPATCH_PROOF` |
| `mailbox delivered equals referred` | `pharmacy calmness depends on dispatch proof, not transport acceptance alone` | `allowed` | `TRUTH_DISPATCH_PROOF` |
| `accepted for processing equals resolved` | `pharmacy calmness depends on dispatch proof, not transport acceptance alone` | `allowed` | `TRUTH_DISPATCH_PROOF` |
| `bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth` | `bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth` | `preferred` | `TRUTH_REOPEN_AND_BOUNCE_BACK` |
| `generic bounce-back` | `bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth` | `allowed` | `TRUTH_REOPEN_AND_BOUNCE_BACK` |
| `detached reopen workflow` | `bounce-back, reopen, and fallback stay inside the same lineage with explicit recovery truth` | `allowed` | `TRUTH_REOPEN_AND_BOUNCE_BACK` |
| `child domains emit milestones and evidence; they do not write canonical Request state directly` | `child domains emit milestones and evidence; they do not write canonical Request state directly` | `preferred` | `TRUTH_CHILD_DOMAIN_STATE_WRITES` |
| `domain-local request close` | `child domains emit milestones and evidence; they do not write canonical Request state directly` | `allowed` | `TRUTH_CHILD_DOMAIN_STATE_WRITES` |
| `child workflow owns canonical milestone` | `child domains emit milestones and evidence; they do not write canonical Request state directly` | `allowed` | `TRUTH_CHILD_DOMAIN_STATE_WRITES` |
| `ReleaseApprovalFreeze binds the promotable approval tuple` | `ReleaseApprovalFreeze binds the promotable approval tuple` | `preferred` | `RUNTIME_RELEASE_APPROVAL_FREEZE` |
| `bundle hash only release gate` | `ReleaseApprovalFreeze binds the promotable approval tuple` | `allowed` | `RUNTIME_RELEASE_APPROVAL_FREEZE` |
| `ChannelReleaseFreezeRecord fences mutable channel posture` | `ChannelReleaseFreezeRecord fences mutable channel posture` | `preferred` | `RUNTIME_CHANNEL_RELEASE_FREEZE` |
| `manifest-only channel guard` | `ChannelReleaseFreezeRecord fences mutable channel posture` | `allowed` | `RUNTIME_CHANNEL_RELEASE_FREEZE` |
| `AssuranceSliceTrustRecord governs degraded or quarantined operational truth` | `AssuranceSliceTrustRecord governs degraded or quarantined operational truth` | `preferred` | `RUNTIME_ASSURANCE_SLICE_TRUST` |
| `green dashboard despite degraded trust` | `AssuranceSliceTrustRecord governs degraded or quarantined operational truth` | `allowed` | `RUNTIME_ASSURANCE_SLICE_TRUST` |
| `RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple` | `RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple` | `preferred` | `RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT` |
| `token export as sidecar` | `RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple` | `allowed` | `RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT` |
| `route-local manifest convention` | `RuntimePublicationBundle and DesignContractPublicationBundle publish one coherent surface tuple` | `allowed` | `RUNTIME_PUBLICATION_AND_DESIGN_CONTRACT` |
| `AssuranceEvidenceGraphSnapshot plus AssuranceGraphCompletenessVerdict are authoritative assurance proof` | `AssuranceEvidenceGraphSnapshot plus AssuranceGraphCompletenessVerdict are authoritative assurance proof` | `preferred` | `ASSURANCE_EVIDENCE_GRAPH` |
| `parallel local evidence lists` | `AssuranceEvidenceGraphSnapshot plus AssuranceGraphCompletenessVerdict are authoritative assurance proof` | `allowed` | `ASSURANCE_EVIDENCE_GRAPH` |
| `continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence` | `continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence` | `preferred` | `ASSURANCE_CONTINUITY_EVIDENCE` |
| `continuity as narrative only` | `continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence` | `allowed` | `ASSURANCE_CONTINUITY_EVIDENCE` |
| `OperationalReadinessSnapshot and recovery-control tuples govern restore and failover authority` | `OperationalReadinessSnapshot and recovery-control tuples govern restore and failover authority` | `preferred` | `ASSURANCE_OPERATIONAL_READINESS` |
| `runbooks and dashboards only` | `OperationalReadinessSnapshot and recovery-control tuples govern restore and failover authority` | `allowed` | `ASSURANCE_OPERATIONAL_READINESS` |
| `CrossPhaseConformanceScorecard defines machine-auditable programme alignment` | `CrossPhaseConformanceScorecard defines machine-auditable programme alignment` | `preferred` | `PROGRAMME_CONFORMANCE_SCORECARD` |
| `summary-only done definition` | `CrossPhaseConformanceScorecard defines machine-auditable programme alignment` | `allowed` | `PROGRAMME_CONFORMANCE_SCORECARD` |
| `NHS App embedded delivery is deferred baseline scope, not a current hard gate` | `NHS App embedded delivery is deferred baseline scope, not a current hard gate` | `preferred` | `SCOPE_DEFERRED_NHS_APP` |
| `NHS App hard gate` | `NHS App embedded delivery is deferred baseline scope, not a current hard gate` | `allowed` | `SCOPE_DEFERRED_NHS_APP` |
| `current hard-gate delivery` | `NHS App embedded delivery is deferred baseline scope, not a current hard gate` | `allowed` | `SCOPE_DEFERRED_NHS_APP` |
| `ownershipState` | `identityState` | `deprecated` | `STATE_IDENTITY_AXIS_PATIENTREF` |
| `identity_hold` | `IdentityRepairCase + closure blocker metadata` | `forbidden` | `STATE_BLOCKER_ORTHOGONALITY` |
| `reconciliation_required` | `case-local gate or confirmation pending term, never canonical Request.workflowState` | `forbidden` | `STATE_WORKFLOW_MILESTONES` |
| `Request(workflowState = draft)` | `SubmissionEnvelope.state = draft` | `forbidden` | `STATE_SUBMISSION_ENVELOPE` |
| `generic success toast` | `CommandSettlementRecord` | `deprecated` | `MUTATION_COMMAND_SETTLEMENT_RECORD` |

## Required normalizations

- `ownershipState` normalizes to `identityState`.
- Generic `reconciliation_required` may remain case-local, but it must not appear as canonical `Request.workflowState`.
- `Request(workflowState = draft)` normalizes to `SubmissionEnvelope.state = draft`.
- Local acknowledgement or delivery proof normalizes to authoritative `CommandSettlementRecord` outcome semantics before calmness advances.
