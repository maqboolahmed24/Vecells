import { describe, expect, it } from "vitest";
import {
  buildNavigationContract,
  createFakeNhsAppApi,
  createLiveEligibility,
  negotiateBridgeCapabilityMatrix,
} from "../../packages/nhs-app-bridge-runtime/src/index.ts";
import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  createDefaultPhase7ArtifactDeliveryApplication,
  phase7ArtifactDeliveryRoutes,
  type PrepareArtifactDeliveryInput,
} from "../../services/command-api/src/phase7-artifact-delivery-service.ts";

const MANIFEST = "nhsapp-manifest-v0.1.0-freeze-374";
const CONTINUITY = "ContinuityEvidence:382-current";

function baseInput(input?: Partial<PrepareArtifactDeliveryInput>): PrepareArtifactDeliveryInput {
  const navigationContract = buildNavigationContract({
    routeId: "jp_manage_local_appointment",
    manifestVersionRef: MANIFEST,
    patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:382-integration",
    routeFreezeDispositionRef: "RouteFreezeDisposition:382-integration",
    continuityEvidenceRef: CONTINUITY,
  });
  const eligibility = createLiveEligibility({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: MANIFEST,
    continuityEvidenceRef: CONTINUITY,
  });
  const matrix = negotiateBridgeCapabilityMatrix({
    api: createFakeNhsAppApi({ platform: "android" }),
    navigationContract,
    eligibility,
    manifestVersionRef: MANIFEST,
    contextFenceRef: "ChannelContext:382-integration",
  });
  return {
    environment: "sandpit",
    artifactId: "artifact:382:appointment-letter",
    subjectRef: "Subject:patient-382",
    journeyPathId: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    selectedAnchorRef: "SelectedAnchor:382-integration",
    returnContractRef: "ReturnContract:382-integration",
    sessionEpochRef: eligibility.sessionEpochRef,
    subjectBindingVersionRef: eligibility.subjectBindingVersionRef,
    continuityEvidenceRef: CONTINUITY,
    bridgeCapabilityMatrix: matrix,
    patientEmbeddedNavEligibility: eligibility,
    ...input,
  };
}

describe("382 artifact delivery and embedded degraded mode", () => {
  it("registers artifact delivery routes in the command API catalog", () => {
    for (const route of phase7ArtifactDeliveryRoutes) {
      expect(serviceDefinition.routeCatalog.some((entry) => entry.routeId === route.routeId)).toBe(
        true,
      );
    }
  });

  it("prepares, redeems, and audits a governed embedded artifact delivery", () => {
    const application = createDefaultPhase7ArtifactDeliveryApplication();

    const prepared = application.prepareDelivery(baseInput());
    const redeemed = application.redeemByteGrant({
      grantId: prepared.byteGrant!.grantId,
      artifactId: prepared.delivery.artifactId,
      bridgeCapabilityMatrixRef: prepared.byteGrant!.bridgeCapabilityMatrixRef,
      patientEmbeddedNavEligibilityRef: prepared.byteGrant!.patientEmbeddedNavEligibilityRef,
      selectedAnchorRef: prepared.byteGrant!.selectedAnchorRef,
      returnContractRef: prepared.byteGrant!.returnContractRef,
      sessionEpochRef: prepared.byteGrant!.sessionEpochRef,
      subjectBindingVersionRef: prepared.byteGrant!.subjectBindingVersionRef,
      continuityEvidenceRef: prepared.byteGrant!.continuityEvidenceRef,
    });

    expect(prepared.delivery.deliveryPosture).toBe("live");
    expect(redeemed.status).toBe("transferred");
    expect(application.listTelemetry().map((record) => record.eventType)).toContain(
      "artifact_byte_grant_redeemed",
    );
    expect(JSON.stringify(application.listTelemetry())).not.toContain("appointment-letter.pdf");
  });

  it("keeps stale continuity in same-shell recovery with summary preserved", () => {
    const application = createDefaultPhase7ArtifactDeliveryApplication();

    const result = application.prepareDelivery(
      baseInput({
        continuityState: "stale",
      }),
    );

    expect(result.delivery.deliveryPosture).toBe("recovery_required");
    expect(result.delivery.failureReasons).toContain("continuity_stale");
    expect(result.embeddedErrorContract?.shellDisposition).toBe("same_shell_recovery");
    expect(result.degradedMode?.summaryFallback.title).toBe("Appointment letter");
    expect(result.byteGrant).toBeNull();
  });

  it("blocks subject mismatch and route freeze without losing the safe summary", () => {
    const application = createDefaultPhase7ArtifactDeliveryApplication();
    const subjectMismatch = application.prepareDelivery(
      baseInput({
        subjectRef: "Subject:other-patient",
      }),
    );
    const frozen = application.prepareDelivery(
      baseInput({
        routeFreezeState: "frozen",
      }),
    );

    expect(subjectMismatch.delivery.deliveryPosture).toBe("blocked");
    expect(subjectMismatch.delivery.failureReasons).toContain("subject_mismatch");
    expect(subjectMismatch.embeddedErrorContract?.preserveSummary).toBe(true);
    expect(frozen.delivery.deliveryPosture).toBe("blocked");
    expect(frozen.delivery.failureReasons).toContain("route_frozen");
  });

  it("maps unavailable sources into governed send-later degraded mode", () => {
    const application = createDefaultPhase7ArtifactDeliveryApplication();
    const result = application.prepareDelivery(
      baseInput({
        artifactId: "artifact:382:pharmacy-unavailable",
        journeyPathId: "jp_pharmacy_status",
        routeFamilyRef: "pharmacy_status",
      }),
    );

    expect(result.delivery.deliveryPosture).toBe("deferred");
    expect(result.delivery.failureReasons).toContain("source_unavailable");
    expect(result.degradedMode?.degradedState).toBe("secure_send_later");
    expect(result.degradedMode?.byteDeliverySuppressed).toBe(true);
  });
});
