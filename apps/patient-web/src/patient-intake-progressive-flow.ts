import questionDefinitionContract from "../../../data/contracts/140_question_definitions.json";
import requestTypeTaxonomyArtifact from "../../../data/contracts/140_request_type_taxonomy.json";
import progressiveUiContract from "../../../data/contracts/156_progressive_question_ui_contract.json";

export type ProgressiveRequestType = "Symptoms" | "Meds" | "Admin" | "Results";
export type ProgressiveAnswerType =
  | "single_select"
  | "multi_select"
  | "boolean"
  | "date"
  | "partial_date"
  | "short_text"
  | "short_text_or_unknown"
  | "long_text";
export type ProgressiveCompatibilityMode =
  | "resume_compatible"
  | "review_migration_required"
  | "blocked";

export interface ProgressiveQuestionDefinition {
  questionKey: string;
  requestType: ProgressiveRequestType;
  stepKey: "details";
  promptLabel: string;
  answerType: ProgressiveAnswerType;
  cardinality: "single" | "multiple";
  requiredWhen: string;
  visibilityPredicate: string;
  normalizationTarget: string;
  safetyRelevance: "none" | "triage_relevant" | "safety_relevant";
  summaryRenderer: string;
  supersessionPolicy: string;
  helpContentRef: string;
  allowedAnswers?: readonly string[];
  unknownHandlingPolicyRef?: string;
  whyWeAsk?: string;
}

export interface ProgressiveQuestionUiProfile {
  requestType: ProgressiveRequestType;
  title: string;
  bestFor: string;
  description: string;
  cue: string;
  microTag: string | null;
  accentToken: string;
  glyphKey: string;
}

export interface ProgressiveSupersededAnswerRecord {
  questionKey: string;
  requestType: ProgressiveRequestType;
  previousValue: unknown;
  supersededAt: string;
  supersessionPolicy: string;
  safetyRelevance: ProgressiveQuestionDefinition["safetyRelevance"];
}

export interface PendingRequestTypeChange {
  currentRequestType: ProgressiveRequestType;
  nextRequestType: ProgressiveRequestType;
  impactedQuestionKeys: readonly string[];
  safetyRelevantQuestionKeys: readonly string[];
}

export interface ProgressiveDeltaNoticeMemory {
  kind: "branch_superseded" | "safety_review_required";
  title: string;
  body: string;
  impactedQuestionKeys: readonly string[];
}

export interface ProgressiveFlowMemoryShape {
  requestType: ProgressiveRequestType;
  structuredAnswers?: Record<string, unknown>;
  supersededAnswers?: readonly ProgressiveSupersededAnswerRecord[];
  detailsCursorQuestionKey?: string | null;
  pendingRequestTypeChange?: PendingRequestTypeChange | null;
  bundleCompatibilityMode?: ProgressiveCompatibilityMode;
  bundleCompatibilityScenarioId?: string | null;
  helperQuestionKey?: string | null;
  reviewAffirmed?: boolean;
  deltaNotice?: ProgressiveDeltaNoticeMemory | null;
}

export interface ProgressiveSummaryChip {
  questionKey: string;
  label: string;
  value: string;
  rendererRef: string;
}

export interface ProgressiveValidationIssue {
  code:
    | "FIELD_REQUIRED"
    | "FIELD_TYPE_INVALID"
    | "FIELD_CARDINALITY_INVALID"
    | "FIELD_VALUE_NOT_ALLOWED";
  questionKey: string;
  message: string;
}

export interface ProgressiveQuestionFieldView {
  questionKey: string;
  promptLabel: string;
  answerType: ProgressiveAnswerType;
  cardinality: "single" | "multiple";
  required: boolean;
  visible: boolean;
  value: unknown;
  allowedAnswers: readonly string[];
  helpContentRef: string;
  whyWeAsk: string | null;
  safetyRelevance: ProgressiveQuestionDefinition["safetyRelevance"];
  summaryRenderer: string;
}

export interface ProgressiveQuestionFrameView {
  requestType: ProgressiveRequestType;
  rootQuestionKey: string;
  title: string;
  helper: string;
  currentIndex: number;
  totalGroups: number;
  fields: readonly ProgressiveQuestionFieldView[];
  contextChips: readonly ProgressiveSummaryChip[];
  summaryChips: readonly ProgressiveSummaryChip[];
  revealQuestionKeys: readonly string[];
  validationIssues: readonly ProgressiveValidationIssue[];
}

export interface ProgressiveBundleCompatibilitySheet {
  compatibilityMode: ProgressiveCompatibilityMode;
  scenarioId: string;
  title: string;
  body: string;
  dominantActionLabel: string;
  secondaryActionLabel: string;
}

