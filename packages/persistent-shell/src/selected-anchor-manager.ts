import type { ShellSlug } from "@vecells/api-contracts";
import {
  listPersistentShellSpecs,
  type PersistentShellRouteClaim,
  type RuntimeScenario,
} from "./contracts";

export const SELECTED_ANCHOR_MANAGER_TASK_ID = "par_108";
export const SELECTED_ANCHOR_MANAGER_VISUAL_MODE = "Continuity_Inspector";
export const SELECTED_ANCHOR_MANAGER_SCHEMA_PATH =
  "packages/persistent-shell/contracts/selected-anchor-manager.schema.json";
export const SELECTED_ANCHOR_MANAGER_STORAGE_PREFIX = "selected-anchor-manager";
export const SELECTED_ANCHOR_MANAGER_SOURCE_PRECEDENCE = [
  "prompt/108.md",
  "prompt/shared_operating_contract_106_to_115.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "blueprint/platform-frontend-blueprint.md#1.1 PersistentShell",
  "blueprint/platform-frontend-blueprint.md#1.1I ContinuityRestorePlan",
  "blueprint/platform-frontend-blueprint.md#1.17 SelectedAnchor",
  "blueprint/platform-frontend-blueprint.md#2.9 ContinuityOrchestrator",
  "blueprint/platform-frontend-blueprint.md#2.10 SelectedAnchorPreserver",
  "blueprint/platform-frontend-blueprint.md#RouteAdjacencyContract",
  "blueprint/platform-frontend-blueprint.md#SelectedAnchorPolicy",
  "blueprint/platform-frontend-blueprint.md#NavigationStateLedger",
  "blueprint/patient-portal-experience-architecture-blueprint.md#PatientSelectedAnchorPolicy",
  "blueprint/patient-portal-experience-architecture-blueprint.md#PatientNavReturnContract",
  "blueprint/staff-workspace-interface-architecture.md#WorkspaceSelectedAnchorPolicy",
  "blueprint/operations-console-frontend-blueprint.md#2. Shell, continuity, and routes",
  "blueprint/governance-admin-console-frontend-blueprint.md#Core shell responsibilities",
  "blueprint/phase-5-the-network-horizon.md#Hub shell",
  "blueprint/pharmacy-console-frontend-architecture.md#Phase 0 shell law",
  "blueprint/accessibility-and-content-system-contract.md#FocusTransitionContract",
  "blueprint/forensic-audit-findings.md#Finding 86",
  "blueprint/forensic-audit-findings.md#Finding 97",
  "blueprint/forensic-audit-findings.md#Finding 98",
  "blueprint/forensic-audit-findings.md#Finding 100",
  "blueprint/forensic-audit-findings.md#Finding 101",
  "blueprint/forensic-audit-findings.md#Finding 119",
  "blueprint/forensic-audit-findings.md#Finding 120",
  "docs/architecture/106_persistent_shell_framework.md",
  "docs/architecture/107_status_strip_case_pulse_and_freshness_chip.md",
] as const;

export type SelectedAnchorType =
  | "slot"
  | "provider"
  | "pharmacy"
  | "queue_row"
  | "message"
  | "evidence_cluster"
  | "comparison_candidate"
  | "action_card";
export type AnchorStabilityState =
  | "stable"
  | "validating"
  | "pending"
  | "invalidated"
  | "recovered"
  | "replaced";
export type PreserveUntil =
  | "settle"
  | "review_acknowledged"
  | "explicit_dismiss"
  | "entity_switch";
export type DisclosurePosture =
  | "calm_closed"
  | "detail_open"
  | "compare_open"
  | "review_open"
  | "recovery_notice";
export type RestoreState =
  | "idle"
  | "restoring"
  | "restored"
  | "stale_stub"
  | "recovery_required";
export type ReturnContractPosture =
  | "full_restore"
  | "partial_restore"
  | "read_only_preserve"
  | "recovery_required_return";
export type RestoreStepKey = "anchor" | "scroll" | "disclosure" | "focus";
export type RouteAdjacencyType =
  | "same_route"
  | "same_object_child"
  | "same_object_peer"
  | "same_shell_object_switch"
  | "cross_shell_boundary";
export type HistoryPolicy = "push" | "replace" | "none";
export type AnchorDisposition =
  | "preserve"
  | "preserve_read_only"
  | "replace_with_acknowledgement"
  | "preserve_stub_and_fallback"
  | "reset_to_route_default";
export type FocusDisposition =
  | "restore_selected_anchor"
  | "focus_invalidated_stub"
  | "focus_primary_region"
  | "focus_recovery_notice";
export type ReplacementRequirement =
  | "silent_patch_allowed"
  | "acknowledgement_required"
  | "stub_required";
export type InvalidationState =
  | "anchor_valid"
  | "anchor_stale_recoverable"
  | "anchor_replaced_acknowledgement_required"
  | "anchor_unavailable_preserve_stub";
export type ContinuityEventKind =
  | "selection"
  | "navigation"
  | "refresh_restore"
  | "invalidation"
  | "replacement_acknowledged"
  | "recovery";

export interface SelectedAnchorPolicy {
  policyId: string;
  routeFamilyRef: string;
  shellSlug: ShellSlug;
  primaryAnchorSlotRef: string;
  secondaryAnchorSlotRefs: readonly string[];
  anchorType: SelectedAnchorType;
  invalidationPresentationRef: string;
  replacementRequirementRef: ReplacementRequirement;
  releaseRuleRefs: readonly string[];
  refreshRestoreOrderRef: string;
  restoreOrder: readonly RestoreStepKey[];
  fallbackAnchorRef: string;
  policyVersionRef: string;
  sourceRefs: readonly string[];
  gapResolutions: readonly string[];
}

export interface SelectedAnchor {
  anchorId: string;
  anchorKey: string;
  routeFamilyRef: string;
  shellSlug: ShellSlug;
  entityRef: string;
  anchorType: SelectedAnchorType;
  hostSurfaceRef: string;
  continuityFrameRef: string;
  governingObjectVersionRef: string;
  anchorTupleHash: string;
  visualIdentityRef: string;
  stabilityState: AnchorStabilityState;
  fallbackAlternativesRef: readonly string[];
  invalidatingReasonRefs: readonly string[];
  replacementAnchorRef: string | null;
  compareAnchorRefs: readonly string[];
  preserveUntil: PreserveUntil;
  lastKnownLabel: string;
  lastKnownPositionRef: string;
  lastValidatedAt: string;
  sourceRefs: readonly string[];
}

export interface SelectedAnchorStub {
  stubId: string;
  routeFamilyRef: string;
  shellSlug: ShellSlug;
  originalAnchorId: string;
  originalAnchorTupleHash: string;
  invalidationState: InvalidationState;
  explanation: string;
  replacementAnchorRef: string | null;
  nearestSafeAnchorRef: string | null;
  acknowledgementRequired: boolean;
  sourceRefs: readonly string[];
}

export interface RouteAdjacencyContract {
  contractId: string;
  fromRouteFamilyRef: string;
  toRouteFamilyRef: string;
  shellSlug: ShellSlug;
  adjacencyType: RouteAdjacencyType;
  historyPolicy: HistoryPolicy;
  anchorDispositionRef: AnchorDisposition;
  focusDispositionRef: FocusDisposition;
  preserveScroll: boolean;
  preserveDisclosurePosture: boolean;
  defaultReturnPosture: ReturnContractPosture;
  sourceRefs: readonly string[];
}

export interface ReturnContract {
  returnContractId: string;
  shellSlug: ShellSlug;
  originRouteFamilyRef: string;
  currentRouteFamilyRef: string;
  childRouteFamilyRef: string | null;
  preservedAnchorId: string;
  preservedAnchorTupleHash: string;
  posture: ReturnContractPosture;
  returnLabel: string;
  safeFallbackRouteFamilyRef: string;
  sourceRefs: readonly string[];
}

export interface NavigationRestoreStep {
  routeFamilyRef: string;
  posture: ReturnContractPosture;
  stepKey: RestoreStepKey;
  order: number;
  description: string;
  sourceRefs: readonly string[];
}

export interface NavigationLedgerEntry {
  epoch: number;
  routeFamilyRef: string;
  selectedAnchorId: string;
  selectedAnchorTupleHash: string;
  disclosurePosture: DisclosurePosture;
  scrollAnchorRef: string;
  focusRestoreTargetRef: string;
  restoreState: RestoreState;
  returnContractId: string | null;
  recordedAt: string;
}

export interface NavigationStateLedger {
  ledgerId: string;
  shellSlug: ShellSlug;
  ledgerEpoch: number;
  shellContinuityKey: string;
  activeRouteFamilyRef: string;
  restoreState: RestoreState;
  entries: readonly NavigationLedgerEntry[];
  sourceRefs: readonly string[];
}

export interface ContinuityEvent {
  eventId: string;
  kind: ContinuityEventKind;
  label: string;
  detail: string;
  routeFamilyRef: string;
  restoreEpoch: number;
  sourceRefs: readonly string[];
}

