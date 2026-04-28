import { createHash } from "node:crypto";
import {
  RequestBackboneInvariantError,
  type SubmissionSourceChannel,
  type SurfaceChannelProfile,
} from "../../../domain-kernel/src/index";
import {
  defaultPhase1IntakeExperienceBundles,
  type IntakeRequestType,
  type Phase1AnswerType,
  type Phase1IntakeExperienceBundle,
  type Phase1QuestionDefinition,
  phase1QuestionDefinitionContract,
  phase1QuestionDefinitions,
  phase1RequestTypeTaxonomy,
} from "./intake-experience-bundle";

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

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort(compareStrings);
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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function stableDigest(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function canonicalizeText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function humanizeToken(value: string): string {
  return canonicalizeText(value).replace(/_/g, " ");
}

function normalizeAnswerValue(answerType: Phase1AnswerType, value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (answerType === "multi_select") {
    invariant(
      Array.isArray(value),
      "INVALID_MULTI_SELECT_VALUE",
      "multi_select answers must be arrays.",
    );
    return uniqueSorted(
      value.map((entry) => {
        invariant(
          typeof entry === "string",
          "INVALID_MULTI_SELECT_VALUE",
          "multi_select entries must be strings.",
        );
        return canonicalizeText(entry);
      }),
    );
  }
  if (answerType === "boolean") {
    invariant(
      typeof value === "boolean",
      "INVALID_BOOLEAN_VALUE",
      "boolean answers must be booleans.",
    );
    return value;
  }
  invariant(
    typeof value === "string",
    "INVALID_TEXT_VALUE",
    "non-boolean answers must be strings.",
  );
  if (answerType === "single_select") {
    return canonicalizeText(value);
  }
  if (answerType === "date" || answerType === "partial_date") {
    return value.trim();
  }
  return canonicalizeText(value);
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split(".").filter(Boolean);
  invariant(segments.length > 0, "INVALID_NORMALIZATION_TARGET", "normalizationTarget is empty.");
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    const existing = cursor[segment];
    if (typeof existing !== "object" || existing === null || Array.isArray(existing)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  const leaf = segments[segments.length - 1];
  invariant(
    typeof leaf === "string",
    "INVALID_NORMALIZATION_TARGET",
    "normalizationTarget is invalid.",
  );
  cursor[leaf] = value;
}

function getNestedValue(target: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((cursor, segment) => {
      if (typeof cursor !== "object" || cursor === null || Array.isArray(cursor)) {
        return undefined;
      }
      return (cursor as Record<string, unknown>)[segment];
    }, target);
}

function tokenizeNarrative(value: string): string[] {
  return uniqueSorted(
    canonicalizeText(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length > 0),
  );
}

function canonicalizeDedupeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((entry) => canonicalizeDedupeValue(entry))
      .sort((left, right) => compareStrings(stableStringify(left), stableStringify(right)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareStrings(left, right))
        .map(([key, entry]) => [key, canonicalizeDedupeValue(entry)]),
    );
  }
  return value;
}

interface CompiledQuestionDefinition extends Phase1QuestionDefinition {
  readonly requestShapePath: string;
}

export const normalizedSubmissionVersionRef = "PHASE1_NORMALIZED_SUBMISSION_V1";

