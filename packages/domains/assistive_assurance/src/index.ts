import { createHash } from "node:crypto";

export type ISODateString = string;

export type AssistiveAssuranceActorRole =
  | "change_impact_assessor"
  | "rfc_bundle_assembler"
  | "assurance_baseline_owner"
  | "clinical_safety_officer"
  | "independent_safety_reviewer"
  | "deployment_approver"
  | "product_owner"
  | "information_governance_lead"
  | "regulatory_owner"
  | "rollback_owner"
  | "release_manager"
  | "system";

export type ChangeClass =
  | "copy_template_only"
  | "prompt_or_threshold"
  | "model_version"
  | "subprocessor_or_inference_host"
  | "capability_expansion"
  | "intended_use"
  | "regulatory_posture";

export type MedicalPurposeBoundaryState =
  | "transcription_documentation_assistance"
  | "higher_function_summarisation_structured_inference"
  | "endpoint_suggestion_clinically_consequential_decision_support"
  | "regulatory_posture_change"
  | "unknown";

export type AssessmentState = "complete" | "blocked" | "superseded";
export type EvidenceRequiredState = "not_required" | "required" | "blocked";
export type BaselineState = "candidate" | "current" | "stale" | "superseded" | "withdrawn";
export type SupplierDriftState = "current" | "stale" | "drifted" | "suspended" | "withdrawn";
export type ReleaseApprovalState = "pending" | "satisfied" | "blocked";
export type RollbackCompatibilityState = "compatible" | "incompatible" | "unknown";
export type RollbackBundleState = "ready" | "incomplete" | "blocked";
export type AssuranceFreezeStateValue = "clear" | "monitoring" | "frozen" | "released";
export type ReleaseActionType = "approve" | "promote" | "freeze" | "unfreeze" | "rollback";
export type ReleaseActionSettlementResult =
  | "approved"
  | "promoted"
  | "frozen"
  | "unfrozen"
  | "rollback_started"
  | "stale_recoverable"
  | "denied_scope"
  | "blocked_policy"
  | "failed";
export type EvidenceExportKind = "rfc_bundle" | "approval_summary" | "rollback_pack" | "runbook";
export type EvidenceExportState = "ready" | "blocked";

export const ASSISTIVE_ASSURANCE_INVARIANT_MARKERS = {
  change_impact_from_real_deltas: "change_impact_from_real_deltas",
  exact_regulatory_trigger_routing: "exact_regulatory_trigger_routing",
  im1_not_ai_specific_technical_assurance: "im1_not_ai_specific_technical_assurance",
  baseline_snapshot_pins_guidance_versions: "baseline_snapshot_pins_guidance_versions",
  stale_baseline_blocks_promotion: "stale_baseline_blocks_promotion",
  no_self_approval_and_independent_safety_review: "no_self_approval_and_independent_safety_review",
  rollback_readiness_required_for_promotion: "rollback_readiness_required_for_promotion",
  release_actions_bind_exact_candidate_hashes: "release_actions_bind_exact_candidate_hashes",
  supplier_drift_opens_assurance_freeze: "supplier_drift_opens_assurance_freeze",
  governed_evidence_exports_only: "governed_evidence_exports_only",
  medical_device_boundary_reassessment_required: "medical_device_boundary_reassessment_required",
  approval_graph_covers_all_active_triggers: "approval_graph_covers_all_active_triggers",
} as const;

