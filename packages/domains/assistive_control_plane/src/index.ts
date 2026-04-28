import { createHash } from "node:crypto";

export type ISODateString = string;

export type AssistiveControlActorRole =
  | "capability_control_plane"
  | "assistive_ops"
  | "clinical_safety_lead"
  | "release_manager"
  | "clinical_reviewer"
  | "system";

export type AssistiveCapabilityFamily =
  | "transcription"
  | "documentation_draft"
  | "structured_fact_extraction"
  | "question_set_suggestion"
  | "endpoint_suggestion"
  | "message_draft"
  | "pharmacy_or_booking_handoff_draft";

export type MedicalPurposeState =
  | "not_medical_device"
  | "transcription_documentation_assistance"
  | "higher_function_summarisation_structured_inference"
  | "endpoint_suggestion_clinically_consequential_decision_support"
  | "regulatory_posture_change";

export type ManifestState = "active" | "shadow_only" | "blocked" | "retired";
export type PolicyState = "active" | "blocked" | "superseded" | "retired";
export type ReleaseMode = "shadow_only" | "visible_summary" | "visible_insert" | "visible_commit" | "observe_only" | "blocked" | "withdrawn";
export type VisibilityCeiling = "shadow_only" | "visible_summary" | "visible_insert" | "visible_commit";
export type RolloutRung = "shadow_only" | "visible_summary" | "visible_insert" | "visible_commit" | "frozen" | "withdrawn";
export type RenderPosture = "shadow_only" | "visible" | "observe_only" | "blocked";
export type GrantState = "live" | "shadow_only" | "observe_only" | "blocked" | "expired" | "revoked";
export type KillState = "inactive" | "shadow_only" | "blocked" | "withdrawn";
export type FallbackMode = "shadow_only" | "observe_only" | "blocked" | "recovery_only";
export type SchemaValidationState = "valid" | "invalid" | "missing" | "not_applicable";
export type PolicyValidationState = "valid" | "blocked" | "stale" | "missing";
export type AssistiveRunSettlementState = "renderable" | "shadow_only" | "observe_only" | "abstained" | "quarantined" | "blocked_by_policy";
export type PublicationState = "published" | "stale" | "withdrawn" | "blocked";
export type RuntimePublicationState = "current" | "stale" | "withdrawn" | "blocked";

