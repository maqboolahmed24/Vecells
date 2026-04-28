import { createHash } from "node:crypto";
import { RequestBackboneInvariantError } from "../../../domain-kernel/src/index";
import {
  type IntakeRequestType,
  type Phase1AnswerType,
  type Phase1IntakeExperienceBundle,
  type Phase1QuestionDefinition,
  phase1QuestionDefinitionContract,
  phase1QuestionDefinitions,
  resolveDefaultPhase1IntakeExperienceBundle,
} from "./intake-experience-bundle";
import { createNormalizedSubmissionService } from "./normalized-submission";
import type { ContactPreferenceValidationSummary } from "./contact-preference-capture";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function stableDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort(compareStrings);
}

type PredicateClause =
  | { kind: "requestType"; expected: IntakeRequestType }
  | { kind: "answerEquals"; questionKey: string; expected: string };

function parsePredicate(expression: string): readonly PredicateClause[] {
  const trimmed = expression.trim();
  if (trimmed.length === 0) {
    return [];
  }
  return trimmed.split("&&").map((rawClause) => {
    const clause = rawClause.trim();
    const requestTypeMatch = /^requestType\s*==\s*'([^']+)'$/.exec(clause);
    if (requestTypeMatch) {
      return {
        kind: "requestType",
        expected: requestTypeMatch[1] as IntakeRequestType,
      } satisfies PredicateClause;
    }
    const answerMatch = /^answers\[['"]([^'"]+)['"]\]\s*==\s*'([^']+)'$/.exec(clause);
    if (answerMatch) {
      const questionKey = answerMatch[1];
      const expected = answerMatch[2];
      invariant(
        typeof questionKey === "string" && typeof expected === "string",
        "UNSUPPORTED_PHASE1_PREDICATE",
        `Unsupported Phase 1 predicate: ${expression}`,
      );
      return {
        kind: "answerEquals",
        questionKey,
        expected,
      } satisfies PredicateClause;
    }
    throw new RequestBackboneInvariantError(
      "UNSUPPORTED_PHASE1_PREDICATE",
      `Unsupported Phase 1 predicate: ${expression}`,
    );
  });
}

interface CompiledQuestionDefinition extends Phase1QuestionDefinition {
  readonly visibilityClauses: readonly PredicateClause[];
  readonly requiredClauses: readonly PredicateClause[];
}

export interface ValidationContactPreferences {
  preferredChannel: "sms" | "phone" | "email";
  contactWindow: "weekday_daytime" | "weekday_evening" | "anytime";
  voicemailAllowed: boolean;
}

export interface ValidationIdentityContext {
  bindingState:
    | "anonymous"
    | "partial"
    | "verified"
    | "uplift_pending"
    | "identity_repair_required";
  subjectRefPresence: "none" | "masked" | "bound";
  claimResumeState: "not_required" | "pending" | "granted" | "blocked";
  actorBindingState:
    | "anonymous"
    | "partial"
    | "verified"
    | "uplift_pending"
    | "identity_repair_required";
}

export interface ValidationChannelCapabilityCeiling {
  canUploadFiles: boolean;
  canRenderTrackStatus: boolean;
  canRenderEmbedded: boolean;
  mutatingResumeState: "allowed" | "rebind_required" | "blocked";
}

export interface SubmissionAttachmentState {
  attachmentRef: string;
  outcomeRef: string;
  submitDisposition:
    | "routine_submit_allowed"
    | "retry_before_submit"
    | "replace_or_remove_then_review"
    | "state_unknown";
  currentSafeMode:
    | "structured_summary"
    | "governed_preview"
    | "placeholder_only"
    | "recovery_only";
  documentReferenceState: "created" | "not_created" | "pending";
  quarantineState: "not_quarantined" | "quarantined" | "processing" | "unknown";
}

export interface SubmissionContactAuthorityPosture {
  policyRef: string;
  authorityState:
    | "verified"
    | "assumed_self_service_browser_minimum"
    | "rebind_required"
    | "blocked";
  reasonCodes: readonly string[];
}

export type ValidationUrgentDecisionState =
  | "clear"
  | "pending"
  | "urgent_diversion_required"
  | "urgent_diverted";

export interface SubmissionEnvelopeValidationInput {
  envelopeRef: string;
  draftPublicId: string;
  bundle?: Phase1IntakeExperienceBundle;
  requestType: IntakeRequestType;
  structuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  contactPreferences: ValidationContactPreferences;
  identityContext: ValidationIdentityContext;
  channelCapabilityCeiling: ValidationChannelCapabilityCeiling;
  surfaceChannelProfile: "browser" | "embedded";
  ingressChannel: "self_service_form";
  intakeConvergenceContractRef: string;
  draftVersion: number;
  currentStepKey:
    | "landing"
    | "request_type"
    | "details"
    | "supporting_files"
    | "contact_preferences"
    | "review_submit"
    | "resume_recovery"
    | "urgent_outcome"
    | "receipt_outcome"
    | "request_status";
  completedStepKeys: readonly string[];
  attachmentStates?: readonly SubmissionAttachmentState[];
  contactAuthorityPosture?: SubmissionContactAuthorityPosture;
  contactPreferenceSummary?: ContactPreferenceValidationSummary;
  urgentDecisionState?: ValidationUrgentDecisionState;
  convergenceState?: "valid" | "invalid";
}

