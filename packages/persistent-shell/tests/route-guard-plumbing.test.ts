import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  RouteGuardSurface,
  getRouteGuardAuthorityProfile,
  hydrateRuntimeBindingSnapshot,
  listRouteGuardAuthorityProfiles,
  resolveActionGuardDecision,
  resolveRouteGuardDecision,
  type AudienceSurfaceRuntimeBindingLike,
  type FrontendContractManifestLike,
  type ReleaseRecoveryDispositionLike,
  type ReleaseTrustFreezeVerdictLike,
  type RouteFreezeDispositionLike,
} from "../src/index";

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
  generatedAt: "2026-04-13T20:00:00Z",
};

const liveReleaseVerdict: ReleaseTrustFreezeVerdictLike = {
  releaseTrustFreezeVerdictId: "RTFV_PATIENT_LIVE",
  audienceSurface: "audsurf_patient_authenticated_portal",
  routeFamilyRef: "rf_patient_requests",
  surfaceAuthorityState: "live",
  calmTruthState: "allowed",
  mutationAuthorityState: "enabled",
  blockerRefs: [],
  evaluatedAt: "2026-04-13T20:00:00Z",
};

const diagnosticReleaseVerdict: ReleaseTrustFreezeVerdictLike = {
  ...liveReleaseVerdict,
  releaseTrustFreezeVerdictId: "RTFV_PATIENT_DIAGNOSTIC",
  surfaceAuthorityState: "diagnostic_only",
  mutationAuthorityState: "observe_only",
  blockerRefs: ["release_diagnostic_window"],
};

const readOnlyRecovery: ReleaseRecoveryDispositionLike = {
  releaseRecoveryDispositionId: "RRD_PATIENT_REQUEST_READ_ONLY",
  posture: "read_only",
  label: "Read-only recovery",
  summary: "Keep the request summary visible while mutation authority settles.",
  actionLabel: "Refresh runtime binding",
  continuityMode: "refresh_tuple",
  reasonRefs: ["runtime_tuple_revalidation_required"],
};

const embeddedRecovery: ReleaseRecoveryDispositionLike = {
  releaseRecoveryDispositionId: "RRD_EMBEDDED_HANDOFF_ONLY",
  posture: "recovery_only",
  label: "Embedded handoff only",
  summary: "Embedded delivery may continue only through a governed host handoff.",
  actionLabel: "Open governed handoff",
  continuityMode: "browser_handoff",
  reasonRefs: ["embedded_capability_floor_unmet"],
};

const blockedFreeze: RouteFreezeDispositionLike = {
  routeFreezeDispositionId: "RFD_PATIENT_REQUEST_BLOCKED",
  routeFamilyRef: "rf_patient_requests",
  freezeState: "blocked",
  sameShellDisposition: "downgrade_blocked",
  recoveryActionLabel: "Review last safe summary",
  reasonRefs: ["route_publication_withdrawn"],
};