export interface AssistiveControlActorContext {
  actorRef: string;
  actorRole: AssistiveControlActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface AssistiveControlAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: AssistiveControlActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface IntendedUseProfile {
  profileId: string;
  clinicalPurpose: string;
  nonClinicalPurpose: string;
  medicalPurposeState: MedicalPurposeState;
  permittedUserRoles: readonly string[];
  permittedSubjectScopes: readonly string[];
  forbiddenActions: readonly string[];
  forbiddenDownstreamConsumers: readonly string[];
  evidenceRequirement: {
    acceptedEvidenceClassRefs: readonly string[];
    minimumEvidenceClassCount: number;
  };
  humanReviewRequirement: "none" | "single_review" | "dual_review" | "clinical_safety_review";
  profileState: PolicyState;
  createdAt: ISODateString;
}

export interface AssistiveCompositionPolicy {
  compositionPolicyId: string;
  capabilityCode: string;
  allowedUpstreamCapabilityCodes: readonly string[];
  allowedDerivedArtifactTypes: readonly string[];
  blockedDownstreamObjectTypes: readonly string[];
  maxChainDepth: number;
  loopDetectionMode: "block" | "quarantine";
  policyState: PolicyState;
  createdAt: ISODateString;
}

export interface AssistiveCapabilityManifest {
  manifestId: string;
  capabilityCode: string;
  capabilityFamily: AssistiveCapabilityFamily;
  intendedUseProfileRef: string;
  allowedContexts: readonly string[];
  allowedInputs: readonly string[];
  allowedOutputs: readonly string[];
  compositionPolicyRef: string;
  visibilityPolicyRef: string;
  surfaceBindingPolicyRef: string;
  routeContractPolicyRef: string;
  publicationPolicyRef: string;
  rolloutLadderPolicyRef: string;
  recoveryDispositionPolicyRef: string;
  telemetryDisclosurePolicyRef: string;
  requiredTrustSliceRefs: readonly string[];
  shadowModeDefault: boolean;
  visibleModeDefault: boolean;
  approvalRequirement: "none" | "single_review" | "dual_review" | "clinical_safety_review";
  medicalDeviceAssessmentRef: string;
  releaseCohortRef: string;
  killSwitchPolicyRef: string;
  manifestState: ManifestState;
  createdAt: ISODateString;
}

export interface AssistiveReleaseState {
  releaseStateId: string;
  capabilityCode: string;
  tenantId: string;
  cohortId: string;
  mode: ReleaseMode;
  effectiveFrom: ISODateString;
  effectiveTo?: ISODateString;
  compiledPolicyBundleRef: string;
  rolloutVerdictRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  releaseStateVersionRef: string;
  state: "current" | "stale" | "superseded" | "blocked";
  createdAt: ISODateString;
}

export interface AssistiveKillSwitchState {
  killSwitchStateId: string;
  capabilityCode: string;
  tenantId: string;
  environmentRing: string;
  killState: KillState;
  reasonCode: string;
  activatedBy: string;
  activatedAt: ISODateString;
  fallbackMode: FallbackMode;
  stateVersionRef: string;
}

export interface AssistiveInvocationGrant {
  assistiveInvocationGrantId: string;
  capabilityCode: string;
  routeFamily: string;
  subjectScope: string;
  actorRef: string;
  actingContextRef: string;
  evidenceClassRefs: readonly string[];
  visibilityCeiling: VisibilityCeiling;
  compiledPolicyBundleRef: string;
  reviewVersionRef: string;
  lineageFenceEpoch: string;
  entityContinuityKey: string;
  surfaceBindingRef: string;
  rolloutVerdictRef: string;
  rolloutRung: RolloutRung;
  renderPosture: RenderPosture;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  telemetryDisclosureFenceRef: string;
  ticketOrTaskRef: string;
  grantFenceToken: string;
  issuedAt: ISODateString;
  expiresAt: ISODateString;
  grantState: GrantState;
}

export interface AssistiveRunSettlement {
  assistiveRunSettlementId: string;
  assistiveRunRef: string;
  assistiveInvocationGrantRef: string;
  settlementState: AssistiveRunSettlementState;
  quarantineReasonCode?: string;
  renderableArtifactRefs: readonly string[];
  blockedArtifactRefs: readonly string[];
  schemaValidationState: SchemaValidationState;
  policyBundleRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  transitionEnvelopeRef: string;
  uiTransitionSettlementRecordRef: string;
  assistiveCapabilityTrustEnvelopeRef?: string;
  releaseRecoveryDispositionRef: string;
  settledAt: ISODateString;
}

export interface UpstreamAssistiveArtifactRef {
  capabilityCode: string;
  artifactType: string;
  chainDepth: number;
}

export interface AssistiveControlStore {
  intendedUseProfiles: Map<string, IntendedUseProfile>;
  capabilityManifests: Map<string, AssistiveCapabilityManifest>;
  compositionPolicies: Map<string, AssistiveCompositionPolicy>;
  releaseStates: Map<string, AssistiveReleaseState>;
  killSwitchStates: Map<string, AssistiveKillSwitchState>;
  invocationGrants: Map<string, AssistiveInvocationGrant>;
  runSettlements: Map<string, AssistiveRunSettlement>;
  auditRecords: AssistiveControlAuditRecord[];
  idempotencyKeys: Map<string, string>;
}

export interface AssistiveControlClock {
  now(): ISODateString;
}

export interface AssistiveControlIdGenerator {
  next(prefix: string): string;
}

export interface AssistiveControlRuntime {
  store: AssistiveControlStore;
  clock: AssistiveControlClock;
  idGenerator: AssistiveControlIdGenerator;
}

export interface RegisterIntendedUseProfileCommand {
  profileId: string;
  clinicalPurpose: string;
  nonClinicalPurpose: string;
  medicalPurposeState: MedicalPurposeState;
  permittedUserRoles: readonly string[];
  permittedSubjectScopes: readonly string[];
  forbiddenActions: readonly string[];
  forbiddenDownstreamConsumers: readonly string[];
  evidenceRequirement: {
    acceptedEvidenceClassRefs: readonly string[];
    minimumEvidenceClassCount: number;
  };
  humanReviewRequirement: IntendedUseProfile["humanReviewRequirement"];
  profileState?: PolicyState;
  idempotencyKey?: string;
}

export interface RegisterCompositionPolicyCommand {
  compositionPolicyId: string;
  capabilityCode: string;
  allowedUpstreamCapabilityCodes: readonly string[];
  allowedDerivedArtifactTypes: readonly string[];
  blockedDownstreamObjectTypes: readonly string[];
  maxChainDepth: number;
  loopDetectionMode: AssistiveCompositionPolicy["loopDetectionMode"];
  policyState?: PolicyState;
  idempotencyKey?: string;
}

export interface RegisterCapabilityManifestCommand {
  manifestId: string;
  capabilityCode: string;
  capabilityFamily: AssistiveCapabilityFamily;
  intendedUseProfileRef: string;
  allowedContexts: readonly string[];
  allowedInputs: readonly string[];
  allowedOutputs: readonly string[];
  compositionPolicyRef: string;
  visibilityPolicyRef: string;
  surfaceBindingPolicyRef: string;
  routeContractPolicyRef: string;
  publicationPolicyRef: string;
  rolloutLadderPolicyRef: string;
  recoveryDispositionPolicyRef: string;
  telemetryDisclosurePolicyRef: string;
  requiredTrustSliceRefs: readonly string[];
  shadowModeDefault: boolean;
  visibleModeDefault: boolean;
  approvalRequirement: AssistiveCapabilityManifest["approvalRequirement"];
  medicalDeviceAssessmentRef: string;
  releaseCohortRef: string;
  killSwitchPolicyRef: string;
  manifestState?: ManifestState;
  idempotencyKey?: string;
}

export interface PublishReleaseStateCommand {
  releaseStateId: string;
  capabilityCode: string;
  tenantId: string;
  cohortId: string;
  mode: ReleaseMode;
  effectiveFrom: ISODateString;
  effectiveTo?: ISODateString;
  compiledPolicyBundleRef: string;
  rolloutVerdictRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  releaseStateVersionRef: string;
  state?: AssistiveReleaseState["state"];
  idempotencyKey?: string;
}

export interface SetKillSwitchStateCommand {
  killSwitchStateId: string;
  capabilityCode: string;
  tenantId: string;
  environmentRing: string;
  killState: KillState;
  reasonCode: string;
  fallbackMode: FallbackMode;
  stateVersionRef: string;
  idempotencyKey?: string;
}

export interface EvaluateInvocationEligibilityCommand {
  capabilityCode: string;
  routeFamily: string;
  subjectScope: string;
  actorRef: string;
  actorRole: string;
  actingContextRef: string;
  tenantId: string;
  cohortId: string;
  environmentRing: string;
  evidenceClassRefs: readonly string[];
  visibilityCeiling: VisibilityCeiling;
  requestedActionScope?: string;
  reviewVersionRef: string;
  lineageFenceEpoch: string;
  entityContinuityKey: string;
  surfaceBindingRef?: string;
  surfacePolicyRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  telemetryDisclosureFenceRef: string;
  ticketOrTaskRef: string;
  publicationState: PublicationState;
  runtimePublicationState: RuntimePublicationState;
  compiledPolicyBundleRef?: string;
  upstreamArtifacts?: readonly UpstreamAssistiveArtifactRef[];
  downstreamConsumerObjectTypes?: readonly string[];
  grantTtlSeconds?: number;
}

export interface InvocationEligibilityDecision {
  decisionId: string;
  eligible: boolean;
  capabilityCode: string;
  routeFamily: string;
  subjectScope: string;
  actorRef: string;
  actorRole: string;
  actingContextRef: string;
  tenantId: string;
  cohortId: string;
  environmentRing: string;
  evidenceClassRefs: readonly string[];
  visibilityCeiling: VisibilityCeiling;
  rolloutRung: RolloutRung;
  renderPosture: RenderPosture;
  releaseStateRef?: string;
  killSwitchStateRef?: string;
  compiledPolicyBundleRef?: string;
  rolloutVerdictRef?: string;
  surfaceBindingRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releaseRecoveryDispositionRef: string;
  telemetryDisclosureFenceRef: string;
  ticketOrTaskRef: string;
  reviewVersionRef: string;
  lineageFenceEpoch: string;
  entityContinuityKey: string;
  grantExpiresAt: ISODateString;
  reasonCodes: readonly string[];
}

export interface SettleAssistiveRunCommand {
  assistiveRunRef: string;
  assistiveInvocationGrantRef: string;
  producedArtifactRefs: readonly string[];
  blockedArtifactRefs?: readonly string[];
  requestedSettlementState?: AssistiveRunSettlementState;
  schemaValidationState: SchemaValidationState;
  policyValidationState: PolicyValidationState;
  transitionEnvelopeRef: string;
  uiTransitionSettlementRecordRef: string;
  assistiveCapabilityTrustEnvelopeRef?: string;
  idempotencyKey?: string;
}

export class AssistiveControlPlaneError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly reasonCodes: readonly string[] = [],
  ) {
    super(message);
    this.name = "AssistiveControlPlaneError";
  }
}