export interface ContinuitySnapshot {
  taskId: string;
  shellSlug: ShellSlug;
  activeRouteFamilyRef: string;
  runtimeScenario: RuntimeScenario;
  selectedAnchor: SelectedAnchor;
  disclosurePosture: DisclosurePosture;
  scrollAnchorRef: string;
  focusRestoreTargetRef: string;
  missionStackFoldState: "folded" | "expanded";
  navigationLedger: NavigationStateLedger;
  currentReturnContract: ReturnContract | null;
  currentStub: SelectedAnchorStub | null;
  restoreOrder: readonly NavigationRestoreStep[];
  timeline: readonly ContinuityEvent[];
}

export interface ContinuityTransitionResult {
  snapshot: ContinuitySnapshot;
  adjacency: RouteAdjacencyContract;
  returnContract: ReturnContract | null;
  restoreOrder: readonly NavigationRestoreStep[];
}

export interface ReturnContractScenarioStep {
  stepId: string;
  label: string;
  routeFamilyRef: string;
  selectedAnchorLabel: string;
  returnPosture: ReturnContractPosture;
  invalidationState: InvalidationState;
  focusTargetRef: string;
  scrollAnchorRef: string;
  disclosurePosture: DisclosurePosture;
  returnLabel: string | null;
  stubLabel: string | null;
  detail: string;
}

export interface ReturnContractScenario {
  scenarioId: string;
  shellSlug: ShellSlug;
  title: string;
  audience: string;
  summary: string;
  routeSequence: readonly string[];
  steps: readonly ReturnContractScenarioStep[];
  sourceRefs: readonly string[];
}

export interface SelectedAnchorManagerArtifacts {
  publication: {
    task_id: string;
    visual_mode: string;
    summary: {
      route_count: number;
      policy_count: number;
      adjacency_count: number;
      restore_step_count: number;
      scenario_count: number;
      gap_resolution_count: number;
      follow_on_dependency_count: number;
    };
    selected_anchor_policies: readonly SelectedAnchorPolicy[];
    route_adjacency_contracts: readonly RouteAdjacencyContract[];
    restore_orders: readonly NavigationRestoreStep[];
    scenario_examples: readonly ReturnContractScenario[];
    gap_resolutions: readonly string[];
    follow_on_dependencies: readonly string[];
    source_refs: readonly string[];
  };
  policyRows: readonly Record<string, string>[];
  adjacencyRows: readonly Record<string, string>[];
  restoreOrderRows: readonly Record<string, string>[];
}

const SOURCE_PLATFORM_FRONTEND = "blueprint/platform-frontend-blueprint.md";
const SOURCE_PATIENT = "blueprint/patient-portal-experience-architecture-blueprint.md";
const SOURCE_STAFF = "blueprint/staff-workspace-interface-architecture.md";
const SOURCE_SUPPORT = "blueprint/staff-operations-and-support-blueprint.md";
const SOURCE_OPERATIONS = "blueprint/operations-console-frontend-blueprint.md";
const SOURCE_GOVERNANCE = "blueprint/governance-admin-console-frontend-blueprint.md";
const SOURCE_HUB = "blueprint/phase-5-the-network-horizon.md";
const SOURCE_PHARMACY = "blueprint/pharmacy-console-frontend-architecture.md";
const SOURCE_ACCESSIBILITY = "blueprint/accessibility-and-content-system-contract.md";
const SOURCE_FORENSICS = "blueprint/forensic-audit-findings.md";

const MOCK_TIMESTAMPS = [
  "2026-04-13T08:15:00Z",
  "2026-04-13T08:16:00Z",
  "2026-04-13T08:17:00Z",
  "2026-04-13T08:18:00Z",
  "2026-04-13T08:19:00Z",
  "2026-04-13T08:20:00Z",
  "2026-04-13T08:21:00Z",
  "2026-04-13T08:22:00Z",
  "2026-04-13T08:23:00Z",
] as const;

const FOLLOW_ON_DEPENDENCIES = [
  "FOLLOW_ON_DEPENDENCY_PATIENT_RECORD_FOLLOW_UP_CHILD_ROUTE_TASK_109",
  "FOLLOW_ON_DEPENDENCY_WORKSPACE_EVIDENCE_CLUSTER_RETURN_COPY_TASK_116",
  "FOLLOW_ON_DEPENDENCY_GOVERNANCE_APPROVAL_DRILL_ROUTE_TASK_119",
  "FOLLOW_ON_DEPENDENCY_PHARMACY_INTERVENTION_CHILD_ROUTE_TASK_120",
] as const;

const routeClaims = listPersistentShellSpecs().flatMap((shell) => shell.routeClaims);
const routeClaimByRef = new Map(routeClaims.map((route) => [route.routeFamilyRef, route]));

function expectRouteClaim(routeFamilyRef: string): PersistentShellRouteClaim {
  const route = routeClaimByRef.get(routeFamilyRef);
  if (!route) {
    throw new Error(`SELECTED_ANCHOR_ROUTE_NOT_FOUND:${routeFamilyRef}`);
  }
  return route;
}