export interface ProgressiveFlowView {
  requestTypeCards: readonly ProgressiveQuestionUiProfile[];
  activeQuestionFrame: ProgressiveQuestionFrameView;
  activeSummaryChips: readonly ProgressiveSummaryChip[];
  requestTypeChangeNotice: PendingRequestTypeChange | null;
  deltaNotice: ProgressiveDeltaNoticeMemory | null;
  bundleCompatibilitySheet: ProgressiveBundleCompatibilitySheet;
  canContinueDetails: boolean;
}

type PredicateClause =
  | { kind: "requestType"; expected: ProgressiveRequestType }
  | { kind: "answerEquals"; questionKey: string; expected: string };

const questionDefinitions = (
  questionDefinitionContract.questionDefinitions as readonly ProgressiveQuestionDefinition[]
).filter((definition) => definition.stepKey === "details");

const requestTypeUiProfiles =
  progressiveUiContract.requestTypeUiProfiles as readonly ProgressiveQuestionUiProfile[];

const summaryRendererLabels = new Map(
  progressiveUiContract.summaryRendererLabels.map((entry) => [entry.summaryRenderer, entry.label]),
);

const summaryLabelOverridesByQuestionKey: Record<string, string> = {
  "meds.nameKnown": "Medicine name known",
  "meds.nameUnknownReason": "Why the name is unknown",
};

const compatibilitySheets = new Map(
  progressiveUiContract.bundleCompatibilitySheets.map((entry) => [entry.compatibilityMode, entry]),
);

const requestTypeQuestionKeys = new Map(
  requestTypeTaxonomyArtifact.questionSets.map((entry) => [
    entry.requestType as ProgressiveRequestType,
    entry.questionKeys,
  ]),
);

const requestTypeGroupProfiles = new Map(
  progressiveUiContract.questionGroupProfiles.map((entry) => [
    entry.requestType as ProgressiveRequestType,
    entry,
  ]),
);

const questionDefinitionsByKey = new Map(
  questionDefinitions.map((definition) => [definition.questionKey, definition]),
);

function parsePredicate(expression: string): readonly PredicateClause[] {
  const trimmed = expression.trim();
  if (trimmed.length === 0) {
    return [];
  }
  return trimmed.split("&&").map((rawClause) => {
    const clause = rawClause.trim();
    const requestTypeMatch = /^requestType\s*==\s*'([^']+)'$/.exec(clause);
    if (requestTypeMatch?.[1]) {
      return {
        kind: "requestType",
        expected: requestTypeMatch[1] as ProgressiveRequestType,
      };
    }
    const answerMatch = /^answers\[['"]([^'"]+)['"]\]\s*==\s*'([^']+)'$/.exec(clause);
    if (answerMatch?.[1] && answerMatch[2]) {
      return {
        kind: "answerEquals",
        questionKey: answerMatch[1],
        expected: answerMatch[2],
      };
    }
    throw new Error(`Unsupported predicate ${expression}`);
  });
}

const compiledDefinitions = questionDefinitions.map((definition) => ({
  ...definition,
  visibilityClauses: parsePredicate(definition.visibilityPredicate),
  requiredClauses: parsePredicate(definition.requiredWhen),
}));

const compiledDefinitionByKey = new Map(
  compiledDefinitions.map((definition) => [definition.questionKey, definition]),
);

function evaluatePredicate(
  clauses: readonly PredicateClause[],
  requestType: ProgressiveRequestType,
  answers: Record<string, unknown>,
): boolean {
  return clauses.every((clause) => {
    if (clause.kind === "requestType") {
      return clause.expected === requestType;
    }
    return answers[clause.questionKey] === clause.expected;
  });
}

function humanizeToken(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace("Nhs", "NHS");
}

