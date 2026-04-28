import { describe, expect, it } from "vitest";
import {
  createDefaultPhase7ExternalEntryApplication,
  type ExternalEntrySessionSnapshot,
} from "../../services/command-api/src/phase7-external-entry-service.ts";

function activeSession(
  input?: Partial<ExternalEntrySessionSnapshot>,
): ExternalEntrySessionSnapshot {
  return {
    sessionRef: input?.sessionRef ?? "Session:380",
    subjectRef: input?.subjectRef ?? "Subject:patient-380",
    sessionEpochRef: input?.sessionEpochRef ?? "SessionEpoch:380",
    subjectBindingVersionRef:
      input?.subjectBindingVersionRef ?? "SubjectBindingVersion:patient-380:v1",
    assuranceLevel: input?.assuranceLevel ?? "nhs_p9",
    sessionState: input?.sessionState ?? "active",
    embeddedSessionRef: input?.embeddedSessionRef ?? "EmbeddedSession:380",
  };
}

async function issueStatusGrant() {
  const application = createDefaultPhase7ExternalEntryApplication();
  const session = activeSession();
  const issuance = await application.issueExternalEntryGrant({
    environment: "sandpit",
    entryMode: "nhs_app_site_link",
    journeyPathId: "jp_pharmacy_status",
    incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp",
    governingObjectRef: "Request:REQ-380",
    governingObjectVersionRef: "RequestVersion:REQ-380:v1",
    sessionEpochRef: session.sessionEpochRef,
    subjectBindingVersionRef: session.subjectBindingVersionRef,
    lineageFenceRef: "LineageFence:REQ-380",
    subjectRef: session.subjectRef,
    issueIdempotencyKey: `issue-380-status-${Math.random()}`,
    opaqueToken: `external-entry-token-380-status-${Math.random()}`,
  });
  return { application, session, issuance };
}