describe("route guard plumbing", () => {
  it("publishes authority profiles for every persistent-shell route", () => {
    expect(listRouteGuardAuthorityProfiles()).toHaveLength(19);
    expect(getRouteGuardAuthorityProfile("rf_patient_embedded_channel").allowedChannelProfiles).toEqual([
      "embedded",
    ]);
  });

  it("keeps a route live when manifest, runtime binding, and release truth all stay current", () => {
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_requests",
      manifest: patientPortalManifest,
      runtimeBinding: patientPortalBinding,
      audienceContext: { channelProfile: "browser" },
      releaseVerdict: liveReleaseVerdict,
      releaseRecoveryDisposition: readOnlyRecovery,
    });

    expect(decision.effectivePosture).toBe("live");
    expect(decision.dominantRecoveryAction).toBeNull();
    expect(decision.reasonRefs).toEqual([]);
  });

  it("fails closed when a route is not declared in the active manifest", () => {
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_secure_link_recovery",
      manifest: patientPortalManifest,
      runtimeBinding: patientPortalBinding,
      audienceContext: { channelProfile: "browser" },
      releaseVerdict: liveReleaseVerdict,
      releaseRecoveryDisposition: readOnlyRecovery,
    });

    expect(decision.effectivePosture).toBe("blocked");
    expect(decision.reasonRefs).toContain("route_not_published_in_manifest");
  });

  it("keeps the route in recovery-only posture until runtime binding hydration is ready", () => {
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_requests",
      manifest: patientPortalManifest,
      hydrationState: "binding_pending",
      audienceContext: { channelProfile: "browser" },
      releaseVerdict: liveReleaseVerdict,
      releaseRecoveryDisposition: readOnlyRecovery,
    });

    expect(decision.effectivePosture).toBe("recovery_only");
    expect(decision.sameShellDisposition).toBe("downgrade_recovery_only");
    expect(decision.reasonRefs).toContain("runtime_binding_pending");
  });

  it("downgrades mutable actions to read-only when release trust is diagnostic only", () => {
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_requests",
      manifest: patientPortalManifest,
      runtimeBinding: patientPortalBinding,
      audienceContext: { channelProfile: "browser" },
      releaseVerdict: diagnosticReleaseVerdict,
      releaseRecoveryDisposition: readOnlyRecovery,
    });
    const action = resolveActionGuardDecision({
      decision,
      capabilityId: "rf_patient_requests::mutation_command",
    });

    expect(decision.effectivePosture).toBe("read_only");
    expect(action.state).toBe("read_only");
    expect(decision.reasonRefs).toContain("release_diagnostic_window");
  });

  it("keeps embedded routes in same-shell recovery when the required host floor is missing", () => {
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
    };
    const releaseVerdict: ReleaseTrustFreezeVerdictLike = {
      ...liveReleaseVerdict,
      audienceSurface: "audsurf_patient_transaction_recovery",
      routeFamilyRef: "rf_patient_embedded_channel",
    };

    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_embedded_channel",
      manifest: embeddedManifest,
      runtimeBinding: embeddedBinding,
      audienceContext: { channelProfile: "embedded", embeddedCapabilities: ["secure_storage"] },
      releaseVerdict,
      releaseRecoveryDisposition: embeddedRecovery,
    });

    expect(decision.effectivePosture).toBe("recovery_only");
    expect(decision.reasonRefs).toContain(
      "embedded_capability_floor_unmet:signed_identity_bridge+host_return",
    );
    expect(decision.dominantRecoveryAction?.label).toBe("Open governed handoff");
  });

  it("lets route freeze and recovery disposition override calmer earlier verdicts", () => {
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_requests",
      manifest: patientPortalManifest,
      runtimeBinding: patientPortalBinding,
      audienceContext: { channelProfile: "browser" },
      releaseVerdict: liveReleaseVerdict,
      routeFreezeDisposition: blockedFreeze,
      releaseRecoveryDisposition: readOnlyRecovery,
    });

    expect(decision.effectivePosture).toBe("blocked");
    expect(decision.precedenceTrail.at(-1)?.stage).toBe("route_freeze_and_recovery");
    expect(decision.reasonRefs).toContain("route_publication_withdrawn");
  });

  it("validates the manifest-to-runtime binding join during hydration", async () => {
    const snapshot = await hydrateRuntimeBindingSnapshot({
      routeFamilyRef: "rf_patient_requests",
      manifest: patientPortalManifest,
      loader: async () => ({
        ...patientPortalBinding,
        surfacePublicationRef: "ASPR_MISMATCH",
      }),
    });

    expect(snapshot.hydrationState).toBe("binding_invalid");
    expect(snapshot.reasonRefs).toContain("runtime_binding_surface_publication_mismatch");
  });

  it("renders a same-shell downgrade surface that preserves the header and selected anchor", () => {
    const decision = resolveRouteGuardDecision({
      routeFamilyRef: "rf_patient_requests",
      manifest: patientPortalManifest,
      hydrationState: "binding_pending",
      audienceContext: { channelProfile: "browser" },
      releaseVerdict: liveReleaseVerdict,
      releaseRecoveryDisposition: readOnlyRecovery,
    });

    const markup = renderToStaticMarkup(
      createElement(RouteGuardSurface, {
        decision,
        selectedAnchor: "request-needs-attention",
      }),
    );

    expect(markup).toContain("data-guard-posture=\"recovery_only\"");
    expect(markup).toContain("Guarded Route");
    expect(markup).toContain("request-needs-attention");
    expect(markup).toContain("Refresh runtime binding");
  });
});
