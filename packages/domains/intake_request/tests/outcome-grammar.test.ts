import { describe, expect, it } from "vitest";
import {
  createPhase1OutcomeGrammarService,
  createPhase1OutcomeGrammarStore,
} from "../src/index.ts";

function buildSettlementInput(overrides = {}) {
  return {
    intakeSubmitSettlementRef: "phase1_submit_settlement_151_001",
    draftPublicId: "draft_151_001",
    requestRef: "request_151_001",
    requestLineageRef: "request_lineage_151_001",
    requestPublicId: "req_151_001",
    submissionPromotionRecordRef: "promotion_record_151_001",
    normalizedSubmissionRef: "normalized_submission_151_001",
    receiptConsistencyKey: "receipt_key_151_001",
    statusConsistencyKey: "status_key_151_001",
    result: "triage_ready" as const,
    appliesToState: "screen_clear" as const,
    routeFamilyRef: "rf_intake_self_service",
    routeIntentBindingRef: "RIB_151_PATIENT_ENTRY_V1",
    audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_PUBLIC_ENTRY_V1",
    surfacePublicationRef: "ASPR_050_PATIENT_PUBLIC_ENTRY_V1",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    releasePublicationParityRef: "rpp::local::authoritative",
    continuityKey: "patient.portal.requests",
    selectedAnchorRef: "request-proof",
    returnTargetRef: "/requests/req_151_001",
    recordedAt: "2026-04-14T23:45:00Z",
    ...overrides,
  };
}

describe("phase 1 outcome grammar service", () => {
  it("creates one routine receipt tuple with a monotone consistency envelope and exact replay", async () => {
    const repositories = createPhase1OutcomeGrammarStore();
    const service = createPhase1OutcomeGrammarService(repositories);

    const first = await service.settleOutcome(buildSettlementInput());
    const replay = await service.settleOutcome(buildSettlementInput());

    expect(first.replayed).toBe(false);
    expect(first.artifact.copyVariantRef).toBe("COPYVAR_142_SAFE_CLEAR_V1");
    expect(first.receiptEnvelope?.receiptBucket).toBe("after_2_working_days");
    expect(first.receiptEnvelope?.promiseState).toBe("on_track");
    expect(first.outboundNavigationGrant).toBeNull();
    expect(replay.replayed).toBe(true);
    expect(replay.tuple.phase1OutcomeTupleId).toBe(first.tuple.phase1OutcomeTupleId);
    expect(replay.receiptEnvelope?.consistencyEnvelopeId).toBe(
      first.receiptEnvelope?.consistencyEnvelopeId,
    );
  });

  it("creates an urgent outcome artifact with a governed navigation grant and no routine receipt", async () => {
    const service = createPhase1OutcomeGrammarService(createPhase1OutcomeGrammarStore());

    const urgent = await service.settleOutcome(
      buildSettlementInput({
        intakeSubmitSettlementRef: "phase1_submit_settlement_151_urgent",
        result: "urgent_diversion" as const,
        appliesToState: "urgent_diverted" as const,
        urgentDiversionSettlementRef: "urgent_diversion_settlement_151_001",
        receiptConsistencyKey: null,
        statusConsistencyKey: null,
      }),
    );

    expect(urgent.artifact.copyVariantRef).toBe("COPYVAR_142_URGENT_ISSUED_V1");
    expect(urgent.artifact.artifactState).toBe("external_handoff_ready");
    expect(urgent.receiptEnvelope).toBeNull();
    expect(urgent.outboundNavigationGrant?.destinationType).toBe("external_browser");
    expect(urgent.tuple.urgentDiversionSettlementRef).toBe(
      "urgent_diversion_settlement_151_001",
    );
  });

  it("honours the authoritative receipt override for triage-ready routine settlements", async () => {
    const service = createPhase1OutcomeGrammarService(createPhase1OutcomeGrammarStore());

    const routine = await service.settleOutcome(
      buildSettlementInput({
        intakeSubmitSettlementRef: "phase1_submit_settlement_151_override",
        receiptEnvelopeOverride: {
          receiptBucket: "next_working_day" as const,
          etaPromiseRef: "ETA_152_CONSERVATIVE_QUEUE_BUCKET_V1",
          etaLowerBoundAt: "2026-04-15T08:30:00Z",
          etaMedianAt: "2026-04-15T12:00:00Z",
          etaUpperBoundAt: "2026-04-15T16:30:00Z",
          bucketConfidence: 0.81,
          promiseState: "improved" as const,
          calibrationVersionRef: "ETA_152_BUCKET_CALIBRATOR_V1",
          statusProjectionVersionRef: "status_projection_152_001",
          causalToken: "triage_eta_forecast_152_001",
          monotoneRevision: 3,
        },
      }),
    );

    expect(routine.receiptEnvelope?.receiptBucket).toBe("next_working_day");
    expect(routine.receiptEnvelope?.promiseState).toBe("improved");
    expect(routine.receiptEnvelope?.etaPromiseRef).toBe(
      "ETA_152_CONSERVATIVE_QUEUE_BUCKET_V1",
    );
    expect(routine.receiptEnvelope?.monotoneRevision).toBe(3);
    expect(routine.receiptEnvelope?.statusProjectionVersionRef).toBe(
      "status_projection_152_001",
    );
  });

  it("keeps failed-safe recovery grammatically distinct from routine receipt", async () => {
    const service = createPhase1OutcomeGrammarService(createPhase1OutcomeGrammarStore());

    const failedSafe = await service.settleOutcome(
      buildSettlementInput({
        intakeSubmitSettlementRef: "phase1_submit_settlement_151_failed",
        requestRef: null,
        requestLineageRef: null,
        requestPublicId: null,
        submissionPromotionRecordRef: null,
        normalizedSubmissionRef: null,
        result: "failed_safe" as const,
        appliesToState: "processing_failed" as const,
        returnTargetRef: "/intake/drafts/draft_151_001/recover",
      }),
    );

    expect(failedSafe.artifact.copyVariantRef).toBe("COPYVAR_142_FAILED_SAFE_V1");
    expect(failedSafe.artifact.artifactState).toBe("summary_only");
    expect(failedSafe.receiptEnvelope?.promiseState).toBe("recovery_required");
    expect(failedSafe.tuple.continuityPosture).toBe("recovery_same_shell");
  });

  it("rejects urgent_diverted grammar without a durable urgent settlement reference", async () => {
    const service = createPhase1OutcomeGrammarService(createPhase1OutcomeGrammarStore());

    await expect(
      service.settleOutcome(
        buildSettlementInput({
          intakeSubmitSettlementRef: "phase1_submit_settlement_151_urgent_missing",
          result: "urgent_diversion" as const,
          appliesToState: "urgent_diverted" as const,
          urgentDiversionSettlementRef: null,
          receiptConsistencyKey: null,
          statusConsistencyKey: null,
        }),
      ),
    ).rejects.toMatchObject({
      code: "URGENT_DIVERTED_REQUIRES_ISSUED_SETTLEMENT",
    });
  });
});
