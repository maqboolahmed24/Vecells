import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  createDefaultPhase7EnvironmentTelemetryApplication,
  phase7EnvironmentTelemetryRoutes,
} from "../../services/command-api/src/phase7-environment-telemetry-service.ts";
import {
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

describe("384 channel telemetry and SCAL bundle", () => {
  it("registers environment, telemetry, demo, and SCAL routes in command API", () => {
    for (const route of phase7EnvironmentTelemetryRoutes) {
      expect(serviceDefinition.routeCatalog.some((entry) => entry.routeId === route.routeId)).toBe(
        true,
      );
    }
  });

  it("builds a telemetry plan whose event refs are backed by contracts", () => {
    const application = createDefaultPhase7EnvironmentTelemetryApplication();

    const plan = application.buildTelemetryPlan({ environment: "aos" });
    const evidence = application.listEvidence();
    const contractRefs = new Set(
      evidence.telemetryEventContracts.map((contract) => contract.contractId),
    );

    expect(plan.trackedJourneys).toEqual(["jp_pharmacy_status"]);
    expect(plan.eventContractRefs.length).toBeGreaterThanOrEqual(6);
    expect(plan.eventContractRefs.every((ref) => contractRefs.has(ref))).toBe(true);
    expect(plan.monthlyPackMappings.nhs_app_route_entry).toContain("journey_path_id");
  });

  it("assembles AOS SCAL evidence from environment, telemetry, demo, and readiness truth", () => {
    const application = createDefaultPhase7EnvironmentTelemetryApplication();

    const bundle = application.assembleSCALBundle({
      environment: "aos",
      owner: "phase7-test-owner",
    });

    expect(bundle.submissionState).toBe("ready_for_submission");
    expect(bundle.failureReasons).toEqual([]);
    expect(bundle.environmentProfileRef).toBe("NHSAppEnvironmentProfile:384:aos");
    expect(bundle.telemetryPlanRef).toBe("ChannelTelemetryPlan:384:aos");
    expect(bundle.demoDatasetRef).toBe("IntegrationDemoDataset:384:aos:v1");
    expect(bundle.routeReadinessRefs[0]).toContain("RouteReadiness:383:jp_pharmacy_status");
    expect(bundle.accessibilityEvidenceRefs).toContain(
      "AuditEvidence:383:accessibility:pharmacy-status:current",
    );
    expect(bundle.privacyEvidenceRefs).toContain("Privacy:GDPR-PECR-phase7-telemetry-minimization");
  });

  it("keeps Sandpit SCAL evidence in draft while preserving the same tuple", () => {
    const application = createDefaultPhase7EnvironmentTelemetryApplication();

    const bundle = application.assembleSCALBundle({ environment: "sandpit" });

    expect(bundle.submissionState).toBe("draft");
    expect(bundle.manifestVersionRef).toBe(PHASE7_MANIFEST_VERSION);
    expect(bundle.releaseApprovalFreezeRef).toBe(PHASE7_RELEASE_APPROVAL_FREEZE_REF);
    expect(bundle.failureReasons).toEqual([]);
  });

  it("quarantines PHI-bearing query strings and release tuple drift in telemetry", () => {
    const application = createDefaultPhase7EnvironmentTelemetryApplication();

    const result = application.validateTelemetryEvent({
      eventName: "nhs_app_route_entry",
      environment: "sandpit",
      expectedManifestVersion: "nhsapp-manifest-v0.1.0-drift",
      payload: {
        environment: "sandpit",
        journeyPathId: "jp_pharmacy_status",
        routeFamilyRef: "pharmacy_status",
        manifestVersionRef: PHASE7_MANIFEST_VERSION,
        releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
        channelSessionHash: "sha256:channel-session-384",
        occurredAt: "2026-04-27T01:20:15.000Z",
        queryString: "?assertedLoginIdentity=eyJhbGciOiJIUzI1NiJ9.payload.signature",
      },
    });

    expect(result.validationState).toBe("quarantined");
    expect(result.failureReasons).toEqual(
      expect.arrayContaining([
        "release_tuple_drift",
        "prohibited_field_present",
        "phi_query_string_detected",
      ]),
    );
  });
});