export interface AssistiveAssuranceActorContext {
  actorRef: string;
  actorRole: AssistiveAssuranceActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface AssistiveAssuranceAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: AssistiveAssuranceActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface ModelChangeRequest {
  changeRequestId: string;
  capabilityCode: string;
  changeClass: ChangeClass;
  currentVersionRef: string;
  proposedVersionRef: string;
  releaseCandidateRef: string;
  requestedBy: string;
  requestedAt: ISODateString;
  requestHash: string;
}

export interface ChangeImpactAssessment {
  impactAssessmentId: string;
  changeRequestId: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  changeClass: ChangeClass;
  surfaceDeltaRefs: readonly string[];
  surfacePublicationDeltaRefs: readonly string[];
  rolloutLadderDelta: boolean;
  rolloutSliceDeltaRefs: readonly string[];
  workflowDecisionDelta: boolean;
  artifactDeliveryDelta: boolean;
  uiTelemetryDisclosureDelta: boolean;
  intendedUseDelta: boolean;
  patientFacingWordingDelta: boolean;
  medicalPurposeBoundaryState: MedicalPurposeBoundaryState;
  im1RfcRequired: boolean;
  scalUpdateRequired: boolean;
  dtacDeltaRequired: boolean;
  dcb0129DeltaRequired: boolean;
  dcb0160DependencyNoteRequired: boolean;
  dpiaDeltaRequired: boolean;
  mhraAssessmentRequired: boolean;
  medicalDeviceReassessmentRequired: boolean;
  evaluationRerunRequired: boolean;
  replayProofRequired: boolean;
  rollbackProofRequired: boolean;
  localTechnicalAssuranceRequired: boolean;
  assessmentState: AssessmentState;
  blockingReasonCodes: readonly string[];
  assessedAt: ISODateString;
}

export interface RFCBundle {
  rfcBundleId: string;
  im1ProductRef: string;
  changeRequestId: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  scalDeltaRef: string;
  safetyCaseDeltaRef: string;
  documentationRefs: readonly string[];
  evidenceBaselineRef: string;
  approvalGraphRef: string;
  impactAssessmentRef: string;
  im1RfcRequired: boolean;
  localTechnicalAssuranceRef: string;
  submissionState: "not_required" | "draft" | "ready" | "blocked";
  blockingReasonCodes: readonly string[];
  expiresAt: ISODateString;
  assembledAt: ISODateString;
}

export interface SubprocessorAssuranceRef {
  subprocessorRefId: string;
  supplierName: string;
  suppliedModelOrServiceRefs: readonly string[];
  safetyEvidenceRef: string;
  dpiaRef: string;
  contractualControlRef: string;
  assuranceVersion: string;
  assuranceFreshUntil: ISODateString;
  driftState: SupplierDriftState;
  suspensionState: "active" | "suspended" | "withdrawn";
}

export interface MedicalDeviceAssessmentRef {
  assessmentRefId: string;
  capabilityCode: string;
  intendedUseProfileRef: string;
  boundaryDecisionRef: string;
  assessmentOutcome:
    | "not_medical_device"
    | "medical_device_not_registered"
    | "registered"
    | "reassessment_required"
    | "blocked";
  registrationState: "not_applicable" | "registered" | "pending" | "expired" | "blocked";
  evidenceRefs: readonly string[];
  reviewDueAt: ISODateString;
}

export interface SafetyCaseDelta {
  deltaId: string;
  releaseCandidateRef: string;
  hazardChanges: readonly string[];
  controlsAdded: readonly string[];
  hazardTraceRef: string;
  controlVerificationRefs: readonly string[];
  residualRiskRef: string;
  testEvidenceRef: string;
  signoffState: "not_required" | "draft" | "in_review" | "signed" | "blocked" | "revoked";
}

export interface AssuranceBaselineSnapshot {
  baselineSnapshotId: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  im1GuidanceVersionRef: string;
  dtacVersionRef: string;
  dcbStandardVersionRef: string;
  dpiaRef: string;
  scalVersionRef: string;
  medicalDeviceAssessmentRef: string;
  evaluationDatasetRef: string;
  replayHarnessVersionRef: string;
  supplierAssuranceRefs: readonly string[];
  disclosureBaselineRef: string;
  safetyCaseDeltaRef: string;
  freshUntil: ISODateString;
  baselineState: BaselineState;
  supersededAt?: ISODateString;
  baselineHash: string;
  blockingReasonCodes: readonly string[];
  pinnedAt: ISODateString;
}

export interface ReleaseApprovalSignoff {
  role: AssistiveAssuranceActorRole;
  actorRef: string;
  evidenceRef: string;
  signedAt: ISODateString;
}

export interface ReleaseApprovalGraph {
  approvalGraphId: string;
  changeRequestId: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  impactAssessmentRef: string;
  requiredApproverRoles: readonly AssistiveAssuranceActorRole[];
  signoffRefs: readonly ReleaseApprovalSignoff[];
  noSelfApprovalState: "satisfied" | "blocked";
  independentSafetyReviewerRef?: string;
  deploymentApproverRef?: string;
  currentApprovalState: ReleaseApprovalState;
  missingApproverRoles: readonly AssistiveAssuranceActorRole[];
  blockingReasonCodes: readonly string[];
  completedAt?: ISODateString;
  evaluatedAt: ISODateString;
}

export interface RollbackReadinessBundle {
  rollbackBundleId: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  rollbackTargetRef: string;
  dataCompatibilityState: RollbackCompatibilityState;
  policyCompatibilityState: RollbackCompatibilityState;
  runtimePublicationParityState: "exact" | "stale" | "conflict" | "missing";
  killSwitchPlanRef: string;
  operatorRunbookRef: string;
  verificationEvidenceRefs: readonly string[];
  releaseRecoveryDispositionRef: string;
  bundleState: RollbackBundleState;
  blockingReasonCodes: readonly string[];
  bundleHash: string;
  assembledAt: ISODateString;
}

export interface AssuranceFreezeState {
  assuranceFreezeStateId: string;
  scopeRef: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  baselineSnapshotRef?: string;
  rollbackBundleRef?: string;
  approvalGraphRef?: string;
  freezeReasonCode: string;
  triggerRef: string;
  activatedBy: string;
  activatedAt: ISODateString;
  liftCriteria: readonly string[];
  freezeState: AssuranceFreezeStateValue;
  blockingReasonCodes: readonly string[];
}

export interface AssistiveReleaseActionRecord {
  assistiveReleaseActionRecordId: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  baselineSnapshotRef: string;
  baselineSnapshotHash: string;
  rollbackBundleRef: string;
  rollbackBundleHash: string;
  approvalGraphRef: string;
  rolloutSliceContractRef: string;
  rolloutVerdictRef: string;
  actionType: ReleaseActionType;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  uiTelemetryDisclosureBaselineRef: string;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  actorRef: string;
  actionTupleHash: string;
  createdAt: ISODateString;
  settledAt?: ISODateString;
}

export interface AssistiveReleaseActionSettlement {
  assistiveReleaseActionSettlementId: string;
  assistiveReleaseActionRecordRef: string;
  commandSettlementRecordRef: string;
  uiTransitionSettlementRecordRef: string;
  uiTelemetryDisclosureFenceRef: string;
  presentationArtifactRef: string;
  result: ReleaseActionSettlementResult;
  recoveryActionRef: string;
  blockingReasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface AssistiveRegulatoryEvidenceExport {
  evidenceExportId: string;
  exportKind: EvidenceExportKind;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  rfcBundleRef?: string;
  approvalGraphRef?: string;
  rollbackBundleRef?: string;
  baselineSnapshotRef: string;
  artifactPresentationPolicyRef: string;
  outboundNavigationGrantRef: string;
  presentationArtifactRef: string;
  repositoryArtifactRef: string;
  exportState: EvidenceExportState;
  blockingReasonCodes: readonly string[];
  exportedAt: ISODateString;
}

export interface AssistiveAssuranceStore {
  modelChangeRequests: Map<string, ModelChangeRequest>;
  impactAssessments: Map<string, ChangeImpactAssessment>;
  rfcBundles: Map<string, RFCBundle>;
  subprocessorAssuranceRefs: Map<string, SubprocessorAssuranceRef>;
  medicalDeviceAssessments: Map<string, MedicalDeviceAssessmentRef>;
  safetyCaseDeltas: Map<string, SafetyCaseDelta>;
  baselineSnapshots: Map<string, AssuranceBaselineSnapshot>;
  approvalGraphs: Map<string, ReleaseApprovalGraph>;
  rollbackBundles: Map<string, RollbackReadinessBundle>;
  freezeStates: Map<string, AssuranceFreezeState>;
  releaseActionRecords: Map<string, AssistiveReleaseActionRecord>;
  releaseActionSettlements: Map<string, AssistiveReleaseActionSettlement>;
  evidenceExports: Map<string, AssistiveRegulatoryEvidenceExport>;
  auditRecords: AssistiveAssuranceAuditRecord[];
  idempotencyKeys: Map<string, string>;
}

export interface AssistiveAssuranceClock {
  now(): ISODateString;
}

export interface AssistiveAssuranceIdGenerator {
  next(prefix: string): string;
}

export interface AssistiveAssuranceRuntime {
  store: AssistiveAssuranceStore;
  clock: AssistiveAssuranceClock;
  idGenerator: AssistiveAssuranceIdGenerator;
}

export interface AssessChangeImpactCommand {
  impactAssessmentId?: string;
  changeRequestId: string;
  capabilityCode: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  changeClass: ChangeClass;
  currentVersionRef: string;
  proposedVersionRef: string;
  requestedBy: string;
  surfaceDeltaRefs?: readonly string[];
  surfacePublicationDeltaRefs?: readonly string[];
  rolloutLadderDelta?: boolean;
  rolloutSliceDeltaRefs?: readonly string[];
  workflowDecisionDelta?: boolean;
  artifactDeliveryDelta?: boolean;
  uiTelemetryDisclosureDelta?: boolean;
  intendedUseDelta?: boolean;
  patientFacingWordingDelta?: boolean;
  medicalPurposeBoundaryState: MedicalPurposeBoundaryState;
  candidateHashStable?: boolean;
  idempotencyKey?: string;
}

export interface AssembleRFCBundleCommand {
  rfcBundleId?: string;
  im1ProductRef: string;
  impactAssessmentRef: string;
  baselineSnapshotRef: string;
  approvalGraphRef: string;
  scalDeltaRef?: string;
  safetyCaseDeltaRef?: string;
  documentationRefs?: readonly string[];
  localTechnicalAssuranceRef: string;
  expiresAt: ISODateString;
  idempotencyKey?: string;
}

export interface RegisterSubprocessorAssuranceCommand extends SubprocessorAssuranceRef {
  idempotencyKey?: string;
}

export interface PinMedicalDeviceAssessmentCommand extends MedicalDeviceAssessmentRef {
  idempotencyKey?: string;
}

export interface PinSafetyCaseDeltaCommand extends SafetyCaseDelta {
  idempotencyKey?: string;
}

export interface PinAssuranceBaselineSnapshotCommand {
  baselineSnapshotId?: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  im1GuidanceVersionRef: string;
  dtacVersionRef: string;
  dcbStandardVersionRef: string;
  dpiaRef: string;
  scalVersionRef: string;
  medicalDeviceAssessmentRef: string;
  evaluationDatasetRef: string;
  replayHarnessVersionRef: string;
  supplierAssuranceRefs?: readonly string[];
  disclosureBaselineRef: string;
  safetyCaseDeltaRef: string;
  freshUntil: ISODateString;
  supersededAt?: ISODateString;
  idempotencyKey?: string;
}

export interface BuildReleaseApprovalGraphCommand {
  approvalGraphId?: string;
  changeRequestId: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  impactAssessmentRef: string;
  requesterActorRef: string;
  signoffRefs?: readonly ReleaseApprovalSignoff[];
  idempotencyKey?: string;
}

export interface AssembleRollbackReadinessBundleCommand {
  rollbackBundleId?: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  rollbackTargetRef: string;
  dataCompatibilityState: RollbackCompatibilityState;
  policyCompatibilityState: RollbackCompatibilityState;
  runtimePublicationParityState: "exact" | "stale" | "conflict" | "missing";
  killSwitchPlanRef: string;
  operatorRunbookRef: string;
  verificationEvidenceRefs?: readonly string[];
  releaseRecoveryDispositionRef: string;
  idempotencyKey?: string;
}

export interface EvaluateAssuranceFreezeCommand {
  assuranceFreezeStateId?: string;
  scopeRef: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  baselineSnapshotRef?: string;
  rollbackBundleRef?: string;
  approvalGraphRef?: string;
  supplierAssuranceRefs?: readonly string[];
  triggerRef: string;
  activatedBy: string;
  liftCriteria?: readonly string[];
  idempotencyKey?: string;
}

export interface CreateReleaseActionCommand {
  assistiveReleaseActionRecordId?: string;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  baselineSnapshotRef: string;
  baselineSnapshotHash: string;
  rollbackBundleRef: string;
  rollbackBundleHash: string;
  approvalGraphRef: string;
  rolloutSliceContractRef: string;
  rolloutVerdictRef: string;
  actionType: ReleaseActionType;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  uiTelemetryDisclosureBaselineRef: string;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  idempotencyKey?: string;
}

export interface SettleReleaseActionCommand {
  assistiveReleaseActionSettlementId?: string;
  assistiveReleaseActionRecordRef: string;
  commandSettlementRecordRef: string;
  uiTransitionSettlementRecordRef: string;
  uiTelemetryDisclosureFenceRef: string;
  presentationArtifactRef: string;
  recoveryActionRef: string;
  assuranceFreezeStateRef?: string;
  idempotencyKey?: string;
}

export interface ExportRegulatoryEvidenceCommand {
  evidenceExportId?: string;
  exportKind: EvidenceExportKind;
  releaseCandidateRef: string;
  releaseCandidateHash: string;
  baselineSnapshotRef: string;
  artifactPresentationPolicyRef: string;
  outboundNavigationGrantRef: string;
  presentationArtifactRef: string;
  repositoryArtifactRef: string;
  rfcBundleRef?: string;
  approvalGraphRef?: string;
  rollbackBundleRef?: string;
  idempotencyKey?: string;
}

export class ChangeImpactAssessmentService {
  public constructor(private readonly runtime: AssistiveAssuranceRuntime) {}

