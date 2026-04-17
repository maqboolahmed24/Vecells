import { createHash } from "node:crypto";
import {
  buildSupportCommunicationHashBundle,
  canPublishSupportResolutionSnapshot,
  deriveSupportAllowedActionRefs,
  deriveSupportCommunicationReasonCategory,
  deriveSupportCommunicationSeverity,
  normalizeSupportCommunicationSettlement,
  SUPPORT_RESOLUTION_SNAPSHOT_BUILDER_NAME,
  type SupportCommunicationActionScope,
  type SupportCommunicationDomain,
  type SupportCommunicationSettlementResult,
  type SupportResolutionConfirmationState,
} from "@vecells/domain-support";
import type { BackboneIdGenerator } from "@vecells/domain-kernel";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createInMemorySupportLineageProjectionRepository,
  createSupportLineageTicketSubjectHistoryApplication,
  type SupportLineageArtifactBinding,
  type SupportLineageBinding,
  type SupportLineageFixture,
  type SupportLineageScopeMember,
  type SupportTicket,
  type SupportTicketWorkspaceResult,
} from "./support-lineage-ticket-subject-history";
import {
  createPhase3CallbackDomainApplication,
  phase3CallbackMigrationPlanRefs,
  phase3CallbackPersistenceTables,
  type Phase3CallbackApplicationBundle,
  type Phase3CallbackDomainApplication,
} from "./phase3-callback-domain";
import {
  createPhase3ClinicianMessageDomainApplication,
  phase3ClinicianMessageMigrationPlanRefs,
  phase3ClinicianMessagePersistenceTables,
  type Phase3ClinicianMessageApplicationBundle,
  type Phase3ClinicianMessageDomainApplication,
} from "./phase3-clinician-message-domain";
import {
  createPhase3CommunicationReachabilityRepairApplication,
  phase3CommunicationRepairMigrationPlanRefs,
  phase3CommunicationRepairPersistenceTables,
  type CommunicationRepairBindingBundle,
  type Phase3CommunicationRepairApplication,
} from "./phase3-communication-reachability-repair";

export const PHASE3_SUPPORT_COMMUNICATION_LINKAGE_SERVICE_NAME =
  "Phase3SupportCommunicationLinkageApplication";
export const PHASE3_SUPPORT_COMMUNICATION_LINKAGE_SCHEMA_VERSION =
  "248.phase3.support-communication-linkage.v1";
export const PHASE3_SUPPORT_COMMUNICATION_LINKAGE_QUERY_SURFACES = [
  "POST /internal/v1/workspace/tasks/{taskId}:open-support-communication-failure",
  "GET /ops/support/tickets/{supportTicketId}/communication-failure-linkage",
  "POST /ops/support/tickets/{supportTicketId}:record-communication-action",
  "POST /ops/support/tickets/{supportTicketId}:publish-resolution-snapshot",
] as const;

