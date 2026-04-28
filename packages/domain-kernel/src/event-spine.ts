export type EventSpineIdKind =
  | "outboxEntry"
  | "outboxDispatchAttempt"
  | "outboxCheckpoint"
  | "inboxReceipt"
  | "inboxCheckpoint"
  | "replayReview";

export interface EventSpineIdGenerator {
  nextId(kind: EventSpineIdKind): string;
}

export type EventSpineQueueRef =
  | "q_event_projection_live"
  | "q_event_projection_replay"
  | "q_event_integration_effects"
  | "q_event_notification_effects"
  | "q_event_callback_correlation"
  | "q_event_assurance_audit"
  | "q_event_replay_quarantine";

export type EventSpineConsumerGroupRef =
  | "cg_projection_live"
  | "cg_projection_replay"
  | "cg_integration_dispatch"
  | "cg_notification_dispatch"
  | "cg_callback_receipt_ingest"
  | "cg_assurance_observe"
  | "cg_replay_quarantine_review";

const queueConsumerGroupByRef: Record<
  EventSpineQueueRef,
  { consumerGroupRef: EventSpineConsumerGroupRef }
> = {
  q_event_projection_live: { consumerGroupRef: "cg_projection_live" },
  q_event_projection_replay: { consumerGroupRef: "cg_projection_replay" },
  q_event_integration_effects: { consumerGroupRef: "cg_integration_dispatch" },
  q_event_notification_effects: { consumerGroupRef: "cg_notification_dispatch" },
  q_event_callback_correlation: { consumerGroupRef: "cg_callback_receipt_ingest" },
  q_event_assurance_audit: { consumerGroupRef: "cg_assurance_observe" },
  q_event_replay_quarantine: { consumerGroupRef: "cg_replay_quarantine_review" },
};

export type OutboxDispatchState = "pending" | "claimed" | "published" | "quarantined";

export type InboxReceiptState = "accepted" | "duplicate_ignored" | "gap_blocked" | "quarantined";

export interface CanonicalEventEnvelope<TPayload = Record<string, unknown>> {
  eventId: string;
  tenantId: string;
  eventName: string;
  schemaVersionRef: string;
  sourceBoundedContextRef: string;
  governingBoundedContextRef: string;
  edgeCorrelationId: string;
  causalToken: string;
  emittedAt: string;
  payloadDigest: string;
  payload: TPayload;
}

export interface OutboxEntry<TPayload = Record<string, unknown>> {
  outboxEntryId: string;
  queueRef: EventSpineQueueRef;
  producerServiceRef: string;
  commandSettlementRef: string | null;
  orderingKey: string;
  orderingSequence: number;
  effectKey: string;
  dispatchState: OutboxDispatchState;
  attemptCount: number;
  brokerMessageId: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
  publishedAt: string | null;
  quarantinedAt: string | null;
  quarantineReason: string | null;
  event: CanonicalEventEnvelope<TPayload>;
}

export interface OutboxDispatchAttempt {
  dispatchAttemptId: string;
  outboxEntryRef: string;
  queueRef: EventSpineQueueRef;
  claimedBy: string;
  attemptNumber: number;
  brokerMessageId: string | null;
  claimedAt: string;
  finishedAt: string | null;
  outcomeState: "claimed" | "published" | "quarantined";
  effectKey: string;
  edgeCorrelationId: string;
  causalToken: string;
}

export interface OutboxCheckpoint {
  checkpointId: string;
  queueRef: EventSpineQueueRef;
  orderingKey: string;
  lastPublishedSequence: number;
  lastPublishedEventId: string | null;
  updatedAt: string;
}

export interface InboxReceipt<TPayload = Record<string, unknown>> {
  inboxReceiptId: string;
  consumerGroupRef: EventSpineConsumerGroupRef;
  queueRef: EventSpineQueueRef;
  dedupeKey: string;
  orderingKey: string;
  sequence: number;
  receiptState: InboxReceiptState;
  receivedAt: string;
  callbackCorrelationKey: string | null;
  gapExpectedSequence: number | null;
  quarantineReason: string | null;
  effectKey: string;
  event: CanonicalEventEnvelope<TPayload>;
}

