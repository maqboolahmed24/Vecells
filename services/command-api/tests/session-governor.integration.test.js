import { describe, expect, it } from "vitest";
import {
  SESSION_ABSOLUTE_TIMEOUT_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_GOVERNOR_POLICY_VERSION,
  SESSION_IDLE_TIMEOUT_SECONDS,
  createInMemorySessionGovernorRepository,
  createSessionGovernorApplication,
  sessionGovernorMigrationPlanRefs,
  sessionGovernorParallelInterfaceGaps,
  sessionGovernorPersistenceTables,
} from "../src/session-governor.ts";

function establishInput(overrides = {}) {
  return {
    authTransactionRef: "auth_txn_176_success",
    postAuthReturnIntentRef: "post_auth_return_intent_176",
    routeIntentBindingRef: "RIB_176_SIGNED_IN_TRACK_REQUEST_V1",
    subjectRef: "nhs_login_subject_176",
    identityBindingRef: "identity_binding_176_v1",
    bindingVersionRef: "identity_binding_176@v1",
    patientLinkRef: "patient_link_176",
    capabilityDecisionRef: "capability_decision_176_read_write",
    observedAt: "2026-04-15T10:00:00Z",
    ...overrides,
  };
}

function createHarness() {
  const repository = createInMemorySessionGovernorRepository();
  const application = createSessionGovernorApplication({ repository });
  return { application, repository };
}

