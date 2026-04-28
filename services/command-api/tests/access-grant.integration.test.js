import { describe, expect, it } from "vitest";
import {
  accessGrantMigrationPlanRefs,
  accessGrantPersistenceTables,
  createAccessGrantApplication,
} from "../src/access-grant.ts";

describe("access grant application seam", () => {
  it("composes the canonical grant authority and deterministic harness over the command-api seam", async () => {
    const application = createAccessGrantApplication();

    const issued = await application.accessGrantService.issueGrantForUseCase({
      useCase: "booking_manage",
      routeFamilyRef: "rf_patient_appointments",
      governingObjectRef: "booking_case_cmdapi_078",
      governingVersionRef: "booking_case_cmdapi_078_v1",
      issuedRouteIntentBindingRef: "route_intent_cmdapi_078_booking",
      requiredIdentityBindingRef: "binding_cmdapi_078",
      requiredReleaseApprovalFreezeRef: "release_freeze_cmdapi_078_booking",
      requiredChannelReleaseFreezeRef: null,
      requiredAudienceSurfaceRuntimeBindingRef: "audience_runtime_cmdapi_078_booking",
      minimumBridgeCapabilitiesRef: null,
      requiredAssuranceSliceTrustRefs: ["assurance_slice_cmdapi_078_booking"],
      recoveryRouteRef: "rf_recover_booking_manage",
      subjectRef: "subject_cmdapi_078",
      boundPatientRef: "patient_cmdapi_078",
      issuedIdentityBindingRef: "binding_cmdapi_078",
      boundContactRouteRef: "contact_route_cmdapi_078_sms",
      tokenKeyVersionRef: "token_key_local_v1",
      issuedSessionEpochRef: "session_epoch_cmdapi_078_v1",
      issuedSubjectBindingVersionRef: "binding_cmdapi_078@v1",
      issuedLineageFenceEpoch: 2,
      presentedToken: "",
      expiresAt: "2026-04-12T16:50:00Z",
      createdAt: "2026-04-12T16:10:00Z",
    });

    expect(issued.outcome).toBe("issued");
    expect(issued.materializedToken?.opaqueToken.startsWith("ag.token_key_local_v1.")).toBe(true);

    const redemption =
      issued.outcome === "issued"
        ? await application.accessGrantService.redeemGrant({
            presentedToken: issued.materializedToken.opaqueToken,
            context: {
              routeFamily: "rf_patient_appointments",
              actionScope: "appointment_manage_entry",
              lineageScope: "request",
              governingObjectRef: "booking_case_cmdapi_078",
              governingVersionRef: "booking_case_cmdapi_078_v1",
              routeIntentBindingRef: "route_intent_cmdapi_078_booking",
              routeIntentTupleHash: "tuple_hash_cmdapi_078_booking",
              routeContractDigestRef: "digestcmdapi078book",
              routeIntentBindingState: "live",
              identityBindingRef: "binding_cmdapi_078",
              releaseApprovalFreezeRef: "release_freeze_cmdapi_078_booking",
              audienceSurfaceRuntimeBindingRef: "audience_runtime_cmdapi_078_booking",
              assuranceSliceTrustRefs: ["assurance_slice_cmdapi_078_booking"],
              lineageFenceEpoch: 2,
              sessionEpochRef: "session_epoch_cmdapi_078_v1",
              subjectBindingVersionRef: "binding_cmdapi_078@v1",
              tokenKeyVersionRef: "token_key_local_v1",
            },
            recordedAt: "2026-04-12T16:12:00Z",
          })
        : null;

    const authFlow = await application.accessGrantService.openAuthBridgeFlow({
      routeFamilyRef: "rf_patient_secure_link_recovery",
      actionScope: "claim",
      routeTargetRef: "request://cmdapi-078-claim",
      requestLineageRef: "lineage_cmdapi_078",
      fallbackRouteRef: "rf_recover_claim",
      resumeContinuationRef: "resume_cmdapi_078_claim",
      subjectRef: "subject_cmdapi_078",
      requiredIdentityBindingRef: "binding_cmdapi_078",
      requiredCapabilityDecisionRef: "capability_cmdapi_078_claim",
      requiredPatientLinkRef: "patient_link_cmdapi_078",
      requiredSessionState: "step_up_required",
      returnAuthority: "claim_pending",
      sessionEpochRef: "session_epoch_cmdapi_078_v1",
      subjectBindingVersionRef: "binding_cmdapi_078@v1",
      lineageFenceEpoch: 2,
      manifestVersionRef: "manifest_cmdapi_078_v1",
      releaseApprovalFreezeRef: "release_freeze_cmdapi_078_booking",
      minimumBridgeCapabilitiesRef: "bridge_caps_cmdapi_078",
      channelReleaseFreezeState: "monitoring",
      routeFreezeDispositionRef: "route_freeze_cmdapi_078_claim",
      expiresAt: "2026-04-12T16:20:00Z",
      requestedScopes: ["openid", "profile", "patient:read"],
      minimumClaims: ["sub", "nhs_number"],
      minimumAssuranceBand: "high",
      capabilityCeiling: "claim_pending",
      policyVersion: "auth_policy_cmdapi_078_v1",
      consentCopyVariantRef: "consent_copy_cmdapi_078",
      maxAuthAgeSeconds: 300,
      requestContextHash: "request_context_hash_cmdapi_078",
      startedAt: "2026-04-12T16:13:00Z",
    });

    const scenarios = await application.simulation.runAllScenarios();

    expect(redemption?.redemption?.toSnapshot().decision).toBe("allow");
    expect(redemption?.sessionDecision?.decision).toBe("create_fresh");
    expect(authFlow.transaction.transactionState).toBe("awaiting_callback");
    expect(scenarios).toHaveLength(5);
    expect(scenarios.map((scenario) => scenario.scenarioId)).toContain("logout_revoke");
    expect(application.persistenceTables).toEqual(accessGrantPersistenceTables);
    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/068_identity_binding_and_access_grants.sql",
    );
    expect(application.migrationPlanRefs).toEqual(accessGrantMigrationPlanRefs);
  });
});
