import { describe, expect, it } from "vitest";
import {
  Phase9EssentialFunctionMetricsEngine,
  computePhase9EssentialFunctionMetrics,
  createPhase9EssentialFunctionMetricsFixture,
  type Phase9MetricLifecycleEvent,
} from "../../packages/domains/analytics_assurance/src/index.ts";

const window = {
  tenantId: "tenant:demo-gp",
  scopeRef: "tenant:demo-gp",
  windowStart: "2026-04-27T08:00:00.000Z",
  windowEnd: "2026-04-27T09:20:00.000Z",
  capturedAt: "2026-04-27T09:20:00.000Z",
  timeHorizonRef: "ops:last-80m",
  filterDigest: "test:438-essential-functions",
} as const;

function cloneEvent(
  template: Phase9MetricLifecycleEvent,
  eventId: string,
  overrides: Partial<Phase9MetricLifecycleEvent>,
): Phase9MetricLifecycleEvent {
  return {
    ...template,
    eventId,
    sourceRef: `source:test:${eventId}`,
    entityRef: overrides.entityRef ?? `entity:${eventId}`,
    orderingKey: `${overrides.occurredAt ?? template.occurredAt}:${eventId}`,
    dedupeKey: `dedupe:${eventId}`,
    sequence: 438_500 + Number(eventId.match(/(\d+)$/)?.[1] ?? "1"),
    ...overrides,
  };
}

function project(events: readonly Phase9MetricLifecycleEvent[]) {
  const fixture = createPhase9EssentialFunctionMetricsFixture();
  return computePhase9EssentialFunctionMetrics({
    events,
    window,
    trustRecords: fixture.baselineTrustRecords,
    graphVerdict: fixture.baselineGraphVerdict,
  });
}