export type ValidationMode = "draft_save" | "submit";

export type ValidationIssueScope =
  | "field"
  | "field_group"
  | "step"
  | "attachment"
  | "contact_authority"
  | "submit_preflight";

export interface SubmissionEnvelopeValidationIssue {
  code: string;
  scope: ValidationIssueScope;
  severity: "error" | "warning" | "info";
  blocking: boolean;
  questionKey?: string;
  stepKey?: string;
  groupKey?: string;
  attachmentRef?: string;
  reasonRef?: string;
}

export interface QuestionValidationState {
  questionKey: string;
  requestType: IntakeRequestType;
  stepKey: string;
  visible: boolean;
  required: boolean;
  answerPresent: boolean;
  state: "valid" | "missing" | "invalid" | "superseded" | "inactive" | "optional_unanswered";
  normalizationTarget: string;
  summaryRenderer: string;
  safetyRelevance: string;
  answerType: Phase1AnswerType;
  cardinality: "single" | "multiple";
}

export interface StepValidationState {
  stepKey: string;
  missingQuestionKeys: readonly string[];
  invalidQuestionKeys: readonly string[];
  supersededQuestionKeys: readonly string[];
  blockerCodes: readonly string[];
}

export interface RequiredFieldMeaningRow {
  questionKey: string;
  requestType: IntakeRequestType;
  stepKey: string;
  visibilityState: "visible" | "hidden";
  requiredState: "required" | "optional";
  answerState:
    | "valid"
    | "missing"
    | "invalid"
    | "superseded"
    | "inactive"
    | "optional_unanswered";
  activePayloadDisposition: "included" | "excluded";
  normalizationTarget: string;
  summaryRenderer: string;
  safetyRelevance: string;
}

export interface RequiredFieldMeaningMap {
  mapSchemaVersion: "REQUIRED_FIELD_MEANING_MAP_V1";
  bundleRef: string;
  requestType: IntakeRequestType;
  rows: readonly RequiredFieldMeaningRow[];
}

export interface SubmitReadinessState {
  state: "ready" | "blocked" | "review_required";
  blockerCodes: readonly string[];
  missingRequiredQuestionKeys: readonly string[];
  invalidQuestionKeys: readonly string[];
  attachmentBlockerRefs: readonly string[];
  contactAuthorityState: SubmissionContactAuthorityPosture["authorityState"];
  urgentDecisionState: ValidationUrgentDecisionState;
  convergenceState: "valid" | "invalid";
  gapRefs: readonly string[];
}

export interface SubmissionEnvelopeValidationVerdict {
  verdictSchemaVersion: "SUBMISSION_ENVELOPE_VALIDATION_VERDICT_V1";
  validationMode: ValidationMode;
  verdictState:
    | "shape_valid"
    | "shape_invalid"
    | "submit_ready"
    | "submit_blocked"
    | "submit_review_required";
  verdictHash: string;
  envelopeRef: string;
  draftPublicId: string;
  bundleRef: string;
  requestType: IntakeRequestType;
  issues: readonly SubmissionEnvelopeValidationIssue[];
  questionStates: readonly QuestionValidationState[];
  stepStates: readonly StepValidationState[];
  requiredFieldMeaningMap: RequiredFieldMeaningMap;
  activeQuestionKeys: readonly string[];
  supersededQuestionKeys: readonly string[];
  activeStructuredAnswers: Record<string, unknown>;
  normalizedSubmissionCandidate: Record<string, unknown>;
  submitReadiness: SubmitReadinessState;
}

function assertQuestionDefinitionIntegrity(definitions: readonly Phase1QuestionDefinition[]): void {
  const seenQuestionKeys = new Set<string>();
  for (const definition of definitions) {
    invariant(
      definition.questionKey.trim().length > 0,
      "PHASE1_QUESTION_KEY_REQUIRED",
      "Phase 1 question definitions require questionKey.",
    );
    invariant(
      !seenQuestionKeys.has(definition.questionKey),
      "PHASE1_QUESTION_DUPLICATE",
      `Duplicate questionKey ${definition.questionKey}.`,
    );
    seenQuestionKeys.add(definition.questionKey);
    invariant(
      definition.normalizationTarget.trim().length > 0,
      "PHASE1_QUESTION_NORMALIZATION_REQUIRED",
      `Question ${definition.questionKey} requires normalizationTarget.`,
    );
    invariant(
      definition.summaryRenderer.trim().length > 0,
      "PHASE1_QUESTION_SUMMARY_REQUIRED",
      `Question ${definition.questionKey} requires summaryRenderer.`,
    );
    invariant(
      definition.safetyRelevance === "none" ||
        definition.safetyRelevance === "triage_relevant" ||
        definition.safetyRelevance === "safety_relevant",
      "PHASE1_QUESTION_SAFETY_REQUIRED",
      `Question ${definition.questionKey} requires safetyRelevance.`,
    );
    parsePredicate(definition.visibilityPredicate);
    parsePredicate(definition.requiredWhen);
  }
}

