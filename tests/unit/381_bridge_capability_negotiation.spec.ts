import { describe, expect, it } from "vitest";
import {
  buildNavigationContract,
  BridgeActionLeaseManager,
  createFakeNhsAppApi,
  createLiveEligibility,
  createNhsAppBridgeRuntime,
  createOutboundNavigationGrant,
  negotiateBridgeCapabilityMatrix,
  validateNavigationContract,
  visibleCapabilitiesFor,
} from "../../packages/nhs-app-bridge-runtime/src/index.ts";

const MANIFEST = "nhsapp-manifest-v0.1.0-freeze-374";

function contract() {
  return buildNavigationContract({
    routeId: "jp_manage_local_appointment",
    manifestVersionRef: MANIFEST,
    patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:381-test",
    routeFreezeDispositionRef: "RouteFreezeDisposition:381-test",
    continuityEvidenceRef: "ContinuityEvidence:381-test",
  });
}

function eligibility() {
  return createLiveEligibility({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: MANIFEST,
  });
}

describe("381 bridge capability negotiation", () => {
  it("negotiates runtime-verified capabilities and preserves script query hints", () => {
    const navigationContract = contract();
    const embeddedEligibility = eligibility();
    const matrix = negotiateBridgeCapabilityMatrix({
      api: createFakeNhsAppApi({ platform: "ios" }),
      navigationContract,
      eligibility: embeddedEligibility,
      manifestVersionRef: MANIFEST,
      contextFenceRef: "ChannelContext:381",
      scriptVersionHint: "v=2025-10-21",
    });
    const capabilities = visibleCapabilitiesFor(matrix, navigationContract, embeddedEligibility);

    expect(validateNavigationContract(navigationContract).valid).toBe(true);
    expect(matrix.capabilityState).toBe("verified");
    expect(matrix.scriptUrl).toContain("?v=2025-10-21");
    expect(capabilities.visible).toContain("setBackAction");
    expect(capabilities.visible).toContain("openOverlay");
    expect(capabilities.visible).toContain("addToCalendar");
  });

  it("does not infer bridge capabilities from browser or user-agent hints", () => {
    const navigationContract = contract();
    const embeddedEligibility = eligibility();
    const matrix = negotiateBridgeCapabilityMatrix({
      api: null,
      navigationContract,
      eligibility: embeddedEligibility,
      manifestVersionRef: MANIFEST,
      contextFenceRef: "ChannelContext:381-browser",
    });
    const capabilities = visibleCapabilitiesFor(matrix, navigationContract, embeddedEligibility);

    expect(matrix.capabilityState).toBe("unavailable");
    expect(capabilities.visible).toEqual(["isEmbedded"]);
    expect(capabilities.hidden.map((diagnostic) => diagnostic.code)).toContain(
      "capability_unavailable",
    );
  });

  it("blocks stale matrices before bridge-backed actions execute", () => {
    const navigationContract = contract();
    const embeddedEligibility = eligibility();
    const matrix = negotiateBridgeCapabilityMatrix({
      api: createFakeNhsAppApi({ platform: "android" }),
      navigationContract,
      eligibility: embeddedEligibility,
      manifestVersionRef: MANIFEST,
      contextFenceRef: "ChannelContext:381-stale",
      checkedAt: "2026-04-27T00:20:00.000Z",
      routeObservedAt: "2026-04-27T00:21:00.000Z",
    });
    const bridge = createNhsAppBridgeRuntime({
      api: createFakeNhsAppApi({ platform: "android" }),
      channelContextRef: "ChannelContext:381-stale",
      patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:381",
      navigationContract,
      eligibility: embeddedEligibility,
      matrix,
    });

    expect(matrix.capabilityState).toBe("stale");
    expect(bridge.setBackAction(() => undefined).ok).toBe(false);
    expect(bridge.snapshot().bridgeState).toBe("degraded");
  });

  it("clears back-action leases on route exit and fence drift", () => {
    const navigationContract = contract();
    const embeddedEligibility = eligibility();
    const fakeApi = createFakeNhsAppApi({ platform: "ios" });
    const leaseManager = new BridgeActionLeaseManager();
    const bridge = createNhsAppBridgeRuntime({
      api: fakeApi,
      channelContextRef: "ChannelContext:381-lease",
      patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:381",
      navigationContract,
      eligibility: embeddedEligibility,
      leaseManager,
    });

    expect(bridge.setBackAction(() => undefined).ok).toBe(true);
    expect(bridge.snapshot().activeLeases).toHaveLength(1);
    expect(
      bridge.clearForFenceDrift({ sessionEpochRef: "SessionEpoch:drifted" })[0]?.leaseState,
    ).toBe("stale");
    expect(fakeApi.calls.map((call) => call.action)).toContain("clearBackAction");

    bridge.setBackAction(() => undefined);
    expect(bridge.clearForRouteExit()).toHaveLength(1);
    expect(bridge.snapshot().activeLeases).toHaveLength(0);
  });

  it("requires scrubbed allowlisted outbound navigation grants", () => {
    const navigationContract = contract();
    const embeddedEligibility = eligibility();
    const bridge = createNhsAppBridgeRuntime({
      api: createFakeNhsAppApi({ platform: "ios" }),
      channelContextRef: "ChannelContext:381-grant",
      patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:381",
      navigationContract,
      eligibility: embeddedEligibility,
      selectedAnchorRef: "SelectedAnchor:appointment-381",
    });
    const grant = createOutboundNavigationGrant({
      routeFamilyRef: "appointment_manage",
      destinationClass: "browser_overlay",
      scrubbedUrlRef: "https://www.nhs.uk/conditions/",
      allowedHostRef: "www.nhs.uk",
      allowedPathPattern: "/conditions/*",
      selectedAnchorRef: "SelectedAnchor:appointment-381",
      bridgeCapabilityMatrixRef: bridge.matrix.matrixId,
      patientEmbeddedNavEligibilityRef: embeddedEligibility.embeddedNavEligibilityId,
      manifestVersionRef: MANIFEST,
    });

    expect(bridge.openOverlay("https://www.nhs.uk/conditions/", grant).ok).toBe(true);
    expect(
      bridge.openOverlay("https://www.nhs.uk/conditions/?token=raw", {
        ...grant,
        scrubbedUrlRef: "https://www.nhs.uk/conditions/?token=raw",
      }).blockedReason,
    ).toBe("destination_not_scrubbed");
    expect(
      bridge.openOverlay("https://malicious.invalid/conditions/", {
        ...grant,
        scrubbedUrlRef: "https://malicious.invalid/conditions/",
        allowedHostRef: "malicious.invalid",
      }).blockedReason,
    ).toBe("destination_not_allowlisted");
  });
});
