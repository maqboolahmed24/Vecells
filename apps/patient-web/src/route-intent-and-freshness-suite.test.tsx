import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  resolveRouteGuardDecision,
  type AudienceSurfaceRuntimeBindingLike,
  type FrontendContractManifestLike,
  type ReleaseRecoveryDispositionLike,
  type ReleaseTrustFreezeVerdictLike,
} from "@vecells/persistent-shell";

const suite = JSON.parse(
  fs.readFileSync(
    new URL("../../../data/test/continuity_gate_suite_results.json", import.meta.url),
    "utf8",
  ),
);

const patientPortalManifest: FrontendContractManifestLike = {
  frontendContractManifestId: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
  manifestState: "active",
  audienceSurface: "audsurf_patient_authenticated_portal",
  audienceSurfaceLabel: "Authenticated patient portal",
  shellType: "patient",
  routeFamilyRefs: [
    "rf_patient_home",
    "rf_patient_requests",
    "rf_patient_appointments",
    "rf_patient_health_record",
    "rf_patient_messages",
  ],
  gatewaySurfaceRefs: [
    "gws_patient_home",
    "gws_patient_requests",
    "gws_patient_appointments",
    "gws_patient_health_record",
    "gws_patient_messages",
  ],
  surfaceRouteContractRef: "ASRC_050_PATIENT_AUTHENTICATED_PORTAL_V1",
  surfacePublicationRef: "ASPR_050_PATIENT_AUTHENTICATED_PORTAL_V1",
  audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_AUTHENTICATED_PORTAL_V1",
  runtimePublicationBundleRef: "rpb::patient_authenticated::planned",
  designContractPublicationBundleRef: "dcpb::patient_authenticated::planned",
  projectionQueryContractRefs: ["PQC_050_PATIENT_AUTHENTICATED_PORTAL_V1"],
  mutationCommandContractRefs: ["MCC_050_PATIENT_AUTHENTICATED_PORTAL_V1"],
  liveUpdateChannelContractRefs: ["LCC_050_PATIENT_AUTHENTICATED_PORTAL_V1"],
  clientCachePolicyRef: "CP_PATIENT_ROUTE_INTENT_PRIVATE",
  clientCachePolicyRefs: ["CP_PATIENT_ROUTE_INTENT_PRIVATE"],
  releaseRecoveryDispositionRef: "RRD_PATIENT_REQUEST_READ_ONLY",
  releaseRecoveryDispositionRefs: [
    "RRD_PATIENT_HOME_READ_ONLY",
    "RRD_PATIENT_REQUEST_READ_ONLY",
    "RRD_PATIENT_MESSAGES_READ_ONLY",
  ],
  routeFreezeDispositionRef: "RFD_050_PATIENT_AUTHENTICATED_PORTAL_V1",
  routeFreezeDispositionRefs: ["RFD_050_PATIENT_AUTHENTICATED_PORTAL_V1"],
  browserPostureState: "read_only",
};

const patientPortalBinding: AudienceSurfaceRuntimeBindingLike = {
  audienceSurfaceRuntimeBindingId: "ASRB_050_PATIENT_AUTHENTICATED_PORTAL_V1",
  audienceSurface: "audsurf_patient_authenticated_portal",
  routeFamilyRefs: patientPortalManifest.routeFamilyRefs,
  gatewaySurfaceRefs: patientPortalManifest.gatewaySurfaceRefs,
  surfaceRouteContractRef: patientPortalManifest.surfaceRouteContractRef,
  surfacePublicationRef: patientPortalManifest.surfacePublicationRef,
  runtimePublicationBundleRef: patientPortalManifest.runtimePublicationBundleRef,
  designContractPublicationBundleRef: patientPortalManifest.designContractPublicationBundleRef,
  bindingState: "live",
  surfaceAuthorityState: "publishable_live",
  releaseRecoveryDispositionRefs: patientPortalManifest.releaseRecoveryDispositionRefs,
  routeFreezeDispositionRefs: patientPortalManifest.routeFreezeDispositionRefs,
  surfaceTupleHash: "tuple::patient::live",
  generatedAt: "2026-04-14T10:00:00Z",
};

const readOnlyRecovery: ReleaseRecoveryDispositionLike = {
  releaseRecoveryDispositionId: "RRD_PATIENT_REQUEST_READ_ONLY",
  posture: "read_only",
  label: "Read-only recovery",
  summary: "Keep the current summary visible while mutation authority settles.",
  actionLabel: "Refresh runtime binding",
  continuityMode: "refresh_tuple",
  reasonRefs: ["runtime_tuple_revalidation_required"],
};