function compileQuestionDefinitions(
  definitions: readonly Phase1QuestionDefinition[],
): readonly CompiledQuestionDefinition[] {
  assertQuestionDefinitionIntegrity(definitions);
  return definitions.map((definition) => ({
    ...definition,
    visibilityClauses: parsePredicate(definition.visibilityPredicate),
    requiredClauses: parsePredicate(definition.requiredWhen),
  }));
}

function evaluatePredicate(
  clauses: readonly PredicateClause[],
  requestType: IntakeRequestType,
  answers: Record<string, unknown>,
): boolean {
  return clauses.every((clause) => {
    if (clause.kind === "requestType") {
      return requestType === clause.expected;
    }
    const value = answers[clause.questionKey];
    return typeof value === "string" && value === clause.expected;
  });
}

function hasMeaningfulAnswer(value: unknown, answerType: Phase1AnswerType): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (answerType === "multi_select") {
    return Array.isArray(value) && value.length > 0;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return true;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isPartialDate(value: string): boolean {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [yearToken, monthToken] = value.split("-");
    const year = Number(yearToken);
    const month = Number(monthToken);
    return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
  }
  return isIsoDate(value);
}

function validateAnswerValue(
  definition: Phase1QuestionDefinition,
  value: unknown,
): { valid: true } | { valid: false; code: string } {
  if (definition.cardinality === "multiple") {
    if (!Array.isArray(value)) {
      return { valid: false, code: "FIELD_CARDINALITY_INVALID" };
    }
    if (!value.every((entry) => typeof entry === "string")) {
      return { valid: false, code: "FIELD_TYPE_INVALID" };
    }
    if (definition.allowedAnswers) {
      const invalidEntry = value.find((entry) => !definition.allowedAnswers?.includes(entry));
      if (invalidEntry) {
        return { valid: false, code: "FIELD_VALUE_NOT_ALLOWED" };
      }
    }
    return { valid: true };
  }

  if (Array.isArray(value)) {
    return { valid: false, code: "FIELD_CARDINALITY_INVALID" };
  }

  switch (definition.answerType) {
    case "single_select":
      if (typeof value !== "string") {
        return { valid: false, code: "FIELD_TYPE_INVALID" };
      }
      if (value.trim().length === 0) {
        return { valid: false, code: "FIELD_VALUE_EMPTY" };
      }
      if (definition.allowedAnswers && !definition.allowedAnswers.includes(value)) {
        return { valid: false, code: "FIELD_VALUE_NOT_ALLOWED" };
      }
      return { valid: true };
    case "boolean":
      return typeof value === "boolean"
        ? { valid: true }
        : { valid: false, code: "FIELD_TYPE_INVALID" };
    case "date":
      return typeof value === "string" && isIsoDate(value)
        ? { valid: true }
        : { valid: false, code: "FIELD_TYPE_INVALID" };
    case "partial_date":
      return typeof value === "string" && isPartialDate(value)
        ? { valid: true }
        : { valid: false, code: "FIELD_TYPE_INVALID" };
    case "short_text":
    case "short_text_or_unknown":
    case "long_text":
      return typeof value === "string" && value.trim().length > 0
        ? { valid: true }
        : { valid: false, code: "FIELD_VALUE_EMPTY" };
    case "multi_select":
      return { valid: false, code: "FIELD_CARDINALITY_INVALID" };
    default:
      return { valid: false, code: "FIELD_TYPE_INVALID" };
  }
}

function issueSortKey(issue: SubmissionEnvelopeValidationIssue): string {
  return [
    issue.scope,
    issue.stepKey ?? "",
    issue.groupKey ?? "",
    issue.questionKey ?? "",
    issue.attachmentRef ?? "",
    issue.code,
  ].join("::");
}

function buildStepStates(
  questionStates: readonly QuestionValidationState[],
  issues: readonly SubmissionEnvelopeValidationIssue[],
): readonly StepValidationState[] {
  const stepKeys = new Set<string>([
    ...questionStates.map((state) => state.stepKey),
    "request_type",
    "contact_preferences",
    "supporting_files",
    "review_submit",
  ]);
  return [...stepKeys]
    .sort(compareStrings)
    .map((stepKey) => {
      const stepQuestionStates = questionStates.filter((state) => state.stepKey === stepKey);
      const stepIssues = issues.filter((issue) => issue.stepKey === stepKey);
      return {
        stepKey,
        missingQuestionKeys: uniqueSorted(
          stepQuestionStates
            .filter((state) => state.state === "missing")
            .map((state) => state.questionKey),
        ),
        invalidQuestionKeys: uniqueSorted(
          stepQuestionStates
            .filter((state) => state.state === "invalid")
            .map((state) => state.questionKey),
        ),
        supersededQuestionKeys: uniqueSorted(
          stepQuestionStates
            .filter((state) => state.state === "superseded")
            .map((state) => state.questionKey),
        ),
        blockerCodes: uniqueSorted(
          stepIssues.filter((issue) => issue.blocking).map((issue) => issue.code),
        ),
      } satisfies StepValidationState;
    });
}

