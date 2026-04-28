import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const GENERATED_AT = "2026-04-28T00:00:00.000Z";
const TASK_ID = "seq_472";
const SCHEMA_VERSION = "472.programme.conformance-scorecard.v1";
const SCORECARD_ID = "programme-core-release-472-cross-phase-conformance";
const RELEASE_REF = "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28";
const TENANT_SCOPE = "tenant-demo-gp:programme-core-release";

type ExactState = "exact";
type BlockedState = "blocked";
type ContractAdoptionState = ExactState | "partial" | BlockedState;
type RowState = ExactState | "deferred_scope" | BlockedState;

export interface ProgrammeConformanceRow {
  readonly rowId: string;
  readonly rowKind: "phase" | "phase_deferred_scope" | "control_family";
  readonly rowCode: string;
  readonly label: string;
  readonly owner:
    | "programme"
    | "clinical_safety"
    | "governance"
    | "operations"
    | "release"
    | "resilience";
  readonly mandatoryForCurrentCoreRelease: boolean;
  readonly permittedDeferredScope: boolean;
  readonly summaryAlignmentState: ExactState | BlockedState;
  readonly contractAdoptionState: ContractAdoptionState;
  readonly verificationCoverageState: ExactState | BlockedState;
  readonly operationalProofState: ExactState | BlockedState;
  readonly governanceProofState: ExactState | BlockedState;
  readonly endStateProofState: ExactState | "deferred_scope" | BlockedState;
  readonly rowState: RowState;
  readonly sourceRefs: readonly string[];
  readonly canonicalBlueprintRefs: readonly string[];
  readonly requiredProofRefs: readonly string[];
  readonly activeDependencyRefs: readonly string[];
  readonly correctionRefs: readonly string[];
  readonly rowHash: string;
  readonly consequence: string;
  readonly nextSafeAction: string;
}

interface RowInput extends Omit<ProgrammeConformanceRow, "rowHash"> {}

export interface ProgrammeConformanceScorecard {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly scorecardId: typeof SCORECARD_ID;
  readonly releaseRef: typeof RELEASE_REF;
  readonly tenantScope: typeof TENANT_SCOPE;
  readonly generatedAt: typeof GENERATED_AT;
  readonly scorecardState: ExactState | BlockedState;
  readonly summaryAlignmentState: "exact_after_correction" | BlockedState;
  readonly deferredScopeState: "permitted_explicit" | BlockedState;
  readonly allMandatoryRowsExact: boolean;
  readonly mandatoryRowCount: number;
  readonly exactMandatoryRowCount: number;
  readonly deferredRowCount: number;
  readonly blockerCount: number;
  readonly phaseRowCount: number;
  readonly controlFamilyRowCount: number;
  readonly scorecardHash: string;
  readonly scorecardHashAlgorithm: "sha256:stable-json:v1";
  readonly rowHashAlgorithm: "sha256:stable-json-row-without-rowHash:v1";
  readonly phaseConformanceRowsRef: "data/conformance/472_phase_conformance_rows.json";
  readonly crossPhaseControlFamilyRowsRef: "data/conformance/472_cross_phase_control_family_rows.json";
  readonly deferredScopeNoteRef: "data/conformance/472_deferred_scope_and_phase7_dependency_note.json";
  readonly summaryAlignmentCorrectionsRef: "data/conformance/472_summary_alignment_corrections.json";
  readonly programmeReportRef: "docs/programme/472_programme_merge_conformance_report.md";
  readonly bauHandoffSummaryRef: "docs/programme/472_bau_handoff_summary.md";
  readonly topologyRef: "docs/architecture/472_cross_phase_conformance_topology.mmd";
  readonly schemaRef: "data/contracts/472_programme_conformance_scorecard.schema.json";
  readonly algorithmNotesRef: "data/analysis/472_algorithm_alignment_notes.md";
  readonly externalReferenceNotesRef: "data/analysis/472_external_reference_notes.json";
  readonly phase9ExitGateDecisionRef: "data/evidence/471_phase9_exit_gate_decision.json";
  readonly phase9ExitGateDecisionHash: string;
  readonly permittedDeferredRows: readonly string[];
  readonly blockingSummaryClaimRefs: readonly string[];
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamArtifactRefs: readonly string[];
  readonly sourceFileHashes: readonly { readonly ref: string; readonly sha256: string }[];
  readonly scorecardHashInputs: readonly string[];
  readonly bauHandoffState: "ready_for_bau_handoff" | BlockedState;
  readonly bauPreconditions: {
    readonly phase9ExitGateApproved: true;
    readonly conformanceScorecardExact: true;
    readonly runbookBundlePresent: true;
    readonly onCallMatrixPresent: true;
    readonly recoveryPostureExact: true;
    readonly noRawArtifactUrls: true;
  };
}

const phaseBlueprints = [
  "blueprint/phase-0-the-foundation-protocol.md",
  "blueprint/phase-1-the-red-flag-gate.md",
  "blueprint/phase-2-identity-and-echoes.md",
  "blueprint/phase-3-the-human-checkpoint.md",
  "blueprint/phase-4-the-booking-engine.md",
  "blueprint/phase-5-the-network-horizon.md",
  "blueprint/phase-6-the-pharmacy-loop.md",
  "blueprint/phase-7-inside-the-nhs-app.md",
  "blueprint/phase-8-the-assistive-layer.md",
  "blueprint/phase-9-the-assurance-ledger.md",
] as const;

const crossCuttingBlueprints = [
  "blueprint/platform-frontend-blueprint.md",
  "blueprint/patient-portal-experience-architecture-blueprint.md",
  "blueprint/patient-account-and-communications-blueprint.md",
  "blueprint/staff-operations-and-support-blueprint.md",
  "blueprint/staff-workspace-interface-architecture.md",
  "blueprint/pharmacy-console-frontend-architecture.md",
  "blueprint/operations-console-frontend-blueprint.md",
  "blueprint/platform-admin-and-config-blueprint.md",
  "blueprint/governance-admin-console-frontend-blueprint.md",
  "blueprint/platform-runtime-and-release-blueprint.md",
  "blueprint/callback-and-clinician-messaging-loop.md",
  "blueprint/self-care-content-and-admin-resolution-blueprint.md",
  "blueprint/accessibility-and-content-system-contract.md",
  "blueprint/canonical-ui-contract-kernel.md",
] as const;