describe("session governor authority", () => {
  it("creates a fresh server-side session only after settled binding, patient-link, and capability inputs", async () => {
    const { application, repository } = createHarness();

    const established = await application.sessionGovernor.establishSession(establishInput());
    const snapshots = repository.snapshots();

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/091_phase2_session_governor.sql",
    );
    expect(application.migrationPlanRefs).toEqual(sessionGovernorMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(sessionGovernorPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(sessionGovernorParallelInterfaceGaps);
    expect(established.decision.policyVersion).toBe(SESSION_GOVERNOR_POLICY_VERSION);
    expect(established.decision.decision).toBe("create_fresh");
    expect(established.decision.sessionEpochAction).toBe("create");
    expect(established.decision.cookieRotationAction).toBe("set_secure_http_only");
    expect(established.decision.csrfRotationAction).toBe("issue");
    expect(established.session?.sessionState).toBe("active");
    expect(established.cookie?.cookieName).toBe(SESSION_COOKIE_NAME);
    expect(established.cookie?.setCookieHeader).toContain("HttpOnly");
    expect(established.cookie?.setCookieHeader).toContain("Secure");
    expect(established.cookie?.setCookieHeader).toContain("SameSite=Lax");
    expect(established.cookie?.setCookieHeader).toContain("Path=/");
    expect(established.projection.posture).toBe("active");
    expect(snapshots.sessions).toHaveLength(1);
    expect(snapshots.establishmentDecisions).toHaveLength(1);
    expect(snapshots.terminationSettlements).toHaveLength(0);
  });

  it("treats an auth-bridge success as bounded recovery until binding and capability are settled", async () => {
    const { application, repository } = createHarness();

    const portResult = await application.sessionGovernor.settleSessionEstablishment({
      transactionId: "auth_txn_176_from_bridge",
      subjectRef: "nhs_login_subject_bridge",
      evidenceVaultRef: "identity_evidence_vault_ref_176",
      bindingIntentRef: "identity_binding_intent_176",
      capabilityIntentRef: "capability_intent_176",
      postAuthReturnIntent: {
        returnIntentId: "post_auth_return_intent_bridge_176",
        routeIntentBindingRef: "RIB_176_BRIDGE_RETURN_V1",
        sessionEpochRef: null,
      },
      requestedAt: "2026-04-15T10:00:00Z",
    });
    const snapshots = repository.snapshots();

    expect(portResult.sessionGovernorDecisionRef).toMatch(/^sed_/);
    expect(snapshots.establishmentDecisions[0]?.decision).toBe("bounded_recovery");
    expect(snapshots.establishmentDecisions[0]?.reasonCodes).toContain(
      "AUTH_171_AUTH_SUCCESS_NOT_SESSION",
    );
    expect(snapshots.sessions).toHaveLength(0);
    expect(snapshots.projections[0]?.posture).toBe("recovery_only");
  });

  it("reuses an existing session for the same subject and rotates on binding or privilege changes", async () => {
    const { application, repository } = createHarness();
    const first = await application.sessionGovernor.establishSession(establishInput());
    const reused = await application.sessionGovernor.establishSession(
      establishInput({
        existingCookieValue: first.cookie?.cookieValue,
        observedAt: "2026-04-15T10:05:00Z",
      }),
    );
    const rotated = await application.sessionGovernor.establishSession(
      establishInput({
        existingCookieValue: first.cookie?.cookieValue,
        bindingVersionRef: "identity_binding_176@v2",
        capabilityDecisionRef: "capability_decision_176_higher_privilege",
        observedAt: "2026-04-15T10:10:00Z",
      }),
    );
    const snapshots = repository.snapshots();

    expect(reused.decision.decision).toBe("reuse_existing");
    expect(reused.cookie).toBeNull();
    expect(reused.session?.sessionRef).toBe(first.session?.sessionRef);
    expect(rotated.decision.decision).toBe("rotate_existing");
    expect(rotated.session?.sessionRef).not.toBe(first.session?.sessionRef);
    expect(rotated.cookie?.csrfToken).toMatch(/^csrf_/);
    expect(rotated.rotatedFromSession?.sessionRef).toBe(first.session?.sessionRef);
    expect(snapshots.sessions).toHaveLength(2);
    expect(
      snapshots.sessions.find((session) => session.sessionRef === first.session?.sessionRef)
        ?.sessionState,
    ).toBe("rotated");
  });

  it("settles subject-switch teardown without issuing a writable session", async () => {
    const { application, repository } = createHarness();
    const first = await application.sessionGovernor.establishSession(establishInput());

    const subjectSwitch = await application.sessionGovernor.establishSession(
      establishInput({
        existingCookieValue: first.cookie?.cookieValue,
        subjectRef: "nhs_login_subject_other",
        identityBindingRef: "identity_binding_other",
        bindingVersionRef: "identity_binding_other@v1",
        patientLinkRef: "patient_link_other",
        observedAt: "2026-04-15T10:07:00Z",
      }),
    );
    const replayedLogout = await application.sessionGovernor.terminateSession({
      sessionRef: first.session?.sessionRef,
      terminationType: "subject_conflict",
      idempotencyKey: `subject_conflict:${first.session?.sessionRef}`,
      observedAt: "2026-04-15T10:07:30Z",
    });

    expect(subjectSwitch.decision.decision).toBe("bounded_recovery");
    expect(subjectSwitch.cookie).toBeNull();
    expect(subjectSwitch.terminationSettlement?.terminationType).toBe("subject_conflict");
    expect(subjectSwitch.projection.posture).toBe("recovery_only");
    expect(replayedLogout.replayed).toBe(true);
    expect(repository.snapshots().terminationSettlements).toHaveLength(1);
  });

  it("enforces idle timeout, absolute timeout, logout, and CSRF downgrade through settlements", async () => {
    const idleHarness = createHarness();
    const idleSession =
      await idleHarness.application.sessionGovernor.establishSession(establishInput());
    const idleGuard = await idleHarness.application.sessionGovernor.guardRequest({
      cookieValue: idleSession.cookie?.cookieValue,
      observedAt: "2026-04-15T10:31:00Z",
    });

    const absoluteHarness = createHarness();
    const absoluteSession = await absoluteHarness.application.sessionGovernor.establishSession(
      establishInput({ observedAt: "2026-04-15T00:00:00Z" }),
    );
    const absoluteGuard = await absoluteHarness.application.sessionGovernor.guardRequest({
      cookieValue: absoluteSession.cookie?.cookieValue,
      observedAt: "2026-04-15T12:01:00Z",
    });

    const logoutHarness = createHarness();
    const logoutSession =
      await logoutHarness.application.sessionGovernor.establishSession(establishInput());
    const logout = await logoutHarness.application.sessionGovernor.terminateSession({
      sessionRef: logoutSession.session?.sessionRef,
      terminationType: "logout",
      idempotencyKey: "logout_176_exact_once",
      observedAt: "2026-04-15T10:04:00Z",
    });
    const logoutReplay = await logoutHarness.application.sessionGovernor.terminateSession({
      sessionRef: logoutSession.session?.sessionRef,
      terminationType: "logout",
      idempotencyKey: "logout_176_exact_once",
      observedAt: "2026-04-15T10:04:30Z",
    });

    const csrfHarness = createHarness();
    const csrfSession =
      await csrfHarness.application.sessionGovernor.establishSession(establishInput());
    const csrfGuard = await csrfHarness.application.sessionGovernor.guardRequest({
      cookieValue: csrfSession.cookie?.cookieValue,
      csrfToken: "wrong-csrf-token",
      method: "POST",
      observedAt: "2026-04-15T10:02:00Z",
    });

    expect(SESSION_IDLE_TIMEOUT_SECONDS).toBe(1800);
    expect(SESSION_ABSOLUTE_TIMEOUT_SECONDS).toBe(43200);
    expect(idleGuard.accepted).toBe(false);
    expect(idleGuard.terminationSettlement?.terminationType).toBe("idle_timeout");
    expect(idleGuard.projection.posture).toBe("expired_idle");
    expect(idleGuard.clearCookieHeader).toContain("Max-Age=0");
    expect(absoluteGuard.terminationSettlement?.terminationType).toBe("absolute_timeout");
    expect(absoluteGuard.projection.posture).toBe("expired_absolute");
    expect(logout.settlement.terminationType).toBe("logout");
    expect(logoutReplay.replayed).toBe(true);
    expect(logoutHarness.repository.snapshots().terminationSettlements).toHaveLength(1);
    expect(csrfGuard.accepted).toBe(false);
    expect(csrfGuard.terminationSettlement?.terminationType).toBe("downgrade");
    expect(csrfGuard.projection.posture).toBe("restricted");
  });
});