function buildRequiredFieldMeaningMap(
  bundleRef: string,
  requestType: IntakeRequestType,
  questionStates: readonly QuestionValidationState[],
): RequiredFieldMeaningMap {
  return {
    mapSchemaVersion: "REQUIRED_FIELD_MEANING_MAP_V1",
    bundleRef,
    requestType,
    rows: questionStates
      .map(
        (state): RequiredFieldMeaningRow => ({
        questionKey: state.questionKey,
        requestType: state.requestType,
        stepKey: state.stepKey,
        visibilityState: state.visible ? "visible" : "hidden",
        requiredState: state.required ? "required" : "optional",
        answerState: state.state,
        activePayloadDisposition:
          state.state === "valid" || state.state === "optional_unanswered"
            ? "included"
            : "excluded",
        normalizationTarget: state.normalizationTarget,
        summaryRenderer: state.summaryRenderer,
        safetyRelevance: state.safetyRelevance,
      }),
      )
      .sort((left, right) => compareStrings(left.questionKey, right.questionKey)),
  };
}

function resolveAttachmentStates(
  attachmentRefs: readonly string[],
  providedStates: readonly SubmissionAttachmentState[] | undefined,
): readonly SubmissionAttachmentState[] {
  const byRef = new Map((providedStates ?? []).map((state) => [state.attachmentRef, state]));
  return attachmentRefs
    .map((attachmentRef) =>
      byRef.get(attachmentRef) ?? {
        attachmentRef,
        outcomeRef: "PARALLEL_INTERFACE_GAP_145_ATTACHMENT_SCAN_PIPELINE_PENDING",
        submitDisposition: "state_unknown" as const,
        currentSafeMode: "recovery_only" as const,
        documentReferenceState: "pending" as const,
        quarantineState: "unknown" as const,
      },
    )
    .sort((left, right) => compareStrings(left.attachmentRef, right.attachmentRef));
}

function resolveContactAuthorityPosture(
  input: SubmissionEnvelopeValidationInput,
): SubmissionContactAuthorityPosture {
  if (input.contactAuthorityPosture) {
    return {
      ...input.contactAuthorityPosture,
      reasonCodes: uniqueSorted(input.contactAuthorityPosture.reasonCodes),
    };
  }
  if (input.surfaceChannelProfile === "browser") {
    return {
      policyRef: "GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1",
      authorityState: "assumed_self_service_browser_minimum",
      reasonCodes: ["GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1"],
    };
  }
  return {
    policyRef: "PARALLEL_INTERFACE_GAP_145_EMBEDDED_CONTACT_AUTHORITY_DEFERRED",
    authorityState: "rebind_required",
    reasonCodes: ["PARALLEL_INTERFACE_GAP_145_EMBEDDED_CONTACT_AUTHORITY_DEFERRED"],
  };
}

function resolveContactPreferenceSummary(
  input: SubmissionEnvelopeValidationInput,
): ContactPreferenceValidationSummary {
  if (input.contactPreferenceSummary) {
    return {
      ...input.contactPreferenceSummary,
      reasonCodes: uniqueSorted(input.contactPreferenceSummary.reasonCodes),
    };
  }
  return {
    validationSummarySchemaVersion: "PHASE1_CONTACT_PREFERENCE_VALIDATION_SUMMARY_V1",
    draftPublicId: input.draftPublicId,
    envelopeRef: input.envelopeRef,
    contactPreferenceCaptureRef: null,
    contactPreferencesRef: null,
    maskedViewRef: null,
    routeSnapshotSeedRef: null,
    preferredChannel: input.contactPreferences.preferredChannel,
    preferredDestinationMasked: null,
    completenessState: "complete",
    reasonCodes: ["PARALLEL_INTERFACE_GAP_147_CONTACT_PREFERENCE_CAPTURE_PENDING"],
    sourceAuthorityClass: "contact_capture_missing",
  };
}

