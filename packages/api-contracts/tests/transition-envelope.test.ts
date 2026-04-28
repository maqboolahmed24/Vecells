import { describe, expect, it } from "vitest";
import { buildTransitionEnvelope } from "../src/transition-envelope";

describe("transition envelope library", () => {
  it("keeps projection-visible settlement pending until authoritative settlement lands", () => {
    const envelope = buildTransitionEnvelope({
      settlement: {
        settlementId: "settlement_projection_pending",
        actionRecordRef: "action_projection_pending",
        processingAcceptanceState: "accepted_for_processing",
        externalObservationState: "projection_visible",
        authoritativeOutcomeState: "projection_pending",
        authoritativeProofClass: "not_yet_authoritative",
        settlementRevision: 1,
        sameShellRecoveryRef: null,
        quietEligibleAt: null,
        staleAfterAt: "2026-04-12T12:10:00Z",
        projectionVisibilityRef: "projection://projection_pending",
        auditRecordRef: null,
        lastSafeAnchorRef: "anchor_projection_pending",
        allowedSummaryTier: null,
        recordedAt: "2026-04-12T12:05:00Z",
        result: "projection_pending",
      },
      entityRef: "task_projection_pending",
      affectedAnchorRef: "anchor_projection_pending",
      originState: "task_claim",
      targetIntent: "hold_shell",
      localAckState: "optimistic_applied",
      causalToken: "cause_projection_pending",
      settlementPolicy: "projection_token",
      visibleScope: "active_card",
      startedAt: "2026-04-12T12:04:50Z",
    });

    expect(envelope.externalObservationState).toBe("projection_visible");
    expect(envelope.authoritativeOutcomeState).toBe("pending");
    expect(envelope.userVisibleMessage).toContain("awaiting authoritative settlement");
  });

  it("rejects calm success before authoritative proof and quiet timing exist", () => {
    expect(() =>
      buildTransitionEnvelope({
        settlement: {
          settlementId: "settlement_invalid_calm",
          actionRecordRef: "action_invalid_calm",
          processingAcceptanceState: "externally_accepted",
          externalObservationState: "external_effect_observed",
          authoritativeOutcomeState: "settled",
          authoritativeProofClass: "not_yet_authoritative",
          settlementRevision: 2,
          sameShellRecoveryRef: null,
          quietEligibleAt: null,
          staleAfterAt: null,
          projectionVisibilityRef: null,
          auditRecordRef: null,
          lastSafeAnchorRef: "anchor_invalid_calm",
          allowedSummaryTier: null,
          recordedAt: "2026-04-12T12:06:00Z",
          result: "applied",
        },
        entityRef: "task_invalid_calm",
        affectedAnchorRef: "anchor_invalid_calm",
        originState: "task_claim",
        targetIntent: "quiet_return",
        localAckState: "local_ack",
        causalToken: "cause_invalid_calm",
        settlementPolicy: "external_ack",
        visibleScope: "active_shell",
        startedAt: "2026-04-12T12:05:50Z",
      }),
    ).toThrow(/authoritative proof|quietEligibleAt|auditRecordRef/i);
  });

  it("preserves same-shell recovery context for recoverable results", () => {
    const envelope = buildTransitionEnvelope({
      settlement: {
        settlementId: "settlement_recovery",
        actionRecordRef: "action_recovery",
        processingAcceptanceState: "not_started",
        externalObservationState: "recovery_observed",
        authoritativeOutcomeState: "recovery_required",
        authoritativeProofClass: "recovery_disposition",
        settlementRevision: 1,
        sameShellRecoveryRef: "/recover/task_recovery",
        quietEligibleAt: null,
        staleAfterAt: "2026-04-12T12:11:00Z",
        projectionVisibilityRef: null,
        auditRecordRef: "audit://recovery",
        lastSafeAnchorRef: "anchor_recovery",
        allowedSummaryTier: "summary_only",
        recordedAt: "2026-04-12T12:07:00Z",
        result: "blocked_policy",
      },
      entityRef: "task_recovery",
      affectedAnchorRef: "anchor_recovery",
      originState: "task_claim",
      targetIntent: "recover_in_place",
      localAckState: "queued",
      causalToken: "cause_recovery",
      settlementPolicy: "manual_review",
      visibleScope: "active_shell",
      startedAt: "2026-04-12T12:06:50Z",
    });

    expect(envelope.authoritativeOutcomeState).toBe("recovery_required");
    expect(envelope.recoveryActionRef).toBe("/recover/task_recovery");
    expect(envelope.lastSafeAnchorRef).toBe("anchor_recovery");
    expect(envelope.allowedSummaryTier).toBe("summary_only");
  });
});
