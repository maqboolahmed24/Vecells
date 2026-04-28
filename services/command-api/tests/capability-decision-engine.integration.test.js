import { describe, expect, it } from "vitest";
import {
  CAPABILITY_DECISION_ENGINE_NAME,
  CAPABILITY_DECISION_POLICY_VERSION,
  createCapabilityDecisionEngineApplication,
  createInMemoryCapabilityDecisionEngineRepository,
  capabilityDecisionEngineMigrationPlanRefs,
  capabilityDecisionEngineParallelInterfaceGaps,
  capabilityDecisionEnginePersistenceTables,
} from "../src/capability-decision-engine.ts";

function identityContext(overrides = {}) {
  return {
    identityContextRef: "icx_180_verified",
    subjectRef: "nhs_subject_180",
    identitySource: "nhs_login",
    verificationLevel: "nhs_p9",
    ageGateState: "pass",
    restrictionReasonCodes: [],
    evidenceEnvelopeRefs: ["iev_180_auth_claim"],
    lastVerifiedAt: "2026-04-15T12:00:00.000Z",
    expiresAt: "2026-04-15T12:30:00.000Z",
    ...overrides,
  };
}

function patientLink(overrides = {}) {
  return {
    patientLinkRef: "pld_180_verified",
    linkState: "verified_patient",
    linkProbabilityLowerBound: 0.982,
    subjectProofLowerBound: 0.975,
    confidenceModelState: "calibrated",
    bindingVersionRef: "binding_180_v1",
    ...overrides,
  };
}

function binding(overrides = {}) {
  return {
    identityBindingRef: "binding_180",
    bindingState: "claimed",
    currentBindingVersionRef: "binding_180_v1",
    ownershipState: "claimed",
    ...overrides,
  };
}

function session(overrides = {}) {
  return {
    sessionRef: "session_180",
    sessionEpochRef: "session_epoch_180_v1",
    sessionState: "active",
    routeAuthorityState: "claim_pending",
    subjectBindingVersionRef: "binding_180_v1",
    authTime: "2026-04-15T12:00:00.000Z",
    idleExpiresAt: "2026-04-15T12:30:00.000Z",
    absoluteExpiresAt: "2026-04-15T18:00:00.000Z",
    ...overrides,
  };
}

function routeTuple(overrides = {}) {
  return {
    routeFamily: "rf_phase2_authenticated_request_status",
    actionScope: "status_view",
    governingObjectRef: "request_180",
    governingObjectVersionRef: "request_180_v1",
    sessionEpochRef: "session_epoch_180_v1",
    subjectBindingVersionRef: "binding_180_v1",
    lineageFenceRef: "lineage_fence_180_v1",
    grantFamily: "public_status_minimal",
    releaseApprovalFreezeRef: null,
    manifestVersionRef: null,
    channelPosture: "web",
    embeddedPosture: "not_embedded",
    audienceScope: "patient_authenticated",
    visibilityScope: "authenticated_summary",
    ...overrides,
  };
}

function evaluationInput(overrides = {}) {
  return {
    identityContext: identityContext(),
    patientLink: patientLink(),
    binding: binding(),
    session: session(),
    routeTuple: routeTuple(),
    sameLineageRecoveryAvailable: true,
    riskSignals: [0.02],
    edgeCorrelationId: "edge_180",
    observedAt: "2026-04-15T12:05:00.000Z",
    ...overrides,
  };
}

function scopeEnvelope(overrides = {}) {
  return {
    scopeEnvelopeRef: "scope_env_180",
    grantFamily: "public_status_minimal",
    actionScope: "status_view",
    routeFamily: "rf_phase2_authenticated_request_status",
    governingObjectRef: "request_180",
    governingObjectVersionRef: "request_180_v1",
    sessionEpochRef: "session_epoch_180_v1",
    subjectBindingVersionRef: "binding_180_v1",
    lineageFenceRef: "lineage_fence_180_v1",
    routeIntentBindingRef: "rib_180_request_status",
    releaseApprovalFreezeRef: null,
    manifestVersionRef: null,
    channelPosture: "web",
    embeddedPosture: "not_embedded",
    audienceScope: "patient_authenticated",
    visibilityScope: "authenticated_summary",
    expiresAt: "2026-04-15T12:20:00.000Z",
    supersessionState: "live",
    redemptionState: "unredeemed",
    scopeHash: "scope_hash_180",
    ...overrides,
  };
}

function createHarness() {
  const repository = createInMemoryCapabilityDecisionEngineRepository();
  const application = createCapabilityDecisionEngineApplication({ repository });
  return { application, repository };
}

