import { describe, expect, it } from "vitest";
import {
  SIGNED_IN_REQUEST_OWNERSHIP_POLICY_VERSION,
  createSignedInRequestOwnershipApplication,
  signedInRequestOwnershipMigrationPlanRefs,
  signedInRequestOwnershipParallelInterfaceGaps,
  signedInRequestOwnershipPersistenceTables,
} from "../src/signed-in-request-ownership.ts";

function baseStartInput(overrides = {}) {
  return {
    idempotencyKey: "sro_184_start",
    draftPublicId: "draft_public_184",
    submissionEnvelopeRef: "submission_envelope_184",
    continuityShellRef: "continuity_shell_184",
    continuityAnchorRef: "continuity_anchor_184",
    requestShellRef: "request_shell_184",
    subjectRef: "nhs_subject_184",
    sessionRef: "session_184",
    sessionEpochRef: "session_epoch_184_v1",
    subjectBindingVersionRef: "binding_version_184_v1",
    routeIntentBindingRef: "route_intent_184_v1",
    lineageFenceRef: "lineage_fence_184_v1",
    startMode: "claim_pending",
    observedAt: "2026-04-15T09:00:00.000Z",
    ...overrides,
  };
}

function baseClaimInput(overrides = {}) {
  return {
    idempotencyKey: "sro_184_claim",
    draftPublicId: "draft_public_184",
    subjectRef: "nhs_subject_184",
    sessionRef: "session_184",
    sessionEpochRef: "session_epoch_184_v1",
    expectedSessionEpochRef: "session_epoch_184_v1",
    expectedSubjectBindingVersionRef: "binding_version_184_v1",
    currentSubjectBindingVersionRef: "binding_version_184_v1",
    expectedRouteIntentBindingRef: "route_intent_184_v1",
    expectedLineageFenceRef: "lineage_fence_184_v1",
    targetPatientRef: "patient_ref_184",
    patientLinkDecisionRef: "patient_link_decision_184",
    publicGrantRefs: ["public_grant_184_a", "public_grant_184_b"],
    writableScopeRequested: true,
    episodeRef: "episode_184",
    actorRef: "nhs_subject_184",
    observedAt: "2026-04-15T09:01:00.000Z",
    ...overrides,
  };
}

function baseUpliftInput(overrides = {}) {
  return {
    idempotencyKey: "sro_184_uplift",
    requestRef: "request_184",
    draftPublicId: "draft_public_184",
    requestShellRef: "request_shell_184",
    episodeRef: "episode_184",
    subjectRef: "nhs_subject_184",
    sessionRef: "session_184",
    sessionEpochRef: "session_epoch_184_v1",
    expectedSessionEpochRef: "session_epoch_184_v1",
    expectedSubjectBindingVersionRef: "binding_version_184_v1",
    currentSubjectBindingVersionRef: "binding_version_184_v1",
    expectedRouteIntentBindingRef: "route_intent_184_v1",
    expectedLineageFenceRef: "lineage_fence_184_v1",
    targetPatientRef: "patient_ref_184",
    patientLinkDecisionRef: "patient_link_decision_184",
    actorRef: "nhs_subject_184",
    observedAt: "2026-04-15T09:02:00.000Z",
    ...overrides,
  };
}

function createHarness() {
  const authorityCalls = [];
  const grantCalls = [];
  const sessionCalls = [];
  const routeCalls = [];
  const application = createSignedInRequestOwnershipApplication({
    identityBindingAuthority: {
      async settleOwnership(input) {
        authorityCalls.push(input);
        return {
          authoritySettlementRef: `authority_settlement_${authorityCalls.length}`,
          subjectBindingVersionRef: `binding_version_184_v${authorityCalls.length + 1}`,
          requestPatientRef: input.targetPatientRef,
          episodePatientRef: input.derivedLineageRefs.some(
            (lineage) => lineage.lineageKind === "episode",
          )
            ? input.targetPatientRef
            : null,
          ownershipState: input.targetPatientRef ? "claimed" : "claim_pending",
          decision: input.targetPatientRef ? "accepted" : "denied",
          reasonCodes: [
            "SRO_184_AUTHORITY_DERIVED_PATIENT_REF_ONLY",
            "SRO_184_REQUEST_EPISODE_PATIENT_REF_SAME_TRANSACTION",
          ],
        };
      },
    },
    accessGrantService: {
      async supersedePublicGrantsForClaim(input) {
        grantCalls.push(input);
        return {
          accessGrantSupersessionRefs: input.publicGrantRefs.map(
            (grantRef) => `supersession_${grantRef}`,
          ),
        };
      },
    },
    sessionGovernor: {
      async rotateForWritableScope(input) {
        sessionCalls.push(input);
        return {
          rotatedSessionEpochRef: "session_epoch_184_v2",
          sessionSettlementRef: "session_settlement_184",
          reasonCodes: ["SRO_184_SESSION_ROTATED_FOR_WRITABLE_SCOPE"],
        };
      },
    },
    routeIntent: {
      async mapContinuity(input) {
        routeCalls.push(input);
        return {
          routeIntentBindingRef: input.currentRouteIntentBindingRef,
          routeContinuityTarget: input.target,
          routeRef: `/requests/${input.requestRef}`,
        };
      },
    },
  });
  return { application, authorityCalls, grantCalls, sessionCalls, routeCalls };
}