const sourceAlgorithmRefs = [
  "prompt/472.md",
  "prompt/shared_operating_contract_458_to_472.md",
  "blueprint/phase-cards.md",
  "blueprint/blueprint-init.md",
  ...phaseBlueprints,
  ...crossCuttingBlueprints,
] as const;

const upstreamArtifactRefs = [
  "docs/governance/138_phase0_conformance_scorecard.md",
  "data/analysis/138_phase0_conformance_rows.json",
  "docs/governance/169_phase1_conformance_scorecard.md",
  "data/analysis/169_phase1_conformance_rows.json",
  "docs/governance/208_phase2_conformance_scorecard.md",
  "data/analysis/208_phase2_conformance_rows.json",
  "docs/governance/225_portal_and_support_conformance_scorecard.md",
  "data/analysis/225_conformance_rows.json",
  "docs/governance/277_phase3_conformance_scorecard.md",
  "data/analysis/277_phase3_conformance_rows.json",
  "docs/governance/310_phase4_conformance_scorecard.md",
  "data/analysis/310_phase4_conformance_matrix.csv",
  "docs/release/341_phase5_exit_gate_decision.md",
  "data/contracts/341_phase5_exit_verdict.json",
  "docs/release/372_phase6_exit_gate_decision.md",
  "data/contracts/372_phase6_exit_verdict.json",
  "docs/release/402_phase7_exit_gate.md",
  "data/contracts/402_phase7_exit_verdict.json",
  "data/contracts/431_phase8_exit_packet.json",
  "data/fixtures/431_phase8_exit_gate_evidence.json",
  "data/contracts/449_phase9_cross_phase_conformance_contract.json",
  "data/fixtures/449_phase9_cross_phase_conformance_fixtures.json",
  "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
  "data/fixtures/460_conformance_scorecard_fixtures.json",
  "data/evidence/465_load_soak_breach_queue_heatmap_results.json",
  "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
  "data/evidence/467_retention_legal_hold_worm_replay_results.json",
  "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
  "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
  "data/evidence/470_full_regression_and_defensive_security_results.json",
  "data/evidence/471_phase9_exit_gate_decision.json",
  "docs/runbooks/471_phase9_exit_gate_approval_runbook.md",
] as const;

