import { describe, expect, it } from "vitest";
import {
  aggregateFamilies,
  bootstrapDomainModule,
  createPhase3PatientConversationTupleService,
  createPhase3ConversationControlService,
  createPhase3ConversationControlStore,
  createPhase1ConfirmationDispatchService,
  createPhase1ConfirmationDispatchStore,
  domainServiceFamilies,
  eventFamilies,
  ownedObjectFamilies,
  packageContract,
  Phase1ConfirmationCommunicationEnvelopeDocument,
  Phase1ConfirmationDeliveryEvidenceDocument,
  Phase1ConfirmationReceiptBridgeDocument,
  Phase1ConfirmationTransportSettlementDocument,
  policyFamilies,
  projectionFamilies,
} from "../src/index.ts";
import { foundationKernelFamilies } from "@vecells/domain-kernel";
import { publishedEventFamilies } from "@vecells/event-contracts";
import { foundationPolicyScopeCatalog } from "@vecells/authz-policy";
import { observabilitySignalFamilies } from "@vecells/observability";

describe("public package surface", () => {
  it("boots through public dependencies only", () => {
    expect(packageContract.packageName).toBe("@vecells/domain-communications");
    expect(ownedObjectFamilies.length).toBeGreaterThan(0);
    expect(bootstrapDomainModule().objectFamilies).toBe(ownedObjectFamilies.length);
    expect(Array.isArray(aggregateFamilies)).toBe(true);
    expect(Array.isArray(domainServiceFamilies)).toBe(true);
    expect(Array.isArray(eventFamilies)).toBe(true);
    expect(Array.isArray(policyFamilies)).toBe(true);
    expect(Array.isArray(projectionFamilies)).toBe(true);
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
    expect(Array.isArray(publishedEventFamilies)).toBe(true);
    expect(Array.isArray(foundationPolicyScopeCatalog)).toBe(true);
    expect(Array.isArray(observabilitySignalFamilies)).toBe(true);
    expect(typeof createPhase1ConfirmationDispatchStore).toBe("function");
    expect(typeof createPhase1ConfirmationDispatchService).toBe("function");
    expect(typeof createPhase3PatientConversationTupleService).toBe("function");
    expect(typeof createPhase3ConversationControlStore).toBe("function");
    expect(typeof createPhase3ConversationControlService).toBe("function");
    expect(typeof Phase1ConfirmationCommunicationEnvelopeDocument.create).toBe("function");
    expect(typeof Phase1ConfirmationTransportSettlementDocument.create).toBe("function");
    expect(typeof Phase1ConfirmationDeliveryEvidenceDocument.create).toBe("function");
    expect(typeof Phase1ConfirmationReceiptBridgeDocument.create).toBe("function");
  });
});