const answerLabelOverrides: Record<string, Record<string, string>> = {
  "symptoms.category": {
    respiratory: "Breathing",
    pain: "Pain",
    skin: "Skin",
    digestive: "Digestive",
    general: "General illness",
    chest_breathing: "Chest or breathing",
  },
  "symptoms.chestPainLocation": {
    centre_chest: "Centre chest",
    left_side: "Left side",
    right_side: "Right side",
    breathing_only: "Breathing only",
    not_sure: "Not sure",
  },
  "symptoms.onsetPrecision": {
    exact_date: "Exact date",
    approximate_window: "Approximate window",
    unknown: "Unknown",
  },
  "symptoms.onsetWindow": {
    today: "Today",
    last_2_days: "Last 2 days",
    this_week: "This week",
    more_than_week: "More than a week ago",
    not_sure: "Not sure",
  },
  "symptoms.severityClues": {
    sleep_affected: "Sleep affected",
    mobility_affected: "Mobility affected",
    work_or_school_affected: "Work or school affected",
    sudden_change: "Sudden change",
    none_of_these: "None of these",
  },
  "meds.queryType": {
    repeat_supply: "Repeat supply",
    dose_question: "Dose question",
    side_effect: "Side effect",
    medication_change: "Medication change",
    other_meds_issue: "Other medicine issue",
  },
  "meds.nameKnown": {
    known: "Yes, I know it",
    unknown_or_unsure: "No or not sure",
  },
  "meds.nameUnknownReason": {
    label_not_available: "The label or packaging is not available",
    multiple_medicines: "I am not sure which one of several medicines it is",
    patient_not_sure: "I am not sure of the medicine name",
    medicine_started_elsewhere: "It was started elsewhere and I do not have the details",
  },
  "meds.urgency": {
    urgent_today: "Urgent today",
    soon: "Soon",
    routine: "Routine",
  },
  "admin.supportType": {
    fit_note: "Fit note",
    letter_or_form: "Letter or form",
    referral_follow_up: "Referral follow-up",
    booking_or_practice_admin: "Booking or practice admin",
  },
  "admin.deadlineKnown": {
    deadline_known: "Yes, there is a deadline",
    no_deadline: "No deadline",
  },
  "admin.referenceAvailable": {
    available: "Yes, I have a reference",
    not_available: "No reference",
  },
  "results.context": {
    blood_test: "Blood test",
    imaging: "Scan or imaging",
    urine_or_swab: "Urine or swab",
    other_test: "Another test",
  },
  "results.dateKnown": {
    exact_or_approx: "I know roughly when",
    not_sure: "Not sure",
  },
};

const helpContentOverrides: Record<string, string> = {
  "help.symptoms.category.v1":
    "This keeps the request focused on one symptom from the start rather than hiding meaning in free text.",
  "help.symptoms.chest_location.v1":
    "This answer supports red-flag screening and stays visible for review if the branch changes.",
  "help.symptoms.onset.v1":
    "You can give an exact date, an approximate date, or say you are not sure.",
  "help.symptoms.severity.v1":
    "We only ask for the clues that change triage, not a long severity questionnaire.",
  "help.free_text.v1":
    "Use this for anything that still matters after the typed questions are answered.",
  "help.meds.query_type.v1":
    "One medication issue keeps the rest of the request clear and easier to route.",
  "help.meds.name_known.v1":
    "If you do not know the medicine name, say so. The flow should not invent one.",
  "help.meds.issue_type.v1":
    "Use the current medicine problem in your own words, not a full medicine history.",
  "help.admin.support_type.v1":
    "Pick the one admin outcome you need most. You can add more detail next.",
  "help.admin.deadline.v1": "We only ask for a deadline when you confirm one exists.",
  "help.admin.reference.v1": "A reference number helps only when you already have one.",
  "help.results.context.v1": "This keeps the result question tied to one test context.",
  "help.results.test_name.v1":
    "A short test name is enough. Do not rewrite the whole result letter.",
  "help.results.date.v1": "Tell us the date only if you know it. Not sure is an acceptable answer.",
};

const branchDependentKeys = new Set<string>();
for (const profile of progressiveUiContract.questionGroupProfiles) {
  for (const dependency of profile.dependencies) {
    for (const questionKey of dependency.dependentQuestionKeys) {
      branchDependentKeys.add(questionKey);
    }
  }
}

export function createDefaultStructuredAnswers(
  requestType: ProgressiveRequestType = "Symptoms",
): Record<string, unknown> {
  if (requestType !== "Symptoms") {
    return {};
  }
  return {
    "symptoms.category": "chest_breathing",
    "symptoms.chestPainLocation": "centre_chest",
    "symptoms.onsetPrecision": "approximate_window",
    "symptoms.onsetWindow": "last_2_days",
    "symptoms.worseningNow": true,
    "symptoms.severityClues": ["mobility_affected", "sudden_change"],
    "symptoms.narrative":
      "Chest tightness started on Sunday evening and feels worse when I walk upstairs.",
  };
}

function isMeaningfulAnswer(value: unknown, answerType: ProgressiveAnswerType): boolean {
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
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPartialDate(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value) || isIsoDate(value);
}