export const normalizedSubmissionReasonCatalog = [
  {
    reasonCode: "GAP_RESOLVED_NORMALIZED_CONTRACT_PHASE1_V1",
    class: "contract",
    description:
      "par_149 resolved the canonical NormalizedSubmission contract and removed the provisional seed-only bridge.",
  },
  {
    reasonCode: "GAP_RESOLVED_FREE_TEXT_RULES_PHASE1_V1",
    class: "contract",
    description:
      "Free-text normalization now uses deterministic authored trimming and tokenization rules instead of copy-derived heuristics.",
  },
  {
    reasonCode: "GAP_RESOLVED_DEDUPE_FINGERPRINT_PHASE1_V1",
    class: "contract",
    description:
      "Duplicate fingerprints now derive from canonical request-shape features and narrative token fingerprints only.",
  },
  {
    reasonCode: "NARRATIVE_SOURCE_FREE_TEXT",
    class: "narrative",
    description: "The canonical narrative source came from the frozen freeTextNarrative field.",
  },
  {
    reasonCode: "NARRATIVE_SOURCE_REQUEST_FIELD",
    class: "narrative",
    description:
      "The canonical narrative source came from the request-type narrative question because freeTextNarrative was blank.",
  },
  {
    reasonCode: "EVIDENCE_READINESS_SAFETY_USABLE",
    class: "evidence_readiness",
    description:
      "The frozen snapshot contains enough governed evidence for safety and duplicate policy to use the normalized payload directly.",
  },
  {
    reasonCode: "EVIDENCE_READINESS_MANUAL_REVIEW_ONLY",
    class: "evidence_readiness",
    description:
      "The frozen snapshot must be treated as manual-review-only because authority or capability posture prevents calm automation.",
  },
  {
    reasonCode: "REQUEST_TYPE_MAPPING_SYMPTOMS_V1",
    class: "mapping",
    description:
      "Applied the Symptoms request-shape mapping rules published in seq_140 and par_149.",
  },
  {
    reasonCode: "REQUEST_TYPE_MAPPING_MEDS_V1",
    class: "mapping",
    description: "Applied the Meds request-shape mapping rules published in seq_140 and par_149.",
  },
  {
    reasonCode: "REQUEST_TYPE_MAPPING_ADMIN_V1",
    class: "mapping",
    description: "Applied the Admin request-shape mapping rules published in seq_140 and par_149.",
  },
  {
    reasonCode: "REQUEST_TYPE_MAPPING_RESULTS_V1",
    class: "mapping",
    description:
      "Applied the Results request-shape mapping rules published in seq_140 and par_149.",
  },
] as const;