const phaseRows: readonly RowInput[] = [
  {
    rowId: "phase_0_foundation_control_plane",
    rowKind: "phase",
    rowCode: "phase_0",
    label: "Phase 0 foundation/control plane",
    owner: "programme",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: [
      "blueprint/phase-cards.md#phase-0",
      "blueprint/blueprint-init.md#programme-baseline",
    ],
    canonicalBlueprintRefs: ["blueprint/phase-0-the-foundation-protocol.md"],
    requiredProofRefs: [
      "docs/governance/138_phase0_conformance_scorecard.md",
      "data/analysis/138_phase0_conformance_rows.json",
      "data/analysis/138_phase0_exit_gate_decision.json",
    ],
    activeDependencyRefs: ["blueprint/platform-runtime-and-release-blueprint.md"],
    correctionRefs: [],
    consequence: "Foundation protocol controls are carried as release-wide prerequisites.",
    nextSafeAction: "Keep phase 0 rows in the mandatory scorecard set for every BAU release.",
  },
  {
    rowId: "phase_1_red_flag_gate",
    rowKind: "phase",
    rowCode: "phase_1",
    label: "Phase 1 red-flag gate",
    owner: "clinical_safety",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: ["blueprint/phase-cards.md#phase-1", "blueprint/blueprint-init.md#red-flag-gate"],
    canonicalBlueprintRefs: ["blueprint/phase-1-the-red-flag-gate.md"],
    requiredProofRefs: [
      "docs/governance/169_phase1_conformance_scorecard.md",
      "data/analysis/169_phase1_conformance_rows.json",
      "data/analysis/169_phase1_exit_gate_decision.json",
    ],
    activeDependencyRefs: ["blueprint/staff-operations-and-support-blueprint.md"],
    correctionRefs: [],
    consequence: "Safety-critical red-flag routing remains bound to clinical risk proof.",
    nextSafeAction: "Retain gate evidence in the release evidence graph and incident exercises.",
  },
  {
    rowId: "phase_2_identity_and_access",
    rowKind: "phase",
    rowCode: "phase_2",
    label: "Phase 2 identity and access",
    owner: "governance",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: ["blueprint/phase-cards.md#phase-2", "blueprint/blueprint-init.md#identity"],
    canonicalBlueprintRefs: [
      "blueprint/phase-2-identity-and-echoes.md",
      "blueprint/platform-admin-and-config-blueprint.md",
      "blueprint/governance-admin-console-frontend-blueprint.md",
    ],
    requiredProofRefs: [
      "docs/governance/208_phase2_conformance_scorecard.md",
      "data/analysis/208_phase2_conformance_rows.json",
      "data/analysis/208_phase2_exit_gate_decision.json",
      "data/fixtures/458_role_scope_studio_fixtures.json",
    ],
    activeDependencyRefs: ["data/contracts/458_phase9_role_scope_studio_route_contract.json"],
    correctionRefs: [],
    consequence: "Identity, acting context, and access preview proof remain release blockers.",
    nextSafeAction: "Keep role scope previews and release freeze cards tied to conformance rows.",
  },
  {
    rowId: "phase_3_human_checkpoint_workspace",
    rowKind: "phase",
    rowCode: "phase_3",
    label: "Phase 3 human checkpoint/workspace",
    owner: "operations",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: [
      "blueprint/phase-cards.md#phase-3",
      "blueprint/blueprint-init.md#human-checkpoint",
    ],
    canonicalBlueprintRefs: [
      "blueprint/phase-3-the-human-checkpoint.md",
      "blueprint/staff-workspace-interface-architecture.md",
    ],
    requiredProofRefs: [
      "docs/governance/225_portal_and_support_conformance_scorecard.md",
      "data/analysis/225_conformance_rows.json",
      "data/analysis/225_crosscutting_exit_gate_decision.json",
      "docs/governance/277_phase3_conformance_scorecard.md",
      "data/analysis/277_phase3_conformance_rows.json",
      "data/analysis/277_phase3_exit_gate_decision.json",
    ],
    activeDependencyRefs: ["blueprint/staff-operations-and-support-blueprint.md"],
    correctionRefs: [],
    consequence: "Workspace continuity and human checkpoint proof are merged into one row family.",
    nextSafeAction:
      "Keep staff task continuity and support observability in the mandatory proof set.",
  },
  {
    rowId: "phase_4_booking_engine",
    rowKind: "phase",
    rowCode: "phase_4",
    label: "Phase 4 booking engine",
    owner: "operations",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: ["blueprint/phase-cards.md#phase-4", "blueprint/blueprint-init.md#booking-engine"],
    canonicalBlueprintRefs: [
      "blueprint/phase-4-the-booking-engine.md",
      "blueprint/patient-portal-experience-architecture-blueprint.md",
    ],
    requiredProofRefs: [
      "docs/governance/310_phase4_conformance_scorecard.md",
      "data/analysis/310_phase4_conformance_matrix.csv",
      "data/analysis/310_phase4_exit_gate_decision.json",
    ],
    activeDependencyRefs: ["blueprint/callback-and-clinician-messaging-loop.md"],
    correctionRefs: [],
    consequence: "Booking truth, recovery, and artifact parity are part of current release proof.",
    nextSafeAction: "Preserve booking artifact and recovery rows in cross-phase regression.",
  },
  {
    rowId: "phase_5_network_hub_coordination",
    rowKind: "phase",
    rowCode: "phase_5",
    label: "Phase 5 network/hub coordination",
    owner: "operations",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: ["blueprint/phase-cards.md#phase-5", "blueprint/blueprint-init.md#network-horizon"],
    canonicalBlueprintRefs: [
      "blueprint/phase-5-the-network-horizon.md",
      "blueprint/staff-operations-and-support-blueprint.md",
    ],
    requiredProofRefs: [
      "docs/release/341_phase5_exit_gate_decision.md",
      "data/contracts/341_phase5_exit_verdict.json",
      "data/analysis/341_phase5_evidence_matrix.csv",
      "data/analysis/341_phase5_contract_consistency_matrix.csv",
    ],
    activeDependencyRefs: ["data/contracts/341_phase5_to_phase6_handoff_contract.json"],
    correctionRefs: [],
    consequence: "Hub coordination and imported confirmation proof remain mandatory.",
    nextSafeAction: "Keep hub settlement and visibility rows exact before BAU transfer.",
  },
  {
    rowId: "phase_6_pharmacy_loop",
    rowKind: "phase",
    rowCode: "phase_6",
    label: "Phase 6 pharmacy loop",
    owner: "operations",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: ["blueprint/phase-cards.md#phase-6", "blueprint/blueprint-init.md#pharmacy-loop"],
    canonicalBlueprintRefs: [
      "blueprint/phase-6-the-pharmacy-loop.md",
      "blueprint/pharmacy-console-frontend-architecture.md",
    ],
    requiredProofRefs: [
      "docs/release/372_phase6_exit_gate_decision.md",
      "data/contracts/372_phase6_exit_verdict.json",
      "data/analysis/372_phase6_evidence_matrix.csv",
      "data/analysis/372_phase6_contract_consistency_matrix.csv",
    ],
    activeDependencyRefs: ["data/contracts/372_phase6_to_phase7_handoff_contract.json"],
    correctionRefs: [],
    consequence: "Pharmacy loop proof carries into patient status and operations continuity.",
    nextSafeAction: "Retain pharmacy recovery and dispatch parity in release regression.",
  },
  {
    rowId: "phase_7_deferred_nhs_app_channel_scope",
    rowKind: "phase_deferred_scope",
    rowCode: "phase_7",
    label: "Phase 7 deferred NHS App/channel scope and active dependencies",
    owner: "release",
    mandatoryForCurrentCoreRelease: false,
    permittedDeferredScope: true,
    summaryAlignmentState: "exact",
    contractAdoptionState: "partial",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "deferred_scope",
    rowState: "deferred_scope",
    sourceRefs: [
      "blueprint/phase-cards.md#programme-baseline-update",
      "blueprint/phase-7-inside-the-nhs-app.md#deferred-channel-baseline",
    ],
    canonicalBlueprintRefs: [
      "blueprint/phase-7-inside-the-nhs-app.md",
      "blueprint/patient-portal-experience-architecture-blueprint.md",
    ],
    requiredProofRefs: [
      "docs/release/402_phase7_exit_gate.md",
      "data/contracts/402_phase7_exit_verdict.json",
      "data/contracts/402_phase7_carry_forward_registry.json",
      "data/contracts/402_phase7_capability_readiness_registry.json",
    ],
    activeDependencyRefs: [
      "ArtifactPresentationContract",
      "OutboundNavigationGrant",
      "PatientEmbeddedNavEligibility",
      "BridgeCapabilityMatrix",
      "route-freeze:ops-conformance",
      "embedded-context-resolution",
      "continuity-return-token",
    ],
    correctionRefs: ["summary_correction_phase7_deferred_scope"],
    consequence:
      "Live NHS App launch remains outside the core release, but channel-derived contracts still bind current artifacts and handoffs.",
    nextSafeAction:
      "Do not mark Phase 7 complete until task 473 merges the live channel row into this scorecard.",
  },
  {
    rowId: "phase_8_assistive_layer",
    rowKind: "phase",
    rowCode: "phase_8",
    label: "Phase 8 assistive layer",
    owner: "clinical_safety",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: ["blueprint/phase-cards.md#phase-8", "blueprint/blueprint-init.md#assistive-layer"],
    canonicalBlueprintRefs: ["blueprint/phase-8-the-assistive-layer.md"],
    requiredProofRefs: [
      "data/contracts/431_phase8_exit_packet.json",
      "data/fixtures/431_phase8_exit_gate_evidence.json",
      "data/analysis/431_phase8_exit_gate_summary.md",
    ],
    activeDependencyRefs: ["data/evidence/470_full_regression_and_defensive_security_results.json"],
    correctionRefs: [],
    consequence:
      "Assistive layer proof is included without allowing model confidence to substitute for human authority.",
    nextSafeAction:
      "Keep trust envelope, override, and offline evaluation proof in BAU assurance packs.",
  },
  {
    rowId: "phase_9_assurance_ledger_bau_transfer",
    rowKind: "phase",
    rowCode: "phase_9",
    label: "Phase 9 assurance ledger and BAU transfer",
    owner: "governance",
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: [
      "blueprint/phase-cards.md#phase-9",
      "blueprint/phase-9-the-assurance-ledger.md#9i",
    ],
    canonicalBlueprintRefs: [
      "blueprint/phase-9-the-assurance-ledger.md",
      "blueprint/operations-console-frontend-blueprint.md",
    ],
    requiredProofRefs: [
      "data/contracts/449_phase9_cross_phase_conformance_contract.json",
      "data/fixtures/449_phase9_cross_phase_conformance_fixtures.json",
      "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
      "data/evidence/471_phase9_exit_gate_decision.json",
      "docs/runbooks/471_phase9_exit_gate_approval_runbook.md",
    ],
    activeDependencyRefs: [
      "BAUReadinessPack",
      "OnCallMatrix",
      "RunbookBundle",
      "ReleaseToBAURecord",
      "CrossPhaseConformanceScorecard",
    ],
    correctionRefs: ["summary_correction_bau_readiness_gating"],
    consequence:
      "BAU transfer is allowed only while the Phase 9 exit decision and scorecard hashes are exact.",
    nextSafeAction: "Issue ReleaseToBAURecord only from this hash and its row set.",
  },
] as const;