function validateAnswerValue(
  definition: ProgressiveQuestionDefinition,
  value: unknown,
): ProgressiveValidationIssue | null {
  if (!isMeaningfulAnswer(value, definition.answerType)) {
    return {
      code: "FIELD_REQUIRED",
      questionKey: definition.questionKey,
      message: "Answer this question to continue.",
    };
  }

  if (definition.cardinality === "multiple") {
    if (!Array.isArray(value)) {
      return {
        code: "FIELD_CARDINALITY_INVALID",
        questionKey: definition.questionKey,
        message: "Choose one or more options in the allowed set.",
      };
    }
    if (!value.every((entry) => typeof entry === "string")) {
      return {
        code: "FIELD_TYPE_INVALID",
        questionKey: definition.questionKey,
        message: "This answer is not in the expected format.",
      };
    }
    if (
      definition.allowedAnswers &&
      value.some((entry) => !definition.allowedAnswers?.includes(entry))
    ) {
      return {
        code: "FIELD_VALUE_NOT_ALLOWED",
        questionKey: definition.questionKey,
        message: "Choose only the supported options for this question.",
      };
    }
    return null;
  }

  if (Array.isArray(value)) {
    return {
      code: "FIELD_CARDINALITY_INVALID",
      questionKey: definition.questionKey,
      message: "Choose one answer only.",
    };
  }

  switch (definition.answerType) {
    case "single_select":
      if (typeof value !== "string") {
        return {
          code: "FIELD_TYPE_INVALID",
          questionKey: definition.questionKey,
          message: "Choose one of the listed answers.",
        };
      }
      if (definition.allowedAnswers && !definition.allowedAnswers.includes(value)) {
        return {
          code: "FIELD_VALUE_NOT_ALLOWED",
          questionKey: definition.questionKey,
          message: "Choose one of the listed answers.",
        };
      }
      return null;
    case "boolean":
      return typeof value === "boolean"
        ? null
        : {
            code: "FIELD_TYPE_INVALID",
            questionKey: definition.questionKey,
            message: "Choose yes or no to continue.",
          };
    case "date":
      return typeof value === "string" && isIsoDate(value)
        ? null
        : {
            code: "FIELD_TYPE_INVALID",
            questionKey: definition.questionKey,
            message: "Enter a full date in the expected format.",
          };
    case "partial_date":
      return typeof value === "string" && isPartialDate(value)
        ? null
        : {
            code: "FIELD_TYPE_INVALID",
            questionKey: definition.questionKey,
            message: "Enter a date or month in the expected format.",
          };
    case "short_text":
    case "short_text_or_unknown":
    case "long_text":
      return typeof value === "string" && value.trim().length > 0
        ? null
        : {
            code: "FIELD_TYPE_INVALID",
            questionKey: definition.questionKey,
            message: "Add a short answer to continue.",
          };
    default:
      return null;
  }
}

function sortQuestionKeys(questionKeys: readonly string[]): string[] {
  return [...questionKeys].sort((left, right) => {
    const requestType = (questionDefinitionsByKey.get(left)?.requestType ??
      "Symptoms") as ProgressiveRequestType;
    const order = requestTypeQuestionKeys.get(requestType) ?? [];
    return order.indexOf(left) - order.indexOf(right);
  });
}

function getGroupProfile(requestType: ProgressiveRequestType) {
  return requestTypeGroupProfiles.get(requestType) ?? requestTypeGroupProfiles.get("Symptoms")!;
}

function getRootQuestionKeys(requestType: ProgressiveRequestType): readonly string[] {
  return getGroupProfile(requestType).rootQuestionKeys;
}

function getDependentQuestionKeys(
  controllerQuestionKey: string,
  requestType: ProgressiveRequestType,
): readonly string[] {
  const dependency = getGroupProfile(requestType).dependencies.find(
    (entry) => entry.controllerQuestionKey === controllerQuestionKey,
  );
  return dependency?.dependentQuestionKeys ?? [];
}

function formatAnswerValue(definition: ProgressiveQuestionDefinition, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => formatAnswerValue(definition, entry)).join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value !== "string") {
    return String(value ?? "");
  }
  if (
    definition.answerType === "short_text" ||
    definition.answerType === "short_text_or_unknown" ||
    definition.answerType === "long_text" ||
    definition.answerType === "date" ||
    definition.answerType === "partial_date"
  ) {
    return value;
  }
  return answerLabelOverrides[definition.questionKey]?.[value] ?? humanizeToken(value);
}

function buildSummaryChip(questionKey: string, value: unknown): ProgressiveSummaryChip | null {
  const definition = questionDefinitionsByKey.get(questionKey);
  if (!definition || !isMeaningfulAnswer(value, definition.answerType)) {
    return null;
  }
  return {
    questionKey,
    label:
      summaryLabelOverridesByQuestionKey[questionKey] ??
      summaryRendererLabels.get(definition.summaryRenderer) ??
      definition.promptLabel,
    value: formatAnswerValue(definition, value),
    rendererRef: definition.summaryRenderer,
  };
}

function getVisibleState(requestType: ProgressiveRequestType, answers: Record<string, unknown>) {
  const visibleKeys = new Set<string>();
  const requiredKeys = new Set<string>();
  for (const definition of compiledDefinitions) {
    if (definition.requestType !== requestType) {
      continue;
    }
    if (evaluatePredicate(definition.visibilityClauses, requestType, answers)) {
      visibleKeys.add(definition.questionKey);
    }
    if (evaluatePredicate(definition.requiredClauses, requestType, answers)) {
      requiredKeys.add(definition.questionKey);
    }
  }
  return { visibleKeys, requiredKeys };
}