export interface NormalizedSubmissionIdentityContext {
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

export interface NormalizedSubmissionChannelCapabilityCeiling {
  canUploadFiles: boolean;
  canRenderTrackStatus: boolean;
  canRenderEmbedded: boolean;
  mutatingResumeState: "allowed" | "rebind_required" | "blocked";
}

export interface NormalizedSubmissionFreezeInput {
  submissionSnapshotFreezeRef: string;
  submissionEnvelopeRef: string;
  sourceLineageRef: string;
  draftPublicId: string;
  requestType: IntakeRequestType;
  intakeExperienceBundleRef: string;
  activeQuestionKeys: readonly string[];
  activeStructuredAnswers: Record<string, unknown>;
  freeTextNarrative: string;
  attachmentRefs: readonly string[];
  audioRefs?: readonly string[];
  contactPreferencesRef: string | null;
  routeFamilyRef: string;
  routeIntentBindingRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  releaseApprovalFreezeRef: string;
  channelReleaseFreezeState: "released" | "monitoring" | "frozen";
  manifestVersionRef: string;
  sessionEpochRef: string | null;
  surfaceChannelProfile: SurfaceChannelProfile;
  ingressChannel: SubmissionSourceChannel;
  intakeConvergenceContractRef: string;
  sourceHash: string;
  semanticHash: string;
  evidenceCaptureBundleRef: string;
  frozenAt: string;
  identityContext: NormalizedSubmissionIdentityContext;
  channelCapabilityCeiling: NormalizedSubmissionChannelCapabilityCeiling;
  contactAuthorityState:
    | "verified"
    | "nhs_login_claim"
    | "verified_destination"
    | "support_attested"
    | "assumed_self_service_browser_minimum"
    | "rebind_required"
    | "blocked";
  contactAuthorityPolicyRef: string;
  evidenceReadinessStateOverride?: "urgent_live_only" | "safety_usable" | "manual_review_only";
}

export interface NormalizedSubmissionSummaryFragment {
  questionKey: string;
  normalizationTarget: string;
  summaryRendererRef: string;
  safetyRelevance: "none" | "triage_relevant" | "safety_relevant";
  valueHash: string;
  fragmentText: string;
}

export interface NormalizedSubmissionNarrative {
  sourceKind: "free_text" | "request_field" | "none";
  authoredText: string | null;
  canonicalText: string | null;
  tokenFingerprint: string | null;
}

export interface NormalizedSubmissionPreview {
  normalizationVersionRef: string;
  requestType: IntakeRequestType;
  requestShape: Record<string, unknown>;
  summaryFragments: readonly NormalizedSubmissionSummaryFragment[];
  authoredNarrative: NormalizedSubmissionNarrative;
  dedupeFeatures: Record<string, unknown>;
  dedupeFingerprint: string;
  attachmentRefs: readonly string[];
  contactPreferencesRef: string | null;
  reasonCodes: readonly string[];
}

export interface NormalizedSubmissionSnapshot {
  normalizedSubmissionSchemaVersion: "NORMALIZED_SUBMISSION_V1";
  normalizedSubmissionId: string;
  submissionEnvelopeRef: string;
  requestLineageRef: string | null;
  primaryIngressRecordRef: string;
  governingSnapshotRef: string;
  submissionSnapshotFreezeRef: string;
  evidenceCaptureBundleRef: string;
  requestType: IntakeRequestType;
  narrativeRef: string;
  structuredAnswersRef: string;
  channelMetadataRef: string;
  identityContextRef: string;
  attachmentRefs: readonly string[];
  audioRefs: readonly string[];
  contactPreferencesRef: string | null;
  submissionSourceTimestamp: string;
  patientMatchConfidenceRef: string | null;
  dedupeFingerprintRef: string;
  dedupeFingerprint: string;
  channelCapabilityCeiling: NormalizedSubmissionChannelCapabilityCeiling;
  contactAuthorityClass:
    | "self_asserted"
    | "nhs_login_claim"
    | "verified_destination"
    | "authority_confirmed";
  evidenceReadinessState: "urgent_live_only" | "safety_usable" | "manual_review_only";
  normalizationVersionRef: typeof normalizedSubmissionVersionRef;
  normalizedHash: string;
  supersedesNormalizedSubmissionRef: string | null;
  intakeExperienceBundleRef: string;
  questionDefinitionContractRef: string;
  sourceLineageRef: string;
  requestShape: Record<string, unknown>;
  activeStructuredAnswers: Record<string, unknown>;
  summaryFragments: readonly NormalizedSubmissionSummaryFragment[];
  authoredNarrative: NormalizedSubmissionNarrative;
  dedupeFeatures: Record<string, unknown>;
  normalizationReasonCodes: readonly string[];
  gapRefs: readonly string[];
  createdAt: string;
  version: number;
}

export interface PersistedNormalizedSubmissionRow extends NormalizedSubmissionSnapshot {
  aggregateType: "NormalizedSubmission";
}

export interface NormalizedSubmissionRepository {
  getNormalizedSubmission(
    normalizedSubmissionId: string,
  ): Promise<NormalizedSubmissionDocument | undefined>;
  saveNormalizedSubmission(document: NormalizedSubmissionDocument): Promise<void>;
  listNormalizedSubmissions(): Promise<readonly NormalizedSubmissionDocument[]>;
}

export interface CreateNormalizedSubmissionInput {
  normalizedSubmissionId: string;
  governingSnapshotRef: string;
  primaryIngressRecordRef: string;
  freeze: NormalizedSubmissionFreezeInput;
  requestLineageRef?: string | null;
  patientMatchConfidenceRef?: string | null;
  supersedesNormalizedSubmissionRef?: string | null;
  createdAt: string;
}

function compileDefinitions(
  definitions: readonly Phase1QuestionDefinition[],
): readonly CompiledQuestionDefinition[] {
  const taxonomyTargets = new Map<IntakeRequestType, Set<string>>();
  for (const entry of phase1RequestTypeTaxonomy.requestTypes) {
    taxonomyTargets.set(
      entry.requestType,
      new Set((entry as { normalizedFieldRefs?: readonly string[] }).normalizedFieldRefs ?? []),
    );
  }
  return definitions.map((definition) => {
    invariant(
      definition.normalizationTarget.startsWith("structuredAnswers."),
      "INVALID_NORMALIZATION_TARGET",
      `Question ${definition.questionKey} must normalize under structuredAnswers.*`,
    );
    const requestShapePath = definition.normalizationTarget.replace(/^structuredAnswers\./, "");
    const allowedTargets = taxonomyTargets.get(definition.requestType);
    invariant(
      !!allowedTargets && allowedTargets.has(definition.normalizationTarget),
      "REQUEST_TYPE_NORMALIZATION_TARGET_DRIFT",
      `Question ${definition.questionKey} drifted from the seq_140 taxonomy.`,
    );
    return {
      ...definition,
      requestShapePath,
    };
  });
}

function renderSummaryFragment(
  definition: CompiledQuestionDefinition,
  normalizedValue: unknown,
): string {
  if (normalizedValue === null || normalizedValue === undefined) {
    return "";
  }
  if (typeof normalizedValue === "boolean") {
    return `${definition.promptLabel} ${normalizedValue ? "Yes" : "No"}`;
  }
  if (Array.isArray(normalizedValue)) {
    return `${definition.promptLabel} ${normalizedValue.map((entry) => humanizeToken(String(entry))).join(", ")}`;
  }
  if (typeof normalizedValue === "string") {
    if (definition.answerType === "single_select") {
      return `${definition.promptLabel} ${humanizeToken(normalizedValue)}`;
    }
    return `${definition.promptLabel} ${normalizedValue}`;
  }
  return `${definition.promptLabel} ${stableStringify(normalizedValue)}`;
}

function resolveNarrative(
  requestType: IntakeRequestType,
  requestShape: Record<string, unknown>,
  freeTextNarrative: string,
): NormalizedSubmissionNarrative {
  const canonicalFreeText = canonicalizeText(freeTextNarrative);
  const requestFieldPath =
    requestType === "Symptoms"
      ? "symptoms.patientNarrative"
      : requestType === "Meds"
        ? "meds.issueNarrative"
        : requestType === "Admin"
          ? "admin.patientNarrative"
          : "results.patientQuestion";
  const requestFieldValue = getNestedValue(requestShape, requestFieldPath);
  const requestFieldNarrative =
    typeof requestFieldValue === "string" ? canonicalizeText(requestFieldValue) : "";
  const sourceKind =
    canonicalFreeText.length > 0
      ? "free_text"
      : requestFieldNarrative.length > 0
        ? "request_field"
        : "none";
  const authoredText =
    sourceKind === "free_text"
      ? canonicalFreeText
      : sourceKind === "request_field"
        ? requestFieldNarrative
        : null;
  return {
    sourceKind,
    authoredText,
    canonicalText: authoredText,
    tokenFingerprint: authoredText ? stableDigest(tokenizeNarrative(authoredText)) : null,
  };
}

function buildDedupeFeatures(
  requestType: IntakeRequestType,
  requestShape: Record<string, unknown>,
  narrative: NormalizedSubmissionNarrative,
): Record<string, unknown> {
  return {
    requestType,
    requestShape: canonicalizeDedupeValue(requestShape),
    narrativeTokenFingerprint: narrative.tokenFingerprint,
  };
}

export function buildNormalizedSubmissionHash(payload: {
  requestType: IntakeRequestType;
  requestShape: Record<string, unknown>;
  attachmentRefs: readonly string[];
  contactPreferencesRef: string | null;
  authoredNarrative: NormalizedSubmissionNarrative;
  normalizationVersionRef: string;
}): string {
  return stableDigest({
    requestType: payload.requestType,
    requestShape: payload.requestShape,
    attachmentRefs: uniqueSorted(payload.attachmentRefs),
    contactPreferencesRef: optionalRef(payload.contactPreferencesRef),
    authoredNarrative: payload.authoredNarrative,
    normalizationVersionRef: payload.normalizationVersionRef,
  });
}

export function buildNormalizedSubmissionDedupeFingerprint(input: {
  requestType: IntakeRequestType;
  requestShape: Record<string, unknown>;
  authoredNarrative: NormalizedSubmissionNarrative;
}): string {
  return stableDigest(
    buildDedupeFeatures(input.requestType, input.requestShape, input.authoredNarrative),
  );
}

function filterActiveStructuredAnswers(
  activeStructuredAnswers: Record<string, unknown>,
  activeQuestionKeys?: readonly string[],
): Record<string, unknown> {
  const allowedQuestionKeys = new Set(activeQuestionKeys ?? Object.keys(activeStructuredAnswers));
  return Object.fromEntries(
    Object.entries(activeStructuredAnswers)
      .filter(([questionKey]) => allowedQuestionKeys.has(questionKey))
      .sort(([left], [right]) => compareStrings(left, right)),
  );
}

function mapContactAuthorityClass(
  state: NormalizedSubmissionFreezeInput["contactAuthorityState"],
): NormalizedSubmissionSnapshot["contactAuthorityClass"] {
  if (state === "verified") {
    return "authority_confirmed";
  }
  if (state === "nhs_login_claim") {
    return "nhs_login_claim";
  }
  if (state === "verified_destination") {
    return "verified_destination";
  }
  if (state === "support_attested") {
    return "authority_confirmed";
  }
  if (state === "assumed_self_service_browser_minimum") {
    return "self_asserted";
  }
  if (state === "rebind_required") {
    return "verified_destination";
  }
  return "self_asserted";
}

function resolveEvidenceReadinessState(
  freeze: NormalizedSubmissionFreezeInput,
): NormalizedSubmissionSnapshot["evidenceReadinessState"] {
  if (freeze.evidenceReadinessStateOverride) {
    return freeze.evidenceReadinessStateOverride;
  }
  if (
    freeze.contactAuthorityState === "blocked" ||
    freeze.contactAuthorityState === "rebind_required" ||
    freeze.channelCapabilityCeiling.mutatingResumeState === "blocked" ||
    !freeze.channelCapabilityCeiling.canRenderTrackStatus
  ) {
    return "manual_review_only";
  }
  return "safety_usable";
}

function buildNormalizationReasonCodes(
  requestType: IntakeRequestType,
  evidenceReadinessState: NormalizedSubmissionSnapshot["evidenceReadinessState"],
  narrative: NormalizedSubmissionNarrative,
): string[] {
  return uniqueSorted([
    "GAP_RESOLVED_NORMALIZED_CONTRACT_PHASE1_V1",
    "GAP_RESOLVED_FREE_TEXT_RULES_PHASE1_V1",
    "GAP_RESOLVED_DEDUPE_FINGERPRINT_PHASE1_V1",
    requestType === "Symptoms"
      ? "REQUEST_TYPE_MAPPING_SYMPTOMS_V1"
      : requestType === "Meds"
        ? "REQUEST_TYPE_MAPPING_MEDS_V1"
        : requestType === "Admin"
          ? "REQUEST_TYPE_MAPPING_ADMIN_V1"
          : "REQUEST_TYPE_MAPPING_RESULTS_V1",
    narrative.sourceKind === "free_text"
      ? "NARRATIVE_SOURCE_FREE_TEXT"
      : narrative.sourceKind === "request_field"
        ? "NARRATIVE_SOURCE_REQUEST_FIELD"
        : "NARRATIVE_SOURCE_REQUEST_FIELD",
    evidenceReadinessState === "safety_usable"
      ? "EVIDENCE_READINESS_SAFETY_USABLE"
      : "EVIDENCE_READINESS_MANUAL_REVIEW_ONLY",
  ]);
}

function buildCanonicalNormalization(
  definitions: readonly CompiledQuestionDefinition[],
  input: {
    requestType: IntakeRequestType;
    activeQuestionKeys?: readonly string[];
    activeStructuredAnswers: Record<string, unknown>;
    freeTextNarrative: string;
    attachmentRefs: readonly string[];
    contactPreferencesRef: string | null;
  },
): Omit<NormalizedSubmissionPreview, "normalizationVersionRef"> {
  const matchingDefinitions = definitions
    .filter((definition) => definition.requestType === input.requestType)
    .filter((definition) =>
      (input.activeQuestionKeys ?? Object.keys(input.activeStructuredAnswers)).includes(
        definition.questionKey,
      ),
    )
    .sort((left, right) => compareStrings(left.questionKey, right.questionKey));
  const activeStructuredAnswers = filterActiveStructuredAnswers(
    input.activeStructuredAnswers,
    input.activeQuestionKeys,
  );

  const requestShape: Record<string, unknown> = {};
  const summaryFragments: NormalizedSubmissionSummaryFragment[] = [];

  for (const definition of matchingDefinitions) {
    if (!(definition.questionKey in activeStructuredAnswers)) {
      continue;
    }
    const rawValue = activeStructuredAnswers[definition.questionKey];
    const normalizedValue = normalizeAnswerValue(definition.answerType, rawValue);
    if (normalizedValue === null) {
      continue;
    }
    setNestedValue(requestShape, definition.requestShapePath, normalizedValue);
    const fragmentText = renderSummaryFragment(definition, normalizedValue);
    if (fragmentText.length > 0) {
      summaryFragments.push({
        questionKey: definition.questionKey,
        normalizationTarget: definition.normalizationTarget,
        summaryRendererRef: definition.summaryRenderer,
        safetyRelevance: definition.safetyRelevance,
        valueHash: stableDigest(normalizedValue),
        fragmentText,
      });
    }
  }

  const authoredNarrative = resolveNarrative(
    input.requestType,
    requestShape,
    input.freeTextNarrative,
  );
  const dedupeFeatures = buildDedupeFeatures(input.requestType, requestShape, authoredNarrative);
  const dedupeFingerprint = buildNormalizedSubmissionDedupeFingerprint({
    requestType: input.requestType,
    requestShape,
    authoredNarrative,
  });

  return {
    requestType: input.requestType,
    requestShape,
    summaryFragments,
    authoredNarrative,
    dedupeFeatures,
    dedupeFingerprint,
    attachmentRefs: uniqueSorted(input.attachmentRefs),
    contactPreferencesRef: optionalRef(input.contactPreferencesRef),
    reasonCodes: buildNormalizationReasonCodes(
      input.requestType,
      "safety_usable",
      authoredNarrative,
    ),
  };
}

export class NormalizedSubmissionDocument {
  private readonly snapshot: NormalizedSubmissionSnapshot;

