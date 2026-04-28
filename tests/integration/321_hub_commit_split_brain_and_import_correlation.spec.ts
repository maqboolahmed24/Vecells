import { describe, expect, it } from "vitest";

import {
  atMinute,
  beginNativeCommit,
  buildBeginCommitInput,
  buildImportedIngestInput,
  buildNativeSubmitInput,
  setupHubCommitHarness,
} from "./321_hub_commit.helpers.ts";

describe("321 hub commit split-brain and import correlation", () => {
  it("writes a reconciliation-required settlement instead of retrying into a possible double book", async () => {
    const harness = await setupHubCommitHarness("321_reconcile");
    const begin = await beginNativeCommit(harness);

    const result = await harness.commitService.submitNativeApiCommit(
      await buildNativeSubmitInput(harness, begin, {
        response: {
          responseClass: "timeout_unknown",
          receiptCheckpointRef: `receipt_${begin.commitAttempt.commitAttemptId}`,
          adapterCorrelationKey: `corr_${begin.commitAttempt.commitAttemptId}`,
          sourceFamilies: ["adapter_receipt"],
        },
      }),
    );

    expect(result.settlement.result).toBe("reconciliation_required");
    expect(result.reconciliationRecord?.reconciliationClass).toBe(
      "external_timeout_unknown",
    );
    expect(result.truthProjection.confirmationTruthState).toBe("disputed");
    expect(result.truthProjection.blockingRefs).toEqual(
      expect.arrayContaining([
        "confirmation_disputed",
        "split_brain_reconciliation_required",
      ]),
    );
    expect(result.continuityProjection?.validationState).toBe("blocked");
  });

  it("rejects imported confirmation with mismatched source-version evidence", async () => {
    const harness = await setupHubCommitHarness("321_import_disputed");
    const begin = await harness.commitService.beginCommitAttempt(
      await buildBeginCommitInput(harness, "imported_confirmation", {
        recordedAt: atMinute(13),
      }),
    );

    const result = await harness.commitService.ingestImportedConfirmation(
      await buildImportedIngestInput(harness, begin, {
        importedEvidence: {
          importedEvidenceRef: "imported_evidence_321_invalid",
          sourceVersion: "wrong_source_version",
          supplierBookingReference: "imported_booking_321_invalid",
          supplierAppointmentRef: "supplier_appt_321_invalid",
          supplierCorrelationKey: "supplier_corr_321_invalid",
          matchedWindowMinutes: 15,
          evidenceSourceFamilies: ["imported_supplier_message"],
        },
      }),
    );

    expect(result.confirmationGate?.state).toBe("disputed");
    expect(result.settlement.result).toBe("imported_disputed");
    expect(result.truthProjection.confirmationTruthState).toBe("disputed");
    expect(result.evidenceBundle?.hardMatchResult).toBe("failed");
    expect(result.evidenceBundle?.hardMatchRefsFailed).toContain("source_version");
  });
});