export const phase3SupportCommunicationLinkageRoutes = [
  {
    routeId: "workspace_task_open_support_communication_failure",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:open-support-communication-failure",
    contractFamily: "OpenSupportCommunicationFailureCommandContract",
    purpose:
      "Open or attach one governed SupportTicket for an active callback or clinician-message failure path without creating a second detached support truth chain.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "support_ticket_communication_failure_linkage_current",
    method: "GET",
    path: "/ops/support/tickets/{supportTicketId}/communication-failure-linkage",
    contractFamily: "SupportCommunicationFailureLinkageBundleContract",
    purpose:
      "Resolve the current communication-bound support ticket, lineage binding, scope members, provenance bindings, latest action and settlement, resolution snapshot, and 218-style workspace projection over the same callback or message failure tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "support_ticket_record_communication_action",
    method: "POST",
    path: "/ops/support/tickets/{supportTicketId}:record-communication-action",
    contractFamily: "RecordSupportCommunicationActionCommandContract",
    purpose:
      "Record one communication-aware SupportActionRecord and SupportActionSettlement over the current callback or message failure tuple, failing closed when ticket version, lineage binding hash, or governing tuple drift.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "support_ticket_publish_resolution_snapshot",
    method: "POST",
    path: "/ops/support/tickets/{supportTicketId}:publish-resolution-snapshot",
    contractFamily: "PublishSupportResolutionSnapshotCommandContract",
    purpose:
      "Publish a provenance-bound SupportResolutionSnapshot only after authoritative settlement and current SupportLineageArtifactBinding proof exist for the cited summary or handoff note.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3SupportCommunicationLinkagePersistenceTables = [
  ...new Set([
    ...phase3CallbackPersistenceTables,
    ...phase3ClinicianMessagePersistenceTables,
    ...phase3CommunicationRepairPersistenceTables,
    "phase3_support_tickets",
    "phase3_support_lineage_bindings",
    "phase3_support_lineage_scope_members",
    "phase3_support_lineage_artifact_bindings",
    "phase3_support_action_records",
    "phase3_support_action_settlements",
    "phase3_support_resolution_snapshots",
  ]),
] as const;

export const phase3SupportCommunicationLinkageMigrationPlanRefs = [
  ...new Set([
    ...phase3CallbackMigrationPlanRefs,
    ...phase3ClinicianMessageMigrationPlanRefs,
    ...phase3CommunicationRepairMigrationPlanRefs,
    "services/command-api/migrations/124_phase3_support_communication_failure_linkage.sql",
  ]),
] as const;

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
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

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function stableHash(parts: readonly unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
}

function stableRef(prefix: string, parts: readonly unknown[]): string {
  return `${prefix}_${stableHash(parts)}`;
}

function nextApplicationId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

export interface SupportCommunicationContext {
  readonly communicationDomain: SupportCommunicationDomain;
  readonly taskId: string;
  readonly requestId: string;
  readonly requestLineageRef: string;
  readonly lineageCaseLinkRef: string;
  readonly governingObjectDescriptorRef: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string;
  readonly governingThreadRef: string;
  readonly governingSubthreadRef: string | null;
  readonly governingThreadTupleHash: string;
  readonly governingSubthreadTupleHash: string;
  readonly communicationChainHash: string;
  readonly routeIntentBindingRef: string;
  readonly sourceArtifactRef: string | null;
  readonly sourceEvidenceSnapshotRef: string | null;
  readonly messageDispatchEnvelopeRef: string | null;
  readonly latestDeliveryEvidenceBundleRef: string | null;
  readonly latestThreadExpectationEnvelopeRef: string | null;
  readonly latestThreadResolutionGateRef: string | null;
  readonly callbackCaseRef: string | null;
  readonly latestCallbackExpectationEnvelopeRef: string | null;
  readonly latestCallbackOutcomeEvidenceBundleRef: string | null;
  readonly latestCallbackResolutionGateRef: string | null;
  readonly reachabilityDependencyRef: string | null;
  readonly reachabilityAssessmentRef: string | null;
  readonly reachabilityEpoch: number;
  readonly contactRepairJourneyRef: string | null;
  readonly subjectRef: string;
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly reasonCategory: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly allowedActionRefs: readonly SupportCommunicationActionScope[];
  readonly failureState: string;
}

export interface SupportCommunicationActionRecordSnapshot {
  readonly projectionName: "SupportActionRecord";
  readonly supportActionRecordId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageScopeMemberRef: string;
  readonly actionScope: SupportCommunicationActionScope;
  readonly governingObjectRef: string;
  readonly governingThreadRef: string;
  readonly governingSubthreadRef: string | null;
  readonly governingThreadVersionRef: string;
  readonly governingThreadTupleHash: string;
  readonly governingSubthreadTupleHash: string;
  readonly routeProfileRef: string;
  readonly policyBundleRef: string;
  readonly routeIntentBindingRef: string;
  readonly commandActionRecordRef: string;
  readonly messageDispatchEnvelopeRef: string | null;
  readonly latestDeliveryEvidenceBundleRef: string | null;
  readonly latestThreadExpectationEnvelopeRef: string | null;
  readonly latestThreadResolutionGateRef: string | null;
  readonly callbackCaseRef: string | null;
  readonly latestCallbackExpectationEnvelopeRef: string | null;
  readonly latestCallbackOutcomeEvidenceBundleRef: string | null;
  readonly latestCallbackResolutionGateRef: string | null;
  readonly supportMutationAttemptRef: string | null;
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly transitionEnvelopeRef: string;
  readonly releaseRecoveryDispositionRef: string | null;
  readonly fenceEpoch: number;
  readonly reasonCode: string;
  readonly jitScopeRef: string;
  readonly dualControlState: "not_required" | "satisfied";
  readonly idempotencyKey: string;
  readonly createdByRef: string;
  readonly createdAt: string;
  readonly settledAt: string | null;
}

export interface SupportCommunicationActionSettlementSnapshot {
  readonly projectionName: "SupportActionSettlement";
  readonly supportActionSettlementId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageScopeMemberRef: string;
  readonly supportActionRecordId: string | null;
  readonly commandSettlementRecordRef: string;
  readonly governingThreadRef: string;
  readonly governingSubthreadRef: string | null;
  readonly governingThreadTupleHash: string;
  readonly governingSubthreadTupleHash: string;
  readonly messageDispatchEnvelopeRef: string | null;
  readonly latestDeliveryEvidenceBundleRef: string | null;
  readonly latestThreadExpectationEnvelopeRef: string | null;
  readonly latestThreadResolutionGateRef: string | null;
  readonly callbackCaseRef: string | null;
  readonly latestCallbackExpectationEnvelopeRef: string | null;
  readonly latestCallbackOutcomeEvidenceBundleRef: string | null;
  readonly latestCallbackResolutionGateRef: string | null;
  readonly supportLineageArtifactBindingRefs: readonly string[];
  readonly localAckState: "none" | "shown" | "superseded";
  readonly processingAcceptanceState:
    | "not_started"
    | "accepted_for_processing"
    | "awaiting_external_confirmation"
    | "externally_accepted"
    | "externally_rejected"
    | "timed_out";
  readonly externalObservationState:
    | "unobserved"
    | "delivered"
    | "resolved"
    | "transferred"
    | "disputed"
    | "failed"
    | "expired";
  readonly authoritativeDeliveryState:
    | "unobserved"
    | "delivered"
    | "failed"
    | "disputed"
    | "expired";
  readonly authoritativeOutcomeState:
    | "pending"
    | "awaiting_external"
    | "stale_recoverable"
    | "recovery_required"
    | "manual_handoff_required"
    | "settled"
    | "failed"
    | "expired";
  readonly transitionEnvelopeRef: string;
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseRecoveryDispositionRef: string | null;
  readonly uiTransitionSettlementRecordRef: string;
  readonly uiTelemetryDisclosureFenceRef: string;
  readonly presentationArtifactRef: string;
  readonly result: SupportCommunicationSettlementResult;
  readonly receiptTextRef: string;
  readonly causalToken: string;
  readonly recoveryRouteRef: string;
  readonly recordedAt: string;
}

export interface SupportResolutionSnapshot {
  readonly projectionName: "SupportResolutionSnapshot";
  readonly supportResolutionSnapshotId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly ticketVersionRef: string;
  readonly resolutionCode: string;
  readonly summaryRef: string;
  readonly channelOutcomeRefs: readonly string[];
  readonly handoffSummaryRef: string | null;
  readonly supportLineageArtifactBindingRefs: readonly string[];
  readonly confirmationState: SupportResolutionConfirmationState;
  readonly supportPresentationArtifactRef: string;
  readonly createdAt: string;
}

interface StoredSupportTicketState {
  ticket: SupportTicket;
  binding: SupportLineageBinding;
  scopeMembers: SupportLineageScopeMember[];
  artifactBindings: SupportLineageArtifactBinding[];
  taskId: string;
  communicationDomain: SupportCommunicationDomain;
  communicationObjectRef: string;
  failurePathKey: string;
  currentCommunicationTupleHash: string;
  latestActionRecordRef: string | null;
  latestSettlementRef: string | null;
  latestResolutionSnapshotRef: string | null;
  version: number;
  updatedAt: string;
}

interface SupportCommunicationLinkageRepositories {
  getTicketState(supportTicketId: string): Promise<StoredSupportTicketState | null>;
  getTicketStateByFailurePath(
    failurePathKey: string,
  ): Promise<StoredSupportTicketState | null>;
  saveTicketState(state: StoredSupportTicketState): Promise<void>;
  getActionRecord(
    supportActionRecordId: string,
  ): Promise<SupportCommunicationActionRecordSnapshot | null>;
  saveActionRecord(record: SupportCommunicationActionRecordSnapshot): Promise<void>;
  getSettlement(
    supportActionSettlementId: string,
  ): Promise<SupportCommunicationActionSettlementSnapshot | null>;
  saveSettlement(settlement: SupportCommunicationActionSettlementSnapshot): Promise<void>;
  getResolutionSnapshot(
    supportResolutionSnapshotId: string,
  ): Promise<SupportResolutionSnapshot | null>;
  saveResolutionSnapshot(snapshot: SupportResolutionSnapshot): Promise<void>;
  getOpenReplay(idempotencyScope: string): Promise<string | null>;
  saveReplay(idempotencyScope: string, ref: string): Promise<void>;
}

class InMemorySupportCommunicationLinkageStore
  implements SupportCommunicationLinkageRepositories
{
  private readonly tickets = new Map<string, StoredSupportTicketState>();
  private readonly ticketsByFailurePath = new Map<string, string>();
  private readonly actionRecords = new Map<string, SupportCommunicationActionRecordSnapshot>();
  private readonly settlements = new Map<string, SupportCommunicationActionSettlementSnapshot>();
  private readonly resolutionSnapshots = new Map<string, SupportResolutionSnapshot>();
  private readonly idempotency = new Map<string, string>();

  async getTicketState(supportTicketId: string): Promise<StoredSupportTicketState | null> {
    return this.tickets.get(supportTicketId) ?? null;
  }

  async getTicketStateByFailurePath(
    failurePathKey: string,
  ): Promise<StoredSupportTicketState | null> {
    const supportTicketId = this.ticketsByFailurePath.get(failurePathKey);
    return supportTicketId ? (this.tickets.get(supportTicketId) ?? null) : null;
  }

  async saveTicketState(state: StoredSupportTicketState): Promise<void> {
    this.tickets.set(state.ticket.supportTicketId, state);
    this.ticketsByFailurePath.set(state.failurePathKey, state.ticket.supportTicketId);
  }

  async getActionRecord(
    supportActionRecordId: string,
  ): Promise<SupportCommunicationActionRecordSnapshot | null> {
    return this.actionRecords.get(supportActionRecordId) ?? null;
  }

  async saveActionRecord(record: SupportCommunicationActionRecordSnapshot): Promise<void> {
    this.actionRecords.set(record.supportActionRecordId, record);
  }

  async getSettlement(
    supportActionSettlementId: string,
  ): Promise<SupportCommunicationActionSettlementSnapshot | null> {
    return this.settlements.get(supportActionSettlementId) ?? null;
  }

  async saveSettlement(settlement: SupportCommunicationActionSettlementSnapshot): Promise<void> {
    this.settlements.set(settlement.supportActionSettlementId, settlement);
  }

  async getResolutionSnapshot(
    supportResolutionSnapshotId: string,
  ): Promise<SupportResolutionSnapshot | null> {
    return this.resolutionSnapshots.get(supportResolutionSnapshotId) ?? null;
  }

  async saveResolutionSnapshot(snapshot: SupportResolutionSnapshot): Promise<void> {
    this.resolutionSnapshots.set(snapshot.supportResolutionSnapshotId, snapshot);
  }

  async getOpenReplay(idempotencyScope: string): Promise<string | null> {
    return this.idempotency.get(idempotencyScope) ?? null;
  }

  async saveReplay(idempotencyScope: string, ref: string): Promise<void> {
    this.idempotency.set(idempotencyScope, ref);
  }
}

export interface OpenSupportCommunicationFailureInput {
  readonly taskId: string;
  readonly communicationDomain: SupportCommunicationDomain;
  readonly communicationObjectRef?: string | null;
  readonly requestedByRef: string;
  readonly reasonCode: string;
  readonly idempotencyKey: string;
  readonly requestedAt: string;
  readonly expectedCommunicationTupleHash?: string | null;
}

export interface RecordSupportCommunicationActionInput {
  readonly supportTicketId: string;
  readonly actionScope: SupportCommunicationActionScope;
  readonly result: SupportCommunicationSettlementResult;
  readonly recordedByRef: string;
  readonly reasonCode: string;
  readonly idempotencyKey: string;
  readonly recordedAt: string;
  readonly noteOrSummaryRef?: string | null;
  readonly sourceArtifactRef?: string | null;
  readonly sourceEvidenceSnapshotRef?: string | null;
  readonly expectedTicketVersionRef?: string | null;
  readonly expectedBindingHash?: string | null;
  readonly expectedCommunicationTupleHash?: string | null;
  readonly acceptedTransfer?: boolean;
}

export interface PublishSupportResolutionSnapshotInput {
  readonly supportTicketId: string;
  readonly supportActionSettlementId: string;
  readonly resolutionCode: string;
  readonly summaryRef: string;
  readonly handoffSummaryRef?: string | null;
  readonly sourceArtifactRef: string;
  readonly sourceEvidenceSnapshotRef: string;
  readonly noteOrSummaryRef: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
}

export interface SupportCommunicationFailureLinkageBundle {
  readonly supportTicket: SupportTicket;
  readonly supportLineageBinding: SupportLineageBinding;
  readonly supportLineageScopeMembers: readonly SupportLineageScopeMember[];
  readonly supportLineageArtifactBindings: readonly SupportLineageArtifactBinding[];
  readonly latestActionRecord: SupportCommunicationActionRecordSnapshot | null;
  readonly latestSettlement: SupportCommunicationActionSettlementSnapshot | null;
  readonly latestResolutionSnapshot: SupportResolutionSnapshot | null;
  readonly communicationContext: SupportCommunicationContext;
  readonly supportWorkspace: SupportTicketWorkspaceResult;
}

export interface OpenSupportCommunicationFailureResult
  extends SupportCommunicationFailureLinkageBundle {
  readonly dedupeDecision:
    | "created_new_ticket"
    | "attached_existing_ticket"
    | "exact_replay"
    | "stale_recoverable";
}

export interface RecordSupportCommunicationActionResult
  extends SupportCommunicationFailureLinkageBundle {
  readonly actionRecord: SupportCommunicationActionRecordSnapshot | null;
  readonly settlement: SupportCommunicationActionSettlementSnapshot;
  readonly staleRecoverable: boolean;
}

export interface PublishSupportResolutionSnapshotResult
  extends SupportCommunicationFailureLinkageBundle {
  readonly resolutionSnapshot: SupportResolutionSnapshot;
}

interface SupportCommunicationLinkageApplicationOptions {
  callbackApplication?: Pick<Phase3CallbackDomainApplication, "queryTaskCallbackDomain">;
  clinicianMessageApplication?: Pick<
    Phase3ClinicianMessageDomainApplication,
    "queryTaskClinicianMessageDomain"
  >;
  communicationRepairApplication?: Pick<
    Phase3CommunicationRepairApplication,
    "queryTaskCommunicationRepair"
  >;
  repositories?: SupportCommunicationLinkageRepositories;
  idGenerator?: BackboneIdGenerator;
}

class Phase3SupportCommunicationLinkageApplicationImpl {
  readonly serviceName = PHASE3_SUPPORT_COMMUNICATION_LINKAGE_SERVICE_NAME;
  readonly schemaVersion = PHASE3_SUPPORT_COMMUNICATION_LINKAGE_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_SUPPORT_COMMUNICATION_LINKAGE_QUERY_SURFACES;
  readonly routes = phase3SupportCommunicationLinkageRoutes;
  readonly callbackApplication: Pick<
    Phase3CallbackDomainApplication,
    "queryTaskCallbackDomain"
  >;
  readonly clinicianMessageApplication: Pick<
    Phase3ClinicianMessageDomainApplication,
    "queryTaskClinicianMessageDomain"
  >;
  readonly communicationRepairApplication: Pick<
    Phase3CommunicationRepairApplication,
    "queryTaskCommunicationRepair"
  >;
  readonly repositories: SupportCommunicationLinkageRepositories;
  readonly idGenerator: BackboneIdGenerator;

  constructor(options?: SupportCommunicationLinkageApplicationOptions) {
    this.callbackApplication =
      options?.callbackApplication ?? createPhase3CallbackDomainApplication();
    this.clinicianMessageApplication =
      options?.clinicianMessageApplication ?? createPhase3ClinicianMessageDomainApplication();
    this.communicationRepairApplication =
      options?.communicationRepairApplication ??
      createPhase3CommunicationReachabilityRepairApplication({
        callbackApplication: this.callbackApplication as Phase3CallbackDomainApplication,
        clinicianMessageApplication:
          this.clinicianMessageApplication as Phase3ClinicianMessageDomainApplication,
      });
    this.repositories = options?.repositories ?? new InMemorySupportCommunicationLinkageStore();
    this.idGenerator = options?.idGenerator ?? createDeterministicBackboneIdGenerator();
  }

  async openOrAttachSupportCommunicationFailure(
    input: OpenSupportCommunicationFailureInput,
  ): Promise<OpenSupportCommunicationFailureResult> {
    const requestedAt = ensureIsoTimestamp(input.requestedAt, "requestedAt");
    const replayScope = `open:${input.taskId}:${input.communicationDomain}:${input.idempotencyKey}`;
    const replayTicketId = await this.repositories.getOpenReplay(replayScope);
    if (replayTicketId) {
      const bundle = await this.querySupportCommunicationFailureLinkage(replayTicketId);
      return {
        ...bundle,
        dedupeDecision: "exact_replay",
      };
    }

    const context = await this.resolveCommunicationContext(
      input.taskId,
      input.communicationDomain,
      input.communicationObjectRef,
    );
    if (
      input.expectedCommunicationTupleHash &&
      input.expectedCommunicationTupleHash !== context.governingThreadTupleHash
    ) {
      const transient = await this.buildTransientLinkageBundle(context, requestedAt);
      return {
        ...transient,
        dedupeDecision: "stale_recoverable",
      };
    }

    const existing = await this.repositories.getTicketStateByFailurePath(
      stableHash([
        context.communicationDomain,
        context.requestLineageRef,
        context.lineageCaseLinkRef,
        context.governingObjectRef,
        context.governingThreadTupleHash,
      ]),
    );
    if (existing) {
      await this.repositories.saveReplay(replayScope, existing.ticket.supportTicketId);
      const bundle = await this.querySupportCommunicationFailureLinkage(existing.ticket.supportTicketId);
      return {
        ...bundle,
        dedupeDecision: "attached_existing_ticket",
      };
    }

    const ticketId = nextApplicationId(this.idGenerator, "support_ticket_248");
    const bindingId = nextApplicationId(this.idGenerator, "support_lineage_binding_248");
    const primaryScopeMemberId = nextApplicationId(
      this.idGenerator,
      "support_scope_member_primary_248",
    );
    const secondaryScopeMemberId = nextApplicationId(
      this.idGenerator,
      "support_scope_member_context_248",
    );
    const repairScopeMemberId = context.contactRepairJourneyRef
      ? nextApplicationId(this.idGenerator, "support_scope_member_repair_248")
      : null;
    const initialArtifactBindingId = nextApplicationId(
      this.idGenerator,
      "support_artifact_binding_248_open",
    );
    const bindingHash = stableHash([
      bindingId,
      ticketId,
      context.requestLineageRef,
      context.lineageCaseLinkRef,
      context.governingObjectRef,
      context.governingObjectVersionRef,
      context.governingThreadTupleHash,
      context.governingSubthreadTupleHash,
    ]);
    const scopeMembers: SupportLineageScopeMember[] = [
      {
        projectionName: "SupportLineageScopeMember",
        supportLineageScopeMemberId: primaryScopeMemberId,
        supportLineageBindingRef: bindingId,
        requestLineageRef: context.requestLineageRef,
        lineageCaseLinkRef: context.lineageCaseLinkRef,
        domainCaseRef: context.governingObjectRef,
        governingObjectDescriptorRef: context.governingObjectDescriptorRef,
        governingObjectRef: context.governingObjectRef,
        governingObjectVersionRef: context.governingObjectVersionRef,
        sourceThreadRef: context.governingThreadRef,
        sourceArtifactRef: context.sourceArtifactRef,
        memberRole: "primary_action_target",
        continuityWitnessRef: `support_continuity_${ticketId}`,
        visibilityMode: "repair_actionable",
        actionability: "governed_mutation",
        memberState: "active",
        addedAt: requestedAt,
        releasedAt: null,
      },
      {
        projectionName: "SupportLineageScopeMember",
        supportLineageScopeMemberId: secondaryScopeMemberId,
        supportLineageBindingRef: bindingId,
        requestLineageRef: context.requestLineageRef,
        lineageCaseLinkRef: context.lineageCaseLinkRef,
        domainCaseRef:
          context.latestThreadResolutionGateRef ??
          context.latestCallbackResolutionGateRef ??
          context.governingObjectRef,
        governingObjectDescriptorRef:
          context.communicationDomain === "clinician_message_thread"
            ? "ThreadResolutionGate"
            : "CallbackResolutionGate",
        governingObjectRef:
          context.latestThreadResolutionGateRef ??
          context.latestCallbackResolutionGateRef ??
          context.governingObjectRef,
        governingObjectVersionRef: context.governingObjectVersionRef,
        sourceThreadRef: context.governingThreadRef,
        sourceArtifactRef:
          context.latestDeliveryEvidenceBundleRef ??
          context.latestCallbackOutcomeEvidenceBundleRef ??
          context.sourceArtifactRef,
        memberRole: "communication_context",
        continuityWitnessRef: `support_continuity_${ticketId}`,
        visibilityMode: "bounded_detail",
        actionability: "observe_only",
        memberState: "active",
        addedAt: requestedAt,
        releasedAt: null,
      },
      ...(repairScopeMemberId
        ? [
            {
              projectionName: "SupportLineageScopeMember" as const,
              supportLineageScopeMemberId: repairScopeMemberId,
              supportLineageBindingRef: bindingId,
              requestLineageRef: context.requestLineageRef,
              lineageCaseLinkRef: context.lineageCaseLinkRef,
              domainCaseRef: context.contactRepairJourneyRef!,
              governingObjectDescriptorRef: "ContactRouteRepairJourney",
              governingObjectRef: context.contactRepairJourneyRef!,
              governingObjectVersionRef: `reachability_epoch_${context.reachabilityEpoch}`,
              sourceThreadRef: context.governingThreadRef,
              sourceArtifactRef: context.sourceArtifactRef,
              memberRole: "recovery_dependency" as const,
              continuityWitnessRef: `support_continuity_${ticketId}`,
              visibilityMode: "bounded_detail" as const,
              actionability: "observe_only" as const,
              memberState: "active" as const,
              addedAt: requestedAt,
              releasedAt: null,
            },
          ]
        : []),
    ];
    const binding: SupportLineageBinding = {
      projectionName: "SupportLineageBinding",
      supportLineageBindingId: bindingId,
      supportTicketId: ticketId,
      subjectRef: context.subjectRef,
      primaryRequestLineageRef: context.requestLineageRef,
      primaryLineageCaseLinkRef: context.lineageCaseLinkRef,
      primaryScopeMemberRef: primaryScopeMemberId,
      governingObjectDescriptorRef: context.governingObjectDescriptorRef,
      governingObjectRef: context.governingObjectRef,
      governingObjectVersionRef: context.governingObjectVersionRef,
      scopeMemberRefs: scopeMembers.map((member) => member.supportLineageScopeMemberId),
      sourceLineageRefs: [context.requestLineageRef],
      sourceThreadRefs: [context.governingThreadRef],
      sourceArtifactRefs: [
        ...new Set(
          [
            context.sourceArtifactRef,
            context.latestDeliveryEvidenceBundleRef,
            context.latestCallbackOutcomeEvidenceBundleRef,
          ].filter((value): value is string => Boolean(value)),
        ),
      ],
      maskScopeRef: context.maskScopeRef,
      disclosureCeilingRef: context.disclosureCeilingRef,
      bindingHash,
      supersedesSupportLineageBindingRef: null,
      bindingState: "active",
      createdAt: requestedAt,
      supersededAt: null,
    };
    const artifactBindings: SupportLineageArtifactBinding[] = [
      {
        projectionName: "SupportLineageArtifactBinding",
        supportLineageArtifactBindingId: initialArtifactBindingId,
        supportLineageBindingRef: bindingId,
        supportLineageScopeMemberRef: primaryScopeMemberId,
        supportTicketId: ticketId,
        sourceLineageRef: context.requestLineageRef,
        sourceLineageCaseLinkRef: context.lineageCaseLinkRef,
        sourceEvidenceSnapshotRef:
          context.sourceEvidenceSnapshotRef ?? `support_source_snapshot_${ticketId}`,
        sourceArtifactRef: context.sourceArtifactRef ?? context.governingObjectRef,
        derivedArtifactRef: `support_attach_summary_${ticketId}`,
        noteOrSummaryRef: `support_attach_note_${ticketId}`,
        maskScopeRef: context.maskScopeRef,
        disclosureCeilingRef: context.disclosureCeilingRef,
        parityDigestRef: context.communicationChainHash,
        bindingState: "active",
        createdAt: requestedAt,
        supersededAt: null,
      },
    ];
    const ticket: SupportTicket = {
      projectionName: "SupportTicket",
      supportTicketId: ticketId,
      originRef: `${context.communicationDomain}:${context.governingObjectRef}`,
      originChannel: "phase3_communication_failure",
      subjectRef: context.subjectRef,
      supportLineageBindingRef: bindingId,
      supportLineageBindingHash: bindingHash,
      primaryRequestLineageRef: context.requestLineageRef,
      primaryLineageCaseLinkRef: context.lineageCaseLinkRef,
      activeScopeMemberRefs: scopeMembers.map((member) => member.supportLineageScopeMemberId),
      reasonCategory: context.reasonCategory,
      severity: context.severity,
      slaState: context.severity === "high" ? "at_risk" : "within_sla",
      ticketState: "open",
      currentOwnerRef: "support_unassigned",
      queueKey:
        context.communicationDomain === "callback_case"
          ? "support.callback-failure"
          : "support.message-failure",
      latestSubjectEventRef: context.sourceArtifactRef ?? context.governingObjectRef,
      selectedTimelineAnchorRef: context.sourceArtifactRef ?? context.governingObjectRef,
      selectedTimelineAnchorTupleHashRef: context.governingThreadTupleHash,
      activeConversationRef: context.governingThreadRef,
      currentKnowledgePackRef: `support_knowledge_pack_${context.communicationDomain}_v1`,
      currentHistoryPackRef: `support_history_pack_${context.communicationDomain}_v1`,
      effectiveMaskScopeRef: context.maskScopeRef,
      allowedActionRefs: context.allowedActionRefs,
      currentActionLeaseRef: `support_action_lease_${ticketId}`,
      activeMutationAttemptRef: null,
      activeIdentityCorrectionRequestRef: null,
      activeIdentityRepairCaseRef: null,
      identityRepairFreezeRef: null,
      identityRepairReleaseSettlementRef: null,
      activeReplayCheckpointRef: null,
      activeObserveSessionRef: null,
      activeTransferRef: null,
      activeTransferAcceptanceSettlementRef: null,
      activeReadOnlyFallbackRef: null,
      ticketVersionRef: `${ticketId}_v1`,
      shellMode: "live",
      staffWorkspaceConsistencyProjectionRef: `staff_workspace_consistency_${ticketId}`,
      workspaceSliceTrustProjectionRef: `workspace_slice_trust_${ticketId}`,
      supportSurfaceRuntimeBindingRef: `support_surface_runtime_binding_${ticketId}`,
      releaseRecoveryDispositionRef: null,
      taskCompletionSettlementEnvelopeRef: null,
      lastResolutionSummaryRef: null,
    };
    const state: StoredSupportTicketState = {
      ticket,
      binding,
      scopeMembers,
      artifactBindings,
      taskId: input.taskId,
      communicationDomain: context.communicationDomain,
      communicationObjectRef: context.governingObjectRef,
      failurePathKey: stableHash([
        context.communicationDomain,
        context.requestLineageRef,
        context.lineageCaseLinkRef,
        context.governingObjectRef,
        context.governingThreadTupleHash,
      ]),
      currentCommunicationTupleHash: context.governingThreadTupleHash,
      latestActionRecordRef: null,
      latestSettlementRef: null,
      latestResolutionSnapshotRef: null,
      version: 1,
      updatedAt: requestedAt,
    };
    await this.repositories.saveTicketState(state);
    await this.repositories.saveReplay(replayScope, ticketId);
    const bundle = await this.querySupportCommunicationFailureLinkage(ticketId);
    return {
      ...bundle,
      dedupeDecision: "created_new_ticket",
    };
  }

  async querySupportCommunicationFailureLinkage(
    supportTicketId: string,
  ): Promise<SupportCommunicationFailureLinkageBundle> {
    const state = await this.requireTicketState(supportTicketId);
    const context = await this.resolveCommunicationContext(
      state.taskId,
      state.communicationDomain,
      state.communicationObjectRef,
    );
    const workspace = this.buildWorkspaceBundle(state, context);
    const latestActionRecord = state.latestActionRecordRef
      ? await this.repositories.getActionRecord(state.latestActionRecordRef)
      : null;
    const latestSettlement = state.latestSettlementRef
      ? await this.repositories.getSettlement(state.latestSettlementRef)
      : null;
    const latestResolutionSnapshot = state.latestResolutionSnapshotRef
      ? await this.repositories.getResolutionSnapshot(state.latestResolutionSnapshotRef)
      : null;
    return {
      supportTicket: state.ticket,
      supportLineageBinding: state.binding,
      supportLineageScopeMembers: state.scopeMembers,
      supportLineageArtifactBindings: state.artifactBindings,
      latestActionRecord,
      latestSettlement,
      latestResolutionSnapshot,
      communicationContext: context,
      supportWorkspace: workspace,
    };
  }

  async recordSupportCommunicationAction(
    input: RecordSupportCommunicationActionInput,
  ): Promise<RecordSupportCommunicationActionResult> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const replayScope = `action:${input.supportTicketId}:${input.idempotencyKey}`;
    const replaySettlementId = await this.repositories.getOpenReplay(replayScope);
    if (replaySettlementId) {
      const replaySettlement = await this.repositories.getSettlement(replaySettlementId);
      invariant(replaySettlement, "UNKNOWN_REPLAY_SETTLEMENT", "Replay settlement missing.");
      const bundle = await this.querySupportCommunicationFailureLinkage(input.supportTicketId);
      return {
        ...bundle,
        actionRecord: bundle.latestActionRecord,
        settlement: replaySettlement,
        staleRecoverable: replaySettlement.result === "stale_recoverable",
      };
    }

    const state = await this.requireTicketState(input.supportTicketId);
    const context = await this.resolveCommunicationContext(
      state.taskId,
      state.communicationDomain,
      state.communicationObjectRef,
    );

    if (
      (input.expectedTicketVersionRef &&
        input.expectedTicketVersionRef !== state.ticket.ticketVersionRef) ||
      (input.expectedBindingHash &&
        input.expectedBindingHash !== state.binding.bindingHash) ||
      (input.expectedCommunicationTupleHash &&
        input.expectedCommunicationTupleHash !== context.governingThreadTupleHash)
    ) {
      const settlement = this.buildStaleRecoverableSettlement(state, context, recordedAt);
      await this.repositories.saveSettlement(settlement);
      state.latestSettlementRef = settlement.supportActionSettlementId;
      state.updatedAt = recordedAt;
      state.version += 1;
      await this.repositories.saveTicketState(state);
      await this.repositories.saveReplay(replayScope, settlement.supportActionSettlementId);
      const bundle = await this.querySupportCommunicationFailureLinkage(input.supportTicketId);
      return {
        ...bundle,
        actionRecord: null,
        settlement,
        staleRecoverable: true,
      };
    }

    const artifactBindingIds: string[] = [];
    if (input.noteOrSummaryRef) {
      const artifactBinding = this.createArtifactBinding(
        state,
        context,
        input.noteOrSummaryRef,
        input.sourceArtifactRef ?? context.sourceArtifactRef ?? context.governingObjectRef,
        input.sourceEvidenceSnapshotRef ??
          context.sourceEvidenceSnapshotRef ??
          `support_evidence_snapshot_${input.supportTicketId}`,
        recordedAt,
      );
      state.artifactBindings.push(artifactBinding);
      artifactBindingIds.push(artifactBinding.supportLineageArtifactBindingId);
    }

    const actionRecordId = nextApplicationId(this.idGenerator, "support_action_record_248");
    const settlementId = nextApplicationId(this.idGenerator, "support_action_settlement_248");
    const actionRecord: SupportCommunicationActionRecordSnapshot = {
      projectionName: "SupportActionRecord",
      supportActionRecordId: actionRecordId,
      supportTicketId: state.ticket.supportTicketId,
      supportLineageBindingRef: state.binding.supportLineageBindingId,
      supportLineageScopeMemberRef: state.binding.primaryScopeMemberRef,
      actionScope: input.actionScope,
      governingObjectRef: context.governingObjectRef,
      governingThreadRef: context.governingThreadRef,
      governingSubthreadRef: context.governingSubthreadRef,
      governingThreadVersionRef: context.governingObjectVersionRef,
      governingThreadTupleHash: context.governingThreadTupleHash,
      governingSubthreadTupleHash: context.governingSubthreadTupleHash,
      routeProfileRef: `support_route_profile_${context.communicationDomain}`,
      policyBundleRef: `support_policy_bundle_${context.communicationDomain}`,
      routeIntentBindingRef: context.routeIntentBindingRef,
      commandActionRecordRef: `command_action_${actionRecordId}`,
      messageDispatchEnvelopeRef: context.messageDispatchEnvelopeRef,
      latestDeliveryEvidenceBundleRef: context.latestDeliveryEvidenceBundleRef,
      latestThreadExpectationEnvelopeRef: context.latestThreadExpectationEnvelopeRef,
      latestThreadResolutionGateRef: context.latestThreadResolutionGateRef,
      callbackCaseRef: context.callbackCaseRef,
      latestCallbackExpectationEnvelopeRef: context.latestCallbackExpectationEnvelopeRef,
      latestCallbackOutcomeEvidenceBundleRef: context.latestCallbackOutcomeEvidenceBundleRef,
      latestCallbackResolutionGateRef: context.latestCallbackResolutionGateRef,
      supportMutationAttemptRef: null,
      supportSurfaceRuntimeBindingRef: state.ticket.supportSurfaceRuntimeBindingRef,
      surfaceRouteContractRef: `support_surface_route_contract_${state.ticket.supportTicketId}`,
      surfacePublicationRef: `support_surface_publication_${state.ticket.supportTicketId}`,
      runtimePublicationBundleRef: `support_runtime_publication_${state.ticket.supportTicketId}`,
      releasePublicationParityRef: `support_release_publication_parity_${state.ticket.supportTicketId}`,
      transitionEnvelopeRef: `transition_envelope_${actionRecordId}`,
      releaseRecoveryDispositionRef: null,
      fenceEpoch: context.reachabilityEpoch,
      reasonCode: input.reasonCode,
      jitScopeRef: `jit_scope_${state.ticket.supportTicketId}`,
      dualControlState: "not_required",
      idempotencyKey: input.idempotencyKey,
      createdByRef: input.recordedByRef,
      createdAt: recordedAt,
      settledAt: input.result === "awaiting_external" ? null : recordedAt,
    };

    const deliveryState = this.resolveAuthoritativeDeliveryState(context);
    const settlementLaw = normalizeSupportCommunicationSettlement({
      result: input.result,
      actionScope: input.actionScope,
      deliveryState,
      noteHasProvenance: artifactBindingIds.length > 0,
      acceptedTransfer: Boolean(input.acceptedTransfer),
    });
    const settlement: SupportCommunicationActionSettlementSnapshot = {
      projectionName: "SupportActionSettlement",
      supportActionSettlementId: settlementId,
      supportTicketId: state.ticket.supportTicketId,
      supportLineageBindingRef: state.binding.supportLineageBindingId,
      supportLineageScopeMemberRef: state.binding.primaryScopeMemberRef,
      supportActionRecordId: actionRecordId,
      commandSettlementRecordRef: `command_settlement_${settlementId}`,
      governingThreadRef: context.governingThreadRef,
      governingSubthreadRef: context.governingSubthreadRef,
      governingThreadTupleHash: context.governingThreadTupleHash,
      governingSubthreadTupleHash: context.governingSubthreadTupleHash,
      messageDispatchEnvelopeRef: context.messageDispatchEnvelopeRef,
      latestDeliveryEvidenceBundleRef: context.latestDeliveryEvidenceBundleRef,
      latestThreadExpectationEnvelopeRef: context.latestThreadExpectationEnvelopeRef,
      latestThreadResolutionGateRef: context.latestThreadResolutionGateRef,
      callbackCaseRef: context.callbackCaseRef,
      latestCallbackExpectationEnvelopeRef: context.latestCallbackExpectationEnvelopeRef,
      latestCallbackOutcomeEvidenceBundleRef: context.latestCallbackOutcomeEvidenceBundleRef,
      latestCallbackResolutionGateRef: context.latestCallbackResolutionGateRef,
      supportLineageArtifactBindingRefs: artifactBindingIds,
      localAckState: "shown",
      processingAcceptanceState: settlementLaw.processingAcceptanceState,
      externalObservationState: settlementLaw.externalObservationState,
      authoritativeDeliveryState: deliveryState,
      authoritativeOutcomeState: settlementLaw.authoritativeOutcomeState,
      transitionEnvelopeRef: actionRecord.transitionEnvelopeRef,
      supportSurfaceRuntimeBindingRef: state.ticket.supportSurfaceRuntimeBindingRef,
      surfacePublicationRef: actionRecord.surfacePublicationRef,
      runtimePublicationBundleRef: actionRecord.runtimePublicationBundleRef,
      releasePublicationParityRef: actionRecord.releasePublicationParityRef,
      releaseRecoveryDispositionRef:
        input.result === "stale_recoverable"
          ? `/ops/support/tickets/${state.ticket.supportTicketId}/recover`
          : null,
      uiTransitionSettlementRecordRef: `ui_transition_settlement_${settlementId}`,
      uiTelemetryDisclosureFenceRef: `ui_disclosure_fence_${settlementId}`,
      presentationArtifactRef: `support_presentation_artifact_${settlementId}`,
      result: input.result,
      receiptTextRef: `support_receipt_text_${settlementId}`,
      causalToken: `causal_${settlementId}`,
      recoveryRouteRef: `/ops/support/tickets/${state.ticket.supportTicketId}/communication-failure-linkage`,
      recordedAt,
    };

    await this.repositories.saveActionRecord(actionRecord);
    await this.repositories.saveSettlement(settlement);
    await this.repositories.saveReplay(replayScope, settlement.supportActionSettlementId);

    state.latestActionRecordRef = actionRecord.supportActionRecordId;
    state.latestSettlementRef = settlement.supportActionSettlementId;
    state.currentCommunicationTupleHash = context.governingThreadTupleHash;
    state.updatedAt = recordedAt;
    state.version += 1;
    state.ticket = {
      ...state.ticket,
      activeMutationAttemptRef: actionRecord.supportMutationAttemptRef,
      ticketState:
        settlement.result === "manual_handoff_required"
          ? "waiting_on_owner"
          : settlement.result === "applied"
            ? "resolved"
            : "open",
      ticketVersionRef: `${state.ticket.supportTicketId}_v${state.version}`,
      shellMode:
        settlement.result === "awaiting_external"
          ? "provisional"
          : settlement.result === "stale_recoverable"
            ? "read_only_recovery"
            : "live",
    };
    await this.repositories.saveTicketState(state);

    const bundle = await this.querySupportCommunicationFailureLinkage(input.supportTicketId);
    return {
      ...bundle,
      actionRecord,
      settlement,
      staleRecoverable: settlement.result === "stale_recoverable",
    };
  }

  async publishSupportResolutionSnapshot(
    input: PublishSupportResolutionSnapshotInput,
  ): Promise<PublishSupportResolutionSnapshotResult> {
    const createdAt = ensureIsoTimestamp(input.createdAt, "createdAt");
    const replayScope = `resolution:${input.supportTicketId}:${input.idempotencyKey}`;
    const replayResolutionId = await this.repositories.getOpenReplay(replayScope);
    if (replayResolutionId) {
      const replayResolution = await this.repositories.getResolutionSnapshot(replayResolutionId);
      invariant(replayResolution, "UNKNOWN_REPLAY_RESOLUTION", "Replay resolution missing.");
      const bundle = await this.querySupportCommunicationFailureLinkage(input.supportTicketId);
      return {
        ...bundle,
        resolutionSnapshot: replayResolution,
      };
    }

    const state = await this.requireTicketState(input.supportTicketId);
    const settlement = requireRef(input.supportActionSettlementId, "supportActionSettlementId");
    const currentSettlement = await this.repositories.getSettlement(settlement);
    invariant(
      currentSettlement,
      "UNKNOWN_SUPPORT_SETTLEMENT",
      `Unknown support settlement ${settlement}.`,
    );
    const resolutionLaw = normalizeSupportCommunicationSettlement({
      result: currentSettlement.result,
      actionScope: "resolution_note",
      deliveryState: currentSettlement.authoritativeDeliveryState,
      noteHasProvenance: true,
      acceptedTransfer: currentSettlement.authoritativeOutcomeState === "manual_handoff_required",
    });
    const artifactBinding = this.createArtifactBinding(
      state,
      await this.resolveCommunicationContext(
        state.taskId,
        state.communicationDomain,
        state.communicationObjectRef,
      ),
      input.noteOrSummaryRef,
      input.sourceArtifactRef,
      input.sourceEvidenceSnapshotRef,
      createdAt,
    );
    state.artifactBindings.push(artifactBinding);
    invariant(
      canPublishSupportResolutionSnapshot({
        settlementState: resolutionLaw,
        noteHasProvenance: true,
      }),
      "RESOLUTION_PROVENANCE_REQUIRED",
      "Durable support resolution snapshots require authoritative settlement and current artifact provenance.",
    );

    const resolutionSnapshot: SupportResolutionSnapshot = {
      projectionName: "SupportResolutionSnapshot",
      supportResolutionSnapshotId: nextApplicationId(
        this.idGenerator,
        "support_resolution_snapshot_248",
      ),
      supportTicketId: state.ticket.supportTicketId,
      supportLineageBindingRef: state.binding.supportLineageBindingId,
      ticketVersionRef: state.ticket.ticketVersionRef,
      resolutionCode: input.resolutionCode,
      summaryRef: input.summaryRef,
      channelOutcomeRefs: [
        ...new Set(
          [
            currentSettlement.messageDispatchEnvelopeRef,
            currentSettlement.latestDeliveryEvidenceBundleRef,
            currentSettlement.callbackCaseRef,
            currentSettlement.latestCallbackOutcomeEvidenceBundleRef,
          ].filter((value): value is string => Boolean(value)),
        ),
      ],
      handoffSummaryRef: optionalRef(input.handoffSummaryRef),
      supportLineageArtifactBindingRefs: [
        ...new Set([
          ...currentSettlement.supportLineageArtifactBindingRefs,
          artifactBinding.supportLineageArtifactBindingId,
        ]),
      ],
      confirmationState: resolutionLaw.requiredConfirmationState,
      supportPresentationArtifactRef: `${SUPPORT_RESOLUTION_SNAPSHOT_BUILDER_NAME}_${stableHash([
        input.supportTicketId,
        input.summaryRef,
        createdAt,
      ])}`,
      createdAt,
    };

    await this.repositories.saveResolutionSnapshot(resolutionSnapshot);
    await this.repositories.saveReplay(replayScope, resolutionSnapshot.supportResolutionSnapshotId);

    state.latestResolutionSnapshotRef = resolutionSnapshot.supportResolutionSnapshotId;
    state.updatedAt = createdAt;
    state.version += 1;
    state.ticket = {
      ...state.ticket,
      lastResolutionSummaryRef: resolutionSnapshot.summaryRef,
      ticketState:
        resolutionSnapshot.confirmationState === "accepted_transfer"
          ? "waiting_on_owner"
          : "resolved",
      ticketVersionRef: `${state.ticket.supportTicketId}_v${state.version}`,
    };
    await this.repositories.saveTicketState(state);

    const bundle = await this.querySupportCommunicationFailureLinkage(input.supportTicketId);
    return {
      ...bundle,
      resolutionSnapshot,
    };
  }

  private async requireTicketState(supportTicketId: string): Promise<StoredSupportTicketState> {
    const state = await this.repositories.getTicketState(supportTicketId);
    invariant(state, "UNKNOWN_SUPPORT_TICKET", `Unknown support ticket ${supportTicketId}.`);
    return state;
  }

  private buildStaleRecoverableSettlement(
    state: StoredSupportTicketState,
    context: SupportCommunicationContext,
    recordedAt: string,
  ): SupportCommunicationActionSettlementSnapshot {
    return {
      projectionName: "SupportActionSettlement",
      supportActionSettlementId: nextApplicationId(
        this.idGenerator,
        "support_action_settlement_248_stale",
      ),
      supportTicketId: state.ticket.supportTicketId,
      supportLineageBindingRef: state.binding.supportLineageBindingId,
      supportLineageScopeMemberRef: state.binding.primaryScopeMemberRef,
      supportActionRecordId: null,
      commandSettlementRecordRef: `command_settlement_stale_${state.ticket.supportTicketId}`,
      governingThreadRef: context.governingThreadRef,
      governingSubthreadRef: context.governingSubthreadRef,
      governingThreadTupleHash: context.governingThreadTupleHash,
      governingSubthreadTupleHash: context.governingSubthreadTupleHash,
      messageDispatchEnvelopeRef: context.messageDispatchEnvelopeRef,
      latestDeliveryEvidenceBundleRef: context.latestDeliveryEvidenceBundleRef,
      latestThreadExpectationEnvelopeRef: context.latestThreadExpectationEnvelopeRef,
      latestThreadResolutionGateRef: context.latestThreadResolutionGateRef,
      callbackCaseRef: context.callbackCaseRef,
      latestCallbackExpectationEnvelopeRef: context.latestCallbackExpectationEnvelopeRef,
      latestCallbackOutcomeEvidenceBundleRef: context.latestCallbackOutcomeEvidenceBundleRef,
      latestCallbackResolutionGateRef: context.latestCallbackResolutionGateRef,
      supportLineageArtifactBindingRefs: [],
      localAckState: "superseded",
      processingAcceptanceState: "not_started",
      externalObservationState: "unobserved",
      authoritativeDeliveryState: this.resolveAuthoritativeDeliveryState(context),
      authoritativeOutcomeState: "stale_recoverable",
      transitionEnvelopeRef: `transition_envelope_stale_${state.ticket.supportTicketId}`,
      supportSurfaceRuntimeBindingRef: state.ticket.supportSurfaceRuntimeBindingRef,
      surfacePublicationRef: `support_surface_publication_${state.ticket.supportTicketId}`,
      runtimePublicationBundleRef: `support_runtime_publication_${state.ticket.supportTicketId}`,
      releasePublicationParityRef: `support_release_publication_parity_${state.ticket.supportTicketId}`,
      releaseRecoveryDispositionRef: `/ops/support/tickets/${state.ticket.supportTicketId}/recover`,
      uiTransitionSettlementRecordRef: `ui_transition_settlement_stale_${state.ticket.supportTicketId}`,
      uiTelemetryDisclosureFenceRef: `ui_disclosure_fence_stale_${state.ticket.supportTicketId}`,
      presentationArtifactRef: `support_presentation_artifact_stale_${state.ticket.supportTicketId}`,
      result: "stale_recoverable",
      receiptTextRef: `support_receipt_text_stale_${state.ticket.supportTicketId}`,
      causalToken: `causal_stale_${state.ticket.supportTicketId}`,
      recoveryRouteRef: `/ops/support/tickets/${state.ticket.supportTicketId}/communication-failure-linkage`,
      recordedAt,
    };
  }

  private createArtifactBinding(
    state: StoredSupportTicketState,
    context: SupportCommunicationContext,
    noteOrSummaryRef: string,
    sourceArtifactRef: string,
    sourceEvidenceSnapshotRef: string,
    createdAt: string,
  ): SupportLineageArtifactBinding {
    return {
      projectionName: "SupportLineageArtifactBinding",
      supportLineageArtifactBindingId: nextApplicationId(
        this.idGenerator,
        "support_lineage_artifact_binding_248",
      ),
      supportLineageBindingRef: state.binding.supportLineageBindingId,
      supportLineageScopeMemberRef: state.binding.primaryScopeMemberRef,
      supportTicketId: state.ticket.supportTicketId,
      sourceLineageRef: state.binding.primaryRequestLineageRef,
      sourceLineageCaseLinkRef: state.binding.primaryLineageCaseLinkRef,
      sourceEvidenceSnapshotRef,
      sourceArtifactRef,
      derivedArtifactRef: `${noteOrSummaryRef}_derived`,
      noteOrSummaryRef,
      maskScopeRef: context.maskScopeRef,
      disclosureCeilingRef: context.disclosureCeilingRef,
      parityDigestRef: context.communicationChainHash,
      bindingState: "active",
      createdAt,
      supersededAt: null,
    };
  }

  private buildWorkspaceBundle(
    state: StoredSupportTicketState,
    context: SupportCommunicationContext,
  ): SupportTicketWorkspaceResult {
    const fixture = this.buildSupportLineageFixture(state, context);
    return createSupportLineageTicketSubjectHistoryApplication({
      repository: createInMemorySupportLineageProjectionRepository([fixture]),
    }).supportLineageTicketProjectionService.getSupportTicketWorkspace({
      supportTicketId: state.ticket.supportTicketId,
    });
  }

  private buildSupportLineageFixture(
    state: StoredSupportTicketState,
    context: SupportCommunicationContext,
  ): SupportLineageFixture {
    const latestResolutionSummaryRef = state.ticket.lastResolutionSummaryRef;
    return {
      supportTicketId: state.ticket.supportTicketId,
      originRef: state.ticket.originRef,
      originChannel: state.ticket.originChannel,
      subjectRef: state.ticket.subjectRef,
      maskedSubjectLabel: `Subject ${state.ticket.subjectRef.slice(-6)}`,
      supportLineageBindingRef: state.binding.supportLineageBindingId,
      primaryRequestLineageRef: state.binding.primaryRequestLineageRef,
      primaryLineageCaseLinkRef: state.binding.primaryLineageCaseLinkRef,
      governingObjectDescriptorRef: state.binding.governingObjectDescriptorRef,
      governingObjectRef: state.binding.governingObjectRef,
      governingObjectVersionRef: state.binding.governingObjectVersionRef,
      reasonCategory: state.ticket.reasonCategory,
      severity: state.ticket.severity,
      slaState: state.ticket.slaState,
      ticketState: state.ticket.ticketState,
      currentOwnerRef: state.ticket.currentOwnerRef,
      queueKey: state.ticket.queueKey,
      latestSubjectEventRef:
        latestResolutionSummaryRef ??
        state.latestSettlementRef ??
        context.sourceArtifactRef ??
        context.governingObjectRef,
      selectedTimelineAnchorRef: state.ticket.selectedTimelineAnchorRef,
      activeConversationRef: state.ticket.activeConversationRef,
      currentKnowledgePackRef: state.ticket.currentKnowledgePackRef,
      currentHistoryPackRef: state.ticket.currentHistoryPackRef,
      effectiveMaskScopeRef: state.ticket.effectiveMaskScopeRef,
      disclosureCeilingRef: state.binding.disclosureCeilingRef,
      allowedActionRefs: state.ticket.allowedActionRefs,
      currentActionLeaseRef: state.ticket.currentActionLeaseRef,
      activeMutationAttemptRef: state.ticket.activeMutationAttemptRef,
      activeReadOnlyFallbackRef: state.ticket.activeReadOnlyFallbackRef,
      ticketVersionRef: state.ticket.ticketVersionRef,
      shellMode: state.ticket.shellMode,
      staffWorkspaceConsistencyProjectionRef: state.ticket.staffWorkspaceConsistencyProjectionRef,
      workspaceSliceTrustProjectionRef: state.ticket.workspaceSliceTrustProjectionRef,
      supportSurfaceRuntimeBindingRef: state.ticket.supportSurfaceRuntimeBindingRef,
      sourceLineageRefs: state.binding.sourceLineageRefs,
      sourceThreadRefs: state.binding.sourceThreadRefs,
      sourceArtifactRefs: state.binding.sourceArtifactRefs,
      scopeMembers: state.scopeMembers.map((member) => ({
        supportLineageScopeMemberId: member.supportLineageScopeMemberId,
        requestLineageRef: member.requestLineageRef,
        lineageCaseLinkRef: member.lineageCaseLinkRef,
        domainCaseRef: member.domainCaseRef,
        governingObjectDescriptorRef: member.governingObjectDescriptorRef,
        governingObjectRef: member.governingObjectRef,
        governingObjectVersionRef: member.governingObjectVersionRef,
        sourceThreadRef: member.sourceThreadRef,
        sourceArtifactRef: member.sourceArtifactRef,
        memberRole: member.memberRole,
        continuityWitnessRef: member.continuityWitnessRef,
        visibilityMode: member.visibilityMode,
        actionability: member.actionability,
        memberState: member.memberState,
        addedAt: member.addedAt,
        releasedAt: member.releasedAt,
      })),
      artifactBindings: state.artifactBindings.map((binding) => ({
        supportLineageArtifactBindingId: binding.supportLineageArtifactBindingId,
        supportLineageScopeMemberRef: binding.supportLineageScopeMemberRef,
        sourceLineageRef: binding.sourceLineageRef,
        sourceLineageCaseLinkRef: binding.sourceLineageCaseLinkRef,
        sourceEvidenceSnapshotRef: binding.sourceEvidenceSnapshotRef,
        sourceArtifactRef: binding.sourceArtifactRef,
        derivedArtifactRef: binding.derivedArtifactRef,
        noteOrSummaryRef: binding.noteOrSummaryRef,
        parityDigestRef: binding.parityDigestRef,
        bindingState: binding.bindingState,
        createdAt: binding.createdAt,
        supersededAt: binding.supersededAt,
      })),
      historySlices: [
        {
          sliceRef: `history_slice_${state.ticket.supportTicketId}_failure`,
          sourceType:
            context.communicationDomain === "callback_case" ? "callback_case" : "message_thread",
          sourceRef: context.governingObjectRef,
          sourceVersionRef: context.governingObjectVersionRef,
          supportLineageScopeMemberRef: state.binding.primaryScopeMemberRef,
          supportLineageArtifactBindingRef:
            state.artifactBindings[0]?.supportLineageArtifactBindingId ?? null,
          chronologyAt: state.updatedAt,
          maskedSummary:
            context.communicationDomain === "callback_case"
              ? "Callback failure is under governed support follow-up."
              : "Message delivery failure is under governed support repair.",
          boundedDetail: `${state.ticket.reasonCategory} on ${context.governingObjectRef}`,
          visibilityMode: "repair_actionable",
        },
        ...(state.latestSettlementRef
          ? [
              {
                sliceRef: `history_slice_${state.ticket.supportTicketId}_settlement`,
                sourceType: "support_note" as const,
                sourceRef: state.latestSettlementRef,
                sourceVersionRef: state.ticket.ticketVersionRef,
                supportLineageScopeMemberRef: state.binding.primaryScopeMemberRef,
                supportLineageArtifactBindingRef:
                  state.artifactBindings.at(-1)?.supportLineageArtifactBindingId ?? null,
                chronologyAt: state.updatedAt,
                maskedSummary: "The latest support settlement remains bound to the same communication chain.",
                boundedDetail: state.latestSettlementRef,
                visibilityMode: "bounded_detail" as const,
              },
            ]
          : []),
        ...(state.latestResolutionSnapshotRef
          ? [
              {
                sliceRef: `history_slice_${state.ticket.supportTicketId}_resolution`,
                sourceType: "support_note" as const,
                sourceRef: state.latestResolutionSnapshotRef,
                sourceVersionRef: state.ticket.ticketVersionRef,
                supportLineageScopeMemberRef: state.binding.primaryScopeMemberRef,
                supportLineageArtifactBindingRef:
                  state.artifactBindings.at(-1)?.supportLineageArtifactBindingId ?? null,
                chronologyAt: state.updatedAt,
                maskedSummary: "A provenance-bound support resolution summary is available.",
                boundedDetail: state.latestResolutionSnapshotRef,
                visibilityMode: "bounded_detail" as const,
              },
            ]
          : []),
      ],
      repeatContactSignalRef: `repeat_contact_signal_${state.ticket.supportTicketId}`,
      contactRouteHealthState: this.resolveContactRouteHealthState(context),
      recentOutcomeRefs: [
        ...new Set(
          [
            state.latestSettlementRef,
            state.latestResolutionSnapshotRef,
            context.latestDeliveryEvidenceBundleRef,
            context.latestCallbackOutcomeEvidenceBundleRef,
          ].filter((value): value is string => Boolean(value)),
        ),
      ],
      generatedAt: state.updatedAt,
    };
  }

  private resolveContactRouteHealthState(
    context: SupportCommunicationContext,
  ): "clear" | "at_risk" | "blocked" | "disputed" {
    switch (context.failureState) {
      case "disputed":
        return "disputed";
      case "failed":
      case "expired":
      case "route_invalid":
      case "delivery_repair_required":
      case "route_repair_required":
        return "blocked";
      case "no_answer":
      case "at_risk":
      case "likely_failed":
        return "at_risk";
      default:
        return "clear";
    }
  }

  private resolveAuthoritativeDeliveryState(
    context: SupportCommunicationContext,
  ): "unobserved" | "delivered" | "failed" | "disputed" | "expired" {
    switch (context.failureState) {
      case "delivered":
        return "delivered";
      case "disputed":
        return "disputed";
      case "expired":
        return "expired";
      case "no_answer":
      case "failed":
      case "route_invalid":
      case "provider_failure":
      case "delivery_repair_required":
      case "route_repair_required":
        return "failed";
      default:
        return "unobserved";
    }
  }

  private async resolveCommunicationContext(
    taskId: string,
    domain: SupportCommunicationDomain,
    communicationObjectRef?: string | null,
  ): Promise<SupportCommunicationContext> {
    const repairBundle = await this.communicationRepairApplication.queryTaskCommunicationRepair(taskId);
    if (domain === "clinician_message_thread") {
      const messageBundle = await this.clinicianMessageApplication.queryTaskClinicianMessageDomain(taskId);
      invariant(messageBundle, "MESSAGE_THREAD_NOT_FOUND", `No clinician-message thread for task ${taskId}.`);
      if (communicationObjectRef) {
        invariant(
          messageBundle.messageThread.threadId === communicationObjectRef,
          "MESSAGE_THREAD_TASK_MISMATCH",
          `Thread ${communicationObjectRef} does not belong to task ${taskId}.`,
        );
      }
      const thread = messageBundle.messageThread;
      const dispatch = messageBundle.currentDispatchEnvelope;
      const delivery = messageBundle.currentDeliveryEvidenceBundle;
      const expectation = messageBundle.currentExpectationEnvelope;
      const resolutionGate = messageBundle.currentResolutionGate;
      const failureState =
        delivery?.deliveryState ??
        expectation?.patientVisibleState ??
        thread.patientVisibleExpectationState;
      invariant(
        ["failed", "disputed", "expired", "delivery_repair_required", "at_risk", "likely_failed"].includes(
          failureState,
        ),
        "MESSAGE_FAILURE_NOT_ACTIVE",
        "Support linkage may open only on an active message failure or repair path.",
      );
      const hashes = buildSupportCommunicationHashBundle({
        domain,
        requestLineageRef: thread.requestLineageRef,
        lineageCaseLinkRef: thread.lineageCaseLinkRef,
        governingObjectRef: thread.threadId,
        governingObjectVersionRef: `message_thread_${thread.threadId}_v${thread.version}`,
        governingThreadRef: thread.threadId,
        governingSubthreadRef: dispatch?.messageDispatchEnvelopeId ?? null,
        sourceArtifactRef:
          delivery?.messageDeliveryEvidenceBundleId ??
          dispatch?.messageDispatchEnvelopeId ??
          expectation?.threadExpectationEnvelopeId ??
          null,
        sourceEvidenceSnapshotRef:
          delivery?.messageDeliveryEvidenceBundleId ??
          expectation?.threadExpectationEnvelopeId ??
          null,
        reachabilityEpoch: repairBundle.messageRepair?.binding.currentReachabilityEpoch ?? 0,
        deliveryOrExpectationState: failureState,
      });
      return {
        communicationDomain: domain,
        taskId,
        requestId: thread.requestId,
        requestLineageRef: thread.requestLineageRef,
        lineageCaseLinkRef: thread.lineageCaseLinkRef,
        governingObjectDescriptorRef: "ClinicianMessageThread",
        governingObjectRef: thread.threadId,
        governingObjectVersionRef: `message_thread_${thread.threadId}_v${thread.version}`,
        governingThreadRef: thread.threadId,
        governingSubthreadRef: dispatch?.messageDispatchEnvelopeId ?? null,
        governingThreadTupleHash: hashes.governingThreadTupleHash,
        governingSubthreadTupleHash: hashes.governingSubthreadTupleHash,
        communicationChainHash: hashes.communicationChainHash,
        routeIntentBindingRef:
          dispatch?.routeIntentBindingRef ??
          expectation?.routeIntentBindingRef ??
          `route_intent_${taskId}`,
        sourceArtifactRef:
          delivery?.messageDeliveryEvidenceBundleId ??
          dispatch?.messageDispatchEnvelopeId ??
          expectation?.threadExpectationEnvelopeId ??
          null,
        sourceEvidenceSnapshotRef:
          delivery?.messageDeliveryEvidenceBundleId ??
          expectation?.threadExpectationEnvelopeId ??
          null,
        messageDispatchEnvelopeRef: dispatch?.messageDispatchEnvelopeId ?? null,
        latestDeliveryEvidenceBundleRef: delivery?.messageDeliveryEvidenceBundleId ?? null,
        latestThreadExpectationEnvelopeRef: expectation?.threadExpectationEnvelopeId ?? null,
        latestThreadResolutionGateRef: resolutionGate?.threadResolutionGateId ?? null,
        callbackCaseRef: null,
        latestCallbackExpectationEnvelopeRef: null,
        latestCallbackOutcomeEvidenceBundleRef: null,
        latestCallbackResolutionGateRef: null,
        reachabilityDependencyRef:
          repairBundle.messageRepair?.binding.reachabilityDependencyRef ??
          thread.reachabilityDependencyRef,
        reachabilityAssessmentRef:
          repairBundle.messageRepair?.binding.currentReachabilityAssessmentRef ?? null,
        reachabilityEpoch: repairBundle.messageRepair?.binding.currentReachabilityEpoch ?? 0,
        contactRepairJourneyRef: repairBundle.messageRepair?.binding.activeRepairJourneyRef ?? null,
        subjectRef: `subject_${thread.requestId}`,
        maskScopeRef: `support_mask_scope_${taskId}`,
        disclosureCeilingRef: `support_disclosure_ceiling_${taskId}`,
        reasonCategory: deriveSupportCommunicationReasonCategory({
          domain,
          deliveryOrExpectationState: failureState,
        }),
        severity: deriveSupportCommunicationSeverity({
          domain,
          deliveryOrExpectationState: failureState,
          reachabilityEpoch: repairBundle.messageRepair?.binding.currentReachabilityEpoch ?? 0,
        }),
        allowedActionRefs: deriveSupportAllowedActionRefs(domain),
        failureState,
      };
    }

    const callbackBundle = await this.callbackApplication.queryTaskCallbackDomain(taskId);
    invariant(callbackBundle, "CALLBACK_CASE_NOT_FOUND", `No callback case for task ${taskId}.`);
    if (communicationObjectRef) {
      invariant(
        callbackBundle.callbackCase.callbackCaseId === communicationObjectRef,
        "CALLBACK_TASK_MISMATCH",
        `Callback case ${communicationObjectRef} does not belong to task ${taskId}.`,
      );
    }
    const callbackCase = callbackBundle.callbackCase;
    const outcome = callbackBundle.latestOutcomeEvidenceBundle;
    const expectation = callbackBundle.currentExpectationEnvelope;
    const resolutionGate = callbackBundle.currentResolutionGate;
    const failureState =
      outcome?.outcome ?? expectation?.patientVisibleState ?? callbackCase.patientVisibleExpectationState;
    invariant(
      ["no_answer", "route_invalid", "provider_failure", "route_repair_required"].includes(
        failureState,
      ) ||
        repairBundle.callbackRepair?.binding.bindingState === "repair_required" ||
        repairBundle.callbackRepair?.binding.bindingState === "awaiting_verification",
      "CALLBACK_FAILURE_NOT_ACTIVE",
      "Support linkage may open only on an active callback failure or repair path.",
    );
    const hashes = buildSupportCommunicationHashBundle({
      domain,
      requestLineageRef: callbackCase.requestLineageRef,
      lineageCaseLinkRef: callbackCase.lineageCaseLinkRef,
      governingObjectRef: callbackCase.callbackCaseId,
      governingObjectVersionRef: `callback_case_${callbackCase.callbackCaseId}_v${callbackCase.version}`,
      governingThreadRef: callbackCase.callbackCaseId,
      governingSubthreadRef:
        outcome?.callbackOutcomeEvidenceBundleId ?? expectation?.expectationEnvelopeId ?? null,
      sourceArtifactRef:
        outcome?.callbackOutcomeEvidenceBundleId ?? expectation?.expectationEnvelopeId ?? null,
      sourceEvidenceSnapshotRef:
        outcome?.callbackOutcomeEvidenceBundleId ?? expectation?.expectationEnvelopeId ?? null,
      reachabilityEpoch: repairBundle.callbackRepair?.binding.currentReachabilityEpoch ?? 0,
      deliveryOrExpectationState: failureState,
    });
    return {
      communicationDomain: domain,
      taskId,
      requestId: callbackCase.requestId,
      requestLineageRef: callbackCase.requestLineageRef,
      lineageCaseLinkRef: callbackCase.lineageCaseLinkRef,
      governingObjectDescriptorRef: "CallbackCase",
      governingObjectRef: callbackCase.callbackCaseId,
      governingObjectVersionRef: `callback_case_${callbackCase.callbackCaseId}_v${callbackCase.version}`,
      governingThreadRef: callbackCase.callbackCaseId,
      governingSubthreadRef:
        outcome?.callbackOutcomeEvidenceBundleId ?? expectation?.expectationEnvelopeId ?? null,
      governingThreadTupleHash: hashes.governingThreadTupleHash,
      governingSubthreadTupleHash: hashes.governingSubthreadTupleHash,
      communicationChainHash: hashes.communicationChainHash,
      routeIntentBindingRef: expectation?.routeIntentBindingRef ?? `route_intent_${taskId}`,
      sourceArtifactRef:
        outcome?.callbackOutcomeEvidenceBundleId ?? expectation?.expectationEnvelopeId ?? null,
      sourceEvidenceSnapshotRef:
        outcome?.callbackOutcomeEvidenceBundleId ?? expectation?.expectationEnvelopeId ?? null,
      messageDispatchEnvelopeRef: null,
      latestDeliveryEvidenceBundleRef: null,
      latestThreadExpectationEnvelopeRef: null,
      latestThreadResolutionGateRef: null,
      callbackCaseRef: callbackCase.callbackCaseId,
      latestCallbackExpectationEnvelopeRef: expectation?.expectationEnvelopeId ?? null,
      latestCallbackOutcomeEvidenceBundleRef: outcome?.callbackOutcomeEvidenceBundleId ?? null,
      latestCallbackResolutionGateRef: resolutionGate?.callbackResolutionGateId ?? null,
      reachabilityDependencyRef:
        repairBundle.callbackRepair?.binding.reachabilityDependencyRef ??
        callbackCase.reachabilityDependencyRef,
      reachabilityAssessmentRef:
        repairBundle.callbackRepair?.binding.currentReachabilityAssessmentRef ?? null,
      reachabilityEpoch: repairBundle.callbackRepair?.binding.currentReachabilityEpoch ?? 0,
      contactRepairJourneyRef: repairBundle.callbackRepair?.binding.activeRepairJourneyRef ?? null,
      subjectRef: `subject_${callbackCase.requestId}`,
      maskScopeRef: `support_mask_scope_${taskId}`,
      disclosureCeilingRef: `support_disclosure_ceiling_${taskId}`,
      reasonCategory: deriveSupportCommunicationReasonCategory({
        domain,
        deliveryOrExpectationState: failureState,
      }),
      severity: deriveSupportCommunicationSeverity({
        domain,
        deliveryOrExpectationState: failureState,
        reachabilityEpoch: repairBundle.callbackRepair?.binding.currentReachabilityEpoch ?? 0,
      }),
      allowedActionRefs: deriveSupportAllowedActionRefs(domain),
      failureState,
    };
  }

  private async buildTransientLinkageBundle(
    context: SupportCommunicationContext,
    requestedAt: string,
  ): Promise<SupportCommunicationFailureLinkageBundle> {
    const supportTicketId = stableRef("support_ticket_248_transient", [
      context.communicationDomain,
      context.governingObjectRef,
      requestedAt,
    ]);
    const binding: SupportLineageBinding = {
      projectionName: "SupportLineageBinding",
      supportLineageBindingId: stableRef("support_lineage_binding_248_transient", [supportTicketId]),
      supportTicketId,
      subjectRef: context.subjectRef,
      primaryRequestLineageRef: context.requestLineageRef,
      primaryLineageCaseLinkRef: context.lineageCaseLinkRef,
      primaryScopeMemberRef: stableRef("support_scope_member_transient", [supportTicketId]),
      governingObjectDescriptorRef: context.governingObjectDescriptorRef,
      governingObjectRef: context.governingObjectRef,
      governingObjectVersionRef: context.governingObjectVersionRef,
      scopeMemberRefs: [stableRef("support_scope_member_transient", [supportTicketId])],
      sourceLineageRefs: [context.requestLineageRef],
      sourceThreadRefs: [context.governingThreadRef],
      sourceArtifactRefs: [context.sourceArtifactRef ?? context.governingObjectRef],
      maskScopeRef: context.maskScopeRef,
      disclosureCeilingRef: context.disclosureCeilingRef,
      bindingHash: stableRef("binding_hash_transient", [supportTicketId]),
      supersedesSupportLineageBindingRef: null,
      bindingState: "stale",
      createdAt: requestedAt,
      supersededAt: null,
    };
    const scopeMember: SupportLineageScopeMember = {
      projectionName: "SupportLineageScopeMember",
      supportLineageScopeMemberId: binding.primaryScopeMemberRef,
      supportLineageBindingRef: binding.supportLineageBindingId,
      requestLineageRef: context.requestLineageRef,
      lineageCaseLinkRef: context.lineageCaseLinkRef,
      domainCaseRef: context.governingObjectRef,
      governingObjectDescriptorRef: context.governingObjectDescriptorRef,
      governingObjectRef: context.governingObjectRef,
      governingObjectVersionRef: context.governingObjectVersionRef,
      sourceThreadRef: context.governingThreadRef,
      sourceArtifactRef: context.sourceArtifactRef,
      memberRole: "primary_action_target",
      continuityWitnessRef: `support_continuity_${supportTicketId}`,
      visibilityMode: "repair_actionable",
      actionability: "governed_mutation",
      memberState: "stale",
      addedAt: requestedAt,
      releasedAt: null,
    };
    const ticket: SupportTicket = {
      projectionName: "SupportTicket",
      supportTicketId,
      originRef: `${context.communicationDomain}:${context.governingObjectRef}`,
      originChannel: "phase3_communication_failure",
      subjectRef: context.subjectRef,
      supportLineageBindingRef: binding.supportLineageBindingId,
      supportLineageBindingHash: binding.bindingHash,
      primaryRequestLineageRef: context.requestLineageRef,
      primaryLineageCaseLinkRef: context.lineageCaseLinkRef,
      activeScopeMemberRefs: [scopeMember.supportLineageScopeMemberId],
      reasonCategory: context.reasonCategory,
      severity: context.severity,
      slaState: "at_risk",
      ticketState: "open",
      currentOwnerRef: "support_unassigned",
      queueKey: "support.communication-failure",
      latestSubjectEventRef: context.sourceArtifactRef ?? context.governingObjectRef,
      selectedTimelineAnchorRef: context.sourceArtifactRef ?? context.governingObjectRef,
      selectedTimelineAnchorTupleHashRef: context.governingThreadTupleHash,
      activeConversationRef: context.governingThreadRef,
      currentKnowledgePackRef: `support_knowledge_pack_${context.communicationDomain}_v1`,
      currentHistoryPackRef: `support_history_pack_${context.communicationDomain}_v1`,
      effectiveMaskScopeRef: context.maskScopeRef,
      allowedActionRefs: context.allowedActionRefs,
      currentActionLeaseRef: null,
      activeMutationAttemptRef: null,
      activeIdentityCorrectionRequestRef: null,
      activeIdentityRepairCaseRef: null,
      identityRepairFreezeRef: null,
      identityRepairReleaseSettlementRef: null,
      activeReplayCheckpointRef: null,
      activeObserveSessionRef: null,
      activeTransferRef: null,
      activeTransferAcceptanceSettlementRef: null,
      activeReadOnlyFallbackRef: null,
      ticketVersionRef: `${supportTicketId}_v0`,
      shellMode: "read_only_recovery",
      staffWorkspaceConsistencyProjectionRef: `staff_workspace_consistency_${supportTicketId}`,
      workspaceSliceTrustProjectionRef: `workspace_slice_trust_${supportTicketId}`,
      supportSurfaceRuntimeBindingRef: `support_surface_runtime_binding_${supportTicketId}`,
      releaseRecoveryDispositionRef: `/ops/support/tickets/${supportTicketId}/recover`,
      taskCompletionSettlementEnvelopeRef: null,
      lastResolutionSummaryRef: null,
    };
    const artifactBinding: SupportLineageArtifactBinding = {
      projectionName: "SupportLineageArtifactBinding",
      supportLineageArtifactBindingId: stableRef("support_artifact_binding_transient", [
        supportTicketId,
      ]),
      supportLineageBindingRef: binding.supportLineageBindingId,
      supportLineageScopeMemberRef: scopeMember.supportLineageScopeMemberId,
      supportTicketId,
      sourceLineageRef: context.requestLineageRef,
      sourceLineageCaseLinkRef: context.lineageCaseLinkRef,
      sourceEvidenceSnapshotRef:
        context.sourceEvidenceSnapshotRef ?? `support_source_snapshot_${supportTicketId}`,
      sourceArtifactRef: context.sourceArtifactRef ?? context.governingObjectRef,
      derivedArtifactRef: `support_attach_summary_${supportTicketId}`,
      noteOrSummaryRef: `support_attach_note_${supportTicketId}`,
      maskScopeRef: context.maskScopeRef,
      disclosureCeilingRef: context.disclosureCeilingRef,
      parityDigestRef: context.communicationChainHash,
      bindingState: "active",
      createdAt: requestedAt,
      supersededAt: null,
    };
    return {
      supportTicket: ticket,
      supportLineageBinding: binding,
      supportLineageScopeMembers: [scopeMember],
      supportLineageArtifactBindings: [artifactBinding],
      latestActionRecord: null,
      latestSettlement: this.buildStaleRecoverableSettlement(
        {
          ticket,
          binding,
          scopeMembers: [scopeMember],
          artifactBindings: [artifactBinding],
          taskId: context.taskId,
          communicationDomain: context.communicationDomain,
          communicationObjectRef: context.governingObjectRef,
          failurePathKey: stableRef("support_failure_path_transient", [supportTicketId]),
          currentCommunicationTupleHash: context.governingThreadTupleHash,
          latestActionRecordRef: null,
          latestSettlementRef: null,
          latestResolutionSnapshotRef: null,
          version: 0,
          updatedAt: requestedAt,
        },
        context,
        requestedAt,
      ),
      latestResolutionSnapshot: null,
      communicationContext: context,
      supportWorkspace: this.buildWorkspaceBundle(
        {
          ticket,
          binding,
          scopeMembers: [scopeMember],
          artifactBindings: [artifactBinding],
          taskId: context.taskId,
          communicationDomain: context.communicationDomain,
          communicationObjectRef: context.governingObjectRef,
          failurePathKey: stableRef("support_failure_path_transient", [supportTicketId]),
          currentCommunicationTupleHash: context.governingThreadTupleHash,
          latestActionRecordRef: null,
          latestSettlementRef: null,
          latestResolutionSnapshotRef: null,
          version: 0,
          updatedAt: requestedAt,
        },
        context,
      ),
    };
  }
}