  private constructor(snapshot: NormalizedSubmissionSnapshot) {
    this.snapshot = NormalizedSubmissionDocument.normalize(snapshot);
  }

  static create(
    input: Omit<NormalizedSubmissionSnapshot, "version">,
  ): NormalizedSubmissionDocument {
    return new NormalizedSubmissionDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: NormalizedSubmissionSnapshot): NormalizedSubmissionDocument {
    return new NormalizedSubmissionDocument(snapshot);
  }

  private static normalize(snapshot: NormalizedSubmissionSnapshot): NormalizedSubmissionSnapshot {
    invariant(
      snapshot.version >= 1,
      "INVALID_NORMALIZED_SUBMISSION_VERSION",
      "NormalizedSubmission.version must be >= 1.",
    );
    return {
      ...snapshot,
      normalizedSubmissionId: requireRef(snapshot.normalizedSubmissionId, "normalizedSubmissionId"),
      submissionEnvelopeRef: requireRef(snapshot.submissionEnvelopeRef, "submissionEnvelopeRef"),
      requestLineageRef: optionalRef(snapshot.requestLineageRef),
      primaryIngressRecordRef: requireRef(
        snapshot.primaryIngressRecordRef,
        "primaryIngressRecordRef",
      ),
      governingSnapshotRef: requireRef(snapshot.governingSnapshotRef, "governingSnapshotRef"),
      submissionSnapshotFreezeRef: requireRef(
        snapshot.submissionSnapshotFreezeRef,
        "submissionSnapshotFreezeRef",
      ),
      evidenceCaptureBundleRef: requireRef(
        snapshot.evidenceCaptureBundleRef,
        "evidenceCaptureBundleRef",
      ),
      narrativeRef: requireRef(snapshot.narrativeRef, "narrativeRef"),
      structuredAnswersRef: requireRef(snapshot.structuredAnswersRef, "structuredAnswersRef"),
      channelMetadataRef: requireRef(snapshot.channelMetadataRef, "channelMetadataRef"),
      identityContextRef: requireRef(snapshot.identityContextRef, "identityContextRef"),
      attachmentRefs: uniqueSorted(snapshot.attachmentRefs),
      audioRefs: uniqueSorted(snapshot.audioRefs),
      contactPreferencesRef: optionalRef(snapshot.contactPreferencesRef),
      submissionSourceTimestamp: ensureIsoTimestamp(
        snapshot.submissionSourceTimestamp,
        "submissionSourceTimestamp",
      ),
      patientMatchConfidenceRef: optionalRef(snapshot.patientMatchConfidenceRef),
      dedupeFingerprintRef: requireRef(snapshot.dedupeFingerprintRef, "dedupeFingerprintRef"),
      dedupeFingerprint: requireRef(snapshot.dedupeFingerprint, "dedupeFingerprint"),
      normalizationVersionRef: requireRef(
        snapshot.normalizationVersionRef,
        "normalizationVersionRef",
      ) as typeof normalizedSubmissionVersionRef,
      normalizedHash: requireRef(snapshot.normalizedHash, "normalizedHash"),
      supersedesNormalizedSubmissionRef: optionalRef(snapshot.supersedesNormalizedSubmissionRef),
      intakeExperienceBundleRef: requireRef(
        snapshot.intakeExperienceBundleRef,
        "intakeExperienceBundleRef",
      ),
      questionDefinitionContractRef: requireRef(
        snapshot.questionDefinitionContractRef,
        "questionDefinitionContractRef",
      ),
      sourceLineageRef: requireRef(snapshot.sourceLineageRef, "sourceLineageRef"),
      normalizationReasonCodes: uniqueSorted(snapshot.normalizationReasonCodes),
      gapRefs: uniqueSorted(snapshot.gapRefs),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
    };
  }