  public assessChangeImpact(
    command: AssessChangeImpactCommand,
    actor: AssistiveAssuranceActorContext,
  ): ChangeImpactAssessment {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.impactAssessments,
      () => {
        for (const [field, value] of Object.entries({
          changeRequestId: command.changeRequestId,
          capabilityCode: command.capabilityCode,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          currentVersionRef: command.currentVersionRef,
          proposedVersionRef: command.proposedVersionRef,
          requestedBy: command.requestedBy,
        })) {
          requireNonEmpty(value, field);
        }
        const modelChangeRequest = materializeModelChangeRequest(this.runtime, command);
        const flags = regulatoryFlagsFor(command);
        const blockingReasonCodes = impactBlockers(command);
        const assessmentHash = stableAssistiveAssuranceHash({
          changeRequestId: command.changeRequestId,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          changeClass: command.changeClass,
          flags,
          blockingReasonCodes,
        });
        const assessment: ChangeImpactAssessment = {
          impactAssessmentId:
            command.impactAssessmentId ?? `change-impact-assessment:${assessmentHash}`,
          changeRequestId: command.changeRequestId,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          changeClass: command.changeClass,
          surfaceDeltaRefs: [...(command.surfaceDeltaRefs ?? [])],
          surfacePublicationDeltaRefs: [...(command.surfacePublicationDeltaRefs ?? [])],
          rolloutLadderDelta: command.rolloutLadderDelta ?? false,
          rolloutSliceDeltaRefs: [...(command.rolloutSliceDeltaRefs ?? [])],
          workflowDecisionDelta: command.workflowDecisionDelta ?? false,
          artifactDeliveryDelta: command.artifactDeliveryDelta ?? false,
          uiTelemetryDisclosureDelta: command.uiTelemetryDisclosureDelta ?? false,
          intendedUseDelta: command.intendedUseDelta ?? false,
          patientFacingWordingDelta: command.patientFacingWordingDelta ?? false,
          medicalPurposeBoundaryState: command.medicalPurposeBoundaryState,
          im1RfcRequired: flags.im1RfcRequired,
          scalUpdateRequired: flags.scalUpdateRequired,
          dtacDeltaRequired: flags.dtacDeltaRequired,
          dcb0129DeltaRequired: flags.dcb0129DeltaRequired,
          dcb0160DependencyNoteRequired: flags.dcb0160DependencyNoteRequired,
          dpiaDeltaRequired: flags.dpiaDeltaRequired,
          mhraAssessmentRequired: flags.mhraAssessmentRequired,
          medicalDeviceReassessmentRequired: flags.medicalDeviceReassessmentRequired,
          evaluationRerunRequired: flags.evaluationRerunRequired,
          replayProofRequired: flags.replayProofRequired,
          rollbackProofRequired: flags.rollbackProofRequired,
          localTechnicalAssuranceRequired: flags.localTechnicalAssuranceRequired,
          assessmentState: blockingReasonCodes.length > 0 ? "blocked" : "complete",
          blockingReasonCodes,
          assessedAt: this.runtime.clock.now(),
        };
        this.runtime.store.impactAssessments.set(assessment.impactAssessmentId, assessment);
        recordAudit(
          this.runtime,
          "ChangeImpactAssessmentService",
          "assessChangeImpact",
          actor,
          assessment.impactAssessmentId,
          assessment.assessmentState === "complete" ? "accepted" : "blocked",
          [
            ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.change_impact_from_real_deltas,
            ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.exact_regulatory_trigger_routing,
          ],
        );
        this.runtime.store.modelChangeRequests.set(modelChangeRequest.changeRequestId, {
          ...modelChangeRequest,
          impactAssessmentRef: assessment.impactAssessmentId,
        } as ModelChangeRequest);
        return assessment;
      },
    );
  }
}

export class RFCBundleAssembler {
  public constructor(private readonly runtime: AssistiveAssuranceRuntime) {}

  public assembleRFCBundle(
    command: AssembleRFCBundleCommand,
    actor: AssistiveAssuranceActorContext,
  ): RFCBundle {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.rfcBundles,
      () => {
        const impactAssessment = requireImpactAssessment(this.runtime, command.impactAssessmentRef);
        const baseline = requireBaseline(this.runtime, command.baselineSnapshotRef);
        const approvalGraph = requireApprovalGraph(this.runtime, command.approvalGraphRef);
        const blockers: string[] = [];
        if (impactAssessment.im1RfcRequired && !command.scalDeltaRef) {
          blockers.push("scal_delta_required_for_im1_rfc");
        }
        if (impactAssessment.dcb0129DeltaRequired && !command.safetyCaseDeltaRef) {
          blockers.push("safety_case_delta_required");
        }
        if (impactAssessment.localTechnicalAssuranceRequired) {
          requireNonEmpty(command.localTechnicalAssuranceRef, "localTechnicalAssuranceRef");
        }
        if (baseline.baselineState !== "current") {
          blockers.push("assurance_baseline_not_current");
        }
        if (approvalGraph.currentApprovalState === "blocked") {
          blockers.push("approval_graph_blocked");
        }
        if (impactAssessment.assessmentState === "blocked") {
          blockers.push(...impactAssessment.blockingReasonCodes);
        }
        const rfcHash = stableAssistiveAssuranceHash({
          im1ProductRef: command.im1ProductRef,
          impactAssessmentRef: command.impactAssessmentRef,
          baselineSnapshotRef: command.baselineSnapshotRef,
          approvalGraphRef: command.approvalGraphRef,
          releaseCandidateHash: impactAssessment.releaseCandidateHash,
          blockers,
        });
        const bundle: RFCBundle = {
          rfcBundleId: command.rfcBundleId ?? `rfc-bundle:${rfcHash}`,
          im1ProductRef: command.im1ProductRef,
          changeRequestId: impactAssessment.changeRequestId,
          releaseCandidateRef: impactAssessment.releaseCandidateRef,
          releaseCandidateHash: impactAssessment.releaseCandidateHash,
          scalDeltaRef: command.scalDeltaRef ?? "not-required",
          safetyCaseDeltaRef: command.safetyCaseDeltaRef ?? "not-required",
          documentationRefs: [...(command.documentationRefs ?? [])],
          evidenceBaselineRef: baseline.baselineSnapshotId,
          approvalGraphRef: approvalGraph.approvalGraphId,
          impactAssessmentRef: impactAssessment.impactAssessmentId,
          im1RfcRequired: impactAssessment.im1RfcRequired,
          localTechnicalAssuranceRef: command.localTechnicalAssuranceRef,
          submissionState:
            blockers.length > 0
              ? "blocked"
              : impactAssessment.im1RfcRequired
                ? "ready"
                : "not_required",
          blockingReasonCodes: unique(blockers),
          expiresAt: command.expiresAt,
          assembledAt: this.runtime.clock.now(),
        };
        this.runtime.store.rfcBundles.set(bundle.rfcBundleId, bundle);
        recordAudit(
          this.runtime,
          "RFCBundleAssembler",
          "assembleRFCBundle",
          actor,
          bundle.rfcBundleId,
          bundle.submissionState === "blocked" ? "blocked" : "accepted",
          [ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.im1_not_ai_specific_technical_assurance],
        );
        return bundle;
      },
    );
  }
}

