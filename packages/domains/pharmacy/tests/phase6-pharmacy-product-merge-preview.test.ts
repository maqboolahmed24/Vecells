import { describe, expect, it } from "vitest";

import {
  PHARMACY_PRODUCT_MERGE_VISUAL_MODE,
  pharmacyProductMergePreviewCases,
  resolvePharmacyProductMergePreviewForCase,
  resolvePharmacyProductMergePreviewForMessageCluster,
  resolvePharmacyProductMergePreviewForOpsAnomaly,
  resolvePharmacyProductMergePreviewForRequest,
} from "../src/phase6-pharmacy-product-merge-preview.ts";

describe("phase6 pharmacy product merge preview", () => {
  it("resolves one canonical urgent-return lineage across request, case, message, and ops lookups", () => {
    const requestMerge = resolvePharmacyProductMergePreviewForRequest("request_215_callback");
    const caseMerge = resolvePharmacyProductMergePreviewForCase("PHC-2103");
    const messageMerge = resolvePharmacyProductMergePreviewForMessageCluster(
      "cluster_368_pharmacy_urgent_return",
    );
    const opsMerge = resolvePharmacyProductMergePreviewForOpsAnomaly("ops-route-pharmacy-2103");

    expect(requestMerge).not.toBeNull();
    expect(caseMerge).toEqual(requestMerge);
    expect(messageMerge).toEqual(requestMerge);
    expect(opsMerge).toEqual(requestMerge);
    expect(requestMerge?.mergeState).toBe("urgent_return");
    expect(requestMerge?.entryMode).toBe("bounce_back_reopened");
  });

  it("publishes pending, urgent-return, and completed merge fixtures with stable source refs", () => {
    expect(pharmacyProductMergePreviewCases).toHaveLength(3);
    expect(
      pharmacyProductMergePreviewCases.map((preview) => preview.visualMode),
    ).toEqual([
      PHARMACY_PRODUCT_MERGE_VISUAL_MODE,
      PHARMACY_PRODUCT_MERGE_VISUAL_MODE,
      PHARMACY_PRODUCT_MERGE_VISUAL_MODE,
    ]);
    expect(
      pharmacyProductMergePreviewCases.map((preview) => preview.mergeState),
    ).toEqual(["dispatch_pending", "urgent_return", "completed"]);
    for (const preview of pharmacyProductMergePreviewCases) {
      expect(preview.sourceProjectionRefs.length).toBeGreaterThan(2);
      expect(preview.patientRouteRef).toContain(preview.pharmacyCaseId);
      expect(preview.requestDetailRouteRef).toContain(preview.requestRef);
    }
  });
});