  get normalizedSubmissionId(): string {
    return this.snapshot.normalizedSubmissionId;
  }

  get submitNormalizationSeedId(): string {
    return this.snapshot.normalizedSubmissionId;
  }

  toSnapshot(): NormalizedSubmissionSnapshot {
    return {
      ...this.snapshot,
      attachmentRefs: [...this.snapshot.attachmentRefs],
      audioRefs: [...this.snapshot.audioRefs],
      summaryFragments: this.snapshot.summaryFragments.map((fragment) => ({ ...fragment })),
      normalizationReasonCodes: [...this.snapshot.normalizationReasonCodes],
      gapRefs: [...this.snapshot.gapRefs],
    };
  }
}

export function serializeNormalizedSubmission(
  document: NormalizedSubmissionDocument,
): PersistedNormalizedSubmissionRow {
  return {
    aggregateType: "NormalizedSubmission",
    ...document.toSnapshot(),
  };
}

export function hydrateNormalizedSubmission(
  row: PersistedNormalizedSubmissionRow,
): NormalizedSubmissionDocument {
  return NormalizedSubmissionDocument.hydrate(row);
}

export class InMemoryNormalizedSubmissionStore implements NormalizedSubmissionRepository {
  private readonly rows = new Map<string, PersistedNormalizedSubmissionRow>();

