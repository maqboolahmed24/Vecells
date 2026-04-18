import { createHash } from "node:crypto";
import {
  RequestBackboneInvariantError,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";
import {
  makeFoundationEvent,
  type FoundationEventEnvelope,
} from "@vecells/event-contracts";

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

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort() as T[];
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalize(entryValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function addSeconds(timestamp: string, seconds: number): string {
  const date = new Date(timestamp);
  date.setSeconds(date.getSeconds() + seconds);
  return date.toISOString();
}

function descriptorToAggregateRef(descriptorRef: string): string {
  switch (descriptorRef) {
    case "BookingCase":
      return "BookingCase";
    case "AppointmentRecord":
      return "AppointmentRecord";
    default:
      return "BookingCapability";
  }
}

function normalizeRecordId(prefix: string, digest: string): string {
  return `${prefix}_${digest.slice(0, 24)}`;
}

const BOOKING_CAPABILITY_SCHEMA_VERSION = "279.phase4.booking-capability-freeze.v1";
const PUBLISHED_AT = "2026-04-18";

export type BookingIntegrationMode =
  | "im1_patient_api"
  | "im1_transaction_api"
  | "gp_connect_existing"
  | "local_gateway_component"
  | "manual_assist_only";

export type BookingActionScope =
  | "search_slots"
  | "book_slot"
  | "cancel_appointment"
  | "reschedule_appointment"
  | "view_appointment"
  | "hold_slot"
  | "launch_local_component"
  | "repair_gp_linkage"
  | "request_staff_assist"
  | "manage_appointment"
  | "view_booking_summary";

export type BookingSelectionAudience = "patient" | "staff";

export type BookingCapabilityState =
  | "live_self_service"
  | "live_staff_assist"
  | "assisted_only"
  | "linkage_required"
  | "local_component_required"
  | "degraded_manual"
  | "recovery_only"
  | "blocked";

export type BookingProjectionSurfaceState =
  | "self_service_live"
  | "staff_assist_live"
  | "assisted_only"
  | "linkage_required"
  | "local_component_required"
  | "degraded_manual"
  | "recovery_required"
  | "blocked";

export type BookingProjectionControlState = "writable" | "read_only" | "blocked";

export type BookingFallbackActionRef =
  | "fallback_repair_gp_linkage"
  | "fallback_launch_local_component"
  | "fallback_request_staff_assist"
  | "fallback_contact_practice_support"
  | "fallback_continue_read_only"
  | "fallback_wait_for_confirmation"
  | "fallback_manual_hub_booking";

export type BookingBlockedReasonCode =
  | "reason_gp_linkage_required"
  | "reason_local_component_required"
  | "reason_self_service_not_supported"
  | "reason_staff_assist_only"
  | "reason_supplier_degraded_manual"
  | "reason_publication_frozen"
  | "reason_assurance_read_only"
  | "reason_governing_object_stale"
  | "reason_action_scope_not_supported"
  | "reason_confirmation_gate_pending"
  | "reason_policy_blocked";

export type BookingGpLinkageStatus = "linked" | "missing" | "not_required";
export type BookingLocalConsumerStatus = "ready" | "missing" | "not_required";
export type BookingSupplierDegradationStatus = "nominal" | "degraded_manual";
export type BookingPublicationState = "published" | "frozen" | "withdrawn";
export type BookingAssuranceTrustState = "writable" | "read_only" | "blocked";

export interface ProviderCapabilityMatrixRowCapabilities {
  can_search_slots: boolean;
  can_book: boolean;
  can_cancel: boolean;
  can_reschedule: boolean;
  can_view_appointment: boolean;
  can_hold_slot: boolean;
  requires_gp_linkage_details: boolean;
  supports_patient_self_service: boolean;
  supports_staff_assisted_booking: boolean;
  supports_async_commit_confirmation: boolean;
  requires_local_consumer_component: boolean;
}

export interface ProviderCapabilityMatrixRowSnapshot {
  providerCapabilityMatrixRef: string;
  matrixVersionRef: string;
  rowOwnerRef: string;
  tenantId: string;
  practiceRef: string;
  organisationRef: string;
  supplierRef: string;
  supplierLabel?: string;
  integrationMode: BookingIntegrationMode;
  deploymentType: string;
  assuranceStateRef: string;
  supportedActionScopes: readonly BookingActionScope[];
  capabilities: ProviderCapabilityMatrixRowCapabilities;
  manageCapabilityState: "full" | "partial" | "summary_only" | "none";
  reservationMode: "exclusive_hold" | "truthful_nonexclusive" | "degraded_manual_pending";
  authoritativeReadMode: "durable_provider_reference" | "read_after_write" | "gate_required";
  primaryDependencyDegradationProfileRef: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  searchNormalizationContractRef: string;
  revalidationContractRef: string;
  manageSupportContractRef: string;
  contractState: "draft" | "active" | "superseded" | "withdrawn";
  publishedAt: string;
  rowHash: string;
}

export interface ProviderCapabilityMatrixSnapshot {
  providerCapabilityMatrixId: string;
  schemaVersion: typeof BOOKING_CAPABILITY_SCHEMA_VERSION;
  inventoryVersionRef: string;
  ownerContext: "booking";
  publishedAt: string;
  rows: readonly ProviderCapabilityMatrixRowSnapshot[];
}

export interface AdapterContractProfileSnapshot {
  adapterContractProfileId: string;
  versionRef: string;
  label: string;
  integrationModes: readonly BookingIntegrationMode[];
  carrierProtocol: string;
  mayOwnOperationFamilies: readonly string[];
  forbiddenCoreSemantics: readonly string[];
  confirmationModel: string;
  localComponentMode: "none" | "required";
  supplierPackPosture: string;
  sourceRefs: readonly string[];
}

export interface DependencyDegradationProfileSnapshot {
  dependencyDegradationProfileId: string;
  versionRef: string;
  label: string;
  dominantCapabilityState: BookingCapabilityState;
  fallbackActionRefs: readonly BookingFallbackActionRef[];
  blockedActionReasonCodes: readonly BookingBlockedReasonCode[];
  sameShellPosture: string;
}

export interface AuthoritativeReadAndConfirmationPolicySnapshot {
  authoritativeReadAndConfirmationPolicyId: string;
  versionRef: string;
  label: string;
  authoritativeReadMode: "durable_provider_reference" | "read_after_write" | "gate_required";
  confirmationGateMode: string;
  supportsAsyncCommitConfirmation: boolean;
  supportsDisputeRecovery: boolean;
  acceptedProcessingStates: readonly string[];
  durableProofClasses: readonly string[];
  pendingTruthStates: readonly string[];
  disputedTruthStates: readonly string[];
  gateRequiredStates: readonly string[];
  manageExposureBeforeProof: "hidden" | "summary_only";
  patientVisibilityBeforeProof: "provisional_receipt" | "summary_only";
  sourceRefs: readonly string[];
}

export interface BookingProviderAdapterBindingSnapshot {
  bookingProviderAdapterBindingId: string;
  providerCapabilityMatrixRef: string;
  matrixVersionRef: string;
  supplierRef: string;
  integrationMode: BookingIntegrationMode;
  deploymentType: string;
  actionScopeSet: readonly BookingActionScope[];
  selectionAudienceSet: readonly BookingSelectionAudience[];
  adapterContractProfileRef: string;
  dependencyDegradationProfileRef: string;
  searchNormalizationContractRef: string;
  temporalNormalizationContractRef: string;
  revalidationContractRef: string;
  reservationSemantics: "exclusive_hold" | "truthful_nonexclusive" | "degraded_manual_pending";
  commitContractRef: string;
  authoritativeReadContractRef: string;
  manageSupportContractRef: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  bindingHash: string;
  bindingState: "live" | "recovery_only" | "blocked" | "superseded";
  bindingCompilationOwnerRule: string;
  publishedAt: string;
}

export interface BookingCapabilityPrerequisiteStateSnapshot {
  gpLinkageStatus: BookingGpLinkageStatus;
  localConsumerStatus: BookingLocalConsumerStatus;
  supplierDegradationStatus: BookingSupplierDegradationStatus;
  publicationState: BookingPublicationState;
  assuranceTrustState: BookingAssuranceTrustState;
}

export interface BookingCapabilityRouteTupleSnapshot {
  routeIntentBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  routeTupleHash: string;
}

export interface BookingCapabilityResolutionSnapshot {
  bookingCapabilityResolutionId: string;
  schemaVersion: typeof BOOKING_CAPABILITY_SCHEMA_VERSION;
  bookingCaseId: string | null;
  appointmentId: string | null;
  tenantId: string;
  practiceRef: string;
  organisationRef: string;
  supplierRef: string;
  integrationMode: BookingIntegrationMode;
  deploymentType: string;
  selectionAudience: BookingSelectionAudience;
  requestedActionScope: BookingActionScope;
  providerCapabilityMatrixRef: string;
  capabilityMatrixVersionRef: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  adapterContractProfileRef: string;
  dependencyDegradationProfileRef: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  gpLinkageCheckpointRef: string | null;
  localConsumerCheckpointRef: string | null;
  prerequisiteState: BookingCapabilityPrerequisiteStateSnapshot;
  routeTuple: BookingCapabilityRouteTupleSnapshot;
  governingObjectDescriptorRef: string;
  governingObjectRef: string;
  governingObjectVersionRef: string;
  parentAnchorRef: string;
  capabilityTupleHash: string;
  capabilityState: BookingCapabilityState;
  allowedActionScopes: readonly BookingActionScope[];
  blockedActionReasonCodes: readonly BookingBlockedReasonCode[];
  fallbackActionRefs: readonly BookingFallbackActionRef[];
  evidenceRefs: readonly string[];
  evaluatedAt: string;
  expiresAt: string;
}

export interface BookingCapabilityProjectionSnapshot {
  bookingCapabilityProjectionId: string;
  schemaVersion: typeof BOOKING_CAPABILITY_SCHEMA_VERSION;
  bookingCaseId: string | null;
  appointmentId: string | null;
  bookingCapabilityResolutionRef: string;
  selectionAudience: BookingSelectionAudience;
  requestedActionScope: BookingActionScope;
  providerAdapterBindingRef: string;
  capabilityTupleHash: string;
  surfaceState: BookingProjectionSurfaceState;
  dominantCapabilityCueCode: string;
  controlState: BookingProjectionControlState;
  selfServiceActionRefs: readonly BookingActionScope[];
  assistedActionRefs: readonly BookingActionScope[];
  manageActionRefs: readonly BookingActionScope[];
  fallbackActionRefs: readonly BookingFallbackActionRef[];
  blockedActionReasonCodes: readonly BookingBlockedReasonCode[];
  exposedActionScopes: readonly BookingActionScope[];
  parityGroupId: string;
  underlyingCapabilityState: BookingCapabilityState;
  renderedAt: string;
}

export interface BookingCapabilityResolutionInput {
  bookingCaseId?: string | null;
  appointmentId?: string | null;
  tenantId: string;
  practiceRef: string;
  organisationRef: string;
  supplierRef: string;
  integrationMode: BookingIntegrationMode;
  deploymentType: string;
  selectionAudience: BookingSelectionAudience;
  requestedActionScope: BookingActionScope;
  gpLinkageCheckpointRef?: string | null;
  gpLinkageStatus: BookingGpLinkageStatus;
  localConsumerCheckpointRef?: string | null;
  localConsumerStatus: BookingLocalConsumerStatus;
  supplierDegradationStatus: BookingSupplierDegradationStatus;
  publicationState: BookingPublicationState;
  assuranceTrustState: BookingAssuranceTrustState;
  routeIntentBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  governingObjectDescriptorRef: string;
  governingObjectRef: string;
  governingObjectVersionRef: string;
  parentAnchorRef: string;
  presentedCapabilityTupleHash?: string | null;
  presentedBindingHash?: string | null;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  subjectRef: string;
  evaluatedAt: string;
  expiresInSeconds?: number;
}

export interface QueryBookingCapabilityDiagnosticsInput {
  resolutionId?: string;
  bookingCaseId?: string | null;
  appointmentId?: string | null;
  governingObjectDescriptorRef?: string;
  governingObjectRef?: string;
  selectionAudience?: BookingSelectionAudience;
  requestedActionScope?: BookingActionScope;
}

export interface BookingCapabilityResolutionResult {
  providerCapabilityMatrix: ProviderCapabilityMatrixSnapshot;
  providerCapabilityMatrixRow: ProviderCapabilityMatrixRowSnapshot;
  adapterContractProfile: AdapterContractProfileSnapshot;
  dependencyDegradationProfile: DependencyDegradationProfileSnapshot;
  authoritativeReadAndConfirmationPolicy: AuthoritativeReadAndConfirmationPolicySnapshot;
  providerAdapterBinding: BookingProviderAdapterBindingSnapshot;
  resolution: BookingCapabilityResolutionSnapshot;
  projection: BookingCapabilityProjectionSnapshot;
  emittedEvents: readonly FoundationEventEnvelope<object>[];
  supersededBindingRefs: readonly string[];
  supersededResolutionRefs: readonly string[];
}

export interface BookingCapabilityDiagnosticsBundle
  extends Omit<BookingCapabilityResolutionResult, "emittedEvents"> {
  isCurrentScope: boolean;
}

interface SnapshotDocument<T> {
  toSnapshot(): T;
}

interface StoredRow<T> {
  snapshot: T;
  version: number;
}

interface StoredMeta {
  current: boolean;
  supersededByRef: string | null;
}

class StoredDocument<T> implements SnapshotDocument<T> {
  constructor(private readonly row: StoredRow<T>) {}

  toSnapshot(): T {
    return structuredClone(this.row.snapshot);
  }
}

function saveWithCas<T>(
  map: Map<string, StoredRow<T>>,
  key: string,
  snapshot: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  }
  const nextVersion = (current?.version ?? 0) + 1;
  map.set(key, { snapshot: structuredClone(snapshot), version: nextVersion });
}

function buildMatrixRowHash(
  row: Omit<ProviderCapabilityMatrixRowSnapshot, "rowHash">,
): string {
  return sha256({
    providerCapabilityMatrixRef: row.providerCapabilityMatrixRef,
    matrixVersionRef: row.matrixVersionRef,
    rowOwnerRef: row.rowOwnerRef,
    tenantId: row.tenantId,
    practiceRef: row.practiceRef,
    organisationRef: row.organisationRef,
    supplierRef: row.supplierRef,
    integrationMode: row.integrationMode,
    deploymentType: row.deploymentType,
    assuranceStateRef: row.assuranceStateRef,
    supportedActionScopes: uniqueSorted(row.supportedActionScopes),
    capabilities: row.capabilities,
    manageCapabilityState: row.manageCapabilityState,
    reservationMode: row.reservationMode,
    authoritativeReadMode: row.authoritativeReadMode,
    primaryDependencyDegradationProfileRef: row.primaryDependencyDegradationProfileRef,
    authoritativeReadAndConfirmationPolicyRef: row.authoritativeReadAndConfirmationPolicyRef,
    searchNormalizationContractRef: row.searchNormalizationContractRef,
    revalidationContractRef: row.revalidationContractRef,
    manageSupportContractRef: row.manageSupportContractRef,
    contractState: row.contractState,
    publishedAt: row.publishedAt,
  });
}

const ADAPTER_CONTRACT_PROFILES = [
  {
    adapterContractProfileId: "ACP_279_IM1_PATIENT_SELF_SERVICE",
    versionRef: "279.adapter-profile.im1-patient.v1",
    label: "IM1 patient self-service adapter",
    integrationModes: ["im1_patient_api"],
    carrierProtocol: "https_json",
    mayOwnOperationFamilies: [
      "search_normalization",
      "temporal_normalization",
      "revalidation",
      "commit_dispatch",
      "authoritative_read",
      "manage_translation",
    ],
    forbiddenCoreSemantics: [
      "capacity_ranking",
      "fallback_choice",
      "patient_copy",
      "shell_control_exposure",
    ],
    confirmationModel: "read_after_write_required",
    localComponentMode: "none",
    supplierPackPosture: "pairing_guidance_plus_supplier_pip",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
    ],
  },
  {
    adapterContractProfileId: "ACP_279_IM1_TRANSACTION_LOCAL_COMPONENT",
    versionRef: "279.adapter-profile.im1-transaction-local-component.v1",
    label: "IM1 transaction local-component adapter",
    integrationModes: ["im1_transaction_api"],
    carrierProtocol: "https_json",
    mayOwnOperationFamilies: [
      "search_normalization",
      "temporal_normalization",
      "component_bridge",
    ],
    forbiddenCoreSemantics: [
      "capacity_ranking",
      "fallback_choice",
      "patient_copy",
      "manage_actionability",
    ],
    confirmationModel: "contract_only_component_gate",
    localComponentMode: "required",
    supplierPackPosture: "pairing_guidance_plus_supplier_pip",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
    ],
  },
  {
    adapterContractProfileId: "ACP_279_GP_CONNECT_APPOINTMENT_MANAGEMENT",
    versionRef: "279.adapter-profile.gp-connect-appointment-management.v1",
    label: "GP Connect appointment management adapter",
    integrationModes: ["gp_connect_existing"],
    carrierProtocol: "fhir_stu3_spine_proxy",
    mayOwnOperationFamilies: [
      "search_normalization",
      "temporal_normalization",
      "revalidation",
      "commit_dispatch",
      "authoritative_read",
      "manage_translation",
    ],
    forbiddenCoreSemantics: [
      "capacity_ranking",
      "fallback_choice",
      "patient_copy",
      "manual_override_meaning",
    ],
    confirmationModel: "durable_provider_reference",
    localComponentMode: "none",
    supplierPackPosture: "existing-service-guidance-plus-onboarding-pack",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
    ],
  },
  {
    adapterContractProfileId: "ACP_279_LOCAL_GATEWAY_COMPONENT",
    versionRef: "279.adapter-profile.local-gateway-component.v1",
    label: "Local gateway component adapter",
    integrationModes: ["local_gateway_component"],
    carrierProtocol: "local_component_bridge",
    mayOwnOperationFamilies: [
      "search_normalization",
      "temporal_normalization",
      "component_bridge",
      "authoritative_read",
    ],
    forbiddenCoreSemantics: [
      "capacity_ranking",
      "fallback_choice",
      "patient_copy",
      "publication_control",
    ],
    confirmationModel: "external_gate_required",
    localComponentMode: "required",
    supplierPackPosture: "local-gateway-bounded-pack",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
    ],
  },
  {
    adapterContractProfileId: "ACP_279_MANUAL_ASSIST_ROUTER",
    versionRef: "279.adapter-profile.manual-assist-router.v1",
    label: "Manual assist router",
    integrationModes: ["manual_assist_only"],
    carrierProtocol: "manual_ticket_or_staff_queue",
    mayOwnOperationFamilies: ["ticket_translation", "summary_normalization"],
    forbiddenCoreSemantics: [
      "capacity_ranking",
      "patient_copy",
      "self_service_actionability",
      "authoritative_booking_truth",
    ],
    confirmationModel: "manual_confirmation_gate",
    localComponentMode: "none",
    supplierPackPosture: "typed-gap-only",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
    ],
  },
] as const satisfies readonly AdapterContractProfileSnapshot[];

