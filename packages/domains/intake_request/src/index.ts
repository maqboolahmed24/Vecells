export interface OwnedObjectFamily {
  canonicalName: string;
  objectKind: string;
  boundedContext: string;
  authoritativeOwner: string;
  sourceRef: string;
}

export interface PackageContract {
  artifactId: string;
  packageName: string;
  packageRole: string;
  ownerContextCode: string;
  ownerContextLabel: string;
  purpose: string;
  versioningPosture: string;
  allowedDependencies: readonly string[];
  forbiddenDependencies: readonly string[];
  dependencyContractRefs: readonly string[];
  objectFamilyCount: number;
  contractFamilyCount: number;
  sourceContexts: readonly string[];
}

export const packageContract = {
  artifactId: "package_domains_intake_request",
  packageName: "@vecells/domain-intake-request",
  packageRole: "domain",
  ownerContextCode: "intake_request",
  ownerContextLabel: "Intake Request",
  purpose:
    "Canonical package home for Phase 1 pre-submit intake validation, deterministic normalized-submission truth, attachment pipeline truth, contact-preference capture, immutable submit promotion records, and submit-readiness law.",
  versioningPosture:
    "Workspace-private domain boundary. Public exports are explicit and additive-first.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/authz-policy",
    "packages/observability",
  ],
  forbiddenDependencies: [
    "packages/domains/* sibling internals",
    "apps/*",
    "services/*",
    "packages/design-system",
  ],
  dependencyContractRefs: [
    "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL",
    "CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS",
    "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
  ],
  objectFamilyCount: 19,
  contractFamilyCount: 8,
  sourceContexts: [
    "phase1_intake_validation",
    "phase1_normalized_submission",
    "phase1_attachment_pipeline",
    "phase1_contact_preferences",
    "phase1_submission_promotion",
  ],
} as const satisfies PackageContract;

export const domainModule = {
  artifactId: packageContract.artifactId,
  packageName: packageContract.packageName,
  ownerContext: packageContract.ownerContextCode,
  posture: "baseline_required",
  note: packageContract.purpose,
} as const;