describe("438 Phase 9 essential function metrics", () => {
  it("waitlist offer accepted -> conversion counted once", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.baselineResult.waitlistConversion.offersAccepted).toBe(1);
    expect(fixture.baselineResult.waitlistConversion.bookingsCreatedFromOffers).toBe(1);
    expect(fixture.baselineResult.waitlistConversion.conversionRate).toBe(0.5);
  });

  it("offer expired -> no booking conversion", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.baselineResult.waitlistConversion.offersExpired).toBe(1);
    expect(fixture.baselineResult.waitlistConversion.offersCreated).toBe(2);
    expect(fixture.baselineResult.waitlistConversion.bookingsCreatedFromOffers).toBe(1);
  });

  it("notification delivered but not received -> receipt not counted", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();
    const created = fixture.baselineEvents.find((event) => event.eventId === "evt-438-019")!;
    const ack = fixture.baselineEvents.find((event) => event.eventId === "evt-438-021")!;
    const delivered = fixture.baselineEvents.find((event) => event.eventId === "evt-438-022")!;
    const result = project([
      ...fixture.baselineEvents,
      cloneEvent(created, "evt-438-test-notification-031", {
        entityRef: "notification:003",
        notificationRef: "notification:003",
        communicationEnvelopeRef: "comm:003",
        occurredAt: "2026-04-27T09:01:00.000Z",
      }),
      cloneEvent(ack, "evt-438-test-notification-032", {
        entityRef: "notification:003",
        notificationRef: "notification:003",
        communicationEnvelopeRef: "comm:003",
        occurredAt: "2026-04-27T09:02:00.000Z",
      }),
      cloneEvent(delivered, "evt-438-test-notification-033", {
        entityRef: "notification:003",
        notificationRef: "notification:003",
        communicationEnvelopeRef: "comm:003",
        occurredAt: "2026-04-27T09:03:00.000Z",
      }),
    ]);

    expect(result.notificationDelivery.deliverySuccess).toBe(
      fixture.baselineResult.notificationDelivery.deliverySuccess + 1,
    );
    expect(result.notificationDelivery.patientReceiptEnvelope).toBe(
      fixture.baselineResult.notificationDelivery.patientReceiptEnvelope,
    );
  });

  it("provider ACK failure -> delivery risk updated", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();
    const result = project(
      fixture.baselineEvents.filter((event) => event.eventId !== "evt-438-028"),
    );

    expect(result.notificationDelivery.providerAckFailure).toBe(1);
    expect(result.notificationDelivery.deliveryRiskStateCounts.likely_failed).toBe(1);
  });

  it("pharmacy urgent bounce-back -> urgent return metric and backlog update", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.baselineResult.pharmacyBounceBack.urgentReturnCount).toBe(1);
    expect(fixture.baselineResult.pharmacyBounceBack.openBounceBackBacklog).toBeGreaterThan(0);
    expect(fixture.baselineResult.pharmacyBounceBack.loopRiskState).toBe("elevated");
  });

  it("routine bounce-back -> correct priority band", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.baselineResult.pharmacyBounceBack.routineReturnCount).toBe(1);
    expect(fixture.baselineResult.pharmacyBounceBack.reopenPriorityBandCounts["1"]).toBe(1);
  });

  it("no-contact loop -> no false closure", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.baselineResult.pharmacyBounceBack.noContactCount).toBe(1);
    expect(fixture.baselineResult.pharmacyBounceBack.openBounceBackBacklog).toBe(3);
  });

  it("reopened pharmacy loop -> lifecycle counted without double-count", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.baselineResult.pharmacyBounceBack.reopenedLoopCount).toBe(1);
    expect(fixture.baselineResult.pharmacyBounceBack.bounceBackCount).toBe(3);
  });

  it("late booking commit updates conversion window deterministically", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();
    const recomputed = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.lateBookingCommitResult.lateEventRefs).toContain("evt-438-late-booking");
    expect(fixture.lateBookingCommitResult.waitlistConversion.conversionRate).toBeGreaterThan(
      fixture.baselineResult.waitlistConversion.conversionRate,
    );
    expect(fixture.lateBookingCommitResult.resultHash).toBe(
      recomputed.lateBookingCommitResult.resultHash,
    );
  });

  it("duplicate notification event deduped", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.duplicateNotificationResult.duplicateEventRefs).toContain(
      "evt-438-duplicate-receipt",
    );
    expect(fixture.duplicateNotificationResult.notificationDelivery.patientReceiptEnvelope).toBe(
      fixture.baselineResult.notificationDelivery.patientReceiptEnvelope,
    );
  });

  it("incomplete lifecycle evidence degrades metric trust", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();

    expect(fixture.incompleteLifecycleResult.waitlistConversion.trustState).toBe("degraded");
    expect(fixture.incompleteLifecycleResult.waitlistConversion.completenessState).toBe("partial");
    expect(fixture.incompleteLifecycleResult.waitlistConversion.blockingRefs).toEqual(
      expect.arrayContaining(["incomplete-lifecycle:evt-438-008"]),
    );
  });

  it("cross-tenant aggregation denied", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();
    const engine = new Phase9EssentialFunctionMetricsEngine();

    expect(() =>
      engine.project({
        events: [
          { ...fixture.baselineEvents[0]!, tenantId: "tenant:other" },
          ...fixture.baselineEvents.slice(1),
        ],
        window,
        trustRecords: fixture.baselineTrustRecords,
        graphVerdict: fixture.baselineGraphVerdict,
      }),
    ).toThrow(/CROSS_TENANT_METRIC_AGGREGATION_DENIED/);
  });

  it("dashboard DTO contains no PHI", () => {
    const fixture = createPhase9EssentialFunctionMetricsFixture();
    const dtoText = JSON.stringify(fixture.baselineResult.dashboardDtos);

    expect(dtoText).not.toMatch(/Jane|Smith|NHS\s?\d|@|phone|address|\+44/i);
    expect(fixture.baselineResult.dashboardDtos.every((dto) => dto.drillInSeed.length > 0)).toBe(
      true,
    );
  });
});