const DEPENDENCY_DEGRADATION_PROFILES = [
  {
    dependencyDegradationProfileId: "DDP_279_PATIENT_LINKAGE_AND_SUPPORT",
    versionRef: "279.degradation-profile.patient-linkage-and-support.v1",
    label: "Patient linkage and support recovery",
    dominantCapabilityState: "linkage_required",
    fallbackActionRefs: [
      "fallback_repair_gp_linkage",
      "fallback_contact_practice_support",
    ],
    blockedActionReasonCodes: [
      "reason_gp_linkage_required",
      "reason_action_scope_not_supported",
    ],
    sameShellPosture: "preserve_anchor_then_repair",
  },
  {
    dependencyDegradationProfileId: "DDP_279_LOCAL_COMPONENT_RECOVERY",
    versionRef: "279.degradation-profile.local-component-recovery.v1",
    label: "Local component recovery",
    dominantCapabilityState: "local_component_required",
    fallbackActionRefs: [
      "fallback_launch_local_component",
      "fallback_request_staff_assist",
    ],
    blockedActionReasonCodes: [
      "reason_local_component_required",
      "reason_action_scope_not_supported",
    ],
    sameShellPosture: "preserve_anchor_then_component_launch",
  },
  {
    dependencyDegradationProfileId: "DDP_279_ASSISTED_ONLY_HANDOFF",
    versionRef: "279.degradation-profile.assisted-only-handoff.v1",
    label: "Assisted-only handoff",
    dominantCapabilityState: "assisted_only",
    fallbackActionRefs: [
      "fallback_request_staff_assist",
      "fallback_continue_read_only",
    ],
    blockedActionReasonCodes: [
      "reason_staff_assist_only",
      "reason_self_service_not_supported",
    ],
    sameShellPosture: "promote_assisted_path",
  },
  {
    dependencyDegradationProfileId: "DDP_279_DEGRADED_MANUAL_RECOVERY",
    versionRef: "279.degradation-profile.degraded-manual-recovery.v1",
    label: "Degraded manual recovery",
    dominantCapabilityState: "degraded_manual",
    fallbackActionRefs: [
      "fallback_manual_hub_booking",
      "fallback_continue_read_only",
    ],
    blockedActionReasonCodes: [
      "reason_supplier_degraded_manual",
      "reason_confirmation_gate_pending",
    ],
    sameShellPosture: "freeze_writable_then_handoff",
  },
  {
    dependencyDegradationProfileId: "DDP_279_PUBLICATION_AND_TRUST_FREEZE",
    versionRef: "279.degradation-profile.publication-and-trust-freeze.v1",
    label: "Publication and trust freeze",
    dominantCapabilityState: "recovery_only",
    fallbackActionRefs: [
      "fallback_continue_read_only",
      "fallback_contact_practice_support",
    ],
    blockedActionReasonCodes: [
      "reason_publication_frozen",
      "reason_assurance_read_only",
      "reason_governing_object_stale",
    ],
    sameShellPosture: "bounded_recovery_only",
  },
] as const satisfies readonly DependencyDegradationProfileSnapshot[];