export interface InboxCheckpoint {
  checkpointId: string;
  consumerGroupRef: EventSpineConsumerGroupRef;
  orderingKey: string;
  nextExpectedSequence: number;
  lastAcceptedEventId: string | null;
  lastAcceptedAt: string | null;
  callbackCorrelationKey: string | null;
  updatedAt: string;
}

export interface ReplayReview {
  replayReviewId: string;
  consumerGroupRef: EventSpineConsumerGroupRef;
  queueRef: EventSpineQueueRef;
  eventName: string;
  eventId: string;
  dedupeKey: string;
  expectedSequence: number;
  actualSequence: number;
  callbackCorrelationKey: string | null;
  openedAt: string;
  reason: "ordering_gap" | "manual_quarantine";
}

export interface EnqueueOutboxInput<TPayload = Record<string, unknown>> {
  queueRef: EventSpineQueueRef;
  producerServiceRef: string;
  commandSettlementRef?: string | null;
  orderingKey: string;
  effectKey?: string | null;
  event: CanonicalEventEnvelope<TPayload>;
}

export interface ReceiveInboxInput<TPayload = Record<string, unknown>> {
  consumerGroupRef: EventSpineConsumerGroupRef;
  queueRef: EventSpineQueueRef;
  orderingKey: string;
  sequence: number;
  dedupeKey?: string | null;
  callbackCorrelationKey?: string | null;
  quarantineReason?: string | null;
  event: CanonicalEventEnvelope<TPayload>;
  effectKey?: string | null;
  receivedAt: string;
}

export interface EventSpineSimulationScenario {
  scenarioId: string;
  title: string;
  eventName: string;
  queueRefs: readonly EventSpineQueueRef[];
  consumerGroupRef: EventSpineConsumerGroupRef;
  producerServiceRef: string;
  orderingKey: string;
  queueDuplicateDelivery?: boolean;
  forceGapForQueueRef?: EventSpineQueueRef | null;
  quarantineQueueRef?: EventSpineQueueRef | null;
}

export interface EventSpineScenarioResult {
  scenarioId: string;
  eventName: string;
  effectKey: string;
  edgeCorrelationId: string;
  publishedQueueRefs: readonly EventSpineQueueRef[];
  acceptedReceiptCount: number;
  duplicateReceiptCount: number;
  gapBlockedReceiptCount: number;
  quarantineQueueRefs: readonly EventSpineQueueRef[];
  replayReviewRefs: readonly string[];
  lastCheckpointSequence: number;
}

export interface EventSpineStoreSnapshot {
  outboxEntries: readonly OutboxEntry[];
  outboxDispatchAttempts: readonly OutboxDispatchAttempt[];
  outboxCheckpoints: readonly OutboxCheckpoint[];
  inboxReceipts: readonly InboxReceipt[];
  inboxCheckpoints: readonly InboxCheckpoint[];
  replayReviews: readonly ReplayReview[];
}

