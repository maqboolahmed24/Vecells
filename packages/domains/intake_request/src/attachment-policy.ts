import fs from "node:fs";
import { RequestBackboneInvariantError } from "../../../domain-kernel/src/index";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

export interface Phase1AttachmentAcceptanceRule {
  ruleRef: string;
  label: string;
  allowedExtensions: readonly string[];
  allowedMimeFamilies: readonly string[];
  maxBytes: number;
  maxInlinePreviewBytes: number;
  previewEligibility: string;
  directCameraCaptureSupport: boolean;
  duplicateIdempotencyPolicyRef: string;
}

export interface Phase1AttachmentClassificationOutcome {
  outcome: string;
  outcomeRef: string;
  terminalScanState: string;
  quarantineState: string;
  artifactStageMode: string;
  currentSafeMode: string;
  documentReferenceState: string;
  emittedEventNames: readonly string[];
  safetyMeaningState: string;
  downstreamDisposition:
    | "routine_submit_allowed"
    | "retry_before_submit"
    | "replace_or_remove_then_review"
    | "state_unknown";
  patientVisiblePosture: string;
}

export interface Phase1AttachmentActionPolicy {
  artifactPresentationContractId: string;
  artifactRefPattern: string;
  audienceSurface: string;
  primaryMode: string;
  previewVisibility: string;
  fullBodyMode: string;
  summarySafetyTier: string;
  inlinePreviewContractRef: string;
  downloadContractRef: string;
  printContractRef: string;
  handoffContractRef: string;
  placeholderContractRef: string;
  redactionPolicyRef: string;
  maxInlineBytes: number;
  requiresStepUpForFullBody: boolean;
  allowedFallbackModes: readonly string[];
  channelSpecificNoticeRef: string;
  rawStorageUrlsForbidden: boolean;
}

export interface Phase1OutboundNavigationGrantPolicy {
  policyRef: string;
  grantRequiredFor: readonly string[];
  destinationClasses: readonly string[];
  sameShellReturnRequired: boolean;
  staleGrantBehavior: string;
  rawStorageUrlsForbidden: boolean;
}

export interface Phase1AttachmentProjectionMode {
  modeKey: string;
  label: string;
  artifactStageMode: string;
  currentSafeMode: string;
  previewVisibility: string;
  openAction: string;
  downloadAction: string;
  handoffAction: string;
  sameShellContinuity: string;
  appliesToOutcomes: readonly string[];
}

export interface Phase1AttachmentAcceptancePolicy {
  taskId: string;
  generatedAt: string;
  capturedOn: string;
  visualMode: string;
  policyId: string;
  draftSchemaVersion: string;
  requestTypes: readonly string[];
  sourcePrecedence: readonly string[];
  upstreamInputs: readonly string[];
  quarantineFirstUploadAlgorithm: readonly string[];
  attachmentPublicIdPattern: string;
  acceptedMimeFamilies: readonly string[];
  maxAcceptedBytes: number;
  maxInlinePreviewBytes: number;
  acceptanceRules: readonly Phase1AttachmentAcceptanceRule[];
  duplicateUploadPolicy: {
    policyRef: string;
    idempotencyScope: string;
    sameLineageBehavior: string;
    duplicateEventBehavior: string;
    userExperienceBehavior: string;
    fingerprintUnavailableBehavior: string;
  };
  classificationOutcomes: readonly Phase1AttachmentClassificationOutcome[];
  eventPolicy: readonly {
    eventName: string;
    emittedWhen: string;
    schemaArtifactPath: string;
  }[];
  artifactPresentationContract: Phase1AttachmentActionPolicy;
  outboundNavigationGrantPolicy: Phase1OutboundNavigationGrantPolicy;
  mockNowExecution: {
    scannerRuntimeState: string;
    scannerGapRef: string;
    summary: string;
  };
  actualProductionStrategyLater: {
    summary: string;
    canStrengthenDetection: boolean;
    mayRelaxPolicy: boolean;
  };
  gapResolutions: readonly { gapId: string; summary: string }[];
  assumptions: readonly { assumptionId: string; summary: string }[];
  conflicts: readonly { conflictId: string; summary: string }[];
  risks: readonly { riskId: string; summary: string; mitigation: string }[];
}

export interface Phase1AttachmentProjectionAndModes {
  projectionModesId: string;
  artifactPresentationContract: Phase1AttachmentActionPolicy;
  outboundNavigationGrantPolicy: Phase1OutboundNavigationGrantPolicy;
  scanStateLadder: readonly {
    stateKey: string;
    label: string;
    tone: string;
    summary: string;
  }[];
  artifactModes: readonly Phase1AttachmentProjectionMode[];
  projectionExamples: readonly Record<string, unknown>[];
  sameShellContinuityLaw: Record<string, unknown>;
}

function readJsonFile<TValue>(relativePathFromModule: string): TValue {
  const absolutePath = new URL(relativePathFromModule, import.meta.url);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as TValue;
}