function hashOf(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `tup_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function titleCase(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function timestampAt(index: number): string {
  const fallback = MOCK_TIMESTAMPS[MOCK_TIMESTAMPS.length - 1];
  if (!fallback) {
    throw new Error("SELECTED_ANCHOR_MANAGER_TIMESTAMPS_EMPTY");
  }
  return MOCK_TIMESTAMPS[index] ?? fallback;
}

function audienceSourceRef(route: PersistentShellRouteClaim): string {
  switch (route.shellFamily) {
    case "patient":
      return SOURCE_PATIENT;
    case "staff":
      return SOURCE_STAFF;
    case "support":
      return SOURCE_SUPPORT;
    case "operations":
      return SOURCE_OPERATIONS;
    case "hub":
      return SOURCE_HUB;
    case "governance":
      return SOURCE_GOVERNANCE;
    case "pharmacy":
      return SOURCE_PHARMACY;
  }
}

function inferAnchorType(route: PersistentShellRouteClaim): SelectedAnchorType {
  switch (route.routeFamilyRef) {
    case "rf_patient_appointments":
      return "slot";
    case "rf_patient_messages":
    case "rf_patient_secure_link_recovery":
    case "rf_support_replay_observe":
      return "message";
    case "rf_patient_health_record":
    case "rf_governance_shell":
      return "evidence_cluster";
    case "rf_hub_case_management":
      return "comparison_candidate";
    case "rf_pharmacy_console":
      return "pharmacy";
    case "rf_intake_self_service":
    case "rf_intake_telephony_capture":
      return "action_card";
    default:
      return route.shellFamily === "patient" ? "action_card" : "queue_row";
  }
}

function inferReplacementRequirement(
  route: PersistentShellRouteClaim,
): ReplacementRequirement {
  switch (route.shellFamily) {
    case "operations":
    case "governance":
    case "hub":
    case "pharmacy":
    case "support":
      return "acknowledgement_required";
    case "patient":
      return route.residency === "bounded_stage"
        ? "stub_required"
        : "acknowledgement_required";
    case "staff":
      return route.residency === "same_shell_object_switch"
        ? "acknowledgement_required"
        : "silent_patch_allowed";
  }
}

function inferInvalidationPresentation(route: PersistentShellRouteClaim): string {
  switch (route.shellFamily) {
    case "patient":
      return "present_nearest_safe_anchor_with_stub";
    case "staff":
    case "support":
      return "present_queue_row_stub_and_quiet_return";
    case "operations":
      return "present_watchpoint_stub_with_guardrail_summary";
    case "hub":
      return "present_ranked_option_stub_and_candidate_fallback";
    case "governance":
      return "present_diff_anchor_stub_and_review_ack_notice";
    case "pharmacy":
      return "present_checkpoint_stub_and_next_safe_lane";
  }
}

function inferReleaseRules(route: PersistentShellRouteClaim): readonly string[] {
  const rules = ["release::explicit_dismiss", "release::settled"];
  if (route.shellFamily !== "patient") {
    rules.push("release::review_acknowledged");
  }
  if (route.residency === "same_shell_object_switch") {
    rules.push("release::entity_switch");
  }
  return rules;
}

function inferRestoreOrder(route: PersistentShellRouteClaim): readonly RestoreStepKey[] {
  if (route.residency === "bounded_stage") {
    return ["anchor", "disclosure", "scroll", "focus"];
  }
  if (route.shellFamily === "governance" || route.shellFamily === "operations") {
    return ["anchor", "scroll", "disclosure", "focus"];
  }
  return ["anchor", "scroll", "disclosure", "focus"];
}

function inferGapResolutions(route: PersistentShellRouteClaim): readonly string[] {
  const gaps: string[] = [];
  if (route.shellFamily === "hub") {
    gaps.push("GAP_RESOLUTION_SELECTED_ANCHOR_IDENTITY_HUB_OPTION_V1");
  }
  if (route.shellFamily === "operations") {
    gaps.push("GAP_RESOLUTION_SELECTED_ANCHOR_IDENTITY_OPERATIONS_WATCHPOINT_V1");
  }
  if (route.routeFamilyRef === "rf_governance_shell") {
    gaps.push("GAP_RESOLUTION_SELECTED_ANCHOR_IDENTITY_GOVERNANCE_DIFF_V1");
  }
  if (route.routeFamilyRef === "rf_patient_health_record") {
    gaps.push("GAP_RESOLUTION_RETURN_POSTURE_PATIENT_RECORD_RECOVERY_V1");
  }
  if (route.shellFamily === "pharmacy") {
    gaps.push("GAP_RESOLUTION_SELECTED_ANCHOR_IDENTITY_PHARMACY_CHECKPOINT_V1");
  }
  return gaps;
}

function fallbackAnchorForRoute(route: PersistentShellRouteClaim): string {
  return route.anchors.find((anchor) => anchor !== route.defaultAnchor) ?? route.defaultAnchor;
}

function buildSelectedAnchorPolicy(
  route: PersistentShellRouteClaim,
): SelectedAnchorPolicy {
  return {
    policyId: `sap::${route.routeFamilyRef}`,
    routeFamilyRef: route.routeFamilyRef,
    shellSlug: route.shellSlug,
    primaryAnchorSlotRef: `slot.${route.routeFamilyRef}.primary`,
    secondaryAnchorSlotRefs: route.anchors.slice(1).map((anchor) => `slot.${route.routeFamilyRef}.${anchor}`),
    anchorType: inferAnchorType(route),
    invalidationPresentationRef: inferInvalidationPresentation(route),
    replacementRequirementRef: inferReplacementRequirement(route),
    releaseRuleRefs: inferReleaseRules(route),
    refreshRestoreOrderRef: `restore_order.${route.routeFamilyRef}`,
    restoreOrder: inferRestoreOrder(route),
    fallbackAnchorRef: fallbackAnchorForRoute(route),
    policyVersionRef: `SAP_108_${route.routeFamilyRef.toUpperCase()}_V1`,
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, audienceSourceRef(route), SOURCE_ACCESSIBILITY, ...route.sourceRefs],
    gapResolutions: inferGapResolutions(route),
  };
}

const selectedAnchorPolicies = routeClaims.map(buildSelectedAnchorPolicy);
const policyByRoute = new Map(
  selectedAnchorPolicies.map((policy) => [policy.routeFamilyRef, policy]),
);
const gapResolutions = Array.from(
  new Set(selectedAnchorPolicies.flatMap((policy) => policy.gapResolutions)),
);

export function listSelectedAnchorPolicies(): readonly SelectedAnchorPolicy[] {
  return selectedAnchorPolicies;
}

export function getSelectedAnchorPolicy(routeFamilyRef: string): SelectedAnchorPolicy {
  const policy = policyByRoute.get(routeFamilyRef);
  if (!policy) {
    throw new Error(`SELECTED_ANCHOR_POLICY_NOT_FOUND:${routeFamilyRef}`);
  }
  return policy;
}

function deriveAdjacencyType(
  fromRoute: PersistentShellRouteClaim,
  toRoute: PersistentShellRouteClaim,
): RouteAdjacencyType {
  if (fromRoute.shellSlug !== toRoute.shellSlug) {
    return "cross_shell_boundary";
  }
  if (fromRoute.routeFamilyRef === toRoute.routeFamilyRef) {
    return "same_route";
  }
  if (fromRoute.continuityKey === toRoute.continuityKey) {
    return fromRoute.residency === "same_shell_child" ||
      toRoute.residency === "same_shell_child"
      ? "same_object_child"
      : "same_object_peer";
  }
  return "same_shell_object_switch";
}

function defaultHistoryPolicy(adjacencyType: RouteAdjacencyType): HistoryPolicy {
  switch (adjacencyType) {
    case "same_route":
      return "none";
    case "same_object_child":
      return "replace";
    case "same_object_peer":
    case "same_shell_object_switch":
    case "cross_shell_boundary":
      return "push";
  }
}

function defaultAnchorDisposition(
  fromRoute: PersistentShellRouteClaim,
  toRoute: PersistentShellRouteClaim,
): AnchorDisposition {
  const adjacencyType = deriveAdjacencyType(fromRoute, toRoute);
  if (adjacencyType === "same_route" || adjacencyType === "same_object_child") {
    return "preserve";
  }
  if (adjacencyType === "same_object_peer") {
    return "preserve";
  }
  if (adjacencyType === "cross_shell_boundary") {
    return "reset_to_route_default";
  }
  const replacementRequirement = getSelectedAnchorPolicy(
    toRoute.routeFamilyRef,
  ).replacementRequirementRef;
  if (replacementRequirement === "acknowledgement_required") {
    return "replace_with_acknowledgement";
  }
  if (replacementRequirement === "stub_required") {
    return "preserve_stub_and_fallback";
  }
  return "reset_to_route_default";
}

function defaultFocusDisposition(
  anchorDisposition: AnchorDisposition,
): FocusDisposition {
  switch (anchorDisposition) {
    case "preserve":
    case "preserve_read_only":
      return "restore_selected_anchor";
    case "replace_with_acknowledgement":
    case "preserve_stub_and_fallback":
      return "focus_invalidated_stub";
    case "reset_to_route_default":
      return "focus_primary_region";
  }
}

function defaultReturnPosture(
  adjacencyType: RouteAdjacencyType,
): ReturnContractPosture {
  switch (adjacencyType) {
    case "same_route":
    case "same_object_child":
      return "full_restore";
    case "same_object_peer":
    case "same_shell_object_switch":
      return "partial_restore";
    case "cross_shell_boundary":
      return "recovery_required_return";
  }
}

function buildRouteAdjacencyContract(
  fromRoute: PersistentShellRouteClaim,
  toRoute: PersistentShellRouteClaim,
): RouteAdjacencyContract {
  const adjacencyType = deriveAdjacencyType(fromRoute, toRoute);
  const anchorDispositionRef = defaultAnchorDisposition(fromRoute, toRoute);
  const focusDispositionRef = defaultFocusDisposition(anchorDispositionRef);
  return {
    contractId: `rac::${fromRoute.routeFamilyRef}::${toRoute.routeFamilyRef}`,
    fromRouteFamilyRef: fromRoute.routeFamilyRef,
    toRouteFamilyRef: toRoute.routeFamilyRef,
    shellSlug: fromRoute.shellSlug,
    adjacencyType,
    historyPolicy: defaultHistoryPolicy(adjacencyType),
    anchorDispositionRef,
    focusDispositionRef,
    preserveScroll: adjacencyType !== "cross_shell_boundary",
    preserveDisclosurePosture:
      adjacencyType === "same_route" || adjacencyType === "same_object_child",
    defaultReturnPosture: defaultReturnPosture(adjacencyType),
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, audienceSourceRef(toRoute), ...toRoute.sourceRefs],
  };
}

const routeAdjacencyContracts = routeClaims.flatMap((fromRoute) =>
  routeClaims
    .filter((toRoute) => toRoute.shellSlug === fromRoute.shellSlug)
    .map((toRoute) => buildRouteAdjacencyContract(fromRoute, toRoute)),
);

const routeAdjacencyByKey = new Map(
  routeAdjacencyContracts.map((contract) => [
    `${contract.fromRouteFamilyRef}::${contract.toRouteFamilyRef}`,
    contract,
  ]),
);

export function listRouteAdjacencyContracts(): readonly RouteAdjacencyContract[] {
  return routeAdjacencyContracts;
}

export function getRouteAdjacencyContract(
  fromRouteFamilyRef: string,
  toRouteFamilyRef: string,
): RouteAdjacencyContract {
  const contract = routeAdjacencyByKey.get(`${fromRouteFamilyRef}::${toRouteFamilyRef}`);
  if (!contract) {
    throw new Error(
      `ROUTE_ADJACENCY_CONTRACT_NOT_FOUND:${fromRouteFamilyRef}:${toRouteFamilyRef}`,
    );
  }
  return contract;
}

function routeAnchorPosition(route: PersistentShellRouteClaim, anchorKey: string): string {
  const position = route.anchors.indexOf(anchorKey);
  return position >= 0 ? `position.${route.routeFamilyRef}.${position}` : `position.${route.routeFamilyRef}.unknown`;
}

export function createSelectedAnchor(input: {
  routeFamilyRef: string;
  anchorKey: string;
  timestamp?: string;
  stabilityState?: AnchorStabilityState;
  invalidatingReasonRefs?: readonly string[];
  replacementAnchorRef?: string | null;
  compareAnchorRefs?: readonly string[];
  preserveUntil?: PreserveUntil;
}): SelectedAnchor {
  const route = expectRouteClaim(input.routeFamilyRef);
  const policy = getSelectedAnchorPolicy(input.routeFamilyRef);
  const timestamp = input.timestamp ?? timestampAt(0);
  const anchorKey = route.anchors.includes(input.anchorKey)
    ? input.anchorKey
    : route.defaultAnchor;
  const tupleSeed = [
    route.routeFamilyRef,
    anchorKey,
    route.entityKeyRef,
    policy.anchorType,
    policy.policyVersionRef,
  ].join("|");
  return {
    anchorId: `sa::${route.routeFamilyRef}::${anchorKey}`,
    anchorKey,
    routeFamilyRef: route.routeFamilyRef,
    shellSlug: route.shellSlug,
    entityRef: `${route.entityKeyRef}::${anchorKey}`,
    anchorType: policy.anchorType,
    hostSurfaceRef: `surface.${route.routeFamilyRef}.primary`,
    continuityFrameRef: route.continuityKey,
    governingObjectVersionRef: `${route.routeFamilyRef}.governing.v1`,
    anchorTupleHash: hashOf(tupleSeed),
    visualIdentityRef: `visual.${route.routeFamilyRef}.${anchorKey}`,
    stabilityState: input.stabilityState ?? "stable",
    fallbackAlternativesRef: route.anchors
      .filter((candidate) => candidate !== anchorKey)
      .map((candidate) => `sa::${route.routeFamilyRef}::${candidate}`),
    invalidatingReasonRefs: input.invalidatingReasonRefs ?? [],
    replacementAnchorRef: input.replacementAnchorRef ?? null,
    compareAnchorRefs: input.compareAnchorRefs ?? [],
    preserveUntil: input.preserveUntil ?? "explicit_dismiss",
    lastKnownLabel: titleCase(anchorKey),
    lastKnownPositionRef: routeAnchorPosition(route, anchorKey),
    lastValidatedAt: timestamp,
    sourceRefs: policy.sourceRefs,
  };
}

function buildRestoreSteps(
  routeFamilyRef: string,
  posture: ReturnContractPosture,
  selectedAnchor: SelectedAnchor,
): readonly NavigationRestoreStep[] {
  const policy = getSelectedAnchorPolicy(routeFamilyRef);
  return policy.restoreOrder.map((stepKey, index) => ({
    routeFamilyRef,
    posture,
    stepKey,
    order: index + 1,
    description:
      stepKey === "anchor"
        ? `Restore the exact anchor tuple ${selectedAnchor.anchorTupleHash} first.`
        : stepKey === "scroll"
          ? `Restore the scroll anchor tied to ${selectedAnchor.anchorKey}.`
          : stepKey === "disclosure"
            ? `Restore bounded disclosure posture for ${routeFamilyRef}.`
            : `Move focus to the preserved ${selectedAnchor.anchorKey} surface or its stub.`,
    sourceRefs: policy.sourceRefs,
  }));
}

function appendLedgerEntry(
  snapshot: ContinuitySnapshot,
  input: {
    routeFamilyRef: string;
    selectedAnchor: SelectedAnchor;
    disclosurePosture: DisclosurePosture;
    scrollAnchorRef: string;
    focusRestoreTargetRef: string;
    restoreState: RestoreState;
    returnContractId: string | null;
    recordedAt: string;
  },
): NavigationStateLedger {
  const entry: NavigationLedgerEntry = {
    epoch: snapshot.navigationLedger.ledgerEpoch + 1,
    routeFamilyRef: input.routeFamilyRef,
    selectedAnchorId: input.selectedAnchor.anchorId,
    selectedAnchorTupleHash: input.selectedAnchor.anchorTupleHash,
    disclosurePosture: input.disclosurePosture,
    scrollAnchorRef: input.scrollAnchorRef,
    focusRestoreTargetRef: input.focusRestoreTargetRef,
    restoreState: input.restoreState,
    returnContractId: input.returnContractId,
    recordedAt: input.recordedAt,
  };
  return {
    ...snapshot.navigationLedger,
    ledgerEpoch: entry.epoch,
    activeRouteFamilyRef: input.routeFamilyRef,
    restoreState: input.restoreState,
    entries: [...snapshot.navigationLedger.entries.slice(-7), entry],
  };
}

function buildEvent(
  snapshot: ContinuitySnapshot,
  input: {
    kind: ContinuityEventKind;
    label: string;
    detail: string;
    routeFamilyRef: string;
  },
): ContinuityEvent {
  return {
    eventId: `ce::${snapshot.navigationLedger.ledgerEpoch + 1}::${input.kind}`,
    kind: input.kind,
    label: input.label,
    detail: input.detail,
    routeFamilyRef: input.routeFamilyRef,
    restoreEpoch: snapshot.navigationLedger.ledgerEpoch + 1,
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_ACCESSIBILITY],
  };
}

export function createInitialContinuitySnapshot(input: {
  shellSlug: ShellSlug;
  routeFamilyRef: string;
  anchorKey?: string;
  runtimeScenario?: RuntimeScenario;
  missionStackFoldState?: "folded" | "expanded";
  timestamp?: string;
}): ContinuitySnapshot {
  const route = expectRouteClaim(input.routeFamilyRef);
  const timestamp = input.timestamp ?? timestampAt(0);
  const selectedAnchor = createSelectedAnchor({
    routeFamilyRef: route.routeFamilyRef,
    anchorKey: input.anchorKey ?? route.defaultAnchor,
    timestamp,
  });
  const restoreOrder = buildRestoreSteps(
    route.routeFamilyRef,
    "full_restore",
    selectedAnchor,
  );
  const ledger: NavigationStateLedger = {
    ledgerId: `nsl::${input.shellSlug}`,
    shellSlug: input.shellSlug,
    ledgerEpoch: 1,
    shellContinuityKey: route.continuityKey,
    activeRouteFamilyRef: route.routeFamilyRef,
    restoreState: "idle",
    entries: [
      {
        epoch: 1,
        routeFamilyRef: route.routeFamilyRef,
        selectedAnchorId: selectedAnchor.anchorId,
        selectedAnchorTupleHash: selectedAnchor.anchorTupleHash,
        disclosurePosture: "calm_closed",
        scrollAnchorRef: `scroll.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`,
        focusRestoreTargetRef: `focus.${selectedAnchor.anchorId}`,
        restoreState: "idle",
        returnContractId: null,
        recordedAt: timestamp,
      },
    ],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, audienceSourceRef(route), SOURCE_ACCESSIBILITY],
  };
  return {
    taskId: SELECTED_ANCHOR_MANAGER_TASK_ID,
    shellSlug: input.shellSlug,
    activeRouteFamilyRef: route.routeFamilyRef,
    runtimeScenario: input.runtimeScenario ?? "live",
    selectedAnchor,
    disclosurePosture: "calm_closed",
    scrollAnchorRef: `scroll.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`,
    focusRestoreTargetRef: `focus.${selectedAnchor.anchorId}`,
    missionStackFoldState: input.missionStackFoldState ?? "expanded",
    navigationLedger: ledger,
    currentReturnContract: null,
    currentStub: null,
    restoreOrder,
    timeline: [
      {
        eventId: "ce::1::selection",
        kind: "selection",
        label: "Shell continuity seeded",
        detail: "The first selected anchor tuple is now the source of truth for same-shell return.",
        routeFamilyRef: route.routeFamilyRef,
        restoreEpoch: 1,
        sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_ACCESSIBILITY],
      },
    ],
  };
}

export function selectAnchorInSnapshot(
  snapshot: ContinuitySnapshot,
  anchorKey: string,
  timestamp: string = timestampAt(1),
): ContinuitySnapshot {
  const route = expectRouteClaim(snapshot.activeRouteFamilyRef);
  const nextAnchor = createSelectedAnchor({
    routeFamilyRef: route.routeFamilyRef,
    anchorKey,
    timestamp,
  });
  const focusRestoreTargetRef = `focus.${nextAnchor.anchorId}`;
  const ledger = appendLedgerEntry(snapshot, {
    routeFamilyRef: route.routeFamilyRef,
    selectedAnchor: nextAnchor,
    disclosurePosture: snapshot.disclosurePosture,
    scrollAnchorRef: `scroll.${route.routeFamilyRef}.${nextAnchor.anchorKey}`,
    focusRestoreTargetRef,
    restoreState: "idle",
    returnContractId: snapshot.currentReturnContract?.returnContractId ?? null,
    recordedAt: timestamp,
  });
  return {
    ...snapshot,
    selectedAnchor: nextAnchor,
    scrollAnchorRef: `scroll.${route.routeFamilyRef}.${nextAnchor.anchorKey}`,
    focusRestoreTargetRef,
    navigationLedger: ledger,
    timeline: [
      ...snapshot.timeline.slice(-7),
      buildEvent(snapshot, {
        kind: "selection",
        label: "Selected anchor updated",
        detail: `Pinned ${nextAnchor.lastKnownLabel} as the active continuity tuple.`,
        routeFamilyRef: route.routeFamilyRef,
      }),
    ],
  };
}

function resolveRuntimeReturnPosture(
  defaultPosture: ReturnContractPosture,
  runtimeScenario: RuntimeScenario,
): ReturnContractPosture {
  if (runtimeScenario === "read_only") {
    return "read_only_preserve";
  }
  if (runtimeScenario === "recovery_only" || runtimeScenario === "blocked") {
    return "recovery_required_return";
  }
  return defaultPosture;
}

function createReturnContract(
  snapshot: ContinuitySnapshot,
  candidateRouteFamilyRef: string,
  posture: ReturnContractPosture,
): ReturnContract {
  const originRoute = expectRouteClaim(snapshot.activeRouteFamilyRef);
  const candidateRoute = expectRouteClaim(candidateRouteFamilyRef);
  return {
    returnContractId: `rc::${originRoute.routeFamilyRef}::${candidateRoute.routeFamilyRef}::${snapshot.selectedAnchor.anchorTupleHash}`,
    shellSlug: snapshot.shellSlug,
    originRouteFamilyRef: originRoute.routeFamilyRef,
    currentRouteFamilyRef: candidateRoute.routeFamilyRef,
    childRouteFamilyRef:
      candidateRoute.residency === "same_shell_child" ? candidateRoute.routeFamilyRef : null,
    preservedAnchorId: snapshot.selectedAnchor.anchorId,
    preservedAnchorTupleHash: snapshot.selectedAnchor.anchorTupleHash,
    posture,
    returnLabel: `Returning to ${originRoute.title} / ${snapshot.selectedAnchor.lastKnownLabel}`,
    safeFallbackRouteFamilyRef: originRoute.routeFamilyRef,
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, audienceSourceRef(candidateRoute), SOURCE_ACCESSIBILITY],
  };
}

function focusTargetForDisposition(
  anchorDisposition: AnchorDisposition,
  selectedAnchor: SelectedAnchor,
  posture: ReturnContractPosture,
): string {
  if (posture === "recovery_required_return") {
    return "focus.recovery.notice";
  }
  if (
    anchorDisposition === "replace_with_acknowledgement" ||
    anchorDisposition === "preserve_stub_and_fallback"
  ) {
    return `focus.stub.${selectedAnchor.routeFamilyRef}.${selectedAnchor.anchorKey}`;
  }
  if (anchorDisposition === "reset_to_route_default") {
    return `focus.region.${selectedAnchor.routeFamilyRef}`;
  }
  return `focus.${selectedAnchor.anchorId}`;
}

export function navigateWithinShell(
  snapshot: ContinuitySnapshot,
  candidateRouteFamilyRef: string,
  input?: {
    runtimeScenario?: RuntimeScenario;
    timestamp?: string;
  },
): ContinuityTransitionResult {
  const timestamp = input?.timestamp ?? timestampAt(2);
  const currentRoute = expectRouteClaim(snapshot.activeRouteFamilyRef);
  const candidateRoute = expectRouteClaim(candidateRouteFamilyRef);
  const adjacency = getRouteAdjacencyContract(
    currentRoute.routeFamilyRef,
    candidateRoute.routeFamilyRef,
  );
  const posture = resolveRuntimeReturnPosture(
    adjacency.defaultReturnPosture,
    input?.runtimeScenario ?? snapshot.runtimeScenario,
  );
  const isReturningToOrigin =
    snapshot.currentReturnContract?.originRouteFamilyRef === candidateRoute.routeFamilyRef;
  const preservedOriginAnchorKey =
    isReturningToOrigin &&
    snapshot.currentReturnContract?.preservedAnchorId.split("::").at(-1) !== undefined
      ? snapshot.currentReturnContract.preservedAnchorId.split("::").at(-1)
      : null;
  const nextAnchorKey =
    isReturningToOrigin && preservedOriginAnchorKey && candidateRoute.anchors.includes(preservedOriginAnchorKey)
      ? preservedOriginAnchorKey
      : adjacency.anchorDispositionRef === "preserve" &&
          candidateRoute.anchors.includes(snapshot.selectedAnchor.anchorKey)
        ? snapshot.selectedAnchor.anchorKey
        : candidateRoute.defaultAnchor;
  const selectedAnchor = createSelectedAnchor({
    routeFamilyRef: candidateRoute.routeFamilyRef,
    anchorKey: nextAnchorKey,
    timestamp,
    stabilityState:
      adjacency.anchorDispositionRef === "replace_with_acknowledgement"
        ? "replaced"
        : "stable",
    replacementAnchorRef:
      adjacency.anchorDispositionRef === "replace_with_acknowledgement"
        ? `sa::${candidateRoute.routeFamilyRef}::${candidateRoute.defaultAnchor}`
        : null,
  });
  const returnContract = isReturningToOrigin
    ? null
    : createReturnContract(snapshot, candidateRoute.routeFamilyRef, posture);
  const focusRestoreTargetRef = focusTargetForDisposition(
    adjacency.anchorDispositionRef,
    selectedAnchor,
    posture,
  );
  const disclosurePosture =
    candidateRoute.residency === "same_shell_child"
      ? "detail_open"
      : posture === "recovery_required_return"
        ? "recovery_notice"
        : candidateRoute.shellFamily === "governance" || candidateRoute.shellFamily === "operations"
          ? "review_open"
          : "calm_closed";
  const restoreOrder = buildRestoreSteps(
    candidateRoute.routeFamilyRef,
    posture,
    selectedAnchor,
  );
  const ledger = appendLedgerEntry(snapshot, {
    routeFamilyRef: candidateRoute.routeFamilyRef,
    selectedAnchor,
    disclosurePosture,
    scrollAnchorRef: `scroll.${candidateRoute.routeFamilyRef}.${selectedAnchor.anchorKey}`,
    focusRestoreTargetRef,
    restoreState: "restoring",
    returnContractId: returnContract?.returnContractId ?? null,
    recordedAt: timestamp,
  });
  const nextSnapshot: ContinuitySnapshot = {
    ...snapshot,
    activeRouteFamilyRef: candidateRoute.routeFamilyRef,
    runtimeScenario: input?.runtimeScenario ?? snapshot.runtimeScenario,
    selectedAnchor,
    disclosurePosture,
    scrollAnchorRef: `scroll.${candidateRoute.routeFamilyRef}.${selectedAnchor.anchorKey}`,
    focusRestoreTargetRef,
    navigationLedger: ledger,
    currentReturnContract: returnContract,
    currentStub: null,
    restoreOrder,
    timeline: [
      ...snapshot.timeline.slice(-7),
      buildEvent(snapshot, {
        kind: "navigation",
        label: isReturningToOrigin ? "Return contract restored" : "Same-shell transition",
        detail: `${currentRoute.title} -> ${candidateRoute.title}`,
        routeFamilyRef: candidateRoute.routeFamilyRef,
      }),
    ],
  };
  return {
    snapshot: nextSnapshot,
    adjacency,
    returnContract,
    restoreOrder,
  };
}

export function invalidateSelectedAnchor(
  snapshot: ContinuitySnapshot,
  input: {
    reasonRefs: readonly string[];
    replacementAnchorKey?: string;
    nearestSafeAnchorKey?: string;
    runtimeScenario?: RuntimeScenario;
    timestamp?: string;
  },
): ContinuitySnapshot {
  const timestamp = input.timestamp ?? timestampAt(3);
  const route = expectRouteClaim(snapshot.activeRouteFamilyRef);
  const policy = getSelectedAnchorPolicy(route.routeFamilyRef);
  const replacementAnchorKey =
    input.replacementAnchorKey && route.anchors.includes(input.replacementAnchorKey)
      ? input.replacementAnchorKey
      : null;
  const nearestSafeAnchorKey =
    input.nearestSafeAnchorKey && route.anchors.includes(input.nearestSafeAnchorKey)
      ? input.nearestSafeAnchorKey
      : policy.fallbackAnchorRef;
  const invalidationState: InvalidationState = replacementAnchorKey
    ? "anchor_replaced_acknowledgement_required"
    : input.runtimeScenario === "recovery_only" || snapshot.runtimeScenario === "recovery_only"
      ? "anchor_unavailable_preserve_stub"
      : "anchor_stale_recoverable";
  const selectedAnchor = createSelectedAnchor({
    routeFamilyRef: route.routeFamilyRef,
    anchorKey: snapshot.selectedAnchor.anchorKey,
    timestamp,
    stabilityState: replacementAnchorKey ? "replaced" : "invalidated",
    invalidatingReasonRefs: input.reasonRefs,
    replacementAnchorRef: replacementAnchorKey
      ? `sa::${route.routeFamilyRef}::${replacementAnchorKey}`
      : null,
  });
  const stub: SelectedAnchorStub = {
    stubId: `stub::${route.routeFamilyRef}::${selectedAnchor.anchorKey}`,
    routeFamilyRef: route.routeFamilyRef,
    shellSlug: route.shellSlug,
    originalAnchorId: selectedAnchor.anchorId,
    originalAnchorTupleHash: selectedAnchor.anchorTupleHash,
    invalidationState,
    explanation: replacementAnchorKey
      ? `${selectedAnchor.lastKnownLabel} was replaced and requires acknowledgement before the new anchor becomes active.`
      : `${selectedAnchor.lastKnownLabel} is unavailable, so the shell preserves a stub and points to the nearest safe anchor.`,
    replacementAnchorRef: replacementAnchorKey
      ? `sa::${route.routeFamilyRef}::${replacementAnchorKey}`
      : null,
    nearestSafeAnchorRef: nearestSafeAnchorKey
      ? `sa::${route.routeFamilyRef}::${nearestSafeAnchorKey}`
      : null,
    acknowledgementRequired: replacementAnchorKey
      ? policy.replacementRequirementRef === "acknowledgement_required"
      : false,
    sourceRefs: policy.sourceRefs,
  };
  const posture = replacementAnchorKey
    ? "partial_restore"
    : resolveRuntimeReturnPosture(
        "partial_restore",
        input.runtimeScenario ?? snapshot.runtimeScenario,
      );
  const restoreOrder = buildRestoreSteps(route.routeFamilyRef, posture, selectedAnchor);
  const focusRestoreTargetRef =
    invalidationState === "anchor_replaced_acknowledgement_required"
      ? `focus.stub.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`
      : posture === "recovery_required_return"
        ? "focus.recovery.notice"
        : `focus.stub.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`;
  const currentReturnContract =
    snapshot.currentReturnContract === null
      ? null
      : {
          ...snapshot.currentReturnContract,
          posture,
        };
  const ledger = appendLedgerEntry(snapshot, {
    routeFamilyRef: route.routeFamilyRef,
    selectedAnchor,
    disclosurePosture: posture === "recovery_required_return" ? "recovery_notice" : "detail_open",
    scrollAnchorRef: `scroll.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`,
    focusRestoreTargetRef,
    restoreState:
      posture === "recovery_required_return" ? "recovery_required" : "stale_stub",
    returnContractId: currentReturnContract?.returnContractId ?? null,
    recordedAt: timestamp,
  });
  return {
    ...snapshot,
    runtimeScenario: input.runtimeScenario ?? snapshot.runtimeScenario,
    selectedAnchor,
    disclosurePosture: posture === "recovery_required_return" ? "recovery_notice" : "detail_open",
    focusRestoreTargetRef,
    navigationLedger: ledger,
    currentReturnContract,
    currentStub: stub,
    restoreOrder,
    timeline: [
      ...snapshot.timeline.slice(-7),
      buildEvent(snapshot, {
        kind: "invalidation",
        label: replacementAnchorKey ? "Anchor replacement required" : "Anchor invalidated",
        detail: stub.explanation,
        routeFamilyRef: route.routeFamilyRef,
      }),
    ],
  };
}

export function acknowledgeSelectedAnchorReplacement(
  snapshot: ContinuitySnapshot,
  timestamp: string = timestampAt(4),
): ContinuitySnapshot {
  const route = expectRouteClaim(snapshot.activeRouteFamilyRef);
  const replacementRef = snapshot.currentStub?.replacementAnchorRef;
  if (!replacementRef) {
    return snapshot;
  }
  const replacementAnchorKey = replacementRef.split("::").at(-1) ?? route.defaultAnchor;
  const selectedAnchor = createSelectedAnchor({
    routeFamilyRef: route.routeFamilyRef,
    anchorKey: replacementAnchorKey,
    timestamp,
    stabilityState: "recovered",
  });
  const restoreOrder = buildRestoreSteps(route.routeFamilyRef, "partial_restore", selectedAnchor);
  const ledger = appendLedgerEntry(snapshot, {
    routeFamilyRef: route.routeFamilyRef,
    selectedAnchor,
    disclosurePosture: "review_open",
    scrollAnchorRef: `scroll.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`,
    focusRestoreTargetRef: `focus.${selectedAnchor.anchorId}`,
    restoreState: "restored",
    returnContractId: snapshot.currentReturnContract?.returnContractId ?? null,
    recordedAt: timestamp,
  });
  return {
    ...snapshot,
    selectedAnchor,
    disclosurePosture: "review_open",
    scrollAnchorRef: `scroll.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`,
    focusRestoreTargetRef: `focus.${selectedAnchor.anchorId}`,
    navigationLedger: ledger,
    currentStub: null,
    restoreOrder,
    timeline: [
      ...snapshot.timeline.slice(-7),
      buildEvent(snapshot, {
        kind: "replacement_acknowledged",
        label: "Replacement acknowledged",
        detail: `The shell now treats ${selectedAnchor.lastKnownLabel} as the new selected anchor.`,
        routeFamilyRef: route.routeFamilyRef,
      }),
    ],
  };
}

export function restoreSnapshotFromRefresh(
  snapshot: ContinuitySnapshot,
  input?: {
    availableAnchorKeys?: readonly string[];
    runtimeScenario?: RuntimeScenario;
    timestamp?: string;
  },
): ContinuitySnapshot {
  const timestamp = input?.timestamp ?? timestampAt(5);
  const route = expectRouteClaim(snapshot.activeRouteFamilyRef);
  const policy = getSelectedAnchorPolicy(route.routeFamilyRef);
  const availableAnchorKeys = input?.availableAnchorKeys ?? route.anchors;
  const exactAnchorAvailable = availableAnchorKeys.includes(snapshot.selectedAnchor.anchorKey);
  const replacementAnchorKey = snapshot.currentStub?.replacementAnchorRef?.split("::").at(-1) ?? null;
  const replacementAvailable =
    replacementAnchorKey !== null && availableAnchorKeys.includes(replacementAnchorKey);
  const runtimeScenario = input?.runtimeScenario ?? snapshot.runtimeScenario;
  const posture = !exactAnchorAvailable && runtimeScenario !== "live"
    ? resolveRuntimeReturnPosture("partial_restore", runtimeScenario)
    : exactAnchorAvailable
      ? "full_restore"
      : "partial_restore";
  const nextAnchorKey = exactAnchorAvailable
    ? snapshot.selectedAnchor.anchorKey
    : replacementAvailable
      ? replacementAnchorKey
      : availableAnchorKeys.find((anchorKey) => anchorKey === policy.fallbackAnchorRef) ??
        route.defaultAnchor;
  const selectedAnchor = createSelectedAnchor({
    routeFamilyRef: route.routeFamilyRef,
    anchorKey: nextAnchorKey,
    timestamp,
    stabilityState:
      exactAnchorAvailable ? "recovered" : posture === "recovery_required_return" ? "invalidated" : "recovered",
    invalidatingReasonRefs:
      exactAnchorAvailable ? [] : ["reason.refresh_restore.degraded_to_nearest_safe_anchor"],
  });
  const stub =
    exactAnchorAvailable
      ? null
      : {
          stubId: `stub::${route.routeFamilyRef}::${snapshot.selectedAnchor.anchorKey}`,
          routeFamilyRef: route.routeFamilyRef,
          shellSlug: route.shellSlug,
          originalAnchorId: snapshot.selectedAnchor.anchorId,
          originalAnchorTupleHash: snapshot.selectedAnchor.anchorTupleHash,
          invalidationState:
            posture === "recovery_required_return"
              ? "anchor_unavailable_preserve_stub"
              : replacementAvailable
                ? "anchor_replaced_acknowledgement_required"
                : "anchor_stale_recoverable",
          explanation:
            posture === "recovery_required_return"
              ? "The exact anchor could not be restored, so the shell preserves a visible stub and re-arms only recovery-safe posture."
              : "The exact anchor moved, so the shell keeps a stub and restores the nearest safe anchor.",
          replacementAnchorRef: replacementAvailable
            ? `sa::${route.routeFamilyRef}::${replacementAnchorKey}`
            : null,
          nearestSafeAnchorRef: `sa::${route.routeFamilyRef}::${nextAnchorKey}`,
          acknowledgementRequired: replacementAvailable,
          sourceRefs: policy.sourceRefs,
        } satisfies SelectedAnchorStub;
  const restoreOrder = buildRestoreSteps(route.routeFamilyRef, posture, selectedAnchor);
  const focusRestoreTargetRef =
    stub !== null ? `focus.stub.${route.routeFamilyRef}.${snapshot.selectedAnchor.anchorKey}` : `focus.${selectedAnchor.anchorId}`;
  const currentReturnContract =
    snapshot.currentReturnContract === null
      ? null
      : {
          ...snapshot.currentReturnContract,
          posture,
        };
  const ledger = appendLedgerEntry(snapshot, {
    routeFamilyRef: route.routeFamilyRef,
    selectedAnchor,
    disclosurePosture: posture === "recovery_required_return" ? "recovery_notice" : snapshot.disclosurePosture,
    scrollAnchorRef: `scroll.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`,
    focusRestoreTargetRef,
    restoreState:
      posture === "recovery_required_return"
        ? "recovery_required"
        : stub !== null
          ? "stale_stub"
          : "restored",
    returnContractId: currentReturnContract?.returnContractId ?? null,
    recordedAt: timestamp,
  });
  return {
    ...snapshot,
    runtimeScenario,
    selectedAnchor,
    disclosurePosture: posture === "recovery_required_return" ? "recovery_notice" : snapshot.disclosurePosture,
    scrollAnchorRef: `scroll.${route.routeFamilyRef}.${selectedAnchor.anchorKey}`,
    focusRestoreTargetRef,
    navigationLedger: ledger,
    currentReturnContract,
    currentStub: stub,
    restoreOrder,
    timeline: [
      ...snapshot.timeline.slice(-7),
      buildEvent(snapshot, {
        kind: "refresh_restore",
        label: exactAnchorAvailable ? "Exact anchor restored" : "Nearest safe anchor restored",
        detail:
          posture === "recovery_required_return"
            ? "Recovery posture remains active while the shell preserves the departing anchor stub."
            : `The shell restored ${selectedAnchor.lastKnownLabel} in the declared restore order.`,
        routeFamilyRef: route.routeFamilyRef,
      }),
    ],
  };
}

export function serializeContinuitySnapshot(snapshot: ContinuitySnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseContinuitySnapshot(payload: string): ContinuitySnapshot {
  return JSON.parse(payload) as ContinuitySnapshot;
}

function continuityStorageKey(shellSlug: ShellSlug): string {
  return `${SELECTED_ANCHOR_MANAGER_STORAGE_PREFIX}::${shellSlug}`;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

export function readPersistedContinuitySnapshot(
  shellSlug: ShellSlug,
): ContinuitySnapshot | null {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return null;
  }
  const payload = ownerWindow.localStorage.getItem(continuityStorageKey(shellSlug));
  if (!payload) {
    return null;
  }
  try {
    return parseContinuitySnapshot(payload);
  } catch {
    return null;
  }
}

export function writePersistedContinuitySnapshot(snapshot: ContinuitySnapshot): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return;
  }
  ownerWindow.localStorage.setItem(
    continuityStorageKey(snapshot.shellSlug),
    serializeContinuitySnapshot(snapshot),
  );
}

export function resolveInitialContinuitySnapshot(
  shellSlug: ShellSlug,
  routeFamilyRef?: string,
): ContinuitySnapshot {
  const persisted = readPersistedContinuitySnapshot(shellSlug);
  if (persisted) {
    return persisted;
  }
  const shell = listPersistentShellSpecs().find((spec) => spec.shellSlug === shellSlug);
  const fallbackRoute = routeFamilyRef ?? shell?.routeClaims[0]?.routeFamilyRef;
  if (!fallbackRoute) {
    throw new Error(`SELECTED_ANCHOR_SHELL_NOT_FOUND:${shellSlug}`);
  }
  return createInitialContinuitySnapshot({
    shellSlug,
    routeFamilyRef: fallbackRoute,
  });
}

function scenarioStepFromSnapshot(
  snapshot: ContinuitySnapshot,
  label: string,
  detail: string,
): ReturnContractScenarioStep {
  const derivedReturnPosture =
    snapshot.currentReturnContract?.posture ??
    (snapshot.disclosurePosture === "recovery_notice"
      ? "recovery_required_return"
      : snapshot.runtimeScenario === "read_only"
        ? "read_only_preserve"
        : "full_restore");
  return {
    stepId: `${snapshot.activeRouteFamilyRef}-${snapshot.navigationLedger.ledgerEpoch}`,
    label,
    routeFamilyRef: snapshot.activeRouteFamilyRef,
    selectedAnchorLabel: snapshot.selectedAnchor.lastKnownLabel,
    returnPosture: derivedReturnPosture,
    invalidationState: snapshot.currentStub?.invalidationState ?? "anchor_valid",
    focusTargetRef: snapshot.focusRestoreTargetRef,
    scrollAnchorRef: snapshot.scrollAnchorRef,
    disclosurePosture: snapshot.disclosurePosture,
    returnLabel: snapshot.currentReturnContract?.returnLabel ?? null,
    stubLabel: snapshot.currentStub?.explanation ?? null,
    detail,
  };
}

export function listReturnContractScenarios(): readonly ReturnContractScenario[] {
  const patientStart = createInitialContinuitySnapshot({
    shellSlug: "patient-web",
    routeFamilyRef: "rf_patient_requests",
    anchorKey: "request-needs-attention",
  });
  const patientChild = navigateWithinShell(patientStart, "rf_intake_self_service");
  const patientReturn = navigateWithinShell(
    patientChild.snapshot,
    "rf_patient_requests",
    { timestamp: timestampAt(3) },
  );

  const recordStart = createInitialContinuitySnapshot({
    shellSlug: "patient-web",
    routeFamilyRef: "rf_patient_health_record",
    anchorKey: "record-latest",
  });
  const recordInvalidated = invalidateSelectedAnchor(recordStart, {
    reasonRefs: ["reason.artifact_mode_truth_drift"],
    nearestSafeAnchorKey: "record-summary",
    runtimeScenario: "recovery_only",
  });
  const recordRecovered = restoreSnapshotFromRefresh(recordInvalidated, {
    availableAnchorKeys: ["record-summary", "record-follow-up"],
    runtimeScenario: "recovery_only",
    timestamp: timestampAt(4),
  });

  const workspaceStart = createInitialContinuitySnapshot({
    shellSlug: "clinical-workspace",
    routeFamilyRef: "rf_staff_workspace",
    anchorKey: "queue-active-case",
  });
  const workspaceChild = navigateWithinShell(
    workspaceStart,
    "rf_staff_workspace_child",
    { timestamp: timestampAt(2) },
  );
  const workspaceReturn = navigateWithinShell(
    workspaceChild.snapshot,
    "rf_staff_workspace",
    { timestamp: timestampAt(3) },
  );

  const operationsStart = createInitialContinuitySnapshot({
    shellSlug: "ops-console",
    routeFamilyRef: "rf_operations_board",
    anchorKey: "board-watch",
  });
  const operationsDrill = navigateWithinShell(
    operationsStart,
    "rf_operations_drilldown",
    { timestamp: timestampAt(2) },
  );
  const operationsInvalidated = invalidateSelectedAnchor(operationsDrill.snapshot, {
    reasonRefs: ["reason.anomaly_cleared", "reason.release_watch_tuple_changed"],
    nearestSafeAnchorKey: "board-health",
    runtimeScenario: "read_only",
    timestamp: timestampAt(3),
  });
  const operationsReturn = navigateWithinShell(
    operationsInvalidated,
    "rf_operations_board",
    { runtimeScenario: "read_only", timestamp: timestampAt(4) },
  );
  const operationsRestored = restoreSnapshotFromRefresh(operationsReturn.snapshot, {
    availableAnchorKeys: ["board-health", "board-intervention"],
    runtimeScenario: "read_only",
    timestamp: timestampAt(5),
  });

  const governanceStart = createInitialContinuitySnapshot({
    shellSlug: "governance-console",
    routeFamilyRef: "rf_governance_shell",
    anchorKey: "governance-diff",
  });
  const governanceReplaced = invalidateSelectedAnchor(governanceStart, {
    reasonRefs: ["reason.diff_scope_superseded"],
    replacementAnchorKey: "governance-approval",
    timestamp: timestampAt(2),
  });
  const governanceAck = acknowledgeSelectedAnchorReplacement(
    governanceReplaced,
    timestampAt(3),
  );

  return [
    {
      scenarioId: "SCN_PATIENT_CHILD_RETURN_FULL",
      shellSlug: "patient-web",
      audience: "patient",
      title: "Patient request child-route return",
      summary:
        "Requests keeps the original request anchor through the intake child route and restores it on return.",
      routeSequence: ["rf_patient_requests", "rf_intake_self_service", "rf_patient_requests"],
      steps: [
        scenarioStepFromSnapshot(
          patientStart,
          "Origin anchor pinned",
          "The patient pins the current request row before opening the child route.",
        ),
        scenarioStepFromSnapshot(
          patientChild.snapshot,
          "Child route entered",
          "The same shell opens the intake child surface and preserves a return contract to the request row.",
        ),
        scenarioStepFromSnapshot(
          patientReturn.snapshot,
          "Origin anchor restored",
          "Exiting the child route restores the same request anchor rather than defaulting to the top of the list.",
        ),
      ],
      sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_ACCESSIBILITY],
    },
    {
      scenarioId: "SCN_PATIENT_RECORD_RECOVERY_RETURN",
      shellSlug: "patient-web",
      audience: "patient",
      title: "Patient record recovery preserves the nearest safe anchor",
      summary:
        "When record-follow-up continuity degrades, the shell keeps the departing record anchor visible as a stub and restores the nearest safe summary anchor.",
      routeSequence: ["rf_patient_health_record", "rf_patient_health_record", "rf_patient_health_record"],
      steps: [
        scenarioStepFromSnapshot(
          recordStart,
          "Record anchor selected",
          "The patient is reading the latest record entry.",
        ),
        scenarioStepFromSnapshot(
          recordInvalidated,
          "Anchor invalidated in place",
          "Artifact drift freezes quiet return and keeps the selected record anchor visible as a stub.",
        ),
        scenarioStepFromSnapshot(
          recordRecovered,
          "Recovery-only restore",
          "Refresh restores the nearest safe record summary while preserving the departing anchor stub and recovery posture.",
        ),
      ],
      sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_PATIENT, SOURCE_FORENSICS],
    },
    {
      scenarioId: "SCN_WORKSPACE_QUIET_RETURN",
      shellSlug: "clinical-workspace",
      audience: "workspace",
      title: "Workspace queue to case detail quiet return",
      summary:
        "The workspace keeps the active queue row as the authoritative return target while the case canvas takes focus.",
      routeSequence: ["rf_staff_workspace", "rf_staff_workspace_child", "rf_staff_workspace"],
      steps: [
        scenarioStepFromSnapshot(
          workspaceStart,
          "Queue row selected",
          "The reviewer pins the current queue row before opening the case canvas.",
        ),
        scenarioStepFromSnapshot(
          workspaceChild.snapshot,
          "Case canvas takes focus",
          "The child surface opens without losing the source queue row or return contract.",
        ),
        scenarioStepFromSnapshot(
          workspaceReturn.snapshot,
          "Quiet return restored",
          "Returning to the queue restores the original queue row anchor instead of selecting a neighbour.",
        ),
      ],
      sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_STAFF, SOURCE_ACCESSIBILITY],
    },
    {
      scenarioId: "SCN_OPERATIONS_STALE_RETURN",
      shellSlug: "ops-console",
      audience: "operations",
      title: "Operations stale return preserves a visible watchpoint stub",
      summary:
        "A cleared anomaly cannot silently disappear; the board keeps a stub and degrades to read-only preserve.",
      routeSequence: ["rf_operations_board", "rf_operations_drilldown", "rf_operations_board"],
      steps: [
        scenarioStepFromSnapshot(
          operationsStart,
          "Watchpoint selected",
          "The operator pins the current anomaly watchpoint.",
        ),
        scenarioStepFromSnapshot(
          operationsDrill.snapshot,
          "Investigation opened",
          "The diagnostic route stays inside the same shell and preserves a return contract to the board.",
        ),
        scenarioStepFromSnapshot(
          operationsRestored,
          "Read-only preserve with stub",
          "When the watchpoint clears, the board returns in read-only posture with a visible stub instead of jumping to a sibling row.",
        ),
      ],
      sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_OPERATIONS, SOURCE_FORENSICS],
    },
    {
      scenarioId: "SCN_GOVERNANCE_DIFF_REPLACEMENT",
      shellSlug: "governance-console",
      audience: "governance",
      title: "Governance diff replacement requires acknowledgement",
      summary:
        "Replacing the active diff anchor with an approval target requires an explicit acknowledgement before the new anchor becomes dominant.",
      routeSequence: ["rf_governance_shell", "rf_governance_shell", "rf_governance_shell"],
      steps: [
        scenarioStepFromSnapshot(
          governanceStart,
          "Diff anchor selected",
          "The reviewer pins the active diff block as the continuity anchor.",
        ),
        scenarioStepFromSnapshot(
          governanceReplaced,
          "Replacement stub shown",
          "The shell keeps the old diff anchor visible and announces the required replacement acknowledgement.",
        ),
        scenarioStepFromSnapshot(
          governanceAck,
          "Replacement acknowledged",
          "The approval anchor becomes the active selected anchor only after explicit acknowledgement.",
        ),
      ],
      sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_GOVERNANCE, SOURCE_ACCESSIBILITY],
    },
  ] as const;
}

export const selectedAnchorObjectFamilies = [
  {
    canonicalName: "SelectedAnchor",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#1.17 SelectedAnchor`,
  },
  {
    canonicalName: "NavigationStateLedger",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#NavigationStateLedger`,
  },
  {
    canonicalName: "RouteAdjacencyContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#RouteAdjacencyContract`,
  },
  {
    canonicalName: "SelectedAnchorPolicy",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: `${SOURCE_PLATFORM_FRONTEND}#SelectedAnchorPolicy`,
  },
] as const;

