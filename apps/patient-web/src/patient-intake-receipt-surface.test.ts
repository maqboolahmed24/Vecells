import { describe, expect, it } from "vitest";
import {
  buildContactSummaryView,
  createDefaultDraftContactPreferences,
} from "./patient-intake-contact-preferences";
import {
  applyInlineReceiptPatch,
  buildReceiptSurface,
  createDefaultReceiptSimulation,
} from "./patient-intake-receipt-surface";

function buildContactSummary() {
  return buildContactSummaryView({
    preferences: {
      ...createDefaultDraftContactPreferences(),
      preferredChannel: "email",
      followUpPermission: "granted",
      destinations: {
        sms: "07700 900444",
        phone: "020 7946 0024",
        email: "receipt.patient@example.test",
      },
    },
    baselinePreferences: createDefaultDraftContactPreferences(),
  });
}

describe("patient intake receipt surface", () => {
  it("renders the canonical receipt bucket and keeps timestamps out of the patient facts band", () => {
    const receipt = buildReceiptSurface({
      requestPublicId: "req_qc_2049",
      contactSummaryView: buildContactSummary(),
      simulationState: createDefaultReceiptSimulation(),
    });

    expect(receipt.receiptBucket).toBe("within_2_working_days");
    expect(receipt.facts.find((fact) => fact.dataTestId === "receipt-eta-fact")?.value).toBe(
      "Within 2 working days",
    );
    expect(receipt.promiseNoteBody).not.toMatch(/\d{1,2}:\d{2}/);
    expect(receipt.summary).toContain("same shell lineage");
  });

  it("keeps queued and delivered communication semantics separate", () => {
    const queued = buildReceiptSurface({
      requestPublicId: "req_qc_2049",
      contactSummaryView: buildContactSummary(),
      simulationState: createDefaultReceiptSimulation(),
    });
    const delivered = buildReceiptSurface({
      requestPublicId: "req_qc_2049",
      contactSummaryView: buildContactSummary(),
      simulationState: {
        ...createDefaultReceiptSimulation(),
        communicationPosture: "delivered",
        nextPatchMacroState: null,
      },
    });

    expect(queued.communicationBridgeNote.toLowerCase()).toContain("queued is not the same as delivered");
    expect(delivered.communicationBridgeNote.toLowerCase()).toContain("delivery evidence");
    expect(delivered.communicationBridgeNote.toLowerCase()).not.toContain("queued is not the same as delivered");
  });

  it("patches the receipt in place from received to in-review without changing the route contract", () => {
    const patchedState = applyInlineReceiptPatch(createDefaultReceiptSimulation());
    const receipt = buildReceiptSurface({
      requestPublicId: "req_qc_2049",
      contactSummaryView: buildContactSummary(),
      simulationState: patchedState,
    });

    expect(receipt.macroState).toBe("in_review");
    expect(receipt.trackRequestAction.targetPathname).toBe("/intake/requests/req_qc_2049/status");
    expect(receipt.liveRegionMessage).toContain("In review");
  });
});