export class AssuranceBaselineSnapshotService {
  public constructor(private readonly runtime: AssistiveAssuranceRuntime) {}

  public registerSubprocessorAssurance(
    command: RegisterSubprocessorAssuranceCommand,
    actor: AssistiveAssuranceActorContext,
  ): SubprocessorAssuranceRef {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.subprocessorAssuranceRefs,
      () => {
        const ref: SubprocessorAssuranceRef = { ...command };
        this.runtime.store.subprocessorAssuranceRefs.set(ref.subprocessorRefId, ref);
        recordAudit(
          this.runtime,
          "AssuranceBaselineSnapshotService",
          "registerSubprocessorAssurance",
          actor,
          ref.subprocessorRefId,
          ref.driftState === "current" && ref.suspensionState === "active" ? "accepted" : "blocked",
          [ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.supplier_drift_opens_assurance_freeze],
        );
        return ref;
      },
    );
  }

  public pinMedicalDeviceAssessment(
    command: PinMedicalDeviceAssessmentCommand,
    actor: AssistiveAssuranceActorContext,
  ): MedicalDeviceAssessmentRef {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.medicalDeviceAssessments,
      () => {
        const ref: MedicalDeviceAssessmentRef = { ...command };
        this.runtime.store.medicalDeviceAssessments.set(ref.assessmentRefId, ref);
        recordAudit(
          this.runtime,
          "AssuranceBaselineSnapshotService",
          "pinMedicalDeviceAssessment",
          actor,
          ref.assessmentRefId,
          ref.assessmentOutcome === "blocked" ? "blocked" : "accepted",
          [ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.medical_device_boundary_reassessment_required],
        );
        return ref;
      },
    );
  }

  public pinSafetyCaseDelta(
    command: PinSafetyCaseDeltaCommand,
    actor: AssistiveAssuranceActorContext,
  ): SafetyCaseDelta {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.safetyCaseDeltas,
      () => {
        const delta: SafetyCaseDelta = { ...command };
        this.runtime.store.safetyCaseDeltas.set(delta.deltaId, delta);
        recordAudit(
          this.runtime,
          "AssuranceBaselineSnapshotService",
          "pinSafetyCaseDelta",
          actor,
          delta.deltaId,
          delta.signoffState === "blocked" ? "blocked" : "accepted",
          [ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.baseline_snapshot_pins_guidance_versions],
        );
        return delta;
      },
    );
  }

  public pinBaselineSnapshot(
    command: PinAssuranceBaselineSnapshotCommand,
    actor: AssistiveAssuranceActorContext,
  ): AssuranceBaselineSnapshot {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.baselineSnapshots,
      () => {
        for (const [field, value] of Object.entries({
          im1GuidanceVersionRef: command.im1GuidanceVersionRef,
          dtacVersionRef: command.dtacVersionRef,
          dcbStandardVersionRef: command.dcbStandardVersionRef,
          dpiaRef: command.dpiaRef,
          scalVersionRef: command.scalVersionRef,
          medicalDeviceAssessmentRef: command.medicalDeviceAssessmentRef,
          evaluationDatasetRef: command.evaluationDatasetRef,
          replayHarnessVersionRef: command.replayHarnessVersionRef,
          disclosureBaselineRef: command.disclosureBaselineRef,
          safetyCaseDeltaRef: command.safetyCaseDeltaRef,
        })) {
          requireNonEmpty(value, field);
        }
        const supplierBlockers = supplierBlockersFor(
          this.runtime,
          command.supplierAssuranceRefs ?? [],
          this.runtime.clock.now(),
        );
        const baselineState = baselineStateFor(command, supplierBlockers, this.runtime.clock.now());
        const baselineHash = stableAssistiveAssuranceHash({
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          im1GuidanceVersionRef: command.im1GuidanceVersionRef,
          dtacVersionRef: command.dtacVersionRef,
          dcbStandardVersionRef: command.dcbStandardVersionRef,
          dpiaRef: command.dpiaRef,
          scalVersionRef: command.scalVersionRef,
          medicalDeviceAssessmentRef: command.medicalDeviceAssessmentRef,
          evaluationDatasetRef: command.evaluationDatasetRef,
          replayHarnessVersionRef: command.replayHarnessVersionRef,
          supplierAssuranceRefs: command.supplierAssuranceRefs ?? [],
          disclosureBaselineRef: command.disclosureBaselineRef,
          safetyCaseDeltaRef: command.safetyCaseDeltaRef,
        });
        const snapshot: AssuranceBaselineSnapshot = {
          baselineSnapshotId: command.baselineSnapshotId ?? `assurance-baseline:${baselineHash}`,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          im1GuidanceVersionRef: command.im1GuidanceVersionRef,
          dtacVersionRef: command.dtacVersionRef,
          dcbStandardVersionRef: command.dcbStandardVersionRef,
          dpiaRef: command.dpiaRef,
          scalVersionRef: command.scalVersionRef,
          medicalDeviceAssessmentRef: command.medicalDeviceAssessmentRef,
          evaluationDatasetRef: command.evaluationDatasetRef,
          replayHarnessVersionRef: command.replayHarnessVersionRef,
          supplierAssuranceRefs: [...(command.supplierAssuranceRefs ?? [])],
          disclosureBaselineRef: command.disclosureBaselineRef,
          safetyCaseDeltaRef: command.safetyCaseDeltaRef,
          freshUntil: command.freshUntil,
          baselineState,
          supersededAt: command.supersededAt,
          baselineHash,
          blockingReasonCodes: supplierBlockers,
          pinnedAt: this.runtime.clock.now(),
        };
        this.runtime.store.baselineSnapshots.set(snapshot.baselineSnapshotId, snapshot);
        recordAudit(
          this.runtime,
          "AssuranceBaselineSnapshotService",
          "pinBaselineSnapshot",
          actor,
          snapshot.baselineSnapshotId,
          baselineState === "current" ? "accepted" : "blocked",
          [
            ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.baseline_snapshot_pins_guidance_versions,
            ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.stale_baseline_blocks_promotion,
          ],
        );
        return snapshot;
      },
    );
  }
}

export class ReleaseApprovalGraphService {
  public constructor(private readonly runtime: AssistiveAssuranceRuntime) {}

