import { describe, expect, it } from "vitest";
import {
  IDENTITY_AUDIT_EVENT_NAMES,
  createIdentityAuditAndMaskingApplication,
  identityAuditAndMaskingGapClosures,
  identityAuditAndMaskingMigrationPlanRefs,
  identityAuditAndMaskingPersistenceTables,
} from "../src/identity-audit-and-masking.ts";

const observedAt = "2026-04-15T12:00:00.000Z";

function baseEvent(overrides = {}) {
  return {
    tenantId: "tenant_186",
    eventName: "auth.login.started",
    producerScopeRef: "identity_access.auth_bridge",
    governingAggregateRef: "auth_tx_186",
    governingLineageRef: "lineage_186",
    routeIntentRef: "route_intent_186",
    edgeCorrelationId: "edge_corr_186",
    causalToken: "causal_186_login",
    effectKeyRef: "effect_186_login_started",
    subjectRef: "subject_186",
    actorType: "patient",
    sessionRef: "session_186",
    decisionRef: "decision_186",
    routeProfileRef: "route_profile_186",
    reasonCodes: ["IDAUD_186_TEST_REASON"],
    occurredAt: observedAt,
    payload: {
      authTransactionRef: "auth_tx_186",
      nhsNumber: "9999999999",
      phoneNumber: "+440000000001",
      emailAddress: "person@example.test",
      oauthToken: "fixture-sensitive-token",
      oidcClaims: {
        sub: "subject_186",
        email: "person@example.test",
      },
      accessGrantValue: "fixture-grant-opaque-value",
      routeQueryString: "?code=fixture-auth-code&state=fixture-state",
      evidenceBlob: {
        capture: "fixture-evidence-payload",
      },
    },
    ...overrides,
  };
}

function expectNoLeak(value) {
  const text = JSON.stringify(value);
  for (const forbidden of [
    "9999999999",
    "+440000000001",
    "person@example.test",
    "fixture-sensitive-token",
    "fixture-grant-opaque-value",
    "fixture-auth-code",
    "fixture-evidence-payload",
  ]) {
    expect(text).not.toContain(forbidden);
  }
}

