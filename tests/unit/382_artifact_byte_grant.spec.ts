import { describe, expect, it } from "vitest";
import {
  buildNavigationContract,
  createFakeNhsAppApi,
  createLiveEligibility,
  negotiateBridgeCapabilityMatrix,
} from "../../packages/nhs-app-bridge-runtime/src/index.ts";
import {
  createDefaultPhase7ArtifactDeliveryApplication,
  PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION,
  type PrepareArtifactDeliveryInput,
} from "../../services/command-api/src/phase7-artifact-delivery-service.ts";

const MANIFEST = "nhsapp-manifest-v0.1.0-freeze-374";
const CONTINUITY = "ContinuityEvidence:382-current";

function embeddedTruth(input?: { readonly missingDownload?: boolean }) {
  const navigationContract = buildNavigationContract({
    routeId: "jp_manage_local_appointment",
    manifestVersionRef: MANIFEST,
    patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:382-test",
    routeFreezeDispositionRef: "RouteFreezeDisposition:382-test",
    continuityEvidenceRef: CONTINUITY,
  });
  const eligibility = createLiveEligibility({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: MANIFEST,
    continuityEvidenceRef: CONTINUITY,
  });
  const matrix = negotiateBridgeCapabilityMatrix({
    api: createFakeNhsAppApi({
      platform: "ios",
      missingMethods: input?.missingDownload ? ["downloadBytes"] : [],
    }),
    navigationContract,
    eligibility,
    manifestVersionRef: MANIFEST,
    contextFenceRef: "ChannelContext:382-test",
  });
  return { matrix, eligibility };
}

function deliveryInput(
  input?: Partial<PrepareArtifactDeliveryInput> & { readonly missingDownload?: boolean },
): PrepareArtifactDeliveryInput {
  const { matrix, eligibility } = embeddedTruth({
    missingDownload: input?.missingDownload,
  });
  return {
    environment: "sandpit",
    artifactId: "artifact:382:appointment-letter",
    subjectRef: "Subject:patient-382",
    journeyPathId: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    selectedAnchorRef: "SelectedAnchor:382-appointment-letter",
    returnContractRef: "ReturnContract:382-appointment",
    sessionEpochRef: eligibility.sessionEpochRef,
    subjectBindingVersionRef: eligibility.subjectBindingVersionRef,
    continuityEvidenceRef: CONTINUITY,
    bridgeCapabilityMatrix: matrix,
    patientEmbeddedNavEligibility: eligibility,
    ...input,
  };
}

describe("382 artifact byte grant", () => {
  it("issues a byte grant only when bridge, eligibility, route, and continuity fences pass", () => {
    const application = createDefaultPhase7ArtifactDeliveryApplication();

    const result = application.prepareDelivery(deliveryInput());

    expect(result.delivery.deliveryPosture).toBe("live");
    expect(result.delivery.deliveryState).toBe("bridge_ready");
    expect(result.byteGrant?.grantState).toBe("issued");
    expect(result.byteGrant?.grantId).toBe(result.delivery.byteGrantRef);
    expect(result.delivery.failureReasons).toEqual([]);
    expect(result.telemetry[0]?.schemaVersion).toBe(PHASE7_ARTIFACT_DELIVERY_SCHEMA_VERSION);
  });

  it("redeems the grant once into an NHS App bridge byte payload", () => {
    const application = createDefaultPhase7ArtifactDeliveryApplication();
    const prepared = application.prepareDelivery(deliveryInput());
    expect(prepared.byteGrant).not.toBeNull();

    const redeemed = application.redeemByteGrant({
      grantId: prepared.byteGrant!.grantId,
      artifactId: "artifact:382:appointment-letter",
      bridgeCapabilityMatrixRef: prepared.byteGrant!.bridgeCapabilityMatrixRef,
      patientEmbeddedNavEligibilityRef: prepared.byteGrant!.patientEmbeddedNavEligibilityRef,
      selectedAnchorRef: prepared.byteGrant!.selectedAnchorRef,
      returnContractRef: prepared.byteGrant!.returnContractRef,
      sessionEpochRef: prepared.byteGrant!.sessionEpochRef,
      subjectBindingVersionRef: prepared.byteGrant!.subjectBindingVersionRef,
      continuityEvidenceRef: prepared.byteGrant!.continuityEvidenceRef,
    });
    const replay = application.redeemByteGrant({
      grantId: prepared.byteGrant!.grantId,
      artifactId: "artifact:382:appointment-letter",
      bridgeCapabilityMatrixRef: prepared.byteGrant!.bridgeCapabilityMatrixRef,
      patientEmbeddedNavEligibilityRef: prepared.byteGrant!.patientEmbeddedNavEligibilityRef,
      selectedAnchorRef: prepared.byteGrant!.selectedAnchorRef,
      returnContractRef: prepared.byteGrant!.returnContractRef,
      sessionEpochRef: prepared.byteGrant!.sessionEpochRef,
      subjectBindingVersionRef: prepared.byteGrant!.subjectBindingVersionRef,
      continuityEvidenceRef: prepared.byteGrant!.continuityEvidenceRef,
    });

    expect(redeemed.status).toBe("transferred");
    expect(redeemed.byteDownload?.filename).toBe("appointment-letter.pdf");
    expect(redeemed.byteDownload?.mimeType).toBe("application/pdf");
    expect(replay.status).toBe("blocked");
    expect(replay.failureReasons).toContain("grant_redeemed");
  });

  it("blocks oversized payloads before issuing byte grants and keeps summary fallback", () => {
    const application = createDefaultPhase7ArtifactDeliveryApplication();

    const result = application.prepareDelivery(
      deliveryInput({ artifactId: "artifact:382:large-appointment-pack" }),
    );

    expect(result.delivery.deliveryPosture).toBe("deferred");
    expect(result.delivery.failureReasons).toContain("payload_too_large");
    expect(result.byteGrant).toBeNull();
    expect(result.degradedMode?.degradedState).toBe("secure_send_later");
    expect(result.delivery.summaryFallback.patientSummary).toContain("too large");
  });

  it("blocks unsupported MIME types and missing bridge download capability", () => {
    const application = createDefaultPhase7ArtifactDeliveryApplication();
    const unsupported = application.prepareDelivery(
      deliveryInput({
        artifactId: "artifact:382:unsupported-script",
        journeyPathId: "jp_request_status",
        routeFamilyRef: "request_status",
      }),
    );
    const missingCapability = application.prepareDelivery(deliveryInput({ missingDownload: true }));

    expect(unsupported.delivery.deliveryPosture).toBe("summary_only");
    expect(unsupported.delivery.failureReasons).toContain("mime_type_blocked");
    expect(missingCapability.delivery.deliveryPosture).toBe("summary_only");
    expect(missingCapability.delivery.failureReasons).toContain("capability_missing");
  });
});