export interface Phase3SupportCommunicationLinkageApplication {
  readonly serviceName: typeof PHASE3_SUPPORT_COMMUNICATION_LINKAGE_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_SUPPORT_COMMUNICATION_LINKAGE_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_SUPPORT_COMMUNICATION_LINKAGE_QUERY_SURFACES;
  readonly routes: typeof phase3SupportCommunicationLinkageRoutes;
  openOrAttachSupportCommunicationFailure(
    input: OpenSupportCommunicationFailureInput,
  ): Promise<OpenSupportCommunicationFailureResult>;
  querySupportCommunicationFailureLinkage(
    supportTicketId: string,
  ): Promise<SupportCommunicationFailureLinkageBundle>;
  recordSupportCommunicationAction(
    input: RecordSupportCommunicationActionInput,
  ): Promise<RecordSupportCommunicationActionResult>;
  publishSupportResolutionSnapshot(
    input: PublishSupportResolutionSnapshotInput,
  ): Promise<PublishSupportResolutionSnapshotResult>;
}

export function createPhase3SupportCommunicationLinkageApplication(
  options?: SupportCommunicationLinkageApplicationOptions,
): Phase3SupportCommunicationLinkageApplication {
  return new Phase3SupportCommunicationLinkageApplicationImpl(options);
}