export const ownedObjectFamilies = [
  {
    canonicalName: "Phase1IntakeExperienceBundle",
    objectKind: "bundle",
    boundedContext: "phase1_intake_validation",
    authoritativeOwner: "Phase 1 intake request validation",
    sourceRef: "prompt/145.md",
  },
  {
    canonicalName: "SubmissionEnvelopeValidationVerdict",
    objectKind: "record",
    boundedContext: "phase1_intake_validation",
    authoritativeOwner: "Phase 1 intake request validation",
    sourceRef: "prompt/145.md",
  },
  {
    canonicalName: "RequiredFieldMeaningMap",
    objectKind: "contract",
    boundedContext: "phase1_intake_validation",
    authoritativeOwner: "Phase 1 intake request validation",
    sourceRef: "prompt/145.md",
  },
  {
    canonicalName: "ValidationErrorContract",
    objectKind: "contract",
    boundedContext: "phase1_intake_validation",
    authoritativeOwner: "Phase 1 intake request validation",
    sourceRef: "prompt/145.md",
  },
  {
    canonicalName: "NormalizedSubmission",
    objectKind: "record",
    boundedContext: "phase1_normalized_submission",
    authoritativeOwner: "Phase 1 deterministic normalized submission",
    sourceRef: "prompt/149.md",
  },
  {
    canonicalName: "AttachmentUploadSession",
    objectKind: "contract",
    boundedContext: "phase1_attachment_pipeline",
    authoritativeOwner: "Phase 1 attachment pipeline",
    sourceRef: "prompt/146.md",
  },
  {
    canonicalName: "AttachmentScanSettlement",
    objectKind: "record",
    boundedContext: "phase1_attachment_pipeline",
    authoritativeOwner: "Phase 1 attachment pipeline",
    sourceRef: "prompt/146.md",
  },
  {
    canonicalName: "AttachmentDocumentReferenceLink",
    objectKind: "record",
    boundedContext: "phase1_attachment_pipeline",
    authoritativeOwner: "Phase 1 attachment pipeline",
    sourceRef: "prompt/146.md",
  },
  {
    canonicalName: "Phase1ContactPreferenceCapture",
    objectKind: "record",
    boundedContext: "phase1_contact_preferences",
    authoritativeOwner: "Phase 1 contact preference capture",
    sourceRef: "prompt/147.md",
  },
  {
    canonicalName: "Phase1ContactPreferenceMaskedView",
    objectKind: "projection",
    boundedContext: "phase1_contact_preferences",
    authoritativeOwner: "Phase 1 contact preference capture",
    sourceRef: "prompt/147.md",
  },
  {
    canonicalName: "Phase1ContactRouteSnapshotSeed",
    objectKind: "contract",
    boundedContext: "phase1_contact_preferences",
    authoritativeOwner: "Phase 1 contact preference capture",
    sourceRef: "prompt/147.md",
  },
  {
    canonicalName: "Phase1ContactPreferenceSubmitFreeze",
    objectKind: "record",
    boundedContext: "phase1_contact_preferences",
    authoritativeOwner: "Phase 1 contact preference capture",
    sourceRef: "prompt/147.md",
  },
  {
    canonicalName: "SubmissionSnapshotFreeze",
    objectKind: "record",
    boundedContext: "phase1_submission_promotion",
    authoritativeOwner: "Phase 1 immutable submit promotion transaction",
    sourceRef: "prompt/148.md",
  },
  {
    canonicalName: "SubmitNormalizationSeed",
    objectKind: "record",
    boundedContext: "phase1_submission_promotion",
    authoritativeOwner: "Phase 1 compatibility alias for persisted normalized submission storage",
    sourceRef: "prompt/149.md",
  },
  {
    canonicalName: "IntakeSubmitSettlement",
    objectKind: "record",
    boundedContext: "phase1_submission_promotion",
    authoritativeOwner: "Phase 1 immutable submit promotion transaction",
    sourceRef: "prompt/148.md",
  },
  {
    canonicalName: "PatientReceiptConsistencyEnvelope",
    objectKind: "record",
    boundedContext: "phase1_outcome_grammar",
    authoritativeOwner: "Phase 1 outcome grammar and receipt consistency",
    sourceRef: "prompt/151.md",
  },
  {
    canonicalName: "IntakeOutcomePresentationArtifact",
    objectKind: "artifact",
    boundedContext: "phase1_outcome_grammar",
    authoritativeOwner: "Phase 1 outcome grammar and receipt consistency",
    sourceRef: "prompt/151.md",
  },
  {
    canonicalName: "Phase1OutcomeTuple",
    objectKind: "record",
    boundedContext: "phase1_outcome_grammar",
    authoritativeOwner: "Phase 1 outcome grammar and receipt consistency",
    sourceRef: "prompt/151.md",
  },
  {
    canonicalName: "OutcomeNavigationGrant",
    objectKind: "record",
    boundedContext: "phase1_outcome_grammar",
    authoritativeOwner: "Phase 1 outcome grammar and receipt consistency",
    sourceRef: "prompt/151.md",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [
  {
    canonicalName: "Phase1NormalizedSubmissionService",
    objectKind: "other",
    boundedContext: "phase1_normalized_submission",
    authoritativeOwner: "Phase 1 deterministic normalized submission",
    sourceRef: "prompt/149.md",
  },
  {
    canonicalName: "SubmissionEnvelopeValidationVerdict",
    objectKind: "record",
    boundedContext: "phase1_intake_validation",
    authoritativeOwner: "Phase 1 intake request validation",
    sourceRef: "prompt/145.md",
  },
  {
    canonicalName: "Phase1AttachmentPipelineService",
    objectKind: "other",
    boundedContext: "phase1_attachment_pipeline",
    authoritativeOwner: "Phase 1 attachment pipeline",
    sourceRef: "prompt/146.md",
  },
  {
    canonicalName: "Phase1ContactPreferenceService",
    objectKind: "other",
    boundedContext: "phase1_contact_preferences",
    authoritativeOwner: "Phase 1 contact preference capture",
    sourceRef: "prompt/147.md",
  },
  {
    canonicalName: "Phase1IntakeSubmitSettlement",
    objectKind: "other",
    boundedContext: "phase1_submission_promotion",
    authoritativeOwner: "Phase 1 immutable submit promotion transaction",
    sourceRef: "prompt/148.md",
  },
  {
    canonicalName: "Phase1OutcomeGrammarService",
    objectKind: "other",
    boundedContext: "phase1_outcome_grammar",
    authoritativeOwner: "Phase 1 outcome grammar and receipt consistency",
    sourceRef: "prompt/151.md",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [
  {
    canonicalName: "Phase1AttachmentPipelineEvent",
    objectKind: "event_contract",
    boundedContext: "phase1_attachment_pipeline",
    authoritativeOwner: "Phase 1 attachment pipeline",
    sourceRef: "prompt/146.md",
  },
  {
    canonicalName: "Phase1ContactPreferenceEvent",
    objectKind: "event_contract",
    boundedContext: "phase1_contact_preferences",
    authoritativeOwner: "Phase 1 contact preference capture",
    sourceRef: "prompt/147.md",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "DraftAttachmentProjectionCard",
    objectKind: "projection",
    boundedContext: "phase1_attachment_pipeline",
    authoritativeOwner: "Phase 1 attachment pipeline",
    sourceRef: "prompt/146.md",
  },
  {
    canonicalName: "PromotedRequestAttachmentSummary",
    objectKind: "projection",
    boundedContext: "phase1_attachment_pipeline",
    authoritativeOwner: "Phase 1 attachment pipeline",
    sourceRef: "prompt/146.md",
  },
  {
    canonicalName: "Phase1ContactPreferenceMaskedView",
    objectKind: "projection",
    boundedContext: "phase1_contact_preferences",
    authoritativeOwner: "Phase 1 contact preference capture",
    sourceRef: "prompt/147.md",
  },
] as const satisfies readonly OwnedObjectFamily[];

export function bootstrapDomainModule() {
  return {
    packageName: packageContract.packageName,
    objectFamilies: ownedObjectFamilies.length,
    aggregateFamilies: aggregateFamilies.length,
    domainServiceFamilies: domainServiceFamilies.length,
    eventFamilies: eventFamilies.length,
    policyFamilies: policyFamilies.length,
    projectionFamilies: projectionFamilies.length,
  };
}

export * from "./intake-experience-bundle";
export * from "./normalized-submission";
export * from "./attachment-policy";
export * from "./attachment-pipeline";
export * from "./contact-preference-capture";
export * from "./submission-envelope-validation";
export * from "./submission-promotion-transaction";
export * from "./outcome-grammar";
