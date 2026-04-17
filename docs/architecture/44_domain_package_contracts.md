# 44 Domain Package Contracts

- Task: `seq_044`
- Captured on: `2026-04-11`
- Generated at: `2026-04-13T14:51:06+00:00`
- Visual mode: `Domain_Package_Contract_Map`

Scaffold the Vecells bounded-context domain packages and shared contract packages with deterministic package homes, typed placeholder exports, package-level ownership statements, and validator-backed boundary checks.

## Gap Closures

- The Phase 0 domain list now has explicit package homes for all 13 bounded contexts, including intake_safety, support, operations, governance_admin, analytics_assurance, audit_compliance, and release_control.
- Frontend/runtime contract families now have first-class shared homes in `packages/api-contracts`, `packages/design-system`, `packages/observability`, and `packages/release-controls`.
- The object catalog is used as the completeness check, so every canonical family from `data/analysis/object_catalog.json` has one package owner.
- `packages/test-fixtures` is kept intentionally non-authoritative so it cannot drift into a shadow runtime package.

## Assumptions

- `ASSUMPTION_044_TRIAGE_SPLIT`: The object catalog does not publish a separate intake-safety bounded_context code, so triage_human_checkpoint families containing approval, decision, endpoint, or safety vocabulary are assigned to intake_safety and the remainder stay in triage_workspace.
- `ASSUMPTION_044_SUPPORT_OPERATIONS_SPLIT`: The staff_support_operations inventory is split by operating vocabulary: ops, cohort, inventory, health, readiness, and drill families land in operations, while the remaining casework and resolution families land in support.
- `ASSUMPTION_044_GOVERNANCE_SPLIT`: assurance_and_governance rows are split into analytics_assurance, governance_admin, and audit_compliance using audit/archive/attestation breach markers for compliance, config/governance/CAPA vocabulary for governance_admin, and the remainder for analytics_assurance.
- `ASSUMPTION_044_SHARED_RUNTIME_SPLIT`: frontend_runtime, patient_experience, foundation_runtime_experience, assistive, runtime_release, unknown, and audited_flow_gap families are routed into explicit shared packages by contract vocabulary so runtime, release, authz, design, and observability truths stop floating outside package ownership.
- `ASSUMPTION_044_TEST_FIXTURES_NON_AUTHORITATIVE`: packages/test-fixtures owns contract-safe fixture builders only and intentionally owns zero canonical object families so the package cannot become a shadow runtime truth.

## Domain Packages

| Context | Package | Source Contexts | Object Families | Representative Families |
| --- | --- | --- | ---: | --- |
| intake_safety | @vecells/domain-intake-safety | triage_human_checkpoint | 10 | ApprovalCheckpoint, ApprovalEvidenceBundle, DecisionEpoch, DecisionSupersessionRecord |
| identity_access | @vecells/domain-identity-access | foundation_identity_access | 136 | AccessGrantRedemptionRecord, AccessGrantService, AccessGrantSupersessionRecord, AdapterDispatchAttempt |
| triage_workspace | @vecells/domain-triage-workspace | triage_human_checkpoint | 18 | BookingIntent, DuplicateReviewSnapshot, InformationRequestWindow, MoreInfoCycle |
| booking | @vecells/domain-booking | booking | 33 | AdapterContractProfile, AppointmentManageCommand, AppointmentPresentationArtifact, AppointmentRecord |
| hub_coordination | @vecells/domain-hub-coordination | hub_coordination | 49 | ActingContext, AlternativeOfferEntry, AlternativeOfferFallbackCard, AlternativeOfferOptimisationPlan |
| pharmacy | @vecells/domain-pharmacy | pharmacy | 39 | DispatchAdapterBinding, DispatchProofEnvelope, EligibilityExplanationBundle, ManualDispatchAssistanceRecord |
| communications | @vecells/domain-communications | callback_messaging | 14 | CallbackAttemptRecord, CallbackCase, CallbackExpectationEnvelope, CallbackIntentLease |
| support | @vecells/domain-support | self_care_admin_resolution, staff_support_operations | 88 | AdminResolutionActionRecord, AdminResolutionCase, AdminResolutionCompletionArtifact, AdminResolutionDigest |
| operations | @vecells/domain-operations | staff_support_operations | 44 | CohortActionBridge, CohortDriverPath, CohortImpactCellProjection, CohortVisibilityGuard |
| governance_admin | @vecells/domain-governance-admin | assurance_and_governance, platform_configuration | 34 | AccessAdministrationWorkspace, AccessFreezeDisposition, AccessImpactDigest, AdminActionRecord |
| analytics_assurance | @vecells/domain-analytics-assurance | assurance_and_governance | 65 | ArtifactDependencyLink, AssuranceControlRecord, AssuranceEvidenceGraphEdge, AssuranceEvidenceGraphSnapshot |
| audit_compliance | @vecells/domain-audit-compliance | assurance_and_governance | 6 | AccessEventIndex, ArchiveManifest, AttestationRecord, AuditQuerySession |
| release_control | @vecells/domain-release-control | runtime_release | 29 | AssuranceSliceProbe, BuildProvenanceRecord, EmergencyReleaseException, GovernedControlHandoffBinding |

## Shared Contract Packages

| Package | Contract Families | Object Families | Consumer Seams |
| --- | --- | ---: | --- |
| @vecells/domain-kernel | Foundation primitives and lineage aggregates | 39 | CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS, CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS, CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL |
| @vecells/event-contracts | Published event truth | 12 | CBC_041_COMMAND_API_TO_EVENT_CONTRACTS, CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS, CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES, CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS |
| @vecells/api-contracts | Browser and runtime surface contracts, Projection and presentation contracts, Assistive and visualization surfaces | 221 | CBC_041_SHELLS_TO_API_CONTRACTS, CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS, CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS, CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES, CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS |
| @vecells/fhir-mapping | FHIR representation boundary | 1 | CBC_041_PROJECTION_WORKER_TO_FHIR_MAPPING, CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES |
| @vecells/authz-policy | Acting scope and authorization fences | 22 | CBC_041_API_GATEWAY_TO_IDENTITY_POLICY, CBC_041_COMMAND_API_TO_DOMAIN_PUBLIC_ENTRYPOINTS, CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY |
| @vecells/design-system | Design tokens, accessibility vocabulary, and automation markers | 20 | CBC_041_SHELLS_TO_DESIGN_SYSTEM |
| @vecells/test-fixtures | Contract-safe fixture builders | 0 | CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES |
| @vecells/observability | Telemetry and trust vocabulary, Continuity and lineage signals | 31 | CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS, CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES, CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY, CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY, CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS |
| @vecells/release-controls | Publication, freeze, and parity controls, Degraded-mode and recovery controls, Assistive release safeguards | 39 | CBC_041_SHELLS_TO_RELEASE_CONTROLS, CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS, CBC_041_NOTIFICATION_WORKER_TO_COMMUNICATIONS_SUPPORT_IDENTITY, CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS |

## Boundary Enforcement

- Domain packages export typed placeholder families only through package root entrypoints.
- Shared packages expose documented contract families only; no generic shared-utils package exists.
- Package tests prove bootstrapping through package public names and never through sibling private internals.
- `tools/analysis/validate_domain_packages.py` fails closed on orphaned families, multiply owned families, undocumented packages, or deep-import drift.