function fallbackCursorQuestionKey(requestType: ProgressiveRequestType): string {
  return getRootQuestionKeys(requestType)[0] ?? "symptoms.category";
}

function nextSupersededAnswers(
  requestType: ProgressiveRequestType,
  previousAnswers: Record<string, unknown>,
  nextAnswers: Record<string, unknown>,
  existingSuperseded: readonly ProgressiveSupersededAnswerRecord[],
): {
  answers: Record<string, unknown>;
  supersededAnswers: readonly ProgressiveSupersededAnswerRecord[];
  deltaNotice: ProgressiveDeltaNoticeMemory | null;
  safetyRelevantQuestionKeys: readonly string[];
} {
  const previousVisible = getVisibleState(requestType, previousAnswers).visibleKeys;
  const nextVisible = getVisibleState(requestType, nextAnswers).visibleKeys;
  const hiddenKeys = sortQuestionKeys(
    [...previousVisible].filter(
      (questionKey) => !nextVisible.has(questionKey) && Object.hasOwn(previousAnswers, questionKey),
    ),
  );
  if (hiddenKeys.length === 0) {
    return {
      answers: nextAnswers,
      supersededAnswers: existingSuperseded,
      deltaNotice: null,
      safetyRelevantQuestionKeys: [],
    };
  }

  const answers = { ...nextAnswers };
  const appendedSuperseded: ProgressiveSupersededAnswerRecord[] = [];
  const safetyRelevantQuestionKeys: string[] = [];
  for (const questionKey of hiddenKeys) {
    const definition = questionDefinitionsByKey.get(questionKey);
    if (!definition) {
      continue;
    }
    appendedSuperseded.push({
      questionKey,
      requestType,
      previousValue: previousAnswers[questionKey],
      supersededAt: "2026-04-15T09:00:00Z",
      supersessionPolicy: definition.supersessionPolicy,
      safetyRelevance: definition.safetyRelevance,
    });
    if (definition.safetyRelevance === "safety_relevant") {
      safetyRelevantQuestionKeys.push(questionKey);
    }
    delete answers[questionKey];
  }

  return {
    answers,
    supersededAnswers: [...existingSuperseded, ...appendedSuperseded],
    deltaNotice: {
      kind: safetyRelevantQuestionKeys.length > 0 ? "safety_review_required" : "branch_superseded",
      title:
        safetyRelevantQuestionKeys.length > 0
          ? progressiveUiContract.requestTypeChangePolicy.safetyReviewTitle
          : "Branch answers updated",
      body:
        safetyRelevantQuestionKeys.length > 0
          ? progressiveUiContract.requestTypeChangePolicy.safetyReviewBody
          : "Answers that no longer belong to the active branch were removed from the live summary and kept only for audit history.",
      impactedQuestionKeys: hiddenKeys,
    },
    safetyRelevantQuestionKeys,
  };
}

export function getRequestTypeCards(): readonly ProgressiveQuestionUiProfile[] {
  return requestTypeUiProfiles;
}

export function ensureProgressiveState<T extends ProgressiveFlowMemoryShape>(memory: T): T {
  const structuredAnswers =
    memory.structuredAnswers && Object.keys(memory.structuredAnswers).length > 0
      ? memory.structuredAnswers
      : createDefaultStructuredAnswers(memory.requestType);
  return {
    ...memory,
    structuredAnswers,
    supersededAnswers: memory.supersededAnswers ?? [],
    detailsCursorQuestionKey:
      memory.detailsCursorQuestionKey ?? fallbackCursorQuestionKey(memory.requestType),
    pendingRequestTypeChange: memory.pendingRequestTypeChange ?? null,
    bundleCompatibilityMode: memory.bundleCompatibilityMode ?? "resume_compatible",
    bundleCompatibilityScenarioId:
      memory.bundleCompatibilityScenarioId ??
      compatibilitySheets.get(memory.bundleCompatibilityMode ?? "resume_compatible")?.scenarioId ??
      "BC_140_SAME_SEMANTICS_PATCH_V1",
    helperQuestionKey: memory.helperQuestionKey ?? null,
    reviewAffirmed: memory.reviewAffirmed ?? true,
    deltaNotice: memory.deltaNotice ?? null,
  };
}

