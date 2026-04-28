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

describe("378 embedded session projection and safe downgrade", () => {
  it("projects live embedded session state while preserving same-shell continuity keys", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();

    const result = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      signedContextEvidence: createTrustedContextEvidence({
        journeyPathId: "jp_pharmacy_status",
      }),
      localSession: activeSession(),
      bridgeCapability: verifiedBridge(),
    });

    expect(result.patientEmbeddedSessionProjection.eligibilityState).toBe("live");
    expect(result.patientEmbeddedSessionProjection.manifestVersionRef).toMatch(/^nhsapp-manifest-/);
    expect(result.embeddedShellConsistencyProjection.shellState).toBe("live");
    expect(result.embeddedShellConsistencyProjection.patientShellContinuityKey).toBe(
      "patient-shell-continuity:test-patient",
    );
    expect(result.embeddedShellConsistencyProjection.entityContinuityKey).toBe(
      "entity-continuity:request-123",
    );
    expect(result.patientEmbeddedNavEligibility.allowedBridgeActionRefs).toEqual([
      "navigation.goToPage",
      "navigation.setBackAction",
    ]);
  });

  it("downgrades trusted embedded traffic to read-only when bridge capability is unavailable", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();

    const result = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      signedContextEvidence: createTrustedContextEvidence({
        journeyPathId: "jp_pharmacy_status",
      }),
      localSession: activeSession(),
    });

    expect(result.blockedReasons).toContain("bridge_capability_unavailable");
    expect(result.patientEmbeddedSessionProjection.eligibilityState).toBe("read_only");
    expect(result.patientEmbeddedNavEligibility.eligibilityState).toBe("read_only");
    expect(result.embeddedShellConsistencyProjection.shellState).toBe("revalidate_only");
  });

  it("binds hydration to the server context and enters bounded recovery on conflict", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();

    const result = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      signedContextEvidence: createTrustedContextEvidence({
        journeyPathId: "jp_pharmacy_status",
      }),
      localSession: activeSession(),
      bridgeCapability: verifiedBridge(),
      hydrationContext: {
        trustTier: "hinted_embedded",
        resolutionDisposition: "embedded_styling_only",
        channelType: "unknown",
      },
    });

    expect(result.blockedReasons).toContain("hydration_conflict");
    expect(result.channelContext.trustTier).toBe("standalone_or_unknown");
    expect(result.channelContext.resolutionDisposition).toBe("bounded_recovery");
    expect(result.hydrationBinding.rehydrateFromServerOnly).toBe(true);
    expect(result.hydrationBinding.clientMayRecomputeTrust).toBe(false);
    expect(result.embeddedShellConsistencyProjection.causalConsistencyState).toBe("conflict");
  });

  it("downgrades stale manifest tuples to recovery-required instead of live actions", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();

    const result = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      signedContextEvidence: createTrustedContextEvidence({
        journeyPathId: "jp_pharmacy_status",
      }),
      localSession: activeSession(),
      bridgeCapability: verifiedBridge(),
      expectedConfigFingerprint: "sha256:drifted-config",
    });

    expect(result.blockedReasons).toContain("manifest_drift");
    expect(result.manifestBlockedReasons).toContain("config_fingerprint_mismatch");
    expect(result.patientEmbeddedSessionProjection.eligibilityState).toBe("recovery_required");
    expect(result.patientEmbeddedNavEligibility.eligibilityState).toBe("recovery_required");
    expect(result.embeddedShellConsistencyProjection.shellState).toBe("recovery_only");
  });

  it("downgrades frozen embedded routes to read-only", () => {
    const application = createDefaultPhase7EmbeddedContextApplication();

    const result = application.resolve({
      environment: "sandpit",
      journeyPathId: "jp_pharmacy_status",
      routePath: "/requests/123/pharmacy/status",
      signedContextEvidence: createTrustedContextEvidence({
        journeyPathId: "jp_pharmacy_status",
      }),
      localSession: activeSession(),
      bridgeCapability: verifiedBridge(),
      channelReleaseFreezeState: "frozen",
    });

    expect(result.blockedReasons).toContain("route_freeze_active");
    expect(result.patientEmbeddedSessionProjection.eligibilityState).toBe("read_only");
    expect(result.patientEmbeddedNavEligibility.eligibilityState).toBe("read_only");
    expect(result.channelContext.resolutionDisposition).toBe("embedded_revalidate_only");
  });
});
