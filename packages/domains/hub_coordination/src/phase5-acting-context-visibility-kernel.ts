import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

import {
  createPhase5HubCaseKernelService,
  type HubCaseBundle,
  type Phase5HubCaseKernelService,
} from "./phase5-hub-case-kernel";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextHubAuthorityId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, structuredClone(row));
}

export type StaffIdentityState = "authenticated" | "reauth_required" | "revoked";
export type SessionAssurance = "aal2" | "aal3";
export type TenantScopeMode =
  | "single_tenant"
  | "organisation_group"
  | "multi_tenant"
  | "platform";
export type PurposeOfUse =
  | "direct_care_network_coordination"
  | "direct_care_site_delivery"
  | "practice_continuity"
  | "supervisor_recovery"
  | "break_glass_patient_safety";
export type AudienceTierRef =
  | "origin_practice_visibility"
  | "hub_desk_visibility"
  | "servicing_site_visibility";
export type ActingContextState = "current" | "stale" | "blocked" | "superseded";
export type ElevationState = "none" | "requested" | "active" | "expiring" | "revoked";
export type BreakGlassState = "none" | "requested" | "active" | "revoked";
export type ActingScopeTupleState = "current" | "stale" | "blocked" | "superseded";
export type VisibilityEnvelopeState = "current" | "stale" | "blocked" | "superseded";
export type AuthorityDecisionState = "allowed" | "denied" | "stale";
export type AuthorityDecisionReason =
  | "allowed"
  | "identity_reauth_required"
  | "identity_revoked"
  | "acting_context_not_current"
  | "scope_tuple_mismatch"
  | "organisation_switch"
  | "tenant_scope_change"
  | "environment_change"
  | "policy_plane_change"
  | "purpose_of_use_change"
  | "audience_tier_mismatch"
  | "minimum_necessary_contract_mismatch"
  | "visibility_envelope_required"
  | "visibility_contract_drift"
  | "stale_visibility_envelope"
  | "break_glass_reason_required"
  | "break_glass_not_lawful_for_route"
  | "break_glass_revocation"
  | "elevation_expiry"
  | "purpose_not_allowed_for_route"
  | "audience_not_allowed_for_route"
  | "stale_ownership_epoch"
  | "stale_ownership_fence"
  | "unsupported_command_scope";
export type AuthorityFailureClass =
  | "none"
  | "scope_drift"
  | "visibility_drift"
  | "lease_drift"
  | "ownership_drift";
export type ActingScopeDriftClass =
  | "organisation_switch"
  | "tenant_scope_change"
  | "environment_change"
  | "policy_plane_change"
  | "purpose_of_use_change"
  | "elevation_expiry"
  | "break_glass_revocation"
  | "visibility_contract_drift";
export type BreakGlassAuditAction = "requested" | "activated" | "used" | "revoked";
export type Phase5HubMutationCommandId =
  | "claim_case"
  | "release_case"
  | "transfer_ownership"
  | "stale_owner_recovery"
  | "begin_candidate_search"
  | "publish_candidates_ready"
  | "enter_coordinator_selecting"
  | "enter_candidate_revalidating"
  | "offer_alternatives"
  | "enter_native_booking_pending"
  | "mark_confirmation_pending"
  | "mark_booked_pending_practice_ack"
  | "mark_booked"
  | "mark_callback_transfer_pending"
  | "mark_callback_offered"
  | "mark_escalated_back"
  | "close_case"
  | "return_to_practice";
export type Phase5HubRouteFamily =
  | "hub_queue"
  | "hub_case_detail"
  | "hub_alternatives"
  | "hub_exceptions"
  | "hub_audit";

interface AudienceTierContract {
  label: string;
  minimumNecessaryContractRef: string;
  visibleFieldRefs: readonly string[];
  hiddenFieldRefs: readonly string[];
  placeholderContractRef: string;
}

const AUDIENCE_TIER_CONTRACTS: Record<AudienceTierRef, AudienceTierContract> = {
  origin_practice_visibility: {
    label: "Origin practice visibility",
    minimumNecessaryContractRef: "MinimumNecessaryContract.origin_practice",
    visibleFieldRefs: [
      "requestLineageRef",
      "macro_booking_status",
      "fallback_reason_code",
      "patient_communication_state",
      "latest_continuity_delta",
      "ack_generation_state",
    ],
    hiddenFieldRefs: [
      "hub_internal_free_text",
      "cross_site_capacity_detail",
      "raw_native_booking_proof",
    ],
    placeholderContractRef: "HubOutOfScopePlaceholder.origin_practice",
  },
  hub_desk_visibility: {
    label: "Hub desk visibility",
    minimumNecessaryContractRef: "MinimumNecessaryContract.hub_desk",
    visibleFieldRefs: [
      "clinical_routing_summary",
      "operational_timing_needs",
      "travel_access_constraints",
      "governed_coordination_evidence",
      "requestLineageRef",
      "selected_candidate_ref",
    ],
    hiddenFieldRefs: [
      "broad_narrative_without_promotion",
      "attachment_payload_without_break_glass",
    ],
    placeholderContractRef: "HubOutOfScopePlaceholder.hub_desk",
  },
  servicing_site_visibility: {
    label: "Servicing site visibility",
    minimumNecessaryContractRef: "MinimumNecessaryContract.servicing_site",
    visibleFieldRefs: [
      "encounter_delivery_brief",
      "site_local_capacity",
      "confirmed_slot_summary",
      "manage_capability_state",
    ],
    hiddenFieldRefs: [
      "origin_practice_triage_notes",
      "callback_rationale",
      "alternative_options_other_sites",
    ],
    placeholderContractRef: "HubOutOfScopePlaceholder.servicing_site",
  },
};

interface BreakGlassReasonPolicy {
  requiresJustification: boolean;
}

const BREAK_GLASS_REASON_POLICIES: Record<string, BreakGlassReasonPolicy> = {
  patient_safety_immediate: {
    requiresJustification: true,
  },
  continuity_failure_recovery: {
    requiresJustification: true,
  },
  network_incident_override: {
    requiresJustification: true,
  },
  safeguarding_emergency: {
    requiresJustification: true,
  },
};

interface HubMutationCommandPolicy {
  allowedPurposes: readonly PurposeOfUse[];
  allowedAudienceTiers: readonly AudienceTierRef[];
  routeFamilies: readonly Phase5HubRouteFamily[];
  ownershipSensitive: boolean;
  allowsBreakGlass: boolean;
}