describe("SignedInRequestOwnershipService request ownership", () => {
  it("creates a signed-in draft on the shared lineage without deriving patient refs", async () => {
    const { application } = createHarness();

    const result =
      await application.signedInRequestOwnershipService.startSignedInDraft(baseStartInput());

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/099_phase2_signed_in_request_ownership.sql",
    );
    expect(application.migrationPlanRefs).toEqual(signedInRequestOwnershipMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(signedInRequestOwnershipPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(
      signedInRequestOwnershipParallelInterfaceGaps,
    );
    expect(application.policyVersion).toBe(SIGNED_IN_REQUEST_OWNERSHIP_POLICY_VERSION);
    expect(result.lineage.draftPublicId).toBe("draft_public_184");
    expect(result.lineage.submissionEnvelopeRef).toBe("submission_envelope_184");
    expect(result.lineage.patientRefDerivationState).toBe("not_derived");
    expect(result.lineage.requestPatientRef).toBeNull();
    expect(result.lineage.episodePatientRef).toBeNull();
    expect(result.start.routeContinuityTarget).toBe("same_draft_shell");
  });

  it("claims a pre-submit public draft through IdentityBindingAuthority, AccessGrantService, and SessionGovernor while preserving the same draft, envelope, shell, and anchor", async () => {
    const { application, authorityCalls, grantCalls, sessionCalls } = createHarness();
    await application.signedInRequestOwnershipService.startSignedInDraft(baseStartInput());

    const result =
      await application.signedInRequestOwnershipService.claimPreSubmitDraft(baseClaimInput());
    const replay =
      await application.signedInRequestOwnershipService.claimPreSubmitDraft(baseClaimInput());

    expect(result.attachment.decisionState).toBe("claimed");
    expect(result.attachment.preservedSubmissionEnvelopeRef).toBe("submission_envelope_184");
    expect(result.attachment.preservedContinuityShellRef).toBe("continuity_shell_184");
    expect(result.attachment.preservedContinuityAnchorRef).toBe("continuity_anchor_184");
    expect(result.attachment.routeContinuityTarget).toBe("same_draft_shell");
    expect(result.attachment.accessGrantSupersessionRefs).toEqual([
      "supersession_public_grant_184_a",
      "supersession_public_grant_184_b",
    ]);
    expect(result.attachment.rotatedSessionEpochRef).toBe("session_epoch_184_v2");
    expect(result.lineage.draftPublicId).toBe("draft_public_184");
    expect(result.lineage.requestPatientRef).toBe("patient_ref_184");
    expect(result.lineage.episodePatientRef).toBe("patient_ref_184");
    expect(result.derivationSettlement.transactionBoundary).toBe(
      "identity_binding_authority_request_episode_patient_refs",
    );
    expect(authorityCalls).toHaveLength(1);
    expect(grantCalls).toHaveLength(1);
    expect(sessionCalls).toHaveLength(1);
    expect(replay.replayed).toBe(true);
    expect(authorityCalls).toHaveLength(1);
  });

  it("uplifts a post-submit request onto the existing shell without creating a duplicate request or episode", async () => {
    const { application, routeCalls } = createHarness();
    await application.signedInRequestOwnershipService.startSignedInDraft(baseStartInput());

    const result =
      await application.signedInRequestOwnershipService.upliftPostSubmitRequest(baseUpliftInput());

    expect(result.mapping.decisionState).toBe("uplifted");
    expect(result.mapping.routeContinuityTarget).toBe("same_request_shell");
    expect(result.mapping.clonedRequestCreated).toBe(false);
    expect(result.mapping.requestRef).toBe("request_184");
    expect(result.lineage.requestRef).toBe("request_184");
    expect(result.lineage.requestShellRef).toBe("request_shell_184");
    expect(result.lineage.episodeRef).toBe("episode_184");
    expect(routeCalls).toHaveLength(1);
  });

  it("replays duplicate promotion races by requestRef instead of creating another mapping", async () => {
    const { application } = createHarness();
    await application.signedInRequestOwnershipService.startSignedInDraft(baseStartInput());

    await application.signedInRequestOwnershipService.upliftPostSubmitRequest(baseUpliftInput());
    const replay = await application.signedInRequestOwnershipService.upliftPostSubmitRequest(
      baseUpliftInput({ idempotencyKey: "sro_184_uplift_duplicate" }),
    );
    const snapshots = application.repository.snapshots();

    expect(replay.replayed).toBe(true);
    expect(replay.mapping.duplicatePromotionReplay).toBe(true);
    expect(replay.mapping.clonedRequestCreated).toBe(false);
    expect(snapshots.upliftMappings).toHaveLength(1);
  });

  it("fences stale session and stale binding attempts into recovery without authority calls", async () => {
    const { application, authorityCalls } = createHarness();
    await application.signedInRequestOwnershipService.startSignedInDraft(baseStartInput());

    const staleSession = await application.signedInRequestOwnershipService.claimPreSubmitDraft(
      baseClaimInput({
        idempotencyKey: "sro_184_stale_session",
        sessionEpochRef: "session_epoch_184_stale",
      }),
    );
    const staleBinding = await application.signedInRequestOwnershipService.claimPreSubmitDraft(
      baseClaimInput({
        idempotencyKey: "sro_184_stale_binding",
        currentSubjectBindingVersionRef: "binding_version_184_stale",
      }),
    );

    expect(staleSession.attachment.decisionState).toBe("recover_only");
    expect(staleSession.attachment.routeContinuityTarget).toBe("recovery_shell");
    expect(staleSession.attachment.reasonCodes).toContain("SRO_184_STALE_SESSION_RECOVERY");
    expect(staleBinding.attachment.decisionState).toBe("recover_only");
    expect(staleBinding.attachment.reasonCodes).toContain("SRO_184_STALE_BINDING_RECOVERY");
    expect(authorityCalls).toHaveLength(0);
  });

  it("degrades subject switches to claim-pending instead of optimistic writable ownership", async () => {
    const { application, authorityCalls } = createHarness();
    await application.signedInRequestOwnershipService.startSignedInDraft(baseStartInput());

    const result = await application.signedInRequestOwnershipService.claimPreSubmitDraft(
      baseClaimInput({
        idempotencyKey: "sro_184_subject_switch",
        subjectRef: "nhs_subject_184_other",
      }),
    );

    expect(result.attachment.decisionState).toBe("claim_pending");
    expect(result.attachment.routeContinuityTarget).toBe("claim_pending_shell");
    expect(result.attachment.reasonCodes).toContain("SRO_184_SUBJECT_SWITCH_RECOVERY");
    expect(authorityCalls).toHaveLength(0);
  });

  it("keeps route-intent and lineage-fence drift in same-shell recovery", async () => {
    const { application } = createHarness();
    await application.signedInRequestOwnershipService.startSignedInDraft(baseStartInput());

    const routeDrift = await application.signedInRequestOwnershipService.evaluateWritableContinuity(
      {
        requestLineageRef: application.repository.snapshots().lineages[0].requestLineageRef,
        subjectRef: "nhs_subject_184",
        sessionEpochRef: "session_epoch_184_v1",
        expectedSessionEpochRef: "session_epoch_184_v1",
        currentSubjectBindingVersionRef: "binding_version_184_v1",
        expectedSubjectBindingVersionRef: "binding_version_184_v1",
        expectedRouteIntentBindingRef: "route_intent_184_stale",
        expectedLineageFenceRef: "lineage_fence_184_v1",
      },
    );
    const fenceDrift = await application.signedInRequestOwnershipService.evaluateWritableContinuity(
      {
        draftPublicId: "draft_public_184",
        subjectRef: "nhs_subject_184",
        sessionEpochRef: "session_epoch_184_v1",
        expectedSessionEpochRef: "session_epoch_184_v1",
        currentSubjectBindingVersionRef: "binding_version_184_v1",
        expectedSubjectBindingVersionRef: "binding_version_184_v1",
        expectedRouteIntentBindingRef: "route_intent_184_v1",
        expectedLineageFenceRef: "lineage_fence_184_stale",
      },
    );
    const snapshots = application.repository.snapshots();

    expect(routeDrift.accepted).toBe(false);
    expect(routeDrift.routeContinuityTarget).toBe("recovery_shell");
    expect(routeDrift.reasonCodes).toContain("SRO_184_ROUTE_INTENT_DRIFT_RECOVERY");
    expect(fenceDrift.accepted).toBe(false);
    expect(fenceDrift.reasonCodes).toContain("SRO_184_LINEAGE_FENCE_DRIFT_RECOVERY");
    expect(JSON.stringify(snapshots)).not.toContain(".patientRef =");
    expect(JSON.stringify(snapshots)).not.toContain(".ownershipState =");
    expect(JSON.stringify(snapshots)).not.toContain("authenticated_requests");
  });
});