function normalizePolicy(
  policy: Phase1AttachmentAcceptancePolicy,
): Phase1AttachmentAcceptancePolicy {
  invariant(
    typeof policy.policyId === "string" && policy.policyId.length > 0,
    "ATTACHMENT_POLICY_ID_MISSING",
    "Attachment acceptance policy must declare policyId.",
  );
  invariant(
    Array.isArray(policy.acceptanceRules) && policy.acceptanceRules.length > 0,
    "ATTACHMENT_ACCEPTANCE_RULES_MISSING",
    "Attachment acceptance policy must declare acceptanceRules.",
  );
  invariant(
    Array.isArray(policy.classificationOutcomes) && policy.classificationOutcomes.length > 0,
    "ATTACHMENT_CLASSIFICATION_OUTCOMES_MISSING",
    "Attachment acceptance policy must declare classificationOutcomes.",
  );
  invariant(
    policy.artifactPresentationContract.rawStorageUrlsForbidden === true,
    "ATTACHMENT_RAW_URLS_FORBIDDEN_REQUIRED",
    "Attachment artifact presentation must fail closed on raw storage URLs.",
  );
  return {
    ...policy,
    acceptanceRules: policy.acceptanceRules.map((rule) => ({
      ...rule,
      allowedExtensions: rule.allowedExtensions.map((value: string) => value.toLowerCase()),
      allowedMimeFamilies: rule.allowedMimeFamilies.map((value: string) => value.toLowerCase()),
    })),
    acceptedMimeFamilies: policy.acceptedMimeFamilies.map((value: string) => value.toLowerCase()),
  };
}

export const phase1AttachmentAcceptancePolicy = normalizePolicy(
  readJsonFile<Phase1AttachmentAcceptancePolicy>(
    "../../../../data/contracts/141_attachment_acceptance_policy.json",
  ),
);

export const phase1AttachmentProjectionAndModes =
  readJsonFile<Phase1AttachmentProjectionAndModes>(
    "../../../../data/contracts/141_attachment_projection_and_artifact_modes.json",
  );

export const phase1AttachmentRuleByRef = new Map(
  phase1AttachmentAcceptancePolicy.acceptanceRules.map((rule) => [rule.ruleRef, rule] as const),
);

export const phase1AttachmentOutcomeByKey = new Map(
  phase1AttachmentAcceptancePolicy.classificationOutcomes.map((outcome) => [
    outcome.outcome,
    outcome,
  ] as const),
);

export const phase1AttachmentArtifactModeByOutcome = new Map(
  phase1AttachmentProjectionAndModes.artifactModes.flatMap((mode) =>
    mode.appliesToOutcomes.map((outcome) => [outcome, mode] as const),
  ),
);

export const phase1AttachmentReasonCodes = [
  {
    reasonCode: "ATTACH_REASON_POLICY_MISSING",
    severity: "error",
    description: "The frozen seq_141 attachment policy could not be loaded or validated.",
  },
  {
    reasonCode: "ATTACH_REASON_UNSUPPORTED_EXTENSION",
    severity: "error",
    description: "The file extension is not on the strict allow-list.",
  },
  {
    reasonCode: "ATTACH_REASON_UNSUPPORTED_MIME",
    severity: "error",
    description: "The MIME family is not on the strict allow-list.",
  },
  {
    reasonCode: "ATTACH_REASON_SIZE_EXCEEDED",
    severity: "error",
    description: "The file exceeds the accepted byte ceiling.",
  },
  {
    reasonCode: "ATTACH_REASON_MALWARE_DETECTED",
    severity: "error",
    description: "The simulated scanner detected malware or unsafe content.",
  },
  {
    reasonCode: "ATTACH_REASON_INTEGRITY_FAILURE",
    severity: "error",
    description: "The upload checksum or byte integrity failed verification.",
  },
  {
    reasonCode: "ATTACH_REASON_UNREADABLE_PAYLOAD",
    severity: "error",
    description: "The payload reached quarantine but could not be decoded safely.",
  },
  {
    reasonCode: "ATTACH_REASON_SCAN_TIMEOUT",
    severity: "warning",
    description: "Scanning timed out and the attachment remains blocked pending retry.",
  },
  {
    reasonCode: "ATTACH_REASON_PREVIEW_GENERATION_FAILED",
    severity: "warning",
    description: "A non-authoritative preview derivative failed even though the source file stayed safe.",
  },
  {
    reasonCode: "ATTACH_REASON_DUPLICATE_REPLAY",
    severity: "info",
    description: "A duplicate upload replayed to the existing attachment lineage.",
  },
  {
    reasonCode: "ATTACH_REASON_REMOVED_BY_USER",
    severity: "info",
    description: "The attachment was explicitly removed from the active draft attachment list.",
  },
  {
    reasonCode: "ATTACH_REASON_REPLACED_SUPERSEDED",
    severity: "info",
    description: "The attachment was superseded by an explicit replacement capture.",
  },
  {
    reasonCode: "ATTACH_REASON_UPLOAD_NOT_SETTLED",
    severity: "warning",
    description: "Direct upload transport did not settle into quarantine storage.",
  },
  {
    reasonCode: "ATTACH_REASON_RAW_URL_FORBIDDEN",
    severity: "error",
    description: "Artifact access must resolve through governed grants instead of raw storage URLs.",
  },
] as const;

export function resolvePhase1AttachmentRule(
  fileName: string,
  declaredMimeType: string,
): Phase1AttachmentAcceptanceRule | undefined {
  const lowerFileName = fileName.trim().toLowerCase();
  const extension = lowerFileName.slice(lowerFileName.lastIndexOf("."));
  const mime = declaredMimeType.trim().toLowerCase();
  return phase1AttachmentAcceptancePolicy.acceptanceRules.find(
    (rule) =>
      rule.allowedExtensions.includes(extension) && rule.allowedMimeFamilies.includes(mime),
  );
}

export function resolvePhase1AttachmentOutcome(outcomeKey: string) {
  return phase1AttachmentOutcomeByKey.get(outcomeKey);
}

export function resolvePhase1AttachmentArtifactMode(outcomeKey: string) {
  return phase1AttachmentArtifactModeByOutcome.get(outcomeKey);
}
