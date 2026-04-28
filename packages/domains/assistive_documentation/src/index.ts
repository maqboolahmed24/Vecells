import { createHash } from "node:crypto";

export type ISODateString = string;

export type DocumentationActorRole =
  | "documentation_composer"
  | "clinical_reviewer"
  | "clinical_safety_lead"
  | "artifact_presentation_worker"
  | "calibration_release_manager"
  | "system";

export type DraftFamily =
  | "triage_summary"
  | "clinician_note_draft"
  | "patient_message_draft"
  | "callback_summary"
  | "pharmacy_or_booking_handoff_summary";

export type DraftSectionState = "rendered" | "abstained" | "missing_info";
export type AbstentionState = "none" | "partial" | "full";
export type ConfidenceDescriptor = "suppressed" | "insufficient" | "guarded" | "supported" | "strong";
export type DraftState = "candidate" | "renderable" | "partial_abstention" | "full_abstention" | "blocked" | "revoked";
export type ReviewState = "draft_pending_review" | "reviewed" | "rejected" | "blocked" | "superseded";
export type TemplateApprovalState = "draft" | "approved" | "revoked";
export type TemplateConformanceState = "conformant" | "non_conformant" | "not_checked";
export type CalibrationWindowState = "validated" | "missing" | "expired" | "invalid";
export type DocumentationPresentationArtifactState =
  | "summary_only"
  | "inline_renderable"
  | "external_handoff_ready"
  | "recovery_only"
  | "blocked"
  | "revoked";

export interface DocumentationActorContext {
  actorRef: string;
  actorRole: DocumentationActorRole;
  purposeOfUse: string;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
}

export interface DocumentationAuditRecord {
  auditRecordId: string;
  serviceName: string;
  action: string;
  actorRef: string;
  actorRole: DocumentationActorRole;
  routeIntentBindingRef: string;
  auditCorrelationId: string;
  purposeOfUse: string;
  subjectRef: string;
  outcome: "accepted" | "blocked" | "failed_closed";
  reasonCodes: readonly string[];
  recordedAt: ISODateString;
}

export interface DocumentationContextSnapshot {
  contextSnapshotId: string;
  requestRef: string;
  taskRef: string;
  reviewBundleRef: string;
  transcriptRefs: readonly string[];
  attachmentRefs: readonly string[];
  historyRefs: readonly string[];
  templateRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  contextHash: string;
  contextState: "frozen";
  createdAt: ISODateString;
}

export interface DraftTemplate {
  draftTemplateId: string;
  draftFamily: DraftFamily;
  approvedTemplateVersionRef: string;
  approvedState: TemplateApprovalState;
  requiredSectionTypes: readonly string[];
  optionalSectionTypes: readonly string[];
  calibrationProfileRef: string;
  artifactPresentationContractRef: string;
  createdAt: ISODateString;
}

export interface ConfidenceBucket {
  descriptor: Exclude<ConfidenceDescriptor, "suppressed">;
  minScore: number;
}

export interface DocumentationCalibrationBundle {
  calibrationBundleId: string;
  calibrationProfileRef: string;
  releaseCohortRef: string;
  watchTupleRef: string;
  calibrationVersion: string;
  validatedWindowState: CalibrationWindowState;
  cDocRender: number;
  thetaDocRender: number;
  lambdaConflict: number;
  lambdaUnsupported: number;
  lambdaMissing: number;
  buckets: readonly ConfidenceBucket[];
  visibleConfidenceAllowed: boolean;
  createdAt: ISODateString;
}

export interface EvidenceMapSet {
  evidenceMapSetId: string;
  artifactRef: string;
  artifactRevisionRef: string;
  contextSnapshotId: string;
  mapHash: string;
  mapState: "immutable";
  createdAt: ISODateString;
}

export interface EvidenceMap {
  evidenceMapId: string;
  evidenceMapSetRef: string;
  outputSpanRef: string;
  sourceEvidenceRefs: readonly string[];
  supportWeight: number;
  requiredWeight: number;
  supportStrength: ConfidenceDescriptor;
}

export interface ContradictionFlag {
  flagRef: string;
  outputSpanRef?: string;
  reasonCode: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface UnsupportedAssertionFlag {
  flagRef: string;
  outputSpanRef?: string;
  assertionRef: string;
  reasonCode: string;
}

export interface ContradictionCheckResult {
  checkResultId: string;
  artifactRef: string;
  contradictionFlags: readonly ContradictionFlag[];
  unsupportedAssertionFlags: readonly UnsupportedAssertionFlag[];
  templateConformanceState: TemplateConformanceState;
  unsupportedAssertionRate: number;
  riskScore: number;
  createdAt: ISODateString;
}

export interface DraftSection {
  sectionId: string;
  sectionType: string;
  sectionState: DraftSectionState;
  generatedTextRef?: string;
  outputSpanRef: string;
  evidenceSpanRefs: readonly string[];
  missingInfoFlags: readonly string[];
  supportProbability: number;
  evidenceCoverage: number;
  unsupportedAssertionRisk: number;
  confidenceDescriptor: ConfidenceDescriptor;
}

export interface DraftNoteArtifact {
  draftNoteId: string;
  draftFamily: DraftFamily;
  contextSnapshotId: string;
  templateRef: string;
  artifactRevisionRef: string;
  sectionRefs: readonly string[];
  overallConfidenceDescriptor: ConfidenceDescriptor;
  minimumSectionSupport: number;
  unsupportedAssertionRisk: number;
  abstentionState: AbstentionState;
  calibrationVersion: string;
  calibrationBundleRef: string;
  releaseCohortRef: string;
  watchTupleRef: string;
  evidenceMapSetRef: string;
  contradictionCheckResultRef: string;
  artifactPresentationContractRef: string;
  visibleConfidenceAllowed: boolean;
  draftState: DraftState;
  reviewState: ReviewState;
  createdAt: ISODateString;
}

export interface MessageDraftArtifact {
  messageDraftId: string;
  contextSnapshotId: string;
  messageType: DraftFamily;
  artifactRevisionRef: string;
  bodyRef?: string;
  outputSpanRef: string;
  supportProbability: number;
  evidenceCoverage: number;
  unsupportedAssertionRisk: number;
  abstentionState: AbstentionState;
  calibrationVersion: string;
  calibrationBundleRef: string;
  releaseCohortRef: string;
  watchTupleRef: string;
  evidenceMapSetRef: string;
  contradictionCheckResultRef: string;
  artifactPresentationContractRef: string;
  confidenceDescriptor: ConfidenceDescriptor;
  visibleConfidenceAllowed: boolean;
  reviewState: ReviewState;
  createdAt: ISODateString;
}

export interface DocumentationPresentationArtifact {
  documentationPresentationArtifactId: string;
  artifactRef: string;
  artifactKind: "draft_note" | "message_draft";
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  artifactState: DocumentationPresentationArtifactState;
  blockingReasonCodes: readonly string[];
  createdAt: ISODateString;
}

export interface AssistiveDocumentationStore {
  contextSnapshots: Map<string, DocumentationContextSnapshot>;
  templates: Map<string, DraftTemplate>;
  calibrationBundles: Map<string, DocumentationCalibrationBundle>;
  evidenceMapSets: Map<string, EvidenceMapSet>;
  evidenceMaps: Map<string, EvidenceMap>;
  contradictionChecks: Map<string, ContradictionCheckResult>;
  draftSections: Map<string, DraftSection>;
  draftNotes: Map<string, DraftNoteArtifact>;
  messageDrafts: Map<string, MessageDraftArtifact>;
  presentationArtifacts: Map<string, DocumentationPresentationArtifact>;
  auditRecords: DocumentationAuditRecord[];
  idempotencyKeys: Map<string, string>;
}

export interface DocumentationClock {
  now(): ISODateString;
}

export interface DocumentationIdGenerator {
  next(prefix: string): string;
}

export interface CreateDocumentationContextSnapshotCommand {
  requestRef: string;
  taskRef: string;
  reviewBundleRef: string;
  transcriptRefs: readonly string[];
  attachmentRefs?: readonly string[];
  historyRefs?: readonly string[];
  templateRef: string;
  reviewVersionRef: string;
  decisionEpochRef: string;
  policyBundleRef: string;
  lineageFenceEpoch: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  rawContextText?: string;
  idempotencyKey?: string;
}

export interface RegisterDraftTemplateCommand {
  draftTemplateId: string;
  draftFamily: DraftFamily;
  approvedTemplateVersionRef: string;
  approvedState: TemplateApprovalState;
  requiredSectionTypes: readonly string[];
  optionalSectionTypes?: readonly string[];
  calibrationProfileRef: string;
  artifactPresentationContractRef: string;
  idempotencyKey?: string;
}

export interface RegisterDocumentationCalibrationBundleCommand {
  calibrationBundleId: string;
  calibrationProfileRef: string;
  releaseCohortRef: string;
  watchTupleRef: string;
  calibrationVersion: string;
  validatedWindowState: CalibrationWindowState;
  cDocRender: number;
  thetaDocRender: number;
  lambdaConflict: number;
  lambdaUnsupported: number;
  lambdaMissing: number;
  buckets: readonly ConfidenceBucket[];
  visibleConfidenceAllowed: boolean;
  idempotencyKey?: string;
}

export interface EvidenceMapRowInput {
  outputSpanRef: string;
  sourceEvidenceRefs: readonly string[];
  supportWeight: number;
  requiredWeight: number;
  supportStrength: ConfidenceDescriptor;
}

export interface CreateEvidenceMapSetCommand {
  artifactRef: string;
  artifactRevisionRef: string;
  contextSnapshotId: string;
  rows: readonly EvidenceMapRowInput[];
  idempotencyKey?: string;
}

export interface RecordContradictionCheckCommand {
  artifactRef: string;
  contradictionFlags?: readonly ContradictionFlag[];
  unsupportedAssertionFlags?: readonly UnsupportedAssertionFlag[];
  templateConformanceState: TemplateConformanceState;
  unsupportedAssertionRate: number;
  riskScore: number;
  idempotencyKey?: string;
}

export interface CalibratedVerifierOutput {
  outputSpanRef: string;
  calibratedSupportProbability: number;
  supportProbabilitySource: "verifier_calibrated" | "rule_verifier";
  decoderProbability?: never;
}

export interface DraftSectionInput {
  sectionType: string;
  outputSpanRef: string;
  generatedTextRef: string;
  rawSectionText?: string;
}

export interface ComposeDraftNoteCommand {
  contextSnapshotId: string;
  draftFamily: DraftFamily;
  artifactRevisionRef: string;
  calibrationBundleRef: string;
  sections: readonly DraftSectionInput[];
  verifierOutputs: readonly CalibratedVerifierOutput[];
  evidenceRows?: readonly EvidenceMapRowInput[];
  evidenceMapSetRef?: string;
  contradictionCheckResultRef?: string;
  contradictionFlags?: readonly ContradictionFlag[];
  unsupportedAssertionFlags?: readonly UnsupportedAssertionFlag[];
  templateConformanceState?: TemplateConformanceState;
  unsupportedAssertionRate?: number;
  contradictionRiskScore?: number;
  activeReleaseCohortRef?: string;
  activeWatchTupleRef?: string;
  draftNoteRef?: string;
  rawDraftText?: string;
  idempotencyKey?: string;
}

export interface ComposeMessageDraftCommand {
  contextSnapshotId: string;
  messageType: DraftFamily;
  artifactRevisionRef: string;
  calibrationBundleRef: string;
  bodyRef: string;
  outputSpanRef: string;
  verifierOutput: CalibratedVerifierOutput;
  evidenceRows?: readonly EvidenceMapRowInput[];
  evidenceMapSetRef?: string;
  contradictionCheckResultRef?: string;
  contradictionFlags?: readonly ContradictionFlag[];
  unsupportedAssertionFlags?: readonly UnsupportedAssertionFlag[];
  templateConformanceState?: TemplateConformanceState;
  unsupportedAssertionRate?: number;
  contradictionRiskScore?: number;
  activeReleaseCohortRef?: string;
  activeWatchTupleRef?: string;
  messageDraftRef?: string;
  rawBodyText?: string;
  idempotencyKey?: string;
}

export interface GenerateDocumentationPresentationCommand {
  artifactRef: string;
  artifactKind: "draft_note" | "message_draft";
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef?: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  requestedArtifactState?: DocumentationPresentationArtifactState;
  rawExternalUrl?: string;
  directWritebackTargetRef?: string;
  idempotencyKey?: string;
}

interface DocumentationRuntime {
  store: AssistiveDocumentationStore;
  clock: DocumentationClock;
  idGenerator: DocumentationIdGenerator;
}

interface ResolvedCalibration {
  bundle: DocumentationCalibrationBundle;
  confidenceDisplayAllowed: boolean;
  shadowOnlyReasonCodes: readonly string[];
}

export class AssistiveDocumentationError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly reasonCodes: readonly string[] = [],
  ) {
    super(message);
    this.name = "AssistiveDocumentationError";
  }
}