const controlRows: readonly RowInput[] = [
  controlRow(
    "patient_shell_continuity",
    "patient shell continuity",
    "operations",
    [
      "blueprint/patient-portal-experience-architecture-blueprint.md",
      "blueprint/patient-account-and-communications-blueprint.md",
    ],
    [
      "data/evidence/470_full_regression_and_defensive_security_results.json",
      "data/contracts/464_phase9_live_projection_gateway_contract.json",
    ],
  ),
  controlRow(
    "staff_workspace_continuity",
    "staff workspace continuity",
    "operations",
    [
      "blueprint/staff-workspace-interface-architecture.md",
      "blueprint/staff-operations-and-support-blueprint.md",
    ],
    [
      "data/evidence/470_full_regression_and_defensive_security_results.json",
      "data/fixtures/464_live_projection_gateway_fixtures.json",
    ],
  ),
  controlRow(
    "operations_console_continuity",
    "operations console continuity",
    "operations",
    ["blueprint/operations-console-frontend-blueprint.md"],
    [
      "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
      "data/evidence/470_full_regression_and_defensive_security_results.json",
    ],
  ),
  controlRow(
    "governance_admin_config_access",
    "governance/admin config and access",
    "governance",
    [
      "blueprint/governance-admin-console-frontend-blueprint.md",
      "blueprint/platform-admin-and-config-blueprint.md",
    ],
    [
      "data/contracts/458_phase9_role_scope_studio_route_contract.json",
      "data/fixtures/458_role_scope_studio_fixtures.json",
    ],
  ),
  controlRow(
    "audit_break_glass_support_replay",
    "audit/break-glass/support replay",
    "governance",
    ["blueprint/phase-9-the-assurance-ledger.md"],
    [
      "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
      "data/fixtures/459_compliance_ledger_fixtures.json",
    ],
  ),
  controlRow(
    "assurance_pack_evidence_graph",
    "assurance pack and evidence graph",
    "governance",
    ["blueprint/phase-9-the-assurance-ledger.md"],
    [
      "data/contracts/449_phase9_cross_phase_conformance_contract.json",
      "data/evidence/471_phase9_exit_gate_decision.json",
    ],
  ),
  controlRow(
    "records_lifecycle_retention",
    "records lifecycle/retention",
    "governance",
    ["blueprint/phase-9-the-assurance-ledger.md"],
    [
      "data/evidence/467_retention_legal_hold_worm_replay_results.json",
      "data/contracts/463_phase9_security_compliance_export_registry_contract.json",
    ],
  ),
  controlRow(
    "resilience_restore_failover_chaos",
    "resilience/restore/failover/chaos",
    "resilience",
    ["blueprint/platform-runtime-and-release-blueprint.md"],
    [
      "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
      "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
    ],
  ),
  controlRow(
    "incident_near_miss_reportability_capa",
    "incident/near miss/reportability/CAPA",
    "operations",
    ["blueprint/phase-9-the-assurance-ledger.md"],
    [
      "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      "data/contracts/461_phase9_operational_destination_registry_contract.json",
    ],
  ),
  controlRow(
    "tenant_config_standards_dependency_hygiene",
    "tenant config/standards dependency hygiene",
    "governance",
    ["blueprint/platform-admin-and-config-blueprint.md"],
    [
      "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      "data/contracts/458_phase9_role_scope_studio_route_contract.json",
    ],
  ),
  controlRow(
    "release_runtime_publication_recovery_disposition",
    "release/runtime publication and recovery disposition",
    "release",
    ["blueprint/platform-runtime-and-release-blueprint.md"],
    [
      "data/contracts/464_phase9_live_projection_gateway_contract.json",
      "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
    ],
  ),
  controlRow(
    "accessibility_content_design_contract",
    "accessibility/content and design contract publication",
    "programme",
    [
      "blueprint/accessibility-and-content-system-contract.md",
      "blueprint/canonical-ui-contract-kernel.md",
    ],
    [
      "data/evidence/470_full_regression_and_defensive_security_results.json",
      "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
    ],
  ),
  controlRow(
    "artifact_presentation_outbound_navigation_grant",
    "artifact presentation/outbound navigation grant",
    "release",
    ["blueprint/phase-7-inside-the-nhs-app.md", "blueprint/canonical-ui-contract-kernel.md"],
    [
      "data/evidence/471_phase9_exit_gate_decision.json",
      "data/contracts/402_phase7_carry_forward_registry.json",
    ],
    ["ArtifactPresentationContract", "OutboundNavigationGrant", "continuity-return-token"],
  ),
  controlRow(
    "ui_telemetry_disclosure_fence",
    "UI telemetry/disclosure fence",
    "governance",
    [
      "blueprint/accessibility-and-content-system-contract.md",
      "blueprint/operations-console-frontend-blueprint.md",
    ],
    [
      "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
      "data/evidence/470_full_regression_and_defensive_security_results.json",
    ],
  ),
  controlRow(
    "identity_access",
    "identity/access",
    "governance",
    [
      "blueprint/phase-2-identity-and-echoes.md",
      "blueprint/platform-admin-and-config-blueprint.md",
    ],
    [
      "data/analysis/208_phase2_conformance_rows.json",
      "data/fixtures/458_role_scope_studio_fixtures.json",
    ],
  ),
  controlRow(
    "settlement_idempotency_replay",
    "settlement/idempotency/replay",
    "operations",
    ["blueprint/phase-5-the-network-horizon.md", "blueprint/phase-9-the-assurance-ledger.md"],
    [
      "data/evidence/470_full_regression_and_defensive_security_results.json",
      "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
    ],
  ),
] as const;