export function selectRequestType<T extends ProgressiveFlowMemoryShape>(
  memory: T,
  nextRequestType: ProgressiveRequestType,
): T {
  const current = ensureProgressiveState(memory);
  const currentAnswers = current.structuredAnswers ?? {};
  if (nextRequestType === current.requestType) {
    return {
      ...current,
      pendingRequestTypeChange: null,
    };
  }
  const impactedQuestionKeys = sortQuestionKeys(
    Object.keys(currentAnswers).filter(
      (questionKey) =>
        questionDefinitionsByKey.get(questionKey)?.requestType === current.requestType,
    ),
  );
  if (impactedQuestionKeys.length === 0) {
    return {
      ...current,
      requestType: nextRequestType,
      detailsCursorQuestionKey: fallbackCursorQuestionKey(nextRequestType),
      deltaNotice: null,
      pendingRequestTypeChange: null,
      reviewAffirmed: true,
    };
  }
  const safetyRelevantQuestionKeys = impactedQuestionKeys.filter((questionKey) => {
    const definition = questionDefinitionsByKey.get(questionKey);
    return definition?.safetyRelevance === "safety_relevant";
  });
  return {
    ...current,
    pendingRequestTypeChange: {
      currentRequestType: current.requestType,
      nextRequestType,
      impactedQuestionKeys,
      safetyRelevantQuestionKeys,
    },
  };
}

export function cancelRequestTypeChange<T extends ProgressiveFlowMemoryShape>(memory: T): T {
  const current = ensureProgressiveState(memory);
  return {
    ...current,
    pendingRequestTypeChange: null,
  };
}

export function confirmRequestTypeChange<T extends ProgressiveFlowMemoryShape>(memory: T): T {
  const current = ensureProgressiveState(memory);
  const currentSuperseded = current.supersededAnswers ?? [];
  const currentAnswers = current.structuredAnswers ?? {};
  if (!current.pendingRequestTypeChange) {
    return current;
  }
  const supersededAnswers = [
    ...currentSuperseded,
    ...current.pendingRequestTypeChange.impactedQuestionKeys.map((questionKey) => {
      const definition = questionDefinitionsByKey.get(questionKey)!;
      return {
        questionKey,
        requestType: current.pendingRequestTypeChange!.currentRequestType,
        previousValue: currentAnswers[questionKey],
        supersededAt: "2026-04-15T09:15:00Z",
        supersessionPolicy: definition.supersessionPolicy,
        safetyRelevance: definition.safetyRelevance,
      } satisfies ProgressiveSupersededAnswerRecord;
    }),
  ];
  return {
    ...current,
    requestType: current.pendingRequestTypeChange.nextRequestType,
    structuredAnswers: {},
    detailsCursorQuestionKey: fallbackCursorQuestionKey(
      current.pendingRequestTypeChange.nextRequestType,
    ),
    supersededAnswers,
    pendingRequestTypeChange: null,
    deltaNotice:
      current.pendingRequestTypeChange.safetyRelevantQuestionKeys.length > 0
        ? {
            kind: "safety_review_required",
            title: progressiveUiContract.requestTypeChangePolicy.safetyReviewTitle,
            body: progressiveUiContract.requestTypeChangePolicy.safetyReviewBody,
            impactedQuestionKeys: current.pendingRequestTypeChange.safetyRelevantQuestionKeys,
          }
        : {
            kind: "branch_superseded",
            title: "Request type changed",
            body: "Earlier branch answers were superseded and removed from the active summary before the new path begins.",
            impactedQuestionKeys: current.pendingRequestTypeChange.impactedQuestionKeys,
          },
    reviewAffirmed: current.pendingRequestTypeChange.safetyRelevantQuestionKeys.length === 0,
  };
}

export function toggleHelperForQuestion<T extends ProgressiveFlowMemoryShape>(
  memory: T,
  questionKey: string,
): T {
  const current = ensureProgressiveState(memory);
  return {
    ...current,
    helperQuestionKey: current.helperQuestionKey === questionKey ? null : questionKey,
  };
}

export function answerProgressiveQuestion<T extends ProgressiveFlowMemoryShape>(
  memory: T,
  questionKey: string,
  value: unknown,
): T {
  const current = ensureProgressiveState(memory);
  const previousAnswers = current.structuredAnswers ?? {};
  const currentSuperseded = current.supersededAnswers ?? [];
  const definition = compiledDefinitionByKey.get(questionKey);
  if (!definition) {
    return current;
  }
  const nextAnswers = {
    ...previousAnswers,
    [questionKey]: value,
  };
  const supersession = nextSupersededAnswers(
    current.requestType,
    previousAnswers,
    nextAnswers,
    currentSuperseded,
  );
  return {
    ...current,
    structuredAnswers: supersession.answers,
    supersededAnswers: supersession.supersededAnswers,
    deltaNotice: supersession.deltaNotice,
    reviewAffirmed:
      supersession.safetyRelevantQuestionKeys.length === 0 ? current.reviewAffirmed : false,
  };
}

function getCurrentRootQuestionKey(memory: ProgressiveFlowMemoryShape): string {
  const current = ensureProgressiveState(memory);
  const rootQuestionKeys = getRootQuestionKeys(current.requestType);
  return rootQuestionKeys.includes(current.detailsCursorQuestionKey ?? "")
    ? (current.detailsCursorQuestionKey as string)
    : fallbackCursorQuestionKey(current.requestType);
}