const HUB_MUTATION_POLICIES: Record<Phase5HubMutationCommandId, HubMutationCommandPolicy> = {
  claim_case: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_queue", "hub_case_detail"],
    ownershipSensitive: false,
    allowsBreakGlass: false,
  },
  release_case: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  transfer_ownership: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  stale_owner_recovery: {
    allowedPurposes: ["supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  begin_candidate_search: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_queue", "hub_case_detail"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  publish_candidates_ready: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_queue", "hub_case_detail"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  enter_coordinator_selecting: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  enter_candidate_revalidating: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  offer_alternatives: {
    allowedPurposes: ["direct_care_network_coordination"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_alternatives"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  enter_native_booking_pending: {
    allowedPurposes: ["direct_care_network_coordination", "break_glass_patient_safety"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail"],
    ownershipSensitive: true,
    allowsBreakGlass: true,
  },
  mark_confirmation_pending: {
    allowedPurposes: ["direct_care_network_coordination", "break_glass_patient_safety"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: true,
  },
  mark_booked_pending_practice_ack: {
    allowedPurposes: ["direct_care_network_coordination", "break_glass_patient_safety"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail"],
    ownershipSensitive: true,
    allowsBreakGlass: true,
  },
  mark_booked: {
    allowedPurposes: ["direct_care_network_coordination", "practice_continuity"],
    allowedAudienceTiers: ["hub_desk_visibility", "origin_practice_visibility"],
    routeFamilies: ["hub_case_detail"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  mark_callback_transfer_pending: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_alternatives", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  mark_callback_offered: {
    allowedPurposes: ["direct_care_network_coordination", "practice_continuity"],
    allowedAudienceTiers: ["hub_desk_visibility", "origin_practice_visibility"],
    routeFamilies: ["hub_case_detail", "hub_alternatives"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  mark_escalated_back: {
    allowedPurposes: ["direct_care_network_coordination", "practice_continuity"],
    allowedAudienceTiers: ["hub_desk_visibility", "origin_practice_visibility"],
    routeFamilies: ["hub_case_detail", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  close_case: {
    allowedPurposes: ["direct_care_network_coordination", "supervisor_recovery"],
    allowedAudienceTiers: ["hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
  return_to_practice: {
    allowedPurposes: ["practice_continuity", "supervisor_recovery"],
    allowedAudienceTiers: ["origin_practice_visibility", "hub_desk_visibility"],
    routeFamilies: ["hub_case_detail", "hub_exceptions"],
    ownershipSensitive: true,
    allowsBreakGlass: false,
  },
};

export interface Cis2RoleClaim {
  orgCode: string;
  personOrgId: string;
  personRoleId: string;
  roleCode: string;
  roleName: string;
  activityCodes?: readonly string[];
  aowCodes?: readonly string[];
  workgroupCodes?: readonly string[];
}

export interface StaffIdentityContextSnapshot {
  staffIdentityContextId: string;
  staffUserId: string;
  authProvider: "cis2";
  homeOrganisation: string;
  affiliatedOrganisationRefs: readonly string[];
  tenantGrantRefs: readonly string[];
  activeOrganisation: string;
  rbacClaims: readonly string[];
  nationalRbacRef: string | null;
  localRoleRefs: readonly string[];
  sessionAssurance: SessionAssurance;
  identityState: StaffIdentityState;
  authenticatedAt: string;
  expiresAt: string;
  version: number;
}

export interface ActingContextSnapshot {
  actingContextId: string;
  staffIdentityContextRef: string;
  staffUserId: string;
  homePracticeOds: string;
  activeOrganisationRef: string;
  activePcnId: string | null;
  activeHubSiteId: string | null;
  tenantScopeMode: TenantScopeMode;
  tenantScopeRefs: readonly string[];
  purposeOfUse: PurposeOfUse;
  actingRoleRef: string;
  audienceTierRef: AudienceTierRef;
  visibilityCoverageRef: string;
  minimumNecessaryContractRef: string;
  elevationState: ElevationState;
  breakGlassState: BreakGlassState;
  contextState: ActingContextState;
  scopeTupleHash: string;
  switchGeneration: number;
  issuedAt: string;
  expiresAt: string;
  version: number;
}

export interface ActingScopeTupleSnapshot {
  actingScopeTupleId: string;
  actingContextRef: string;
  staffIdentityContextRef: string;
  staffUserId: string;
  tupleHash: string;
  activeOrganisationRef: string;
  activePcnId: string | null;
  activeHubSiteId: string | null;
  tenantScopeMode: TenantScopeMode;
  tenantScopeRefs: readonly string[];
  purposeOfUse: PurposeOfUse;
  actingRoleRef: string;
  audienceTierRef: AudienceTierRef;
  visibilityCoverageRef: string;
  minimumNecessaryContractRef: string;
  environmentRef: string;
  policyPlaneRef: string;
  switchGeneration: number;
  elevationState: ElevationState;
  elevationExpiresAt: string | null;
  breakGlassState: BreakGlassState;
  breakGlassReasonCode: string | null;
  breakGlassJustification: string | null;
  breakGlassExpiresAt: string | null;
  tupleState: ActingScopeTupleState;
  issuedAt: string;
  supersededAt: string | null;
  expiresAt: string;
  version: number;
}

export interface CrossOrganisationVisibilityEnvelopeSnapshot {
  crossOrganisationVisibilityEnvelopeId: string;
  actingContextRef: string;
  actingScopeTupleRef: string;
  sourceOrganisationRef: string;
  targetOrganisationRef: string;
  audienceTierRef: AudienceTierRef;
  purposeOfUseRef: PurposeOfUse;
  minimumNecessaryContractRef: string;
  requiredCoverageRowRefs: readonly string[];
  visibleFieldRefs: readonly string[];
  placeholderContractRef: string;
  envelopeState: VisibilityEnvelopeState;
  generatedAt: string;
  version: number;
}

export interface AuthorityEvidenceRecordSnapshot {
  authorityEvidenceRecordId: string;
  staffIdentityContextRef: string;
  actingContextRef: string;
  actingScopeTupleRef: string;
  crossOrganisationVisibilityEnvelopeRef: string | null;
  actorIdentity: string;
  activeOrganisationRef: string;
  purposeOfUse: PurposeOfUse;
  actingRoleRef: string;
  breakGlassActive: boolean;
  hubCaseId: string | null;
  commandScope: string;
  visibilityTier: AudienceTierRef;
  decision: AuthorityDecisionState;
  reasonCode: AuthorityDecisionReason;
  failureClass: AuthorityFailureClass;
  scopeDrifted: boolean;
  visibilityDrifted: boolean;
  leaseDrifted: boolean;
  ownershipDrifted: boolean;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
  version: number;
}

export interface BreakGlassAuditRecordSnapshot {
  breakGlassAuditRecordId: string;
  actingContextRef: string;
  actingScopeTupleRef: string;
  staffUserId: string;
  action: BreakGlassAuditAction;
  reasonCode: string;
  justification: string | null;
  routeFamilyRef: string | null;
  expiresAt: string | null;
  recordedAt: string;
  version: number;
}

export interface BootstrapStaffActingContextInput {
  staffIdentityContextId?: string;
  actingContextId?: string;
  staffUserId: string;
  homeOrganisation: string;
  homePracticeOds: string;
  affiliatedOrganisationRefs?: readonly string[];
  tenantGrantRefs?: readonly string[];
  activeOrganisation: string;
  activePcnId?: string | null;
  activeHubSiteId?: string | null;
  tenantScopeMode: TenantScopeMode;
  tenantScopeRefs: readonly string[];
  purposeOfUse: PurposeOfUse;
  actingRoleRef: string;
  audienceTierRef: AudienceTierRef;
  visibilityCoverageRef: string;
  sessionAssurance: SessionAssurance;
  authenticatedAt: string;
  expiresAt: string;
  cis2RoleClaims: readonly Cis2RoleClaim[];
  nationalRbacRef?: string | null;
  localRoleRefs?: readonly string[];
  environmentRef: string;
  policyPlaneRef: string;
}

export interface BootstrapStaffActingContextResult {
  staffIdentityContext: StaffIdentityContextSnapshot;
  actingContext: ActingContextSnapshot;
  actingScopeTuple: ActingScopeTupleSnapshot;
  supersededActingScopeTuple: ActingScopeTupleSnapshot | null;
}

export interface ReissueActingContextInput {
  actingContextId: string;
  requestedAt: string;
  environmentRef: string;
  policyPlaneRef: string;
  nextActiveOrganisationRef?: string | null;
  nextActivePcnId?: string | null;
  nextActiveHubSiteId?: string | null;
  nextTenantScopeMode?: TenantScopeMode;
  nextTenantScopeRefs?: readonly string[];
  nextPurposeOfUse?: PurposeOfUse;
  nextActingRoleRef?: string;
  nextAudienceTierRef?: AudienceTierRef;
  nextVisibilityCoverageRef?: string;
  nextExpiresAt?: string;
}

export interface RequestActingElevationInput {
  actingContextId: string;
  requestedAt: string;
  supervisorRef: string;
  reasonCode: string;
  justification?: string | null;
}

export interface GrantActingElevationInput {
  actingContextId: string;
  grantedAt: string;
  approverRef: string;
  expiresAt: string;
  elevatedRoleRef?: string | null;
}

export interface ActivateBreakGlassInput {
  actingContextId: string;
  activatedAt: string;
  expiresAt: string;
  reasonCode: string;
  justification?: string | null;
  routeFamilyRef: Phase5HubRouteFamily;
}

export interface RevokeBreakGlassInput {
  actingContextId: string;
  revokedAt: string;
  reasonCode: string;
  revokedBy: string;
}

export interface MaterializeVisibilityEnvelopeInput {
  actingContextId: string;
  sourceOrganisationRef: string;
  targetOrganisationRef: string;
  requiredCoverageRowRefs: readonly string[];
  generatedAt: string;
  crossOrganisationVisibilityEnvelopeId?: string;
}

export interface MinimumNecessaryProjectionResult {
  visibleFields: Readonly<Record<string, unknown>>;
  withheldFieldRefs: readonly string[];
  placeholderContractRef: string;
}

export interface MaterializeHubCaseAudienceProjectionInput {
  hubCoordinationCaseId: string;
  visibilityEnvelopeId: string;
}

export interface ActingScopeDriftDetectionInput {
  actingContextId: string;
  asOf: string;
  presentedScopeTupleHash?: string | null;
  observedActiveOrganisationRef?: string | null;
  observedTenantScopeMode?: TenantScopeMode | null;
  observedTenantScopeRefs?: readonly string[] | null;
  observedEnvironmentRef?: string | null;
  observedPolicyPlaneRef?: string | null;
  observedPurposeOfUse?: PurposeOfUse | null;
  visibilityEnvelopeId?: string | null;
}

export interface ActingScopeDriftDetectionResult {
  actingContext: ActingContextSnapshot;
  actingScopeTuple: ActingScopeTupleSnapshot;
  visibilityEnvelope: CrossOrganisationVisibilityEnvelopeSnapshot | null;
  driftClasses: readonly ActingScopeDriftClass[];
  recommendedContextState: ActingContextState;
}

export interface HubCommandAuthorityInput {
  staffIdentityContextId: string;
  actingContextId: string;
  commandId: Phase5HubMutationCommandId;
  routeId: Phase5HubRouteFamily;
  hubCoordinationCaseId?: string | null;
  crossOrganisationVisibilityEnvelopeId?: string | null;
  presentedScopeTupleHash: string;
  presentedPurposeOfUse: PurposeOfUse;
  presentedAudienceTierRef: AudienceTierRef;
  presentedMinimumNecessaryContractRef: string;
  expectedOwnershipEpoch?: number | null;
  expectedOwnershipFenceToken?: string | null;
  observedActiveOrganisationRef?: string | null;
  observedTenantScopeMode?: TenantScopeMode | null;
  observedTenantScopeRefs?: readonly string[] | null;
  observedEnvironmentRef?: string | null;
  observedPolicyPlaneRef?: string | null;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  recordedAt: string;
}

export interface HubCommandAuthorityDecision {
  decision: AuthorityDecisionState;
  reasonCode: AuthorityDecisionReason;
  staffIdentityContext: StaffIdentityContextSnapshot;
  actingContext: ActingContextSnapshot;
  actingScopeTuple: ActingScopeTupleSnapshot;
  visibilityEnvelope: CrossOrganisationVisibilityEnvelopeSnapshot | null;
  hubCaseBundle: HubCaseBundle | null;
  driftDetection: ActingScopeDriftDetectionResult;
  authorityEvidence: AuthorityEvidenceRecordSnapshot;
}

export interface Phase5ActingScopeVisibilityStore {
  getStaffIdentityContext(id: string): Promise<StaffIdentityContextSnapshot | null>;
  findStaffIdentityContextByStaffUserId(
    staffUserId: string,
  ): Promise<StaffIdentityContextSnapshot | null>;
  saveStaffIdentityContext(
    snapshot: StaffIdentityContextSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getActingContext(id: string): Promise<ActingContextSnapshot | null>;
  saveActingContext(
    snapshot: ActingContextSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentActingScopeTuple(actingContextId: string): Promise<ActingScopeTupleSnapshot | null>;
  getActingScopeTupleByHash(
    actingContextId: string,
    tupleHash: string,
  ): Promise<ActingScopeTupleSnapshot | null>;
  listActingScopeTuples(actingContextId: string): Promise<readonly ActingScopeTupleSnapshot[]>;
  saveActingScopeTuple(
    snapshot: ActingScopeTupleSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  setCurrentActingScopeTuple(actingContextId: string, actingScopeTupleId: string): Promise<void>;
  getVisibilityEnvelope(id: string): Promise<CrossOrganisationVisibilityEnvelopeSnapshot | null>;
  listVisibilityEnvelopes(
    actingContextId: string,
  ): Promise<readonly CrossOrganisationVisibilityEnvelopeSnapshot[]>;
  saveVisibilityEnvelope(
    snapshot: CrossOrganisationVisibilityEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  appendAuthorityEvidence(snapshot: AuthorityEvidenceRecordSnapshot): Promise<void>;
  listAuthorityEvidence(
    actingContextId: string,
  ): Promise<readonly AuthorityEvidenceRecordSnapshot[]>;
  appendBreakGlassAudit(snapshot: BreakGlassAuditRecordSnapshot): Promise<void>;
  listBreakGlassAudit(actingContextId: string): Promise<readonly BreakGlassAuditRecordSnapshot[]>;
}

class InMemoryPhase5ActingScopeVisibilityStore implements Phase5ActingScopeVisibilityStore {
  private readonly staffIdentities = new Map<string, StaffIdentityContextSnapshot>();
  private readonly staffIdentityByUser = new Map<string, string>();
  private readonly actingContexts = new Map<string, ActingContextSnapshot>();
  private readonly actingScopeTuples = new Map<string, ActingScopeTupleSnapshot>();
  private readonly actingScopeTupleHistory = new Map<string, string[]>();
  private readonly currentActingScopeTuple = new Map<string, string>();
  private readonly visibilityEnvelopes = new Map<string, CrossOrganisationVisibilityEnvelopeSnapshot>();
  private readonly visibilityEnvelopeHistory = new Map<string, string[]>();
  private readonly authorityEvidence = new Map<string, AuthorityEvidenceRecordSnapshot[]>();
  private readonly breakGlassAudit = new Map<string, BreakGlassAuditRecordSnapshot[]>();

  async getStaffIdentityContext(id: string) {
    const snapshot = this.staffIdentities.get(id);
    return snapshot ? structuredClone(snapshot) : null;
  }

  async findStaffIdentityContextByStaffUserId(staffUserId: string) {
    const id = this.staffIdentityByUser.get(staffUserId);
    return id ? this.getStaffIdentityContext(id) : null;
  }

  async saveStaffIdentityContext(snapshot: StaffIdentityContextSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.staffIdentities, snapshot.staffIdentityContextId, snapshot, options);
    this.staffIdentityByUser.set(snapshot.staffUserId, snapshot.staffIdentityContextId);
  }

  async getActingContext(id: string) {
    const snapshot = this.actingContexts.get(id);
    return snapshot ? structuredClone(snapshot) : null;
  }

  async saveActingContext(snapshot: ActingContextSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.actingContexts, snapshot.actingContextId, snapshot, options);
  }

  async getCurrentActingScopeTuple(actingContextId: string) {
    const tupleId = this.currentActingScopeTuple.get(actingContextId);
    if (!tupleId) {
      return null;
    }
    const snapshot = this.actingScopeTuples.get(tupleId);
    return snapshot ? structuredClone(snapshot) : null;
  }

  async getActingScopeTupleByHash(actingContextId: string, tupleHash: string) {
    const history = this.actingScopeTupleHistory.get(actingContextId) ?? [];
    for (const tupleId of [...history].reverse()) {
      const snapshot = this.actingScopeTuples.get(tupleId);
      if (snapshot?.tupleHash === tupleHash) {
        return structuredClone(snapshot);
      }
    }
    return null;
  }

  async listActingScopeTuples(actingContextId: string) {
    const history = this.actingScopeTupleHistory.get(actingContextId) ?? [];
    return history
      .map((tupleId) => this.actingScopeTuples.get(tupleId))
      .filter((value): value is ActingScopeTupleSnapshot => Boolean(value))
      .map((value) => structuredClone(value));
  }

  async saveActingScopeTuple(snapshot: ActingScopeTupleSnapshot, options?: CompareAndSetWriteOptions) {
    saveWithCas(this.actingScopeTuples, snapshot.actingScopeTupleId, snapshot, options);
    const history = this.actingScopeTupleHistory.get(snapshot.actingContextRef) ?? [];
    if (!history.includes(snapshot.actingScopeTupleId)) {
      history.push(snapshot.actingScopeTupleId);
      this.actingScopeTupleHistory.set(snapshot.actingContextRef, history);
    }
  }

  async setCurrentActingScopeTuple(actingContextId: string, actingScopeTupleId: string) {
    this.currentActingScopeTuple.set(actingContextId, actingScopeTupleId);
  }

  async getVisibilityEnvelope(id: string) {
    const snapshot = this.visibilityEnvelopes.get(id);
    return snapshot ? structuredClone(snapshot) : null;
  }

  async listVisibilityEnvelopes(actingContextId: string) {
    const history = this.visibilityEnvelopeHistory.get(actingContextId) ?? [];
    return history
      .map((envelopeId) => this.visibilityEnvelopes.get(envelopeId))
      .filter((value): value is CrossOrganisationVisibilityEnvelopeSnapshot => Boolean(value))
      .map((value) => structuredClone(value));
  }

  async saveVisibilityEnvelope(
    snapshot: CrossOrganisationVisibilityEnvelopeSnapshot,
    options?: CompareAndSetWriteOptions,
  ) {
    saveWithCas(this.visibilityEnvelopes, snapshot.crossOrganisationVisibilityEnvelopeId, snapshot, options);
    const history = this.visibilityEnvelopeHistory.get(snapshot.actingContextRef) ?? [];
    if (!history.includes(snapshot.crossOrganisationVisibilityEnvelopeId)) {
      history.push(snapshot.crossOrganisationVisibilityEnvelopeId);
      this.visibilityEnvelopeHistory.set(snapshot.actingContextRef, history);
    }
  }

  async appendAuthorityEvidence(snapshot: AuthorityEvidenceRecordSnapshot) {
    const history = this.authorityEvidence.get(snapshot.actingContextRef) ?? [];
    history.push(structuredClone(snapshot));
    this.authorityEvidence.set(snapshot.actingContextRef, history);
  }

  async listAuthorityEvidence(actingContextId: string) {
    return (this.authorityEvidence.get(actingContextId) ?? []).map((value) => structuredClone(value));
  }

  async appendBreakGlassAudit(snapshot: BreakGlassAuditRecordSnapshot) {
    const history = this.breakGlassAudit.get(snapshot.actingContextRef) ?? [];
    history.push(structuredClone(snapshot));
    this.breakGlassAudit.set(snapshot.actingContextRef, history);
  }

  async listBreakGlassAudit(actingContextId: string) {
    return (this.breakGlassAudit.get(actingContextId) ?? []).map((value) => structuredClone(value));
  }
}

export function createPhase5ActingScopeVisibilityStore(): Phase5ActingScopeVisibilityStore {
  return new InMemoryPhase5ActingScopeVisibilityStore();
}

function contractForAudience(audienceTierRef: AudienceTierRef): AudienceTierContract {
  return AUDIENCE_TIER_CONTRACTS[audienceTierRef];
}

function minimumNecessaryContractForAudience(audienceTierRef: AudienceTierRef): string {
  return contractForAudience(audienceTierRef).minimumNecessaryContractRef;
}

function roleUniverse(input: {
  cis2RoleClaims: readonly Cis2RoleClaim[];
  localRoleRefs?: readonly string[];
}): string[] {
  return uniqueSortedRefs([
    ...(input.localRoleRefs ?? []),
    ...input.cis2RoleClaims.flatMap((role) => [role.personRoleId, role.roleCode, role.roleName]),
  ]);
}

function rbacClaimsFromCis2Roles(roles: readonly Cis2RoleClaim[]): string[] {
  return uniqueSortedRefs(
    roles.flatMap((role) => [
      role.roleCode,
      role.roleName,
      ...uniqueSortedRefs(role.activityCodes ?? []),
      ...uniqueSortedRefs(role.aowCodes ?? []),
      ...uniqueSortedRefs(role.workgroupCodes ?? []),
    ]),
  );
}

function organisationUniverse(input: {
  homeOrganisation: string;
  activeOrganisation: string;
  affiliatedOrganisationRefs?: readonly string[];
  cis2RoleClaims: readonly Cis2RoleClaim[];
}): string[] {
  return uniqueSortedRefs([
    input.homeOrganisation,
    input.activeOrganisation,
    ...(input.affiliatedOrganisationRefs ?? []),
    ...input.cis2RoleClaims.map((role) => role.orgCode),
  ]);
}

function classifyContextState(driftClasses: readonly ActingScopeDriftClass[]): ActingContextState {
  return driftClasses.some((driftClass) => driftClass === "break_glass_revocation")
    ? "blocked"
    : driftClasses.length > 0
      ? "stale"
      : "current";
}

function deriveElevationStateFromExpiry(
  requestedState: ElevationState,
  expiresAt: string | null,
  asOf: string,
): ElevationState {
  if (requestedState === "none" || requestedState === "requested" || requestedState === "revoked") {
    return requestedState;
  }
  if (expiresAt === null) {
    return requestedState;
  }
  if (compareIso(expiresAt, asOf) <= 0) {
    return "revoked";
  }
  const minutesRemaining = Math.floor((Date.parse(expiresAt) - Date.parse(asOf)) / 60_000);
  return minutesRemaining <= 15 ? "expiring" : "active";
}

function computeActingScopeTupleHash(input: {
  staffUserId: string;
  activeOrganisationRef: string;
  activePcnId: string | null;
  activeHubSiteId: string | null;
  tenantScopeMode: TenantScopeMode;
  tenantScopeRefs: readonly string[];
  purposeOfUse: PurposeOfUse;
  actingRoleRef: string;
  audienceTierRef: AudienceTierRef;
  visibilityCoverageRef: string;
  minimumNecessaryContractRef: string;
  environmentRef: string;
  policyPlaneRef: string;
  elevationState: ElevationState;
  breakGlassState: BreakGlassState;
  switchGeneration: number;
}): string {
  return `scope_tuple_${stableReviewDigest({
    staffUserId: input.staffUserId,
    activeOrganisationRef: input.activeOrganisationRef,
    activePcnId: input.activePcnId,
    activeHubSiteId: input.activeHubSiteId,
    tenantScopeMode: input.tenantScopeMode,
    tenantScopeRefs: uniqueSortedRefs(input.tenantScopeRefs),
    purposeOfUse: input.purposeOfUse,
    actingRoleRef: input.actingRoleRef,
    audienceTierRef: input.audienceTierRef,
    visibilityCoverageRef: input.visibilityCoverageRef,
    minimumNecessaryContractRef: input.minimumNecessaryContractRef,
    environmentRef: input.environmentRef,
    policyPlaneRef: input.policyPlaneRef,
    elevationState: input.elevationState,
    breakGlassState: input.breakGlassState,
    switchGeneration: input.switchGeneration,
  })}`;
}

function normalizeStaffIdentityContext(snapshot: StaffIdentityContextSnapshot): StaffIdentityContextSnapshot {
  invariant(snapshot.authProvider === "cis2", "AUTH_PROVIDER_MUST_BE_CIS2", "authProvider must be cis2.");
  return {
    staffIdentityContextId: requireRef(snapshot.staffIdentityContextId, "staffIdentityContextId"),
    staffUserId: requireRef(snapshot.staffUserId, "staffUserId"),
    authProvider: "cis2",
    homeOrganisation: requireRef(snapshot.homeOrganisation, "homeOrganisation"),
    affiliatedOrganisationRefs: uniqueSortedRefs(snapshot.affiliatedOrganisationRefs),
    tenantGrantRefs: uniqueSortedRefs(snapshot.tenantGrantRefs),
    activeOrganisation: requireRef(snapshot.activeOrganisation, "activeOrganisation"),
    rbacClaims: uniqueSortedRefs(snapshot.rbacClaims),
    nationalRbacRef: optionalRef(snapshot.nationalRbacRef),
    localRoleRefs: uniqueSortedRefs(snapshot.localRoleRefs),
    sessionAssurance: snapshot.sessionAssurance,
    identityState: snapshot.identityState,
    authenticatedAt: ensureIsoTimestamp(snapshot.authenticatedAt, "authenticatedAt"),
    expiresAt: ensureIsoTimestamp(snapshot.expiresAt, "expiresAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeActingContext(snapshot: ActingContextSnapshot): ActingContextSnapshot {
  const contract = contractForAudience(snapshot.audienceTierRef);
  invariant(
    snapshot.minimumNecessaryContractRef === contract.minimumNecessaryContractRef,
    "MINIMUM_NECESSARY_CONTRACT_DRIFT",
    "minimumNecessaryContractRef must match the frozen audience-tier contract.",
  );
  return {
    actingContextId: requireRef(snapshot.actingContextId, "actingContextId"),
    staffIdentityContextRef: requireRef(snapshot.staffIdentityContextRef, "staffIdentityContextRef"),
    staffUserId: requireRef(snapshot.staffUserId, "staffUserId"),
    homePracticeOds: requireRef(snapshot.homePracticeOds, "homePracticeOds"),
    activeOrganisationRef: requireRef(snapshot.activeOrganisationRef, "activeOrganisationRef"),
    activePcnId: optionalRef(snapshot.activePcnId),
    activeHubSiteId: optionalRef(snapshot.activeHubSiteId),
    tenantScopeMode: snapshot.tenantScopeMode,
    tenantScopeRefs: uniqueSortedRefs(snapshot.tenantScopeRefs),
    purposeOfUse: snapshot.purposeOfUse,
    actingRoleRef: requireRef(snapshot.actingRoleRef, "actingRoleRef"),
    audienceTierRef: snapshot.audienceTierRef,
    visibilityCoverageRef: requireRef(snapshot.visibilityCoverageRef, "visibilityCoverageRef"),
    minimumNecessaryContractRef: requireRef(
      snapshot.minimumNecessaryContractRef,
      "minimumNecessaryContractRef",
    ),
    elevationState: snapshot.elevationState,
    breakGlassState: snapshot.breakGlassState,
    contextState: snapshot.contextState,
    scopeTupleHash: requireRef(snapshot.scopeTupleHash, "scopeTupleHash"),
    switchGeneration: ensureNonNegativeInteger(snapshot.switchGeneration, "switchGeneration"),
    issuedAt: ensureIsoTimestamp(snapshot.issuedAt, "issuedAt"),
    expiresAt: ensureIsoTimestamp(snapshot.expiresAt, "expiresAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeActingScopeTuple(snapshot: ActingScopeTupleSnapshot): ActingScopeTupleSnapshot {
  return {
    actingScopeTupleId: requireRef(snapshot.actingScopeTupleId, "actingScopeTupleId"),
    actingContextRef: requireRef(snapshot.actingContextRef, "actingContextRef"),
    staffIdentityContextRef: requireRef(snapshot.staffIdentityContextRef, "staffIdentityContextRef"),
    staffUserId: requireRef(snapshot.staffUserId, "staffUserId"),
    tupleHash: requireRef(snapshot.tupleHash, "tupleHash"),
    activeOrganisationRef: requireRef(snapshot.activeOrganisationRef, "activeOrganisationRef"),
    activePcnId: optionalRef(snapshot.activePcnId),
    activeHubSiteId: optionalRef(snapshot.activeHubSiteId),
    tenantScopeMode: snapshot.tenantScopeMode,
    tenantScopeRefs: uniqueSortedRefs(snapshot.tenantScopeRefs),
    purposeOfUse: snapshot.purposeOfUse,
    actingRoleRef: requireRef(snapshot.actingRoleRef, "actingRoleRef"),
    audienceTierRef: snapshot.audienceTierRef,
    visibilityCoverageRef: requireRef(snapshot.visibilityCoverageRef, "visibilityCoverageRef"),
    minimumNecessaryContractRef: requireRef(
      snapshot.minimumNecessaryContractRef,
      "minimumNecessaryContractRef",
    ),
    environmentRef: requireRef(snapshot.environmentRef, "environmentRef"),
    policyPlaneRef: requireRef(snapshot.policyPlaneRef, "policyPlaneRef"),
    switchGeneration: ensureNonNegativeInteger(snapshot.switchGeneration, "switchGeneration"),
    elevationState: snapshot.elevationState,
    elevationExpiresAt: optionalRef(snapshot.elevationExpiresAt),
    breakGlassState: snapshot.breakGlassState,
    breakGlassReasonCode: optionalRef(snapshot.breakGlassReasonCode),
    breakGlassJustification: optionalRef(snapshot.breakGlassJustification),
    breakGlassExpiresAt: optionalRef(snapshot.breakGlassExpiresAt),
    tupleState: snapshot.tupleState,
    issuedAt: ensureIsoTimestamp(snapshot.issuedAt, "issuedAt"),
    supersededAt: optionalRef(snapshot.supersededAt),
    expiresAt: ensureIsoTimestamp(snapshot.expiresAt, "expiresAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

function normalizeVisibilityEnvelope(
  snapshot: CrossOrganisationVisibilityEnvelopeSnapshot,
): CrossOrganisationVisibilityEnvelopeSnapshot {
  const contract = contractForAudience(snapshot.audienceTierRef);
  invariant(
    snapshot.minimumNecessaryContractRef === contract.minimumNecessaryContractRef,
    "VISIBILITY_CONTRACT_MINIMUM_NECESSARY_DRIFT",
    "Visibility envelope minimumNecessaryContractRef must match the frozen audience contract.",
  );
  invariant(
    stableReviewDigest(uniqueSortedRefs(snapshot.visibleFieldRefs)) ===
      stableReviewDigest(uniqueSortedRefs(contract.visibleFieldRefs)),
    "VISIBLE_FIELD_REFS_DRIFT",
    "Visibility envelope visibleFieldRefs must match the frozen audience contract.",
  );
  invariant(
    snapshot.placeholderContractRef === contract.placeholderContractRef,
    "PLACEHOLDER_CONTRACT_DRIFT",
    "placeholderContractRef must match the frozen audience contract.",
  );
  return {
    crossOrganisationVisibilityEnvelopeId: requireRef(
      snapshot.crossOrganisationVisibilityEnvelopeId,
      "crossOrganisationVisibilityEnvelopeId",
    ),
    actingContextRef: requireRef(snapshot.actingContextRef, "actingContextRef"),
    actingScopeTupleRef: requireRef(snapshot.actingScopeTupleRef, "actingScopeTupleRef"),
    sourceOrganisationRef: requireRef(snapshot.sourceOrganisationRef, "sourceOrganisationRef"),
    targetOrganisationRef: requireRef(snapshot.targetOrganisationRef, "targetOrganisationRef"),
    audienceTierRef: snapshot.audienceTierRef,
    purposeOfUseRef: snapshot.purposeOfUseRef,
    minimumNecessaryContractRef: requireRef(
      snapshot.minimumNecessaryContractRef,
      "minimumNecessaryContractRef",
    ),
    requiredCoverageRowRefs: uniqueSortedRefs(snapshot.requiredCoverageRowRefs),
    visibleFieldRefs: uniqueSortedRefs(snapshot.visibleFieldRefs),
    placeholderContractRef: requireRef(snapshot.placeholderContractRef, "placeholderContractRef"),
    envelopeState: snapshot.envelopeState,
    generatedAt: ensureIsoTimestamp(snapshot.generatedAt, "generatedAt"),
    version: ensurePositiveInteger(snapshot.version, "version"),
  };
}

async function requireStaffIdentityContext(
  repositories: Phase5ActingScopeVisibilityStore,
  staffIdentityContextId: string,
): Promise<StaffIdentityContextSnapshot> {
  const snapshot = await repositories.getStaffIdentityContext(staffIdentityContextId);
  invariant(
    snapshot !== null,
    "STAFF_IDENTITY_CONTEXT_NOT_FOUND",
    "StaffIdentityContext could not be found.",
  );
  return snapshot;
}

async function requireActingContext(
  repositories: Phase5ActingScopeVisibilityStore,
  actingContextId: string,
): Promise<ActingContextSnapshot> {
  const snapshot = await repositories.getActingContext(actingContextId);
  invariant(snapshot !== null, "ACTING_CONTEXT_NOT_FOUND", "ActingContext could not be found.");
  return snapshot;
}

async function requireCurrentActingScopeTuple(
  repositories: Phase5ActingScopeVisibilityStore,
  actingContextId: string,
): Promise<ActingScopeTupleSnapshot> {
  const snapshot = await repositories.getCurrentActingScopeTuple(actingContextId);
  invariant(
    snapshot !== null,
    "ACTING_SCOPE_TUPLE_NOT_FOUND",
    "Current ActingScopeTuple could not be found.",
  );
  return snapshot;
}

async function requireVisibilityEnvelope(
  repositories: Phase5ActingScopeVisibilityStore,
  visibilityEnvelopeId: string,
): Promise<CrossOrganisationVisibilityEnvelopeSnapshot> {
  const snapshot = await repositories.getVisibilityEnvelope(visibilityEnvelopeId);
  invariant(
    snapshot !== null,
    "CROSS_ORG_VISIBILITY_ENVELOPE_NOT_FOUND",
    "CrossOrganisationVisibilityEnvelope could not be found.",
  );
  return snapshot;
}

export interface Phase5ActingScopeVisibilityService {
  repositories: Phase5ActingScopeVisibilityStore;
  hubCaseService: Phase5HubCaseKernelService;
  bootstrapActingContextFromAuthenticatedStaff(
    input: BootstrapStaffActingContextInput,
  ): Promise<BootstrapStaffActingContextResult>;
  reissueActingContext(input: ReissueActingContextInput): Promise<BootstrapStaffActingContextResult>;
  requestElevation(input: RequestActingElevationInput): Promise<BootstrapStaffActingContextResult>;
  grantElevation(input: GrantActingElevationInput): Promise<BootstrapStaffActingContextResult>;
  activateBreakGlass(input: ActivateBreakGlassInput): Promise<BootstrapStaffActingContextResult>;
  revokeBreakGlass(input: RevokeBreakGlassInput): Promise<BootstrapStaffActingContextResult>;
  materializeCurrentCrossOrganisationVisibilityEnvelope(
    input: MaterializeVisibilityEnvelopeInput,
  ): Promise<CrossOrganisationVisibilityEnvelopeSnapshot>;
  detectActingScopeDrift(
    input: ActingScopeDriftDetectionInput,
  ): Promise<ActingScopeDriftDetectionResult>;
  applyMinimumNecessaryProjection(
    visibilityEnvelopeId: string,
    projectionFields: Readonly<Record<string, unknown>>,
  ): Promise<MinimumNecessaryProjectionResult>;
  materializeHubCaseAudienceProjection(
    input: MaterializeHubCaseAudienceProjectionInput,
  ): Promise<MinimumNecessaryProjectionResult>;
  validateCurrentHubCommandScope(input: HubCommandAuthorityInput): Promise<HubCommandAuthorityDecision>;
  assertCurrentHubCommandScope(input: HubCommandAuthorityInput): Promise<HubCommandAuthorityDecision>;
  queryAuthorityEvidence(
    actingContextId: string,
  ): Promise<readonly AuthorityEvidenceRecordSnapshot[]>;
  queryBreakGlassAudit(actingContextId: string): Promise<readonly BreakGlassAuditRecordSnapshot[]>;
}

export function createPhase5ActingScopeVisibilityService(input?: {
  repositories?: Phase5ActingScopeVisibilityStore;
  idGenerator?: BackboneIdGenerator;
  hubCaseService?: Phase5HubCaseKernelService;
}): Phase5ActingScopeVisibilityService {
  const repositories = input?.repositories ?? createPhase5ActingScopeVisibilityStore();
  const idGenerator =
    input?.idGenerator ?? createDeterministicBackboneIdGenerator("phase5-acting-scope-visibility");
  const hubCaseService = input?.hubCaseService ?? createPhase5HubCaseKernelService();

  async function saveContextAndTuple(inputValue: {
    staffIdentityContext: StaffIdentityContextSnapshot;
    actingContext: ActingContextSnapshot;
    currentActingScopeTuple: ActingScopeTupleSnapshot;
    supersededActingScopeTuple: ActingScopeTupleSnapshot | null;
  }) {
    await repositories.saveStaffIdentityContext(normalizeStaffIdentityContext(inputValue.staffIdentityContext), {
      expectedVersion: inputValue.staffIdentityContext.version > 1
        ? inputValue.staffIdentityContext.version - 1
        : undefined,
    });
    await repositories.saveActingContext(normalizeActingContext(inputValue.actingContext), {
      expectedVersion: inputValue.actingContext.version > 1 ? inputValue.actingContext.version - 1 : undefined,
    });
    if (inputValue.supersededActingScopeTuple) {
      await repositories.saveActingScopeTuple(normalizeActingScopeTuple(inputValue.supersededActingScopeTuple), {
        expectedVersion: inputValue.supersededActingScopeTuple.version > 1
          ? inputValue.supersededActingScopeTuple.version - 1
          : undefined,
      });
    }
    await repositories.saveActingScopeTuple(normalizeActingScopeTuple(inputValue.currentActingScopeTuple), {
      expectedVersion: inputValue.currentActingScopeTuple.version > 1
        ? inputValue.currentActingScopeTuple.version - 1
        : undefined,
    });
    await repositories.setCurrentActingScopeTuple(
      inputValue.actingContext.actingContextId,
      inputValue.currentActingScopeTuple.actingScopeTupleId,
    );
  }

  async function supersedeVisibilityEnvelopes(
    actingContextId: string,
    nextState: VisibilityEnvelopeState,
  ): Promise<void> {
    const envelopes = await repositories.listVisibilityEnvelopes(actingContextId);
    for (const envelope of envelopes) {
      if (envelope.envelopeState === nextState || envelope.envelopeState === "superseded") {
        continue;
      }
      await repositories.saveVisibilityEnvelope(
        normalizeVisibilityEnvelope({
          ...envelope,
          envelopeState: nextState,
          version: nextVersion(envelope.version),
        }),
        { expectedVersion: envelope.version },
      );
    }
  }

  async function appendBreakGlassAudit(
    actingContextRef: string,
    actingScopeTupleRef: string,
    staffUserId: string,
    action: BreakGlassAuditAction,
    reasonCode: string,
    justification: string | null,
    routeFamilyRef: string | null,
    expiresAt: string | null,
    recordedAt: string,
  ) {
    const history = await repositories.listBreakGlassAudit(actingContextRef);
    const record: BreakGlassAuditRecordSnapshot = {
      breakGlassAuditRecordId: nextHubAuthorityId(idGenerator, "break_glass_audit_record"),
      actingContextRef,
      actingScopeTupleRef,
      staffUserId,
      action,
      reasonCode: requireRef(reasonCode, "reasonCode"),
      justification: optionalRef(justification),
      routeFamilyRef: optionalRef(routeFamilyRef),
      expiresAt: optionalRef(expiresAt),
      recordedAt: ensureIsoTimestamp(recordedAt, "recordedAt"),
      version: history.length + 1,
    };
    await repositories.appendBreakGlassAudit(record);
  }

  async function appendAuthorityEvidence(
    inputValue: Omit<AuthorityEvidenceRecordSnapshot, "authorityEvidenceRecordId" | "version">,
  ): Promise<AuthorityEvidenceRecordSnapshot> {
    const history = await repositories.listAuthorityEvidence(inputValue.actingContextRef);
    const record: AuthorityEvidenceRecordSnapshot = {
      ...inputValue,
      authorityEvidenceRecordId: nextHubAuthorityId(idGenerator, "authority_evidence_record"),
      version: history.length + 1,
    };
    await repositories.appendAuthorityEvidence(record);
    return record;
  }

  function buildScopeTuple(inputValue: {
    actingContextId: string;
    staffIdentityContextRef: string;
    staffUserId: string;
    activeOrganisationRef: string;
    activePcnId: string | null;
    activeHubSiteId: string | null;
    tenantScopeMode: TenantScopeMode;
    tenantScopeRefs: readonly string[];
    purposeOfUse: PurposeOfUse;
    actingRoleRef: string;
    audienceTierRef: AudienceTierRef;
    visibilityCoverageRef: string;
    environmentRef: string;
    policyPlaneRef: string;
    switchGeneration: number;
    elevationState: ElevationState;
    elevationExpiresAt: string | null;
    breakGlassState: BreakGlassState;
    breakGlassReasonCode: string | null;
    breakGlassJustification: string | null;
    breakGlassExpiresAt: string | null;
    issuedAt: string;
    expiresAt: string;
  }): ActingScopeTupleSnapshot {
    const minimumNecessaryContractRef = minimumNecessaryContractForAudience(inputValue.audienceTierRef);
    const tupleHash = computeActingScopeTupleHash({
      staffUserId: inputValue.staffUserId,
      activeOrganisationRef: inputValue.activeOrganisationRef,
      activePcnId: inputValue.activePcnId,
      activeHubSiteId: inputValue.activeHubSiteId,
      tenantScopeMode: inputValue.tenantScopeMode,
      tenantScopeRefs: inputValue.tenantScopeRefs,
      purposeOfUse: inputValue.purposeOfUse,
      actingRoleRef: inputValue.actingRoleRef,
      audienceTierRef: inputValue.audienceTierRef,
      visibilityCoverageRef: inputValue.visibilityCoverageRef,
      minimumNecessaryContractRef,
      environmentRef: inputValue.environmentRef,
      policyPlaneRef: inputValue.policyPlaneRef,
      elevationState: inputValue.elevationState,
      breakGlassState: inputValue.breakGlassState,
      switchGeneration: inputValue.switchGeneration,
    });
    return normalizeActingScopeTuple({
      actingScopeTupleId: nextHubAuthorityId(idGenerator, "acting_scope_tuple"),
      actingContextRef: inputValue.actingContextId,
      staffIdentityContextRef: inputValue.staffIdentityContextRef,
      staffUserId: inputValue.staffUserId,
      tupleHash,
      activeOrganisationRef: inputValue.activeOrganisationRef,
      activePcnId: inputValue.activePcnId,
      activeHubSiteId: inputValue.activeHubSiteId,
      tenantScopeMode: inputValue.tenantScopeMode,
      tenantScopeRefs: uniqueSortedRefs(inputValue.tenantScopeRefs),
      purposeOfUse: inputValue.purposeOfUse,
      actingRoleRef: inputValue.actingRoleRef,
      audienceTierRef: inputValue.audienceTierRef,
      visibilityCoverageRef: inputValue.visibilityCoverageRef,
      minimumNecessaryContractRef,
      environmentRef: inputValue.environmentRef,
      policyPlaneRef: inputValue.policyPlaneRef,
      switchGeneration: inputValue.switchGeneration,
      elevationState: inputValue.elevationState,
      elevationExpiresAt: optionalRef(inputValue.elevationExpiresAt),
      breakGlassState: inputValue.breakGlassState,
      breakGlassReasonCode: optionalRef(inputValue.breakGlassReasonCode),
      breakGlassJustification: optionalRef(inputValue.breakGlassJustification),
      breakGlassExpiresAt: optionalRef(inputValue.breakGlassExpiresAt),
      tupleState: "current",
      issuedAt: inputValue.issuedAt,
      supersededAt: null,
      expiresAt: inputValue.expiresAt,
      version: 1,
    });
  }

  async function freezeContextOnDrift(
    actingContext: ActingContextSnapshot,
    actingScopeTuple: ActingScopeTupleSnapshot,
    nextState: ActingContextState,
    driftRecordedAt: string,
  ): Promise<{
    actingContext: ActingContextSnapshot;
    actingScopeTuple: ActingScopeTupleSnapshot;
  }> {
    const normalizedContextState =
      actingContext.contextState === "blocked" ? "blocked" : nextState;
    const nextContext = normalizeActingContext({
      ...actingContext,
      contextState: normalizedContextState,
      issuedAt: actingContext.issuedAt,
      expiresAt: actingContext.expiresAt,
      version: nextVersion(actingContext.version),
    });
    const nextTuple = normalizeActingScopeTuple({
      ...actingScopeTuple,
      tupleState: normalizedContextState === "blocked" ? "blocked" : "stale",
      supersededAt: optionalRef(actingScopeTuple.supersededAt) ?? driftRecordedAt,
      version: nextVersion(actingScopeTuple.version),
    });
    await repositories.saveActingContext(nextContext, { expectedVersion: actingContext.version });
    await repositories.saveActingScopeTuple(nextTuple, { expectedVersion: actingScopeTuple.version });
    await supersedeVisibilityEnvelopes(
      actingContext.actingContextId,
      normalizedContextState === "blocked" ? "blocked" : "stale",
    );
    return { actingContext: nextContext, actingScopeTuple: nextTuple };
  }

  async function reissueActingContextInternal(
    currentContext: ActingContextSnapshot,
    currentTuple: ActingScopeTupleSnapshot,
    inputValue: ReissueActingContextInput,
    overrides?: {
      nextElevationState?: ElevationState;
      nextElevationExpiresAt?: string | null;
      nextBreakGlassState?: BreakGlassState;
      nextBreakGlassReasonCode?: string | null;
      nextBreakGlassJustification?: string | null;
      nextBreakGlassExpiresAt?: string | null;
      nextContextState?: ActingContextState;
      incrementSwitchGeneration?: boolean;
    },
  ): Promise<BootstrapStaffActingContextResult> {
    const staffIdentityContext = await requireStaffIdentityContext(
      repositories,
      currentContext.staffIdentityContextRef,
    );
    const nextActiveOrganisationRef =
      optionalRef(inputValue.nextActiveOrganisationRef) ?? currentContext.activeOrganisationRef;
    const availableOrganisations = uniqueSortedRefs([
      staffIdentityContext.homeOrganisation,
      staffIdentityContext.activeOrganisation,
      ...staffIdentityContext.affiliatedOrganisationRefs,
    ]);
    invariant(
      availableOrganisations.includes(nextActiveOrganisationRef),
      "ACTING_ORGANISATION_NOT_GRANTED",
      "The requested organisation is not granted to the active staff identity.",
    );

    const nextAudienceTierRef = inputValue.nextAudienceTierRef ?? currentContext.audienceTierRef;
    const nextSwitchGeneration =
      (overrides?.incrementSwitchGeneration ?? true)
        ? currentContext.switchGeneration + 1
        : currentContext.switchGeneration;
    const nextExpiresAt = ensureIsoTimestamp(
      inputValue.nextExpiresAt ?? currentContext.expiresAt,
      "nextExpiresAt",
    );

    const supersededTuple = normalizeActingScopeTuple({
      ...currentTuple,
      tupleState:
        overrides?.nextContextState === "blocked"
          ? "blocked"
          : currentTuple.tupleState === "blocked"
            ? "blocked"
            : "superseded",
      supersededAt: inputValue.requestedAt,
      version: nextVersion(currentTuple.version),
    });

    const nextContext = normalizeActingContext({
      ...currentContext,
      activeOrganisationRef: nextActiveOrganisationRef,
      activePcnId:
        inputValue.nextActivePcnId === undefined ? currentContext.activePcnId : optionalRef(inputValue.nextActivePcnId),
      activeHubSiteId:
        inputValue.nextActiveHubSiteId === undefined
          ? currentContext.activeHubSiteId
          : optionalRef(inputValue.nextActiveHubSiteId),
      tenantScopeMode: inputValue.nextTenantScopeMode ?? currentContext.tenantScopeMode,
      tenantScopeRefs:
        inputValue.nextTenantScopeRefs === undefined
          ? currentContext.tenantScopeRefs
          : uniqueSortedRefs(inputValue.nextTenantScopeRefs),
      purposeOfUse: inputValue.nextPurposeOfUse ?? currentContext.purposeOfUse,
      actingRoleRef: inputValue.nextActingRoleRef ?? currentContext.actingRoleRef,
      audienceTierRef: nextAudienceTierRef,
      visibilityCoverageRef:
        inputValue.nextVisibilityCoverageRef ?? currentContext.visibilityCoverageRef,
      minimumNecessaryContractRef: minimumNecessaryContractForAudience(nextAudienceTierRef),
      elevationState:
        overrides?.nextElevationState === undefined
          ? currentContext.elevationState
          : overrides.nextElevationState,
      breakGlassState:
        overrides?.nextBreakGlassState === undefined
          ? currentContext.breakGlassState
          : overrides.nextBreakGlassState,
      contextState: overrides?.nextContextState ?? "current",
      scopeTupleHash: currentContext.scopeTupleHash,
      switchGeneration: nextSwitchGeneration,
      issuedAt: inputValue.requestedAt,
      expiresAt: nextExpiresAt,
      version: nextVersion(currentContext.version),
    });

    const nextTuple = buildScopeTuple({
      actingContextId: currentContext.actingContextId,
      staffIdentityContextRef: currentContext.staffIdentityContextRef,
      staffUserId: currentContext.staffUserId,
      activeOrganisationRef: nextContext.activeOrganisationRef,
      activePcnId: nextContext.activePcnId,
      activeHubSiteId: nextContext.activeHubSiteId,
      tenantScopeMode: nextContext.tenantScopeMode,
      tenantScopeRefs: nextContext.tenantScopeRefs,
      purposeOfUse: nextContext.purposeOfUse,
      actingRoleRef: nextContext.actingRoleRef,
      audienceTierRef: nextContext.audienceTierRef,
      visibilityCoverageRef: nextContext.visibilityCoverageRef,
      environmentRef: requireRef(inputValue.environmentRef, "environmentRef"),
      policyPlaneRef: requireRef(inputValue.policyPlaneRef, "policyPlaneRef"),
      switchGeneration: nextContext.switchGeneration,
      elevationState: deriveElevationStateFromExpiry(
        nextContext.elevationState,
        overrides?.nextElevationExpiresAt ?? currentTuple.elevationExpiresAt,
        inputValue.requestedAt,
      ),
      elevationExpiresAt:
        overrides?.nextElevationExpiresAt === undefined
          ? currentTuple.elevationExpiresAt
          : overrides.nextElevationExpiresAt,
      breakGlassState: nextContext.breakGlassState,
      breakGlassReasonCode:
        overrides?.nextBreakGlassReasonCode === undefined
          ? currentTuple.breakGlassReasonCode
          : overrides.nextBreakGlassReasonCode,
      breakGlassJustification:
        overrides?.nextBreakGlassJustification === undefined
          ? currentTuple.breakGlassJustification
          : overrides.nextBreakGlassJustification,
      breakGlassExpiresAt:
        overrides?.nextBreakGlassExpiresAt === undefined
          ? currentTuple.breakGlassExpiresAt
          : overrides.nextBreakGlassExpiresAt,
      issuedAt: inputValue.requestedAt,
      expiresAt: nextContext.expiresAt,
    });

    const hydratedContext = normalizeActingContext({
      ...nextContext,
      scopeTupleHash: nextTuple.tupleHash,
    });
    const updatedStaffIdentity = normalizeStaffIdentityContext({
      ...staffIdentityContext,
      activeOrganisation: nextContext.activeOrganisationRef,
      version: nextVersion(staffIdentityContext.version),
    });

    await saveContextAndTuple({
      staffIdentityContext: updatedStaffIdentity,
      actingContext: hydratedContext,
      currentActingScopeTuple: nextTuple,
      supersededActingScopeTuple: supersededTuple,
    });
    await supersedeVisibilityEnvelopes(
      currentContext.actingContextId,
      overrides?.nextContextState === "blocked" ? "blocked" : "superseded",
    );
    return {
      staffIdentityContext: updatedStaffIdentity,
      actingContext: hydratedContext,
      actingScopeTuple: nextTuple,
      supersededActingScopeTuple: supersededTuple,
    };
  }

  function flatHubCaseProjectionRecord(bundle: HubCaseBundle): Record<string, unknown> {
    return {
      requestLineageRef: bundle.networkBookingRequest.requestLineageRef,
      clinical_routing_summary: {
        reasonForHubRouting: bundle.networkBookingRequest.reasonForHubRouting,
        priorityBand: bundle.networkBookingRequest.priorityBand,
        clinicianType: bundle.networkBookingRequest.clinicianType,
      },
      operational_timing_needs: {
        dueAt: bundle.networkBookingRequest.clinicalTimeframe.dueAt,
        latestSafeOfferAt: bundle.networkBookingRequest.clinicalTimeframe.latestSafeOfferAt,
        expectedCoordinationMinutes: bundle.hubCase.expectedCoordinationMinutes,
      },
      travel_access_constraints: bundle.networkBookingRequest.travelConstraints,
      governed_coordination_evidence: {
        bookingEvidenceRef: bundle.hubCase.bookingEvidenceRef,
        policyTupleHash: bundle.hubCase.policyTupleHash,
        offerToConfirmationTruthRef: bundle.hubCase.offerToConfirmationTruthRef,
      },
      selected_candidate_ref: bundle.hubCase.selectedCandidateRef,
      macro_booking_status: bundle.hubCase.status,
      fallback_reason_code: bundle.hubCase.activeFallbackRef,
      patient_communication_state: bundle.hubCase.externalConfirmationState,
      latest_continuity_delta: bundle.hubCase.lastMaterialReturnAt,
      ack_generation_state: bundle.hubCase.practiceAckGeneration,
      encounter_delivery_brief: {
        networkAppointmentRef: bundle.hubCase.networkAppointmentRef,
        servingPcnId: bundle.hubCase.servingPcnId,
      },
      site_local_capacity: {
        candidateSnapshotRef: bundle.hubCase.candidateSnapshotRef,
        crossSiteDecisionPlanRef: bundle.hubCase.crossSiteDecisionPlanRef,
      },
      confirmed_slot_summary: bundle.hubCase.networkAppointmentRef,
      manage_capability_state: bundle.hubCase.status,
      hub_internal_free_text: "withheld_hub_internal_narrative",
      cross_site_capacity_detail: bundle.hubCase.crossSiteDecisionPlanRef,
      raw_native_booking_proof: bundle.hubCase.bookingEvidenceRef,
      broad_narrative_without_promotion: "withheld_broad_narrative",
      attachment_payload_without_break_glass: "withheld_attachment_payload",
      origin_practice_triage_notes: "withheld_origin_triage_notes",
      callback_rationale: bundle.hubCase.callbackExpectationRef,
      alternative_options_other_sites: bundle.hubCase.activeAlternativeOfferSessionRef,
    };
  }

  return {
    repositories,
    hubCaseService,

    async bootstrapActingContextFromAuthenticatedStaff(command) {
      const authenticatedAt = ensureIsoTimestamp(command.authenticatedAt, "authenticatedAt");
      const expiresAt = ensureIsoTimestamp(command.expiresAt, "expiresAt");
      invariant(
        compareIso(expiresAt, authenticatedAt) > 0,
        "AUTHENTICATION_EXPIRY_INVALID",
        "expiresAt must be after authenticatedAt.",
      );
      const availableRoles = roleUniverse(command);
      invariant(
        availableRoles.includes(command.actingRoleRef),
        "ACTING_ROLE_NOT_GRANTED",
        "actingRoleRef must be present in the selected CIS2 role universe.",
      );
      const availableOrganisations = organisationUniverse(command);
      invariant(
        availableOrganisations.includes(command.activeOrganisation),
        "ACTIVE_ORGANISATION_NOT_GRANTED",
        "activeOrganisation must be one of the organisations granted to the staff identity.",
      );
      const existingIdentity = await repositories.findStaffIdentityContextByStaffUserId(command.staffUserId);
      const staffIdentityContextId =
        command.staffIdentityContextId ??
        existingIdentity?.staffIdentityContextId ??
        nextHubAuthorityId(idGenerator, "staff_identity_context");
      const actingContextId =
        command.actingContextId ?? nextHubAuthorityId(idGenerator, "acting_context");
      const staffIdentityContext = normalizeStaffIdentityContext({
        staffIdentityContextId,
        staffUserId: requireRef(command.staffUserId, "staffUserId"),
        authProvider: "cis2",
        homeOrganisation: requireRef(command.homeOrganisation, "homeOrganisation"),
        affiliatedOrganisationRefs: availableOrganisations.filter(
          (organisationRef) => organisationRef !== command.homeOrganisation,
        ),
        tenantGrantRefs: uniqueSortedRefs(command.tenantGrantRefs ?? command.tenantScopeRefs),
        activeOrganisation: requireRef(command.activeOrganisation, "activeOrganisation"),
        rbacClaims: rbacClaimsFromCis2Roles(command.cis2RoleClaims),
        nationalRbacRef: optionalRef(command.nationalRbacRef),
        localRoleRefs: availableRoles,
        sessionAssurance: command.sessionAssurance,
        identityState: "authenticated",
        authenticatedAt,
        expiresAt,
        version: existingIdentity ? nextVersion(existingIdentity.version) : 1,
      });
      const actingScopeTuple = buildScopeTuple({
        actingContextId,
        staffIdentityContextRef: staffIdentityContextId,
        staffUserId: command.staffUserId,
        activeOrganisationRef: command.activeOrganisation,
        activePcnId: optionalRef(command.activePcnId),
        activeHubSiteId: optionalRef(command.activeHubSiteId),
        tenantScopeMode: command.tenantScopeMode,
        tenantScopeRefs: uniqueSortedRefs(command.tenantScopeRefs),
        purposeOfUse: command.purposeOfUse,
        actingRoleRef: command.actingRoleRef,
        audienceTierRef: command.audienceTierRef,
        visibilityCoverageRef: command.visibilityCoverageRef,
        environmentRef: command.environmentRef,
        policyPlaneRef: command.policyPlaneRef,
        switchGeneration: existingIdentity ? 1 : 0,
        elevationState: "none",
        elevationExpiresAt: null,
        breakGlassState: "none",
        breakGlassReasonCode: null,
        breakGlassJustification: null,
        breakGlassExpiresAt: null,
        issuedAt: authenticatedAt,
        expiresAt,
      });
      const actingContext = normalizeActingContext({
        actingContextId,
        staffIdentityContextRef: staffIdentityContextId,
        staffUserId: command.staffUserId,
        homePracticeOds: requireRef(command.homePracticeOds, "homePracticeOds"),
        activeOrganisationRef: command.activeOrganisation,
        activePcnId: optionalRef(command.activePcnId),
        activeHubSiteId: optionalRef(command.activeHubSiteId),
        tenantScopeMode: command.tenantScopeMode,
        tenantScopeRefs: uniqueSortedRefs(command.tenantScopeRefs),
        purposeOfUse: command.purposeOfUse,
        actingRoleRef: command.actingRoleRef,
        audienceTierRef: command.audienceTierRef,
        visibilityCoverageRef: requireRef(command.visibilityCoverageRef, "visibilityCoverageRef"),
        minimumNecessaryContractRef: minimumNecessaryContractForAudience(command.audienceTierRef),
        elevationState: "none",
        breakGlassState: "none",
        contextState: "current",
        scopeTupleHash: actingScopeTuple.tupleHash,
        switchGeneration: existingIdentity ? 1 : 0,
        issuedAt: authenticatedAt,
        expiresAt,
        version: 1,
      });
      await saveContextAndTuple({
        staffIdentityContext,
        actingContext,
        currentActingScopeTuple: actingScopeTuple,
        supersededActingScopeTuple: null,
      });
      return {
        staffIdentityContext,
        actingContext,
        actingScopeTuple,
        supersededActingScopeTuple: null,
      };
    },

    async reissueActingContext(command) {
      const currentContext = await requireActingContext(repositories, command.actingContextId);
      const currentTuple = await requireCurrentActingScopeTuple(repositories, command.actingContextId);
      return reissueActingContextInternal(currentContext, currentTuple, command);
    },

    async requestElevation(command) {
      const currentContext = await requireActingContext(repositories, command.actingContextId);
      const currentTuple = await requireCurrentActingScopeTuple(repositories, command.actingContextId);
      await appendBreakGlassAudit(
        currentContext.actingContextId,
        currentTuple.tupleHash,
        currentContext.staffUserId,
        "requested",
        requireRef(command.reasonCode, "reasonCode"),
        optionalRef(command.justification),
        optionalRef(command.supervisorRef),
        null,
        ensureIsoTimestamp(command.requestedAt, "requestedAt"),
      );
      return reissueActingContextInternal(
        currentContext,
        currentTuple,
        {
          actingContextId: command.actingContextId,
          requestedAt: ensureIsoTimestamp(command.requestedAt, "requestedAt"),
          environmentRef: currentTuple.environmentRef,
          policyPlaneRef: currentTuple.policyPlaneRef,
          nextExpiresAt: currentContext.expiresAt,
        },
        {
          nextElevationState: "requested",
          incrementSwitchGeneration: false,
        },
      );
    },

    async grantElevation(command) {
      const currentContext = await requireActingContext(repositories, command.actingContextId);
      const currentTuple = await requireCurrentActingScopeTuple(repositories, command.actingContextId);
      return reissueActingContextInternal(
        currentContext,
        currentTuple,
        {
          actingContextId: command.actingContextId,
          requestedAt: ensureIsoTimestamp(command.grantedAt, "grantedAt"),
          environmentRef: currentTuple.environmentRef,
          policyPlaneRef: currentTuple.policyPlaneRef,
          nextActingRoleRef: optionalRef(command.elevatedRoleRef) ?? currentContext.actingRoleRef,
          nextExpiresAt: currentContext.expiresAt,
        },
        {
          nextElevationState: "active",
          nextElevationExpiresAt: ensureIsoTimestamp(command.expiresAt, "expiresAt"),
          incrementSwitchGeneration: false,
        },
      );
    },

    async activateBreakGlass(command) {
      const currentContext = await requireActingContext(repositories, command.actingContextId);
      const currentTuple = await requireCurrentActingScopeTuple(repositories, command.actingContextId);
      const reasonCode = requireRef(command.reasonCode, "reasonCode");
      const policy = BREAK_GLASS_REASON_POLICIES[reasonCode];
      invariant(
        policy !== undefined,
        "BREAK_GLASS_REASON_UNKNOWN",
        "reasonCode must be a known break-glass reason code.",
      );
      invariant(
        !policy.requiresJustification || optionalRef(command.justification) !== null,
        "BREAK_GLASS_JUSTIFICATION_REQUIRED",
        "Break-glass justification is required for the supplied reason code.",
      );
      const activatedAt = ensureIsoTimestamp(command.activatedAt, "activatedAt");
      const expiresAt = ensureIsoTimestamp(command.expiresAt, "expiresAt");
      invariant(
        compareIso(expiresAt, activatedAt) > 0,
        "BREAK_GLASS_EXPIRY_INVALID",
        "Break-glass expiresAt must be after activatedAt.",
      );
      const result = await reissueActingContextInternal(
        currentContext,
        currentTuple,
        {
          actingContextId: command.actingContextId,
          requestedAt: activatedAt,
          environmentRef: currentTuple.environmentRef,
          policyPlaneRef: currentTuple.policyPlaneRef,
          nextPurposeOfUse: "break_glass_patient_safety",
          nextExpiresAt: currentContext.expiresAt,
        },
        {
          nextBreakGlassState: "active",
          nextBreakGlassReasonCode: reasonCode,
          nextBreakGlassJustification: optionalRef(command.justification),
          nextBreakGlassExpiresAt: expiresAt,
          nextElevationState: "active",
          nextElevationExpiresAt: expiresAt,
          incrementSwitchGeneration: false,
        },
      );
      await appendBreakGlassAudit(
        result.actingContext.actingContextId,
        result.actingScopeTuple.tupleHash,
        result.actingContext.staffUserId,
        "activated",
        reasonCode,
        optionalRef(command.justification),
        command.routeFamilyRef,
        expiresAt,
        activatedAt,
      );
      return result;
    },

    async revokeBreakGlass(command) {
      const currentContext = await requireActingContext(repositories, command.actingContextId);
      const currentTuple = await requireCurrentActingScopeTuple(repositories, command.actingContextId);
      const revokedAt = ensureIsoTimestamp(command.revokedAt, "revokedAt");
      const result = await reissueActingContextInternal(
        currentContext,
        currentTuple,
        {
          actingContextId: command.actingContextId,
          requestedAt: revokedAt,
          environmentRef: currentTuple.environmentRef,
          policyPlaneRef: currentTuple.policyPlaneRef,
          nextPurposeOfUse: currentContext.purposeOfUse,
          nextExpiresAt: currentContext.expiresAt,
        },
        {
          nextBreakGlassState: "revoked",
          nextBreakGlassReasonCode: requireRef(command.reasonCode, "reasonCode"),
          nextBreakGlassJustification: command.revokedBy,
          nextBreakGlassExpiresAt: revokedAt,
          nextElevationState: "revoked",
          nextElevationExpiresAt: revokedAt,
          nextContextState: "blocked",
          incrementSwitchGeneration: false,
        },
      );
      await appendBreakGlassAudit(
        result.actingContext.actingContextId,
        result.actingScopeTuple.tupleHash,
        result.actingContext.staffUserId,
        "revoked",
        requireRef(command.reasonCode, "reasonCode"),
        requireRef(command.revokedBy, "revokedBy"),
        null,
        revokedAt,
        revokedAt,
      );
      return result;
    },

    async materializeCurrentCrossOrganisationVisibilityEnvelope(command) {
      const actingContext = await requireActingContext(repositories, command.actingContextId);
      const actingScopeTuple = await requireCurrentActingScopeTuple(repositories, command.actingContextId);
      invariant(
        actingContext.contextState === "current" && actingScopeTuple.tupleState === "current",
        "ACTING_CONTEXT_STALE_FOR_VISIBILITY",
        "ActingContext must be current before a visibility envelope can be materialized.",
      );
      const contract = contractForAudience(actingContext.audienceTierRef);
      const existing = (await repositories.listVisibilityEnvelopes(command.actingContextId)).filter(
        (envelope) =>
          envelope.sourceOrganisationRef === command.sourceOrganisationRef &&
          envelope.targetOrganisationRef === command.targetOrganisationRef &&
          envelope.audienceTierRef === actingContext.audienceTierRef &&
          envelope.envelopeState === "current",
      );
      for (const envelope of existing) {
        await repositories.saveVisibilityEnvelope(
          normalizeVisibilityEnvelope({
            ...envelope,
            envelopeState: "superseded",
            version: nextVersion(envelope.version),
          }),
          { expectedVersion: envelope.version },
        );
      }
      const snapshot = normalizeVisibilityEnvelope({
        crossOrganisationVisibilityEnvelopeId:
          command.crossOrganisationVisibilityEnvelopeId ??
          nextHubAuthorityId(idGenerator, "cross_org_visibility_envelope"),
        actingContextRef: actingContext.actingContextId,
        actingScopeTupleRef: actingScopeTuple.tupleHash,
        sourceOrganisationRef: requireRef(command.sourceOrganisationRef, "sourceOrganisationRef"),
        targetOrganisationRef: requireRef(command.targetOrganisationRef, "targetOrganisationRef"),
        audienceTierRef: actingContext.audienceTierRef,
        purposeOfUseRef: actingContext.purposeOfUse,
        minimumNecessaryContractRef: actingContext.minimumNecessaryContractRef,
        requiredCoverageRowRefs: uniqueSortedRefs(command.requiredCoverageRowRefs),
        visibleFieldRefs: uniqueSortedRefs(contract.visibleFieldRefs),
        placeholderContractRef: contract.placeholderContractRef,
        envelopeState: "current",
        generatedAt: ensureIsoTimestamp(command.generatedAt, "generatedAt"),
        version: 1,
      });
      invariant(
        snapshot.requiredCoverageRowRefs.length > 0,
        "VISIBILITY_COVERAGE_ROWS_REQUIRED",
        "requiredCoverageRowRefs must contain at least one coverage row.",
      );
      await repositories.saveVisibilityEnvelope(snapshot);
      return snapshot;
    },

    async detectActingScopeDrift(command) {
      const asOf = ensureIsoTimestamp(command.asOf, "asOf");
      const actingContext = await requireActingContext(repositories, command.actingContextId);
      const actingScopeTuple = await requireCurrentActingScopeTuple(repositories, command.actingContextId);
      const staffIdentityContext = await requireStaffIdentityContext(
        repositories,
        actingContext.staffIdentityContextRef,
      );
      let refreshedStaffIdentity = staffIdentityContext;
      if (
        staffIdentityContext.identityState === "authenticated" &&
        compareIso(staffIdentityContext.expiresAt, asOf) <= 0
      ) {
        refreshedStaffIdentity = normalizeStaffIdentityContext({
          ...staffIdentityContext,
          identityState: "reauth_required",
          version: nextVersion(staffIdentityContext.version),
        });
        await repositories.saveStaffIdentityContext(refreshedStaffIdentity, {
          expectedVersion: staffIdentityContext.version,
        });
      }

      const currentElevationState = deriveElevationStateFromExpiry(
        actingContext.elevationState,
        actingScopeTuple.elevationExpiresAt,
        asOf,
      );
      const breakGlassExpired =
        actingContext.breakGlassState === "active" &&
        actingScopeTuple.breakGlassExpiresAt !== null &&
        compareIso(actingScopeTuple.breakGlassExpiresAt, asOf) <= 0;
      const driftClasses = new Set<ActingScopeDriftClass>();
      const presentedScopeTupleHash = optionalRef(command.presentedScopeTupleHash);
      if (
        presentedScopeTupleHash !== null &&
        presentedScopeTupleHash !== actingContext.scopeTupleHash
      ) {
        const presentedTuple = await repositories.getActingScopeTupleByHash(
          actingContext.actingContextId,
          presentedScopeTupleHash,
        );
        driftClasses.add(
          presentedTuple?.activeOrganisationRef !== actingContext.activeOrganisationRef
            ? "organisation_switch"
            : "tenant_scope_change",
        );
      }
      if (
        optionalRef(command.observedActiveOrganisationRef) !== null &&
        command.observedActiveOrganisationRef !== actingContext.activeOrganisationRef
      ) {
        driftClasses.add("organisation_switch");
      }
      if (
        command.observedTenantScopeMode !== undefined &&
        command.observedTenantScopeMode !== null &&
        command.observedTenantScopeMode !== actingContext.tenantScopeMode
      ) {
        driftClasses.add("tenant_scope_change");
      }
      if (
        command.observedTenantScopeRefs !== undefined &&
        command.observedTenantScopeRefs !== null &&
        stableReviewDigest(uniqueSortedRefs(command.observedTenantScopeRefs)) !==
          stableReviewDigest(uniqueSortedRefs(actingContext.tenantScopeRefs))
      ) {
        driftClasses.add("tenant_scope_change");
      }
      if (
        optionalRef(command.observedEnvironmentRef) !== null &&
        command.observedEnvironmentRef !== actingScopeTuple.environmentRef
      ) {
        driftClasses.add("environment_change");
      }
      if (
        optionalRef(command.observedPolicyPlaneRef) !== null &&
        command.observedPolicyPlaneRef !== actingScopeTuple.policyPlaneRef
      ) {
        driftClasses.add("policy_plane_change");
      }
      if (
        command.observedPurposeOfUse !== undefined &&
        command.observedPurposeOfUse !== null &&
        command.observedPurposeOfUse !== actingContext.purposeOfUse
      ) {
        driftClasses.add("purpose_of_use_change");
      }
      if (
        actingContext.elevationState !== "none" &&
        actingContext.elevationState !== "requested" &&
        currentElevationState === "revoked"
      ) {
        driftClasses.add("elevation_expiry");
      }
      if (breakGlassExpired || actingContext.breakGlassState === "revoked") {
        driftClasses.add("break_glass_revocation");
      }

      let visibilityEnvelope: CrossOrganisationVisibilityEnvelopeSnapshot | null = null;
      const visibilityEnvelopeId = optionalRef(command.visibilityEnvelopeId);
      if (visibilityEnvelopeId !== null) {
        visibilityEnvelope = await requireVisibilityEnvelope(repositories, visibilityEnvelopeId);
        const contract = contractForAudience(actingContext.audienceTierRef);
        if (
          visibilityEnvelope.envelopeState !== "current" ||
          visibilityEnvelope.actingScopeTupleRef !== actingContext.scopeTupleHash ||
          visibilityEnvelope.minimumNecessaryContractRef !== actingContext.minimumNecessaryContractRef ||
          visibilityEnvelope.placeholderContractRef !== contract.placeholderContractRef ||
          stableReviewDigest(uniqueSortedRefs(visibilityEnvelope.visibleFieldRefs)) !==
            stableReviewDigest(uniqueSortedRefs(contract.visibleFieldRefs))
        ) {
          driftClasses.add("visibility_contract_drift");
        }
      }

      let refreshedActingContext = actingContext;
      let refreshedActingScopeTuple = actingScopeTuple;
      if (
        actingContext.elevationState !== currentElevationState ||
        breakGlassExpired
      ) {
        const nextContext = normalizeActingContext({
          ...actingContext,
          elevationState: currentElevationState,
          breakGlassState: breakGlassExpired ? "revoked" : actingContext.breakGlassState,
          contextState:
            breakGlassExpired || actingContext.breakGlassState === "revoked"
              ? "blocked"
              : actingContext.contextState,
          version: nextVersion(actingContext.version),
        });
        const nextTuple = normalizeActingScopeTuple({
          ...actingScopeTuple,
          elevationState: currentElevationState,
          breakGlassState: breakGlassExpired ? "revoked" : actingScopeTuple.breakGlassState,
          breakGlassExpiresAt:
            breakGlassExpired ? asOf : actingScopeTuple.breakGlassExpiresAt,
          version: nextVersion(actingScopeTuple.version),
        });
        await repositories.saveActingContext(nextContext, {
          expectedVersion: actingContext.version,
        });
        await repositories.saveActingScopeTuple(nextTuple, {
          expectedVersion: actingScopeTuple.version,
        });
        refreshedActingContext = nextContext;
        refreshedActingScopeTuple = nextTuple;
      }

      const recommendedContextState = classifyContextState([...driftClasses]);
      if (driftClasses.size > 0 && refreshedActingContext.contextState === "current") {
        const frozen = await freezeContextOnDrift(
          refreshedActingContext,
          refreshedActingScopeTuple,
          recommendedContextState,
          asOf,
        );
        refreshedActingContext = frozen.actingContext;
        refreshedActingScopeTuple = frozen.actingScopeTuple;
        if (visibilityEnvelope) {
          visibilityEnvelope = await repositories.getVisibilityEnvelope(
            visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
          );
        }
      }

      return {
        actingContext: refreshedActingContext,
        actingScopeTuple: refreshedActingScopeTuple,
        visibilityEnvelope,
        driftClasses: [...driftClasses],
        recommendedContextState,
      };
    },

    async applyMinimumNecessaryProjection(visibilityEnvelopeId, projectionFields) {
      const visibilityEnvelope = await requireVisibilityEnvelope(repositories, visibilityEnvelopeId);
      invariant(
        visibilityEnvelope.envelopeState === "current",
        "VISIBILITY_ENVELOPE_NOT_CURRENT",
        "CrossOrganisationVisibilityEnvelope must be current before projection materialization.",
      );
      const contract = contractForAudience(visibilityEnvelope.audienceTierRef);
      invariant(
        visibilityEnvelope.minimumNecessaryContractRef === contract.minimumNecessaryContractRef,
        "VISIBILITY_ENVELOPE_CONTRACT_STALE",
        "CrossOrganisationVisibilityEnvelope minimum necessary contract is stale.",
      );
      const visibleFields = Object.fromEntries(
        visibilityEnvelope.visibleFieldRefs
          .filter((fieldRef) => Object.prototype.hasOwnProperty.call(projectionFields, fieldRef))
          .map((fieldRef) => [fieldRef, projectionFields[fieldRef]]),
      );
      return {
        visibleFields,
        withheldFieldRefs: contract.hiddenFieldRefs,
        placeholderContractRef: visibilityEnvelope.placeholderContractRef,
      };
    },

    async materializeHubCaseAudienceProjection(command) {
      const visibilityEnvelope = await requireVisibilityEnvelope(repositories, command.visibilityEnvelopeId);
      const bundle = await hubCaseService.queryHubCaseBundle(command.hubCoordinationCaseId);
      invariant(bundle !== null, "HUB_CASE_NOT_FOUND", "HubCoordinationCase could not be found.");
      return this.applyMinimumNecessaryProjection(
        visibilityEnvelope.crossOrganisationVisibilityEnvelopeId,
        flatHubCaseProjectionRecord(bundle),
      );
    },

    async validateCurrentHubCommandScope(command) {
      const recordedAt = ensureIsoTimestamp(command.recordedAt, "recordedAt");
      const policy = HUB_MUTATION_POLICIES[command.commandId];
      invariant(
        policy !== undefined,
        "UNSUPPORTED_HUB_COMMAND_SCOPE",
        "commandId is not supported by the hub command authority gate.",
      );

      const staffIdentityContext = await requireStaffIdentityContext(
        repositories,
        command.staffIdentityContextId,
      );
      const driftDetection = await this.detectActingScopeDrift({
        actingContextId: command.actingContextId,
        asOf: recordedAt,
        presentedScopeTupleHash: command.presentedScopeTupleHash,
        observedActiveOrganisationRef: command.observedActiveOrganisationRef,
        observedTenantScopeMode: command.observedTenantScopeMode,
        observedTenantScopeRefs: command.observedTenantScopeRefs,
        observedEnvironmentRef: command.observedEnvironmentRef,
        observedPolicyPlaneRef: command.observedPolicyPlaneRef,
        observedPurposeOfUse: command.presentedPurposeOfUse,
        visibilityEnvelopeId: command.crossOrganisationVisibilityEnvelopeId,
      });
      const actingContext = driftDetection.actingContext;
      const actingScopeTuple = driftDetection.actingScopeTuple;
      let visibilityEnvelope = driftDetection.visibilityEnvelope;

      let decision: AuthorityDecisionState = "allowed";
      let reasonCode: AuthorityDecisionReason = "allowed";
      let failureClass: AuthorityFailureClass = "none";
      let hubCaseBundle: HubCaseBundle | null = null;
      const driftReason: AuthorityDecisionReason =
        driftDetection.driftClasses.includes("break_glass_revocation")
          ? "break_glass_revocation"
          : driftDetection.driftClasses.includes("elevation_expiry")
            ? "elevation_expiry"
            : driftDetection.driftClasses.includes("visibility_contract_drift")
              ? "visibility_contract_drift"
              : driftDetection.driftClasses.includes("organisation_switch")
                ? "organisation_switch"
                : driftDetection.driftClasses.includes("tenant_scope_change")
                  ? "tenant_scope_change"
                  : driftDetection.driftClasses.includes("environment_change")
                    ? "environment_change"
                    : driftDetection.driftClasses.includes("policy_plane_change")
                      ? "policy_plane_change"
                      : driftDetection.driftClasses.includes("purpose_of_use_change")
                        ? "purpose_of_use_change"
                        : "acting_context_not_current";

      if (staffIdentityContext.identityState === "reauth_required") {
        decision = "denied";
        reasonCode = "identity_reauth_required";
        failureClass = "scope_drift";
      } else if (staffIdentityContext.identityState === "revoked") {
        decision = "denied";
        reasonCode = "identity_revoked";
        failureClass = "scope_drift";
      } else if (actingContext.contextState !== "current") {
        decision = actingContext.contextState === "stale" ? "stale" : "denied";
        reasonCode = driftReason;
        failureClass = "scope_drift";
      } else if (!policy.routeFamilies.includes(command.routeId)) {
        decision = "denied";
        reasonCode = "unsupported_command_scope";
      } else if (command.presentedScopeTupleHash !== actingContext.scopeTupleHash) {
        decision = "stale";
        reasonCode = "scope_tuple_mismatch";
        failureClass = "scope_drift";
      } else if (!policy.allowedPurposes.includes(command.presentedPurposeOfUse)) {
        decision = "denied";
        reasonCode = "purpose_not_allowed_for_route";
      } else if (command.presentedPurposeOfUse !== actingContext.purposeOfUse) {
        decision = "stale";
        reasonCode = "purpose_of_use_change";
        failureClass = "scope_drift";
      } else if (!policy.allowedAudienceTiers.includes(command.presentedAudienceTierRef)) {
        decision = "denied";
        reasonCode = "audience_not_allowed_for_route";
      } else if (command.presentedAudienceTierRef !== actingContext.audienceTierRef) {
        decision = "stale";
        reasonCode = "audience_tier_mismatch";
        failureClass = "scope_drift";
      } else if (
        command.presentedMinimumNecessaryContractRef !== actingContext.minimumNecessaryContractRef
      ) {
        decision = "stale";
        reasonCode = "minimum_necessary_contract_mismatch";
        failureClass = "visibility_drift";
      } else if (
        actingContext.breakGlassState === "active" &&
        !policy.allowsBreakGlass
      ) {
        decision = "denied";
        reasonCode = "break_glass_not_lawful_for_route";
      }

      if (decision === "allowed" && command.hubCoordinationCaseId) {
        hubCaseBundle = await hubCaseService.queryHubCaseBundle(command.hubCoordinationCaseId);
        invariant(
          hubCaseBundle !== null,
          "HUB_CASE_NOT_FOUND",
          "HubCoordinationCase could not be found.",
        );
        const crossOrganisationRequired =
          hubCaseBundle.networkBookingRequest.originPracticeOds !== actingContext.activeOrganisationRef;
        if (crossOrganisationRequired && !optionalRef(command.crossOrganisationVisibilityEnvelopeId)) {
          decision = "denied";
          reasonCode = "visibility_envelope_required";
          failureClass = "visibility_drift";
        }
        if (decision === "allowed" && crossOrganisationRequired) {
          visibilityEnvelope =
            visibilityEnvelope ??
            (command.crossOrganisationVisibilityEnvelopeId
              ? await requireVisibilityEnvelope(repositories, command.crossOrganisationVisibilityEnvelopeId)
              : null);
          invariant(
            visibilityEnvelope !== null,
            "VISIBILITY_ENVELOPE_REQUIRED",
            "CrossOrganisationVisibilityEnvelope is required for this hub mutation.",
          );
          if (visibilityEnvelope.envelopeState !== "current") {
            decision = "stale";
            reasonCode = "stale_visibility_envelope";
            failureClass = "visibility_drift";
          } else if (
            visibilityEnvelope.actingScopeTupleRef !== actingContext.scopeTupleHash ||
            visibilityEnvelope.actingContextRef !== actingContext.actingContextId ||
            visibilityEnvelope.targetOrganisationRef !== actingContext.activeOrganisationRef ||
            visibilityEnvelope.sourceOrganisationRef !== hubCaseBundle.networkBookingRequest.originPracticeOds ||
            visibilityEnvelope.audienceTierRef !== actingContext.audienceTierRef ||
            visibilityEnvelope.minimumNecessaryContractRef !== actingContext.minimumNecessaryContractRef
          ) {
            decision = "stale";
            reasonCode = "visibility_contract_drift";
            failureClass = "visibility_drift";
          }
        }

        if (decision === "allowed" && policy.ownershipSensitive) {
          const expectedOwnershipEpoch = command.expectedOwnershipEpoch ?? null;
          const expectedOwnershipFenceToken = optionalRef(command.expectedOwnershipFenceToken);
          if (expectedOwnershipEpoch !== hubCaseBundle.hubCase.ownershipEpoch) {
            decision = "stale";
            reasonCode = "stale_ownership_epoch";
            failureClass = "ownership_drift";
          } else if (expectedOwnershipFenceToken !== hubCaseBundle.hubCase.ownershipFenceToken) {
            decision = "stale";
            reasonCode = "stale_ownership_fence";
            failureClass = "ownership_drift";
          }
        }
      }

      if (decision === "allowed" && driftDetection.driftClasses.length > 0) {
        decision = driftDetection.recommendedContextState === "blocked" ? "denied" : "stale";
        reasonCode = driftReason;
        failureClass = driftDetection.driftClasses.includes("visibility_contract_drift")
          ? "visibility_drift"
          : "scope_drift";
      }

      const authorityEvidence = await appendAuthorityEvidence({
        staffIdentityContextRef: staffIdentityContext.staffIdentityContextId,
        actingContextRef: actingContext.actingContextId,
        actingScopeTupleRef: actingScopeTuple.tupleHash,
        crossOrganisationVisibilityEnvelopeRef: visibilityEnvelope?.crossOrganisationVisibilityEnvelopeId ?? null,
        actorIdentity: staffIdentityContext.staffUserId,
        activeOrganisationRef: actingContext.activeOrganisationRef,
        purposeOfUse: actingContext.purposeOfUse,
        actingRoleRef: actingContext.actingRoleRef,
        breakGlassActive: actingContext.breakGlassState === "active",
        hubCaseId: hubCaseBundle?.hubCase.hubCoordinationCaseId ?? optionalRef(command.hubCoordinationCaseId),
        commandScope: `${command.routeId}:${command.commandId}`,
        visibilityTier: actingContext.audienceTierRef,
        decision,
        reasonCode,
        failureClass,
        scopeDrifted: failureClass === "scope_drift",
        visibilityDrifted: failureClass === "visibility_drift",
        leaseDrifted: false,
        ownershipDrifted: failureClass === "ownership_drift",
        commandActionRecordRef: requireRef(command.commandActionRecordRef, "commandActionRecordRef"),
        commandSettlementRecordRef: requireRef(
          command.commandSettlementRecordRef,
          "commandSettlementRecordRef",
        ),
        recordedAt,
      });

      if (decision === "allowed" && actingContext.breakGlassState === "active") {
        await appendBreakGlassAudit(
          actingContext.actingContextId,
          actingScopeTuple.tupleHash,
          actingContext.staffUserId,
          "used",
          optionalRef(actingScopeTuple.breakGlassReasonCode) ?? "break_glass_in_effect",
          actingScopeTuple.breakGlassJustification,
          command.routeId,
          actingScopeTuple.breakGlassExpiresAt,
          recordedAt,
        );
      }

      return {
        decision,
        reasonCode,
        staffIdentityContext,
        actingContext,
        actingScopeTuple,
        visibilityEnvelope,
        hubCaseBundle,
        driftDetection,
        authorityEvidence,
      };
    },

    async assertCurrentHubCommandScope(command) {
      const result = await this.validateCurrentHubCommandScope(command);
      invariant(
        result.decision === "allowed",
        result.reasonCode.toUpperCase(),
        `Hub command authority denied: ${result.reasonCode}.`,
      );
      return result;
    },

    async queryAuthorityEvidence(actingContextId) {
      return repositories.listAuthorityEvidence(actingContextId);
    },

    async queryBreakGlassAudit(actingContextId) {
      return repositories.listBreakGlassAudit(actingContextId);
    },
  };
}

export const PHASE5_ACTING_SCOPE_VISIBILITY_SERVICE_NAME =
  "Phase5ActingContextVisibilityKernel";
export const PHASE5_ACTING_SCOPE_VISIBILITY_SCHEMA_VERSION =
  "316.phase5.acting-context-visibility-kernel.v1";
export const phase5ActingScopeVisibilityPersistenceTables = [
  "phase5_staff_identity_contexts",
  "phase5_acting_contexts",
  "phase5_acting_scope_tuples",
  "phase5_cross_org_visibility_envelopes",
  "phase5_scope_authority_audit_records",
  "phase5_break_glass_audit_records",
] as const;
export const phase5ActingScopeVisibilityMigrationPlanRefs = [
  "services/command-api/migrations/143_phase5_hub_case_kernel.sql",
  "services/command-api/migrations/144_phase5_staff_identity_acting_context_visibility.sql",
] as const;
