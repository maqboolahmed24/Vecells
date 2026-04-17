# 121 Hazard Identification And Control Taxonomy

This document explains how the seed hazards are grouped and how the control catalog maps back to architecture law.

## Section A — `Mock_now_execution`

- Use the seven hazard families in [`dcb0129_hazard_register.json`](../../data/assurance/dcb0129_hazard_register.json).
- Keep controls explicit and machine-addressable rather than hidden in prose.

## Section B — `Actual_production_strategy_later`

- Replace placeholder evidence rows with live provider, release, or rehearsal evidence while keeping control IDs stable.
- Resolve gap placeholders into named roles and signed evidence without changing hazard lineage.

## Control Catalog

| Control | Layer | Summary | Status |
| --- | --- | --- | --- |
| CTRL_IDENTITY_REPAIR_FREEZE | domain_invariant | IdentityRepairFreezeRecord and IdentityRepairReleaseSettlement must gate any suspected wrong-subject correction. | active_seed_control |
| CTRL_EVIDENCE_ASSIMILATION_PREEMPTION | domain_invariant | EvidenceAssimilationRecord, MaterialDeltaAssessment, and SafetyPreemptionRecord must settle before calm continuation resumes. | active_seed_control |
| CTRL_DUPLICATE_ATTACH_FENCE | workflow_fence | DuplicatePairEvidence and DuplicateResolutionDecision must fence any merge or attach path. | active_seed_control |
| CTRL_SCOPED_MUTATION_AND_DECISION_EPOCH | runtime_gate | DecisionEpoch and live mutation gates must fail closed on stale evidence, stale ownership, or stale writable posture. | active_seed_control |
| CTRL_PUBLICATION_PARITY_AND_RUNTIME_BINDING | publication_parity | AudienceSurfaceRuntimeBinding and ReleasePublicationParityRecord remain the sole calm/writable authority. | active_seed_control |
| CTRL_REACHABILITY_AND_CALLBACK_EXPECTATION | communications_guard | ReachabilityAssessmentRecord and callback expectation envelopes must stay authoritative across promise and repair paths. | active_seed_control |
| CTRL_TELEPHONY_EVIDENCE_READINESS | adapter_gate | TelephonyEvidenceReadinessAssessment must hold telephony requests until evidence is genuinely safety-usable. | active_seed_control |
| CTRL_RESERVATION_TRUTH_AND_WAITLIST_FALLBACK | booking_control | ReservationTruthProjection and WaitlistFallbackObligation must govern hold language and safe fallback. | active_seed_control |
| CTRL_BOOKING_CONFIRMATION_GATE | booking_control | BookingConfirmationTruthProjection and ExternalConfirmationGate must prevent false booked reassurance. | active_seed_control |
| CTRL_HUB_VISIBILITY_POLICY | network_policy | HubPracticeVisibilityPolicy and NetworkCoordinationPolicyEvaluation must fence hub visibility and fallback exposure. | placeholder_seed_control |
| CTRL_PHARMACY_CONSENT_CHECKPOINT | pharmacy_control | PharmacyConsentCheckpoint and revocation records must fence dispatch against stale or superseded consent. | placeholder_seed_control |
| CTRL_PHARMACY_DISPATCH_AND_OUTCOME_RECONCILIATION | pharmacy_control | Dispatch proof, outcome reconciliation, and bounce-back reopen gates must block unsafe auto-close. | placeholder_seed_control |
| CTRL_SUPPORT_REPLAY_RESTORE | support_control | SupportReplayRestoreSettlement and InvestigationScopeEnvelope must fence replay and resend repair work. | active_seed_control |
| CTRL_ASSISTIVE_TRUST_AND_HUMAN_APPROVAL | assistive_control | AssistiveCapabilityTrustEnvelope and HumanApprovalGateAssessment must fence any assistive suggestion or writeback path. | placeholder_seed_control |
| CTRL_NO_SELF_APPROVAL_RELEASE_GRAPH | governance_control | No self-approval and independent safety signoff must be enforced for high-severity safety changes. | placeholder_seed_control |
| CTRL_ASSURANCE_LEDGER_PACKAGING | assurance_control | AssuranceEvidenceGraphSnapshot must preserve deterministic packaging and evidence completeness. | placeholder_seed_control |
| CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD | change_control | Each material change must update the hazard register or record an explicit non-applicability decision. | active_seed_control |
| CTRL_WORKSPACE_TRUST_ENVELOPE | workspace_control | WorkspaceTrustEnvelope must block calm or writable posture when review truth drifts. | active_seed_control |

## Gap Resolutions

| Gap | Resolution |
| --- | --- |
| GAP_RESOLUTION_HAZARD_DERIVATION_STALE_WRITABLE_UI_V1 | The blueprint forbids stale writable surfaces and publication drift through invariants rather than by naming a single hazard sentence, so this seed pack derives a bounded hazard from those explicit fail-closed rules. |
| GAP_RESOLUTION_HAZARD_DERIVATION_CALLBACK_PROMISE_FAILURE_V1 | The callback and more-info failure mode is expressed in the corpus as expectation, dependency, and repair law; the seed pack converts that into a clinical hazard statement for the DCB0129 log. |
| GAP_RESOLUTION_HAZARD_DERIVATION_SUPPORT_REPLAY_DISCLOSURE_V1 | The forensic findings describe stale replay and wrong-subject restore as control failures. The seed pack transparently derives a clinical hazard from those findings rather than omitting them. |
| GAP_RESOLUTION_HAZARD_DERIVATION_ASSISTIVE_MISUSE_V1 | Assistive misuse is a future-facing safety class in the blueprint. The seed pack records it now as deferred-but-known so later live assistive work extends the same register. |
| GAP_ROLE_DEFINITION_MANUFACTURER_CSO_V1 | The named DCB0129 Clinical Safety Officer is not yet recorded in-repo, so the seed pack uses a placeholder role until the signoff matrix and named owner pack land. |
| GAP_ROLE_DEFINITION_INDEPENDENT_REVIEWER_V1 | Independent clinical safety review authority is required for high-severity changes, but the named reviewer roster is not yet fixed in-repo. |
| GAP_ROLE_DEFINITION_CHANGE_AUTHORITY_COORDINATOR_V1 | Change-control coordination is modeled now as a placeholder operational role so review events can be assigned deterministically before the governance shell and cadence pack settle. |