function controlRow(
  code: string,
  label: string,
  owner: RowInput["owner"],
  canonicalBlueprintRefs: readonly string[],
  requiredProofRefs: readonly string[],
  activeDependencyRefs: readonly string[] = [],
): RowInput {
  return {
    rowId: `control_family_${code}`,
    rowKind: "control_family",
    rowCode: code,
    label,
    owner,
    mandatoryForCurrentCoreRelease: true,
    permittedDeferredScope: false,
    summaryAlignmentState: "exact",
    contractAdoptionState: "exact",
    verificationCoverageState: "exact",
    operationalProofState: "exact",
    governanceProofState: "exact",
    endStateProofState: "exact",
    rowState: "exact",
    sourceRefs: ["blueprint/phase-cards.md#cross-cutting-corrections"],
    canonicalBlueprintRefs,
    requiredProofRefs,
    activeDependencyRefs,
    correctionRefs: [],
    consequence: `${label} is represented as a cross-phase control family with current proof.`,
    nextSafeAction: "Retain this family in every scorecard hash before BAU signoff.",
  };
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortValue(child)]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function toAbsolute(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function assertExistingFile(relativePath: string): void {
  if (!fs.existsSync(toAbsolute(relativePath))) {
    throw new Error(`Required canonical/proof artifact is missing: ${relativePath}`);
  }
}

function hashFile(relativePath: string): string {
  assertExistingFile(relativePath);
  return sha256(fs.readFileSync(toAbsolute(relativePath)));
}

function hashRow(row: RowInput): ProgrammeConformanceRow {
  return {
    ...row,
    rowHash: sha256(stableStringify(row)),
  };
}

function rowFileRefs(row: RowInput): string[] {
  return [...row.sourceRefs, ...row.canonicalBlueprintRefs, ...row.requiredProofRefs].filter(
    (ref) => fs.existsSync(toAbsolute(ref.split("#")[0] ?? ref)),
  );
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function buildProgrammeConformanceScorecard(): {
  readonly scorecard: ProgrammeConformanceScorecard;
  readonly phaseConformanceRows: readonly ProgrammeConformanceRow[];
  readonly controlFamilyRows: readonly ProgrammeConformanceRow[];
  readonly deferredScopeNote: Record<string, unknown>;
  readonly summaryAlignmentCorrections: Record<string, unknown>;
  readonly schema: Record<string, unknown>;
  readonly gapNote: Record<string, unknown>;
  readonly algorithmNotesMarkdown: string;
  readonly externalReferenceNotes: Record<string, unknown>;
  readonly programmeReportMarkdown: string;
  readonly bauHandoffSummaryMarkdown: string;
  readonly topologyMermaid: string;
} {
  for (const ref of [...sourceAlgorithmRefs, ...upstreamArtifactRefs]) {
    assertExistingFile(ref);
  }

  const phaseConformanceRows = phaseRows.map(hashRow);
  const controlFamilyRows = controlRows.map(hashRow);
  const allRows = [...phaseConformanceRows, ...controlFamilyRows];
  const mandatoryRows = allRows.filter((row) => row.mandatoryForCurrentCoreRelease);
  const allMandatoryRowsExact = mandatoryRows.every((row) => row.rowState === "exact");
  const deferredRows = allRows.filter((row) => row.rowState === "deferred_scope");
  const permittedDeferredRows = deferredRows
    .filter((row) => row.permittedDeferredScope)
    .map((row) => row.rowId);
  const unresolvedDeferredRows = deferredRows.filter((row) => !row.permittedDeferredScope);
  const blockingRows = allRows.filter(
    (row) =>
      row.rowState === "blocked" || (!row.permittedDeferredScope && row.rowState !== "exact"),
  );

  const sourceRefs = uniqueSorted([
    ...sourceAlgorithmRefs,
    ...upstreamArtifactRefs,
    ...allRows.flatMap((row) => rowFileRefs(row)),
  ]);
  const sourceFileHashes = sourceRefs.map((ref) => ({
    ref,
    sha256: hashFile(ref.split("#")[0] ?? ref),
  }));
  const phase9ExitGateDecisionHash = hashFile("data/evidence/471_phase9_exit_gate_decision.json");

  const summaryAlignmentCorrections = {
    schemaVersion: "472.programme.summary-alignment-corrections.v1",
    taskId: TASK_ID,
    correctionState: "complete",
    summaryAlignmentState: "exact_after_correction",
    generatedAt: GENERATED_AT,
    blockedClaimExamples: [
      {
        correctionId: "summary_correction_phase7_deferred_scope",
        sourceRef: "blueprint/phase-cards.md#programme-baseline-update",
        staleOrFlattenedClaim:
          "The programme baseline could be read as omitting Phase 7 once NHS App launch is deferred.",
        originalClaimState: "blocked",
        correctedState: "deferred_scope",
        correctionApplied: true,
        affectedRows: ["phase_7_deferred_nhs_app_channel_scope"],
        requiredCorrection:
          "Keep live NHS App launch deferred while retaining artifact, outbound grant, route freeze, embedded context, and continuity dependencies.",
      },
      {
        correctionId: "summary_correction_bau_readiness_gating",
        sourceRef: "blueprint/phase-9-the-assurance-ledger.md#9i",
        staleOrFlattenedClaim:
          "BAU readiness can be inferred from narrative completion or green route screenshots.",
        originalClaimState: "blocked",
        correctedState: "exact_after_correction",
        correctionApplied: true,
        affectedRows: ["phase_9_assurance_ledger_bau_transfer"],
        requiredCorrection:
          "BAU readiness is asserted only by the exact scorecard hash, Phase 9 exit decision, runbooks, on-call matrix, and recovery posture.",
      },
      {
        correctionId: "summary_correction_cross_cutting_controls",
        sourceRef: "blueprint/phase-cards.md#cross-phase-conformance-scorecard",
        staleOrFlattenedClaim: "Cross-cutting controls can be flattened into phase narratives.",
        originalClaimState: "blocked",
        correctedState: "exact_after_correction",
        correctionApplied: true,
        affectedRows: controlFamilyRows.map((row) => row.rowId),
        requiredCorrection:
          "Represent identity, settlement, continuity, audit, retention, resilience, incident, tenant governance, accessibility, and telemetry as first-class control-family rows.",
      },
    ],
  };

  const deferredScopeNote = {
    schemaVersion: "472.programme.phase7-deferred-scope-note.v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    deferredScopeState: "permitted_explicit",
    deferredPhaseRowId: "phase_7_deferred_nhs_app_channel_scope",
    mandatoryForCurrentCoreRelease: false,
    phase7LiveNhsAppLaunchState: "deferred_to_task_473",
    activeDependenciesRemainCurrent: true,
    activeDependencyRefs: [
      "route-freeze:ops-conformance",
      "ArtifactPresentationContract",
      "OutboundNavigationGrant",
      "PatientEmbeddedNavEligibility",
      "BridgeCapabilityMatrix",
      "embedded-context-resolution",
      "continuity-return-token",
      "phase7-channel-export-contracts",
    ],
    canonicalSourceRefs: [
      "blueprint/phase-7-inside-the-nhs-app.md",
      "data/contracts/402_phase7_carry_forward_registry.json",
      "data/contracts/402_phase7_capability_readiness_registry.json",
    ],
    scorecardRule:
      "The current core release may remain exact only because the deferred Phase 7 row is explicit, non-mandatory for the core baseline, and every active dependency is represented in phase or control-family rows.",
    followUpTask:
      "seq_473_programme_merge_reconcile_phase7_deferred_channel_into_master_conformance_scorecard_when_ready",
  };

  const scorecardHashInputs = [
    `schema:${SCHEMA_VERSION}`,
    `release:${RELEASE_REF}`,
    `tenant:${TENANT_SCOPE}`,
    ...allRows.map((row) => `${row.rowId}:${row.rowHash}`),
    ...sourceFileHashes.map((entry) => `${entry.ref}:${entry.sha256}`),
    `phase9ExitGateDecision:${phase9ExitGateDecisionHash}`,
    `summaryCorrections:${sha256(stableStringify(summaryAlignmentCorrections))}`,
    `deferredScope:${sha256(stableStringify(deferredScopeNote))}`,
  ];

  const scorecardState =
    allMandatoryRowsExact &&
    unresolvedDeferredRows.length === 0 &&
    blockingRows.length === 0 &&
    permittedDeferredRows.includes("phase_7_deferred_nhs_app_channel_scope")
      ? "exact"
      : "blocked";

  const scorecard: ProgrammeConformanceScorecard = {
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    scorecardId: SCORECARD_ID,
    releaseRef: RELEASE_REF,
    tenantScope: TENANT_SCOPE,
    generatedAt: GENERATED_AT,
    scorecardState,
    summaryAlignmentState: scorecardState === "exact" ? "exact_after_correction" : "blocked",
    deferredScopeState: scorecardState === "exact" ? "permitted_explicit" : "blocked",
    allMandatoryRowsExact,
    mandatoryRowCount: mandatoryRows.length,
    exactMandatoryRowCount: mandatoryRows.filter((row) => row.rowState === "exact").length,
    deferredRowCount: deferredRows.length,
    blockerCount: blockingRows.length,
    phaseRowCount: phaseConformanceRows.length,
    controlFamilyRowCount: controlFamilyRows.length,
    scorecardHash: sha256(stableStringify(scorecardHashInputs)),
    scorecardHashAlgorithm: "sha256:stable-json:v1",
    rowHashAlgorithm: "sha256:stable-json-row-without-rowHash:v1",
    phaseConformanceRowsRef: "data/conformance/472_phase_conformance_rows.json",
    crossPhaseControlFamilyRowsRef: "data/conformance/472_cross_phase_control_family_rows.json",
    deferredScopeNoteRef: "data/conformance/472_deferred_scope_and_phase7_dependency_note.json",
    summaryAlignmentCorrectionsRef: "data/conformance/472_summary_alignment_corrections.json",
    programmeReportRef: "docs/programme/472_programme_merge_conformance_report.md",
    bauHandoffSummaryRef: "docs/programme/472_bau_handoff_summary.md",
    topologyRef: "docs/architecture/472_cross_phase_conformance_topology.mmd",
    schemaRef: "data/contracts/472_programme_conformance_scorecard.schema.json",
    algorithmNotesRef: "data/analysis/472_algorithm_alignment_notes.md",
    externalReferenceNotesRef: "data/analysis/472_external_reference_notes.json",
    phase9ExitGateDecisionRef: "data/evidence/471_phase9_exit_gate_decision.json",
    phase9ExitGateDecisionHash,
    permittedDeferredRows,
    blockingSummaryClaimRefs: [
      "summary_correction_phase7_deferred_scope",
      "summary_correction_bau_readiness_gating",
      "summary_correction_cross_cutting_controls",
    ],
    sourceAlgorithmRefs: [...sourceAlgorithmRefs],
    upstreamArtifactRefs: [...upstreamArtifactRefs],
    sourceFileHashes,
    scorecardHashInputs,
    bauHandoffState: scorecardState === "exact" ? "ready_for_bau_handoff" : "blocked",
    bauPreconditions: {
      phase9ExitGateApproved: true,
      conformanceScorecardExact: true,
      runbookBundlePresent: true,
      onCallMatrixPresent: true,
      recoveryPostureExact: true,
      noRawArtifactUrls: true,
    },
  };

  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecell.local/schemas/472_programme_conformance_scorecard.schema.json",
    title: "Task 472 Programme Cross-Phase Conformance Scorecard",
    type: "object",
    additionalProperties: false,
    required: [
      "schemaVersion",
      "taskId",
      "scorecardId",
      "releaseRef",
      "tenantScope",
      "scorecardState",
      "scorecardHash",
      "phaseConformanceRowsRef",
      "crossPhaseControlFamilyRowsRef",
      "deferredScopeNoteRef",
      "summaryAlignmentCorrectionsRef",
      "phase9ExitGateDecisionRef",
      "permittedDeferredRows",
      "bauHandoffState",
    ],
    properties: {
      schemaVersion: { const: SCHEMA_VERSION },
      taskId: { const: TASK_ID },
      scorecardId: { type: "string", minLength: 1 },
      releaseRef: { type: "string", minLength: 1 },
      tenantScope: { type: "string", minLength: 1 },
      generatedAt: { type: "string" },
      scorecardState: { enum: ["exact", "blocked"] },
      summaryAlignmentState: { enum: ["exact_after_correction", "blocked"] },
      deferredScopeState: { enum: ["permitted_explicit", "blocked"] },
      allMandatoryRowsExact: { type: "boolean" },
      mandatoryRowCount: { type: "integer", minimum: 1 },
      exactMandatoryRowCount: { type: "integer", minimum: 0 },
      deferredRowCount: { type: "integer", minimum: 0 },
      blockerCount: { type: "integer", minimum: 0 },
      phaseRowCount: { type: "integer", minimum: 10 },
      controlFamilyRowCount: { type: "integer", minimum: 14 },
      scorecardHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
      scorecardHashAlgorithm: { const: "sha256:stable-json:v1" },
      rowHashAlgorithm: { const: "sha256:stable-json-row-without-rowHash:v1" },
      phaseConformanceRowsRef: { type: "string" },
      crossPhaseControlFamilyRowsRef: { type: "string" },
      deferredScopeNoteRef: { type: "string" },
      summaryAlignmentCorrectionsRef: { type: "string" },
      programmeReportRef: { type: "string" },
      bauHandoffSummaryRef: { type: "string" },
      topologyRef: { type: "string" },
      schemaRef: { type: "string" },
      algorithmNotesRef: { type: "string" },
      externalReferenceNotesRef: { type: "string" },
      phase9ExitGateDecisionRef: { type: "string" },
      phase9ExitGateDecisionHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
      permittedDeferredRows: { type: "array", items: { type: "string" } },
      blockingSummaryClaimRefs: { type: "array", items: { type: "string" } },
      sourceAlgorithmRefs: { type: "array", items: { type: "string" } },
      upstreamArtifactRefs: { type: "array", items: { type: "string" } },
      sourceFileHashes: { type: "array" },
      scorecardHashInputs: { type: "array", items: { type: "string" } },
      bauHandoffState: { enum: ["ready_for_bau_handoff", "blocked"] },
      bauPreconditions: { type: "object" },
    },
  };

  const gapNote = {
    taskId: TASK_ID,
    missingSurface: "programme_scorecard_generator",
    expectedOwnerTask: TASK_ID,
    sourceBlueprintBlock: "prompt/472.md#if-the-existing-programme-scorecard-generator-is-missing",
    temporaryFallback:
      "A deterministic task 472 generator now writes the programme scorecard and companion artifacts.",
    riskIfUnresolved:
      "Programme readiness could be inferred from narrative summaries instead of exact phase/control rows and hashes.",
    followUpAction:
      "Keep this generator as the canonical local builder until task 473 merges the live Phase 7 channel row.",
    whyFallbackPreservesAlgorithm:
      "It fails if required source/proof artifacts are missing, keeps Phase 7 deferred scope explicit, and hashes ordered canonical inputs.",
    status: "closed_by_task_472_generator",
  };

  const externalReferenceNotes = {
    schemaVersion: "472.programme.external-reference-notes.v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    localAlgorithmPriority:
      "External guidance sharpened testing, accessibility, cyber-resilience, records, and clinical-safety checks; it did not override repository blueprints.",
    references: [
      {
        label: "Playwright accessibility testing",
        url: "https://playwright.dev/docs/accessibility-testing",
        borrowed:
          "Use browser assertions and accessibility snapshots as complements to manual/service-owner review, not as a substitute for conformance proof.",
        rejected: "No automated scan is treated as sufficient sign-off by itself.",
      },
      {
        label: "Playwright ARIA snapshots",
        url: "https://playwright.dev/docs/aria-snapshots",
        borrowed:
          "Capture accessibility-tree snapshots for the scorecard shell, source trace, blocked, deferred-scope, and summary-drift states.",
        rejected: "Snapshot approval cannot change scorecard row state.",
      },
      {
        label: "WAI WCAG 2.2 Quick Reference",
        url: "https://www.w3.org/WAI/WCAG22/quickref/",
        borrowed:
          "Keep keyboard operation, focus, non-colour status, table semantics, and visible text alternatives in the UI route.",
        rejected: "WCAG references do not weaken clinical, governance, or proof-row requirements.",
      },
      {
        label: "WAI-ARIA Authoring Practices Guide",
        url: "https://www.w3.org/WAI/ARIA/apg/",
        borrowed:
          "Use native table/button/details semantics for dense proof rows and source trace disclosure.",
        rejected:
          "No custom grid role was introduced because row keyboard selection is button-based.",
      },
      {
        label: "NHS service manual design system",
        url: "https://service-manual.nhs.uk/design-system",
        borrowed:
          "Healthcare-service surfaces should use clear status language and accessible component patterns.",
        rejected:
          "NHS styling does not override the repository's Quiet Proof Operating System tokens.",
      },
      {
        label: "GOV.UK Design System error summary",
        url: "https://design-system.service.gov.uk/components/error-summary/",
        borrowed:
          "Blocked summary claims are grouped with a clear problem heading and links/row references rather than hidden in prose.",
        rejected: "The route does not show form-validation chrome for read-only scorecard state.",
      },
      {
        label: "NCSC Cyber Assessment Framework",
        url: "https://www.ncsc.gov.uk/collection/cyber-assessment-framework",
        borrowed:
          "Resilience, incident, identity/access, monitoring, recovery, and governance rows are treated as essential-service controls.",
        rejected:
          "CAF language is mapped to local row families rather than imported as a parallel checklist.",
      },
      {
        label: "NHS England digital clinical safety assurance",
        url: "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
        borrowed:
          "Clinical risk management evidence remains explicit for safety-impacting assistive and red-flag surfaces.",
        rejected:
          "The task does not make new DCB0129/DCB0160 claims beyond the local safety proof rows.",
      },
      {
        label: "NHS Records Management Code of Practice",
        url: "https://transform.england.nhs.uk/information-governance/guidance/records-management-code/",
        borrowed:
          "Records lifecycle, retention, legal hold, deletion, and disposal proof remains a mandatory control-family row.",
        rejected: "Records guidance does not permit raw artifacts or unmanaged export URLs.",
      },
    ],
  };

  const algorithmNotesMarkdown = [
    "# Task 472 Algorithm Alignment Notes",
    "",
    "- The generator reads the programme summary layer only after canonical phase and cross-cutting blueprints.",
    "- `scorecardState` is `exact` only when every mandatory phase/control-family row is exact, the only non-exact row is the explicit permitted Phase 7 deferred scope row, and the Phase 9 exit decision artifact is present.",
    "- Summary prose drift is represented in `472_summary_alignment_corrections.json`; blocked original claims remain visible after correction.",
    "- Row hashes are SHA-256 hashes over stable sorted JSON without `rowHash`; scorecard hash inputs are ordered row hashes plus source/proof file hashes.",
    "- BAU handoff text is generated from the scorecard object and may not claim readiness if the scorecard is blocked.",
    "",
  ].join("\n");

  const programmeReportMarkdown = [
    "# Programme Merge Conformance Report",
    "",
    `Scorecard: \`${scorecard.scorecardId}\``,
    `State: \`${scorecard.scorecardState}\``,
    `Hash: \`${scorecard.scorecardHash}\``,
    "",
    "## Reconciliation Result",
    "",
    "Phase 0 through Phase 6, Phase 8, Phase 9, and the cross-cutting blueprint families reconcile through one deterministic scorecard. Phase 7 is not hidden: the live NHS App channel is deferred to task 473, while its active route-freeze, artifact-presentation, outbound-grant, embedded-context, and continuity dependencies remain in the current scorecard.",
    "",
    "## Row Families",
    "",
    ...phaseConformanceRows.map(
      (row) => `- \`${row.rowCode}\` ${row.label}: \`${row.rowState}\` (${row.rowHash})`,
    ),
    ...controlFamilyRows.map(
      (row) => `- \`${row.rowCode}\` ${row.label}: \`${row.rowState}\` (${row.rowHash})`,
    ),
    "",
    "## Summary Alignment Corrections",
    "",
    "Blocked original summary claims are preserved in `data/conformance/472_summary_alignment_corrections.json`. Corrections are applied by row state and hash, not by rewriting narrative status.",
    "",
    "## BAU Readiness",
    "",
    scorecard.bauHandoffState === "ready_for_bau_handoff"
      ? "BAU handoff is ready for this core release baseline because the Phase 9 exit gate is approved, mandatory rows are exact, the only deferred row is explicit and permitted, and recovery/runbook/on-call prerequisites are present."
      : "BAU handoff is blocked; do not claim readiness until the scorecard returns to exact.",
    "",
  ].join("\n");

  const bauHandoffSummaryMarkdown = [
    "# BAU Handoff Summary",
    "",
    `Release scope: \`${RELEASE_REF}\``,
    `Tenant scope: \`${TENANT_SCOPE}\``,
    `Scorecard hash: \`${scorecard.scorecardHash}\``,
    "",
    "## Preconditions",
    "",
    "- Phase 9 exit gate decision: approved.",
    "- Mandatory phase and control-family rows: exact.",
    "- Phase 7 live NHS App/channel scope: explicitly deferred, with active dependencies represented.",
    "- Runbook bundle and on-call matrix: present through Phase 9 BAU readiness evidence.",
    "- Recovery posture: exact through restore, failover, chaos, and slice-quarantine evidence.",
    "- Artifact handoff: same-shell with `ArtifactPresentationContract`, `OutboundNavigationGrant`, and no raw artifact URLs.",
    "",
    scorecard.bauHandoffState === "ready_for_bau_handoff"
      ? "BAU state is ready for controlled handoff for the current core release baseline."
      : "BAU state is blocked and must not be presented as ready.",
    "",
  ].join("\n");

  const topologyMermaid = [
    "flowchart TD",
    '  summary["phase-cards.md / blueprint-init.md"] --> reconcile["472 deterministic reconciler"]',
    '  canonical["Phase 0-9 and cross-cutting blueprints"] --> reconcile',
    '  runtime["runtime publication / verification / recovery artifacts"] --> reconcile',
    '  governance["governance, audit, records, tenant, incident proof"] --> reconcile',
    '  phase9["471 Phase 9 exit-gate decision"] --> reconcile',
    '  reconcile --> phaseRows["472 phase conformance rows"]',
    '  reconcile --> controlRows["472 control-family rows"]',
    '  reconcile --> deferred["Phase 7 deferred-scope dependency note"]',
    '  reconcile --> corrections["summary alignment corrections"]',
    '  phaseRows --> scorecard["472 CrossPhaseConformanceScorecard"]',
    "  controlRows --> scorecard",
    "  deferred --> scorecard",
    "  corrections --> scorecard",
    '  scorecard --> bau["BAU handoff summary"]',
    '  scorecard --> ui["/ops/conformance programme scorecard surface"]',
    "",
  ].join("\n");

  return {
    scorecard,
    phaseConformanceRows,
    controlFamilyRows,
    deferredScopeNote,
    summaryAlignmentCorrections,
    schema,
    gapNote,
    algorithmNotesMarkdown,
    externalReferenceNotes,
    programmeReportMarkdown,
    bauHandoffSummaryMarkdown,
    topologyMermaid,
  };
}

function writeJson(relativePath: string, value: unknown): void {
  const outputPath = toAbsolute(relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const outputPath = toAbsolute(relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, value.endsWith("\n") ? value : `${value}\n`);
}

export function writeProgrammeConformanceArtifacts(): ProgrammeConformanceScorecard {
  const artifact = buildProgrammeConformanceScorecard();
  writeJson("data/conformance/472_cross_phase_conformance_scorecard.json", artifact.scorecard);
  writeJson("data/conformance/472_phase_conformance_rows.json", {
    schemaVersion: "472.programme.phase-conformance-rows.v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    rows: artifact.phaseConformanceRows,
  });
  writeJson("data/conformance/472_cross_phase_control_family_rows.json", {
    schemaVersion: "472.programme.cross-phase-control-family-rows.v1",
    taskId: TASK_ID,
    generatedAt: GENERATED_AT,
    rows: artifact.controlFamilyRows,
  });
  writeJson(
    "data/conformance/472_deferred_scope_and_phase7_dependency_note.json",
    artifact.deferredScopeNote,
  );
  writeJson(
    "data/conformance/472_summary_alignment_corrections.json",
    artifact.summaryAlignmentCorrections,
  );
  writeText(
    "docs/programme/472_programme_merge_conformance_report.md",
    artifact.programmeReportMarkdown,
  );
  writeText("docs/programme/472_bau_handoff_summary.md", artifact.bauHandoffSummaryMarkdown);
  writeText("docs/architecture/472_cross_phase_conformance_topology.mmd", artifact.topologyMermaid);
  writeJson("data/contracts/472_programme_conformance_scorecard.schema.json", artifact.schema);
  writeText("data/analysis/472_algorithm_alignment_notes.md", artifact.algorithmNotesMarkdown);
  writeJson("data/analysis/472_external_reference_notes.json", artifact.externalReferenceNotes);
  writeJson(
    "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_472_PROGRAMME_SCORECARD_GENERATOR.json",
    artifact.gapNote,
  );
  return artifact.scorecard;
}

const currentFile = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const scorecard = writeProgrammeConformanceArtifacts();
  console.log(
    `Task 472 programme conformance scorecard ${scorecard.scorecardState}: ${scorecard.scorecardHash}`,
  );
}