export const assistiveDocumentationServiceNames = [
  "DocumentationContextSnapshotService",
  "DraftComposerOrchestrator",
  "DraftTemplateResolver",
  "DraftNoteArtifactService",
  "MessageDraftArtifactService",
  "EvidenceMapService",
  "ContradictionCheckEngine",
  "DocumentationCalibrationResolver",
] as const;

export const supportedDraftFamilies: readonly DraftFamily[] = [
  "triage_summary",
  "clinician_note_draft",
  "patient_message_draft",
  "callback_summary",
  "pharmacy_or_booking_handoff_summary",
] as const;

export function createAssistiveDocumentationStore(): AssistiveDocumentationStore {
  return {
    contextSnapshots: new Map(),
    templates: new Map(),
    calibrationBundles: new Map(),
    evidenceMapSets: new Map(),
    evidenceMaps: new Map(),
    contradictionChecks: new Map(),
    draftSections: new Map(),
    draftNotes: new Map(),
    messageDrafts: new Map(),
    presentationArtifacts: new Map(),
    auditRecords: [],
    idempotencyKeys: new Map(),
  };
}

export function createDeterministicDocumentationIdGenerator(): DocumentationIdGenerator {
  const counters = new Map<string, number>();
  return {
    next(prefix: string): string {
      const nextValue = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, nextValue);
      return `${prefix}_${String(nextValue).padStart(6, "0")}`;
    },
  };
}