function buildFieldView(
  questionKey: string,
  current: ProgressiveFlowMemoryShape,
  visibleKeys: ReadonlySet<string>,
  requiredKeys: ReadonlySet<string>,
): ProgressiveQuestionFieldView {
  const definition = compiledDefinitionByKey.get(questionKey)!;
  return {
    questionKey,
    promptLabel: definition.promptLabel,
    answerType: definition.answerType,
    cardinality: definition.cardinality,
    required: requiredKeys.has(questionKey),
    visible: visibleKeys.has(questionKey),
    value: current.structuredAnswers?.[questionKey],
    allowedAnswers: definition.allowedAnswers ?? [],
    helpContentRef: definition.helpContentRef,
    whyWeAsk: helpContentOverrides[definition.helpContentRef] ?? definition.whyWeAsk ?? null,
    safetyRelevance: definition.safetyRelevance,
    summaryRenderer: definition.summaryRenderer,
  };
}

function collectActiveSummaryChips(
  requestType: ProgressiveRequestType,
  answers: Record<string, unknown>,
  visibleKeys: ReadonlySet<string>,
): readonly ProgressiveSummaryChip[] {
  const order = requestTypeQuestionKeys.get(requestType) ?? [];
  return order
    .filter((questionKey) => visibleKeys.has(questionKey))
    .map((questionKey) => buildSummaryChip(questionKey, answers[questionKey]))
    .filter((chip): chip is ProgressiveSummaryChip => chip !== null);
}

function collectContextChips(
  requestType: ProgressiveRequestType,
  answers: Record<string, unknown>,
  visibleKeys: ReadonlySet<string>,
  beforeQuestionKey: string,
): readonly ProgressiveSummaryChip[] {
  const orderedKeys = requestTypeQuestionKeys.get(requestType) ?? [];
  const boundary = orderedKeys.indexOf(beforeQuestionKey);
  if (boundary <= 0) {
    return [];
  }
  return orderedKeys
    .slice(0, boundary)
    .filter((questionKey) => visibleKeys.has(questionKey))
    .map((questionKey) => buildSummaryChip(questionKey, answers[questionKey]))
    .filter((chip): chip is ProgressiveSummaryChip => chip !== null)
    .slice(-3);
}

export function validateCurrentQuestionFrame(
  memory: ProgressiveFlowMemoryShape,
): readonly ProgressiveValidationIssue[] {
  const current = ensureProgressiveState(memory);
  const answers = current.structuredAnswers ?? {};
  const { visibleKeys, requiredKeys } = getVisibleState(current.requestType, answers);
  const rootQuestionKey = getCurrentRootQuestionKey(current);
  const fieldKeys = [
    rootQuestionKey,
    ...getDependentQuestionKeys(rootQuestionKey, current.requestType),
  ].filter((questionKey) => visibleKeys.has(questionKey));
  return fieldKeys
    .map((questionKey) => {
      const definition = questionDefinitionsByKey.get(questionKey);
      if (!definition || !requiredKeys.has(questionKey)) {
        return null;
      }
      return validateAnswerValue(definition, answers[questionKey]);
    })
    .filter((issue): issue is ProgressiveValidationIssue => issue !== null);
}

export function moveDetailsBackward<T extends ProgressiveFlowMemoryShape>(memory: T): T {
  const current = ensureProgressiveState(memory);
  const rootQuestionKeys = getRootQuestionKeys(current.requestType);
  const currentIndex = rootQuestionKeys.indexOf(getCurrentRootQuestionKey(current));
  const previousQuestionKey = rootQuestionKeys[Math.max(currentIndex - 1, 0)];
  return {
    ...current,
    detailsCursorQuestionKey: previousQuestionKey,
    deltaNotice: null,
  };
}

export function moveDetailsForward<T extends ProgressiveFlowMemoryShape>(
  memory: T,
): { nextMemory: T; complete: boolean; validationIssues: readonly ProgressiveValidationIssue[] } {
  const current = ensureProgressiveState(memory);
  const nextDeltaNotice = current.reviewAffirmed ? null : (current.deltaNotice ?? null);
  const validationIssues = validateCurrentQuestionFrame(current);
  if (validationIssues.length > 0) {
    return {
      nextMemory: current as T,
      complete: false,
      validationIssues,
    };
  }
  const rootQuestionKeys = getRootQuestionKeys(current.requestType);
  const currentIndex = rootQuestionKeys.indexOf(getCurrentRootQuestionKey(current));
  if (currentIndex >= rootQuestionKeys.length - 1) {
    return {
      nextMemory: {
        ...current,
        deltaNotice: nextDeltaNotice,
      } as T,
      complete: true,
      validationIssues: [],
    };
  }
  return {
    nextMemory: {
      ...current,
      detailsCursorQuestionKey: rootQuestionKeys[currentIndex + 1],
      deltaNotice: nextDeltaNotice,
    } as T,
    complete: false,
    validationIssues: [],
  };
}