function buildVerdictHash(input: {
  mode: ValidationMode;
  requestType: IntakeRequestType;
  bundleRef: string;
  issues: readonly SubmissionEnvelopeValidationIssue[];
  questionStates: readonly QuestionValidationState[];
  submitReadiness: SubmitReadinessState;
}): string {
  return stableDigest(
    JSON.stringify({
      mode: input.mode,
      requestType: input.requestType,
      bundleRef: input.bundleRef,
      issues: input.issues.map((issue) => ({
        code: issue.code,
        scope: issue.scope,
        blocking: issue.blocking,
        questionKey: issue.questionKey ?? null,
        stepKey: issue.stepKey ?? null,
        groupKey: issue.groupKey ?? null,
        attachmentRef: issue.attachmentRef ?? null,
      })),
      questionStates: input.questionStates.map((state) => ({
        questionKey: state.questionKey,
        state: state.state,
        visible: state.visible,
        required: state.required,
      })),
      submitReadiness: input.submitReadiness,
    }),
  );
}

export function buildRequiredFieldMeaningRowsForMatrix(): readonly RequiredFieldMeaningRow[] {
  const compiled = compileQuestionDefinitions(phase1QuestionDefinitions);
  return compiled
    .map(
      (definition): RequiredFieldMeaningRow => ({
      questionKey: definition.questionKey,
      requestType: definition.requestType,
      stepKey: definition.stepKey,
      visibilityState: "visible" as const,
      requiredState: "required",
      answerState: "optional_unanswered" as const,
      activePayloadDisposition: "included" as const,
      normalizationTarget: definition.normalizationTarget,
      summaryRenderer: definition.summaryRenderer,
      safetyRelevance: definition.safetyRelevance,
    }),
    )
    .sort((left, right) => compareStrings(left.questionKey, right.questionKey));
}