const diagnosticReleaseVerdict = (
  routeFamilyRef: string,
): ReleaseTrustFreezeVerdictLike => ({
  releaseTrustFreezeVerdictId: `RTFV_${routeFamilyRef}_DIAGNOSTIC`,
  audienceSurface: "audsurf_patient_authenticated_portal",
  routeFamilyRef,
  surfaceAuthorityState: "diagnostic_only",
  calmTruthState: "suppressed",
  mutationAuthorityState: "observe_only",
  blockerRefs: ["release_diagnostic_window"],
  evaluatedAt: "2026-04-14T10:00:00Z",
});

describe("seq_134 patient route authority joins", () => {
  it("keeps pending runtime binding in recovery-only posture even when the route tuple is current", () => {
    const suiteCase = suite.continuityScenarios.find(
      (row: { caseId: string }) => row.caseId === "CG_134_PATIENT_REQUESTS_PENDING_BINDING",
    );
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_requests",
      manifest: patientPortalManifest,
      hydrationState: "binding_pending",
      audienceContext: { channelProfile: "browser" },
      releaseVerdict: diagnosticReleaseVerdict("rf_patient_requests"),
      releaseRecoveryDisposition: readOnlyRecovery,
    });

    expect(suiteCase.routeTupleDecision).toBe("allow");
    expect(decision.effectivePosture).toBe("recovery_only");
    expect(decision.sameShellDisposition).toBe("downgrade_recovery_only");
    expect(decision.selectedAnchorDisposition).toBe("freeze");
    expect(decision.dominantRecoveryAction?.label).toBe("Refresh runtime binding");
  });

  it("keeps embedded capability drift bounded to the governed handoff path", () => {
    const embeddedManifest: FrontendContractManifestLike = {
      ...patientPortalManifest,
      frontendContractManifestId: "FCM_050_PATIENT_TRANSACTION_RECOVERY_V1",
      audienceSurface: "audsurf_patient_transaction_recovery",
      routeFamilyRefs: ["rf_patient_secure_link_recovery", "rf_patient_embedded_channel"],
      gatewaySurfaceRefs: ["gws_patient_secure_link_recovery", "gws_patient_embedded_shell"],
      audienceSurfaceRuntimeBindingRef: "ASRB_050_PATIENT_TRANSACTION_RECOVERY_V1",
    };
    const embeddedBinding: AudienceSurfaceRuntimeBindingLike = {
      ...patientPortalBinding,
      audienceSurfaceRuntimeBindingId: "ASRB_050_PATIENT_TRANSACTION_RECOVERY_V1",
      audienceSurface: "audsurf_patient_transaction_recovery",
      routeFamilyRefs: embeddedManifest.routeFamilyRefs,
      gatewaySurfaceRefs: embeddedManifest.gatewaySurfaceRefs,
      bindingState: "recovery_only",
    };
    const handoffRecovery: ReleaseRecoveryDispositionLike = {
      releaseRecoveryDispositionId: "RRD_EMBEDDED_HANDOFF_ONLY",
      posture: "recovery_only",
      label: "Embedded handoff only",
      summary: "Embedded delivery may continue only through a governed host handoff.",
      actionLabel: "Open governed handoff",
      continuityMode: "browser_handoff",
      reasonRefs: ["embedded_capability_floor_unmet"],
    };
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_embedded_channel",
      manifest: embeddedManifest,
      runtimeBinding: embeddedBinding,
      audienceContext: { channelProfile: "embedded", embeddedCapabilities: ["secure_storage"] },
      releaseVerdict: {
        ...diagnosticReleaseVerdict("rf_patient_embedded_channel"),
        audienceSurface: "audsurf_patient_transaction_recovery",
        surfaceAuthorityState: "live",
        mutationAuthorityState: "blocked",
        blockerRefs: [],
      },
      releaseRecoveryDisposition: handoffRecovery,
    });

    expect(decision.effectivePosture).toBe("recovery_only");
    expect(decision.reasonRefs).toContain(
      "embedded_capability_floor_unmet:signed_identity_bridge+host_return",
    );
    expect(decision.sameShellDisposition).toBe("downgrade_recovery_only");
    expect(decision.dominantRecoveryAction?.label).toBe("Open governed handoff");
  });

  it("keeps a current patient route read-only when release truth is diagnostic only", () => {
    const suiteCase = suite.continuityScenarios.find(
      (row: { caseId: string }) => row.caseId === "CG_134_PATIENT_MESSAGE_CURRENT",
    );
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_messages",
      manifest: patientPortalManifest,
      runtimeBinding: patientPortalBinding,
      audienceContext: { channelProfile: "browser" },
      releaseVerdict: diagnosticReleaseVerdict("rf_patient_messages"),
      releaseRecoveryDisposition: readOnlyRecovery,
    });

    expect(suiteCase.routeTupleDecision).toBe("allow");
    expect(suiteCase.mutationDecision).toBe("blocked");
    expect(decision.effectivePosture).toBe("read_only");
    expect(decision.reasonRefs).toContain("release_diagnostic_window");
  });
});
