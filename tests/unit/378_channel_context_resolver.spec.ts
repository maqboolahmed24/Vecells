import { describe, expect, it } from "vitest";
import {
  createDefaultPhase7EmbeddedContextApplication,
  createTrustedContextEvidence,
  type BridgeCapabilitySnapshot,
  type LocalSessionBinding,
} from "../../services/command-api/src/phase7-embedded-context-service.ts";

function activeSession(): LocalSessionBinding {
  return {
    subjectRef: "subject:test-patient",
    identityBindingRef: "IdentityBinding:test-patient",
    sessionEpochRef: "SessionEpoch:7",
    subjectBindingVersionRef: "SubjectBindingVersion:3",
    sessionState: "active",
    patientShellContinuityKey: "patient-shell-continuity:test-patient",
    entityContinuityKey: "entity-continuity:request-123",
    selectedAnchorRef: "SelectedAnchor:pharmacy-status",
    returnContractRef: "ReturnIntent:request-status",
  };
}

function verifiedBridge(): BridgeCapabilitySnapshot {
  return {
    bridgeCapabilityMatrixRef: "BridgeCapabilityMatrix:nhs-app-js-v2-minimum",
    capabilityState: "verified",
    supportedBridgeActionRefs: [
      "navigation.goToPage",
      "navigation.setBackAction",
      "navigation.clearBackAction",
    ],
    detectedPlatform: "ios",
  };
}

describe("378 channel context resolver", () => {
  it("prefers signed context evidence over user-agent and query hints", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();

    const result = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      userAgent: "Mozilla/5.0 nhsapp-ios/5.0.0",
      query: { from: "nhsApp", assertedLoginIdentity: "raw-nhs-login-jwt" },
      signedContextEvidence: createTrustedContextEvidence({
        journeyPathId: "jp_pharmacy_status",
      }),
      localSession: activeSession(),
      bridgeCapability: verifiedBridge(),
    });

    expect(result.channelContext.trustTier).toBe("trusted_embedded");
    expect(result.channelContext.resolutionDisposition).toBe("embedded_live");
    expect(result.patientEmbeddedNavEligibility.eligibilityState).toBe("live");
    expect(result.shellPolicy.shellPolicyId).toBe("ShellPolicy:embedded-nhs-app-v1");
    expect(result.channelContext.queryEvidence.assertedLoginIdentity).toBe("redacted");
  });

  it("treats from=nhsApp as a non-authoritative styling hint", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();

    const result = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      query: { from: "nhsApp" },
    });

    expect(result.channelContext.trustTier).toBe("hinted_embedded");
    expect(result.channelContext.resolutionDisposition).toBe("embedded_styling_only");
    expect(result.patientEmbeddedNavEligibility.eligibilityState).toBe("placeholder_only");
    expect(result.blockedReasons).toContain("query_hint_not_trusted");
    expect(result.shellPolicy.shellPolicyId).toBe("ShellPolicy:embedded-hint-styling-only-v1");
  });

  it("treats NHS App user-agent detection as evidence only", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();

    const result = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      userAgent: "Mozilla/5.0 nhsapp-android/5.0.0",
    });

    expect(result.channelContext.trustTier).toBe("hinted_embedded");
    expect(result.channelContext.resolutionDisposition).toBe("embedded_revalidate_only");
    expect(result.patientEmbeddedNavEligibility.eligibilityState).toBe("placeholder_only");
    expect(result.blockedReasons).toContain("user_agent_not_trusted");
  });

  it("blocks replayed embedded entry tokens", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();
    const token = application.issueEmbeddedEntryToken({
      entryTokenId: "EmbeddedEntryToken:test-replay",
      journeyPathId: "jp_pharmacy_status",
      issuedAt: "2026-04-27T00:10:15.000Z",
      expiresAt: "2026-04-27T00:15:15.000Z",
      cohortRef: "cohort:phase7-internal-sandpit-only",
      environment: "sandpit",
      patientShellContinuityKey: "patient-shell-continuity:test-patient",
      entityContinuityKey: "entity-continuity:request-123",
    });

    const firstResult = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      embeddedEntryToken: token,
      localSession: activeSession(),
      bridgeCapability: verifiedBridge(),
    });

    const replayResult = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      embeddedEntryToken: token,
      localSession: activeSession(),
      bridgeCapability: verifiedBridge(),
    });

    expect(firstResult.channelContext.trustTier).toBe("trusted_embedded");
    expect(firstResult.patientEmbeddedNavEligibility.eligibilityState).toBe("live");
    expect(replayResult.blockedReasons).toContain("embedded_entry_token_replayed");
    expect(replayResult.channelContext.resolutionDisposition).toBe("blocked");
    expect(replayResult.patientEmbeddedNavEligibility.eligibilityState).toBe("blocked");
  });
});