export const selectedAnchorContractFamilies = [
  {
    contractFamilyId: "CF_108_SELECTED_ANCHOR_RUNTIME",
    label: "Selected anchor and return contracts",
    description:
      "Selected-anchor identity, route adjacency, return posture, and same-shell restore order.",
    versioningPosture: "workspace-private",
    consumerContractIds: ["SelectedAnchor", "SelectedAnchorPolicy", "RouteAdjacencyContract"],
    consumerOwnerCodes: ["frontend_runtime", "patient_experience", "triage_workspace", "operations"],
    consumerSelectors: ["shellSlug", "routeFamilyRef", "anchorTupleHash"],
    sourceRefs: [SOURCE_PLATFORM_FRONTEND, SOURCE_ACCESSIBILITY, SOURCE_FORENSICS],
    ownedObjectFamilyCount: 4,
  },
] as const;

export const selectedAnchorManagerCatalog = {
  taskId: SELECTED_ANCHOR_MANAGER_TASK_ID,
  visualMode: SELECTED_ANCHOR_MANAGER_VISUAL_MODE,
  routeCount: routeClaims.length,
  policyCount: selectedAnchorPolicies.length,
  adjacencyCount: routeAdjacencyContracts.length,
  scenarioCount: 5,
  gapResolutionCount: gapResolutions.length,
  followOnDependencyCount: FOLLOW_ON_DEPENDENCIES.length,
} as const;

