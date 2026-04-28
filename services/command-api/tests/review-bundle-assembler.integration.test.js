import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_REVIEW_BUNDLE_ASSEMBLER_SERVICE_NAME,
  PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID,
  PHASE3_REVIEW_BUNDLE_QUERY_SURFACES,
  PHASE3_REVIEW_BUNDLE_SCHEMA_VERSION,
  createReviewBundleAssemblerApplication,
  reviewBundleRoutes,
  reviewBundleScenarioIds,
} from "../src/review-bundle-assembler.ts";

describe("phase 3 review bundle assembler seam", () => {
  it("publishes the review bundle routes in the command-api route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);

    expect(routeIds).toContain("workspace_task_review_bundle_current");
    expect(routeIds).toContain("workspace_task_review_bundle_suggestions_current");
    expect(reviewBundleRoutes).toHaveLength(2);
    expect(PHASE3_REVIEW_BUNDLE_QUERY_SURFACES).toEqual([
      "GET /v1/workspace/tasks/:taskId/review-bundle",
      "GET /internal/v1/workspace/tasks/:taskId/review-bundle/suggestions",
    ]);
  });

  it("assembles a deterministic bundle, delta packet, and suggestion seam from the same evidence set", async () => {
    const application = createReviewBundleAssemblerApplication();
    const first = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);
    const second = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);

    expect(application.serviceName).toBe(PHASE3_REVIEW_BUNDLE_ASSEMBLER_SERVICE_NAME);
    expect(application.schemaVersion).toBe(PHASE3_REVIEW_BUNDLE_SCHEMA_VERSION);
    expect(first.bundle.reviewBundleId).toBe(second.bundle.reviewBundleId);
    expect(first.bundle.bundleDigest).toBe(second.bundle.bundleDigest);
    expect(first.bundle.deterministicSummary.summaryDigest).toBe(
      second.bundle.deterministicSummary.summaryDigest,
    );
    expect(first.deltaPacket.deltaDigest).toBe(second.deltaPacket.deltaDigest);
    expect(first.bundle.summaryVisibilityState).toBe("authoritative");
    expect(first.bundle.provenance.evidenceSnapshotRef).toBe("evidence_snapshot_235_current");
    expect(first.visibleSuggestions[0].sourceType).toBe("rules");
    expect(first.visibleSuggestions[0].authoritativeWorkflowInfluence).toBe("advisory_only");
    expect(first.visibleSuggestions[0].visibilityState).toBe("visible");
    expect(first.shadowSuggestions[0].sourceType).toBe("shadow_model");
    expect(first.shadowSuggestions[0].visibilityState).toBe("silent_shadow");
  });

  it("suppresses authoritative regenerated summary copy when parity drifts", async () => {
    const application = createReviewBundleAssemblerApplication();
    await application.simulation.applyParityState(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID, "stale");

    const result = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);

    expect(result.bundle.publicationState).toBe("stale_recoverable");
    expect(result.bundle.summaryVisibilityState).toBe("provisional");
    expect(result.bundle.deterministicSummary.summaryText).toBeNull();
    expect(result.bundle.deterministicSummary.provisionalText).toContain("Request:");
    expect(result.visibleSuggestions[0].visibilityState).toBe("observe_only");
  });

  it("blocks regenerated summary copy and workflow suggestions when parity is unsafe", async () => {
    const application = createReviewBundleAssemblerApplication();
    await application.simulation.applyParityState(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID, "blocked");

    const result = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);

    expect(result.bundle.publicationState).toBe("recovery_required");
    expect(result.bundle.summaryVisibilityState).toBe("suppressed");
    expect(result.bundle.deterministicSummary.summaryLines).toEqual([]);
    expect(result.bundle.deterministicSummary.summaryText).toBeNull();
    expect(result.bundle.deterministicSummary.provisionalText).toBeNull();
    expect(result.bundle.deterministicSummary.suppressionReasonCodes).toContain(
      "REVIEW_235_PARITY_BLOCKED",
    );
    expect(result.visibleSuggestions[0].visibilityState).toBe("blocked");
    expect(result.shadowSuggestions[0].visibilityState).toBe("silent_shadow");
  });

  it("invalidates stale bundle assumptions and forces a rebuild when duplicate truth reverses", async () => {
    const application = createReviewBundleAssemblerApplication();
    const initial = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);

    await application.simulation.applyDuplicateReversal(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);
    const rebuilt = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);

    expect(rebuilt.bundle.reviewBundleId).not.toBe(initial.bundle.reviewBundleId);
    expect(rebuilt.bundle.provenance.evidenceSnapshotRef).toBe(
      "evidence_snapshot_235_duplicate_reversal",
    );
    expect(rebuilt.deltaPacket.deltaClass).toBe("decisive");
    expect(rebuilt.deltaPacket.actionInvalidations.map((entry) => entry.invalidationType)).toEqual(
      expect.arrayContaining(["duplicate_lineage_supersession"]),
    );
    expect(rebuilt.bundle.duplicateClusterStatus.decisionClass).toBe("separate_request");
    expect(rebuilt.visibleSuggestions[0].visibilityState).toBe("observe_only");
  });

  it("invalidates preview-coupled suggestion output when DecisionEpoch supersession appears", async () => {
    const application = createReviewBundleAssemblerApplication();
    await application.simulation.applyDecisionEpochSupersession(
      PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID,
    );

    const result = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);

    expect(result.bundle.publicationState).toBe("stale_recoverable");
    expect(result.bundle.provenance.decisionSupersessionRef).toBe(
      "decision_supersession_record_235_primary",
    );
    expect(result.deltaPacket.actionInvalidations.map((entry) => entry.invalidationType)).toEqual(
      expect.arrayContaining(["decision_epoch_supersession", "endpoint_assumption_drift"]),
    );
    expect(result.visibleSuggestions[0].invalidatedAt).toBe("2026-04-16T12:00:00.000Z");
    expect(result.visibleSuggestions[0].visibilityState).toBe("observe_only");
  });

  it("keeps transcript and large-attachment handling bounded without breaking determinism", async () => {
    const application = createReviewBundleAssemblerApplication();
    await application.simulation.applyTranscriptAbsentLargeAttachment(
      PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID,
    );

    const result = await application.queryTaskReviewBundle(PHASE3_REVIEW_BUNDLE_FIXTURE_TASK_ID);
    const firstAttachment = result.bundle.attachments[0];

    expect(result.bundle.transcript.transcriptState).toBe("missing");
    expect(result.bundle.transcript.placeholderState).toBe("missing");
    expect(firstAttachment.previewState).toBe("preview_unavailable");
    expect(firstAttachment.byteLength).toBeGreaterThan(5_000_000);
    expect(result.deltaPacket.changedFieldRefs).toContain("attachment_preview_state");
  });

  it("keeps the published 235 scenario pack coherent", async () => {
    const application = createReviewBundleAssemblerApplication();
    const scenarios = await application.simulation.runAllScenarios();

    expect(reviewBundleScenarioIds).toEqual([
      "verified_bundle_with_transcript",
      "stale_parity_suppresses_authoritative_summary",
      "duplicate_reversal_requires_rebuild",
      "decision_epoch_supersession_invalidates_preview_bundle",
      "transcript_absent_and_large_attachments_degrade_safely",
    ]);
    expect(scenarios).toHaveLength(5);
    expect(
      scenarios.find((entry) => entry.scenarioId === "duplicate_reversal_requires_rebuild")
        ?.deltaClass,
    ).toBe("decisive");
  });
});
