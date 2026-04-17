import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RequestBackboneInvariantError } from "../../../domain-kernel/src/index";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function findRepoRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = dirname(current);
    invariant(parent !== current, "REPO_ROOT_NOT_FOUND", "Could not locate repository root.");
    current = parent;
  }
}

const REPO_ROOT = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

export type IntakeRequestType = "Symptoms" | "Meds" | "Admin" | "Results";

export type Phase1AnswerType =
  | "single_select"
  | "multi_select"
  | "boolean"
  | "date"
  | "partial_date"
  | "short_text"
  | "short_text_or_unknown"
  | "long_text";

export interface Phase1QuestionDefinition {
  questionKey: string;
  requestType: IntakeRequestType;
  stepKey: "details";
  promptLabel: string;
  answerType: Phase1AnswerType;
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

export interface Phase1QuestionDefinitionContract {
  taskId: string;
  capturedOn: string;
  questionDefinitionContractId: string;
  draftSchemaVersion: "INTAKE_DRAFT_VIEW_V1";
  questionSetVersion: string;
  contentPackVersion: string;
  fieldContract: readonly string[];
  questionDefinitions: readonly Phase1QuestionDefinition[];
}

export interface Phase1RequestTypeTaxonomyArtifact {
  taskId: string;
  taxonomyId: string;
  requestTypes: ReadonlyArray<{
    requestType: IntakeRequestType;
    requestTypeSlug: string;
    questionSetRef: string;
    semanticSchemaRef: string;
    questionCount: number;
  }>;
}

export interface Phase1IntakeExperienceBundle {
  bundleRef: string;
  bundleVersion: string;
  draftSchemaVersion: "INTAKE_DRAFT_VIEW_V1";
  questionSetVersion: string;
  contentPackVersion: string;
  embeddedManifestVersionRef: string;
  releaseApprovalFreezeRef: string;
  minimumBridgeCapabilitiesRef: string;
  effectiveAt: string;
  expiresAt: string;
  compatibilityMode: "resume_compatible" | "review_migration_required" | "blocked";
  embeddedChromePolicy: "standard" | "nhs_embedded_minimal";
  requestTypeTaxonomyRef: string;
  questionDefinitionContractRef: string;
  decisionTableSetRef: string;
  supportedRequestTypes: readonly IntakeRequestType[];
}

function readJsonArtifact<T>(relativePath: string): T {
  const absolutePath = join(REPO_ROOT, relativePath);
  invariant(existsSync(absolutePath), "MISSING_PHASE1_ARTIFACT", `Missing artifact ${relativePath}.`);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

export const phase1QuestionDefinitionContract = readJsonArtifact<Phase1QuestionDefinitionContract>(
  "data/contracts/140_question_definitions.json",
);

export const phase1QuestionDefinitions = phase1QuestionDefinitionContract.questionDefinitions;

export const phase1RequestTypeTaxonomy = readJsonArtifact<Phase1RequestTypeTaxonomyArtifact>(
  "data/contracts/140_request_type_taxonomy.json",
);

export const defaultPhase1IntakeExperienceBundles = {
  browser: {
    bundleRef: "IEB_140_BROWSER_STANDARD_V1",
    bundleVersion: "v1.0.0",
    draftSchemaVersion: "INTAKE_DRAFT_VIEW_V1",
    questionSetVersion: phase1QuestionDefinitionContract.questionSetVersion,
    contentPackVersion: phase1QuestionDefinitionContract.contentPackVersion,
    embeddedManifestVersionRef: "PEM_PHASE1_INTAKE_EMBEDDED_V1",
    releaseApprovalFreezeRef: "RAF_LOCAL_V1",
    minimumBridgeCapabilitiesRef: "BMC_PHASE1_NHS_EMBEDDED_MINIMUM_V1",
    effectiveAt: "2026-04-14T00:00:00Z",
    expiresAt: "2026-09-30T23:59:59Z",
    compatibilityMode: "resume_compatible",
    embeddedChromePolicy: "standard",
    requestTypeTaxonomyRef: phase1RequestTypeTaxonomy.taxonomyId,
    questionDefinitionContractRef: phase1QuestionDefinitionContract.questionDefinitionContractId,
    decisionTableSetRef: "QDT_140_PHASE1_V1",
    supportedRequestTypes: phase1RequestTypeTaxonomy.requestTypes.map((entry) => entry.requestType),
  },
  embedded: {
    bundleRef: "IEB_140_EMBEDDED_MINIMAL_V1",
    bundleVersion: "v1.0.0",
    draftSchemaVersion: "INTAKE_DRAFT_VIEW_V1",
    questionSetVersion: phase1QuestionDefinitionContract.questionSetVersion,
    contentPackVersion: phase1QuestionDefinitionContract.contentPackVersion,
    embeddedManifestVersionRef: "PEM_PHASE1_INTAKE_EMBEDDED_MINIMAL_V1",
    releaseApprovalFreezeRef: "RAF_LOCAL_V1",
    minimumBridgeCapabilitiesRef: "BMC_PHASE1_NHS_EMBEDDED_MINIMUM_V1",
    effectiveAt: "2026-04-14T00:00:00Z",
    expiresAt: "2026-09-30T23:59:59Z",
    compatibilityMode: "review_migration_required",
    embeddedChromePolicy: "nhs_embedded_minimal",
    requestTypeTaxonomyRef: phase1RequestTypeTaxonomy.taxonomyId,
    questionDefinitionContractRef: phase1QuestionDefinitionContract.questionDefinitionContractId,
    decisionTableSetRef: "QDT_140_PHASE1_V1",
    supportedRequestTypes: phase1RequestTypeTaxonomy.requestTypes.map((entry) => entry.requestType),
  },
} as const satisfies Record<"browser" | "embedded", Phase1IntakeExperienceBundle>;

export function resolveDefaultPhase1IntakeExperienceBundle(
  surfaceChannelProfile: "browser" | "embedded",
): Phase1IntakeExperienceBundle {
  return defaultPhase1IntakeExperienceBundles[surfaceChannelProfile];
}