export function stableDocumentationHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export class DocumentationContextSnapshotService {
  public constructor(private readonly runtime: DocumentationRuntime) {}

  public createContextSnapshot(
    command: CreateDocumentationContextSnapshotCommand,
    actor: DocumentationActorContext,
  ): DocumentationContextSnapshot {
    requireRole(actor, ["documentation_composer", "clinical_reviewer", "system"], "DOCUMENTATION_CONTEXT_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "documentation_context_snapshot", command.idempotencyKey, this.runtime.store.contextSnapshots);
    if (existing) {
      return existing;
    }
    if (command.rawContextText) {
      throw new AssistiveDocumentationError("DOCUMENTATION_RAW_CONTEXT_FORBIDDEN", "Context snapshots store refs and hashes, not raw clinical text.", [
        "raw_context_text_forbidden",
      ]);
    }
    for (const ref of [
      command.requestRef,
      command.taskRef,
      command.reviewBundleRef,
      command.templateRef,
      command.reviewVersionRef,
      command.decisionEpochRef,
      command.policyBundleRef,
      command.lineageFenceEpoch,
      command.surfaceRouteContractRef,
      command.surfacePublicationRef,
      command.runtimePublicationBundleRef,
    ]) {
      requireFrozenReference(ref);
    }
    requireNonEmptyArray(command.transcriptRefs, "transcriptRefs");
    const attachmentRefs = command.attachmentRefs ?? [];
    const historyRefs = command.historyRefs ?? [];
    validateFrozenReferences(command.transcriptRefs, "transcriptRefs");
    validateFrozenReferences(attachmentRefs, "attachmentRefs");
    validateFrozenReferences(historyRefs, "historyRefs");
    const contextHash = stableDocumentationHash({
      requestRef: command.requestRef,
      taskRef: command.taskRef,
      reviewBundleRef: command.reviewBundleRef,
      transcriptRefs: command.transcriptRefs,
      attachmentRefs,
      historyRefs,
      templateRef: command.templateRef,
      reviewVersionRef: command.reviewVersionRef,
      decisionEpochRef: command.decisionEpochRef,
      policyBundleRef: command.policyBundleRef,
      lineageFenceEpoch: command.lineageFenceEpoch,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
    });
    const snapshot: DocumentationContextSnapshot = Object.freeze({
      contextSnapshotId: this.runtime.idGenerator.next("documentation_context"),
      requestRef: command.requestRef,
      taskRef: command.taskRef,
      reviewBundleRef: command.reviewBundleRef,
      transcriptRefs: Object.freeze([...command.transcriptRefs]),
      attachmentRefs: Object.freeze([...attachmentRefs]),
      historyRefs: Object.freeze([...historyRefs]),
      templateRef: command.templateRef,
      reviewVersionRef: command.reviewVersionRef,
      decisionEpochRef: command.decisionEpochRef,
      policyBundleRef: command.policyBundleRef,
      lineageFenceEpoch: command.lineageFenceEpoch,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      contextHash,
      contextState: "frozen",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.contextSnapshots.set(snapshot.contextSnapshotId, snapshot);
    setIdempotent(this.runtime, "documentation_context_snapshot", command.idempotencyKey, snapshot.contextSnapshotId);
    writeAudit(this.runtime, "DocumentationContextSnapshotService", "createContextSnapshot", actor, snapshot.contextSnapshotId, "accepted", []);
    return snapshot;
  }
}

export class DraftTemplateResolver {
  public constructor(private readonly runtime: DocumentationRuntime) {}

  public registerTemplate(command: RegisterDraftTemplateCommand, actor: DocumentationActorContext): DraftTemplate {
    requireRole(actor, ["documentation_composer", "clinical_safety_lead", "system"], "DOCUMENTATION_TEMPLATE_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "documentation_template", command.idempotencyKey, this.runtime.store.templates);
    if (existing) {
      return existing;
    }
    requireNonEmpty(command.draftTemplateId, "draftTemplateId");
    assertSupportedDraftFamily(command.draftFamily);
    requireFrozenReference(command.approvedTemplateVersionRef);
    requireNonEmptyArray(command.requiredSectionTypes, "requiredSectionTypes");
    requireFrozenReference(command.calibrationProfileRef);
    requireFrozenReference(command.artifactPresentationContractRef);
    const optionalSectionTypes = command.optionalSectionTypes ?? [];
    const duplicateSections = findDuplicates([...command.requiredSectionTypes, ...optionalSectionTypes]);
    if (duplicateSections.length > 0) {
      throw new AssistiveDocumentationError("DOCUMENTATION_TEMPLATE_DUPLICATE_SECTION", "Template sections must be unique.", duplicateSections);
    }
    const template: DraftTemplate = Object.freeze({
      draftTemplateId: command.draftTemplateId,
      draftFamily: command.draftFamily,
      approvedTemplateVersionRef: command.approvedTemplateVersionRef,
      approvedState: command.approvedState,
      requiredSectionTypes: Object.freeze([...command.requiredSectionTypes]),
      optionalSectionTypes: Object.freeze([...optionalSectionTypes]),
      calibrationProfileRef: command.calibrationProfileRef,
      artifactPresentationContractRef: command.artifactPresentationContractRef,
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.templates.set(template.draftTemplateId, template);
    setIdempotent(this.runtime, "documentation_template", command.idempotencyKey, template.draftTemplateId);
    writeAudit(this.runtime, "DraftTemplateResolver", "registerTemplate", actor, template.draftTemplateId, "accepted", []);
    return template;
  }

  public resolveTemplate(templateRef: string, draftFamily?: DraftFamily): DraftTemplate {
    const template = requireFromMap(this.runtime.store.templates, templateRef, "DOCUMENTATION_TEMPLATE_NOT_FOUND");
    if (template.approvedState !== "approved") {
      throw new AssistiveDocumentationError("DOCUMENTATION_TEMPLATE_NOT_APPROVED", "Drafts require an approved structured template.", [
        "approved_template_required",
      ]);
    }
    if (draftFamily && template.draftFamily !== draftFamily) {
      throw new AssistiveDocumentationError("DOCUMENTATION_TEMPLATE_FAMILY_MISMATCH", "Template family does not match requested draft type.", [
        "template_family_mismatch",
      ]);
    }
    return template;
  }
}

export class DocumentationCalibrationResolver {
  public constructor(private readonly runtime: DocumentationRuntime) {}

  public registerCalibrationBundle(
    command: RegisterDocumentationCalibrationBundleCommand,
    actor: DocumentationActorContext,
  ): DocumentationCalibrationBundle {
    requireRole(actor, ["calibration_release_manager", "clinical_safety_lead", "system"], "DOCUMENTATION_CALIBRATION_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "documentation_calibration", command.idempotencyKey, this.runtime.store.calibrationBundles);
    if (existing) {
      return existing;
    }
    for (const ref of [
      command.calibrationBundleId,
      command.calibrationProfileRef,
      command.releaseCohortRef,
      command.watchTupleRef,
      command.calibrationVersion,
    ]) {
      requireFrozenReference(ref);
    }
    validateUnitInterval(command.cDocRender, "cDocRender");
    validateUnitInterval(command.thetaDocRender, "thetaDocRender");
    validateNonNegative(command.lambdaConflict, "lambdaConflict");
    validateNonNegative(command.lambdaUnsupported, "lambdaUnsupported");
    validateNonNegative(command.lambdaMissing, "lambdaMissing");
    requireNonEmptyArray(command.buckets, "buckets");
    for (const bucket of command.buckets) {
      validateUnitInterval(bucket.minScore, "bucket.minScore");
    }
    const bundle: DocumentationCalibrationBundle = Object.freeze({
      calibrationBundleId: command.calibrationBundleId,
      calibrationProfileRef: command.calibrationProfileRef,
      releaseCohortRef: command.releaseCohortRef,
      watchTupleRef: command.watchTupleRef,
      calibrationVersion: command.calibrationVersion,
      validatedWindowState: command.validatedWindowState,
      cDocRender: command.cDocRender,
      thetaDocRender: command.thetaDocRender,
      lambdaConflict: command.lambdaConflict,
      lambdaUnsupported: command.lambdaUnsupported,
      lambdaMissing: command.lambdaMissing,
      buckets: Object.freeze([...command.buckets]),
      visibleConfidenceAllowed: command.visibleConfidenceAllowed,
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.calibrationBundles.set(bundle.calibrationBundleId, bundle);
    setIdempotent(this.runtime, "documentation_calibration", command.idempotencyKey, bundle.calibrationBundleId);
    writeAudit(this.runtime, "DocumentationCalibrationResolver", "registerCalibrationBundle", actor, bundle.calibrationBundleId, "accepted", []);
    return bundle;
  }

  public resolveCalibration(
    calibrationBundleRef: string,
    template: DraftTemplate,
    activeReleaseCohortRef?: string,
    activeWatchTupleRef?: string,
  ): ResolvedCalibration {
    const bundle = requireFromMap(this.runtime.store.calibrationBundles, calibrationBundleRef, "DOCUMENTATION_CALIBRATION_BUNDLE_NOT_FOUND");
    if (bundle.calibrationProfileRef !== template.calibrationProfileRef) {
      throw new AssistiveDocumentationError("DOCUMENTATION_CALIBRATION_PROFILE_MISMATCH", "Calibration profile must match the approved template.", [
        "calibration_profile_mismatch",
      ]);
    }
    const shadowOnlyReasonCodes: string[] = [];
    if (activeReleaseCohortRef && activeReleaseCohortRef !== bundle.releaseCohortRef) {
      shadowOnlyReasonCodes.push("release_cohort_mismatch");
    }
    if (activeWatchTupleRef && activeWatchTupleRef !== bundle.watchTupleRef) {
      shadowOnlyReasonCodes.push("watch_tuple_mismatch");
    }
    if (bundle.validatedWindowState !== "validated") {
      shadowOnlyReasonCodes.push("validated_calibration_window_missing");
    }
    if (!bundle.visibleConfidenceAllowed) {
      shadowOnlyReasonCodes.push("visible_confidence_disabled");
    }
    return {
      bundle,
      confidenceDisplayAllowed: shadowOnlyReasonCodes.length === 0,
      shadowOnlyReasonCodes,
    };
  }
}

export class EvidenceMapService {
  public constructor(private readonly runtime: DocumentationRuntime) {}

  public createEvidenceMapSet(command: CreateEvidenceMapSetCommand, actor: DocumentationActorContext): EvidenceMapSet {
    requireRole(actor, ["documentation_composer", "clinical_safety_lead", "system"], "DOCUMENTATION_EVIDENCE_MAP_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "documentation_evidence_map_set", command.idempotencyKey, this.runtime.store.evidenceMapSets);
    if (existing) {
      return existing;
    }
    requireFrozenReference(command.artifactRef);
    requireFrozenReference(command.artifactRevisionRef);
    requireFromMap(this.runtime.store.contextSnapshots, command.contextSnapshotId, "DOCUMENTATION_CONTEXT_NOT_FOUND");
    requireNonEmptyArray(command.rows, "rows");
    const rowInput = command.rows.map((row) => normalizeEvidenceMapRow(row));
    const mapHash = stableDocumentationHash({
      artifactRef: command.artifactRef,
      artifactRevisionRef: command.artifactRevisionRef,
      contextSnapshotId: command.contextSnapshotId,
      rows: rowInput,
    });
    const mapSet: EvidenceMapSet = Object.freeze({
      evidenceMapSetId: this.runtime.idGenerator.next("evidence_map_set"),
      artifactRef: command.artifactRef,
      artifactRevisionRef: command.artifactRevisionRef,
      contextSnapshotId: command.contextSnapshotId,
      mapHash,
      mapState: "immutable",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.evidenceMapSets.set(mapSet.evidenceMapSetId, mapSet);
    for (const row of rowInput) {
      const evidenceMap: EvidenceMap = Object.freeze({
        evidenceMapId: this.runtime.idGenerator.next("evidence_map"),
        evidenceMapSetRef: mapSet.evidenceMapSetId,
        outputSpanRef: row.outputSpanRef,
        sourceEvidenceRefs: Object.freeze([...row.sourceEvidenceRefs]),
        supportWeight: row.supportWeight,
        requiredWeight: row.requiredWeight,
        supportStrength: row.supportStrength,
      });
      this.runtime.store.evidenceMaps.set(evidenceMap.evidenceMapId, evidenceMap);
    }
    setIdempotent(this.runtime, "documentation_evidence_map_set", command.idempotencyKey, mapSet.evidenceMapSetId);
    writeAudit(this.runtime, "EvidenceMapService", "createEvidenceMapSet", actor, mapSet.evidenceMapSetId, "accepted", []);
    return mapSet;
  }

  public getEvidenceMapsForSet(evidenceMapSetRef: string): readonly EvidenceMap[] {
    requireFromMap(this.runtime.store.evidenceMapSets, evidenceMapSetRef, "DOCUMENTATION_EVIDENCE_MAP_SET_NOT_FOUND");
    return [...this.runtime.store.evidenceMaps.values()].filter((row) => row.evidenceMapSetRef === evidenceMapSetRef);
  }

  public assertEvidenceMapSetMatchesArtifact(
    evidenceMapSetRef: string,
    artifactRef: string,
    artifactRevisionRef: string,
    contextSnapshotId: string,
  ): EvidenceMapSet {
    const mapSet = requireFromMap(this.runtime.store.evidenceMapSets, evidenceMapSetRef, "DOCUMENTATION_EVIDENCE_MAP_SET_NOT_FOUND");
    if (mapSet.artifactRef !== artifactRef || mapSet.artifactRevisionRef !== artifactRevisionRef || mapSet.contextSnapshotId !== contextSnapshotId) {
      throw new AssistiveDocumentationError("DOCUMENTATION_EVIDENCE_MAP_ARTIFACT_MISMATCH", "Evidence map set must bind to the same artifact revision and context.", [
        "evidence_map_same_artifact_binding_required",
      ]);
    }
    return mapSet;
  }
}

export class ContradictionCheckEngine {
  public constructor(private readonly runtime: DocumentationRuntime) {}

  public recordContradictionCheck(command: RecordContradictionCheckCommand, actor: DocumentationActorContext): ContradictionCheckResult {
    requireRole(actor, ["documentation_composer", "clinical_safety_lead", "system"], "DOCUMENTATION_CONTRADICTION_CHECK_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "documentation_contradiction_check", command.idempotencyKey, this.runtime.store.contradictionChecks);
    if (existing) {
      return existing;
    }
    requireFrozenReference(command.artifactRef);
    validateUnitInterval(command.unsupportedAssertionRate, "unsupportedAssertionRate");
    validateUnitInterval(command.riskScore, "riskScore");
    const result: ContradictionCheckResult = Object.freeze({
      checkResultId: this.runtime.idGenerator.next("contradiction_check"),
      artifactRef: command.artifactRef,
      contradictionFlags: Object.freeze([...(command.contradictionFlags ?? [])]),
      unsupportedAssertionFlags: Object.freeze([...(command.unsupportedAssertionFlags ?? [])]),
      templateConformanceState: command.templateConformanceState,
      unsupportedAssertionRate: command.unsupportedAssertionRate,
      riskScore: command.riskScore,
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.contradictionChecks.set(result.checkResultId, result);
    setIdempotent(this.runtime, "documentation_contradiction_check", command.idempotencyKey, result.checkResultId);
    writeAudit(
      this.runtime,
      "ContradictionCheckEngine",
      "recordContradictionCheck",
      actor,
      result.checkResultId,
      result.contradictionFlags.length > 0 || result.unsupportedAssertionFlags.length > 0 ? "blocked" : "accepted",
      deriveContradictionReasonCodes(result),
    );
    return result;
  }
}

export class DraftComposerOrchestrator {
  private readonly templates: DraftTemplateResolver;
  private readonly calibrations: DocumentationCalibrationResolver;
  private readonly evidenceMaps: EvidenceMapService;
  private readonly contradictionChecks: ContradictionCheckEngine;

  public constructor(private readonly runtime: DocumentationRuntime) {
    this.templates = new DraftTemplateResolver(runtime);
    this.calibrations = new DocumentationCalibrationResolver(runtime);
    this.evidenceMaps = new EvidenceMapService(runtime);
    this.contradictionChecks = new ContradictionCheckEngine(runtime);
  }

  public composeDraftNote(command: ComposeDraftNoteCommand, actor: DocumentationActorContext): DraftNoteArtifact {
    requireRole(actor, ["documentation_composer", "system"], "DOCUMENTATION_DRAFT_COMPOSE_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "documentation_draft_note", command.idempotencyKey, this.runtime.store.draftNotes);
    if (existing) {
      return existing;
    }
    if (command.rawDraftText) {
      throw new AssistiveDocumentationError("DOCUMENTATION_RAW_DRAFT_FORBIDDEN", "Draft composer commands must use generatedTextRef values, not raw draft text.", [
        "raw_draft_text_forbidden",
      ]);
    }
    validateVerifierOutputs(command.verifierOutputs);
    requireFrozenReference(command.artifactRevisionRef);
    const context = requireFromMap(this.runtime.store.contextSnapshots, command.contextSnapshotId, "DOCUMENTATION_CONTEXT_NOT_FOUND");
    const template = this.templates.resolveTemplate(context.templateRef, command.draftFamily);
    const resolvedCalibration = this.calibrations.resolveCalibration(
      command.calibrationBundleRef,
      template,
      command.activeReleaseCohortRef,
      command.activeWatchTupleRef,
    );
    const draftNoteId = command.draftNoteRef ?? this.runtime.idGenerator.next("draft_note");
    requireFrozenReference(draftNoteId);
    if (this.runtime.store.draftNotes.has(draftNoteId)) {
      throw new AssistiveDocumentationError("DOCUMENTATION_DRAFT_NOTE_DUPLICATE", "Draft note ref already exists.");
    }
    const mapSet = this.resolveOrCreateEvidenceMapSet(
      draftNoteId,
      command.artifactRevisionRef,
      command.contextSnapshotId,
      command.evidenceMapSetRef,
      command.evidenceRows,
      actor,
    );
    const contradictionCheck = this.resolveOrCreateContradictionCheck(draftNoteId, command, actor);
    const evidenceRows = this.evidenceMaps.getEvidenceMapsForSet(mapSet.evidenceMapSetId);
    const sections = buildDraftSections({
      runtime: this.runtime,
      template,
      inputs: command.sections,
      verifierOutputs: command.verifierOutputs,
      evidenceRows,
      contradictionCheck,
      calibration: resolvedCalibration,
    });
    for (const section of sections) {
      this.runtime.store.draftSections.set(section.sectionId, section);
    }
    const requiredSectionTypes = new Set(template.requiredSectionTypes);
    const requiredSections = sections.filter((section) => requiredSectionTypes.has(section.sectionType));
    const renderedRequiredSections = requiredSections.filter((section) => section.sectionState === "rendered");
    const renderedSections = sections.filter((section) => section.sectionState === "rendered");
    const withheldRequiredSections = requiredSections.filter((section) => section.sectionState !== "rendered");
    const abstentionState: AbstentionState =
      renderedSections.length === 0 ? "full" : withheldRequiredSections.length > 0 ? "partial" : "none";
    const minimumSectionSupport =
      renderedRequiredSections.length === 0
        ? 0
        : Math.min(...renderedRequiredSections.map((section) => section.evidenceCoverage));
    const unsupportedAssertionRisk =
      sections.length === 0 ? 1 : Math.max(...sections.map((section) => section.unsupportedAssertionRisk), contradictionCheck.riskScore);
    const overallConfidenceDescriptor = resolvedCalibration.confidenceDisplayAllowed
      ? minimumConfidenceDescriptor(renderedRequiredSections)
      : "suppressed";
    const draftState = deriveDraftState(abstentionState, resolvedCalibration.confidenceDisplayAllowed);
    const draft: DraftNoteArtifact = Object.freeze({
      draftNoteId,
      draftFamily: command.draftFamily,
      contextSnapshotId: command.contextSnapshotId,
      templateRef: template.draftTemplateId,
      artifactRevisionRef: command.artifactRevisionRef,
      sectionRefs: Object.freeze(sections.map((section) => section.sectionId)),
      overallConfidenceDescriptor,
      minimumSectionSupport,
      unsupportedAssertionRisk,
      abstentionState,
      calibrationVersion: resolvedCalibration.bundle.calibrationVersion,
      calibrationBundleRef: resolvedCalibration.bundle.calibrationBundleId,
      releaseCohortRef: resolvedCalibration.bundle.releaseCohortRef,
      watchTupleRef: resolvedCalibration.bundle.watchTupleRef,
      evidenceMapSetRef: mapSet.evidenceMapSetId,
      contradictionCheckResultRef: contradictionCheck.checkResultId,
      artifactPresentationContractRef: template.artifactPresentationContractRef,
      visibleConfidenceAllowed: resolvedCalibration.confidenceDisplayAllowed,
      draftState,
      reviewState: draftState === "blocked" ? "blocked" : "draft_pending_review",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.draftNotes.set(draft.draftNoteId, draft);
    setIdempotent(this.runtime, "documentation_draft_note", command.idempotencyKey, draft.draftNoteId);
    writeAudit(
      this.runtime,
      "DraftComposerOrchestrator",
      "composeDraftNote",
      actor,
      draft.draftNoteId,
      draft.draftState === "blocked" ? "blocked" : "accepted",
      draft.draftState === "blocked" ? [...resolvedCalibration.shadowOnlyReasonCodes, "visible_draft_surface_blocked"] : [],
    );
    return draft;
  }

  private resolveOrCreateEvidenceMapSet(
    artifactRef: string,
    artifactRevisionRef: string,
    contextSnapshotId: string,
    evidenceMapSetRef: string | undefined,
    evidenceRows: readonly EvidenceMapRowInput[] | undefined,
    actor: DocumentationActorContext,
  ): EvidenceMapSet {
    if (evidenceMapSetRef) {
      return this.evidenceMaps.assertEvidenceMapSetMatchesArtifact(evidenceMapSetRef, artifactRef, artifactRevisionRef, contextSnapshotId);
    }
    requireNonEmptyArray(evidenceRows ?? [], "evidenceRows");
    return this.evidenceMaps.createEvidenceMapSet(
      {
        artifactRef,
        artifactRevisionRef,
        contextSnapshotId,
        rows: evidenceRows ?? [],
      },
      actor,
    );
  }

  private resolveOrCreateContradictionCheck(
    artifactRef: string,
    command: ComposeDraftNoteCommand,
    actor: DocumentationActorContext,
  ): ContradictionCheckResult {
    if (command.contradictionCheckResultRef) {
      const result = requireFromMap(
        this.runtime.store.contradictionChecks,
        command.contradictionCheckResultRef,
        "DOCUMENTATION_CONTRADICTION_CHECK_NOT_FOUND",
      );
      if (result.artifactRef !== artifactRef) {
        throw new AssistiveDocumentationError("DOCUMENTATION_CONTRADICTION_ARTIFACT_MISMATCH", "Contradiction check must bind to the same draft artifact.", [
          "contradiction_check_same_artifact_binding_required",
        ]);
      }
      return result;
    }
    return this.contradictionChecks.recordContradictionCheck(
      {
        artifactRef,
        contradictionFlags: command.contradictionFlags ?? [],
        unsupportedAssertionFlags: command.unsupportedAssertionFlags ?? [],
        templateConformanceState: command.templateConformanceState ?? "conformant",
        unsupportedAssertionRate: command.unsupportedAssertionRate ?? 0,
        riskScore: command.contradictionRiskScore ?? 0,
      },
      actor,
    );
  }
}

export class DraftNoteArtifactService {
  public constructor(private readonly runtime: DocumentationRuntime) {}

  public getDraftNote(draftNoteId: string): DraftNoteArtifact {
    return requireFromMap(this.runtime.store.draftNotes, draftNoteId, "DOCUMENTATION_DRAFT_NOTE_NOT_FOUND");
  }

  public getDraftSections(draftNoteId: string): readonly DraftSection[] {
    const draft = this.getDraftNote(draftNoteId);
    return draft.sectionRefs.map((sectionRef) => requireFromMap(this.runtime.store.draftSections, sectionRef, "DOCUMENTATION_DRAFT_SECTION_NOT_FOUND"));
  }

  public assertDraftEvidenceMapBinding(draftNoteId: string): EvidenceMapSet {
    const draft = this.getDraftNote(draftNoteId);
    const mapSet = requireFromMap(this.runtime.store.evidenceMapSets, draft.evidenceMapSetRef, "DOCUMENTATION_EVIDENCE_MAP_SET_NOT_FOUND");
    if (
      mapSet.artifactRef !== draft.draftNoteId ||
      mapSet.artifactRevisionRef !== draft.artifactRevisionRef ||
      mapSet.contextSnapshotId !== draft.contextSnapshotId
    ) {
      throw new AssistiveDocumentationError("DOCUMENTATION_EVIDENCE_MAP_ARTIFACT_MISMATCH", "Draft note evidence map binding drifted.", [
        "evidence_map_same_artifact_binding_required",
      ]);
    }
    return mapSet;
  }

  public generatePresentationArtifact(
    command: GenerateDocumentationPresentationCommand,
    actor: DocumentationActorContext,
  ): DocumentationPresentationArtifact {
    requireRole(
      actor,
      ["artifact_presentation_worker", "clinical_reviewer", "documentation_composer", "system"],
      "DOCUMENTATION_PRESENTATION_FORBIDDEN",
    );
    const existing = getIdempotent(this.runtime, "documentation_presentation", command.idempotencyKey, this.runtime.store.presentationArtifacts);
    if (existing) {
      return existing;
    }
    const source = resolvePresentationSource(this.runtime, command);
    requireFrozenReference(command.artifactPresentationContractRef);
    requireFrozenReference(command.surfaceRouteContractRef);
    requireFrozenReference(command.surfacePublicationRef);
    requireFrozenReference(command.runtimePublicationBundleRef);
    requireFrozenReference(command.placeholderContractRef);
    const blockingReasonCodes = derivePresentationBlockingReasons(command, source);
    const artifactState = derivePresentationState(command, blockingReasonCodes, source);
    const presentation: DocumentationPresentationArtifact = Object.freeze({
      documentationPresentationArtifactId: this.runtime.idGenerator.next("documentation_presentation"),
      artifactRef: command.artifactRef,
      artifactKind: command.artifactKind,
      artifactPresentationContractRef: command.artifactPresentationContractRef,
      outboundNavigationGrantPolicyRef: command.outboundNavigationGrantPolicyRef,
      surfaceRouteContractRef: command.surfaceRouteContractRef,
      surfacePublicationRef: command.surfacePublicationRef,
      runtimePublicationBundleRef: command.runtimePublicationBundleRef,
      visibilityTier: command.visibilityTier,
      summarySafetyTier: command.summarySafetyTier,
      placeholderContractRef: command.placeholderContractRef,
      artifactState,
      blockingReasonCodes: Object.freeze([...blockingReasonCodes]),
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.presentationArtifacts.set(presentation.documentationPresentationArtifactId, presentation);
    setIdempotent(this.runtime, "documentation_presentation", command.idempotencyKey, presentation.documentationPresentationArtifactId);
    writeAudit(
      this.runtime,
      "DraftNoteArtifactService",
      "generatePresentationArtifact",
      actor,
      presentation.documentationPresentationArtifactId,
      artifactState === "blocked" ? "blocked" : "accepted",
      blockingReasonCodes,
    );
    return presentation;
  }
}

export class MessageDraftArtifactService {
  private readonly templates: DraftTemplateResolver;
  private readonly calibrations: DocumentationCalibrationResolver;
  private readonly evidenceMaps: EvidenceMapService;
  private readonly contradictionChecks: ContradictionCheckEngine;

  public constructor(private readonly runtime: DocumentationRuntime) {
    this.templates = new DraftTemplateResolver(runtime);
    this.calibrations = new DocumentationCalibrationResolver(runtime);
    this.evidenceMaps = new EvidenceMapService(runtime);
    this.contradictionChecks = new ContradictionCheckEngine(runtime);
  }

  public composeMessageDraft(command: ComposeMessageDraftCommand, actor: DocumentationActorContext): MessageDraftArtifact {
    requireRole(actor, ["documentation_composer", "system"], "DOCUMENTATION_MESSAGE_DRAFT_FORBIDDEN");
    const existing = getIdempotent(this.runtime, "documentation_message_draft", command.idempotencyKey, this.runtime.store.messageDrafts);
    if (existing) {
      return existing;
    }
    if (command.rawBodyText) {
      throw new AssistiveDocumentationError("DOCUMENTATION_RAW_DRAFT_FORBIDDEN", "Message draft commands must use bodyRef, not raw body text.", [
        "raw_draft_text_forbidden",
      ]);
    }
    validateVerifierOutputs([command.verifierOutput]);
    requireFrozenReference(command.artifactRevisionRef);
    requireFrozenReference(command.bodyRef);
    const context = requireFromMap(this.runtime.store.contextSnapshots, command.contextSnapshotId, "DOCUMENTATION_CONTEXT_NOT_FOUND");
    const template = this.templates.resolveTemplate(context.templateRef, command.messageType);
    const resolvedCalibration = this.calibrations.resolveCalibration(
      command.calibrationBundleRef,
      template,
      command.activeReleaseCohortRef,
      command.activeWatchTupleRef,
    );
    const messageDraftId = command.messageDraftRef ?? this.runtime.idGenerator.next("message_draft");
    requireFrozenReference(messageDraftId);
    const mapSet = command.evidenceMapSetRef
      ? this.evidenceMaps.assertEvidenceMapSetMatchesArtifact(
          command.evidenceMapSetRef,
          messageDraftId,
          command.artifactRevisionRef,
          command.contextSnapshotId,
        )
      : this.evidenceMaps.createEvidenceMapSet(
          {
            artifactRef: messageDraftId,
            artifactRevisionRef: command.artifactRevisionRef,
            contextSnapshotId: command.contextSnapshotId,
            rows: command.evidenceRows ?? [],
          },
          actor,
        );
    const contradictionCheck = command.contradictionCheckResultRef
      ? requireFromMap(this.runtime.store.contradictionChecks, command.contradictionCheckResultRef, "DOCUMENTATION_CONTRADICTION_CHECK_NOT_FOUND")
      : this.contradictionChecks.recordContradictionCheck(
          {
            artifactRef: messageDraftId,
            contradictionFlags: command.contradictionFlags ?? [],
            unsupportedAssertionFlags: command.unsupportedAssertionFlags ?? [],
            templateConformanceState: command.templateConformanceState ?? "conformant",
            unsupportedAssertionRate: command.unsupportedAssertionRate ?? 0,
            riskScore: command.contradictionRiskScore ?? 0,
          },
          actor,
        );
    if (contradictionCheck.artifactRef !== messageDraftId) {
      throw new AssistiveDocumentationError("DOCUMENTATION_CONTRADICTION_ARTIFACT_MISMATCH", "Contradiction check must bind to the same message draft.", [
        "contradiction_check_same_artifact_binding_required",
      ]);
    }
    const support = computeSpanSupport(
      command.outputSpanRef,
      [command.verifierOutput],
      this.evidenceMaps.getEvidenceMapsForSet(mapSet.evidenceMapSetId),
      contradictionCheck,
      resolvedCalibration,
    );
    const safeToRender =
      support.evidenceCoverage >= resolvedCalibration.bundle.cDocRender &&
      support.unsupportedAssertionRisk <= resolvedCalibration.bundle.thetaDocRender &&
      contradictionCheck.templateConformanceState !== "non_conformant";
    const message: MessageDraftArtifact = Object.freeze({
      messageDraftId,
      contextSnapshotId: command.contextSnapshotId,
      messageType: command.messageType,
      artifactRevisionRef: command.artifactRevisionRef,
      bodyRef: safeToRender ? command.bodyRef : undefined,
      outputSpanRef: command.outputSpanRef,
      supportProbability: support.supportProbability,
      evidenceCoverage: support.evidenceCoverage,
      unsupportedAssertionRisk: support.unsupportedAssertionRisk,
      abstentionState: safeToRender ? "none" : "full",
      calibrationVersion: resolvedCalibration.bundle.calibrationVersion,
      calibrationBundleRef: resolvedCalibration.bundle.calibrationBundleId,
      releaseCohortRef: resolvedCalibration.bundle.releaseCohortRef,
      watchTupleRef: resolvedCalibration.bundle.watchTupleRef,
      evidenceMapSetRef: mapSet.evidenceMapSetId,
      contradictionCheckResultRef: contradictionCheck.checkResultId,
      artifactPresentationContractRef: template.artifactPresentationContractRef,
      confidenceDescriptor: resolvedCalibration.confidenceDisplayAllowed ? support.confidenceDescriptor : "suppressed",
      visibleConfidenceAllowed: resolvedCalibration.confidenceDisplayAllowed,
      reviewState: safeToRender && resolvedCalibration.confidenceDisplayAllowed ? "draft_pending_review" : "blocked",
      createdAt: this.runtime.clock.now(),
    });
    this.runtime.store.messageDrafts.set(message.messageDraftId, message);
    setIdempotent(this.runtime, "documentation_message_draft", command.idempotencyKey, message.messageDraftId);
    writeAudit(
      this.runtime,
      "MessageDraftArtifactService",
      "composeMessageDraft",
      actor,
      message.messageDraftId,
      message.reviewState === "blocked" ? "blocked" : "accepted",
      message.reviewState === "blocked" ? ["message_draft_abstained_or_shadow_only"] : [],
    );
    return message;
  }

  public getMessageDraft(messageDraftId: string): MessageDraftArtifact {
    return requireFromMap(this.runtime.store.messageDrafts, messageDraftId, "DOCUMENTATION_MESSAGE_DRAFT_NOT_FOUND");
  }
}

export function createAssistiveDocumentationComposerPlane(options?: {
  store?: AssistiveDocumentationStore;
  clock?: DocumentationClock;
  idGenerator?: DocumentationIdGenerator;
}): {
  store: AssistiveDocumentationStore;
  contextSnapshots: DocumentationContextSnapshotService;
  templates: DraftTemplateResolver;
  calibrations: DocumentationCalibrationResolver;
  evidenceMaps: EvidenceMapService;
  contradictionChecks: ContradictionCheckEngine;
  draftComposer: DraftComposerOrchestrator;
  draftNotes: DraftNoteArtifactService;
  messageDrafts: MessageDraftArtifactService;
} {
  const runtime: DocumentationRuntime = {
    store: options?.store ?? createAssistiveDocumentationStore(),
    clock: options?.clock ?? { now: () => new Date().toISOString() },
    idGenerator: options?.idGenerator ?? createDeterministicDocumentationIdGenerator(),
  };
  return {
    store: runtime.store,
    contextSnapshots: new DocumentationContextSnapshotService(runtime),
    templates: new DraftTemplateResolver(runtime),
    calibrations: new DocumentationCalibrationResolver(runtime),
    evidenceMaps: new EvidenceMapService(runtime),
    contradictionChecks: new ContradictionCheckEngine(runtime),
    draftComposer: new DraftComposerOrchestrator(runtime),
    draftNotes: new DraftNoteArtifactService(runtime),
    messageDrafts: new MessageDraftArtifactService(runtime),
  };
}

export const assistiveDocumentationComposerContract = {
  contractId: "408_documentation_composer_contract",
  schemaVersion: "408.documentation-composer-contract.v1",
  upstreamContractRefs: [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/406_evaluation_runtime_contract.json",
    "data/contracts/407_transcript_runtime_contract.json",
  ],
  services: assistiveDocumentationServiceNames,
  failClosedDefaults: [
    "approved_template_required",
    "evidence_map_same_artifact_binding_required",
    "validated_calibration_window_missing",
    "decoder_probability_forbidden",
    "raw_draft_text_forbidden",
    "external_handoff_without_outbound_navigation_grant",
  ],
} as const;

function buildDraftSections(options: {
  runtime: DocumentationRuntime;
  template: DraftTemplate;
  inputs: readonly DraftSectionInput[];
  verifierOutputs: readonly CalibratedVerifierOutput[];
  evidenceRows: readonly EvidenceMap[];
  contradictionCheck: ContradictionCheckResult;
  calibration: ResolvedCalibration;
}): readonly DraftSection[] {
  const allowedSectionTypes = new Set([...options.template.requiredSectionTypes, ...options.template.optionalSectionTypes]);
  const inputsBySection = new Map<string, DraftSectionInput>();
  for (const input of options.inputs) {
    if (input.rawSectionText) {
      throw new AssistiveDocumentationError("DOCUMENTATION_RAW_DRAFT_FORBIDDEN", "Draft sections must use generatedTextRef, not raw text.", [
        "raw_draft_text_forbidden",
      ]);
    }
    if (!allowedSectionTypes.has(input.sectionType)) {
      throw new AssistiveDocumentationError("DOCUMENTATION_TEMPLATE_CONFORMANCE_FAILED", "Draft section is not part of the approved template.", [
        "template_section_not_allowed",
      ]);
    }
    if (inputsBySection.has(input.sectionType)) {
      throw new AssistiveDocumentationError("DOCUMENTATION_TEMPLATE_DUPLICATE_SECTION", "Draft section types must be unique.", [
        "duplicate_section_type",
      ]);
    }
    inputsBySection.set(input.sectionType, input);
  }

  const orderedSectionTypes = [...options.template.requiredSectionTypes];
  for (const input of options.inputs) {
    if (options.template.optionalSectionTypes.includes(input.sectionType)) {
      orderedSectionTypes.push(input.sectionType);
    }
  }

  return orderedSectionTypes.map((sectionType) => {
    const input = inputsBySection.get(sectionType);
    if (!input) {
      return Object.freeze({
        sectionId: options.runtime.idGenerator.next("draft_section"),
        sectionType,
        sectionState: "missing_info" as const,
        outputSpanRef: `missing:${sectionType}`,
        evidenceSpanRefs: Object.freeze([]),
        missingInfoFlags: Object.freeze(["required_template_section_missing"]),
        supportProbability: 0,
        evidenceCoverage: 0,
        unsupportedAssertionRisk: 1,
        confidenceDescriptor: options.calibration.confidenceDisplayAllowed ? "insufficient" : "suppressed",
      });
    }
    const support = computeSpanSupport(
      input.outputSpanRef,
      options.verifierOutputs,
      options.evidenceRows,
      options.contradictionCheck,
      options.calibration,
    );
    const missingInfoFlags = deriveMissingInfoFlags(support, options.calibration.bundle, options.contradictionCheck, input.generatedTextRef);
    const safeToRender =
      missingInfoFlags.length === 0 &&
      options.contradictionCheck.templateConformanceState !== "non_conformant" &&
      support.evidenceCoverage >= options.calibration.bundle.cDocRender &&
      support.unsupportedAssertionRisk <= options.calibration.bundle.thetaDocRender;
    const section: DraftSection = Object.freeze({
      sectionId: options.runtime.idGenerator.next("draft_section"),
      sectionType,
      sectionState: safeToRender ? "rendered" : "abstained",
      generatedTextRef: safeToRender ? input.generatedTextRef : undefined,
      outputSpanRef: input.outputSpanRef,
      evidenceSpanRefs: Object.freeze(support.evidenceSpanRefs),
      missingInfoFlags: Object.freeze(
        safeToRender ? [] : [...missingInfoFlags, ...templateConformanceFlags(options.contradictionCheck.templateConformanceState)],
      ),
      supportProbability: support.supportProbability,
      evidenceCoverage: support.evidenceCoverage,
      unsupportedAssertionRisk: support.unsupportedAssertionRisk,
      confidenceDescriptor: options.calibration.confidenceDisplayAllowed ? support.confidenceDescriptor : "suppressed",
    });
    return section;
  });
}

function computeSpanSupport(
  outputSpanRef: string,
  verifierOutputs: readonly CalibratedVerifierOutput[],
  evidenceRows: readonly EvidenceMap[],
  contradictionCheck: ContradictionCheckResult,
  calibration: ResolvedCalibration,
): {
  supportProbability: number;
  evidenceCoverage: number;
  unsupportedAssertionRisk: number;
  confidenceDescriptor: ConfidenceDescriptor;
  evidenceSpanRefs: string[];
  verifierMissing: boolean;
  contradictionPresent: boolean;
} {
  const verifier = verifierOutputs.find((entry) => entry.outputSpanRef === outputSpanRef);
  const supportProbability = verifier ? clamp01(verifier.calibratedSupportProbability) : 0;
  const rowsForSpan = evidenceRows.filter((row) => row.outputSpanRef === outputSpanRef);
  const supportWeight = rowsForSpan.reduce((sum, row) => sum + row.supportWeight, 0);
  const requiredWeight = rowsForSpan.reduce((sum, row) => sum + row.requiredWeight, 0);
  const evidenceCoverage = clamp01(supportWeight / Math.max(0.000001, requiredWeight || 1));
  const contradictionPresent = contradictionCheck.contradictionFlags.some((flag) => !flag.outputSpanRef || flag.outputSpanRef === outputSpanRef);
  const unsupportedFlagsForSpan = contradictionCheck.unsupportedAssertionFlags.filter(
    (flag) => !flag.outputSpanRef || flag.outputSpanRef === outputSpanRef,
  );
  const unsupportedAssertionRate = Math.max(contradictionCheck.unsupportedAssertionRate, unsupportedFlagsForSpan.length > 0 ? 1 : 0);
  const unsupportedAssertionRisk = clamp01(
    1 -
      supportProbability +
      calibration.bundle.lambdaConflict * (contradictionPresent ? 1 : 0) +
      calibration.bundle.lambdaUnsupported * unsupportedAssertionRate +
      calibration.bundle.lambdaMissing * (1 - evidenceCoverage),
  );
  const confidenceScore = Math.min(supportProbability, evidenceCoverage, 1 - unsupportedAssertionRisk);
  return {
    supportProbability,
    evidenceCoverage,
    unsupportedAssertionRisk,
    confidenceDescriptor: bucketConfidence(confidenceScore, calibration.bundle),
    evidenceSpanRefs: unique(rowsForSpan.flatMap((row) => [...row.sourceEvidenceRefs])),
    verifierMissing: !verifier,
    contradictionPresent,
  };
}

function deriveMissingInfoFlags(
  support: ReturnType<typeof computeSpanSupport>,
  calibration: DocumentationCalibrationBundle,
  contradictionCheck: ContradictionCheckResult,
  generatedTextRef: string | undefined,
): readonly string[] {
  const flags: string[] = [];
  if (!generatedTextRef) {
    flags.push("generated_text_ref_missing");
  }
  if (support.verifierMissing) {
    flags.push("calibrated_verifier_output_missing");
  }
  if (support.evidenceCoverage < calibration.cDocRender) {
    flags.push("evidence_coverage_below_threshold");
  }
  if (support.unsupportedAssertionRisk > calibration.thetaDocRender) {
    flags.push("unsupported_assertion_risk_above_threshold");
  }
  if (support.contradictionPresent) {
    flags.push("contradiction_flag_present");
  }
  if (contradictionCheck.unsupportedAssertionFlags.length > 0) {
    flags.push("unsupported_assertion_flag_present");
  }
  return unique(flags);
}

function deriveDraftState(abstentionState: AbstentionState, confidenceDisplayAllowed: boolean): DraftState {
  if (!confidenceDisplayAllowed) {
    return "blocked";
  }
  if (abstentionState === "full") {
    return "full_abstention";
  }
  if (abstentionState === "partial") {
    return "partial_abstention";
  }
  return "renderable";
}

function normalizeEvidenceMapRow(row: EvidenceMapRowInput): EvidenceMapRowInput {
  requireFrozenReference(row.outputSpanRef);
  requireNonEmptyArray(row.sourceEvidenceRefs, "sourceEvidenceRefs");
  validateFrozenReferences(row.sourceEvidenceRefs, "sourceEvidenceRefs");
  validateNonNegative(row.supportWeight, "supportWeight");
  if (!Number.isFinite(row.requiredWeight) || row.requiredWeight <= 0) {
    throw new AssistiveDocumentationError("DOCUMENTATION_EVIDENCE_WEIGHT_INVALID", "requiredWeight must be greater than zero.");
  }
  if (row.supportWeight > row.requiredWeight) {
    throw new AssistiveDocumentationError("DOCUMENTATION_EVIDENCE_WEIGHT_INVALID", "supportWeight cannot exceed requiredWeight.", [
      "support_weight_exceeds_required_weight",
    ]);
  }
  return {
    outputSpanRef: row.outputSpanRef,
    sourceEvidenceRefs: Object.freeze([...row.sourceEvidenceRefs]),
    supportWeight: row.supportWeight,
    requiredWeight: row.requiredWeight,
    supportStrength: row.supportStrength,
  };
}

function validateVerifierOutputs(verifierOutputs: readonly CalibratedVerifierOutput[]): void {
  requireNonEmptyArray(verifierOutputs, "verifierOutputs");
  for (const verifier of verifierOutputs) {
    const possiblyUnsafe = verifier as CalibratedVerifierOutput & { decoderProbability?: number };
    if (possiblyUnsafe.decoderProbability !== undefined) {
      throw new AssistiveDocumentationError("DOCUMENTATION_DECODER_PROBABILITY_FORBIDDEN", "Support posture must come from verifier outputs, not decoder probabilities.", [
        "decoder_probability_forbidden",
      ]);
    }
    requireFrozenReference(verifier.outputSpanRef);
    validateUnitInterval(verifier.calibratedSupportProbability, "calibratedSupportProbability");
  }
}

function bucketConfidence(score: number, bundle: DocumentationCalibrationBundle): ConfidenceDescriptor {
  const sortedBuckets = [...bundle.buckets].sort((left, right) => right.minScore - left.minScore);
  for (const bucket of sortedBuckets) {
    if (score >= bucket.minScore) {
      return bucket.descriptor;
    }
  }
  return "insufficient";
}

function minimumConfidenceDescriptor(sections: readonly DraftSection[]): ConfidenceDescriptor {
  if (sections.length === 0) {
    return "insufficient";
  }
  const rank: Record<ConfidenceDescriptor, number> = {
    suppressed: 0,
    insufficient: 1,
    guarded: 2,
    supported: 3,
    strong: 4,
  };
  return sections.reduce<ConfidenceDescriptor>((lowest, section) =>
    rank[section.confidenceDescriptor] < rank[lowest] ? section.confidenceDescriptor : lowest,
  sections[0]?.confidenceDescriptor ?? "insufficient");
}

function resolvePresentationSource(
  runtime: DocumentationRuntime,
  command: GenerateDocumentationPresentationCommand,
): { state: DraftState | ReviewState; contractRef: string; visibleConfidenceAllowed: boolean; abstentionState: AbstentionState } {
  if (command.artifactKind === "draft_note") {
    const draft = requireFromMap(runtime.store.draftNotes, command.artifactRef, "DOCUMENTATION_DRAFT_NOTE_NOT_FOUND");
    if (draft.artifactPresentationContractRef !== command.artifactPresentationContractRef) {
      throw new AssistiveDocumentationError("DOCUMENTATION_PRESENTATION_CONTRACT_MISMATCH", "Presentation contract must match the draft artifact.");
    }
    return {
      state: draft.draftState,
      contractRef: draft.artifactPresentationContractRef,
      visibleConfidenceAllowed: draft.visibleConfidenceAllowed,
      abstentionState: draft.abstentionState,
    };
  }
  const message = requireFromMap(runtime.store.messageDrafts, command.artifactRef, "DOCUMENTATION_MESSAGE_DRAFT_NOT_FOUND");
  if (message.artifactPresentationContractRef !== command.artifactPresentationContractRef) {
    throw new AssistiveDocumentationError("DOCUMENTATION_PRESENTATION_CONTRACT_MISMATCH", "Presentation contract must match the message draft artifact.");
  }
  return {
    state: message.reviewState,
    contractRef: message.artifactPresentationContractRef,
    visibleConfidenceAllowed: message.visibleConfidenceAllowed,
    abstentionState: message.abstentionState,
  };
}

function derivePresentationBlockingReasons(
  command: GenerateDocumentationPresentationCommand,
  source: { state: DraftState | ReviewState; visibleConfidenceAllowed: boolean; abstentionState: AbstentionState },
): readonly string[] {
  const reasons: string[] = [];
  if (command.rawExternalUrl) {
    reasons.push("raw_external_url_forbidden");
  }
  if (command.directWritebackTargetRef) {
    reasons.push("direct_record_writeback_forbidden");
  }
  if (command.requestedArtifactState === "external_handoff_ready" && !command.outboundNavigationGrantPolicyRef) {
    reasons.push("outbound_navigation_grant_required");
  }
  if (!source.visibleConfidenceAllowed && command.requestedArtifactState && command.requestedArtifactState !== "summary_only") {
    reasons.push("validated_calibration_window_missing");
  }
  if (source.state === "blocked") {
    reasons.push("source_artifact_blocked");
  }
  if (source.abstentionState === "full" && command.requestedArtifactState === "inline_renderable") {
    reasons.push("full_abstention_not_inline_renderable");
  }
  return unique(reasons);
}

function derivePresentationState(
  command: GenerateDocumentationPresentationCommand,
  blockingReasonCodes: readonly string[],
  source: { state: DraftState | ReviewState; abstentionState: AbstentionState },
): DocumentationPresentationArtifactState {
  if (
    blockingReasonCodes.some((reason) =>
      [
        "raw_external_url_forbidden",
        "direct_record_writeback_forbidden",
        "outbound_navigation_grant_required",
        "validated_calibration_window_missing",
        "source_artifact_blocked",
      ].includes(reason),
    )
  ) {
    return "blocked";
  }
  if (source.abstentionState !== "none" || source.state === "full_abstention") {
    return "recovery_only";
  }
  return command.requestedArtifactState ?? "summary_only";
}

function templateConformanceFlags(templateConformanceState: TemplateConformanceState): readonly string[] {
  return templateConformanceState === "non_conformant" ? ["template_conformance_failed"] : [];
}

function deriveContradictionReasonCodes(result: ContradictionCheckResult): readonly string[] {
  const reasons: string[] = [];
  if (result.contradictionFlags.length > 0) {
    reasons.push("contradiction_flag_present");
  }
  if (result.unsupportedAssertionFlags.length > 0) {
    reasons.push("unsupported_assertion_flag_present");
  }
  if (result.templateConformanceState === "non_conformant") {
    reasons.push("template_conformance_failed");
  }
  return reasons;
}

function assertSupportedDraftFamily(draftFamily: DraftFamily): void {
  if (!supportedDraftFamilies.includes(draftFamily)) {
    throw new AssistiveDocumentationError("DOCUMENTATION_DRAFT_FAMILY_UNSUPPORTED", "Unsupported documentation draft family.");
  }
}

function validateFrozenReferences(refs: readonly string[], fieldName: string): void {
  for (const ref of refs) {
    try {
      requireFrozenReference(ref);
    } catch (error) {
      if (error instanceof AssistiveDocumentationError) {
        throw new AssistiveDocumentationError(error.code, `${fieldName} contains a mutable or empty reference.`, error.reasonCodes);
      }
      throw error;
    }
  }
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
    throw new AssistiveDocumentationError("DOCUMENTATION_MUTABLE_REF_FORBIDDEN", "Documentation composer inputs must be frozen refs.", [
      "mutable_ref_forbidden",
    ]);
  }
}

function getIdempotent<T>(
  runtime: DocumentationRuntime,
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

function setIdempotent(runtime: DocumentationRuntime, namespace: string, idempotencyKey: string | undefined, recordId: string): void {
  if (idempotencyKey) {
    runtime.store.idempotencyKeys.set(`${namespace}:${idempotencyKey}`, recordId);
  }
}

function writeAudit(
  runtime: DocumentationRuntime,
  serviceName: string,
  action: string,
  actor: DocumentationActorContext,
  subjectRef: string,
  outcome: DocumentationAuditRecord["outcome"],
  reasonCodes: readonly string[],
): void {
  runtime.store.auditRecords.push({
    auditRecordId: runtime.idGenerator.next("documentation_audit"),
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

function requireRole(actor: DocumentationActorContext, allowedRoles: readonly DocumentationActorRole[], code: string): void {
  if (!allowedRoles.includes(actor.actorRole)) {
    throw new AssistiveDocumentationError(code, `Role ${actor.actorRole} is not allowed.`, [`role_${actor.actorRole}_not_allowed`]);
  }
}

function requireFromMap<T>(records: Map<string, T>, key: string, code: string): T {
  const record = records.get(key);
  if (!record) {
    throw new AssistiveDocumentationError(code, `Missing documentation record: ${key}.`);
  }
  return record;
}

function requireNonEmpty(value: string | undefined, fieldName: string): asserts value is string {
  if (!value || value.trim().length === 0) {
    throw new AssistiveDocumentationError("DOCUMENTATION_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function requireNonEmptyArray<T>(value: readonly T[], fieldName: string): void {
  if (value.length === 0) {
    throw new AssistiveDocumentationError("DOCUMENTATION_REQUIRED_FIELD_MISSING", `Missing required field ${fieldName}.`, [
      `${fieldName}_missing`,
    ]);
  }
}

function validateUnitInterval(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new AssistiveDocumentationError("DOCUMENTATION_NUMERIC_FIELD_INVALID", `${fieldName} must be between 0 and 1.`, [
      `${fieldName}_invalid`,
    ]);
  }
}

function validateNonNegative(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new AssistiveDocumentationError("DOCUMENTATION_NUMERIC_FIELD_INVALID", `${fieldName} must be non-negative.`, [
      `${fieldName}_invalid`,
    ]);
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates];
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