const AUTHORITATIVE_READ_AND_CONFIRMATION_POLICIES = [
  {
    authoritativeReadAndConfirmationPolicyId: "POLICY_279_IM1_PATIENT_READ_AFTER_WRITE",
    versionRef: "279.confirmation-policy.im1-patient-read-after-write.v1",
    label: "IM1 patient read-after-write confirmation policy",
    authoritativeReadMode: "read_after_write",
    confirmationGateMode: "same_commit_or_immediate_followup_read",
    supportsAsyncCommitConfirmation: false,
    supportsDisputeRecovery: true,
    acceptedProcessingStates: ["accepted_for_processing"],
    durableProofClasses: [
      "same_commit_read_after_write",
      "durable_provider_reference",
    ],
    pendingTruthStates: ["booking_in_progress"],
    disputedTruthStates: ["reconciliation_required"],
    gateRequiredStates: ["accepted_for_processing_without_durable_proof"],
    manageExposureBeforeProof: "hidden",
    patientVisibilityBeforeProof: "provisional_receipt",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
    ],
  },
  {
    authoritativeReadAndConfirmationPolicyId: "POLICY_279_GP_CONNECT_PROVIDER_REFERENCE",
    versionRef: "279.confirmation-policy.gp-connect-provider-reference.v1",
    label: "GP Connect durable provider-reference policy",
    authoritativeReadMode: "durable_provider_reference",
    confirmationGateMode: "provider_reference_or_read_after_write",
    supportsAsyncCommitConfirmation: true,
    supportsDisputeRecovery: true,
    acceptedProcessingStates: ["accepted_for_processing", "provider_pending"],
    durableProofClasses: [
      "durable_provider_reference",
      "same_commit_read_after_write",
    ],
    pendingTruthStates: ["booking_in_progress", "confirmation_pending"],
    disputedTruthStates: ["reconciliation_required"],
    gateRequiredStates: ["provider_reference_missing"],
    manageExposureBeforeProof: "summary_only",
    patientVisibilityBeforeProof: "provisional_receipt",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
    ],
  },
  {
    authoritativeReadAndConfirmationPolicyId: "POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE",
    versionRef: "279.confirmation-policy.local-gateway-external-gate.v1",
    label: "Local gateway external confirmation gate policy",
    authoritativeReadMode: "gate_required",
    confirmationGateMode: "external_confirmation_gate",
    supportsAsyncCommitConfirmation: true,
    supportsDisputeRecovery: true,
    acceptedProcessingStates: ["accepted_for_processing", "gateway_accepted"],
    durableProofClasses: [
      "external_confirmation_gate_released",
      "durable_provider_reference",
    ],
    pendingTruthStates: ["booking_in_progress", "confirmation_pending"],
    disputedTruthStates: ["reconciliation_required"],
    gateRequiredStates: ["external_gate_pending"],
    manageExposureBeforeProof: "hidden",
    patientVisibilityBeforeProof: "summary_only",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
    ],
  },
  {
    authoritativeReadAndConfirmationPolicyId: "POLICY_279_MANUAL_CONFIRMATION_GATE",
    versionRef: "279.confirmation-policy.manual-confirmation-gate.v1",
    label: "Manual confirmation gate policy",
    authoritativeReadMode: "gate_required",
    confirmationGateMode: "manual_confirmation_or_support_evidence",
    supportsAsyncCommitConfirmation: true,
    supportsDisputeRecovery: false,
    acceptedProcessingStates: ["handoff_logged"],
    durableProofClasses: ["manual_confirmation_evidence"],
    pendingTruthStates: ["manual_follow_up_pending"],
    disputedTruthStates: [],
    gateRequiredStates: ["manual_confirmation_pending"],
    manageExposureBeforeProof: "hidden",
    patientVisibilityBeforeProof: "summary_only",
    sourceRefs: [
      "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
      "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
    ],
  },
] as const satisfies readonly AuthoritativeReadAndConfirmationPolicySnapshot[];

const PROVIDER_CAPABILITY_MATRIX_ROWS_INPUT = [
  {
    providerCapabilityMatrixRef: "PCM_279_OPTUM_IM1_PATIENT_V1",
    matrixVersionRef: "279.matrix.optum-im1-patient.v1",
    rowOwnerRef: "booking_domain_release_board",
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: "optum_emis_web",
    supplierLabel: "Optum EMIS Web",
    integrationMode: "im1_patient_api",
    deploymentType: "internet_patient_shell",
    assuranceStateRef: "assurance_pairing_live",
    supportedActionScopes: [
      "search_slots",
      "book_slot",
      "cancel_appointment",
      "reschedule_appointment",
      "view_appointment",
      "view_booking_summary",
    ],
    capabilities: {
      can_search_slots: true,
      can_book: true,
      can_cancel: true,
      can_reschedule: true,
      can_view_appointment: true,
      can_hold_slot: false,
      requires_gp_linkage_details: true,
      supports_patient_self_service: true,
      supports_staff_assisted_booking: false,
      supports_async_commit_confirmation: false,
      requires_local_consumer_component: false,
    },
    manageCapabilityState: "full",
    reservationMode: "truthful_nonexclusive",
    authoritativeReadMode: "read_after_write",
    primaryDependencyDegradationProfileRef: "DDP_279_PATIENT_LINKAGE_AND_SUPPORT",
    authoritativeReadAndConfirmationPolicyRef: "POLICY_279_IM1_PATIENT_READ_AFTER_WRITE",
    searchNormalizationContractRef: "contract://booking/search-normalization/im1-patient/v1",
    revalidationContractRef: "contract://booking/revalidation/im1-patient/v1",
    manageSupportContractRef: "contract://booking/manage-support/im1-patient/v1",
    contractState: "active",
    publishedAt: PUBLISHED_AT,
  },
  {
    providerCapabilityMatrixRef: "PCM_279_TPP_IM1_PATIENT_V1",
    matrixVersionRef: "279.matrix.tpp-im1-patient.v1",
    rowOwnerRef: "booking_domain_release_board",
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: "tpp_systmone",
    supplierLabel: "TPP SystmOne",
    integrationMode: "im1_patient_api",
    deploymentType: "internet_patient_shell",
    assuranceStateRef: "assurance_pairing_live",
    supportedActionScopes: [
      "search_slots",
      "book_slot",
      "cancel_appointment",
      "reschedule_appointment",
      "view_appointment",
      "view_booking_summary",
    ],
    capabilities: {
      can_search_slots: true,
      can_book: true,
      can_cancel: true,
      can_reschedule: true,
      can_view_appointment: true,
      can_hold_slot: false,
      requires_gp_linkage_details: true,
      supports_patient_self_service: true,
      supports_staff_assisted_booking: false,
      supports_async_commit_confirmation: false,
      requires_local_consumer_component: false,
    },
    manageCapabilityState: "full",
    reservationMode: "truthful_nonexclusive",
    authoritativeReadMode: "read_after_write",
    primaryDependencyDegradationProfileRef: "DDP_279_PATIENT_LINKAGE_AND_SUPPORT",
    authoritativeReadAndConfirmationPolicyRef: "POLICY_279_IM1_PATIENT_READ_AFTER_WRITE",
    searchNormalizationContractRef: "contract://booking/search-normalization/im1-patient/v1",
    revalidationContractRef: "contract://booking/revalidation/im1-patient/v1",
    manageSupportContractRef: "contract://booking/manage-support/im1-patient/v1",
    contractState: "active",
    publishedAt: PUBLISHED_AT,
  },
  {
    providerCapabilityMatrixRef: "PCM_279_TPP_IM1_TRANSACTION_V1",
    matrixVersionRef: "279.matrix.tpp-im1-transaction.v1",
    rowOwnerRef: "booking_domain_release_board",
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: "tpp_systmone",
    supplierLabel: "TPP SystmOne",
    integrationMode: "im1_transaction_api",
    deploymentType: "practice_local_component",
    assuranceStateRef: "assurance_supported_test",
    supportedActionScopes: [
      "search_slots",
      "view_appointment",
      "launch_local_component",
      "request_staff_assist",
    ],
    capabilities: {
      can_search_slots: true,
      can_book: false,
      can_cancel: false,
      can_reschedule: false,
      can_view_appointment: true,
      can_hold_slot: false,
      requires_gp_linkage_details: false,
      supports_patient_self_service: false,
      supports_staff_assisted_booking: true,
      supports_async_commit_confirmation: false,
      requires_local_consumer_component: true,
    },
    manageCapabilityState: "summary_only",
    reservationMode: "degraded_manual_pending",
    authoritativeReadMode: "gate_required",
    primaryDependencyDegradationProfileRef: "DDP_279_LOCAL_COMPONENT_RECOVERY",
    authoritativeReadAndConfirmationPolicyRef: "POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE",
    searchNormalizationContractRef: "contract://booking/search-normalization/im1-transaction/v1",
    revalidationContractRef: "contract://booking/revalidation/im1-transaction/v1",
    manageSupportContractRef: "contract://booking/manage-support/im1-transaction/v1",
    contractState: "active",
    publishedAt: PUBLISHED_AT,
  },
  {
    providerCapabilityMatrixRef: "PCM_279_GP_CONNECT_EXISTING_V1",
    matrixVersionRef: "279.matrix.gp-connect-existing.v1",
    rowOwnerRef: "booking_domain_release_board",
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: "gp_connect_existing",
    supplierLabel: "GP Connect appointment management",
    integrationMode: "gp_connect_existing",
    deploymentType: "hscn_direct_care_consumer",
    assuranceStateRef: "assurance_live_existing_service",
    supportedActionScopes: [
      "search_slots",
      "book_slot",
      "cancel_appointment",
      "reschedule_appointment",
      "view_appointment",
      "manage_appointment",
      "view_booking_summary",
      "request_staff_assist",
    ],
    capabilities: {
      can_search_slots: true,
      can_book: true,
      can_cancel: true,
      can_reschedule: true,
      can_view_appointment: true,
      can_hold_slot: false,
      requires_gp_linkage_details: false,
      supports_patient_self_service: false,
      supports_staff_assisted_booking: true,
      supports_async_commit_confirmation: true,
      requires_local_consumer_component: false,
    },
    manageCapabilityState: "full",
    reservationMode: "truthful_nonexclusive",
    authoritativeReadMode: "durable_provider_reference",
    primaryDependencyDegradationProfileRef: "DDP_279_ASSISTED_ONLY_HANDOFF",
    authoritativeReadAndConfirmationPolicyRef: "POLICY_279_GP_CONNECT_PROVIDER_REFERENCE",
    searchNormalizationContractRef: "contract://booking/search-normalization/gp-connect/v1",
    revalidationContractRef: "contract://booking/revalidation/gp-connect/v1",
    manageSupportContractRef: "contract://booking/manage-support/gp-connect/v1",
    contractState: "active",
    publishedAt: PUBLISHED_AT,
  },
  {
    providerCapabilityMatrixRef: "PCM_279_LOCAL_GATEWAY_COMPONENT_V1",
    matrixVersionRef: "279.matrix.local-gateway-component.v1",
    rowOwnerRef: "booking_domain_release_board",
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: "vecells_local_gateway",
    supplierLabel: "Vecells local gateway",
    integrationMode: "local_gateway_component",
    deploymentType: "practice_local_gateway",
    assuranceStateRef: "assurance_local_component_ready",
    supportedActionScopes: [
      "search_slots",
      "book_slot",
      "cancel_appointment",
      "view_appointment",
      "launch_local_component",
      "request_staff_assist",
    ],
    capabilities: {
      can_search_slots: true,
      can_book: true,
      can_cancel: true,
      can_reschedule: false,
      can_view_appointment: true,
      can_hold_slot: false,
      requires_gp_linkage_details: false,
      supports_patient_self_service: false,
      supports_staff_assisted_booking: true,
      supports_async_commit_confirmation: true,
      requires_local_consumer_component: true,
    },
    manageCapabilityState: "partial",
    reservationMode: "truthful_nonexclusive",
    authoritativeReadMode: "gate_required",
    primaryDependencyDegradationProfileRef: "DDP_279_LOCAL_COMPONENT_RECOVERY",
    authoritativeReadAndConfirmationPolicyRef: "POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE",
    searchNormalizationContractRef: "contract://booking/search-normalization/local-gateway/v1",
    revalidationContractRef: "contract://booking/revalidation/local-gateway/v1",
    manageSupportContractRef: "contract://booking/manage-support/local-gateway/v1",
    contractState: "active",
    publishedAt: PUBLISHED_AT,
  },
  {
    providerCapabilityMatrixRef: "PCM_279_MANUAL_ASSIST_ONLY_V1",
    matrixVersionRef: "279.matrix.manual-assist-only.v1",
    rowOwnerRef: "booking_domain_release_board",
    tenantId: "tenant_vecells_beta",
    practiceRef: "ods_A83002",
    organisationRef: "org_vecells_beta",
    supplierRef: "manual_assist_network",
    supplierLabel: "Manual assist network",
    integrationMode: "manual_assist_only",
    deploymentType: "ops_manual_assist",
    assuranceStateRef: "assurance_manual_assist_only",
    supportedActionScopes: [
      "view_appointment",
      "view_booking_summary",
      "request_staff_assist",
    ],
    capabilities: {
      can_search_slots: false,
      can_book: false,
      can_cancel: false,
      can_reschedule: false,
      can_view_appointment: true,
      can_hold_slot: false,
      requires_gp_linkage_details: false,
      supports_patient_self_service: false,
      supports_staff_assisted_booking: true,
      supports_async_commit_confirmation: true,
      requires_local_consumer_component: false,
    },
    manageCapabilityState: "summary_only",
    reservationMode: "degraded_manual_pending",
    authoritativeReadMode: "gate_required",
    primaryDependencyDegradationProfileRef: "DDP_279_DEGRADED_MANUAL_RECOVERY",
    authoritativeReadAndConfirmationPolicyRef: "POLICY_279_MANUAL_CONFIRMATION_GATE",
    searchNormalizationContractRef: "contract://booking/search-normalization/manual-assist/v1",
    revalidationContractRef: "contract://booking/revalidation/manual-assist/v1",
    manageSupportContractRef: "contract://booking/manage-support/manual-assist/v1",
    contractState: "active",
    publishedAt: PUBLISHED_AT,
  },
] as const satisfies readonly Omit<ProviderCapabilityMatrixRowSnapshot, "rowHash">[];