  public buildApprovalGraph(
    command: BuildReleaseApprovalGraphCommand,
    actor: AssistiveAssuranceActorContext,
  ): ReleaseApprovalGraph {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.approvalGraphs,
      () => {
        const assessment = requireImpactAssessment(this.runtime, command.impactAssessmentRef);
        const requiredApproverRoles = requiredRolesForAssessment(assessment);
        const signoffs = [...(command.signoffRefs ?? [])];
        const missingApproverRoles = requiredApproverRoles.filter(
          (role) => !signoffs.some((signoff) => signoff.role === role),
        );
        const selfApproval = signoffs.some(
          (signoff) => signoff.actorRef === command.requesterActorRef,
        );
        const independentSafetySignoff = signoffs.find(
          (signoff) => signoff.role === "independent_safety_reviewer",
        );
        const deploymentSignoff = signoffs.find(
          (signoff) => signoff.role === "deployment_approver",
        );
        const blockers: string[] = [];
        if (selfApproval) {
          blockers.push("self_approval_forbidden");
        }
        if (!independentSafetySignoff) {
          blockers.push("independent_safety_review_missing");
        }
        if (independentSafetySignoff?.actorRef === command.requesterActorRef) {
          blockers.push("independent_safety_reviewer_must_be_distinct");
        }
        if (missingApproverRoles.length > 0) {
          blockers.push(...missingApproverRoles.map((role) => `approval_missing_${role}`));
        }
        if (assessment.assessmentState === "blocked") {
          blockers.push(...assessment.blockingReasonCodes);
        }
        const graphHash = stableAssistiveAssuranceHash({
          changeRequestId: command.changeRequestId,
          releaseCandidateHash: command.releaseCandidateHash,
          requiredApproverRoles,
          signoffs,
          blockers,
        });
        const graph: ReleaseApprovalGraph = {
          approvalGraphId: command.approvalGraphId ?? `release-approval-graph:${graphHash}`,
          changeRequestId: command.changeRequestId,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          impactAssessmentRef: assessment.impactAssessmentId,
          requiredApproverRoles,
          signoffRefs: signoffs,
          noSelfApprovalState: selfApproval ? "blocked" : "satisfied",
          independentSafetyReviewerRef: independentSafetySignoff?.actorRef,
          deploymentApproverRef: deploymentSignoff?.actorRef,
          currentApprovalState:
            blockers.length === 0 && missingApproverRoles.length === 0 ? "satisfied" : "blocked",
          missingApproverRoles,
          blockingReasonCodes: unique(blockers),
          completedAt:
            blockers.length === 0 && missingApproverRoles.length === 0
              ? this.runtime.clock.now()
              : undefined,
          evaluatedAt: this.runtime.clock.now(),
        };
        this.runtime.store.approvalGraphs.set(graph.approvalGraphId, graph);
        recordAudit(
          this.runtime,
          "ReleaseApprovalGraphService",
          "buildApprovalGraph",
          actor,
          graph.approvalGraphId,
          graph.currentApprovalState === "satisfied" ? "accepted" : "blocked",
          [
            ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.no_self_approval_and_independent_safety_review,
            ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.approval_graph_covers_all_active_triggers,
          ],
        );
        return graph;
      },
    );
  }
}

export class RollbackReadinessBundleService {
  public constructor(private readonly runtime: AssistiveAssuranceRuntime) {}

  public assembleRollbackReadinessBundle(
    command: AssembleRollbackReadinessBundleCommand,
    actor: AssistiveAssuranceActorContext,
  ): RollbackReadinessBundle {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.rollbackBundles,
      () => {
        const blockers = rollbackBlockers(command);
        const bundleHash = stableAssistiveAssuranceHash({
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          rollbackTargetRef: command.rollbackTargetRef,
          dataCompatibilityState: command.dataCompatibilityState,
          policyCompatibilityState: command.policyCompatibilityState,
          runtimePublicationParityState: command.runtimePublicationParityState,
          killSwitchPlanRef: command.killSwitchPlanRef,
          operatorRunbookRef: command.operatorRunbookRef,
          verificationEvidenceRefs: command.verificationEvidenceRefs ?? [],
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
        });
        const bundle: RollbackReadinessBundle = {
          rollbackBundleId: command.rollbackBundleId ?? `rollback-readiness:${bundleHash}`,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          rollbackTargetRef: command.rollbackTargetRef,
          dataCompatibilityState: command.dataCompatibilityState,
          policyCompatibilityState: command.policyCompatibilityState,
          runtimePublicationParityState: command.runtimePublicationParityState,
          killSwitchPlanRef: command.killSwitchPlanRef,
          operatorRunbookRef: command.operatorRunbookRef,
          verificationEvidenceRefs: [...(command.verificationEvidenceRefs ?? [])],
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          bundleState: blockers.length === 0 ? "ready" : "blocked",
          blockingReasonCodes: blockers,
          bundleHash,
          assembledAt: this.runtime.clock.now(),
        };
        this.runtime.store.rollbackBundles.set(bundle.rollbackBundleId, bundle);
        recordAudit(
          this.runtime,
          "RollbackReadinessBundleService",
          "assembleRollbackReadinessBundle",
          actor,
          bundle.rollbackBundleId,
          bundle.bundleState === "ready" ? "accepted" : "blocked",
          [ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.rollback_readiness_required_for_promotion],
        );
        return bundle;
      },
    );
  }
}

export class AssuranceFreezeStateService {
  public constructor(private readonly runtime: AssistiveAssuranceRuntime) {}

  public evaluateAssuranceFreeze(
    command: EvaluateAssuranceFreezeCommand,
    actor: AssistiveAssuranceActorContext,
  ): AssuranceFreezeState {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.freezeStates,
      () => {
        const blockers = assuranceFreezeBlockers(this.runtime, command);
        const freezeHash = stableAssistiveAssuranceHash({
          scopeRef: command.scopeRef,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          triggerRef: command.triggerRef,
          blockers,
        });
        const state: AssuranceFreezeState = {
          assuranceFreezeStateId:
            command.assuranceFreezeStateId ?? `assurance-freeze:${freezeHash}`,
          scopeRef: command.scopeRef,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          baselineSnapshotRef: command.baselineSnapshotRef,
          rollbackBundleRef: command.rollbackBundleRef,
          approvalGraphRef: command.approvalGraphRef,
          freezeReasonCode: blockers[0] ?? "assurance_clear",
          triggerRef: command.triggerRef,
          activatedBy: command.activatedBy,
          activatedAt: this.runtime.clock.now(),
          liftCriteria: [
            ...(command.liftCriteria ?? []),
            "fresh_assurance_baseline",
            "supplier_assurance_current",
            "rollback_bundle_ready",
            "approval_graph_satisfied",
          ],
          freezeState: blockers.length === 0 ? "clear" : "frozen",
          blockingReasonCodes: blockers,
        };
        this.runtime.store.freezeStates.set(state.assuranceFreezeStateId, state);
        recordAudit(
          this.runtime,
          "AssuranceFreezeStateService",
          "evaluateAssuranceFreeze",
          actor,
          state.assuranceFreezeStateId,
          state.freezeState === "clear" ? "accepted" : "blocked",
          [
            ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.supplier_drift_opens_assurance_freeze,
            ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.stale_baseline_blocks_promotion,
          ],
        );
        return state;
      },
    );
  }
}

export class AssistiveReleaseActionService {
  public constructor(private readonly runtime: AssistiveAssuranceRuntime) {}