describe("380 external entry resolution and recovery", () => {
  it("resolves a first-use NHS App site link to full route continuity", async () => {
    const { application, session, issuance } = await issueStatusGrant();

    const result = await application.resolveExternalEntry({
      environment: "sandpit",
      entryMode: "nhs_app_site_link",
      journeyPathId: "jp_pharmacy_status",
      incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp",
      presentedToken: issuance.materializedToken,
      governingObjectRef: "Request:REQ-380",
      governingObjectVersionRef: "RequestVersion:REQ-380:v1",
      lineageFenceRef: "LineageFence:REQ-380",
      currentSession: session,
      redemptionIdempotencyKey: "redeem-380-site-link-success",
    });

    expect(result.outcome).toBe("resolved_full");
    expect(result.grantFenceState).toBe("accepted");
    expect(result.subjectBindingFenceState).toBe("matched");
    expect(result.routeInstruction.includePhi).toBe(true);
    expect(result.routeInstruction.targetRoute).toBe(
      "/requests/REQ-380/pharmacy/status?from=nhsApp",
    );
    expect(result.audit.rawTokenPersisted).toBe(false);
    expect(result.audit.reasonCodes).toContain(
      "PHASE7_380_EXTERNAL_ENTRY_REDEEMED_THROUGH_ACCESS_GRANT_SERVICE",
    );
  });

  it("rejects token replay into bounded recovery without PHI", async () => {
    const { application, session, issuance } = await issueStatusGrant();
    const commonInput = {
      environment: "sandpit" as const,
      entryMode: "nhs_app_site_link" as const,
      journeyPathId: "jp_pharmacy_status",
      incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp",
      presentedToken: issuance.materializedToken,
      governingObjectRef: "Request:REQ-380",
      governingObjectVersionRef: "RequestVersion:REQ-380:v1",
      lineageFenceRef: "LineageFence:REQ-380",
      currentSession: session,
    };

    await application.resolveExternalEntry({
      ...commonInput,
      redemptionIdempotencyKey: "redeem-380-replay-first",
    });
    const replay = await application.resolveExternalEntry({
      ...commonInput,
      redemptionIdempotencyKey: "redeem-380-replay-second",
    });

    expect(replay.grantFenceState).toBe("replayed");
    expect(replay.outcome).toBe("bounded_recovery");
    expect(replay.routeInstruction.includePhi).toBe(false);
    expect(replay.sessionRecoveryDecision).toBe("recover_only");
  });

  it("denies full detail when the current subject differs from the issued grant subject", async () => {
    const { application, session, issuance } = await issueStatusGrant();

    const result = await application.resolveExternalEntry({
      environment: "sandpit",
      entryMode: "nhs_app_site_link",
      journeyPathId: "jp_pharmacy_status",
      incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp",
      presentedToken: issuance.materializedToken,
      governingObjectRef: "Request:REQ-380",
      governingObjectVersionRef: "RequestVersion:REQ-380:v1",
      lineageFenceRef: "LineageFence:REQ-380",
      currentSession: activeSession({
        subjectRef: "Subject:other-patient",
        sessionEpochRef: session.sessionEpochRef,
        subjectBindingVersionRef: session.subjectBindingVersionRef,
      }),
      redemptionIdempotencyKey: "redeem-380-subject-mismatch",
    });

    expect(result.grantFenceState).toBe("accepted");
    expect(result.subjectBindingFenceState).toBe("subject_mismatch");
    expect(result.outcome).toBe("denied");
    expect(result.routeInstruction.includePhi).toBe(false);
  });

  it("routes manifest or tuple drift into bounded recovery", async () => {
    const { application, session, issuance } = await issueStatusGrant();

    const result = await application.resolveExternalEntry({
      environment: "sandpit",
      entryMode: "nhs_app_site_link",
      journeyPathId: "jp_pharmacy_status",
      incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp",
      presentedToken: issuance.materializedToken,
      governingObjectRef: "Request:REQ-380",
      governingObjectVersionRef: "RequestVersion:REQ-380:v1",
      expectedManifestVersionRef: "nhsapp-manifest-v0.1.0-drifted",
      lineageFenceRef: "LineageFence:REQ-380",
      currentSession: session,
      redemptionIdempotencyKey: "redeem-380-manifest-drift",
    });

    expect(result.grantFenceState).toBe("drifted");
    expect(result.outcome).toBe("bounded_recovery");
    expect(result.routeInstruction.includePhi).toBe(false);
    expect(result.audit.reasonCodes).toContain("PHASE7_380_GRANT_FENCE_BLOCKED_FULL_DETAIL");
  });

  it("prevents promoted draft links reopening mutable draft state", async () => {
    const application = createDefaultPhase7ExternalEntryApplication();
    const session = activeSession();
    const issuance = await application.issueExternalEntryGrant({
      environment: "sandpit",
      entryMode: "continuation_link",
      journeyPathId: "jp_continue_draft",
      incomingPath: "/requests/drafts/DRAFT-380?token=raw-token",
      governingObjectRef: "Draft:DRAFT-380",
      governingObjectVersionRef: "DraftVersion:DRAFT-380:v1",
      sessionEpochRef: session.sessionEpochRef,
      subjectBindingVersionRef: session.subjectBindingVersionRef,
      lineageFenceRef: "LineageFence:DRAFT-380",
      subjectRef: session.subjectRef,
      issueIdempotencyKey: "issue-380-promoted-draft",
      opaqueToken: "external-entry-token-380-promoted-draft",
    });

    const result = await application.resolveExternalEntry({
      environment: "sandpit",
      entryMode: "continuation_link",
      journeyPathId: "jp_continue_draft",
      incomingPath: "/requests/drafts/DRAFT-380?token=raw-token",
      presentedToken: issuance.materializedToken,
      governingObjectRef: "Draft:DRAFT-380",
      governingObjectVersionRef: "DraftVersion:DRAFT-380:v1",
      lineageFenceRef: "LineageFence:DRAFT-380",
      currentSession: session,
      draftResume: {
        draftRef: "Draft:DRAFT-380",
        expectedSubmissionIngressRecordRef: "SubmissionIngressRecord:380",
        currentSubmissionIngressRecordRef: "SubmissionIngressRecord:380",
        submissionEnvelopeRef: "SubmissionEnvelope:DRAFT-380",
        submissionPromotionRecordRef: "SubmissionPromotionRecord:REQ-380",
        promotedRequestShellRef: "REQ-380",
      },
      redemptionIdempotencyKey: "redeem-380-promoted-draft",
    });

    expect(result.draftResumeFenceState).toBe("draft_promoted_request_shell_only");
    expect(result.outcome).toBe("bounded_recovery");
    expect(result.routeInstruction.targetRoute).toBe("/requests/REQ-380/status");
    expect(result.routeInstruction.includePhi).toBe(false);
  });
});