export const phase4ProviderCapabilityMatrixRows = PROVIDER_CAPABILITY_MATRIX_ROWS_INPUT.map((row) => ({
  ...row,
  rowHash: buildMatrixRowHash(row),
})) as readonly ProviderCapabilityMatrixRowSnapshot[];

export const phase4ProviderCapabilityMatrix: ProviderCapabilityMatrixSnapshot = {
  providerCapabilityMatrixId: "provider_capability_matrix_279",
  schemaVersion: BOOKING_CAPABILITY_SCHEMA_VERSION,
  inventoryVersionRef: "279.provider-capability-matrix.v1",
  ownerContext: "booking",
  publishedAt: PUBLISHED_AT,
  rows: phase4ProviderCapabilityMatrixRows,
};

export const phase4AdapterContractProfiles =
  ADAPTER_CONTRACT_PROFILES satisfies readonly AdapterContractProfileSnapshot[];
export const phase4DependencyDegradationProfiles =
  DEPENDENCY_DEGRADATION_PROFILES satisfies readonly DependencyDegradationProfileSnapshot[];
export const phase4AuthoritativeReadAndConfirmationPolicies =
  AUTHORITATIVE_READ_AND_CONFIRMATION_POLICIES satisfies readonly AuthoritativeReadAndConfirmationPolicySnapshot[];

export interface Phase4BookingCapabilityEngineRepositories {
  getProviderCapabilityMatrixRow(
    providerCapabilityMatrixRef: string,
  ): Promise<SnapshotDocument<ProviderCapabilityMatrixRowSnapshot> | null>;
  listProviderCapabilityMatrixRows(): Promise<
    readonly SnapshotDocument<ProviderCapabilityMatrixRowSnapshot>[]
  >;
  getAdapterContractProfile(
    adapterContractProfileId: string,
  ): Promise<SnapshotDocument<AdapterContractProfileSnapshot> | null>;
  listAdapterContractProfiles(): Promise<readonly SnapshotDocument<AdapterContractProfileSnapshot>[]>;
  getDependencyDegradationProfile(
    dependencyDegradationProfileId: string,
  ): Promise<SnapshotDocument<DependencyDegradationProfileSnapshot> | null>;
  listDependencyDegradationProfiles(): Promise<
    readonly SnapshotDocument<DependencyDegradationProfileSnapshot>[]
  >;
  getAuthoritativeReadAndConfirmationPolicy(
    authoritativeReadAndConfirmationPolicyId: string,
  ): Promise<SnapshotDocument<AuthoritativeReadAndConfirmationPolicySnapshot> | null>;
  listAuthoritativeReadAndConfirmationPolicies(): Promise<
    readonly SnapshotDocument<AuthoritativeReadAndConfirmationPolicySnapshot>[]
  >;
  getProviderAdapterBinding(
    bookingProviderAdapterBindingId: string,
  ): Promise<SnapshotDocument<BookingProviderAdapterBindingSnapshot> | null>;
  getBookingCapabilityResolution(
    bookingCapabilityResolutionId: string,
  ): Promise<SnapshotDocument<BookingCapabilityResolutionSnapshot> | null>;
  getBookingCapabilityProjection(
    bookingCapabilityProjectionId: string,
  ): Promise<SnapshotDocument<BookingCapabilityProjectionSnapshot> | null>;
}