export function createSubmissionEnvelopeValidationService(options?: {
  bundle?: Phase1IntakeExperienceBundle;
  questionDefinitions?: readonly Phase1QuestionDefinition[];
}) {
  const compiledDefinitions = compileQuestionDefinitions(
    options?.questionDefinitions ?? phase1QuestionDefinitions,
  );
  const normalizedSubmissionService = createNormalizedSubmissionService({
    bundle: options?.bundle,
    questionDefinitions: options?.questionDefinitions,
  });

  function evaluate(input: SubmissionEnvelopeValidationInput, mode: ValidationMode) {
    const bundle =
      input.bundle ?? options?.bundle ?? resolveDefaultPhase1IntakeExperienceBundle(input.surfaceChannelProfile);
    invariant(
      bundle.questionDefinitionContractRef === phase1QuestionDefinitionContract.questionDefinitionContractId,
      "PHASE1_BUNDLE_CONTRACT_DRIFT",
      "Bundle question definition contract ref drifted from seq_140.",
    );
    const issues: SubmissionEnvelopeValidationIssue[] = [];
    const questionStates: QuestionValidationState[] = [];
    const matchingDefinitions = compiledDefinitions
      .filter((definition) => definition.requestType === input.requestType)
      .sort((left, right) => compareStrings(left.questionKey, right.questionKey));
    const knownQuestionKeys = new Set(matchingDefinitions.map((definition) => definition.questionKey));

    for (const [questionKey, value] of Object.entries(input.structuredAnswers)) {
      if (!knownQuestionKeys.has(questionKey)) {
        const isKnownInOtherRequestType = compiledDefinitions.some(
          (definition) => definition.questionKey === questionKey,
        );
        issues.push({
          code: isKnownInOtherRequestType ? "FIELD_SUPERSEDED_HIDDEN_ANSWER" : "QUESTION_KEY_UNKNOWN",
          scope: "field",
          severity: isKnownInOtherRequestType ? "info" : "error",
          blocking: !isKnownInOtherRequestType,
          questionKey,
          stepKey: "details",
          reasonRef: isKnownInOtherRequestType ? "request_type_changed" : "unknown_question_key",
        });
        if (!isKnownInOtherRequestType && value !== undefined) {
          questionStates.push({
            questionKey,
            requestType: input.requestType,
            stepKey: "details",
            visible: false,
            required: false,
            answerPresent: hasMeaningfulAnswer(value, "short_text"),
            state: "invalid",
            normalizationTarget: "",
            summaryRenderer: "",
            safetyRelevance: "triage_relevant",
            answerType: "short_text",
            cardinality: "single",
          });
        }
      }
    }

    const activeStructuredAnswers: Record<string, unknown> = {};
    const supersededQuestionKeys: string[] = [];
    const activeDefinitions: CompiledQuestionDefinition[] = [];

    for (const definition of matchingDefinitions) {
      const visible = evaluatePredicate(definition.visibilityClauses, input.requestType, input.structuredAnswers);
      const required = evaluatePredicate(definition.requiredClauses, input.requestType, input.structuredAnswers);
      const rawValue = input.structuredAnswers[definition.questionKey];
      const answerPresent = hasMeaningfulAnswer(rawValue, definition.answerType);

      let state: QuestionValidationState["state"];
      if (!visible) {
        state = answerPresent ? "superseded" : "inactive";
        if (answerPresent) {
          supersededQuestionKeys.push(definition.questionKey);
          issues.push({
            code: "FIELD_SUPERSEDED_HIDDEN_ANSWER",
            scope: "field",
            severity: "info",
            blocking: false,
            questionKey: definition.questionKey,
            stepKey: definition.stepKey,
            reasonRef: definition.supersessionPolicy,
          });
        }
      } else if (!answerPresent) {
        state = required ? "missing" : "optional_unanswered";
        if (required) {
          issues.push({
            code: "FIELD_REQUIRED",
            scope: "field",
            severity: mode === "submit" ? "error" : "warning",
            blocking: mode === "submit",
            questionKey: definition.questionKey,
            stepKey: definition.stepKey,
            reasonRef: definition.requiredWhen,
          });
        }
      } else {
        const shapeCheck = validateAnswerValue(definition, rawValue);
        if (!shapeCheck.valid) {
          state = "invalid";
          issues.push({
            code: shapeCheck.code,
            scope: "field",
            severity: "error",
            blocking: true,
            questionKey: definition.questionKey,
            stepKey: definition.stepKey,
            reasonRef: definition.answerType,
          });
        } else {
          state = "valid";
          activeStructuredAnswers[definition.questionKey] = rawValue;
          activeDefinitions.push(definition);
        }
      }

      questionStates.push({
        questionKey: definition.questionKey,
        requestType: definition.requestType,
        stepKey: definition.stepKey,
        visible,
        required,
        answerPresent,
        state,
        normalizationTarget: definition.normalizationTarget,
        summaryRenderer: definition.summaryRenderer,
        safetyRelevance: definition.safetyRelevance,
        answerType: definition.answerType,
        cardinality: definition.cardinality,
      });
    }

    const contactIssues: SubmissionEnvelopeValidationIssue[] = [];
    const validPreferredChannels = new Set(["sms", "phone", "email"]);
    const validContactWindows = new Set(["weekday_daytime", "weekday_evening", "anytime"]);
    if (!validPreferredChannels.has(input.contactPreferences.preferredChannel)) {
      contactIssues.push({
        code: "CONTACT_PREFERENCE_ENUM_INVALID",
        scope: "field_group",
        severity: "error",
        blocking: true,
        groupKey: "contact_preferences",
        stepKey: "contact_preferences",
        reasonRef: "preferredChannel",
      });
    }
    if (!validContactWindows.has(input.contactPreferences.contactWindow)) {
      contactIssues.push({
        code: "CONTACT_PREFERENCE_ENUM_INVALID",
        scope: "field_group",
        severity: "error",
        blocking: true,
        groupKey: "contact_preferences",
        stepKey: "contact_preferences",
        reasonRef: "contactWindow",
      });
    }
    issues.push(...contactIssues);

    const contactAuthorityPosture = resolveContactAuthorityPosture(input);
    const contactPreferenceSummary = resolveContactPreferenceSummary(input);
    if (contactAuthorityPosture.authorityState === "blocked" || contactAuthorityPosture.authorityState === "rebind_required") {
      issues.push({
        code: "CONTACT_AUTHORITY_BLOCKED",
        scope: "contact_authority",
        severity: "error",
        blocking: mode === "submit",
        groupKey: "contact_authority",
        stepKey: "contact_preferences",
        reasonRef: contactAuthorityPosture.policyRef,
      });
    } else {
      issues.push({
        code: "GAP_RESOLVED_CONTACT_AUTHORITY_PHASE1_SELF_SERVICE_MINIMUM_V1",
        scope: "contact_authority",
        severity: "info",
        blocking: false,
        groupKey: "contact_authority",
        stepKey: "contact_preferences",
        reasonRef: contactAuthorityPosture.policyRef,
      });
    }

    if (contactPreferenceSummary.completenessState !== "complete") {
      issues.push({
        code:
          contactPreferenceSummary.completenessState === "blocked"
            ? "CONTACT_PREFERENCE_BLOCKED"
            : "CONTACT_PREFERENCE_INCOMPLETE",
        scope: "field_group",
        severity: mode === "submit" ? "error" : "warning",
        blocking: mode === "submit",
        groupKey: "contact_preferences",
        stepKey: "contact_preferences",
        reasonRef: contactPreferenceSummary.reasonCodes[0] ?? "contact_preferences_incomplete",
      });
    }

    const attachmentStates = resolveAttachmentStates(input.attachmentRefs, input.attachmentStates);
    for (const attachmentState of attachmentStates) {
      if (attachmentState.submitDisposition === "state_unknown") {
        issues.push({
          code: "ATTACHMENT_STATE_UNRESOLVED",
          scope: "attachment",
          severity: mode === "submit" ? "error" : "warning",
          blocking: mode === "submit",
          attachmentRef: attachmentState.attachmentRef,
          stepKey: "supporting_files",
          reasonRef: attachmentState.outcomeRef,
        });
        continue;
      }
      if (attachmentState.submitDisposition !== "routine_submit_allowed") {
        issues.push({
          code: "ATTACHMENT_SUBMIT_BLOCKED",
          scope: "attachment",
          severity: "error",
          blocking: mode === "submit",
          attachmentRef: attachmentState.attachmentRef,
          stepKey: "supporting_files",
          reasonRef: attachmentState.outcomeRef,
        });
      }
    }

    const convergenceState = input.convergenceState ?? "valid";
    if (convergenceState !== "valid") {
      issues.push({
        code: "INTAKE_CONVERGENCE_INVALID",
        scope: "submit_preflight",
        severity: "error",
        blocking: mode === "submit",
        stepKey: "review_submit",
        reasonRef: input.intakeConvergenceContractRef,
      });
    }

    if (!input.completedStepKeys.includes("request_type")) {
      issues.push({
        code: "REQUEST_TYPE_STEP_INCOMPLETE",
        scope: "step",
        severity: mode === "submit" ? "error" : "warning",
        blocking: mode === "submit",
        stepKey: "request_type",
      });
    }

    if (!bundle.supportedRequestTypes.includes(input.requestType)) {
      issues.push({
        code: "REQUEST_TYPE_UNSUPPORTED",
        scope: "submit_preflight",
        severity: "error",
        blocking: true,
        stepKey: "request_type",
        reasonRef: bundle.bundleRef,
      });
    }

    if (bundle.compatibilityMode === "blocked") {
      issues.push({
        code: "BUNDLE_COMPATIBILITY_BLOCKED",
        scope: "submit_preflight",
        severity: "error",
        blocking: mode === "submit",
        stepKey: "review_submit",
        reasonRef: bundle.bundleRef,
      });
    } else if (bundle.compatibilityMode === "review_migration_required") {
      issues.push({
        code: "BUNDLE_COMPATIBILITY_REVIEW_REQUIRED",
        scope: "submit_preflight",
        severity: "warning",
        blocking: mode === "submit",
        stepKey: "review_submit",
        reasonRef: bundle.bundleRef,
      });
    }

    if (
      input.identityContext.bindingState === "identity_repair_required" ||
      input.identityContext.actorBindingState === "identity_repair_required" ||
      input.identityContext.claimResumeState === "blocked"
    ) {
      issues.push({
        code: "IDENTITY_CONTEXT_BLOCKED",
        scope: "submit_preflight",
        severity: "error",
        blocking: mode === "submit",
        stepKey: "review_submit",
        reasonRef: input.identityContext.bindingState,
      });
    }

    if (
      (input.surfaceChannelProfile === "embedded" && !input.channelCapabilityCeiling.canRenderEmbedded) ||
      (input.attachmentRefs.length > 0 && !input.channelCapabilityCeiling.canUploadFiles) ||
      !input.channelCapabilityCeiling.canRenderTrackStatus ||
      input.channelCapabilityCeiling.mutatingResumeState === "blocked"
    ) {
      issues.push({
        code: "CHANNEL_CAPABILITY_BLOCKED",
        scope: "submit_preflight",
        severity: "error",
        blocking: mode === "submit",
        stepKey: "review_submit",
        reasonRef: input.surfaceChannelProfile,
      });
    }

    const urgentDecisionState = input.urgentDecisionState ?? "pending";
    if (urgentDecisionState === "pending") {
      issues.push({
        code: "URGENT_DECISION_PENDING",
        scope: "submit_preflight",
        severity: mode === "submit" ? "error" : "warning",
        blocking: mode === "submit",
        stepKey: "review_submit",
        reasonRef: "PARALLEL_INTERFACE_GAP_145_SYNCHRONOUS_SAFETY_ENGINE_PENDING",
      });
    } else if (urgentDecisionState === "urgent_diversion_required") {
      issues.push({
        code: "URGENT_DIVERSION_REQUIRED",
        scope: "submit_preflight",
        severity: "error",
        blocking: mode === "submit",
        stepKey: "review_submit",
      });
    } else if (urgentDecisionState === "urgent_diverted") {
      issues.push({
        code: "URGENT_ALREADY_DIVERTED",
        scope: "submit_preflight",
        severity: "error",
        blocking: mode === "submit",
        stepKey: "review_submit",
      });
    }

    const sortedIssues = [...issues].sort((left, right) => compareStrings(issueSortKey(left), issueSortKey(right)));
    const requiredFieldMeaningMap = buildRequiredFieldMeaningMap(
      bundle.bundleRef,
      input.requestType,
      questionStates.sort((left, right) => compareStrings(left.questionKey, right.questionKey)),
    );
    const stepStates = buildStepStates(questionStates, sortedIssues);
    const normalizedPreview = normalizedSubmissionService.buildPreviewCandidate({
      requestType: input.requestType,
      activeStructuredAnswers,
      freeTextNarrative: input.freeTextNarrative,
      attachmentRefs: input.attachmentRefs,
      contactPreferencesRef: contactPreferenceSummary.contactPreferencesRef,
    });
    const normalizedSubmissionCandidate = {
      normalizationVersionRef: normalizedPreview.normalizationVersionRef,
      requestType: normalizedPreview.requestType,
      ...normalizedPreview.requestShape,
      authoredNarrative: normalizedPreview.authoredNarrative,
      summaryFragments: normalizedPreview.summaryFragments,
      dedupeFeatures: normalizedPreview.dedupeFeatures,
      dedupeFingerprint: normalizedPreview.dedupeFingerprint,
      attachmentRefs: normalizedPreview.attachmentRefs,
      contactPreferencesRef: normalizedPreview.contactPreferencesRef,
      reasonCodes: normalizedPreview.reasonCodes,
    } satisfies Record<string, unknown>;

    const submitBlockingIssues = sortedIssues.filter((issue) => issue.blocking);
    const reviewCodes = new Set([
      "ATTACHMENT_SUBMIT_BLOCKED",
      "BUNDLE_COMPATIBILITY_REVIEW_REQUIRED",
    ]);
    const submitReadinessState: SubmitReadinessState["state"] =
      submitBlockingIssues.length === 0
        ? "ready"
        : submitBlockingIssues.some((issue) => reviewCodes.has(issue.code))
          ? "review_required"
          : "blocked";

    const submitReadiness: SubmitReadinessState = {
      state: submitReadinessState,
      blockerCodes: uniqueSorted(submitBlockingIssues.map((issue) => issue.code)),
      missingRequiredQuestionKeys: uniqueSorted(
        questionStates.filter((state) => state.state === "missing").map((state) => state.questionKey),
      ),
      invalidQuestionKeys: uniqueSorted(
        questionStates.filter((state) => state.state === "invalid").map((state) => state.questionKey),
      ),
      attachmentBlockerRefs: uniqueSorted(
        attachmentStates
          .filter((state) => state.submitDisposition !== "routine_submit_allowed")
          .map((state) => state.attachmentRef),
      ),
      contactAuthorityState: contactAuthorityPosture.authorityState,
      urgentDecisionState,
      convergenceState,
      gapRefs: uniqueSorted(
        [
          ...(urgentDecisionState === "pending"
            ? ["PARALLEL_INTERFACE_GAP_145_SYNCHRONOUS_SAFETY_ENGINE_PENDING"]
            : []),
          ...contactPreferenceSummary.reasonCodes.filter((code) =>
            code.startsWith("PARALLEL_INTERFACE_GAP_"),
          ),
          ...attachmentStates
            .filter((state) => state.submitDisposition === "state_unknown")
            .map(() => "PARALLEL_INTERFACE_GAP_145_ATTACHMENT_SCAN_PIPELINE_PENDING"),
          ...contactAuthorityPosture.reasonCodes.filter((code) => code.startsWith("PARALLEL_INTERFACE_GAP_")),
        ].flat(),
      ),
    };

    const verdictState: SubmissionEnvelopeValidationVerdict["verdictState"] =
      mode === "draft_save"
        ? sortedIssues.some((issue) => issue.blocking) && !submitBlockingIssues.every((issue) => issue.code === "FIELD_REQUIRED")
          ? "shape_invalid"
          : "shape_valid"
        : submitReadiness.state === "ready"
          ? "submit_ready"
          : submitReadiness.state === "review_required"
            ? "submit_review_required"
            : "submit_blocked";

    return {
      verdictSchemaVersion: "SUBMISSION_ENVELOPE_VALIDATION_VERDICT_V1",
      validationMode: mode,
      verdictState,
      verdictHash: buildVerdictHash({
        mode,
        requestType: input.requestType,
        bundleRef: bundle.bundleRef,
        issues: sortedIssues,
        questionStates,
        submitReadiness,
      }),
      envelopeRef: input.envelopeRef,
      draftPublicId: input.draftPublicId,
      bundleRef: bundle.bundleRef,
      requestType: input.requestType,
      issues: sortedIssues,
      questionStates,
      stepStates,
      requiredFieldMeaningMap,
      activeQuestionKeys: Object.keys(activeStructuredAnswers).sort(compareStrings),
      supersededQuestionKeys: uniqueSorted(supersededQuestionKeys),
      activeStructuredAnswers,
      normalizedSubmissionCandidate,
      submitReadiness,
    } satisfies SubmissionEnvelopeValidationVerdict;
  }

  return {
    bundle: options?.bundle ?? resolveDefaultPhase1IntakeExperienceBundle("browser"),
    questionDefinitionContractRef: phase1QuestionDefinitionContract.questionDefinitionContractId,
    questionDefinitions: compiledDefinitions,
    evaluateDraftSave(input: SubmissionEnvelopeValidationInput): SubmissionEnvelopeValidationVerdict {
      return evaluate(input, "draft_save");
    },
    evaluateSubmit(input: SubmissionEnvelopeValidationInput): SubmissionEnvelopeValidationVerdict {
      return evaluate(input, "submit");
    },
    buildRequiredFieldMeaningMap(
      input: SubmissionEnvelopeValidationInput,
    ): RequiredFieldMeaningMap {
      return evaluate(input, "draft_save").requiredFieldMeaningMap;
    },
  };
}