describe("capability decision engine and scope envelope authorization", () => {
  it("allows a verified request-status route through the central engine without granting mutation authority", async () => {
    const { application, repository } = createHarness();

    const decision =
      await application.capabilityDecisionEngine.evaluateCapability(evaluationInput());

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/095_phase2_capability_decision_engine.sql",
    );
    expect(application.migrationPlanRefs).toEqual(capabilityDecisionEngineMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(capabilityDecisionEnginePersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(
      capabilityDecisionEngineParallelInterfaceGaps,
    );
    expect(decision.engineAuthority).toBe(CAPABILITY_DECISION_ENGINE_NAME);
    expect(decision.policyVersion).toBe(CAPABILITY_DECISION_POLICY_VERSION);
    expect(decision.decisionState).toBe("allow");
    expect(decision.writableAuthorityState).toBe("read_only");
    expect(decision.capabilityIsCeilingOnly).toBe(true);
    expect(decision.identityBindingMutation).toBe("none");
    expect(decision.reasonCodes).toContain("CAP_180_CAPABILITY_ALLOW");
    expect(repository.snapshots().decisions).toHaveLength(1);
  });

  it("denies unknown routes by default rather than inferring controller-local capability", async () => {
    const { application } = createHarness();

    const decision = await application.capabilityDecisionEngine.evaluateCapability(
      evaluationInput({
        routeTuple: routeTuple({
          routeFamily: "rf_unregistered_controller_route",
          actionScope: "status_view",
        }),
      }),
    );

    expect(decision.decisionState).toBe("deny");
    expect(decision.routeProfileRef).toBe("RCP_180_UNKNOWN_PROTECTED_ROUTE");
    expect(decision.reasonCodes).toContain("CAP_180_UNKNOWN_ROUTE_PROFILE_DENIED");
    expect(decision.reasonCodes).toContain("CAP_180_DENY_BY_DEFAULT");
  });

  it("returns step_up_required only when a higher-assurance path exists", async () => {
    const { application } = createHarness();

    const decision = await application.capabilityDecisionEngine.evaluateCapability(
      evaluationInput({
        identityContext: identityContext({ verificationLevel: "nhs_low" }),
        patientLink: patientLink({
          linkState: "candidate",
          linkProbabilityLowerBound: 0.72,
          bindingVersionRef: null,
        }),
        binding: binding({
          bindingState: "candidate",
          currentBindingVersionRef: null,
          ownershipState: "claim_pending",
        }),
        routeTuple: routeTuple({
          routeFamily: "rf_phase2_claim_redemption",
          actionScope: "claim",
          grantFamily: "claim_step_up",
          subjectBindingVersionRef: null,
        }),
      }),
    );

    expect(decision.decisionState).toBe("step_up_required");
    expect(decision.stepUpPathRef).toBe("step-up://claim-nhs-p9");
    expect(decision.reasonCodes).toContain("CAP_180_STEP_UP_PATH_AVAILABLE");
  });

  it("downgrades stale binding fences to same-lineage recovery instead of reusing stale authority", async () => {
    const { application } = createHarness();

    const decision = await application.capabilityDecisionEngine.evaluateCapability(
      evaluationInput({
        routeTuple: routeTuple({ subjectBindingVersionRef: "binding_180_stale" }),
      }),
    );

    expect(decision.decisionState).toBe("recover_only");
    expect(decision.recoveryPathRef).toBe("recovery://request-status");
    expect(decision.reasonCodes).toContain("CAP_180_BINDING_VERSION_DRIFT");
    expect(decision.reasonCodes).toContain("CAP_180_SAME_LINEAGE_RECOVERY_AVAILABLE");
  });

  it("authorizes a matching scope envelope and returns deterministic replay for duplicate checks", async () => {
    const { application, repository } = createHarness();

    const first = await application.capabilityDecisionEngine.authorizeScopeEnvelope({
      scopeEnvelope: scopeEnvelope(),
      routeTuple: routeTuple(),
      sameLineageRecoveryAvailable: true,
      idempotencyKey: "scope_180_idempotent",
      observedAt: "2026-04-15T12:06:00.000Z",
    });
    const replay = await application.capabilityDecisionEngine.authorizeScopeEnvelope({
      scopeEnvelope: scopeEnvelope(),
      routeTuple: routeTuple(),
      sameLineageRecoveryAvailable: true,
      idempotencyKey: "scope_180_idempotent",
      observedAt: "2026-04-15T12:06:30.000Z",
    });

    expect(first.authorization.authorizationState).toBe("authorized");
    expect(first.authorization.reasonCodes).toContain("CAP_180_SCOPE_ENVELOPE_AUTHORIZED");
    expect(replay.replayed).toBe(true);
    expect(replay.authorization.reasonCodes).toContain("CAP_180_SCOPE_REPLAY_RETURNED");
    expect(repository.snapshots().scopeAuthorizations).toHaveLength(1);
  });

  it("detects scope-envelope drift across session epoch, binding version, and governing object tuple", async () => {
    const { application } = createHarness();

    const result = await application.capabilityDecisionEngine.authorizeScopeEnvelope({
      scopeEnvelope: scopeEnvelope(),
      routeTuple: routeTuple({
        governingObjectVersionRef: "request_180_v2",
        sessionEpochRef: "session_epoch_180_v2",
        subjectBindingVersionRef: "binding_180_v2",
      }),
      sameLineageRecoveryAvailable: true,
      idempotencyKey: "scope_180_drift",
      observedAt: "2026-04-15T12:07:00.000Z",
    });

    expect(result.authorization.authorizationState).toBe("recover_only");
    expect(result.authorization.driftFields).toEqual([
      "governingObjectVersionRef",
      "sessionEpochRef",
      "subjectBindingVersionRef",
    ]);
    expect(result.authorization.reasonCodes).toContain("CAP_180_SCOPE_GOVERNING_VERSION_DRIFT");
    expect(result.authorization.reasonCodes).toContain("CAP_180_SCOPE_SESSION_EPOCH_DRIFT");
    expect(result.authorization.reasonCodes).toContain("CAP_180_SCOPE_BINDING_VERSION_DRIFT");
  });

  it("makes the route guard consume both capability and scope-envelope authority", async () => {
    const { application } = createHarness();

    const result = await application.capabilityDecisionEngine.authorizeRoute({
      ...evaluationInput(),
      scopeEnvelope: scopeEnvelope({ governingObjectVersionRef: "request_180_v0" }),
      scopeEnvelopeIdempotencyKey: "scope_180_guard",
    });

    expect(result.capabilityDecision.decisionState).toBe("allow");
    expect(result.scopeAuthorization?.authorizationState).toBe("recover_only");
    expect(result.canProceed).toBe(false);
    expect(result.decisionState).toBe("recover_only");
    expect(result.reasonCodes).toContain("CAP_180_SCOPE_GOVERNING_VERSION_DRIFT");
  });
});