  async getNormalizedSubmission(
    normalizedSubmissionId: string,
  ): Promise<NormalizedSubmissionDocument | undefined> {
    const row = this.rows.get(normalizedSubmissionId);
    return row ? hydrateNormalizedSubmission(row) : undefined;
  }

  async saveNormalizedSubmission(document: NormalizedSubmissionDocument): Promise<void> {
    const row = serializeNormalizedSubmission(document);
    invariant(
      !this.rows.has(row.normalizedSubmissionId),
      "IMMUTABLE_NORMALIZEDSUBMISSION_REWRITE_FORBIDDEN",
      "NormalizedSubmission is append-only and may not be rewritten in place.",
    );
    this.rows.set(row.normalizedSubmissionId, row);
  }

  async listNormalizedSubmissions(): Promise<readonly NormalizedSubmissionDocument[]> {
    return [...this.rows.values()].map(hydrateNormalizedSubmission);
  }
}

export function createNormalizedSubmissionStore(): InMemoryNormalizedSubmissionStore {
  return new InMemoryNormalizedSubmissionStore();
}

export function createNormalizedSubmissionService(options?: {
  bundle?: Phase1IntakeExperienceBundle;
  questionDefinitions?: readonly Phase1QuestionDefinition[];
}) {
  const bundle = options?.bundle ?? defaultPhase1IntakeExperienceBundles.browser;
  invariant(
    bundle.questionDefinitionContractRef ===
      phase1QuestionDefinitionContract.questionDefinitionContractId,
    "NORMALIZED_SUBMISSION_BUNDLE_CONTRACT_DRIFT",
    "The intake bundle drifted from the pinned seq_140 question contract.",
  );
  const compiledDefinitions = compileDefinitions(
    options?.questionDefinitions ?? phase1QuestionDefinitions,
  );

  return {
    normalizationVersionRef: normalizedSubmissionVersionRef,
    bundle,
    buildPreviewCandidate(input: {
      requestType: IntakeRequestType;
      activeQuestionKeys?: readonly string[];
      activeStructuredAnswers: Record<string, unknown>;
      freeTextNarrative: string;
      attachmentRefs: readonly string[];
      contactPreferencesRef?: string | null;
    }): NormalizedSubmissionPreview {
      const preview = buildCanonicalNormalization(compiledDefinitions, {
        requestType: input.requestType,
        activeQuestionKeys: input.activeQuestionKeys,
        activeStructuredAnswers: input.activeStructuredAnswers,
        freeTextNarrative: input.freeTextNarrative,
        attachmentRefs: input.attachmentRefs,
        contactPreferencesRef: input.contactPreferencesRef ?? null,
      });
      return {
        normalizationVersionRef: normalizedSubmissionVersionRef,
        ...preview,
      };
    },
    buildNormalizationMatrixRows() {
      return compiledDefinitions
        .map((definition) => ({
          requestType: definition.requestType,
          questionKey: definition.questionKey,
          normalizationTarget: definition.normalizationTarget,
          requestShapePath: definition.requestShapePath,
          summaryRendererRef: definition.summaryRenderer,
          safetyRelevance: definition.safetyRelevance,
          supersessionPolicy: definition.supersessionPolicy,
          dedupeContribution:
            definition.answerType === "long_text" || definition.answerType === "short_text"
              ? "narrative_or_text"
              : "typed_field",
        }))
        .sort((left, right) =>
          compareStrings(
            `${left.requestType}::${left.questionKey}`,
            `${right.requestType}::${right.questionKey}`,
          ),
        );
    },
    createNormalizedSubmission(
      input: CreateNormalizedSubmissionInput,
    ): NormalizedSubmissionDocument {
      const preview = buildCanonicalNormalization(compiledDefinitions, {
        requestType: input.freeze.requestType,
        activeQuestionKeys: input.freeze.activeQuestionKeys,
        activeStructuredAnswers: input.freeze.activeStructuredAnswers,
        freeTextNarrative: input.freeze.freeTextNarrative,
        attachmentRefs: input.freeze.attachmentRefs,
        contactPreferencesRef: input.freeze.contactPreferencesRef,
      });
      const activeStructuredAnswers = filterActiveStructuredAnswers(
        input.freeze.activeStructuredAnswers,
        input.freeze.activeQuestionKeys,
      );
      const evidenceReadinessState = resolveEvidenceReadinessState(input.freeze);
      const normalizationReasonCodes = buildNormalizationReasonCodes(
        input.freeze.requestType,
        evidenceReadinessState,
        preview.authoredNarrative,
      );
      const normalizedHash = buildNormalizedSubmissionHash({
        requestType: input.freeze.requestType,
        requestShape: preview.requestShape,
        attachmentRefs: preview.attachmentRefs,
        contactPreferencesRef: preview.contactPreferencesRef,
        authoredNarrative: preview.authoredNarrative,
        normalizationVersionRef: normalizedSubmissionVersionRef,
      });

      return NormalizedSubmissionDocument.create({
        normalizedSubmissionSchemaVersion: "NORMALIZED_SUBMISSION_V1",
        normalizedSubmissionId: input.normalizedSubmissionId,
        submissionEnvelopeRef: input.freeze.submissionEnvelopeRef,
        requestLineageRef: input.requestLineageRef ?? null,
        primaryIngressRecordRef: input.primaryIngressRecordRef,
        governingSnapshotRef: input.governingSnapshotRef,
        submissionSnapshotFreezeRef: input.freeze.submissionSnapshotFreezeRef,
        evidenceCaptureBundleRef: input.freeze.evidenceCaptureBundleRef,
        requestType: input.freeze.requestType,
        narrativeRef: `${input.normalizedSubmissionId}::narrative`,
        structuredAnswersRef: `${input.normalizedSubmissionId}::structured_answers`,
        channelMetadataRef: `${input.normalizedSubmissionId}::channel_metadata`,
        identityContextRef: `${input.normalizedSubmissionId}::identity_context`,
        attachmentRefs: preview.attachmentRefs,
        audioRefs: uniqueSorted(input.freeze.audioRefs ?? []),
        contactPreferencesRef: preview.contactPreferencesRef,
        submissionSourceTimestamp: input.freeze.frozenAt,
        patientMatchConfidenceRef: input.patientMatchConfidenceRef ?? null,
        dedupeFingerprintRef: `${input.normalizedSubmissionId}::dedupe_fingerprint`,
        dedupeFingerprint: preview.dedupeFingerprint,
        channelCapabilityCeiling: { ...input.freeze.channelCapabilityCeiling },
        contactAuthorityClass: mapContactAuthorityClass(input.freeze.contactAuthorityState),
        evidenceReadinessState,
        normalizationVersionRef: normalizedSubmissionVersionRef,
        normalizedHash,
        supersedesNormalizedSubmissionRef: input.supersedesNormalizedSubmissionRef ?? null,
        intakeExperienceBundleRef: input.freeze.intakeExperienceBundleRef,
        questionDefinitionContractRef:
          phase1QuestionDefinitionContract.questionDefinitionContractId,
        sourceLineageRef: input.freeze.sourceLineageRef,
        requestShape: preview.requestShape,
        activeStructuredAnswers,
        summaryFragments: preview.summaryFragments,
        authoredNarrative: preview.authoredNarrative,
        dedupeFeatures: preview.dedupeFeatures,
        normalizationReasonCodes,
        gapRefs: [],
        createdAt: input.createdAt,
      });
    },
  };
}