interface ExtendedPhase4BookingCapabilityEngineRepositories
  extends Phase4BookingCapabilityEngineRepositories {
  saveProviderCapabilityMatrixRow(
    snapshot: ProviderCapabilityMatrixRowSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveAdapterContractProfile(
    snapshot: AdapterContractProfileSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveDependencyDegradationProfile(
    snapshot: DependencyDegradationProfileSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveAuthoritativeReadAndConfirmationPolicy(
    snapshot: AuthoritativeReadAndConfirmationPolicySnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveProviderAdapterBinding(
    snapshot: BookingProviderAdapterBindingSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveBookingCapabilityResolution(
    snapshot: BookingCapabilityResolutionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  saveBookingCapabilityProjection(
    snapshot: BookingCapabilityProjectionSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getCurrentBindingRef(selectionKey: string): Promise<string | null>;
  setCurrentBindingRef(selectionKey: string, bindingRef: string): Promise<void>;
  getCurrentResolutionRef(scopeKey: string): Promise<string | null>;
  setCurrentResolutionRef(scopeKey: string, resolutionRef: string): Promise<void>;
  getCurrentProjectionRef(scopeKey: string): Promise<string | null>;
  setCurrentProjectionRef(scopeKey: string, projectionRef: string): Promise<void>;
  getBindingMeta(bindingRef: string): Promise<StoredMeta | null>;
  saveBindingMeta(bindingRef: string, meta: StoredMeta): Promise<void>;
  getResolutionMeta(resolutionRef: string): Promise<StoredMeta | null>;
  saveResolutionMeta(resolutionRef: string, meta: StoredMeta): Promise<void>;
  getProjectionMeta(projectionRef: string): Promise<StoredMeta | null>;
  saveProjectionMeta(projectionRef: string, meta: StoredMeta): Promise<void>;
}

export function createPhase4BookingCapabilityEngineStore(): ExtendedPhase4BookingCapabilityEngineRepositories {
  const matrixRows = new Map<string, StoredRow<ProviderCapabilityMatrixRowSnapshot>>();
  const adapterProfiles = new Map<string, StoredRow<AdapterContractProfileSnapshot>>();
  const degradationProfiles = new Map<string, StoredRow<DependencyDegradationProfileSnapshot>>();
  const confirmationPolicies = new Map<
    string,
    StoredRow<AuthoritativeReadAndConfirmationPolicySnapshot>
  >();
  const bindings = new Map<string, StoredRow<BookingProviderAdapterBindingSnapshot>>();
  const resolutions = new Map<string, StoredRow<BookingCapabilityResolutionSnapshot>>();
  const projections = new Map<string, StoredRow<BookingCapabilityProjectionSnapshot>>();
  const currentBindingBySelectionKey = new Map<string, string>();
  const currentResolutionByScopeKey = new Map<string, string>();
  const currentProjectionByScopeKey = new Map<string, string>();
  const bindingMeta = new Map<string, StoredMeta>();
  const resolutionMeta = new Map<string, StoredMeta>();
  const projectionMeta = new Map<string, StoredMeta>();

  for (const row of phase4ProviderCapabilityMatrix.rows) {
    matrixRows.set(row.providerCapabilityMatrixRef, {
      snapshot: structuredClone(row),
      version: 1,
    });
  }
  for (const profile of phase4AdapterContractProfiles) {
    adapterProfiles.set(profile.adapterContractProfileId, {
      snapshot: structuredClone(profile),
      version: 1,
    });
  }
  for (const profile of phase4DependencyDegradationProfiles) {
    degradationProfiles.set(profile.dependencyDegradationProfileId, {
      snapshot: structuredClone(profile),
      version: 1,
    });
  }
  for (const policy of phase4AuthoritativeReadAndConfirmationPolicies) {
    confirmationPolicies.set(policy.authoritativeReadAndConfirmationPolicyId, {
      snapshot: structuredClone(policy),
      version: 1,
    });
  }

  return {
    async getProviderCapabilityMatrixRow(providerCapabilityMatrixRef) {
      const row = matrixRows.get(providerCapabilityMatrixRef);
      return row ? new StoredDocument(row) : null;
    },
    async listProviderCapabilityMatrixRows() {
      return [...matrixRows.values()].map((row) => new StoredDocument(row));
    },
    async getAdapterContractProfile(adapterContractProfileId) {
      const row = adapterProfiles.get(adapterContractProfileId);
      return row ? new StoredDocument(row) : null;
    },
    async listAdapterContractProfiles() {
      return [...adapterProfiles.values()].map((row) => new StoredDocument(row));
    },
    async getDependencyDegradationProfile(dependencyDegradationProfileId) {
      const row = degradationProfiles.get(dependencyDegradationProfileId);
      return row ? new StoredDocument(row) : null;
    },
    async listDependencyDegradationProfiles() {
      return [...degradationProfiles.values()].map((row) => new StoredDocument(row));
    },
    async getAuthoritativeReadAndConfirmationPolicy(authoritativeReadAndConfirmationPolicyId) {
      const row = confirmationPolicies.get(authoritativeReadAndConfirmationPolicyId);
      return row ? new StoredDocument(row) : null;
    },
    async listAuthoritativeReadAndConfirmationPolicies() {
      return [...confirmationPolicies.values()].map((row) => new StoredDocument(row));
    },
    async getProviderAdapterBinding(bookingProviderAdapterBindingId) {
      const row = bindings.get(bookingProviderAdapterBindingId);
      return row ? new StoredDocument(row) : null;
    },
    async getBookingCapabilityResolution(bookingCapabilityResolutionId) {
      const row = resolutions.get(bookingCapabilityResolutionId);
      return row ? new StoredDocument(row) : null;
    },
    async getBookingCapabilityProjection(bookingCapabilityProjectionId) {
      const row = projections.get(bookingCapabilityProjectionId);
      return row ? new StoredDocument(row) : null;
    },
    async saveProviderCapabilityMatrixRow(snapshot, options) {
      saveWithCas(matrixRows, snapshot.providerCapabilityMatrixRef, snapshot, options);
    },
    async saveAdapterContractProfile(snapshot, options) {
      saveWithCas(adapterProfiles, snapshot.adapterContractProfileId, snapshot, options);
    },
    async saveDependencyDegradationProfile(snapshot, options) {
      saveWithCas(degradationProfiles, snapshot.dependencyDegradationProfileId, snapshot, options);
    },
    async saveAuthoritativeReadAndConfirmationPolicy(snapshot, options) {
      saveWithCas(
        confirmationPolicies,
        snapshot.authoritativeReadAndConfirmationPolicyId,
        snapshot,
        options,
      );
    },
    async saveProviderAdapterBinding(snapshot, options) {
      saveWithCas(bindings, snapshot.bookingProviderAdapterBindingId, snapshot, options);
    },
    async saveBookingCapabilityResolution(snapshot, options) {
      saveWithCas(resolutions, snapshot.bookingCapabilityResolutionId, snapshot, options);
    },
    async saveBookingCapabilityProjection(snapshot, options) {
      saveWithCas(projections, snapshot.bookingCapabilityProjectionId, snapshot, options);
    },
    async getCurrentBindingRef(selectionKey) {
      return currentBindingBySelectionKey.get(selectionKey) ?? null;
    },
    async setCurrentBindingRef(selectionKey, bindingRef) {
      currentBindingBySelectionKey.set(selectionKey, bindingRef);
    },
    async getCurrentResolutionRef(scopeKey) {
      return currentResolutionByScopeKey.get(scopeKey) ?? null;
    },
    async setCurrentResolutionRef(scopeKey, resolutionRef) {
      currentResolutionByScopeKey.set(scopeKey, resolutionRef);
    },
    async getCurrentProjectionRef(scopeKey) {
      return currentProjectionByScopeKey.get(scopeKey) ?? null;
    },
    async setCurrentProjectionRef(scopeKey, projectionRef) {
      currentProjectionByScopeKey.set(scopeKey, projectionRef);
    },
    async getBindingMeta(bindingRef) {
      return structuredClone(bindingMeta.get(bindingRef) ?? null);
    },
    async saveBindingMeta(bindingRef, meta) {
      bindingMeta.set(bindingRef, structuredClone(meta));
    },
    async getResolutionMeta(resolutionRef) {
      return structuredClone(resolutionMeta.get(resolutionRef) ?? null);
    },
    async saveResolutionMeta(resolutionRef, meta) {
      resolutionMeta.set(resolutionRef, structuredClone(meta));
    },
    async getProjectionMeta(projectionRef) {
      return structuredClone(projectionMeta.get(projectionRef) ?? null);
    },
    async saveProjectionMeta(projectionRef, meta) {
      projectionMeta.set(projectionRef, structuredClone(meta));
    },
  };
}

function buildBindingSelectionKey(row: ProviderCapabilityMatrixRowSnapshot): string {
  return [
    row.tenantId,
    row.practiceRef,
    row.organisationRef,
    row.supplierRef,
    row.integrationMode,
    row.deploymentType,
  ].join("::");
}

function buildResolutionScopeKey(input: {
  bookingCaseId: string | null;
  appointmentId: string | null;
  governingObjectDescriptorRef: string;
  governingObjectRef: string;
  selectionAudience: BookingSelectionAudience;
  requestedActionScope: BookingActionScope;
}): string {
  return [
    input.bookingCaseId ?? "no_case",
    input.appointmentId ?? "no_appointment",
    input.governingObjectDescriptorRef,
    input.governingObjectRef,
    input.selectionAudience,
    input.requestedActionScope,
  ].join("::");
}

function routeTupleHash(input: {
  routeIntentBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
}): string {
  return sha256({
    routeIntentBindingRef: requireRef(input.routeIntentBindingRef, "routeIntentBindingRef"),
    surfaceRouteContractRef: requireRef(input.surfaceRouteContractRef, "surfaceRouteContractRef"),
    surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
    runtimePublicationBundleRef: requireRef(
      input.runtimePublicationBundleRef,
      "runtimePublicationBundleRef",
    ),
  });
}

function compileSelectionAudienceSet(
  row: ProviderCapabilityMatrixRowSnapshot,
): readonly BookingSelectionAudience[] {
  const audiences: BookingSelectionAudience[] = [];
  if (row.capabilities.supports_patient_self_service) {
    audiences.push("patient");
  }
  if (
    row.capabilities.supports_staff_assisted_booking ||
    row.integrationMode === "gp_connect_existing" ||
    row.integrationMode === "local_gateway_component" ||
    row.integrationMode === "manual_assist_only"
  ) {
    audiences.push("staff");
  }
  if (
    (row.integrationMode === "gp_connect_existing" ||
      row.integrationMode === "local_gateway_component" ||
      row.integrationMode === "manual_assist_only") &&
    !audiences.includes("patient")
  ) {
    audiences.push("patient");
  }
  return uniqueSorted(audiences);
}

function buildProviderAdapterBinding(
  row: ProviderCapabilityMatrixRowSnapshot,
  profile: AdapterContractProfileSnapshot,
): BookingProviderAdapterBindingSnapshot {
  const basePayload = {
    providerCapabilityMatrixRef: row.providerCapabilityMatrixRef,
    matrixVersionRef: row.matrixVersionRef,
    supplierRef: row.supplierRef,
    integrationMode: row.integrationMode,
    deploymentType: row.deploymentType,
    actionScopeSet: uniqueSorted(row.supportedActionScopes),
    selectionAudienceSet: compileSelectionAudienceSet(row),
    adapterContractProfileRef: profile.adapterContractProfileId,
    dependencyDegradationProfileRef: row.primaryDependencyDegradationProfileRef,
    searchNormalizationContractRef: row.searchNormalizationContractRef,
    temporalNormalizationContractRef: `contract://booking/temporal-normalization/${row.integrationMode}/v1`,
    revalidationContractRef: row.revalidationContractRef,
    reservationSemantics: row.reservationMode,
    commitContractRef: `contract://booking/commit/${row.integrationMode}/v1`,
    authoritativeReadContractRef: `contract://booking/authoritative-read/${row.authoritativeReadMode}/v1`,
    manageSupportContractRef: row.manageSupportContractRef,
    authoritativeReadAndConfirmationPolicyRef: row.authoritativeReadAndConfirmationPolicyRef,
    bindingState: "live" as const,
    bindingCompilationOwnerRule:
      "exact active matrix row + exact integration mode + exact deployment type + explicit actionScopeSet + explicit selectionAudienceSet",
    publishedAt: row.publishedAt,
  };
  const bindingHash = sha256(basePayload);
  return {
    bookingProviderAdapterBindingId: normalizeRecordId(
      "booking_provider_adapter_binding",
      bindingHash,
    ),
    ...basePayload,
    bindingHash,
  };
}

function capabilityTupleHash(input: {
  bookingCaseId: string | null;
  appointmentId: string | null;
  tenantId: string;
  practiceRef: string;
  organisationRef: string;
  supplierRef: string;
  integrationMode: BookingIntegrationMode;
  deploymentType: string;
  selectionAudience: BookingSelectionAudience;
  requestedActionScope: BookingActionScope;
  providerCapabilityMatrixRef: string;
  capabilityMatrixVersionRef: string;
  providerAdapterBindingRef: string;
  providerAdapterBindingHash: string;
  adapterContractProfileRef: string;
  dependencyDegradationProfileRef: string;
  authoritativeReadAndConfirmationPolicyRef: string;
  gpLinkageCheckpointRef: string | null;
  gpLinkageStatus: BookingGpLinkageStatus;
  localConsumerCheckpointRef: string | null;
  localConsumerStatus: BookingLocalConsumerStatus;
  supplierDegradationStatus: BookingSupplierDegradationStatus;
  publicationState: BookingPublicationState;
  assuranceTrustState: BookingAssuranceTrustState;
  routeTuple: BookingCapabilityRouteTupleSnapshot;
  governingObjectDescriptorRef: string;
  governingObjectRef: string;
  governingObjectVersionRef: string;
  parentAnchorRef: string;
}): string {
  return sha256({
    bookingCaseId: input.bookingCaseId,
    appointmentId: input.appointmentId,
    tenantId: input.tenantId,
    practiceRef: input.practiceRef,
    organisationRef: input.organisationRef,
    supplierRef: input.supplierRef,
    integrationMode: input.integrationMode,
    deploymentType: input.deploymentType,
    selectionAudience: input.selectionAudience,
    requestedActionScope: input.requestedActionScope,
    providerCapabilityMatrixRef: input.providerCapabilityMatrixRef,
    capabilityMatrixVersionRef: input.capabilityMatrixVersionRef,
    providerAdapterBindingRef: input.providerAdapterBindingRef,
    providerAdapterBindingHash: input.providerAdapterBindingHash,
    adapterContractProfileRef: input.adapterContractProfileRef,
    dependencyDegradationProfileRef: input.dependencyDegradationProfileRef,
    authoritativeReadAndConfirmationPolicyRef:
      input.authoritativeReadAndConfirmationPolicyRef,
    gpLinkageCheckpointRef: input.gpLinkageCheckpointRef,
    gpLinkageStatus: input.gpLinkageStatus,
    localConsumerCheckpointRef: input.localConsumerCheckpointRef,
    localConsumerStatus: input.localConsumerStatus,
    supplierDegradationStatus: input.supplierDegradationStatus,
    publicationState: input.publicationState,
    assuranceTrustState: input.assuranceTrustState,
    routeTupleHash: input.routeTuple.routeTupleHash,
    governingObjectDescriptorRef: input.governingObjectDescriptorRef,
    governingObjectRef: input.governingObjectRef,
    governingObjectVersionRef: input.governingObjectVersionRef,
    parentAnchorRef: input.parentAnchorRef,
  });
}

function baseAudienceActions(
  row: ProviderCapabilityMatrixRowSnapshot,
  audience: BookingSelectionAudience,
): readonly BookingActionScope[] {
  if (audience === "staff") {
    if (!compileSelectionAudienceSet(row).includes("staff")) {
      return [];
    }
    return uniqueSorted(row.supportedActionScopes);
  }
  if (row.capabilities.supports_patient_self_service) {
    return uniqueSorted(
      row.supportedActionScopes.filter((scope) => scope !== "request_staff_assist"),
    );
  }
  return uniqueSorted(
    row.supportedActionScopes.filter(
      (scope) =>
        scope === "view_appointment" ||
        scope === "view_booking_summary" ||
        scope === "request_staff_assist",
    ),
  );
}

function currentAllowedActionScopes(
  row: ProviderCapabilityMatrixRowSnapshot,
  state: BookingCapabilityState,
  audience: BookingSelectionAudience,
): readonly BookingActionScope[] {
  const baseActions = baseAudienceActions(row, audience);
  switch (state) {
    case "live_self_service":
    case "live_staff_assist":
      return baseActions;
    case "assisted_only":
      return uniqueSorted(
        baseActions.filter(
          (scope) =>
            scope === "view_appointment" ||
            scope === "view_booking_summary" ||
            scope === "request_staff_assist",
        ),
      );
    case "linkage_required":
      return uniqueSorted(
        [
          row.supportedActionScopes.includes("view_booking_summary")
            ? "view_booking_summary"
            : undefined,
          row.supportedActionScopes.includes("view_appointment") ? "view_appointment" : undefined,
          "repair_gp_linkage",
        ].filter(Boolean) as BookingActionScope[],
      );
    case "local_component_required":
      return uniqueSorted(
        [
          row.supportedActionScopes.includes("view_booking_summary")
            ? "view_booking_summary"
            : undefined,
          row.supportedActionScopes.includes("view_appointment") ? "view_appointment" : undefined,
          "launch_local_component",
          "request_staff_assist",
        ].filter(Boolean) as BookingActionScope[],
      );
    case "degraded_manual":
      return uniqueSorted(
        [
          row.supportedActionScopes.includes("view_booking_summary")
            ? "view_booking_summary"
            : undefined,
          row.supportedActionScopes.includes("view_appointment") ? "view_appointment" : undefined,
          "request_staff_assist",
        ].filter(Boolean) as BookingActionScope[],
      );
    case "recovery_only":
      return uniqueSorted(
        [
          row.supportedActionScopes.includes("view_booking_summary")
            ? "view_booking_summary"
            : undefined,
          row.supportedActionScopes.includes("view_appointment") ? "view_appointment" : undefined,
        ].filter(Boolean) as BookingActionScope[],
      );
    case "blocked":
      return uniqueSorted(
        [
          row.supportedActionScopes.includes("view_booking_summary")
            ? "view_booking_summary"
            : undefined,
          row.supportedActionScopes.includes("view_appointment") ? "view_appointment" : undefined,
        ].filter(Boolean) as BookingActionScope[],
      );
  }
}

function determineCapabilityState(input: {
  row: ProviderCapabilityMatrixRowSnapshot;
  audience: BookingSelectionAudience;
  requestedActionScope: BookingActionScope;
  prerequisiteState: BookingCapabilityPrerequisiteStateSnapshot;
}): BookingCapabilityState {
  const { row, audience, requestedActionScope, prerequisiteState } = input;
  if (prerequisiteState.publicationState === "withdrawn" || prerequisiteState.assuranceTrustState === "blocked") {
    return "blocked";
  }
  if (
    prerequisiteState.publicationState === "frozen" ||
    prerequisiteState.assuranceTrustState === "read_only"
  ) {
    return "recovery_only";
  }
  if (
    row.capabilities.requires_gp_linkage_details &&
    prerequisiteState.gpLinkageStatus !== "linked"
  ) {
    return "linkage_required";
  }
  if (
    row.capabilities.requires_local_consumer_component &&
    prerequisiteState.localConsumerStatus !== "ready"
  ) {
    return "local_component_required";
  }
  if (prerequisiteState.supplierDegradationStatus === "degraded_manual") {
    return "degraded_manual";
  }
  if (audience === "patient" && !row.capabilities.supports_patient_self_service) {
    if (!row.supportedActionScopes.includes(requestedActionScope)) {
      return "blocked";
    }
    if (row.capabilities.supports_staff_assisted_booking || row.supportedActionScopes.includes("request_staff_assist")) {
      return "assisted_only";
    }
    return "blocked";
  }
  if (!row.supportedActionScopes.includes(requestedActionScope)) {
    return "blocked";
  }
  if (audience === "staff") {
    if (!compileSelectionAudienceSet(row).includes("staff")) {
      return "blocked";
    }
    return "live_staff_assist";
  }
  return "live_self_service";
}

function applyPresentedTupleDrift(
  baseState: BookingCapabilityState,
  input: {
    prerequisiteState: BookingCapabilityPrerequisiteStateSnapshot;
    presentedCapabilityTupleHash: string | null;
    candidateCapabilityTupleHash: string;
  },
): BookingCapabilityState {
  if (
    input.prerequisiteState.publicationState === "withdrawn" ||
    input.prerequisiteState.assuranceTrustState === "blocked"
  ) {
    return "blocked";
  }
  if (
    input.prerequisiteState.publicationState === "frozen" ||
    input.prerequisiteState.assuranceTrustState === "read_only"
  ) {
    return "recovery_only";
  }
  if (
    input.presentedCapabilityTupleHash !== null &&
    input.presentedCapabilityTupleHash !== input.candidateCapabilityTupleHash
  ) {
    return "recovery_only";
  }
  return baseState;
}

function currentBlockedReasonCodes(input: {
  row: ProviderCapabilityMatrixRowSnapshot;
  state: BookingCapabilityState;
  requestedActionScope: BookingActionScope;
  prerequisiteState: BookingCapabilityPrerequisiteStateSnapshot;
  degradationProfile: DependencyDegradationProfileSnapshot;
  presentedCapabilityTupleHash: string | null;
  currentCapabilityTupleHash: string;
}): readonly BookingBlockedReasonCode[] {
  const reasons = new Set<BookingBlockedReasonCode>();
  if (
    input.presentedCapabilityTupleHash !== null &&
    input.presentedCapabilityTupleHash !== input.currentCapabilityTupleHash
  ) {
    reasons.add("reason_governing_object_stale");
  }
  switch (input.state) {
    case "linkage_required":
    case "local_component_required":
    case "assisted_only":
    case "degraded_manual":
    case "recovery_only":
      for (const code of input.degradationProfile.blockedActionReasonCodes) {
        reasons.add(code);
      }
      break;
    case "blocked":
      if (!input.row.supportedActionScopes.includes(input.requestedActionScope)) {
        reasons.add("reason_action_scope_not_supported");
      }
      if (!input.row.capabilities.supports_patient_self_service) {
        reasons.add("reason_policy_blocked");
      }
      break;
    default:
      break;
  }
  if (input.prerequisiteState.publicationState === "frozen") {
    reasons.add("reason_publication_frozen");
  }
  if (input.prerequisiteState.assuranceTrustState === "read_only") {
    reasons.add("reason_assurance_read_only");
  }
  if (input.prerequisiteState.assuranceTrustState === "blocked") {
    reasons.add("reason_policy_blocked");
  }
  return uniqueSorted([...reasons]);
}

function currentFallbackActions(
  input: {
    row: ProviderCapabilityMatrixRowSnapshot;
    state: BookingCapabilityState;
    degradationProfile: DependencyDegradationProfileSnapshot;
  },
): readonly BookingFallbackActionRef[] {
  switch (input.state) {
    case "linkage_required":
    case "local_component_required":
    case "assisted_only":
    case "degraded_manual":
    case "recovery_only":
      return uniqueSorted(input.degradationProfile.fallbackActionRefs);
    case "blocked":
      return uniqueSorted([
        input.row.supportedActionScopes.includes("request_staff_assist")
          ? "fallback_request_staff_assist"
          : "fallback_contact_practice_support",
      ]);
    default:
      return [];
  }
}

function dominantCueCode(state: BookingCapabilityState): string {
  switch (state) {
    case "live_self_service":
      return "cue_live_self_service";
    case "live_staff_assist":
      return "cue_live_staff_assist";
    case "assisted_only":
      return "cue_assisted_only";
    case "linkage_required":
      return "cue_linkage_required";
    case "local_component_required":
      return "cue_local_component_required";
    case "degraded_manual":
      return "cue_degraded_manual";
    case "recovery_only":
      return "cue_recovery_required";
    case "blocked":
      return "cue_blocked";
  }
}

function projectionSurfaceState(state: BookingCapabilityState): BookingProjectionSurfaceState {
  switch (state) {
    case "live_self_service":
      return "self_service_live";
    case "live_staff_assist":
      return "staff_assist_live";
    case "recovery_only":
      return "recovery_required";
    default:
      return state;
  }
}

function projectionControlState(state: BookingCapabilityState): BookingProjectionControlState {
  switch (state) {
    case "live_self_service":
    case "live_staff_assist":
      return "writable";
    case "recovery_only":
      return "read_only";
    default:
      return "blocked";
  }
}

function projectionExposedActionScopes(
  state: BookingCapabilityState,
  allowedActionScopes: readonly BookingActionScope[],
  audience: BookingSelectionAudience,
): readonly BookingActionScope[] {
  switch (state) {
    case "live_self_service":
    case "live_staff_assist":
      return uniqueSorted(allowedActionScopes);
    case "assisted_only":
      return allowedActionScopes.includes("request_staff_assist")
        ? ["request_staff_assist"]
        : [];
    case "linkage_required":
      return allowedActionScopes.includes("repair_gp_linkage") ? ["repair_gp_linkage"] : [];
    case "local_component_required":
      return uniqueSorted(
        allowedActionScopes.filter(
          (scope) =>
            scope === "launch_local_component" ||
            (scope === "request_staff_assist" && audience === "staff"),
        ),
      );
    case "degraded_manual":
      return allowedActionScopes.includes("request_staff_assist")
        ? ["request_staff_assist"]
        : [];
    case "recovery_only":
    case "blocked":
      return [];
  }
}

function buildProjection(
  resolution: BookingCapabilityResolutionSnapshot,
): BookingCapabilityProjectionSnapshot {
  const surfaceState = projectionSurfaceState(resolution.capabilityState);
  const exposedActionScopes = projectionExposedActionScopes(
    resolution.capabilityState,
    resolution.allowedActionScopes,
    resolution.selectionAudience,
  );
  const manageActionRefs = uniqueSorted(
    resolution.allowedActionScopes.filter(
      (scope) =>
        scope === "view_appointment" ||
        scope === "cancel_appointment" ||
        scope === "reschedule_appointment" ||
        scope === "manage_appointment",
    ),
  );
  const selfServiceActionRefs =
    resolution.capabilityState === "live_self_service" && resolution.selectionAudience === "patient"
      ? uniqueSorted(
          exposedActionScopes.filter(
            (scope) =>
              scope !== "request_staff_assist" &&
              scope !== "launch_local_component" &&
              scope !== "repair_gp_linkage",
          ),
        )
      : [];
  const assistedActionRefs = uniqueSorted(
    exposedActionScopes.filter(
      (scope) => scope === "request_staff_assist" || scope === "launch_local_component",
    ),
  );
  const projectionDigest = sha256({
    resolutionRef: resolution.bookingCapabilityResolutionId,
    selectionAudience: resolution.selectionAudience,
    requestedActionScope: resolution.requestedActionScope,
    surfaceState,
    exposedActionScopes,
  });
  return {
    bookingCapabilityProjectionId: normalizeRecordId(
      "booking_capability_projection",
      projectionDigest,
    ),
    schemaVersion: BOOKING_CAPABILITY_SCHEMA_VERSION,
    bookingCaseId: resolution.bookingCaseId,
    appointmentId: resolution.appointmentId,
    bookingCapabilityResolutionRef: resolution.bookingCapabilityResolutionId,
    selectionAudience: resolution.selectionAudience,
    requestedActionScope: resolution.requestedActionScope,
    providerAdapterBindingRef: resolution.providerAdapterBindingRef,
    capabilityTupleHash: resolution.capabilityTupleHash,
    surfaceState,
    dominantCapabilityCueCode: dominantCueCode(resolution.capabilityState),
    controlState: projectionControlState(resolution.capabilityState),
    selfServiceActionRefs,
    assistedActionRefs,
    manageActionRefs,
    fallbackActionRefs: resolution.fallbackActionRefs,
    blockedActionReasonCodes: resolution.blockedActionReasonCodes,
    exposedActionScopes,
    parityGroupId: normalizeRecordId(
      "booking_capability_parity",
      sha256({
        providerCapabilityMatrixRef: resolution.providerCapabilityMatrixRef,
        governingObjectRef: resolution.governingObjectRef,
        requestedActionScope: resolution.requestedActionScope,
      }),
    ),
    underlyingCapabilityState: resolution.capabilityState,
    renderedAt: resolution.evaluatedAt,
  };
}

function buildCapabilityResolvedEvent(
  resolution: BookingCapabilityResolutionSnapshot,
  input: BookingCapabilityResolutionInput,
): FoundationEventEnvelope<object> {
  return makeFoundationEvent("booking.capability.resolved", {
    governingRef: resolution.governingObjectRef,
    settlementState: resolution.capabilityState,
    settlementRef: resolution.bookingCapabilityResolutionId,
    commandActionRecordRef: input.commandActionRecordRef,
    commandSettlementRef: input.commandSettlementRecordRef,
    routeIntentRef: input.routeIntentBindingRef,
    subjectRef: input.subjectRef,
  });
}

export interface Phase4BookingCapabilityEngineService {
  repositories: Phase4BookingCapabilityEngineRepositories;
  resolveBookingCapability(
    input: BookingCapabilityResolutionInput,
  ): Promise<BookingCapabilityResolutionResult>;
  resolveAppointmentManageCapability(
    input: BookingCapabilityResolutionInput,
  ): Promise<BookingCapabilityResolutionResult>;
  queryCapabilityDiagnostics(
    input: QueryBookingCapabilityDiagnosticsInput,
  ): Promise<BookingCapabilityDiagnosticsBundle | null>;
}

export function createPhase4BookingCapabilityEngineService(input?: {
  repositories?: ExtendedPhase4BookingCapabilityEngineRepositories;
}): Phase4BookingCapabilityEngineService {
  const repositories =
    input?.repositories ?? createPhase4BookingCapabilityEngineStore();

  async function requireActiveRow(
    resolutionInput: BookingCapabilityResolutionInput,
  ): Promise<ProviderCapabilityMatrixRowSnapshot> {
    const rows = (await repositories.listProviderCapabilityMatrixRows())
      .map((document) => document.toSnapshot())
      .filter(
        (row) =>
          row.contractState === "active" &&
          row.tenantId === requireRef(resolutionInput.tenantId, "tenantId") &&
          row.practiceRef === requireRef(resolutionInput.practiceRef, "practiceRef") &&
          row.organisationRef === requireRef(resolutionInput.organisationRef, "organisationRef") &&
          row.supplierRef === requireRef(resolutionInput.supplierRef, "supplierRef") &&
          row.integrationMode === resolutionInput.integrationMode &&
          row.deploymentType === requireRef(resolutionInput.deploymentType, "deploymentType"),
      );
    invariant(rows.length > 0, "PROVIDER_CAPABILITY_MATRIX_NOT_FOUND", "No active ProviderCapabilityMatrix row matched the exact provider tuple.");
    invariant(rows.length === 1, "AMBIGUOUS_PROVIDER_CAPABILITY_MATRIX", "More than one active ProviderCapabilityMatrix row matched the exact provider tuple.");
    return rows[0]!;
  }

  async function requireAdapterProfile(
    row: ProviderCapabilityMatrixRowSnapshot,
  ): Promise<AdapterContractProfileSnapshot> {
    const matches = (await repositories.listAdapterContractProfiles())
      .map((document) => document.toSnapshot())
      .filter((profile) => profile.integrationModes.includes(row.integrationMode));
    invariant(
      matches.length === 1,
      "AMBIGUOUS_ADAPTER_CONTRACT_PROFILE",
      "Expected exactly one AdapterContractProfile for the active integration mode.",
    );
    return matches[0]!;
  }

  async function requireDegradationProfile(
    row: ProviderCapabilityMatrixRowSnapshot,
  ): Promise<DependencyDegradationProfileSnapshot> {
    const document = await repositories.getDependencyDegradationProfile(
      row.primaryDependencyDegradationProfileRef,
    );
    invariant(
      document !== null,
      "DEPENDENCY_DEGRADATION_PROFILE_NOT_FOUND",
      `DependencyDegradationProfile ${row.primaryDependencyDegradationProfileRef} was not found.`,
    );
    return document.toSnapshot();
  }

  async function requireConfirmationPolicy(
    row: ProviderCapabilityMatrixRowSnapshot,
  ): Promise<AuthoritativeReadAndConfirmationPolicySnapshot> {
    const document = await repositories.getAuthoritativeReadAndConfirmationPolicy(
      row.authoritativeReadAndConfirmationPolicyRef,
    );
    invariant(
      document !== null,
      "CONFIRMATION_POLICY_NOT_FOUND",
      `AuthoritativeReadAndConfirmationPolicy ${row.authoritativeReadAndConfirmationPolicyRef} was not found.`,
    );
    return document.toSnapshot();
  }

  async function resolveDegradationProfileForState(
    state: BookingCapabilityState,
    row: ProviderCapabilityMatrixRowSnapshot,
  ): Promise<DependencyDegradationProfileSnapshot> {
    const profileRef =
      state === "linkage_required"
        ? "DDP_279_PATIENT_LINKAGE_AND_SUPPORT"
        : state === "local_component_required"
          ? "DDP_279_LOCAL_COMPONENT_RECOVERY"
          : state === "assisted_only"
            ? "DDP_279_ASSISTED_ONLY_HANDOFF"
            : state === "degraded_manual"
              ? "DDP_279_DEGRADED_MANUAL_RECOVERY"
              : state === "recovery_only"
                ? "DDP_279_PUBLICATION_AND_TRUST_FREEZE"
                : row.primaryDependencyDegradationProfileRef;
    const document = await repositories.getDependencyDegradationProfile(profileRef);
    invariant(
      document !== null,
      "DEPENDENCY_DEGRADATION_PROFILE_NOT_FOUND",
      `DependencyDegradationProfile ${profileRef} was not found.`,
    );
    return document.toSnapshot();
  }

  async function compileBinding(
    row: ProviderCapabilityMatrixRowSnapshot,
    profile: AdapterContractProfileSnapshot,
  ): Promise<{
    binding: BookingProviderAdapterBindingSnapshot;
    supersededBindingRefs: readonly string[];
  }> {
    const binding = buildProviderAdapterBinding(row, profile);
    const selectionKey = buildBindingSelectionKey(row);
    const currentBindingRef = await repositories.getCurrentBindingRef(selectionKey);
    const supersededBindingRefs: string[] = [];
    if (currentBindingRef) {
      const currentBinding = await repositories.getProviderAdapterBinding(currentBindingRef);
      if (currentBinding) {
        const snapshot = currentBinding.toSnapshot();
        if (snapshot.bindingHash === binding.bindingHash) {
          return { binding: snapshot, supersededBindingRefs };
        }
        await repositories.saveProviderAdapterBinding({
          ...snapshot,
          bindingState: "superseded",
        });
        await repositories.saveBindingMeta(snapshot.bookingProviderAdapterBindingId, {
          current: false,
          supersededByRef: binding.bookingProviderAdapterBindingId,
        });
        supersededBindingRefs.push(snapshot.bookingProviderAdapterBindingId);
      }
    }
    await repositories.saveProviderAdapterBinding(binding);
    await repositories.setCurrentBindingRef(selectionKey, binding.bookingProviderAdapterBindingId);
    await repositories.saveBindingMeta(binding.bookingProviderAdapterBindingId, {
      current: true,
      supersededByRef: null,
    });
    return { binding, supersededBindingRefs };
  }

  async function resolveCurrentCapability(
    resolutionInput: BookingCapabilityResolutionInput,
  ): Promise<BookingCapabilityResolutionResult> {
    const row = await requireActiveRow(resolutionInput);
    const adapterProfile = await requireAdapterProfile(row);
    const confirmationPolicy = await requireConfirmationPolicy(row);
    const { binding, supersededBindingRefs } = await compileBinding(row, adapterProfile);

    const prerequisiteState: BookingCapabilityPrerequisiteStateSnapshot = {
      gpLinkageStatus: resolutionInput.gpLinkageStatus,
      localConsumerStatus: resolutionInput.localConsumerStatus,
      supplierDegradationStatus: resolutionInput.supplierDegradationStatus,
      publicationState: resolutionInput.publicationState,
      assuranceTrustState: resolutionInput.assuranceTrustState,
    };

    const routeTuple: BookingCapabilityRouteTupleSnapshot = {
      routeIntentBindingRef: requireRef(
        resolutionInput.routeIntentBindingRef,
        "routeIntentBindingRef",
      ),
      surfaceRouteContractRef: requireRef(
        resolutionInput.surfaceRouteContractRef,
        "surfaceRouteContractRef",
      ),
      surfacePublicationRef: requireRef(
        resolutionInput.surfacePublicationRef,
        "surfacePublicationRef",
      ),
      runtimePublicationBundleRef: requireRef(
        resolutionInput.runtimePublicationBundleRef,
        "runtimePublicationBundleRef",
      ),
      routeTupleHash: routeTupleHash(resolutionInput),
    };

    const baseCapabilityState = determineCapabilityState({
      row,
      audience: resolutionInput.selectionAudience,
      requestedActionScope: resolutionInput.requestedActionScope,
      prerequisiteState,
    });
    const baseDegradationProfile = await resolveDegradationProfileForState(
      baseCapabilityState,
      row,
    );

    const candidateTupleHash = capabilityTupleHash({
      bookingCaseId: optionalRef(resolutionInput.bookingCaseId) ?? null,
      appointmentId: optionalRef(resolutionInput.appointmentId) ?? null,
      tenantId: requireRef(resolutionInput.tenantId, "tenantId"),
      practiceRef: requireRef(resolutionInput.practiceRef, "practiceRef"),
      organisationRef: requireRef(resolutionInput.organisationRef, "organisationRef"),
      supplierRef: requireRef(resolutionInput.supplierRef, "supplierRef"),
      integrationMode: resolutionInput.integrationMode,
      deploymentType: requireRef(resolutionInput.deploymentType, "deploymentType"),
      selectionAudience: resolutionInput.selectionAudience,
      requestedActionScope: resolutionInput.requestedActionScope,
      providerCapabilityMatrixRef: row.providerCapabilityMatrixRef,
      capabilityMatrixVersionRef: row.matrixVersionRef,
      providerAdapterBindingRef: binding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: binding.bindingHash,
      adapterContractProfileRef: adapterProfile.adapterContractProfileId,
      dependencyDegradationProfileRef:
        baseDegradationProfile.dependencyDegradationProfileId,
      authoritativeReadAndConfirmationPolicyRef:
        confirmationPolicy.authoritativeReadAndConfirmationPolicyId,
      gpLinkageCheckpointRef: optionalRef(resolutionInput.gpLinkageCheckpointRef),
      gpLinkageStatus: prerequisiteState.gpLinkageStatus,
      localConsumerCheckpointRef: optionalRef(resolutionInput.localConsumerCheckpointRef),
      localConsumerStatus: prerequisiteState.localConsumerStatus,
      supplierDegradationStatus: prerequisiteState.supplierDegradationStatus,
      publicationState: prerequisiteState.publicationState,
      assuranceTrustState: prerequisiteState.assuranceTrustState,
      routeTuple,
      governingObjectDescriptorRef: requireRef(
        resolutionInput.governingObjectDescriptorRef,
        "governingObjectDescriptorRef",
      ),
      governingObjectRef: requireRef(
        resolutionInput.governingObjectRef,
        "governingObjectRef",
      ),
      governingObjectVersionRef: requireRef(
        resolutionInput.governingObjectVersionRef,
        "governingObjectVersionRef",
      ),
      parentAnchorRef: requireRef(resolutionInput.parentAnchorRef, "parentAnchorRef"),
    });

    const capabilityState = applyPresentedTupleDrift(baseCapabilityState, {
      prerequisiteState,
      presentedCapabilityTupleHash: optionalRef(
        resolutionInput.presentedCapabilityTupleHash,
      ),
      candidateCapabilityTupleHash: candidateTupleHash,
    });
    const degradationProfile = await resolveDegradationProfileForState(capabilityState, row);
    const tupleHash = capabilityTupleHash({
      bookingCaseId: optionalRef(resolutionInput.bookingCaseId) ?? null,
      appointmentId: optionalRef(resolutionInput.appointmentId) ?? null,
      tenantId: requireRef(resolutionInput.tenantId, "tenantId"),
      practiceRef: requireRef(resolutionInput.practiceRef, "practiceRef"),
      organisationRef: requireRef(resolutionInput.organisationRef, "organisationRef"),
      supplierRef: requireRef(resolutionInput.supplierRef, "supplierRef"),
      integrationMode: resolutionInput.integrationMode,
      deploymentType: requireRef(resolutionInput.deploymentType, "deploymentType"),
      selectionAudience: resolutionInput.selectionAudience,
      requestedActionScope: resolutionInput.requestedActionScope,
      providerCapabilityMatrixRef: row.providerCapabilityMatrixRef,
      capabilityMatrixVersionRef: row.matrixVersionRef,
      providerAdapterBindingRef: binding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: binding.bindingHash,
      adapterContractProfileRef: adapterProfile.adapterContractProfileId,
      dependencyDegradationProfileRef: degradationProfile.dependencyDegradationProfileId,
      authoritativeReadAndConfirmationPolicyRef:
        confirmationPolicy.authoritativeReadAndConfirmationPolicyId,
      gpLinkageCheckpointRef: optionalRef(resolutionInput.gpLinkageCheckpointRef),
      gpLinkageStatus: prerequisiteState.gpLinkageStatus,
      localConsumerCheckpointRef: optionalRef(resolutionInput.localConsumerCheckpointRef),
      localConsumerStatus: prerequisiteState.localConsumerStatus,
      supplierDegradationStatus: prerequisiteState.supplierDegradationStatus,
      publicationState: prerequisiteState.publicationState,
      assuranceTrustState: prerequisiteState.assuranceTrustState,
      routeTuple,
      governingObjectDescriptorRef: requireRef(
        resolutionInput.governingObjectDescriptorRef,
        "governingObjectDescriptorRef",
      ),
      governingObjectRef: requireRef(
        resolutionInput.governingObjectRef,
        "governingObjectRef",
      ),
      governingObjectVersionRef: requireRef(
        resolutionInput.governingObjectVersionRef,
        "governingObjectVersionRef",
      ),
      parentAnchorRef: requireRef(resolutionInput.parentAnchorRef, "parentAnchorRef"),
    });

    const blockedActionReasonCodes = currentBlockedReasonCodes({
      row,
      state: capabilityState,
      requestedActionScope: resolutionInput.requestedActionScope,
      prerequisiteState,
      degradationProfile,
      presentedCapabilityTupleHash: optionalRef(resolutionInput.presentedCapabilityTupleHash),
      currentCapabilityTupleHash: tupleHash,
    });
    const fallbackActionRefs = currentFallbackActions({
      row,
      state: capabilityState,
      degradationProfile,
    });
    const allowedActionScopes = currentAllowedActionScopes(
      row,
      capabilityState,
      resolutionInput.selectionAudience,
    );
    const evidenceRefs = uniqueSorted(
      [
        `matrix:${row.providerCapabilityMatrixRef}`,
        `matrix_version:${row.matrixVersionRef}`,
        `binding:${binding.bookingProviderAdapterBindingId}`,
        `binding_hash:${binding.bindingHash}`,
        `adapter_profile:${adapterProfile.adapterContractProfileId}`,
        `degradation_profile:${degradationProfile.dependencyDegradationProfileId}`,
        `confirmation_policy:${confirmationPolicy.authoritativeReadAndConfirmationPolicyId}`,
        `route_tuple:${routeTuple.routeTupleHash}`,
        optionalRef(resolutionInput.gpLinkageCheckpointRef)
          ? `gp_linkage:${resolutionInput.gpLinkageCheckpointRef}`
          : undefined,
        optionalRef(resolutionInput.localConsumerCheckpointRef)
          ? `local_consumer:${resolutionInput.localConsumerCheckpointRef}`
          : undefined,
      ].filter(Boolean) as string[],
    );

    const resolution: BookingCapabilityResolutionSnapshot = {
      bookingCapabilityResolutionId: normalizeRecordId(
        "booking_capability_resolution",
        tupleHash,
      ),
      schemaVersion: BOOKING_CAPABILITY_SCHEMA_VERSION,
      bookingCaseId: optionalRef(resolutionInput.bookingCaseId) ?? null,
      appointmentId: optionalRef(resolutionInput.appointmentId) ?? null,
      tenantId: requireRef(resolutionInput.tenantId, "tenantId"),
      practiceRef: requireRef(resolutionInput.practiceRef, "practiceRef"),
      organisationRef: requireRef(resolutionInput.organisationRef, "organisationRef"),
      supplierRef: requireRef(resolutionInput.supplierRef, "supplierRef"),
      integrationMode: resolutionInput.integrationMode,
      deploymentType: requireRef(resolutionInput.deploymentType, "deploymentType"),
      selectionAudience: resolutionInput.selectionAudience,
      requestedActionScope: resolutionInput.requestedActionScope,
      providerCapabilityMatrixRef: row.providerCapabilityMatrixRef,
      capabilityMatrixVersionRef: row.matrixVersionRef,
      providerAdapterBindingRef: binding.bookingProviderAdapterBindingId,
      providerAdapterBindingHash: binding.bindingHash,
      adapterContractProfileRef: adapterProfile.adapterContractProfileId,
      dependencyDegradationProfileRef: degradationProfile.dependencyDegradationProfileId,
      authoritativeReadAndConfirmationPolicyRef:
        confirmationPolicy.authoritativeReadAndConfirmationPolicyId,
      gpLinkageCheckpointRef: optionalRef(resolutionInput.gpLinkageCheckpointRef),
      localConsumerCheckpointRef: optionalRef(resolutionInput.localConsumerCheckpointRef),
      prerequisiteState,
      routeTuple,
      governingObjectDescriptorRef: requireRef(
        resolutionInput.governingObjectDescriptorRef,
        "governingObjectDescriptorRef",
      ),
      governingObjectRef: requireRef(
        resolutionInput.governingObjectRef,
        "governingObjectRef",
      ),
      governingObjectVersionRef: requireRef(
        resolutionInput.governingObjectVersionRef,
        "governingObjectVersionRef",
      ),
      parentAnchorRef: requireRef(resolutionInput.parentAnchorRef, "parentAnchorRef"),
      capabilityTupleHash: tupleHash,
      capabilityState,
      allowedActionScopes,
      blockedActionReasonCodes,
      fallbackActionRefs,
      evidenceRefs,
      evaluatedAt: ensureIsoTimestamp(resolutionInput.evaluatedAt, "evaluatedAt"),
      expiresAt: addSeconds(
        ensureIsoTimestamp(resolutionInput.evaluatedAt, "evaluatedAt"),
        ensurePositiveInteger(resolutionInput.expiresInSeconds ?? 900, "expiresInSeconds"),
      ),
    };
    const projection = buildProjection(resolution);

    const scopeKey = buildResolutionScopeKey({
      bookingCaseId: resolution.bookingCaseId,
      appointmentId: resolution.appointmentId,
      governingObjectDescriptorRef: resolution.governingObjectDescriptorRef,
      governingObjectRef: resolution.governingObjectRef,
      selectionAudience: resolution.selectionAudience,
      requestedActionScope: resolution.requestedActionScope,
    });
    const currentResolutionRef = await repositories.getCurrentResolutionRef(scopeKey);
    const currentProjectionRef = await repositories.getCurrentProjectionRef(scopeKey);

    if (currentResolutionRef) {
      const currentResolution = await repositories.getBookingCapabilityResolution(currentResolutionRef);
      const currentProjection = currentProjectionRef
        ? await repositories.getBookingCapabilityProjection(currentProjectionRef)
        : null;
      if (
        currentResolution &&
        currentResolution.toSnapshot().capabilityTupleHash === resolution.capabilityTupleHash &&
        currentProjection
      ) {
        return {
          providerCapabilityMatrix: phase4ProviderCapabilityMatrix,
          providerCapabilityMatrixRow: row,
          adapterContractProfile: adapterProfile,
          dependencyDegradationProfile: degradationProfile,
          authoritativeReadAndConfirmationPolicy: confirmationPolicy,
          providerAdapterBinding: binding,
          resolution: currentResolution.toSnapshot(),
          projection: currentProjection.toSnapshot(),
          emittedEvents: [],
          supersededBindingRefs,
          supersededResolutionRefs: [],
        };
      }
    }

    const supersededResolutionRefs: string[] = [];
    if (currentResolutionRef) {
      const currentResolution = await repositories.getBookingCapabilityResolution(currentResolutionRef);
      if (currentResolution) {
        await repositories.saveResolutionMeta(currentResolutionRef, {
          current: false,
          supersededByRef: resolution.bookingCapabilityResolutionId,
        });
        supersededResolutionRefs.push(currentResolutionRef);
      }
    }
    if (currentProjectionRef) {
      await repositories.saveProjectionMeta(currentProjectionRef, {
        current: false,
        supersededByRef: projection.bookingCapabilityProjectionId,
      });
    }

    await repositories.saveBookingCapabilityResolution(resolution);
    await repositories.saveBookingCapabilityProjection(projection);
    await repositories.setCurrentResolutionRef(scopeKey, resolution.bookingCapabilityResolutionId);
    await repositories.setCurrentProjectionRef(scopeKey, projection.bookingCapabilityProjectionId);
    await repositories.saveResolutionMeta(resolution.bookingCapabilityResolutionId, {
      current: true,
      supersededByRef: null,
    });
    await repositories.saveProjectionMeta(projection.bookingCapabilityProjectionId, {
      current: true,
      supersededByRef: null,
    });

    return {
      providerCapabilityMatrix: phase4ProviderCapabilityMatrix,
      providerCapabilityMatrixRow: row,
      adapterContractProfile: adapterProfile,
      dependencyDegradationProfile: degradationProfile,
      authoritativeReadAndConfirmationPolicy: confirmationPolicy,
      providerAdapterBinding: binding,
      resolution,
      projection,
      emittedEvents: [buildCapabilityResolvedEvent(resolution, resolutionInput)],
      supersededBindingRefs,
      supersededResolutionRefs,
    };
  }

  async function queryCapabilityDiagnostics(
    input: QueryBookingCapabilityDiagnosticsInput,
  ): Promise<BookingCapabilityDiagnosticsBundle | null> {
    let resolutionRef = optionalRef(input.resolutionId);
    if (!resolutionRef) {
      invariant(
        input.selectionAudience !== undefined &&
          input.requestedActionScope !== undefined &&
          typeof input.governingObjectDescriptorRef === "string" &&
          typeof input.governingObjectRef === "string",
        "CAPABILITY_DIAGNOSTIC_SCOPE_INCOMPLETE",
        "resolutionId or a complete current scope is required.",
      );
      resolutionRef = await repositories.getCurrentResolutionRef(
        buildResolutionScopeKey({
          bookingCaseId: optionalRef(input.bookingCaseId) ?? null,
          appointmentId: optionalRef(input.appointmentId) ?? null,
          governingObjectDescriptorRef: input.governingObjectDescriptorRef!,
          governingObjectRef: input.governingObjectRef!,
          selectionAudience: input.selectionAudience!,
          requestedActionScope: input.requestedActionScope!,
        }),
      );
    }
    if (!resolutionRef) {
      return null;
    }
    const resolutionDocument = await repositories.getBookingCapabilityResolution(resolutionRef);
    if (!resolutionDocument) {
      return null;
    }
    const resolution = resolutionDocument.toSnapshot();
    const projectionScopeKey = buildResolutionScopeKey({
      bookingCaseId: resolution.bookingCaseId,
      appointmentId: resolution.appointmentId,
      governingObjectDescriptorRef: resolution.governingObjectDescriptorRef,
      governingObjectRef: resolution.governingObjectRef,
      selectionAudience: resolution.selectionAudience,
      requestedActionScope: resolution.requestedActionScope,
    });
    const projectionRef = await repositories.getCurrentProjectionRef(projectionScopeKey);
    const projectionDocument = projectionRef
      ? await repositories.getBookingCapabilityProjection(projectionRef)
      : null;
    invariant(projectionDocument !== null, "CAPABILITY_PROJECTION_NOT_FOUND", "Current projection was not found for the resolution scope.");
    const bindingDocument = await repositories.getProviderAdapterBinding(
      resolution.providerAdapterBindingRef,
    );
    invariant(bindingDocument !== null, "CAPABILITY_BINDING_NOT_FOUND", "Binding was not found for the resolution.");
    const matrixRowDocument = await repositories.getProviderCapabilityMatrixRow(
      resolution.providerCapabilityMatrixRef,
    );
    invariant(matrixRowDocument !== null, "CAPABILITY_MATRIX_ROW_NOT_FOUND", "Matrix row was not found for the resolution.");
    const adapterProfileDocument = await repositories.getAdapterContractProfile(
      resolution.adapterContractProfileRef,
    );
    invariant(adapterProfileDocument !== null, "ADAPTER_CONTRACT_PROFILE_NOT_FOUND", "AdapterContractProfile was not found for the resolution.");
    const degradationProfileDocument = await repositories.getDependencyDegradationProfile(
      resolution.dependencyDegradationProfileRef,
    );
    invariant(degradationProfileDocument !== null, "DEGRADATION_PROFILE_NOT_FOUND", "DependencyDegradationProfile was not found for the resolution.");
    const policyDocument = await repositories.getAuthoritativeReadAndConfirmationPolicy(
      resolution.authoritativeReadAndConfirmationPolicyRef,
    );
    invariant(policyDocument !== null, "CONFIRMATION_POLICY_NOT_FOUND", "AuthoritativeReadAndConfirmationPolicy was not found for the resolution.");
    const resolutionMeta = await repositories.getResolutionMeta(resolution.bookingCapabilityResolutionId);
    return {
      providerCapabilityMatrix: phase4ProviderCapabilityMatrix,
      providerCapabilityMatrixRow: matrixRowDocument.toSnapshot(),
      adapterContractProfile: adapterProfileDocument.toSnapshot(),
      dependencyDegradationProfile: degradationProfileDocument.toSnapshot(),
      authoritativeReadAndConfirmationPolicy: policyDocument.toSnapshot(),
      providerAdapterBinding: bindingDocument.toSnapshot(),
      resolution,
      projection: projectionDocument.toSnapshot(),
      supersededBindingRefs: [],
      supersededResolutionRefs: [],
      isCurrentScope: resolutionMeta?.current ?? false,
    };
  }

  return {
    repositories,
    async resolveBookingCapability(input) {
      invariant(
        optionalRef(input.bookingCaseId) !== null,
        "BOOKING_CASE_ID_REQUIRED",
        "bookingCaseId is required for booking-case capability resolution.",
      );
      return resolveCurrentCapability({
        ...input,
        appointmentId: null,
      });
    },
    async resolveAppointmentManageCapability(input) {
      invariant(
        optionalRef(input.appointmentId) !== null,
        "APPOINTMENT_ID_REQUIRED",
        "appointmentId is required for appointment-manage capability resolution.",
      );
      return resolveCurrentCapability({
        ...input,
        bookingCaseId: null,
      });
    },
    queryCapabilityDiagnostics,
  };
}
