import { describe, expect, it } from "vitest";
import {
  authBridgeMigrationPlanRefs,
  authBridgeParallelInterfaceGaps,
  authBridgePersistenceTables,
  createAuthBridgeApplication,
  createInMemoryAuthBridgeRepository,
  createRecordingAuthBridgePorts,
} from "../src/auth-bridge.ts";

function beginInput(overrides = {}) {
  return {
    routeIntentBindingRef: "RIB_175_SIGNED_IN_TRACK_REQUEST_V1",
    lineageRef: "lineage_phase2_auth_bridge_175",
    routeFamilyRef: "rf_signed_in_track_request",
    channelManifestRef: "manifest_phase2_patient_web_v1",
    selectedAnchorRef: "track-request",
    issuedAt: "2026-04-15T09:00:00Z",
    ttlSeconds: 300,
    ...overrides,
  };
}

function createHarness() {
  const repository = createInMemoryAuthBridgeRepository();
  const ports = createRecordingAuthBridgePorts();
  const application = createAuthBridgeApplication({
    repository,
    ports,
  });
  return { application, repository, ports };
}

describe("auth bridge OIDC transaction tracking seam", () => {
  it("freezes AuthScopeBundle and PostAuthReturnIntent before issuing the authorize redirect", async () => {
    const { application, repository } = createHarness();

    const started = await application.authBridge.beginAuthorize(
      beginInput({
        requestedScopes: ["openid", "profile", "email", "nhs_login_identity"],
        subjectRef: "subject_pre_auth_context",
        bindingVersionRef: "identity_binding_v0",
        sessionEpochRef: "session_epoch_pre_auth",
      }),
    );
    const authorizeUrl = new URL(started.authorizeUrl);
    const snapshots = repository.snapshots();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/090_phase2_auth_bridge.sql",
    );
    expect(application.migrationPlanRefs).toEqual(authBridgeMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(authBridgePersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(authBridgeParallelInterfaceGaps);
    expect(started.transaction.flow).toBe("server_authorization_code_pkce");
    expect(started.transaction.consumptionState).toBe("unconsumed");
    expect(started.scopeBundle.rawClaimStorageRule).toBe("vault_reference_only");
    expect(started.scopeBundle.requestedScopes).toEqual([
      "openid",
      "profile",
      "email",
      "nhs_login_identity",
    ]);
    expect(started.returnIntent.redirectMode).toBe("route_intent_binding_only");
    expect(started.returnIntent.routeIntentBindingRef).toBe("RIB_175_SIGNED_IN_TRACK_REQUEST_V1");
    expect(authorizeUrl.searchParams.get("redirect_uri")).toBe(started.transaction.redirectUri);
    expect(authorizeUrl.searchParams.get("state")).toBe(started.stateToken);
    expect(authorizeUrl.searchParams.get("scope")).toBe("openid profile email nhs_login_identity");
    expect(authorizeUrl.searchParams.get("post_auth_return_intent_ref")).toBe(
      started.returnIntent.returnIntentId,
    );
    expect(snapshots.scopeBundles).toHaveLength(1);
    expect(snapshots.returnIntents).toHaveLength(1);
    expect(snapshots.transactions).toHaveLength(1);
  });

  it("settles a valid callback exactly once through evidence, binding, capability, and session-governor ports", async () => {
    const { application, repository, ports } = createHarness();
    const started = await application.authBridge.beginAuthorize(beginInput());

    const settled = await application.authBridge.settleCallback({
      state: started.stateToken,
      code: "simulator_success_code_175",
      redirectUri: started.transaction.redirectUri,
      observedAt: "2026-04-15T09:01:00Z",
    });
    const snapshots = repository.snapshots();
    const portSnapshots = ports.snapshots();

    expect(settled.settlement.outcome).toBe("success");
    expect(settled.replayed).toBe(false);
    expect(settled.sideEffects).toEqual({
      evidenceVaultWrite: true,
      bindingIntentWrite: true,
      capabilityIntentWrite: true,
      sessionGovernorCall: true,
      directSessionWrite: false,
      requestPatientReferenceWrite: false,
      episodePatientReferenceWrite: false,
    });
    expect(snapshots.settlements).toHaveLength(1);
    expect(snapshots.transactions[0]?.callbackOutcome).toBe("success");
    expect(snapshots.transactions[0]?.tokenEvidenceRef).toBe(settled.settlement.evidenceVaultRef);
    expect(snapshots.tokenExchanges[0]?.outcome).toBe("token_validated");
    expect(portSnapshots.evidenceWrites).toHaveLength(1);
    expect(portSnapshots.bindingWrites).toHaveLength(1);
    expect(portSnapshots.capabilityWrites).toHaveLength(1);
    expect(portSnapshots.sessionGovernorCalls).toHaveLength(1);
  });

  it("returns replayed_callback for duplicate callbacks without repeating side effects", async () => {
    const { application, repository, ports } = createHarness();
    const started = await application.authBridge.beginAuthorize(beginInput());

    await application.authBridge.settleCallback({
      state: started.stateToken,
      code: "simulator_success_code_replay",
      redirectUri: started.transaction.redirectUri,
      observedAt: "2026-04-15T09:01:00Z",
    });
    const replayed = await application.authBridge.settleCallback({
      state: started.stateToken,
      code: "simulator_success_code_replay",
      redirectUri: started.transaction.redirectUri,
      observedAt: "2026-04-15T09:01:30Z",
    });

    expect(replayed.replayed).toBe(true);
    expect(replayed.settlement.outcome).toBe("replayed_callback");
    expect(replayed.settlement.reasonCodes).toContain("AUTH_CALLBACK_REPLAYED");
    expect(repository.snapshots().settlements).toHaveLength(1);
    expect(ports.snapshots().evidenceWrites).toHaveLength(1);
    expect(ports.snapshots().sessionGovernorCalls).toHaveLength(1);
  });

  it("rejects arbitrary callback redirect targets before token exchange", async () => {
    const { application, repository, ports } = createHarness();
    const started = await application.authBridge.beginAuthorize(beginInput());

    const denied = await application.authBridge.settleCallback({
      state: started.stateToken,
      code: "simulator_success_code_redirect_attack",
      redirectUri: "https://evil.example/auth/callback",
      observedAt: "2026-04-15T09:01:00Z",
    });

    expect(denied.settlement.outcome).toBe("token_validation_failure");
    expect(denied.settlement.reasonCodes).toContain("AUTH_CALLBACK_REDIRECT_URI_MISMATCH");
    expect(repository.snapshots().tokenExchanges).toHaveLength(0);
    expect(ports.snapshots().evidenceWrites).toHaveLength(0);
    expect(denied.sideEffects.directSessionWrite).toBe(false);
  });

  it("settles expired and invalid-token callbacks without creating downstream side effects", async () => {
    const expiredHarness = createHarness();
    const expiredStart = await expiredHarness.application.authBridge.beginAuthorize(
      beginInput({ ttlSeconds: 1 }),
    );
    const expired = await expiredHarness.application.authBridge.settleCallback({
      state: expiredStart.stateToken,
      code: "simulator_success_code_after_ttl",
      redirectUri: expiredStart.transaction.redirectUri,
      observedAt: "2026-04-15T09:02:00Z",
    });

    const invalidHarness = createHarness();
    const invalidStart = await invalidHarness.application.authBridge.beginAuthorize(beginInput());
    const invalid = await invalidHarness.application.authBridge.settleCallback({
      state: invalidStart.stateToken,
      code: "simulator_invalid_signature",
      redirectUri: invalidStart.transaction.redirectUri,
      observedAt: "2026-04-15T09:01:00Z",
    });

    expect(expired.settlement.outcome).toBe("expired_transaction");
    expect(expiredHarness.repository.snapshots().tokenExchanges).toHaveLength(0);
    expect(expiredHarness.ports.snapshots().sessionGovernorCalls).toHaveLength(0);
    expect(invalid.settlement.outcome).toBe("token_validation_failure");
    expect(invalidHarness.repository.snapshots().tokenExchanges[0]?.outcome).toBe("token_rejected");
    expect(invalidHarness.ports.snapshots().bindingWrites).toHaveLength(0);
  });
});