  public createReleaseAction(
    command: CreateReleaseActionCommand,
    actor: AssistiveAssuranceActorContext,
  ): AssistiveReleaseActionRecord {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.releaseActionRecords,
      () => {
        const actionTupleHash = stableAssistiveAssuranceHash({
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          baselineSnapshotRef: command.baselineSnapshotRef,
          baselineSnapshotHash: command.baselineSnapshotHash,
          rollbackBundleRef: command.rollbackBundleRef,
          rollbackBundleHash: command.rollbackBundleHash,
          approvalGraphRef: command.approvalGraphRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          uiTelemetryDisclosureBaselineRef: command.uiTelemetryDisclosureBaselineRef,
          rolloutSliceContractRef: command.rolloutSliceContractRef,
          actionType: command.actionType,
        });
        const record: AssistiveReleaseActionRecord = {
          assistiveReleaseActionRecordId:
            command.assistiveReleaseActionRecordId ?? `assistive-release-action:${actionTupleHash}`,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          baselineSnapshotRef: command.baselineSnapshotRef,
          baselineSnapshotHash: command.baselineSnapshotHash,
          rollbackBundleRef: command.rollbackBundleRef,
          rollbackBundleHash: command.rollbackBundleHash,
          approvalGraphRef: command.approvalGraphRef,
          rolloutSliceContractRef: command.rolloutSliceContractRef,
          rolloutVerdictRef: command.rolloutVerdictRef,
          actionType: command.actionType,
          routeIntentBindingRef: command.routeIntentBindingRef,
          commandActionRecordRef: command.commandActionRecordRef,
          surfaceRouteContractRef: command.surfaceRouteContractRef,
          surfacePublicationRef: command.surfacePublicationRef,
          runtimePublicationBundleRef: command.runtimePublicationBundleRef,
          uiTelemetryDisclosureBaselineRef: command.uiTelemetryDisclosureBaselineRef,
          transitionEnvelopeRef: command.transitionEnvelopeRef,
          releaseRecoveryDispositionRef: command.releaseRecoveryDispositionRef,
          actorRef: actor.actorRef,
          actionTupleHash,
          createdAt: this.runtime.clock.now(),
        };
        this.runtime.store.releaseActionRecords.set(record.assistiveReleaseActionRecordId, record);
        recordAudit(
          this.runtime,
          "AssistiveReleaseActionService",
          "createReleaseAction",
          actor,
          record.assistiveReleaseActionRecordId,
          "accepted",
          [ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.release_actions_bind_exact_candidate_hashes],
        );
        return record;
      },
    );
  }

  public settleReleaseAction(
    command: SettleReleaseActionCommand,
    actor: AssistiveAssuranceActorContext,
  ): AssistiveReleaseActionSettlement {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.releaseActionSettlements,
      () => {
        const record = requireReleaseAction(this.runtime, command.assistiveReleaseActionRecordRef);
        const baseline = requireBaseline(this.runtime, record.baselineSnapshotRef);
        const rollback = requireRollbackBundle(this.runtime, record.rollbackBundleRef);
        const approvalGraph = requireApprovalGraph(this.runtime, record.approvalGraphRef);
        const activeFreeze = command.assuranceFreezeStateRef
          ? requireFreezeState(this.runtime, command.assuranceFreezeStateRef)
          : undefined;
        const blockers = settlementBlockers(
          record,
          baseline,
          rollback,
          approvalGraph,
          activeFreeze,
        );
        const result = settlementResultFor(record.actionType, blockers, activeFreeze);
        const settlement: AssistiveReleaseActionSettlement = {
          assistiveReleaseActionSettlementId:
            command.assistiveReleaseActionSettlementId ??
            `assistive-release-action-settlement:${stableAssistiveAssuranceHash({
              action: record.assistiveReleaseActionRecordId,
              result,
              blockers,
            })}`,
          assistiveReleaseActionRecordRef: record.assistiveReleaseActionRecordId,
          commandSettlementRecordRef: command.commandSettlementRecordRef,
          uiTransitionSettlementRecordRef: command.uiTransitionSettlementRecordRef,
          uiTelemetryDisclosureFenceRef: command.uiTelemetryDisclosureFenceRef,
          presentationArtifactRef: command.presentationArtifactRef,
          result,
          recoveryActionRef: command.recoveryActionRef,
          blockingReasonCodes: blockers,
          recordedAt: this.runtime.clock.now(),
        };
        this.runtime.store.releaseActionSettlements.set(
          settlement.assistiveReleaseActionSettlementId,
          settlement,
        );
        this.runtime.store.releaseActionRecords.set(record.assistiveReleaseActionRecordId, {
          ...record,
          settledAt: settlement.recordedAt,
        });
        recordAudit(
          this.runtime,
          "AssistiveReleaseActionService",
          "settleReleaseAction",
          actor,
          settlement.assistiveReleaseActionSettlementId,
          blockers.length === 0 || record.actionType === "freeze" ? "accepted" : "blocked",
          [ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.release_actions_bind_exact_candidate_hashes],
        );
        return settlement;
      },
    );
  }
}

export class AssistiveRegulatoryEvidenceExporter {
  public constructor(private readonly runtime: AssistiveAssuranceRuntime) {}

  public exportEvidence(
    command: ExportRegulatoryEvidenceCommand,
    actor: AssistiveAssuranceActorContext,
  ): AssistiveRegulatoryEvidenceExport {
    return withIdempotency(
      this.runtime,
      command.idempotencyKey,
      this.runtime.store.evidenceExports,
      () => {
        const blockers: string[] = [];
        if (command.exportKind === "rfc_bundle" && !command.rfcBundleRef) {
          blockers.push("rfc_bundle_ref_required");
        }
        if (command.exportKind === "approval_summary" && !command.approvalGraphRef) {
          blockers.push("approval_graph_ref_required");
        }
        if (command.exportKind === "rollback_pack" && !command.rollbackBundleRef) {
          blockers.push("rollback_bundle_ref_required");
        }
        for (const [field, value] of Object.entries({
          artifactPresentationPolicyRef: command.artifactPresentationPolicyRef,
          outboundNavigationGrantRef: command.outboundNavigationGrantRef,
          presentationArtifactRef: command.presentationArtifactRef,
          repositoryArtifactRef: command.repositoryArtifactRef,
        })) {
          if (typeof value !== "string" || value.length === 0) {
            blockers.push(`${field}_required_for_governed_export`);
          }
        }
        const exportRecord: AssistiveRegulatoryEvidenceExport = {
          evidenceExportId:
            command.evidenceExportId ??
            `assistive-regulatory-evidence-export:${stableAssistiveAssuranceHash({
              exportKind: command.exportKind,
              releaseCandidateHash: command.releaseCandidateHash,
              baselineSnapshotRef: command.baselineSnapshotRef,
              rfcBundleRef: command.rfcBundleRef,
              approvalGraphRef: command.approvalGraphRef,
              rollbackBundleRef: command.rollbackBundleRef,
            })}`,
          exportKind: command.exportKind,
          releaseCandidateRef: command.releaseCandidateRef,
          releaseCandidateHash: command.releaseCandidateHash,
          rfcBundleRef: command.rfcBundleRef,
          approvalGraphRef: command.approvalGraphRef,
          rollbackBundleRef: command.rollbackBundleRef,
          baselineSnapshotRef: command.baselineSnapshotRef,
          artifactPresentationPolicyRef: command.artifactPresentationPolicyRef,
          outboundNavigationGrantRef: command.outboundNavigationGrantRef,
          presentationArtifactRef: command.presentationArtifactRef,
          repositoryArtifactRef: command.repositoryArtifactRef,
          exportState: blockers.length === 0 ? "ready" : "blocked",
          blockingReasonCodes: blockers,
          exportedAt: this.runtime.clock.now(),
        };
        this.runtime.store.evidenceExports.set(exportRecord.evidenceExportId, exportRecord);
        recordAudit(
          this.runtime,
          "AssistiveRegulatoryEvidenceExporter",
          "exportEvidence",
          actor,
          exportRecord.evidenceExportId,
          exportRecord.exportState === "ready" ? "accepted" : "blocked",
          [ASSISTIVE_ASSURANCE_INVARIANT_MARKERS.governed_evidence_exports_only],
        );
        return exportRecord;
      },
    );
  }
}

export function createAssistiveAssurancePlane(options?: {
  clock?: AssistiveAssuranceClock;
  idGenerator?: AssistiveAssuranceIdGenerator;
  store?: AssistiveAssuranceStore;
}) {
  const runtime: AssistiveAssuranceRuntime = {
    store: options?.store ?? createAssistiveAssuranceStore(),
    clock: options?.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options?.idGenerator ?? createSequentialIdGenerator(),
  };
  return {
    runtime,
    changeImpact: new ChangeImpactAssessmentService(runtime),
    rfcBundle: new RFCBundleAssembler(runtime),
    baseline: new AssuranceBaselineSnapshotService(runtime),
    approvalGraph: new ReleaseApprovalGraphService(runtime),
    rollback: new RollbackReadinessBundleService(runtime),
    assuranceFreeze: new AssuranceFreezeStateService(runtime),
    releaseAction: new AssistiveReleaseActionService(runtime),
    evidenceExporter: new AssistiveRegulatoryEvidenceExporter(runtime),
  };
}

