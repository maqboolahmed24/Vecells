import { describe, expect, it } from "vitest";
import {
  createDefaultPhase7EnvironmentTelemetryApplication,
  IntegrationDemoDatasetStore,
  NHSAppEnvironmentProfileRegistry,
  type NHSAppEnvironmentProfile,
} from "../../services/command-api/src/phase7-environment-telemetry-service.ts";
import {
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

function routeEntryPayload() {
  return {
    environment: "sandpit",
    journeyPathId: "jp_pharmacy_status",
    routeFamilyRef: "pharmacy_status",
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    channelSessionHash: "sha256:channel-session-384",
    occurredAt: "2026-04-27T01:20:15.000Z",
    cohortRef: "cohort:phase7-internal-sandpit-only",
    platform: "ios",
    entryMode: "jump_off",
  };
}

describe("384 environment profiles and demo datasets", () => {
  it("validates Sandpit, AOS, and live profiles against the same release tuple", () => {
    const application = createDefaultPhase7EnvironmentTelemetryApplication();

    const parity = application.validateEnvironmentParity();

    expect(parity.parityState).toBe("matching");
    expect(parity.failureReasons).toEqual([]);
    expect(parity.environments).toEqual(["sandpit", "aos", "full_release"]);
    for (const result of parity.profileResults) {
      expect(result.profile?.manifestVersionRef).toBe(PHASE7_MANIFEST_VERSION);
      expect(result.profile?.configFingerprint).toBe(PHASE7_CONFIG_FINGERPRINT);
      expect(result.routeReadiness[0]?.verdict).toBe("ready");
    }
  });

  it("detects environment profile tuple drift", () => {
    const base = createDefaultPhase7EnvironmentTelemetryApplication();
    const profile = base.getEnvironmentProfile("sandpit");
    expect(profile).not.toBeNull();
    const drifted: NHSAppEnvironmentProfile = {
      ...profile!,
      configFingerprint: "sha256:384-drifted-profile",
      watchTupleHash: "sha256:384-drifted-watch-tuple",
    };
    const application = createDefaultPhase7EnvironmentTelemetryApplication({
      profileRegistry: new NHSAppEnvironmentProfileRegistry([drifted]),
    });

    const result = application.validateEnvironmentProfile({ environment: "sandpit" });

    expect(result.parityState).toBe("drift");
    expect(result.failureReasons).toContain("manifest_tuple_drift");
  });

  it("resets demo datasets deterministically while preserving required journey coverage", () => {
    const store = new IntegrationDemoDatasetStore();
    const before = store.get("aos");
    expect(before).not.toBeNull();

    const reset = store.reset({
      environment: "aos",
      now: "2026-04-27T02:00:00.000Z",
    });

    expect(reset.beforeHash).toBe(before?.datasetHash);
    expect(reset.afterHash).toBe(before?.datasetHash);
    expect(reset.dataset.resetOrdinal).toBe((before?.resetOrdinal ?? 0) + 1);
    expect(reset.integrity.integrityState).toBe("valid");
    expect(reset.integrity.missingJourneyKinds).toEqual([]);
  });

  it("accepts privacy-minimized telemetry and quarantines raw tokens and identifiers", () => {
    const application = createDefaultPhase7EnvironmentTelemetryApplication();

    const accepted = application.validateTelemetryEvent({
      eventName: "nhs_app_route_entry",
      environment: "sandpit",
      payload: routeEntryPayload(),
    });
    const rawJwt = application.validateTelemetryEvent({
      eventName: "nhs_app_sso_result",
      environment: "sandpit",
      payload: {
        environment: "sandpit",
        journeyPathId: "jp_pharmacy_status",
        manifestVersionRef: PHASE7_MANIFEST_VERSION,
        releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
        channelSessionHash: "sha256:channel-session-384",
        result: "failed",
        occurredAt: "2026-04-27T01:20:15.000Z",
        assertedLoginIdentity: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50In0.signaturePartForTest",
      },
    });
    const patientId = application.validateTelemetryEvent({
      eventName: "nhs_app_route_entry",
      environment: "sandpit",
      payload: {
        ...routeEntryPayload(),
        subjectRef: "Subject:patient-384",
      },
    });

    expect(accepted.validationState).toBe("accepted");
    expect(rawJwt.validationState).toBe("quarantined");
    expect(rawJwt.failureReasons).toEqual(
      expect.arrayContaining(["prohibited_field_present", "raw_jwt_detected"]),
    );
    expect(patientId.failureReasons).toEqual(
      expect.arrayContaining(["prohibited_field_present", "patient_identifier_detected"]),
    );
  });
});