export function buildSelectedAnchorManagerArtifacts(): SelectedAnchorManagerArtifacts {
  const scenarios = listReturnContractScenarios();
  const restoreOrders = selectedAnchorPolicies.flatMap((policy) =>
    policy.restoreOrder.map((stepKey, index) => ({
      routeFamilyRef: policy.routeFamilyRef,
      posture: "full_restore" as const,
      stepKey,
      order: index + 1,
      description:
        stepKey === "anchor"
          ? `Restore the selected anchor before any visual displacement for ${policy.routeFamilyRef}.`
          : stepKey === "scroll"
            ? `Restore the scroll anchor for ${policy.routeFamilyRef}.`
            : stepKey === "disclosure"
              ? `Restore bounded disclosure posture for ${policy.routeFamilyRef}.`
              : `Restore focus to the governed anchor target for ${policy.routeFamilyRef}.`,
      sourceRefs: policy.sourceRefs,
    })),
  );
  const policyRows = selectedAnchorPolicies.map((policy) => ({
    route_family_ref: policy.routeFamilyRef,
    shell_slug: policy.shellSlug,
    anchor_type: policy.anchorType,
    primary_anchor_slot_ref: policy.primaryAnchorSlotRef,
    replacement_requirement_ref: policy.replacementRequirementRef,
    fallback_anchor_ref: policy.fallbackAnchorRef,
    restore_order: policy.restoreOrder.join(" > "),
    invalidation_presentation_ref: policy.invalidationPresentationRef,
    source_refs: policy.sourceRefs.join(" | "),
  }));
  const adjacencyRows = routeAdjacencyContracts.map((contract) => ({
    from_route_family_ref: contract.fromRouteFamilyRef,
    to_route_family_ref: contract.toRouteFamilyRef,
    shell_slug: contract.shellSlug,
    adjacency_type: contract.adjacencyType,
    history_policy: contract.historyPolicy,
    anchor_disposition_ref: contract.anchorDispositionRef,
    focus_disposition_ref: contract.focusDispositionRef,
    default_return_posture: contract.defaultReturnPosture,
    source_refs: contract.sourceRefs.join(" | "),
  }));
  const restoreOrderRows = restoreOrders.map((step) => ({
    route_family_ref: step.routeFamilyRef,
    posture: step.posture,
    step_key: step.stepKey,
    order: String(step.order),
    description: step.description,
    source_refs: step.sourceRefs.join(" | "),
  }));
  return {
    publication: {
      task_id: SELECTED_ANCHOR_MANAGER_TASK_ID,
      visual_mode: SELECTED_ANCHOR_MANAGER_VISUAL_MODE,
      summary: {
        route_count: routeClaims.length,
        policy_count: selectedAnchorPolicies.length,
        adjacency_count: routeAdjacencyContracts.length,
        restore_step_count: restoreOrders.length,
        scenario_count: scenarios.length,
        gap_resolution_count: gapResolutions.length,
        follow_on_dependency_count: FOLLOW_ON_DEPENDENCIES.length,
      },
      selected_anchor_policies: selectedAnchorPolicies,
      route_adjacency_contracts: routeAdjacencyContracts,
      restore_orders: restoreOrders,
      scenario_examples: scenarios,
      gap_resolutions: gapResolutions,
      follow_on_dependencies: [...FOLLOW_ON_DEPENDENCIES],
      source_refs: [...SELECTED_ANCHOR_MANAGER_SOURCE_PRECEDENCE],
    },
    policyRows,
    adjacencyRows,
    restoreOrderRows,
  };
}