export function createAssistiveAssuranceStore(): AssistiveAssuranceStore {
  return {
    modelChangeRequests: new Map(),
    impactAssessments: new Map(),
    rfcBundles: new Map(),
    subprocessorAssuranceRefs: new Map(),
    medicalDeviceAssessments: new Map(),
    safetyCaseDeltas: new Map(),
    baselineSnapshots: new Map(),
    approvalGraphs: new Map(),
    rollbackBundles: new Map(),
    freezeStates: new Map(),
    releaseActionRecords: new Map(),
    releaseActionSettlements: new Map(),
    evidenceExports: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
  };
}

export function stableAssistiveAssuranceHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex")
    .slice(0, 32);
}

function materializeModelChangeRequest(
  runtime: AssistiveAssuranceRuntime,
  command: AssessChangeImpactCommand,
): ModelChangeRequest {
  const existing = runtime.store.modelChangeRequests.get(command.changeRequestId);
  if (existing) {
    return existing;
  }
  const requestHash = stableAssistiveAssuranceHash({
    changeRequestId: command.changeRequestId,
    capabilityCode: command.capabilityCode,
    changeClass: command.changeClass,
    currentVersionRef: command.currentVersionRef,
    proposedVersionRef: command.proposedVersionRef,
    releaseCandidateRef: command.releaseCandidateRef,
    requestedBy: command.requestedBy,
  });
  return {
    changeRequestId: command.changeRequestId,
    capabilityCode: command.capabilityCode,
    changeClass: command.changeClass,
    currentVersionRef: command.currentVersionRef,
    proposedVersionRef: command.proposedVersionRef,
    releaseCandidateRef: command.releaseCandidateRef,
    requestedBy: command.requestedBy,
    requestedAt: runtime.clock.now(),
    requestHash,
  };
}

function regulatoryFlagsFor(command: AssessChangeImpactCommand) {
  const materialSurface =
    (command.surfaceDeltaRefs?.length ?? 0) > 0 ||
    (command.surfacePublicationDeltaRefs?.length ?? 0) > 0 ||
    command.patientFacingWordingDelta === true;
  const workflowOrRollout =
    command.workflowDecisionDelta === true ||
    command.rolloutLadderDelta === true ||
    (command.rolloutSliceDeltaRefs?.length ?? 0) > 0;
  const medicalBoundary =
    command.medicalPurposeBoundaryState ===
      "endpoint_suggestion_clinically_consequential_decision_support" ||
    command.medicalPurposeBoundaryState === "regulatory_posture_change";
  const significantFunctionalEnhancement =
    command.changeClass === "capability_expansion" ||
    command.changeClass === "intended_use" ||
    command.changeClass === "regulatory_posture" ||
    command.changeClass === "model_version" ||
    workflowOrRollout ||
    command.artifactDeliveryDelta === true;

  return {
    im1RfcRequired: significantFunctionalEnhancement,
    scalUpdateRequired: significantFunctionalEnhancement,
    dtacDeltaRequired:
      command.changeClass !== "copy_template_only" ||
      materialSurface ||
      command.uiTelemetryDisclosureDelta === true,
    dcb0129DeltaRequired:
      command.changeClass !== "copy_template_only" ||
      workflowOrRollout ||
      medicalBoundary ||
      command.artifactDeliveryDelta === true,
    dcb0160DependencyNoteRequired: workflowOrRollout || medicalBoundary || materialSurface,
    dpiaDeltaRequired:
      command.changeClass === "subprocessor_or_inference_host" ||
      command.uiTelemetryDisclosureDelta === true ||
      command.artifactDeliveryDelta === true ||
      command.changeClass === "model_version" ||
      command.changeClass === "capability_expansion",
    mhraAssessmentRequired:
      medicalBoundary ||
      command.changeClass === "intended_use" ||
      command.changeClass === "regulatory_posture",
    medicalDeviceReassessmentRequired:
      medicalBoundary ||
      command.intendedUseDelta === true ||
      command.changeClass === "intended_use" ||
      command.changeClass === "regulatory_posture",
    evaluationRerunRequired:
      command.changeClass === "prompt_or_threshold" ||
      command.changeClass === "model_version" ||
      command.changeClass === "capability_expansion" ||
      workflowOrRollout,
    replayProofRequired:
      command.changeClass !== "copy_template_only" ||
      command.workflowDecisionDelta === true ||
      command.artifactDeliveryDelta === true,
    rollbackProofRequired:
      command.changeClass !== "copy_template_only" ||
      workflowOrRollout ||
      command.artifactDeliveryDelta === true,
    localTechnicalAssuranceRequired:
      command.changeClass !== "copy_template_only" ||
      command.medicalPurposeBoundaryState !== "transcription_documentation_assistance",
  };
}

function impactBlockers(command: AssessChangeImpactCommand): string[] {
  const blockers: string[] = [];
  if (command.medicalPurposeBoundaryState === "unknown") {
    blockers.push("medical_purpose_boundary_unknown");
  }
  if (
    command.changeClass === "copy_template_only" &&
    ((command.workflowDecisionDelta ?? false) ||
      (command.rolloutLadderDelta ?? false) ||
      (command.rolloutSliceDeltaRefs?.length ?? 0) > 0 ||
      (command.patientFacingWordingDelta ?? false) ||
      (command.intendedUseDelta ?? false) ||
      command.medicalPurposeBoundaryState !== "transcription_documentation_assistance")
  ) {
    blockers.push("copy_template_only_claim_has_material_delta");
  }
  if (command.candidateHashStable === false && command.changeClass === "copy_template_only") {
    blockers.push("copy_template_only_requires_stable_candidate_hash");
  }
  return unique(blockers);
}

function baselineStateFor(
  command: PinAssuranceBaselineSnapshotCommand,
  supplierBlockers: readonly string[],
  now: ISODateString,
): BaselineState {
  if (command.supersededAt) {
    return "superseded";
  }
  if (command.freshUntil <= now || supplierBlockers.length > 0) {
    return "stale";
  }
  return "current";
}

function supplierBlockersFor(
  runtime: AssistiveAssuranceRuntime,
  supplierAssuranceRefs: readonly string[],
  now: ISODateString,
): string[] {
  const blockers: string[] = [];
  for (const ref of supplierAssuranceRefs) {
    const supplier = runtime.store.subprocessorAssuranceRefs.get(ref);
    if (!supplier) {
      blockers.push(`supplier_assurance_missing:${ref}`);
      continue;
    }
    if (supplier.assuranceFreshUntil <= now) {
      blockers.push(`supplier_assurance_stale:${ref}`);
    }
    if (supplier.driftState !== "current") {
      blockers.push(`supplier_assurance_${supplier.driftState}:${ref}`);
    }
    if (supplier.suspensionState !== "active") {
      blockers.push(`supplier_assurance_${supplier.suspensionState}:${ref}`);
    }
  }
  return unique(blockers);
}

function requiredRolesForAssessment(
  assessment: ChangeImpactAssessment,
): AssistiveAssuranceActorRole[] {
  const roles: AssistiveAssuranceActorRole[] = [
    "product_owner",
    "deployment_approver",
    "independent_safety_reviewer",
  ];
  if (assessment.dcb0129DeltaRequired || assessment.medicalDeviceReassessmentRequired) {
    roles.push("clinical_safety_officer");
  }
  if (assessment.dpiaDeltaRequired) {
    roles.push("information_governance_lead");
  }
  if (
    assessment.im1RfcRequired ||
    assessment.dtacDeltaRequired ||
    assessment.mhraAssessmentRequired
  ) {
    roles.push("regulatory_owner");
  }
  if (assessment.rollbackProofRequired) {
    roles.push("rollback_owner");
  }
  return unique(roles);
}