export class EventSpineInvariantError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EventSpineInvariantError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new EventSpineInvariantError(code, message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function stableDigestHex(value: string): string {
  let left = 0x811c9dc5 ^ value.length;
  let right = 0x9e3779b9 ^ value.length;
  let upper = 0xc2b2ae35 ^ value.length;
  let lower = 0x27d4eb2f ^ value.length;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ code, 0x85ebca6b);
    upper = Math.imul(upper ^ code, 0xc2b2ae35);
    lower = Math.imul(lower ^ code, 0x27d4eb2f);
  }

  left = Math.imul(left ^ (right >>> 16), 0x85ebca6b);
  right = Math.imul(right ^ (upper >>> 13), 0xc2b2ae35);
  upper = Math.imul(upper ^ (lower >>> 16), 0x27d4eb2f);
  lower = Math.imul(lower ^ (left >>> 15), 0x165667b1);

  return [left, right, upper, lower]
    .map((segment) => (segment >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

function checkpointKey(consumerGroupRef: EventSpineConsumerGroupRef, orderingKey: string): string {
  return `${consumerGroupRef}::${orderingKey}`;
}

function outboxOrderingKey(queueRef: EventSpineQueueRef, orderingKey: string): string {
  return `${queueRef}::${orderingKey}`;
}

export function createDeterministicEventSpineIdGenerator(
  seed = "event_spine",
): EventSpineIdGenerator {
  const counters = new Map<EventSpineIdKind, number>();
  return {
    nextId(kind: EventSpineIdKind): string {
      const next = (counters.get(kind) ?? 0) + 1;
      counters.set(kind, next);
      return `${seed}_${kind}_${String(next).padStart(4, "0")}`;
    },
  };
}

export function makeCanonicalEventEnvelope<TPayload = Record<string, unknown>>(input: {
  eventId?: string | null;
  tenantId: string;
  eventName: string;
  schemaVersionRef: string;
  sourceBoundedContextRef: string;
  governingBoundedContextRef: string;
  edgeCorrelationId: string;
  causalToken: string;
  emittedAt: string;
  payload: TPayload;
}): CanonicalEventEnvelope<TPayload> {
  const payloadDigest = stableDigestHex(stableStringify(input.payload));
  return {
    eventId:
      input.eventId?.trim() ||
      `evt_${stableDigestHex(
        `${input.eventName}::${input.edgeCorrelationId}::${input.causalToken}::${payloadDigest}`,
      )}`,
    tenantId: requireRef(input.tenantId, "tenantId"),
    eventName: requireRef(input.eventName, "eventName"),
    schemaVersionRef: requireRef(input.schemaVersionRef, "schemaVersionRef"),
    sourceBoundedContextRef: requireRef(input.sourceBoundedContextRef, "sourceBoundedContextRef"),
    governingBoundedContextRef: requireRef(
      input.governingBoundedContextRef,
      "governingBoundedContextRef",
    ),
    edgeCorrelationId: requireRef(input.edgeCorrelationId, "edgeCorrelationId"),
    causalToken: requireRef(input.causalToken, "causalToken"),
    emittedAt: ensureIsoTimestamp(input.emittedAt, "emittedAt"),
    payloadDigest,
    payload: input.payload,
  };
}

export function makeCanonicalEffectKey(input: {
  queueRef: EventSpineQueueRef;
  orderingKey: string;
  eventName: string;
  governingObjectRef: string;
  causalToken: string;
}): string {
  return `effect::${stableDigestHex(
    stableStringify({
      queueRef: requireRef(input.queueRef, "queueRef"),
      orderingKey: requireRef(input.orderingKey, "orderingKey"),
      eventName: requireRef(input.eventName, "eventName"),
      governingObjectRef: requireRef(input.governingObjectRef, "governingObjectRef"),
      causalToken: requireRef(input.causalToken, "causalToken"),
    }),
  )}`;
}

export function makeInboxDedupeKey(input: {
  consumerGroupRef: EventSpineConsumerGroupRef;
  eventId: string;
  queueRef: EventSpineQueueRef;
}): string {
  return `dedupe::${stableDigestHex(
    `${requireRef(input.consumerGroupRef, "consumerGroupRef")}::${requireRef(input.queueRef, "queueRef")}::${requireRef(input.eventId, "eventId")}`,
  )}`;
}

export class EventSpineStore {
  private readonly outboxEntries = new Map<string, OutboxEntry<Record<string, unknown>>>();
  private readonly outboxEntriesByEffectKey = new Map<
    string,
    OutboxEntry<Record<string, unknown>>
  >();
  private readonly outboxDispatchAttempts = new Map<string, OutboxDispatchAttempt>();
  private readonly outboxCheckpoints = new Map<string, OutboxCheckpoint>();
  private readonly inboxReceipts = new Map<string, InboxReceipt<Record<string, unknown>>>();
  private readonly inboxReceiptsByDedupeKey = new Map<
    string,
    InboxReceipt<Record<string, unknown>>
  >();
  private readonly inboxCheckpoints = new Map<string, InboxCheckpoint>();
  private readonly replayReviews = new Map<string, ReplayReview>();
  private readonly nextOutboxSequence = new Map<string, number>();

  constructor(
    private readonly idGenerator: EventSpineIdGenerator = createDeterministicEventSpineIdGenerator(),
  ) {}

  enqueueOutbox<TPayload extends Record<string, unknown> = Record<string, unknown>>(
    input: EnqueueOutboxInput<TPayload>,
  ): OutboxEntry<TPayload> {
    const effectKey =
      input.effectKey?.trim() ||
      makeCanonicalEffectKey({
        queueRef: input.queueRef,
        orderingKey: input.orderingKey,
        eventName: input.event.eventName,
        governingObjectRef: input.event.eventId,
        causalToken: input.event.causalToken,
      });
    const duplicate = this.outboxEntriesByEffectKey.get(effectKey) as
      | OutboxEntry<TPayload>
      | undefined;
    if (duplicate) {
      return duplicate;
    }

    const orderingStateKey = outboxOrderingKey(input.queueRef, input.orderingKey);
    const orderingSequence = (this.nextOutboxSequence.get(orderingStateKey) ?? 0) + 1;
    this.nextOutboxSequence.set(orderingStateKey, orderingSequence);

    const entry: OutboxEntry<TPayload> = {
      outboxEntryId: this.idGenerator.nextId("outboxEntry"),
      queueRef: input.queueRef,
      producerServiceRef: requireRef(input.producerServiceRef, "producerServiceRef"),
      commandSettlementRef: input.commandSettlementRef?.trim() || null,
      orderingKey: requireRef(input.orderingKey, "orderingKey"),
      orderingSequence,
      effectKey,
      dispatchState: "pending",
      attemptCount: 0,
      brokerMessageId: null,
      claimedBy: null,
      claimedAt: null,
      publishedAt: null,
      quarantinedAt: null,
      quarantineReason: null,
      event: input.event,
    };

    this.outboxEntries.set(entry.outboxEntryId, entry);
    this.outboxEntriesByEffectKey.set(effectKey, entry);
    return entry;
  }

  claimOutbox(input: {
    queueRef: EventSpineQueueRef;
    claimedBy: string;
    claimedAt: string;
    limit?: number;
  }): readonly OutboxEntry[] {
    const claimedAt = ensureIsoTimestamp(input.claimedAt, "claimedAt");
    const limit = Math.max(1, input.limit ?? 50);
    const entries = [...this.outboxEntries.values()]
      .filter((entry) => entry.queueRef === input.queueRef && entry.dispatchState === "pending")
      .sort((left, right) => left.orderingSequence - right.orderingSequence)
      .slice(0, limit);

    return entries.map((entry) => {
      entry.dispatchState = "claimed";
      entry.claimedBy = requireRef(input.claimedBy, "claimedBy");
      entry.claimedAt = claimedAt;
      entry.attemptCount += 1;
      const attempt: OutboxDispatchAttempt = {
        dispatchAttemptId: this.idGenerator.nextId("outboxDispatchAttempt"),
        outboxEntryRef: entry.outboxEntryId,
        queueRef: entry.queueRef,
        claimedBy: entry.claimedBy,
        attemptNumber: entry.attemptCount,
        brokerMessageId: null,
        claimedAt,
        finishedAt: null,
        outcomeState: "claimed",
        effectKey: entry.effectKey,
        edgeCorrelationId: entry.event.edgeCorrelationId,
        causalToken: entry.event.causalToken,
      };
      this.outboxDispatchAttempts.set(attempt.dispatchAttemptId, attempt);
      return entry;
    });
  }

  markOutboxPublished(input: {
    outboxEntryId: string;
    brokerMessageId: string;
    publishedAt: string;
  }): OutboxEntry {
    const entry = this.getOutboxEntry(input.outboxEntryId);
    entry.dispatchState = "published";
    entry.brokerMessageId = requireRef(input.brokerMessageId, "brokerMessageId");
    entry.publishedAt = ensureIsoTimestamp(input.publishedAt, "publishedAt");

    const attempt = [...this.outboxDispatchAttempts.values()]
      .filter((candidate) => candidate.outboxEntryRef === entry.outboxEntryId)
      .sort((left, right) => left.attemptNumber - right.attemptNumber)
      .at(-1);
    if (attempt) {
      attempt.brokerMessageId = entry.brokerMessageId;
      attempt.finishedAt = entry.publishedAt;
      attempt.outcomeState = "published";
    }

    const key = outboxOrderingKey(entry.queueRef, entry.orderingKey);
    const checkpoint = this.outboxCheckpoints.get(key);
    if (checkpoint) {
      checkpoint.lastPublishedSequence = Math.max(
        checkpoint.lastPublishedSequence,
        entry.orderingSequence,
      );
      checkpoint.lastPublishedEventId = entry.event.eventId;
      checkpoint.updatedAt = entry.publishedAt;
    } else {
      this.outboxCheckpoints.set(key, {
        checkpointId: this.idGenerator.nextId("outboxCheckpoint"),
        queueRef: entry.queueRef,
        orderingKey: entry.orderingKey,
        lastPublishedSequence: entry.orderingSequence,
        lastPublishedEventId: entry.event.eventId,
        updatedAt: entry.publishedAt,
      });
    }
    return entry;
  }

  quarantineOutbox(input: {
    outboxEntryId: string;
    quarantinedAt: string;
    reason: string;
  }): OutboxEntry {
    const entry = this.getOutboxEntry(input.outboxEntryId);
    entry.dispatchState = "quarantined";
    entry.quarantinedAt = ensureIsoTimestamp(input.quarantinedAt, "quarantinedAt");
    entry.quarantineReason = requireRef(input.reason, "reason");
    const attempt = [...this.outboxDispatchAttempts.values()]
      .filter((candidate) => candidate.outboxEntryRef === entry.outboxEntryId)
      .sort((left, right) => left.attemptNumber - right.attemptNumber)
      .at(-1);
    if (attempt) {
      attempt.finishedAt = entry.quarantinedAt;
      attempt.outcomeState = "quarantined";
    }
    return entry;
  }

  receiveInbox<TPayload extends Record<string, unknown> = Record<string, unknown>>(
    input: ReceiveInboxInput<TPayload>,
  ): InboxReceipt<TPayload> {
    const dedupeKey =
      input.dedupeKey?.trim() ||
      makeInboxDedupeKey({
        consumerGroupRef: input.consumerGroupRef,
        queueRef: input.queueRef,
        eventId: input.event.eventId,
      });
    const duplicate = this.inboxReceiptsByDedupeKey.get(dedupeKey) as
      | InboxReceipt<TPayload>
      | undefined;
    if (duplicate) {
      return {
        ...duplicate,
        receiptState: "duplicate_ignored",
        gapExpectedSequence: null,
        quarantineReason: null,
      };
    }

    const checkpointId = checkpointKey(input.consumerGroupRef, input.orderingKey);
    const checkpoint =
      this.inboxCheckpoints.get(checkpointId) ??
      ({
        checkpointId: this.idGenerator.nextId("inboxCheckpoint"),
        consumerGroupRef: input.consumerGroupRef,
        orderingKey: requireRef(input.orderingKey, "orderingKey"),
        nextExpectedSequence: 1,
        lastAcceptedEventId: null,
        lastAcceptedAt: null,
        callbackCorrelationKey: input.callbackCorrelationKey?.trim() || null,
        updatedAt: ensureIsoTimestamp(input.receivedAt, "receivedAt"),
      } satisfies InboxCheckpoint);

    let receiptState: InboxReceiptState = "accepted";
    let gapExpectedSequence: number | null = null;
    let quarantineReason = input.quarantineReason?.trim() || null;

    if (input.sequence < checkpoint.nextExpectedSequence) {
      receiptState = "duplicate_ignored";
    } else if (input.sequence > checkpoint.nextExpectedSequence) {
      receiptState = "gap_blocked";
      gapExpectedSequence = checkpoint.nextExpectedSequence;
      const review: ReplayReview = {
        replayReviewId: this.idGenerator.nextId("replayReview"),
        consumerGroupRef: input.consumerGroupRef,
        queueRef: input.queueRef,
        eventName: input.event.eventName,
        eventId: input.event.eventId,
        dedupeKey,
        expectedSequence: checkpoint.nextExpectedSequence,
        actualSequence: input.sequence,
        callbackCorrelationKey: input.callbackCorrelationKey?.trim() || null,
        openedAt: ensureIsoTimestamp(input.receivedAt, "receivedAt"),
        reason: "ordering_gap",
      };
      this.replayReviews.set(review.replayReviewId, review);
    } else if (quarantineReason) {
      receiptState = "quarantined";
      const review: ReplayReview = {
        replayReviewId: this.idGenerator.nextId("replayReview"),
        consumerGroupRef: input.consumerGroupRef,
        queueRef: input.queueRef,
        eventName: input.event.eventName,
        eventId: input.event.eventId,
        dedupeKey,
        expectedSequence: checkpoint.nextExpectedSequence,
        actualSequence: input.sequence,
        callbackCorrelationKey: input.callbackCorrelationKey?.trim() || null,
        openedAt: ensureIsoTimestamp(input.receivedAt, "receivedAt"),
        reason: "manual_quarantine",
      };
      this.replayReviews.set(review.replayReviewId, review);
    }

    const receipt: InboxReceipt<TPayload> = {
      inboxReceiptId: this.idGenerator.nextId("inboxReceipt"),
      consumerGroupRef: input.consumerGroupRef,
      queueRef: input.queueRef,
      dedupeKey,
      orderingKey: requireRef(input.orderingKey, "orderingKey"),
      sequence: input.sequence,
      receiptState,
      receivedAt: ensureIsoTimestamp(input.receivedAt, "receivedAt"),
      callbackCorrelationKey: input.callbackCorrelationKey?.trim() || null,
      gapExpectedSequence,
      quarantineReason,
      effectKey:
        input.effectKey?.trim() ||
        makeCanonicalEffectKey({
          queueRef: input.queueRef,
          orderingKey: input.orderingKey,
          eventName: input.event.eventName,
          governingObjectRef: input.event.eventId,
          causalToken: input.event.causalToken,
        }),
      event: input.event,
    };

    if (receiptState === "accepted") {
      checkpoint.nextExpectedSequence = input.sequence + 1;
      checkpoint.lastAcceptedEventId = input.event.eventId;
      checkpoint.lastAcceptedAt = receipt.receivedAt;
      checkpoint.callbackCorrelationKey =
        receipt.callbackCorrelationKey ?? checkpoint.callbackCorrelationKey;
      checkpoint.updatedAt = receipt.receivedAt;
      this.inboxCheckpoints.set(checkpointId, checkpoint);
    } else if (!this.inboxCheckpoints.has(checkpointId)) {
      this.inboxCheckpoints.set(checkpointId, checkpoint);
    }

    this.inboxReceipts.set(receipt.inboxReceiptId, receipt);
    this.inboxReceiptsByDedupeKey.set(dedupeKey, receipt);
    return receipt;
  }

  getOutboxEntry(outboxEntryId: string): OutboxEntry {
    const entry = this.outboxEntries.get(requireRef(outboxEntryId, "outboxEntryId"));
    invariant(entry, "UNKNOWN_OUTBOX_ENTRY", `Outbox entry ${outboxEntryId} was not found.`);
    return entry;
  }

  getInboxCheckpoint(
    consumerGroupRef: EventSpineConsumerGroupRef,
    orderingKey: string,
  ): InboxCheckpoint | null {
    return this.inboxCheckpoints.get(checkpointKey(consumerGroupRef, orderingKey)) ?? null;
  }

  toSnapshot(): EventSpineStoreSnapshot {
    return {
      outboxEntries: [...this.outboxEntries.values()].sort((left, right) =>
        left.outboxEntryId.localeCompare(right.outboxEntryId),
      ),
      outboxDispatchAttempts: [...this.outboxDispatchAttempts.values()].sort((left, right) =>
        left.dispatchAttemptId.localeCompare(right.dispatchAttemptId),
      ),
      outboxCheckpoints: [...this.outboxCheckpoints.values()].sort((left, right) =>
        `${left.queueRef}::${left.orderingKey}`.localeCompare(
          `${right.queueRef}::${right.orderingKey}`,
        ),
      ),
      inboxReceipts: [...this.inboxReceipts.values()].sort((left, right) =>
        left.inboxReceiptId.localeCompare(right.inboxReceiptId),
      ),
      inboxCheckpoints: [...this.inboxCheckpoints.values()].sort((left, right) =>
        `${left.consumerGroupRef}::${left.orderingKey}`.localeCompare(
          `${right.consumerGroupRef}::${right.orderingKey}`,
        ),
      ),
      replayReviews: [...this.replayReviews.values()].sort((left, right) =>
        left.replayReviewId.localeCompare(right.replayReviewId),
      ),
    };
  }
}

function envelopeForScenario(input: {
  scenarioId: string;
  eventName: string;
  emittedAt: string;
}): CanonicalEventEnvelope {
  return makeCanonicalEventEnvelope({
    tenantId: "tenant_evt_087",
    eventId: `${input.scenarioId}::${input.eventName}`,
    eventName: input.eventName,
    schemaVersionRef: `schema::${input.eventName.replace(/\./g, "_")}@v1`,
    sourceBoundedContextRef: "platform_runtime",
    governingBoundedContextRef: input.eventName.split(".")[0] ?? "platform_runtime",
    edgeCorrelationId: `${input.scenarioId}::corr`,
    causalToken: `${input.scenarioId}::causal`,
    emittedAt: input.emittedAt,
    payload: {
      scenarioId: input.scenarioId,
      eventName: input.eventName,
    },
  });
}

export function createEventSpineSimulationScenarios(): readonly EventSpineSimulationScenario[] {
  return [
    {
      scenarioId: "quarantine_attachment_flow",
      title: "Quarantine keeps canonical identity visible through replay review.",
      eventName: "intake.attachment.quarantined",
      queueRefs: ["q_event_projection_live", "q_event_replay_quarantine"],
      consumerGroupRef: "cg_replay_quarantine_review",
      producerServiceRef: "service_command_api",
      orderingKey: "lineage_evt_087_quarantine",
      quarantineQueueRef: "q_event_replay_quarantine",
    },
    {
      scenarioId: "patient_receipt_degraded_flow",
      title: "Degraded patient receipt remains ordered and replay-safe.",
      eventName: "patient.receipt.degraded",
      queueRefs: ["q_event_projection_live", "q_event_notification_effects"],
      consumerGroupRef: "cg_notification_dispatch",
      producerServiceRef: "service_notification_worker",
      orderingKey: "receipt_evt_087_degraded",
      queueDuplicateDelivery: true,
    },
    {
      scenarioId: "telephony_manual_review_flow",
      title: "Telephony manual review stays correlated through callback checkpoints.",
      eventName: "telephony.manual_review.required",
      queueRefs: ["q_event_integration_effects", "q_event_callback_correlation"],
      consumerGroupRef: "cg_callback_receipt_ingest",
      producerServiceRef: "service_adapter_simulators",
      orderingKey: "telephony_evt_087_review",
    },
    {
      scenarioId: "reachability_failure_flow",
      title: "Reachability failures open ordered repair work without shadow events.",
      eventName: "reachability.dependency.failed",
      queueRefs: ["q_event_projection_live", "q_event_callback_correlation"],
      consumerGroupRef: "cg_callback_receipt_ingest",
      producerServiceRef: "service_adapter_simulators",
      orderingKey: "reachability_evt_087_failure",
      forceGapForQueueRef: "q_event_callback_correlation",
    },
    {
      scenarioId: "confirmation_gate_flow",
      title: "Confirmation gates preserve callback correlation and audit observation.",
      eventName: "confirmation.gate.created",
      queueRefs: [
        "q_event_projection_live",
        "q_event_integration_effects",
        "q_event_assurance_audit",
      ],
      consumerGroupRef: "cg_integration_dispatch",
      producerServiceRef: "service_command_api",
      orderingKey: "confirmation_evt_087_gate",
    },
    {
      scenarioId: "closure_blocker_flow",
      title: "Closure blockers remain first-class replay and projection events.",
      eventName: "request.closure_blockers.changed",
      queueRefs: [
        "q_event_projection_live",
        "q_event_assurance_audit",
        "q_event_replay_quarantine",
      ],
      consumerGroupRef: "cg_assurance_observe",
      producerServiceRef: "service_command_api",
      orderingKey: "closure_evt_087_blockers",
    },
  ] as const;
}

export function runEventSpineSimulationScenarios(
  store = new EventSpineStore(createDeterministicEventSpineIdGenerator("par_087")),
): readonly EventSpineScenarioResult[] {
  return createEventSpineSimulationScenarios().map((scenario, index) => {
    const emittedAt = new Date(Date.UTC(2026, 3, 12, 9, 0, index)).toISOString();
    const envelope = envelopeForScenario({
      scenarioId: scenario.scenarioId,
      eventName: scenario.eventName,
      emittedAt,
    });
    const primaryQueueRef = scenario.queueRefs[0]!;
    const resultCheckpointConsumerGroupRef = (
      scenario.forceGapForQueueRef
        ? queueConsumerGroupByRef[scenario.forceGapForQueueRef]
        : queueConsumerGroupByRef[primaryQueueRef]
    ).consumerGroupRef;
    const effectKey = makeCanonicalEffectKey({
      queueRef: primaryQueueRef,
      orderingKey: scenario.orderingKey,
      eventName: scenario.eventName,
      governingObjectRef: envelope.eventId,
      causalToken: envelope.causalToken,
    });
    const publishedQueueRefs: EventSpineQueueRef[] = [];
    const quarantineQueueRefs: EventSpineQueueRef[] = [];
    let acceptedReceiptCount = 0;
    let duplicateReceiptCount = 0;
    let gapBlockedReceiptCount = 0;

    scenario.queueRefs.forEach((queueRef, queueIndex) => {
      const consumerGroupRef = queueConsumerGroupByRef[queueRef].consumerGroupRef;
      const outboxEntry = store.enqueueOutbox({
        queueRef,
        producerServiceRef: scenario.producerServiceRef,
        orderingKey: scenario.orderingKey,
        effectKey: `${effectKey}::${queueRef}`,
        event: envelope,
      });
      store.claimOutbox({
        queueRef,
        claimedBy: `${consumerGroupRef}::worker`,
        claimedAt: emittedAt,
      });
      if (scenario.quarantineQueueRef === queueRef) {
        store.quarantineOutbox({
          outboxEntryId: outboxEntry.outboxEntryId,
          quarantinedAt: emittedAt,
          reason: "manual_replay_required",
        });
        quarantineQueueRefs.push(queueRef);
        return;
      }

      store.markOutboxPublished({
        outboxEntryId: outboxEntry.outboxEntryId,
        brokerMessageId: `${scenario.scenarioId}::${queueRef}`,
        publishedAt: emittedAt,
      });
      publishedQueueRefs.push(queueRef);

      const sequence =
        scenario.forceGapForQueueRef === queueRef && queueIndex === scenario.queueRefs.length - 1
          ? outboxEntry.orderingSequence + 1
          : outboxEntry.orderingSequence;
      const receipt = store.receiveInbox({
        consumerGroupRef,
        queueRef,
        orderingKey: scenario.orderingKey,
        sequence,
        callbackCorrelationKey:
          queueRef === "q_event_callback_correlation" ? `${scenario.scenarioId}::callback` : null,
        receivedAt: emittedAt,
        effectKey: outboxEntry.effectKey,
        event: envelope,
      });
      if (receipt.receiptState === "accepted") {
        acceptedReceiptCount += 1;
      } else if (receipt.receiptState === "duplicate_ignored") {
        duplicateReceiptCount += 1;
      } else if (receipt.receiptState === "gap_blocked") {
        gapBlockedReceiptCount += 1;
      }

      if (scenario.queueDuplicateDelivery) {
        const duplicate = store.receiveInbox({
          consumerGroupRef,
          queueRef,
          orderingKey: scenario.orderingKey,
          sequence: outboxEntry.orderingSequence,
          callbackCorrelationKey:
            queueRef === "q_event_callback_correlation" ? `${scenario.scenarioId}::callback` : null,
          receivedAt: emittedAt,
          effectKey: outboxEntry.effectKey,
          event: envelope,
        });
        if (duplicate.receiptState === "duplicate_ignored") {
          duplicateReceiptCount += 1;
        }
      }
    });

    const checkpoint = store.getInboxCheckpoint(
      resultCheckpointConsumerGroupRef,
      scenario.orderingKey,
    );
    const snapshot = store.toSnapshot();
    const replayReviewRefs = snapshot.replayReviews
      .filter((review) => review.eventId === envelope.eventId)
      .map((review) => review.replayReviewId);

    return {
      scenarioId: scenario.scenarioId,
      eventName: scenario.eventName,
      effectKey,
      edgeCorrelationId: envelope.edgeCorrelationId,
      publishedQueueRefs,
      acceptedReceiptCount,
      duplicateReceiptCount,
      gapBlockedReceiptCount,
      quarantineQueueRefs,
      replayReviewRefs,
      lastCheckpointSequence: (checkpoint?.nextExpectedSequence ?? 1) - 1,
    };
  });
}