describe("IdentityAuditAndMaskingService", () => {
  it("publishes canonical identity lifecycle events through a redacted CanonicalEventEnvelope", async () => {
    const app = await createIdentityAuditAndMaskingApplication();

    const result = await app.identityAuditAndMaskingService.publishIdentityEvent(baseEvent());

    expect(app.migrationPlanRefs).toEqual(identityAuditAndMaskingMigrationPlanRefs);
    expect(app.persistenceTables).toEqual(identityAuditAndMaskingPersistenceTables);
    expect(app.gapClosures).toEqual(identityAuditAndMaskingGapClosures);
    expect(result.replayDisposition).toBe("accepted");
    expect(result.envelope.eventName).toBe("auth.login.started");
    expect(result.envelope.canonicalEventContractRef).toBe("cec_186_auth_login_started");
    expect(result.envelope.payloadHash).toHaveLength(64);
    expect(result.envelope.reasonCodes).toContain("IDAUD_186_CANONICAL_ENVELOPE_PUBLISHED");
    expect(result.auditRecord.recordHash).toHaveLength(64);
    expect(result.outboxEntry.queueRef).toBe("q_event_assurance_audit");
    expect(result.redaction.redactedFieldPaths).toContain("nhsNumber");
    expectNoLeak(result);
  });

  it("centralizes masking for logs traces and metric labels without route-local masking", async () => {
    const app = await createIdentityAuditAndMaskingApplication();
    const service = app.identityAuditAndMaskingService;

    const log = await service.scrubLogRecord({
      sourceRef: "auth_bridge_callback_log",
      observedAt,
      record: {
        message: "callback received",
        token: "fixture-sensitive-token",
        phoneNumber: "+440000000001",
        routeQueryString: "?code=fixture-auth-code",
      },
    });
    const trace = await service.scrubTraceAttributes({
      sourceRef: "identity_trace_baggage",
      observedAt,
      attributes: {
        oidcClaims: { sub: "subject_186", email: "person@example.test" },
        jwtPayload: "header.payload.signature",
      },
    });
    const metrics = await service.scrubMetricLabels({
      sourceRef: "identity_metric_labels",
      observedAt,
      labels: {
        eventName: "auth.callback.received",
        phoneNumber: "+440000000001",
        grantValue: "fixture-grant-opaque-value",
      },
    });

    expect(log.reasonCodes).toContain("IDAUD_186_OPERATIONAL_LOG_MASKED");
    expect(trace.reasonCodes).toContain("IDAUD_186_TRACE_BAGGAGE_MASKED");
    expect(metrics.reasonCodes).toContain("IDAUD_186_METRIC_LABEL_MASKED");
    expectNoLeak({ log, trace, metrics });
    expect((await app.repository.listScrubRecords()).map((record) => record.surface)).toEqual([
      "log",
      "trace",
      "metric",
    ]);
  });

  it("collapses replayed or duplicate event publication by effect key while preserving duplicate receipts", async () => {
    const app = await createIdentityAuditAndMaskingApplication();
    const service = app.identityAuditAndMaskingService;

    const first = await service.publishIdentityEvent(
      baseEvent({
        eventName: "auth.callback.received",
        causalToken: "causal_186_callback",
        effectKeyRef: "effect_186_callback_received",
      }),
    );
    const replay = await service.publishIdentityEvent(
      baseEvent({
        eventName: "auth.callback.received",
        causalToken: "causal_186_callback",
        effectKeyRef: "effect_186_callback_received",
        edgeCorrelationId: "edge_corr_186_retry",
      }),
    );

    expect(first.replayDisposition).toBe("accepted");
    expect(replay.replayDisposition).toBe("duplicate_replayed");
    expect(replay.envelope.eventId).toBe(first.envelope.eventId);
    expect(replay.duplicateReceipt.existingEventEnvelopeRef).toBe(first.envelope.eventId);
    expect(await app.repository.listEventEnvelopes()).toHaveLength(1);
    expect(await app.repository.listAuditRecords()).toHaveLength(1);
    expect(await app.repository.listDuplicateReceipts()).toHaveLength(1);
    expectNoLeak(replay);
  });

  it("reconstructs claim grant capability and repair lifecycle decisions from append-only audit history", async () => {
    const app = await createIdentityAuditAndMaskingApplication();
    const service = app.identityAuditAndMaskingService;

    await service.publishIdentityEvent(
      baseEvent({
        eventName: "identity.capability.changed",
        governingAggregateRef: "cap_decision_186",
        decisionRef: "cap_decision_186",
        causalToken: "causal_186_capability",
        effectKeyRef: "effect_186_capability_changed",
        payload: { routeProfileRef: "route_profile_186", decisionRef: "cap_decision_186" },
      }),
    );
    await service.publishIdentityEvent(
      baseEvent({
        eventName: "access.grant.redeemed",
        governingAggregateRef: "grant_186",
        grantRef: "grant_186",
        causalToken: "causal_186_grant",
        effectKeyRef: "effect_186_grant_redeemed",
        reasonCodes: ["IDAUD_186_CLAIM_GRANT_RECONSTRUCTABLE"],
        payload: { grantRef: "grant_186", redemptionRef: "redemption_186" },
      }),
    );
    await service.publishIdentityEvent(
      baseEvent({
        eventName: "identity.request.claim.confirmed",
        governingAggregateRef: "request_lineage_186",
        causalToken: "causal_186_claim",
        effectKeyRef: "effect_186_claim_confirmed",
        reasonCodes: ["IDAUD_186_CLAIM_GRANT_RECONSTRUCTABLE"],
        payload: { claimSettlementRef: "claim_settlement_186" },
      }),
    );
    await service.publishIdentityEvent(
      baseEvent({
        eventName: "identity.repair_case.freeze_committed",
        governingAggregateRef: "repair_case_186",
        repairCaseRef: "repair_case_186",
        causalToken: "causal_186_repair",
        effectKeyRef: "effect_186_repair_freeze",
        reasonCodes: ["IDAUD_186_REPAIR_LIFECYCLE_RECONSTRUCTABLE"],
        payload: { freezeRecordRef: "freeze_186", evidenceRefs: ["evidence_ref_186"] },
      }),
    );

    const reconstruction = await service.reconstructDecision({
      governingLineageRef: "lineage_186",
    });

    expect(reconstruction.reconstructionState).toBe("complete");
    expect(reconstruction.eventNames).toContain("identity.capability.changed");
    expect(reconstruction.eventNames).toContain("access.grant.redeemed");
    expect(reconstruction.eventNames).toContain("identity.request.claim.confirmed");
    expect(reconstruction.eventNames).toContain("identity.repair_case.freeze_committed");
    expect(reconstruction.grantRefs).toContain("grant_186");
    expect(reconstruction.repairCaseRefs).toContain("repair_case_186");
    expect(reconstruction.reasonCodes).toContain("IDAUD_186_REPAIR_LIFECYCLE_RECONSTRUCTABLE");
    expectNoLeak(reconstruction);
  });

  it("records optional PDS provenance and exposes the full event catalogue contract", async () => {
    const app = await createIdentityAuditAndMaskingApplication();
    const service = app.identityAuditAndMaskingService;

    const pds = await service.publishIdentityEvent(
      baseEvent({
        eventName: "identity.pds.enrichment.succeeded",
        governingAggregateRef: "pds_snapshot_186",
        decisionRef: "pds_decision_186",
        causalToken: "causal_186_pds",
        effectKeyRef: "effect_186_pds_success",
        reasonCodes: ["IDAUD_186_PDS_PROVENANCE_RECONSTRUCTABLE"],
        payload: {
          pdsAccessDecisionRef: "pds_decision_186",
          demographicSnapshotRef: "pds_snapshot_186",
          rawPdsDemographics: { nhsNumber: "9999999999" },
        },
      }),
    );

    for (const eventName of [
      "auth.login.started",
      "auth.callback.received",
      "auth.session.created",
      "auth.session.ended",
      "identity.patient.match_attempted",
      "identity.patient.matched",
      "identity.patient.ambiguous",
      "identity.capability.denied",
      "identity.age.restricted",
      "access.grant.issued",
      "access.grant.redeemed",
      "access.grant.superseded",
      "identity.repair_case.opened",
      "identity.repair_release.settled",
      "identity.pds.enrichment.succeeded",
    ]) {
      expect(IDENTITY_AUDIT_EVENT_NAMES).toContain(eventName);
    }
    expect(pds.envelope.reasonCodes).toContain("IDAUD_186_PDS_PROVENANCE_RECONSTRUCTABLE");
    expectNoLeak(pds);
  });
});
