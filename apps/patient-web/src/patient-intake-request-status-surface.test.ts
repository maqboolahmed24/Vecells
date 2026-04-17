import { describe, expect, it } from "vitest";
import {
  applyRequestStatusRefreshPatch,
  buildRequestStatusSurface,
  createDefaultRequestStatusSimulation,
} from "./patient-intake-request-status-surface";
import { createDefaultReceiptSimulation } from "./patient-intake-receipt-surface";

describe("patient intake request status surface", () => {
  it("builds the minimal request pulse from the same receipt consistency envelope", () => {
    const surface = buildRequestStatusSurface({
      draftPublicId: "dft_qc_2049",
      requestPublicId: "req_qc_2049",
      aliasSource: "seq_139_contract",
      receiptSimulation: createDefaultReceiptSimulation(),
      statusSimulation: createDefaultRequestStatusSimulation(),
    });

    expect(surface.contractId).toBe("PHASE1_MINIMAL_TRACK_REQUEST_SURFACE_V1");
    expect(surface.receiptConsistencyKey).toBe("receipt_consistency::req_qc_2049");
    expect(surface.statusConsistencyKey).toBe("status_consistency::req_qc_2049");
    expect(surface.receiptBucketLabel).toBe("Within 2 working days");
    expect(surface.actionNeededCard).toBeNull();
    expect(surface.returnLink?.targetPathname).toBe("/intake/requests/req_qc_2049/receipt");
  });

  it("renders one bounded action-needed cue for we_need_you without reopening a dashboard flow", () => {
    const surface = buildRequestStatusSurface({
      draftPublicId: "dft_qc_2049",
      requestPublicId: "req_qc_2049",
      aliasSource: "start_request_alias",
      receiptSimulation: {
        ...createDefaultReceiptSimulation(),
        macroState: "we_need_you",
      },
      statusSimulation: {
        ...createDefaultRequestStatusSimulation(),
        allowRefreshPatch: false,
      },
    });

    expect(surface.actionNeededCard?.label).toBe("Review this request");
    expect(surface.returnLink).toBeNull();
    expect(surface.actionNeededCard?.targetPathname).toBe("/start-request/dft_qc_2049/receipt");
  });

  it("narrows to recovery-only posture and withholds the ETA bucket when recovery is required", () => {
    const surface = buildRequestStatusSurface({
      draftPublicId: "dft_qc_2049",
      requestPublicId: "req_qc_2049",
      aliasSource: "seq_139_contract",
      receiptSimulation: {
        ...createDefaultReceiptSimulation(),
        macroState: "urgent_action",
        promiseState: "recovery_required",
      },
      statusSimulation: {
        ...createDefaultRequestStatusSimulation(),
        surfacePosture: "recovery_only",
        etaVisibility: "withheld",
        allowRefreshPatch: false,
      },
    });

    expect(surface.surfacePosture).toBe("recovery_only");
    expect(surface.etaVisible).toBe(false);
    expect(surface.actionNeededCard?.label).toBe("Open urgent guidance");
  });

  it("refreshes the status in place and keeps receipt/status truth aligned", () => {
    const refreshed = applyRequestStatusRefreshPatch({
      receiptSimulation: createDefaultReceiptSimulation(),
      statusSimulation: createDefaultRequestStatusSimulation(),
    });

    expect(refreshed.receiptSimulation.macroState).toBe("in_review");
    expect(refreshed.receiptSimulation.allowInlinePatch).toBe(false);
    expect(refreshed.statusSimulation.lastMeaningfulUpdateLine).toContain("first review step");
    expect(refreshed.statusSimulation.allowRefreshPatch).toBe(false);
  });
});