function rollbackBlockers(command: AssembleRollbackReadinessBundleCommand): string[] {
  const blockers: string[] = [];
  if (!command.rollbackTargetRef) {
    blockers.push("rollback_target_missing");
  }
  if (command.dataCompatibilityState !== "compatible") {
    blockers.push("data_compatibility_not_proven");
  }
  if (command.policyCompatibilityState !== "compatible") {
    blockers.push("policy_compatibility_not_proven");
  }
  if (command.runtimePublicationParityState !== "exact") {
    blockers.push("runtime_publication_parity_not_exact");
  }
  if (!command.killSwitchPlanRef) {
    blockers.push("kill_switch_plan_missing");
  }
  if (!command.operatorRunbookRef) {
    blockers.push("operator_runbook_missing");
  }
  if ((command.verificationEvidenceRefs?.length ?? 0) === 0) {
    blockers.push("rollback_verification_evidence_missing");
  }
  if (!command.releaseRecoveryDispositionRef) {
    blockers.push("release_recovery_disposition_missing");
  }
  return unique(blockers);
}

function assuranceFreezeBlockers(
  runtime: AssistiveAssuranceRuntime,
  command: EvaluateAssuranceFreezeCommand,
): string[] {
  const blockers: string[] = [];
  if (command.baselineSnapshotRef) {
    const baseline = requireBaseline(runtime, command.baselineSnapshotRef);
    if (baseline.baselineState !== "current") {
      blockers.push(`assurance_baseline_${baseline.baselineState}`);
    }
    blockers.push(...baseline.blockingReasonCodes);
  }
  if (command.rollbackBundleRef) {
    const rollback = requireRollbackBundle(runtime, command.rollbackBundleRef);
    if (rollback.bundleState !== "ready") {
      blockers.push("rollback_bundle_not_ready");
    }
    blockers.push(...rollback.blockingReasonCodes);
  }
  if (command.approvalGraphRef) {
    const approvalGraph = requireApprovalGraph(runtime, command.approvalGraphRef);
    if (approvalGraph.currentApprovalState !== "satisfied") {
      blockers.push("approval_graph_not_satisfied");
    }
    blockers.push(...approvalGraph.blockingReasonCodes);
  }
  blockers.push(
    ...supplierBlockersFor(runtime, command.supplierAssuranceRefs ?? [], runtime.clock.now()),
  );
  return unique(blockers);
}

function settlementBlockers(
  record: AssistiveReleaseActionRecord,
  baseline: AssuranceBaselineSnapshot,
  rollback: RollbackReadinessBundle,
  approvalGraph: ReleaseApprovalGraph,
  activeFreeze?: AssuranceFreezeState,
): string[] {
  const blockers: string[] = [];
  if (baseline.releaseCandidateHash !== record.releaseCandidateHash) {
    blockers.push("baseline_candidate_hash_mismatch");
  }
  if (rollback.releaseCandidateHash !== record.releaseCandidateHash) {
    blockers.push("rollback_candidate_hash_mismatch");
  }
  if (approvalGraph.releaseCandidateHash !== record.releaseCandidateHash) {
    blockers.push("approval_candidate_hash_mismatch");
  }
  if (record.baselineSnapshotHash !== baseline.baselineHash) {
    blockers.push("baseline_snapshot_hash_mismatch");
  }
  if (record.rollbackBundleHash !== rollback.bundleHash) {
    blockers.push("rollback_bundle_hash_mismatch");
  }
  if (record.actionType === "promote" || record.actionType === "approve") {
    if (baseline.baselineState !== "current") {
      blockers.push(`baseline_${baseline.baselineState}`);
    }
    if (approvalGraph.currentApprovalState !== "satisfied") {
      blockers.push("approval_graph_not_satisfied");
    }
    if (rollback.bundleState !== "ready") {
      blockers.push("rollback_bundle_not_ready");
    }
  }
  if (record.actionType === "promote" && activeFreeze && activeFreeze.freezeState === "frozen") {
    blockers.push("assurance_freeze_active");
    blockers.push(...activeFreeze.blockingReasonCodes);
  }
  return unique(blockers);
}

function settlementResultFor(
  actionType: ReleaseActionType,
  blockers: readonly string[],
  activeFreeze?: AssuranceFreezeState,
): ReleaseActionSettlementResult {
  if (actionType === "freeze") {
    return "frozen";
  }
  if (actionType === "rollback") {
    return blockers.length > 0 ? "stale_recoverable" : "rollback_started";
  }
  if (blockers.length > 0) {
    return activeFreeze?.freezeState === "frozen" ? "stale_recoverable" : "blocked_policy";
  }
  if (actionType === "approve") {
    return "approved";
  }
  if (actionType === "promote") {
    return "promoted";
  }
  if (actionType === "unfreeze") {
    return "unfrozen";
  }
  return "failed";
}

function requireImpactAssessment(
  runtime: AssistiveAssuranceRuntime,
  ref: string,
): ChangeImpactAssessment {
  const assessment = runtime.store.impactAssessments.get(ref);
  if (!assessment) {
    throw new Error(`Unknown ChangeImpactAssessment ${ref}.`);
  }
  return assessment;
}

function requireBaseline(
  runtime: AssistiveAssuranceRuntime,
  ref: string,
): AssuranceBaselineSnapshot {
  const baseline = runtime.store.baselineSnapshots.get(ref);
  if (!baseline) {
    throw new Error(`Unknown AssuranceBaselineSnapshot ${ref}.`);
  }
  return baseline;
}

function requireApprovalGraph(
  runtime: AssistiveAssuranceRuntime,
  ref: string,
): ReleaseApprovalGraph {
  const graph = runtime.store.approvalGraphs.get(ref);
  if (!graph) {
    throw new Error(`Unknown ReleaseApprovalGraph ${ref}.`);
  }
  return graph;
}

function requireRollbackBundle(
  runtime: AssistiveAssuranceRuntime,
  ref: string,
): RollbackReadinessBundle {
  const bundle = runtime.store.rollbackBundles.get(ref);
  if (!bundle) {
    throw new Error(`Unknown RollbackReadinessBundle ${ref}.`);
  }
  return bundle;
}

function requireFreezeState(runtime: AssistiveAssuranceRuntime, ref: string): AssuranceFreezeState {
  const state = runtime.store.freezeStates.get(ref);
  if (!state) {
    throw new Error(`Unknown AssuranceFreezeState ${ref}.`);
  }
  return state;
}

function requireReleaseAction(
  runtime: AssistiveAssuranceRuntime,
  ref: string,
): AssistiveReleaseActionRecord {
  const record = runtime.store.releaseActionRecords.get(ref);
  if (!record) {
    throw new Error(`Unknown AssistiveReleaseActionRecord ${ref}.`);
  }
  return record;
}

function withIdempotency<T>(
  runtime: AssistiveAssuranceRuntime,
  idempotencyKey: string | undefined,
  targetStore: Map<string, T>,
  create: () => T,
): T {
  if (idempotencyKey) {
    const existingId = runtime.store.idempotencyKeys.get(idempotencyKey);
    if (existingId) {
      const existing = targetStore.get(existingId);
      if (existing) {
        return existing;
      }
    }
  }
  const created = create();
  if (idempotencyKey) {
    const id = firstStringValueEndingInId(created);
    if (id) {
      runtime.store.idempotencyKeys.set(idempotencyKey, id);
    }
  }
  return created;
}

function firstStringValueEndingInId(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key.endsWith("Id") && typeof entry === "string") {
      return entry;
    }
  }
  return undefined;
}

function recordAudit(
  runtime: AssistiveAssuranceRuntime,
  serviceName: string,
  action: string,
  actor: AssistiveAssuranceActorContext,
  subjectRef: string,
  outcome: AssistiveAssuranceAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("assistive-assurance-audit"),
    serviceName,
    action,
    actorRef: actor.actorRef,
    actorRole: actor.actorRole,
    routeIntentBindingRef: actor.routeIntentBindingRef,
    auditCorrelationId: actor.auditCorrelationId,
    purposeOfUse: actor.purposeOfUse,
    subjectRef,
    outcome,
    reasonCodes: [...reasonCodes],
    recordedAt: runtime.clock.now(),
  });
}

function requireNonEmpty(value: unknown, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function createSequentialIdGenerator(): AssistiveAssuranceIdGenerator {
  let counter = 0;
  return {
    next(prefix: string) {
      counter += 1;
      return `${prefix}:${counter}`;
    },
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

function unique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
