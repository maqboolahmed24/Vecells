import { describe, expect, it } from "vitest";
import {
  bootstrapDomainModule,
  createNormalizedSubmissionService,
  createNormalizedSubmissionStore,
  createPhase1ContactPreferenceService,
  createPhase1ContactPreferenceStore,
  createInMemoryAttachmentObjectStorage,
  createPhase1AttachmentPipelineService,
  createPhase1AttachmentPipelineStore,
  createPhase1OutcomeGrammarService,
  createPhase1OutcomeGrammarStore,
  createSubmissionPromotionTransactionStore,
  createSubmissionEnvelopeValidationService,
  defaultPhase1IntakeExperienceBundles,
  domainServiceFamilies,
  eventFamilies,
  NormalizedSubmissionDocument,
  IntakeSubmitSettlementDocument,
  ownedObjectFamilies,
  packageContract,
  phase1QuestionDefinitions,
  phase1RequestTypeTaxonomy,
  policyFamilies,
  projectionFamilies,
  SubmissionSnapshotFreezeDocument,
  SubmitNormalizationSeedDocument,
} from "../src/index.ts";
import { foundationKernelFamilies } from "../../../domain-kernel/src/index";
import { publishedEventFamilies } from "../../../event-contracts/src/index";
import { foundationPolicyScopeCatalog } from "../../../authz-policy/src/index";
import { observabilitySignalFamilies } from "../../../observability/src/index";

describe("public package surface", () => {
  it("boots through public dependencies only", () => {
    expect(packageContract.packageName).toBe("@vecells/domain-intake-request");
    expect(ownedObjectFamilies.length).toBeGreaterThan(0);
    expect(bootstrapDomainModule().objectFamilies).toBe(ownedObjectFamilies.length);
    expect(Array.isArray(domainServiceFamilies)).toBe(true);
    expect(Array.isArray(eventFamilies)).toBe(true);
    expect(Array.isArray(policyFamilies)).toBe(true);
    expect(Array.isArray(projectionFamilies)).toBe(true);
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
    expect(Array.isArray(publishedEventFamilies)).toBe(true);
    expect(Array.isArray(foundationPolicyScopeCatalog)).toBe(true);
    expect(Array.isArray(observabilitySignalFamilies)).toBe(true);
    expect(phase1QuestionDefinitions.length).toBeGreaterThan(0);
    expect(phase1RequestTypeTaxonomy.requestTypes).toHaveLength(4);
    expect(defaultPhase1IntakeExperienceBundles.browser.bundleRef).toBe(
      "IEB_140_BROWSER_STANDARD_V1",
    );
    expect(typeof createSubmissionEnvelopeValidationService).toBe("function");
    expect(typeof createNormalizedSubmissionService).toBe("function");
    expect(typeof createNormalizedSubmissionStore).toBe("function");
    expect(typeof createPhase1AttachmentPipelineStore).toBe("function");
    expect(typeof createInMemoryAttachmentObjectStorage).toBe("function");
    expect(typeof createPhase1AttachmentPipelineService).toBe("function");
    expect(typeof createPhase1ContactPreferenceStore).toBe("function");
    expect(typeof createPhase1ContactPreferenceService).toBe("function");
    expect(typeof createPhase1OutcomeGrammarStore).toBe("function");
    expect(typeof createPhase1OutcomeGrammarService).toBe("function");
    expect(typeof createSubmissionPromotionTransactionStore).toBe("function");
    expect(typeof NormalizedSubmissionDocument.create).toBe("function");
    expect(typeof SubmissionSnapshotFreezeDocument.create).toBe("function");
    expect(typeof SubmitNormalizationSeedDocument.create).toBe("function");
    expect(typeof IntakeSubmitSettlementDocument.create).toBe("function");
  });
});