export const assistiveControlPlaneServiceNames = [
  "AssistiveCapabilityManifestService",
  "IntendedUseProfileService",
  "InvocationEligibilityService",
  "AssistiveInvocationGrantIssuer",
  "AssistiveCompositionPolicyEngine",
  "AssistiveReleaseStateResolver",
  "AssistiveKillSwitchService",
  "AssistiveRunSettlementService",
] as const;

export function createAssistiveControlPlaneStore(): AssistiveControlStore {
  return {
    intendedUseProfiles: new Map(),
    capabilityManifests: new Map(),
    compositionPolicies: new Map(),
    releaseStates: new Map(),
    killSwitchStates: new Map(),
    invocationGrants: new Map(),
    runSettlements: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
  };
}

export function createDeterministicAssistiveControlIdGenerator(): AssistiveControlIdGenerator {
  const counters = new Map<string, number>();
  return {
    next(prefix: string): string {
      const nextValue = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, nextValue);
      return `${prefix}_${String(nextValue).padStart(6, "0")}`;
    },
  };
}

export function stableAssistiveControlHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export class IntendedUseProfileService {
  public constructor(private readonly runtime: AssistiveControlRuntime) {}

  public registerProfile(command: RegisterIntendedUseProfileCommand, actor: AssistiveControlActorContext): IntendedUseProfile {
    requireRole(actor, ["capability_control_plane", "clinical_safety_lead", "release_manager", "system"], "ASSISTIVE_PROFILE_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "intended_use_profile", command.idempotencyKey, this.runtime.store.intendedUseProfiles);
    if (existing) {
      return existing;
    }
    requireFrozenReference(command.profileId);
    requireNonEmpty(command.clinicalPurpose, "clinicalPurpose");
    requireNonEmpty(command.nonClinicalPurpose, "nonClinicalPurpose");
    requireNonEmptyArray(command.permittedUserRoles, "permittedUserRoles");
    requireNonEmptyArray(command.permittedSubjectScopes, "permittedSubjectScopes");
    requireNonEmptyArray(command.evidenceRequirement.acceptedEvidenceClassRefs, "acceptedEvidenceClassRefs");
    validateFrozenReferences(command.permittedSubjectScopes, "permittedSubjectScopes");
    validateFrozenReferences(command.evidenceRequirement.acceptedEvidenceClassRefs, "acceptedEvidenceClassRefs");
    if (!Number.isInteger(command.evidenceRequirement.minimumEvidenceClassCount) || command.evidenceRequirement.minimumEvidenceClassCount < 1) {
      throw new AssistiveControlPlaneError("ASSISTIVE_EVIDENCE_REQUIREMENT_INVALID", "minimumEvidenceClassCount must be a positive integer.", [
        "minimum_evidence_class_count_invalid",
      ]);
    }
    const profile: IntendedUseProfile = Object.freeze({
      ...command,
      permittedUserRoles: Object.freeze([...command.permittedUserRoles]),
      permittedSubjectScopes: Object.freeze([...command.permittedSubjectScopes]),
      forbiddenActions: Object.freeze([...command.forbiddenActions]),
      forbiddenDownstreamConsumers: Object.freeze([...command.forbiddenDownstreamConsumers]),
      evidenceRequirement: Object.freeze({
        acceptedEvidenceClassRefs: Object.freeze([...command.evidenceRequirement.acceptedEvidenceClassRefs]),
        minimumEvidenceClassCount: command.evidenceRequirement.minimumEvidenceClassCount,
      }),
      profileState: command.profileState ?? "active",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.intendedUseProfiles.set(profile.profileId, profile);
    setIdempotent(this.runtime, "intended_use_profile", command.idempotencyKey, profile.profileId);
    writeAudit(this.runtime, "IntendedUseProfileService", "registerProfile", actor, profile.profileId, "accepted", []);
    return profile;
  }
}

export class AssistiveCompositionPolicyEngine {
  public constructor(private readonly runtime: AssistiveControlRuntime) {}

  public registerPolicy(command: RegisterCompositionPolicyCommand, actor: AssistiveControlActorContext): AssistiveCompositionPolicy {
    requireRole(actor, ["capability_control_plane", "clinical_safety_lead", "release_manager", "system"], "ASSISTIVE_COMPOSITION_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "composition_policy", command.idempotencyKey, this.runtime.store.compositionPolicies);
    if (existing) {
      return existing;
    }
    for (const ref of [command.compositionPolicyId, command.capabilityCode]) {
      requireFrozenReference(ref);
    }
    validateFrozenReferences(command.allowedUpstreamCapabilityCodes, "allowedUpstreamCapabilityCodes");
    validateFrozenReferences(command.allowedDerivedArtifactTypes, "allowedDerivedArtifactTypes");
    requireNonEmptyArray(command.blockedDownstreamObjectTypes, "blockedDownstreamObjectTypes");
    if (!Number.isInteger(command.maxChainDepth) || command.maxChainDepth < 0) {
      throw new AssistiveControlPlaneError("ASSISTIVE_COMPOSITION_CHAIN_DEPTH_INVALID", "maxChainDepth must be zero or greater.", [
        "max_chain_depth_invalid",
      ]);
    }
    const policy: AssistiveCompositionPolicy = Object.freeze({
      ...command,
      allowedUpstreamCapabilityCodes: Object.freeze([...command.allowedUpstreamCapabilityCodes]),
      allowedDerivedArtifactTypes: Object.freeze([...command.allowedDerivedArtifactTypes]),
      blockedDownstreamObjectTypes: Object.freeze([...command.blockedDownstreamObjectTypes]),
      policyState: command.policyState ?? "active",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.compositionPolicies.set(policy.compositionPolicyId, policy);
    setIdempotent(this.runtime, "composition_policy", command.idempotencyKey, policy.compositionPolicyId);
    writeAudit(this.runtime, "AssistiveCompositionPolicyEngine", "registerPolicy", actor, policy.compositionPolicyId, "accepted", []);
    return policy;
  }

  public evaluateComposition(options: {
    capabilityCode: string;
    compositionPolicyRef: string;
    upstreamArtifacts?: readonly UpstreamAssistiveArtifactRef[];
    downstreamConsumerObjectTypes?: readonly string[];
  }): { allowed: boolean; reasonCodes: readonly string[] } {
    const policy = requireFromMap(this.runtime.store.compositionPolicies, options.compositionPolicyRef, "ASSISTIVE_COMPOSITION_POLICY_NOT_FOUND");
    const reasons: string[] = [];
    if (policy.policyState !== "active") {
      reasons.push("composition_policy_not_active");
    }
    if (policy.capabilityCode !== options.capabilityCode) {
      reasons.push("composition_policy_capability_mismatch");
    }
    for (const artifact of options.upstreamArtifacts ?? []) {
      requireFrozenReference(artifact.capabilityCode);
      requireFrozenReference(artifact.artifactType);
      if (artifact.chainDepth > policy.maxChainDepth) {
        reasons.push("composition_chain_depth_exceeded");
      }
      if (artifact.capabilityCode === options.capabilityCode && policy.loopDetectionMode === "block") {
        reasons.push("composition_loop_detected");
      }
      if (!policy.allowedUpstreamCapabilityCodes.includes(artifact.capabilityCode)) {
        reasons.push("upstream_capability_not_allowed");
      }
      if (!policy.allowedDerivedArtifactTypes.includes(artifact.artifactType)) {
        reasons.push("derived_artifact_type_not_allowed");
      }
    }
    for (const downstream of options.downstreamConsumerObjectTypes ?? []) {
      if (policy.blockedDownstreamObjectTypes.includes(downstream)) {
        reasons.push("blocked_downstream_consumer");
      }
    }
    return { allowed: reasons.length === 0, reasonCodes: Object.freeze(unique(reasons)) };
  }
}

export class AssistiveCapabilityManifestService {
  public constructor(private readonly runtime: AssistiveControlRuntime) {}

  public registerManifest(command: RegisterCapabilityManifestCommand, actor: AssistiveControlActorContext): AssistiveCapabilityManifest {
    requireRole(actor, ["capability_control_plane", "clinical_safety_lead", "release_manager", "system"], "ASSISTIVE_MANIFEST_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "capability_manifest", command.idempotencyKey, this.runtime.store.capabilityManifests);
    if (existing) {
      return existing;
    }
    for (const ref of [
      command.manifestId,
      command.capabilityCode,
      command.intendedUseProfileRef,
      command.compositionPolicyRef,
      command.visibilityPolicyRef,
      command.surfaceBindingPolicyRef,
      command.routeContractPolicyRef,
      command.publicationPolicyRef,
      command.rolloutLadderPolicyRef,
      command.recoveryDispositionPolicyRef,
      command.telemetryDisclosurePolicyRef,
      command.medicalDeviceAssessmentRef,
      command.releaseCohortRef,
      command.killSwitchPolicyRef,
    ]) {
      requireFrozenReference(ref);
    }
    requireFromMap(this.runtime.store.intendedUseProfiles, command.intendedUseProfileRef, "ASSISTIVE_INTENDED_USE_PROFILE_NOT_FOUND");
    requireFromMap(this.runtime.store.compositionPolicies, command.compositionPolicyRef, "ASSISTIVE_COMPOSITION_POLICY_NOT_FOUND");
    for (const entries of [
      command.allowedContexts,
      command.allowedInputs,
      command.allowedOutputs,
      command.requiredTrustSliceRefs,
    ]) {
      requireNonEmptyArray(entries, "manifest array");
      validateFrozenReferences(entries, "manifest array");
    }
    const manifest: AssistiveCapabilityManifest = Object.freeze({
      ...command,
      allowedContexts: Object.freeze([...command.allowedContexts]),
      allowedInputs: Object.freeze([...command.allowedInputs]),
      allowedOutputs: Object.freeze([...command.allowedOutputs]),
      requiredTrustSliceRefs: Object.freeze([...command.requiredTrustSliceRefs]),
      manifestState: command.manifestState ?? "active",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.capabilityManifests.set(manifest.capabilityCode, manifest);
    setIdempotent(this.runtime, "capability_manifest", command.idempotencyKey, manifest.capabilityCode);
    writeAudit(this.runtime, "AssistiveCapabilityManifestService", "registerManifest", actor, manifest.capabilityCode, "accepted", []);
    return manifest;
  }

  public getManifest(capabilityCode: string): AssistiveCapabilityManifest {
    return requireFromMap(this.runtime.store.capabilityManifests, capabilityCode, "ASSISTIVE_CAPABILITY_MANIFEST_NOT_FOUND");
  }
}

export class AssistiveReleaseStateResolver {
  public constructor(private readonly runtime: AssistiveControlRuntime) {}

  public publishReleaseState(command: PublishReleaseStateCommand, actor: AssistiveControlActorContext): AssistiveReleaseState {
    requireRole(actor, ["capability_control_plane", "release_manager", "system"], "ASSISTIVE_RELEASE_STATE_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "release_state", command.idempotencyKey, this.runtime.store.releaseStates);
    if (existing) {
      return existing;
    }
    for (const ref of [
      command.releaseStateId,
      command.capabilityCode,
      command.tenantId,
      command.cohortId,
      command.compiledPolicyBundleRef,
      command.rolloutVerdictRef,
      command.runtimePublicationBundleRef,
      command.releaseRecoveryDispositionRef,
      command.releaseStateVersionRef,
    ]) {
      requireFrozenReference(ref);
    }
    if (command.effectiveTo && Date.parse(command.effectiveTo) <= Date.parse(command.effectiveFrom)) {
      throw new AssistiveControlPlaneError("ASSISTIVE_RELEASE_WINDOW_INVALID", "effectiveTo must be after effectiveFrom.", [
        "release_window_invalid",
      ]);
    }
    const state: AssistiveReleaseState = Object.freeze({
      ...command,
      state: command.state ?? "current",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.releaseStates.set(state.releaseStateId, state);
    setIdempotent(this.runtime, "release_state", command.idempotencyKey, state.releaseStateId);
    writeAudit(this.runtime, "AssistiveReleaseStateResolver", "publishReleaseState", actor, state.releaseStateId, "accepted", []);
    return state;
  }

  public resolveActiveReleaseState(options: {
    capabilityCode: string;
    tenantId: string;
    cohortId: string;
    compiledPolicyBundleRef?: string;
    now?: ISODateString;
  }): AssistiveReleaseState | undefined {
    const now = Date.parse(options.now ?? this.runtime.clock.now());
    return [...this.runtime.store.releaseStates.values()]
      .filter((state) => {
        const starts = Date.parse(state.effectiveFrom) <= now;
        const notEnded = !state.effectiveTo || Date.parse(state.effectiveTo) > now;
        return (
          state.capabilityCode === options.capabilityCode &&
          state.tenantId === options.tenantId &&
          state.cohortId === options.cohortId &&
          starts &&
          notEnded &&
          (!options.compiledPolicyBundleRef || state.compiledPolicyBundleRef === options.compiledPolicyBundleRef)
        );
      })
      .sort((left, right) => Date.parse(right.effectiveFrom) - Date.parse(left.effectiveFrom))[0];
  }
}

export class AssistiveKillSwitchService {
  public constructor(private readonly runtime: AssistiveControlRuntime) {}

  public setKillSwitchState(command: SetKillSwitchStateCommand, actor: AssistiveControlActorContext): AssistiveKillSwitchState {
    requireRole(actor, ["capability_control_plane", "assistive_ops", "clinical_safety_lead", "release_manager", "system"], "ASSISTIVE_KILL_SWITCH_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "kill_switch_state", command.idempotencyKey, this.runtime.store.killSwitchStates);
    if (existing) {
      return existing;
    }
    for (const ref of [
      command.killSwitchStateId,
      command.capabilityCode,
      command.tenantId,
      command.environmentRing,
      command.stateVersionRef,
    ]) {
      requireFrozenReference(ref);
    }
    requireNonEmpty(command.reasonCode, "reasonCode");
    const state: AssistiveKillSwitchState = Object.freeze({
      ...command,
      activatedBy: actor.actorRef,
      activatedAt: this.runtime.clock.now(),
    });
    this.runtime.store.killSwitchStates.set(state.killSwitchStateId, state);
    setIdempotent(this.runtime, "kill_switch_state", command.idempotencyKey, state.killSwitchStateId);
    writeAudit(
      this.runtime,
      "AssistiveKillSwitchService",
      "setKillSwitchState",
      actor,
      state.killSwitchStateId,
      state.killState === "inactive" ? "accepted" : "blocked",
      state.killState === "inactive" ? [] : [state.reasonCode],
    );
    return state;
  }

  public getCurrentKillSwitchState(options: {
    capabilityCode: string;
    tenantId: string;
    environmentRing: string;
  }): AssistiveKillSwitchState | undefined {
    return [...this.runtime.store.killSwitchStates.values()]
      .reverse()
      .filter(
        (state) =>
          state.capabilityCode === options.capabilityCode &&
          state.tenantId === options.tenantId &&
          state.environmentRing === options.environmentRing,
      )
      .sort((left, right) => Date.parse(right.activatedAt) - Date.parse(left.activatedAt))[0];
  }
}

export class InvocationEligibilityService {
  private readonly manifests: AssistiveCapabilityManifestService;
  private readonly releaseStates: AssistiveReleaseStateResolver;
  private readonly killSwitches: AssistiveKillSwitchService;
  private readonly composition: AssistiveCompositionPolicyEngine;

  public constructor(private readonly runtime: AssistiveControlRuntime) {
    this.manifests = new AssistiveCapabilityManifestService(runtime);
    this.releaseStates = new AssistiveReleaseStateResolver(runtime);
    this.killSwitches = new AssistiveKillSwitchService(runtime);
    this.composition = new AssistiveCompositionPolicyEngine(runtime);
  }

  public evaluateInvocationEligibility(command: EvaluateInvocationEligibilityCommand): InvocationEligibilityDecision {
    for (const ref of [
      command.capabilityCode,
      command.routeFamily,
      command.subjectScope,
      command.actorRef,
      command.actingContextRef,
      command.tenantId,
      command.cohortId,
      command.environmentRing,
      command.reviewVersionRef,
      command.lineageFenceEpoch,
      command.entityContinuityKey,
      command.surfaceRouteContractRef,
      command.surfacePublicationRef,
      command.runtimePublicationBundleRef,
      command.releaseRecoveryDispositionRef,
      command.telemetryDisclosureFenceRef,
      command.ticketOrTaskRef,
    ]) {
      requireFrozenReference(ref);
    }
    validateFrozenReferences(command.evidenceClassRefs, "evidenceClassRefs");
    const reasons: string[] = [];
    const manifest = this.runtime.store.capabilityManifests.get(command.capabilityCode);
    const profile = manifest ? this.runtime.store.intendedUseProfiles.get(manifest.intendedUseProfileRef) : undefined;
    const releaseState = this.releaseStates.resolveActiveReleaseState({
      capabilityCode: command.capabilityCode,
      tenantId: command.tenantId,
      cohortId: command.cohortId,
      compiledPolicyBundleRef: command.compiledPolicyBundleRef,
    });
    const killSwitchState = this.killSwitches.getCurrentKillSwitchState({
      capabilityCode: command.capabilityCode,
      tenantId: command.tenantId,
      environmentRing: command.environmentRing,
    });

    if (!manifest) {
      reasons.push("capability_manifest_missing");
    } else {
      if (manifest.manifestState !== "active" && manifest.manifestState !== "shadow_only") {
        reasons.push("capability_manifest_not_active");
      }
      if (!manifest.allowedContexts.includes(command.routeFamily)) {
        reasons.push("route_family_not_allowed");
      }
      if (command.evidenceClassRefs.some((evidenceClassRef) => !manifest.allowedInputs.includes(evidenceClassRef))) {
        reasons.push("evidence_class_not_allowed_by_manifest");
      }
      if (!command.surfaceBindingRef && !command.surfacePolicyRef) {
        reasons.push("surface_binding_or_policy_missing");
      }
    }

    if (!profile) {
      reasons.push("intended_use_profile_missing");
    } else {
      if (profile.profileState !== "active") {
        reasons.push("intended_use_profile_not_active");
      }
      if (!profile.permittedUserRoles.includes(command.actorRole)) {
        reasons.push("actor_role_not_permitted");
      }
      if (!profile.permittedSubjectScopes.includes(command.subjectScope)) {
        reasons.push("subject_scope_not_permitted");
      }
      if (command.requestedActionScope && profile.forbiddenActions.includes(command.requestedActionScope)) {
        reasons.push("forbidden_action_scope");
      }
      if (
        command.downstreamConsumerObjectTypes?.some((consumer) => profile.forbiddenDownstreamConsumers.includes(consumer)) ??
        false
      ) {
        reasons.push("forbidden_downstream_consumer");
      }
      const acceptedCount = command.evidenceClassRefs.filter((ref) => profile.evidenceRequirement.acceptedEvidenceClassRefs.includes(ref)).length;
      if (acceptedCount < profile.evidenceRequirement.minimumEvidenceClassCount) {
        reasons.push("evidence_requirement_not_met");
      }
    }

    if (!releaseState) {
      reasons.push("release_state_missing");
    } else {
      if (releaseState.state !== "current") {
        reasons.push("release_state_not_current");
      }
      if (["blocked", "withdrawn"].includes(releaseState.mode)) {
        reasons.push("release_state_blocks_invocation");
      }
      if (command.runtimePublicationBundleRef !== releaseState.runtimePublicationBundleRef) {
        reasons.push("runtime_publication_bundle_mismatch");
      }
      if (command.releaseRecoveryDispositionRef !== releaseState.releaseRecoveryDispositionRef) {
        reasons.push("release_recovery_disposition_mismatch");
      }
    }

    if (!killSwitchState) {
      reasons.push("kill_switch_state_missing");
    } else if (["blocked", "withdrawn"].includes(killSwitchState.killState)) {
      reasons.push("assistive_kill_switch_active");
    }

    if (command.publicationState !== "published") {
      reasons.push("surface_publication_not_published");
    }
    if (command.runtimePublicationState !== "current") {
      reasons.push("runtime_publication_not_current");
    }

    if (manifest) {
      const composition = this.composition.evaluateComposition({
        capabilityCode: command.capabilityCode,
        compositionPolicyRef: manifest.compositionPolicyRef,
        upstreamArtifacts: command.upstreamArtifacts,
        downstreamConsumerObjectTypes: command.downstreamConsumerObjectTypes,
      });
      reasons.push(...composition.reasonCodes);
    }

    const releaseMode = releaseState?.mode ?? "blocked";
    const killState = killSwitchState?.killState ?? "blocked";
    const rolloutRung = deriveRolloutRung(command.visibilityCeiling, releaseMode, killState, manifest?.manifestState ?? "blocked");
    const renderPosture = deriveRenderPosture(rolloutRung, releaseMode, killState);
    const hardBlocked = reasons.some((reason) =>
      [
        "capability_manifest_missing",
        "capability_manifest_not_active",
        "intended_use_profile_missing",
        "intended_use_profile_not_active",
        "actor_role_not_permitted",
        "subject_scope_not_permitted",
        "route_family_not_allowed",
        "surface_binding_or_policy_missing",
        "release_state_missing",
        "release_state_not_current",
        "release_state_blocks_invocation",
        "kill_switch_state_missing",
        "assistive_kill_switch_active",
        "surface_publication_not_published",
        "runtime_publication_not_current",
        "forbidden_action_scope",
        "forbidden_downstream_consumer",
        "blocked_downstream_consumer",
        "composition_loop_detected",
        "composition_chain_depth_exceeded",
      ].includes(reason),
    );
    const eligible = !hardBlocked && renderPosture !== "blocked";
    return Object.freeze({
      decisionId: `invocation-decision:${stableAssistiveControlHash({
        capabilityCode: command.capabilityCode,
        routeFamily: command.routeFamily,
        subjectScope: command.subjectScope,
        actorRef: command.actorRef,
        evidenceClassRefs: command.evidenceClassRefs,
        releaseStateRef: releaseState?.releaseStateId,
        killSwitchStateRef: killSwitchState?.killSwitchStateId,
      }).slice(0, 16)}`,
      eligible,
      capabilityCode: command.capabilityCode,
      routeFamily: command.routeFamily,
      subjectScope: command.subjectScope,
      actorRef: command.actorRef,
      actorRole: command.actorRole,
      actingContextRef: command.actingContextRef,
      tenantId: command.tenantId,
      cohortId: command.cohortId,
      environmentRing: command.environmentRing,
      evidenceClassRefs: Object.freeze([...command.evidenceClassRefs]),
      visibilityCeiling: command.visibilityCeiling,
      rolloutRung,
      renderPosture,
      releaseStateRef: releaseState?.releaseStateId,
      killSwitchStateRef: killSwitchState?.killSwitchStateId,
      compiledPolicyBundleRef: releaseState?.compiledPolicyBundleRef,
      rolloutVerdictRef: releaseState?.rolloutVerdictRef,
      surfaceBindingRef: command.surfaceBindingRef ?? command.surfacePolicyRef,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
      telemetryDisclosureFenceRef: command.telemetryDisclosureFenceRef,
      ticketOrTaskRef: command.ticketOrTaskRef,
      reviewVersionRef: command.reviewVersionRef,
      lineageFenceEpoch: command.lineageFenceEpoch,
      entityContinuityKey: command.entityContinuityKey,
      grantExpiresAt: addSeconds(this.runtime.clock.now(), command.grantTtlSeconds ?? 300),
      reasonCodes: Object.freeze(unique(reasons)),
    });
  }
}

export class AssistiveInvocationGrantIssuer {
  public constructor(private readonly runtime: AssistiveControlRuntime) {}

  public issueInvocationGrant(decision: InvocationEligibilityDecision, actor: AssistiveControlActorContext, idempotencyKey?: string): AssistiveInvocationGrant {
    requireRole(actor, ["capability_control_plane", "assistive_ops", "system"], "ASSISTIVE_INVOCATION_GRANT_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "invocation_grant", idempotencyKey, this.runtime.store.invocationGrants);
    if (existing) {
      return existing;
    }
    if (!decision.eligible || !decision.compiledPolicyBundleRef || !decision.rolloutVerdictRef || !decision.surfaceBindingRef) {
      throw new AssistiveControlPlaneError("ASSISTIVE_INVOCATION_NOT_ELIGIBLE", "Invocation grant requires an eligible decision.", [
        ...decision.reasonCodes,
        "invocation_eligibility_failed",
      ]);
    }
    const grantId = this.runtime.idGenerator.next("assistive_invocation_grant");
    const grantFenceToken = `grant-fence-token:${stableAssistiveControlHash({
      grantId,
      capabilityCode: decision.capabilityCode,
      actorRef: decision.actorRef,
      subjectScope: decision.subjectScope,
      routeFamily: decision.routeFamily,
      compiledPolicyBundleRef: decision.compiledPolicyBundleRef,
      reviewVersionRef: decision.reviewVersionRef,
      lineageFenceEpoch: decision.lineageFenceEpoch,
      expiresAt: decision.grantExpiresAt,
    })}`;
    const grant: AssistiveInvocationGrant = Object.freeze({
      assistiveInvocationGrantId: grantId,
      capabilityCode: decision.capabilityCode,
      routeFamily: decision.routeFamily,
      subjectScope: decision.subjectScope,
      actorRef: decision.actorRef,
      actingContextRef: decision.actingContextRef,
      evidenceClassRefs: Object.freeze([...decision.evidenceClassRefs]),
      visibilityCeiling: decision.visibilityCeiling,
      compiledPolicyBundleRef: decision.compiledPolicyBundleRef,
      reviewVersionRef: decision.reviewVersionRef,
      lineageFenceEpoch: decision.lineageFenceEpoch,
      entityContinuityKey: decision.entityContinuityKey,
      surfaceBindingRef: decision.surfaceBindingRef,
      rolloutVerdictRef: decision.rolloutVerdictRef,
      rolloutRung: decision.rolloutRung,
      renderPosture: decision.renderPosture,
      surfaceRouteContractRef: decision.surfaceRouteContractRef,
      surfacePublicationRef: decision.surfacePublicationRef,
      runtimePublicationBundleRef: decision.runtimePublicationBundleRef,
      releaseRecoveryDispositionRef: decision.releaseRecoveryDispositionRef,
      telemetryDisclosureFenceRef: decision.telemetryDisclosureFenceRef,
      ticketOrTaskRef: decision.ticketOrTaskRef,
      grantFenceToken,
      issuedAt: this.runtime.clock.now(),
      expiresAt: decision.grantExpiresAt,
      grantState: decision.renderPosture === "visible" ? "live" : decision.renderPosture,
    });
    this.runtime.store.invocationGrants.set(grant.assistiveInvocationGrantId, grant);
    setIdempotent(this.runtime, "invocation_grant", idempotencyKey, grant.assistiveInvocationGrantId);
    writeAudit(this.runtime, "AssistiveInvocationGrantIssuer", "issueInvocationGrant", actor, grant.assistiveInvocationGrantId, "accepted", []);
    return grant;
  }

  public revokeInvocationGrant(grantRef: string, actor: AssistiveControlActorContext, reasonCode = "grant_revoked"): AssistiveInvocationGrant {
    requireRole(actor, ["capability_control_plane", "assistive_ops", "system"], "ASSISTIVE_INVOCATION_GRANT_FORBIDDEN");
    const grant = requireFromMap(this.runtime.store.invocationGrants, grantRef, "ASSISTIVE_INVOCATION_GRANT_NOT_FOUND");
    const updated: AssistiveInvocationGrant = Object.freeze({
      ...grant,
      grantState: "revoked",
    });
    this.runtime.store.invocationGrants.set(grantRef, updated);
    writeAudit(this.runtime, "AssistiveInvocationGrantIssuer", "revokeInvocationGrant", actor, grantRef, "blocked", [reasonCode]);
    return updated;
  }
}

export class AssistiveRunSettlementService {
  public constructor(private readonly runtime: AssistiveControlRuntime) {}

  public settleRun(command: SettleAssistiveRunCommand, actor: AssistiveControlActorContext): AssistiveRunSettlement {
    requireRole(actor, ["capability_control_plane", "assistive_ops", "system"], "ASSISTIVE_RUN_SETTLEMENT_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "run_settlement", command.idempotencyKey, this.runtime.store.runSettlements);
    if (existing) {
      return existing;
    }
    const grant = requireFromMap(this.runtime.store.invocationGrants, command.assistiveInvocationGrantRef, "ASSISTIVE_INVOCATION_GRANT_NOT_FOUND");
    validateFrozenReferences(command.producedArtifactRefs, "producedArtifactRefs");
    validateFrozenReferences(command.blockedArtifactRefs ?? [], "blockedArtifactRefs");
    for (const ref of [command.assistiveRunRef, command.transitionEnvelopeRef, command.uiTransitionSettlementRecordRef]) {
      requireFrozenReference(ref);
    }
    const reasonCodes: string[] = [];
    const blocked = [...(command.blockedArtifactRefs ?? [])];
    let settlementState = command.requestedSettlementState ?? deriveSettlementFromGrant(grant);
    let renderable = [...command.producedArtifactRefs];
    if (grant.grantState === "revoked" || Date.parse(grant.expiresAt) <= Date.parse(this.runtime.clock.now())) {
      settlementState = "blocked_by_policy";
      reasonCodes.push("invocation_grant_not_live");
    }
    if (grant.grantState === "blocked") {
      settlementState = "blocked_by_policy";
      reasonCodes.push("invocation_grant_blocked");
    }
    if (command.schemaValidationState !== "valid") {
      settlementState = "quarantined";
      reasonCodes.push("schema_validation_failed");
    }
    if (command.policyValidationState !== "valid") {
      settlementState = "blocked_by_policy";
      reasonCodes.push("policy_validation_failed");
    }
    if (settlementState === "blocked_by_policy" || settlementState === "quarantined") {
      blocked.push(...renderable);
      renderable = [];
    } else if (settlementState === "shadow_only") {
      renderable = [];
    } else if (settlementState === "abstained") {
      blocked.push(...renderable);
      renderable = [];
      reasonCodes.push("assistive_run_abstained");
    }
    const settlement: AssistiveRunSettlement = Object.freeze({
      assistiveRunSettlementId: this.runtime.idGenerator.next("assistive_run_settlement"),
      assistiveRunRef: command.assistiveRunRef,
      assistiveInvocationGrantRef: grant.assistiveInvocationGrantId,
      settlementState,
      quarantineReasonCode: reasonCodes[0],
      renderableArtifactRefs: Object.freeze(unique(renderable)),
      blockedArtifactRefs: Object.freeze(unique(blocked)),
      schemaValidationState: command.schemaValidationState,
      policyBundleRef: grant.compiledPolicyBundleRef,
      surfacePublicationRef: grant.surfacePublicationRef,
      runtimePublicationBundleRef: grant.runtimePublicationBundleRef,
      transitionEnvelopeRef: command.transitionEnvelopeRef,
      uiTransitionSettlementRecordRef: command.uiTransitionSettlementRecordRef,
      assistiveCapabilityTrustEnvelopeRef: command.assistiveCapabilityTrustEnvelopeRef,
      releaseRecoveryDispositionRef: grant.releaseRecoveryDispositionRef,
      settledAt: this.runtime.clock.now(),
    });
    this.runtime.store.runSettlements.set(settlement.assistiveRunSettlementId, settlement);
    setIdempotent(this.runtime, "run_settlement", command.idempotencyKey, settlement.assistiveRunSettlementId);
    writeAudit(
      this.runtime,
      "AssistiveRunSettlementService",
      "settleRun",
      actor,
      settlement.assistiveRunSettlementId,
      ["blocked_by_policy", "quarantined"].includes(settlementState) ? "blocked" : "accepted",
      reasonCodes,
    );
    return settlement;
  }
}

export function createAssistiveCapabilityControlPlane(options?: {
  store?: AssistiveControlStore;
  clock?: AssistiveControlClock;
  idGenerator?: AssistiveControlIdGenerator;
}): {
  store: AssistiveControlStore;
  intendedUseProfiles: IntendedUseProfileService;
  manifests: AssistiveCapabilityManifestService;
  invocationEligibility: InvocationEligibilityService;
  invocationGrants: AssistiveInvocationGrantIssuer;
  compositionPolicies: AssistiveCompositionPolicyEngine;
  releaseStates: AssistiveReleaseStateResolver;
  killSwitches: AssistiveKillSwitchService;
  runSettlements: AssistiveRunSettlementService;
} {
  const runtime: AssistiveControlRuntime = {
    store: options?.store ?? createAssistiveControlPlaneStore(),
    clock: options?.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options?.idGenerator ?? createDeterministicAssistiveControlIdGenerator(),
  };
  return {
    store: runtime.store,
    intendedUseProfiles: new IntendedUseProfileService(runtime),
    manifests: new AssistiveCapabilityManifestService(runtime),
    invocationEligibility: new InvocationEligibilityService(runtime),
    invocationGrants: new AssistiveInvocationGrantIssuer(runtime),
    compositionPolicies: new AssistiveCompositionPolicyEngine(runtime),
    releaseStates: new AssistiveReleaseStateResolver(runtime),
    killSwitches: new AssistiveKillSwitchService(runtime),
    runSettlements: new AssistiveRunSettlementService(runtime),
  };
}

export const assistiveCapabilityControlPlaneContract = {
  contractId: "410_capability_control_plane_contract",
  schemaVersion: "410.capability-control-plane-contract.v1",
  upstreamContractRefs: [
    "data/contracts/403_phase8_track_readiness_registry.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/409_recommendation_orchestrator_contract.json",
  ],
  services: assistiveControlPlaneServiceNames,
  failClosedDefaults: [
    "capability_manifest_missing",
    "intended_use_profile_missing",
    "release_state_missing",
    "kill_switch_state_missing",
    "forbidden_downstream_consumer",
    "composition_loop_detected",
    "surface_publication_not_published",
    "runtime_publication_not_current",
    "schema_validation_failed",
    "policy_validation_failed",
    "no_auto_write_policy_enforced",
  ],
} as const;

function deriveRolloutRung(
  requested: VisibilityCeiling,
  releaseMode: ReleaseMode,
  killState: KillState,
  manifestState: ManifestState,
): RolloutRung {
  if (killState === "withdrawn" || releaseMode === "withdrawn" || manifestState === "retired") {
    return "withdrawn";
  }
  if (killState === "blocked" || releaseMode === "blocked" || manifestState === "blocked") {
    return "frozen";
  }
  if (killState === "shadow_only" || manifestState === "shadow_only" || releaseMode === "shadow_only") {
    return "shadow_only";
  }
  if (releaseMode === "observe_only") {
    return "visible_summary";
  }
  const rank: Record<VisibilityCeiling | "visible_summary" | "visible_insert" | "visible_commit", number> = {
    shadow_only: 0,
    visible_summary: 1,
    visible_insert: 2,
    visible_commit: 3,
  };
  const releaseCeiling = releaseMode === "visible_commit" ? "visible_commit" : releaseMode === "visible_insert" ? "visible_insert" : "visible_summary";
  const minRank = Math.min(rank[requested], rank[releaseCeiling]);
  return (["shadow_only", "visible_summary", "visible_insert", "visible_commit"] as const)[minRank] ?? "shadow_only";
}

function deriveRenderPosture(rolloutRung: RolloutRung, releaseMode: ReleaseMode, killState: KillState): RenderPosture {
  if (["withdrawn", "frozen"].includes(rolloutRung) || killState === "blocked" || killState === "withdrawn") {
    return "blocked";
  }
  if (rolloutRung === "shadow_only") {
    return "shadow_only";
  }
  if (releaseMode === "observe_only" || killState === "shadow_only") {
    return "observe_only";
  }
  return "visible";
}

function deriveSettlementFromGrant(grant: AssistiveInvocationGrant): AssistiveRunSettlementState {
  if (grant.renderPosture === "visible") {
    return "renderable";
  }
  if (grant.renderPosture === "observe_only") {
    return "observe_only";
  }
  if (grant.renderPosture === "shadow_only") {
    return "shadow_only";
  }
  return "blocked_by_policy";
}

function requireRole(actor: AssistiveControlActorContext, allowedRoles: readonly AssistiveControlActorRole[], code: string): void {
  if (!allowedRoles.includes(actor.actorRole)) {
    throw new AssistiveControlPlaneError(code, `Role ${actor.actorRole} is not allowed.`, [`role_${actor.actorRole}_not_allowed`]);
  }
}

function getIdempotent<T>(
  runtime: AssistiveControlRuntime,
  namespace: string,
  idempotencyKey: string | undefined,
  records: Map<string, T>,
): T | undefined {
  if (!idempotencyKey) {
    return undefined;
  }
  const recordId = runtime.store.idempotencyKeys.get(`${namespace}:${idempotencyKey}`);
  return recordId ? records.get(recordId) : undefined;
}

function setIdempotent(runtime: AssistiveControlRuntime, namespace: string, idempotencyKey: string | undefined, recordId: string): void {
  if (idempotencyKey) {
    runtime.store.idempotencyKeys.set(`${namespace}:${idempotencyKey}`, recordId);
  }
}

function writeAudit(
  runtime: AssistiveControlRuntime,
  serviceName: string,
  action: string,
  actor: AssistiveControlActorContext,
  subjectRef: string,
  outcome: AssistiveControlAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("assistive_control_audit"),
    serviceName,
    action,
    actorRef: actor.actorRef,
    actorRole: actor.actorRole,
    routeIntentBindingRef: actor.routeIntentBindingRef,
    auditCorrelationId: actor.auditCorrelationId,
    purposeOfUse: actor.purposeOfUse,
    subjectRef,
    outcome,
    reasonCodes,
    recordedAt: runtime.clock.now(),
  });
}

function requireFromMap<T>(records: Map<string, T>, key: string, code: string): T {
  const record = records.get(key);
  if (!record) {
    throw new AssistiveControlPlaneError(code, `Missing assistive control record: ${key}.`, [`${code.toLowerCase()}_missing`]);
  }
  return record;
}

function requireFrozenReference(value: string | undefined): asserts value is string {
  requireNonEmpty(value, "ref");
  const lowered = value.toLowerCase();
  if (
    lowered.startsWith("mutable:") ||
    lowered.includes("mutable_current") ||
    lowered.endsWith(":latest") ||
    lowered.endsWith("/latest")
  ) {
    throw new AssistiveControlPlaneError("ASSISTIVE_MUTABLE_REF_FORBIDDEN", "Assistive control inputs must be frozen refs.", [
      "mutable_ref_forbidden",
    ]);
  }
}

function validateFrozenReferences(refs: readonly string[], fieldName: string): void {
  for (const ref of refs) {
    try {
      requireFrozenReference(ref);
    } catch (error) {
      if (error instanceof AssistiveControlPlaneError) {
        throw new AssistiveControlPlaneError(error.code, `${fieldName} contains a mutable or empty reference.`, error.reasonCodes);
      }
      throw error;
    }
  }
}

function requireNonEmpty(value: string | undefined, fieldName: string): asserts value is string {
  if (!value || value.trim().length === 0) {
    throw new AssistiveControlPlaneError("ASSISTIVE_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function requireNonEmptyArray<T>(value: readonly T[], fieldName: string): void {
  if (value.length === 0) {
    throw new AssistiveControlPlaneError("ASSISTIVE_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function addSeconds(isoTimestamp: ISODateString, seconds: number): ISODateString {
  return new Date(Date.parse(isoTimestamp) + seconds * 1000).toISOString();
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}