export function buildProgressiveFlowView(memory: ProgressiveFlowMemoryShape): ProgressiveFlowView {
  const current = ensureProgressiveState(memory);
  const answers = current.structuredAnswers ?? {};
  const { visibleKeys, requiredKeys } = getVisibleState(current.requestType, answers);
  const rootQuestionKey = getCurrentRootQuestionKey(current);
  const revealQuestionKeys = getDependentQuestionKeys(rootQuestionKey, current.requestType).filter(
    (questionKey) => visibleKeys.has(questionKey),
  );
  const fieldKeys = [rootQuestionKey, ...revealQuestionKeys].filter((questionKey) =>
    visibleKeys.has(questionKey),
  );
  const rootQuestionDefinition = questionDefinitionsByKey.get(rootQuestionKey)!;
  const rootQuestionKeys = getRootQuestionKeys(current.requestType);
  const validationIssues = validateCurrentQuestionFrame(current);
  return {
    requestTypeCards: requestTypeUiProfiles,
    activeQuestionFrame: {
      requestType: current.requestType,
      rootQuestionKey,
      title: rootQuestionDefinition.promptLabel,
      helper:
        "Answer one question at a time. Extra detail appears only when it helps us understand what you need.",
      currentIndex: Math.max(rootQuestionKeys.indexOf(rootQuestionKey), 0),
      totalGroups: rootQuestionKeys.length,
      fields: fieldKeys.map((questionKey) =>
        buildFieldView(questionKey, current, visibleKeys, requiredKeys),
      ),
      contextChips: collectContextChips(current.requestType, answers, visibleKeys, rootQuestionKey),
      summaryChips: collectActiveSummaryChips(current.requestType, answers, visibleKeys),
      revealQuestionKeys,
      validationIssues,
    },
    activeSummaryChips: collectActiveSummaryChips(current.requestType, answers, visibleKeys),
    requestTypeChangeNotice: current.pendingRequestTypeChange ?? null,
    deltaNotice: current.deltaNotice ?? null,
    bundleCompatibilitySheet: compatibilitySheets.get(
      current.bundleCompatibilityMode ?? "resume_compatible",
    ) as ProgressiveBundleCompatibilitySheet,
    canContinueDetails: validationIssues.length === 0,
  };
}

export function projectActiveQuestionSummary(memory: ProgressiveFlowMemoryShape): string {
  const flow = buildProgressiveFlowView(memory);
  return flow.activeSummaryChips[0]?.value ?? "";
}

export function projectNarrativeAnswer(memory: ProgressiveFlowMemoryShape): string {
  const current = ensureProgressiveState(memory);
  const narrativeKey = [...(requestTypeQuestionKeys.get(current.requestType) ?? [])]
    .reverse()
    .find((questionKey) => questionDefinitionsByKey.get(questionKey)?.answerType === "long_text");
  const narrative = narrativeKey ? current.structuredAnswers?.[narrativeKey] : null;
  return typeof narrative === "string" ? narrative : "";
}

export function buildAnswerOptions(
  questionKey: string,
): readonly { value: string; label: string }[] {
  const definition = questionDefinitionsByKey.get(questionKey);
  if (!definition?.allowedAnswers) {
    return [];
  }
  return definition.allowedAnswers.map((value) => ({
    value,
    label: answerLabelOverrides[questionKey]?.[value] ?? humanizeToken(value),
  }));
}

export function hasRequestTypeAnswers(memory: ProgressiveFlowMemoryShape): boolean {
  const current = ensureProgressiveState(memory);
  return Object.keys(current.structuredAnswers ?? {}).some(
    (questionKey) => questionDefinitionsByKey.get(questionKey)?.requestType === current.requestType,
  );
}

function answerList(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function hasBoundedUrgentDiversionSignal(memory: ProgressiveFlowMemoryShape): boolean {
  const current = ensureProgressiveState(memory);
  const answers = current.structuredAnswers ?? {};
  if (current.requestType === "Symptoms") {
    const severityClues = answerList(answers["symptoms.severityClues"]);
    return (
      answers["symptoms.category"] === "chest_breathing" ||
      (answers["symptoms.worseningNow"] === true && severityClues.includes("sudden_change"))
    );
  }
  if (current.requestType === "Meds") {
    return answers["meds.urgency"] === "urgent_today";
  }
  return false;
}

export function isSafetyReviewPending(memory: ProgressiveFlowMemoryShape): boolean {
  const current = ensureProgressiveState(memory);
  return current.reviewAffirmed === false;
}
