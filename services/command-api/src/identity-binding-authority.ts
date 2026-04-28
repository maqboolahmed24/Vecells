import { createHash } from "node:crypto";

export const identityBindingAuthorityPersistenceTables = [
  "identity_binding_authority_versions",
  "identity_binding_current_pointers",
  "identity_binding_command_settlements",
  "identity_binding_lineage_patient_refs",
  "identity_binding_freeze_holds",
  "identity_binding_authority_audit",
] as const;

export const identityBindingAuthorityMigrationPlanRefs = [
  "services/command-api/migrations/094_phase2_identity_binding_authority.sql",
] as const;

export const identityBindingAuthorityParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_SOLE_AUTHORITY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_APPEND_ONLY_VERSION_CHAIN_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_CURRENT_POINTER_CAS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_DERIVED_PATIENT_REF_TRANSACTION_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_IDEMPOTENT_COMMAND_REPLAY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_BINDING_FREEZE_AWARE_REFUSAL_V1",
] as const;

export const IDENTITY_BINDING_AUTHORITY_SCHEMA_VERSION = "170.phase2.trust.v1";
export const IDENTITY_BINDING_AUTHORITY_POLICY_VERSION = "phase2-binding-authority-v1";
export const IDENTITY_BINDING_AUTHORITY_NAME = "IdentityBindingAuthority";

export type BindingAuthorityIntentType =
  | "candidate_refresh"
  | "provisional_verify"
  | "verified_bind"
  | "claim_confirmed"
  | "correction_applied"
  | "revoked";

export type IdentityBindingState =
  | "candidate"
  | "provisional_verified"
  | "verified_patient"
  | "claimed"
  | "corrected"
  | "revoked"
  | "repair_hold";

export type IdentityBindingOwnershipState = "claim_pending" | "claimed" | "revoked" | "repair_hold";
export type IdentityBindingAssuranceLevel = "none" | "low" | "medium" | "high" | "manual";

export type BindingAuthoritySettlementDecision =
  | "accepted"
  | "replayed"
  | "denied"
  | "stale_rejected"
  | "freeze_blocked"
  | "cas_conflict";

export type BindingLineageKind = "request" | "episode";
export type BindingFreezeState = "active" | "released";

export interface BindingConfidenceSnapshot {
  readonly P_link: number;
  readonly LCB_link_alpha: number;
  readonly P_subject: number;
  readonly LCB_subject_alpha: number;
  readonly runnerUpProbabilityUpperBound: number;
  readonly gap_logit: number;
  readonly confidenceModelState: "calibrated" | "drift_review" | "out_of_domain";
}

export interface BindingLineageRef {
  readonly lineageKind: BindingLineageKind;
  readonly lineageRef: string;
}

export interface SettleIdentityBindingCommandInput {
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly subjectRef: string;
  readonly intentType: BindingAuthorityIntentType;
  readonly expectedCurrentBindingVersionRef?: string | null;
  readonly patientLinkDecisionRef?: string | null;
  readonly candidatePatientRef?: string | null;
  readonly targetPatientRef?: string | null;
  readonly routeIntentBindingRef?: string | null;
  readonly confidence: BindingConfidenceSnapshot;
  readonly provenanceRefs: readonly string[];
  readonly derivedLineageRefs?: readonly BindingLineageRef[];
  readonly actorRef: string;
  readonly reasonCodes?: readonly string[];
  readonly repairAuthorized?: boolean;
  readonly observedAt?: string;
}

export interface IdentityBindingVersion {
  readonly identityBindingId: string;
  readonly bindingVersionRef: string;
  readonly schemaVersion: typeof IDENTITY_BINDING_AUTHORITY_SCHEMA_VERSION;
  readonly policyVersion: typeof IDENTITY_BINDING_AUTHORITY_POLICY_VERSION;
  readonly subjectRef: string;
  readonly patientRef: string | null;
  readonly bindingState: IdentityBindingState;
  readonly ownershipState: IdentityBindingOwnershipState;
  readonly assuranceLevel: IdentityBindingAssuranceLevel;
  readonly intentType: BindingAuthorityIntentType;
  readonly bindingVersion: number;
  readonly supersedesBindingVersionRef: string | null;
  readonly patientLinkDecisionRef: string | null;
  readonly routeIntentBindingRef: string | null;
  readonly confidence: BindingConfidenceSnapshot;
  readonly provenanceRefs: readonly string[];
  readonly createdAt: string;
  readonly createdByAuthority: typeof IDENTITY_BINDING_AUTHORITY_NAME;
}

export interface IdentityBindingCurrentPointer {
  readonly subjectRef: string;
  readonly currentBindingVersionRef: string | null;
  readonly currentPatientRef: string | null;
  readonly pointerEpoch: number;
  readonly bindingState: IdentityBindingState;
  readonly updatedAt: string;
}

export interface DerivedPatientRefSettlement {
  readonly derivedSettlementRef: string;
  readonly lineageKind: BindingLineageKind;
  readonly lineageRef: string;
  readonly subjectRef: string;
  readonly previousPatientRef: string | null;
  readonly nextPatientRef: string | null;
  readonly previousBindingVersionRef: string | null;
  readonly nextBindingVersionRef: string;
  readonly updatedByAuthority: typeof IDENTITY_BINDING_AUTHORITY_NAME;
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
}

export interface BindingCommandSettlement {
  readonly commandSettlementId: string;
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly subjectRef: string;
  readonly intentType: BindingAuthorityIntentType;
  readonly decision: BindingAuthoritySettlementDecision;
  readonly bindingVersionRef: string | null;
  readonly previousBindingVersionRef: string | null;
  readonly currentPointerEpochBefore: number;
  readonly currentPointerEpochAfter: number;
  readonly derivedPatientRefSettlementRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
}

export interface IdentityBindingFreezeHold {
  readonly freezeHoldRef: string;
  readonly subjectRef: string;
  readonly state: BindingFreezeState;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
  readonly releasedAt: string | null;
}

export interface IdentityBindingAuthorityAuditRecord {
  readonly auditRecordRef: string;
  readonly subjectRef: string;
  readonly commandSettlementRef: string;
  readonly actorRef: string;
  readonly intentType: BindingAuthorityIntentType;
  readonly decision: BindingAuthoritySettlementDecision;
  readonly reasonCodes: readonly string[];
  readonly recordedAt: string;
}

export interface BindingAuthorityTransactionInput {
  readonly expectedCurrentBindingVersionRef: string | null;
  readonly binding: IdentityBindingVersion;
  readonly pointer: IdentityBindingCurrentPointer;
  readonly lineageRefs: readonly BindingLineageRef[];
  readonly settlement: BindingCommandSettlement;
  readonly audit: IdentityBindingAuthorityAuditRecord;
}

export interface BindingAuthorityCommitResult {
  readonly committed: boolean;
  readonly settlement: BindingCommandSettlement;
  readonly binding: IdentityBindingVersion | null;
  readonly pointer: IdentityBindingCurrentPointer | null;
  readonly derivedSettlements: readonly DerivedPatientRefSettlement[];
  readonly audit: IdentityBindingAuthorityAuditRecord;
  readonly reasonCodes: readonly string[];
}

export interface IdentityBindingAuthorityRepository {
  getSettlementByIdempotencyKey(idempotencyKey: string): Promise<BindingCommandSettlement | null>;
  getBindingVersion(bindingVersionRef: string): Promise<IdentityBindingVersion | null>;
  getCurrentPointer(subjectRef: string): Promise<IdentityBindingCurrentPointer | null>;
  getLineagePatientRef(
    lineageKind: BindingLineageKind,
    lineageRef: string,
  ): Promise<DerivedPatientRefSettlement | null>;
  getActiveFreezeHold(subjectRef: string): Promise<IdentityBindingFreezeHold | null>;
  saveFreezeHold(hold: IdentityBindingFreezeHold): Promise<void>;
  saveDeniedSettlement(input: {
    readonly settlement: BindingCommandSettlement;
    readonly audit: IdentityBindingAuthorityAuditRecord;
  }): Promise<void>;
  commitAuthorityTransaction(
    input: BindingAuthorityTransactionInput,
  ): Promise<BindingAuthorityCommitResult>;
}

export interface SettleIdentityBindingCommandResult {
  readonly settlement: BindingCommandSettlement;
  readonly binding: IdentityBindingVersion | null;
  readonly currentPointer: IdentityBindingCurrentPointer | null;
  readonly derivedPatientRefSettlements: readonly DerivedPatientRefSettlement[];
  readonly audit: IdentityBindingAuthorityAuditRecord;
  readonly replayed: boolean;
}

export interface CreateIdentityBindingFreezeInput {
  readonly subjectRef: string;
  readonly reasonCodes: readonly string[];
  readonly actorRef: string;
  readonly observedAt?: string;
}

export interface IdentityBindingAuthorityService {
  settleIdentityBindingCommand(
    input: SettleIdentityBindingCommandInput,
  ): Promise<SettleIdentityBindingCommandResult>;
  createFreezeHold(input: CreateIdentityBindingFreezeInput): Promise<IdentityBindingFreezeHold>;
  getCurrentBinding(subjectRef: string): Promise<IdentityBindingCurrentPointer | null>;
}

export interface IdentityBindingAuthorityApplication {
  readonly identityBindingAuthority: IdentityBindingAuthorityService;
  readonly repository: IdentityBindingAuthorityRepository;
  readonly migrationPlanRef: (typeof identityBindingAuthorityMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof identityBindingAuthorityMigrationPlanRefs;
  readonly persistenceTables: typeof identityBindingAuthorityPersistenceTables;
  readonly parallelInterfaceGaps: typeof identityBindingAuthorityParallelInterfaceGaps;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, stableValue(record[key])]),
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function deterministicId(prefix: string, value: unknown): string {
  return `${prefix}_${sha256(`${prefix}:${stableJson(value)}`).slice(0, 24)}`;
}

function cloneConfidence(confidence: BindingConfidenceSnapshot): BindingConfidenceSnapshot {
  return Object.freeze({ ...confidence });
}

function cloneBinding(binding: IdentityBindingVersion): IdentityBindingVersion {
  return Object.freeze({
    ...binding,
    confidence: cloneConfidence(binding.confidence),
    provenanceRefs: Object.freeze([...binding.provenanceRefs]),
  });
}

function clonePointer(pointer: IdentityBindingCurrentPointer): IdentityBindingCurrentPointer {
  return Object.freeze({ ...pointer });
}

function cloneSettlement(settlement: BindingCommandSettlement): BindingCommandSettlement {
  return Object.freeze({
    ...settlement,
    derivedPatientRefSettlementRefs: Object.freeze([...settlement.derivedPatientRefSettlementRefs]),
    reasonCodes: Object.freeze([...settlement.reasonCodes]),
  });
}

function cloneDerivedSettlement(
  settlement: DerivedPatientRefSettlement,
): DerivedPatientRefSettlement {
  return Object.freeze({
    ...settlement,
    reasonCodes: Object.freeze([...settlement.reasonCodes]),
  });
}

function cloneFreezeHold(hold: IdentityBindingFreezeHold): IdentityBindingFreezeHold {
  return Object.freeze({
    ...hold,
    reasonCodes: Object.freeze([...hold.reasonCodes]),
  });
}

function cloneAudit(
  audit: IdentityBindingAuthorityAuditRecord,
): IdentityBindingAuthorityAuditRecord {
  return Object.freeze({
    ...audit,
    reasonCodes: Object.freeze([...audit.reasonCodes]),
  });
}

function stateForIntent(intentType: BindingAuthorityIntentType): {
  readonly bindingState: IdentityBindingState;
  readonly ownershipState: IdentityBindingOwnershipState;
  readonly assuranceLevel: IdentityBindingAssuranceLevel;
  readonly patientRequired: boolean;
} {
  const map: Record<
    BindingAuthorityIntentType,
    {
      readonly bindingState: IdentityBindingState;
      readonly ownershipState: IdentityBindingOwnershipState;
      readonly assuranceLevel: IdentityBindingAssuranceLevel;
      readonly patientRequired: boolean;
    }
  > = {
    candidate_refresh: {
      bindingState: "candidate",
      ownershipState: "claim_pending",
      assuranceLevel: "medium",
      patientRequired: false,
    },
    provisional_verify: {
      bindingState: "provisional_verified",
      ownershipState: "claim_pending",
      assuranceLevel: "medium",
      patientRequired: false,
    },
    verified_bind: {
      bindingState: "verified_patient",
      ownershipState: "claimed",
      assuranceLevel: "high",
      patientRequired: true,
    },
    claim_confirmed: {
      bindingState: "claimed",
      ownershipState: "claimed",
      assuranceLevel: "high",
      patientRequired: true,
    },
    correction_applied: {
      bindingState: "corrected",
      ownershipState: "claimed",
      assuranceLevel: "manual",
      patientRequired: true,
    },
    revoked: {
      bindingState: "revoked",
      ownershipState: "revoked",
      assuranceLevel: "none",
      patientRequired: false,
    },
  };
  return map[intentType];
}

function patientRefForCommand(input: SettleIdentityBindingCommandInput): string | null {
  if (input.intentType === "revoked" || input.intentType === "candidate_refresh") {
    return null;
  }
  if (input.intentType === "provisional_verify") {
    return null;
  }
  return input.targetPatientRef ?? input.candidatePatientRef ?? null;
}

function baseAcceptedReasonCodes(input: SettleIdentityBindingCommandInput): string[] {
  const reasonCodes = [
    "BINDING_179_AUTHORITY_SOLE_WRITER",
    "BINDING_179_ACCEPTED_APPEND_ONLY",
    "BINDING_179_CURRENT_POINTER_CAS",
  ];
  if (input.derivedLineageRefs?.length) {
    reasonCodes.push("BINDING_179_DERIVED_PATIENT_REF_ADVANCED");
  }
  if (input.intentType === "correction_applied") {
    reasonCodes.push("BINDING_179_REPAIR_AUTHORITY_RELEASED");
  }
  if (input.intentType === "revoked") {
    reasonCodes.push("BINDING_179_REVOKED");
  }
  return [...reasonCodes, ...(input.reasonCodes ?? [])];
}

function createSettlement(input: {
  readonly command: SettleIdentityBindingCommandInput;
  readonly decision: BindingAuthoritySettlementDecision;
  readonly bindingVersionRef: string | null;
  readonly previousBindingVersionRef: string | null;
  readonly epochBefore: number;
  readonly epochAfter: number;
  readonly derivedRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly settledAt: string;
}): BindingCommandSettlement {
  return Object.freeze({
    commandSettlementId: deterministicId("ibas", {
      commandId: input.command.commandId,
      idempotencyKey: input.command.idempotencyKey,
      decision: input.decision,
    }),
    commandId: input.command.commandId,
    idempotencyKey: input.command.idempotencyKey,
    subjectRef: input.command.subjectRef,
    intentType: input.command.intentType,
    decision: input.decision,
    bindingVersionRef: input.bindingVersionRef,
    previousBindingVersionRef: input.previousBindingVersionRef,
    currentPointerEpochBefore: input.epochBefore,
    currentPointerEpochAfter: input.epochAfter,
    derivedPatientRefSettlementRefs: Object.freeze([...input.derivedRefs]),
    reasonCodes: Object.freeze([...input.reasonCodes]),
    settledAt: input.settledAt,
  });
}

function createAudit(input: {
  readonly command: SettleIdentityBindingCommandInput;
  readonly settlementRef: string;
  readonly decision: BindingAuthoritySettlementDecision;
  readonly reasonCodes: readonly string[];
  readonly recordedAt: string;
}): IdentityBindingAuthorityAuditRecord {
  return Object.freeze({
    auditRecordRef: deterministicId("ibaa", {
      commandId: input.command.commandId,
      settlementRef: input.settlementRef,
      recordedAt: input.recordedAt,
    }),
    subjectRef: input.command.subjectRef,
    commandSettlementRef: input.settlementRef,
    actorRef: input.command.actorRef,
    intentType: input.command.intentType,
    decision: input.decision,
    reasonCodes: Object.freeze([...input.reasonCodes]),
    recordedAt: input.recordedAt,
  });
}

function isFreezeBypassed(input: SettleIdentityBindingCommandInput): boolean {
  return (
    input.intentType === "revoked" ||
    (input.intentType === "correction_applied" && input.repairAuthorized === true)
  );
}

export function createInMemoryIdentityBindingAuthorityRepository(): IdentityBindingAuthorityRepository & {
  readonly snapshots: () => {
    readonly bindings: readonly IdentityBindingVersion[];
    readonly currentPointers: readonly IdentityBindingCurrentPointer[];
    readonly commandSettlements: readonly BindingCommandSettlement[];
    readonly derivedPatientRefs: readonly DerivedPatientRefSettlement[];
    readonly freezeHolds: readonly IdentityBindingFreezeHold[];
    readonly audit: readonly IdentityBindingAuthorityAuditRecord[];
  };
} {
  const bindings = new Map<string, IdentityBindingVersion>();
  const currentPointers = new Map<string, IdentityBindingCurrentPointer>();
  const commandSettlements = new Map<string, BindingCommandSettlement>();
  const lineagePatientRefs = new Map<string, DerivedPatientRefSettlement>();
  const freezeHolds = new Map<string, IdentityBindingFreezeHold>();
  const auditRecords: IdentityBindingAuthorityAuditRecord[] = [];

  const lineageKey = (lineageKind: BindingLineageKind, lineageRef: string): string =>
    `${lineageKind}:${lineageRef}`;

  return {
    async getSettlementByIdempotencyKey(idempotencyKey) {
      const settlement = commandSettlements.get(idempotencyKey);
      return settlement ? cloneSettlement(settlement) : null;
    },
    async getBindingVersion(bindingVersionRef) {
      const binding = bindings.get(bindingVersionRef);
      return binding ? cloneBinding(binding) : null;
    },
    async getCurrentPointer(subjectRef) {
      const pointer = currentPointers.get(subjectRef);
      return pointer ? clonePointer(pointer) : null;
    },
    async getLineagePatientRef(lineageKind, lineageRef) {
      const settlement = lineagePatientRefs.get(lineageKey(lineageKind, lineageRef));
      return settlement ? cloneDerivedSettlement(settlement) : null;
    },
    async getActiveFreezeHold(subjectRef) {
      const hold = freezeHolds.get(subjectRef);
      if (!hold || hold.state !== "active") {
        return null;
      }
      return cloneFreezeHold(hold);
    },
    async saveFreezeHold(hold) {
      freezeHolds.set(hold.subjectRef, cloneFreezeHold(hold));
    },
    async saveDeniedSettlement(input) {
      commandSettlements.set(input.settlement.idempotencyKey, cloneSettlement(input.settlement));
      auditRecords.push(cloneAudit(input.audit));
    },
    async commitAuthorityTransaction(input) {
      const current = currentPointers.get(input.binding.subjectRef) ?? null;
      const actualCurrent = current?.currentBindingVersionRef ?? null;
      if (actualCurrent !== input.expectedCurrentBindingVersionRef) {
        const reasonCodes = [
          "BINDING_179_STALE_EXPECTED_VERSION",
          "BINDING_179_CAS_CONFLICT_REFUSED",
        ];
        const settlement = cloneSettlement({
          ...input.settlement,
          decision: "cas_conflict",
          bindingVersionRef: null,
          currentPointerEpochAfter: input.settlement.currentPointerEpochBefore,
          derivedPatientRefSettlementRefs: Object.freeze([]),
          reasonCodes: Object.freeze(reasonCodes),
        });
        const audit = cloneAudit({
          ...input.audit,
          decision: "cas_conflict",
          reasonCodes: Object.freeze(reasonCodes),
        });
        commandSettlements.set(settlement.idempotencyKey, settlement);
        auditRecords.push(audit);
        return Object.freeze({
          committed: false,
          settlement,
          binding: null,
          pointer: current ? clonePointer(current) : null,
          derivedSettlements: Object.freeze([]),
          audit,
          reasonCodes: Object.freeze(reasonCodes),
        });
      }

      const derivedSettlements: DerivedPatientRefSettlement[] = [];
      for (const lineage of input.lineageRefs) {
        const key = lineageKey(lineage.lineageKind, lineage.lineageRef);
        const previous = lineagePatientRefs.get(key) ?? null;
        if ((previous?.nextBindingVersionRef ?? null) !== input.expectedCurrentBindingVersionRef) {
          const reasonCodes = [
            "BINDING_179_DERIVED_PATIENT_REF_CAS_CONFLICT",
            "BINDING_179_STALE_EXPECTED_VERSION",
          ];
          const settlement = cloneSettlement({
            ...input.settlement,
            decision: "cas_conflict",
            bindingVersionRef: null,
            currentPointerEpochAfter: input.settlement.currentPointerEpochBefore,
            derivedPatientRefSettlementRefs: Object.freeze([]),
            reasonCodes: Object.freeze(reasonCodes),
          });
          const audit = cloneAudit({
            ...input.audit,
            decision: "cas_conflict",
            reasonCodes: Object.freeze(reasonCodes),
          });
          commandSettlements.set(settlement.idempotencyKey, settlement);
          auditRecords.push(audit);
          return Object.freeze({
            committed: false,
            settlement,
            binding: null,
            pointer: current ? clonePointer(current) : null,
            derivedSettlements: Object.freeze([]),
            audit,
            reasonCodes: Object.freeze(reasonCodes),
          });
        }
        derivedSettlements.push(
          Object.freeze({
            derivedSettlementRef: deterministicId("ibad", {
              lineage,
              bindingVersionRef: input.binding.bindingVersionRef,
            }),
            lineageKind: lineage.lineageKind,
            lineageRef: lineage.lineageRef,
            subjectRef: input.binding.subjectRef,
            previousPatientRef: previous?.nextPatientRef ?? null,
            nextPatientRef: input.binding.patientRef,
            previousBindingVersionRef: previous?.nextBindingVersionRef ?? null,
            nextBindingVersionRef: input.binding.bindingVersionRef,
            updatedByAuthority: IDENTITY_BINDING_AUTHORITY_NAME,
            reasonCodes: Object.freeze(["BINDING_179_DERIVED_PATIENT_REF_AUTHORITY_TRANSACTION"]),
            settledAt: input.binding.createdAt,
          }),
        );
      }

      bindings.set(input.binding.bindingVersionRef, cloneBinding(input.binding));
      currentPointers.set(input.pointer.subjectRef, clonePointer(input.pointer));
      for (const derived of derivedSettlements) {
        lineagePatientRefs.set(lineageKey(derived.lineageKind, derived.lineageRef), derived);
      }
      const settlement = cloneSettlement({
        ...input.settlement,
        derivedPatientRefSettlementRefs: Object.freeze(
          derivedSettlements.map((derived) => derived.derivedSettlementRef),
        ),
      });
      commandSettlements.set(settlement.idempotencyKey, settlement);
      const audit = cloneAudit(input.audit);
      auditRecords.push(audit);
      return Object.freeze({
        committed: true,
        settlement,
        binding: cloneBinding(input.binding),
        pointer: clonePointer(input.pointer),
        derivedSettlements: Object.freeze(derivedSettlements.map(cloneDerivedSettlement)),
        audit,
        reasonCodes: settlement.reasonCodes,
      });
    },
    snapshots() {
      return Object.freeze({
        bindings: Object.freeze([...bindings.values()].map(cloneBinding)),
        currentPointers: Object.freeze([...currentPointers.values()].map(clonePointer)),
        commandSettlements: Object.freeze([...commandSettlements.values()].map(cloneSettlement)),
        derivedPatientRefs: Object.freeze(
          [...lineagePatientRefs.values()].map(cloneDerivedSettlement),
        ),
        freezeHolds: Object.freeze([...freezeHolds.values()].map(cloneFreezeHold)),
        audit: Object.freeze(auditRecords.map(cloneAudit)),
      });
    },
  };
}

export function createIdentityBindingAuthorityService(
  repository: IdentityBindingAuthorityRepository,
): IdentityBindingAuthorityService {
  async function deny(input: {
    readonly command: SettleIdentityBindingCommandInput;
    readonly decision: BindingAuthoritySettlementDecision;
    readonly previousBindingVersionRef: string | null;
    readonly epochBefore: number;
    readonly reasonCodes: readonly string[];
    readonly observedAt: string;
  }): Promise<SettleIdentityBindingCommandResult> {
    const settlement = createSettlement({
      command: input.command,
      decision: input.decision,
      bindingVersionRef: null,
      previousBindingVersionRef: input.previousBindingVersionRef,
      epochBefore: input.epochBefore,
      epochAfter: input.epochBefore,
      derivedRefs: [],
      reasonCodes: input.reasonCodes,
      settledAt: input.observedAt,
    });
    const audit = createAudit({
      command: input.command,
      settlementRef: settlement.commandSettlementId,
      decision: input.decision,
      reasonCodes: input.reasonCodes,
      recordedAt: input.observedAt,
    });
    await repository.saveDeniedSettlement({ settlement, audit });
    return Object.freeze({
      settlement,
      binding: null,
      currentPointer: null,
      derivedPatientRefSettlements: Object.freeze([]),
      audit,
      replayed: false,
    });
  }

  return {
    async settleIdentityBindingCommand(input) {
      const observedAt = input.observedAt ?? nowIso();
      const replay = await repository.getSettlementByIdempotencyKey(input.idempotencyKey);
      if (replay) {
        const binding = replay.bindingVersionRef
          ? await repository.getBindingVersion(replay.bindingVersionRef)
          : null;
        return Object.freeze({
          settlement: Object.freeze({
            ...replay,
            decision: "replayed" as const,
            reasonCodes: Object.freeze([...replay.reasonCodes, "BINDING_179_REPLAY_RETURNED"]),
          }),
          binding,
          currentPointer: await repository.getCurrentPointer(input.subjectRef),
          derivedPatientRefSettlements: Object.freeze([]),
          audit: createAudit({
            command: input,
            settlementRef: replay.commandSettlementId,
            decision: "replayed",
            reasonCodes: ["BINDING_179_REPLAY_RETURNED"],
            recordedAt: observedAt,
          }),
          replayed: true,
        });
      }

      const currentPointer = await repository.getCurrentPointer(input.subjectRef);
      const previousBindingVersionRef = currentPointer?.currentBindingVersionRef ?? null;
      const epochBefore = currentPointer?.pointerEpoch ?? 0;
      const expectedCurrent = input.expectedCurrentBindingVersionRef ?? null;
      if (
        previousBindingVersionRef !== null &&
        input.expectedCurrentBindingVersionRef === undefined
      ) {
        return deny({
          command: input,
          decision: "stale_rejected",
          previousBindingVersionRef,
          epochBefore,
          reasonCodes: [
            "BINDING_179_EXPECTED_CURRENT_VERSION_REQUIRED",
            "BINDING_179_STALE_EXPECTED_VERSION",
          ],
          observedAt,
        });
      }

      const freezeHold = await repository.getActiveFreezeHold(input.subjectRef);
      if (freezeHold && !isFreezeBypassed(input)) {
        return deny({
          command: input,
          decision: "freeze_blocked",
          previousBindingVersionRef,
          epochBefore,
          reasonCodes: ["BINDING_179_FREEZE_ACTIVE_REFUSED", ...freezeHold.reasonCodes],
          observedAt,
        });
      }

      const state = stateForIntent(input.intentType);
      const patientRef = patientRefForCommand(input);
      if (state.patientRequired && !patientRef) {
        return deny({
          command: input,
          decision: "denied",
          previousBindingVersionRef,
          epochBefore,
          reasonCodes: ["BINDING_179_PATIENT_REF_REQUIRED", "BINDING_179_AUTHORITY_COMMAND_DENIED"],
          observedAt,
        });
      }

      const bindingVersion = epochBefore + 1;
      const bindingVersionRef = deterministicId("ibv", {
        subjectRef: input.subjectRef,
        bindingVersion,
        commandId: input.commandId,
      });
      const binding: IdentityBindingVersion = Object.freeze({
        identityBindingId: deterministicId("ib", {
          subjectRef: input.subjectRef,
          bindingVersion,
        }),
        bindingVersionRef,
        schemaVersion: IDENTITY_BINDING_AUTHORITY_SCHEMA_VERSION,
        policyVersion: IDENTITY_BINDING_AUTHORITY_POLICY_VERSION,
        subjectRef: input.subjectRef,
        patientRef,
        bindingState: state.bindingState,
        ownershipState: state.ownershipState,
        assuranceLevel: state.assuranceLevel,
        intentType: input.intentType,
        bindingVersion,
        supersedesBindingVersionRef: previousBindingVersionRef,
        patientLinkDecisionRef: input.patientLinkDecisionRef ?? null,
        routeIntentBindingRef: input.routeIntentBindingRef ?? null,
        confidence: cloneConfidence(input.confidence),
        provenanceRefs: Object.freeze([...input.provenanceRefs]),
        createdAt: observedAt,
        createdByAuthority: IDENTITY_BINDING_AUTHORITY_NAME,
      });
      const pointer: IdentityBindingCurrentPointer = Object.freeze({
        subjectRef: input.subjectRef,
        currentBindingVersionRef: bindingVersionRef,
        currentPatientRef: patientRef,
        pointerEpoch: bindingVersion,
        bindingState: state.bindingState,
        updatedAt: observedAt,
      });
      const reasonCodes = baseAcceptedReasonCodes(input);
      const settlement = createSettlement({
        command: input,
        decision: "accepted",
        bindingVersionRef,
        previousBindingVersionRef,
        epochBefore,
        epochAfter: bindingVersion,
        derivedRefs: [],
        reasonCodes,
        settledAt: observedAt,
      });
      const audit = createAudit({
        command: input,
        settlementRef: settlement.commandSettlementId,
        decision: "accepted",
        reasonCodes,
        recordedAt: observedAt,
      });
      const commit = await repository.commitAuthorityTransaction({
        expectedCurrentBindingVersionRef: expectedCurrent,
        binding,
        pointer,
        lineageRefs: input.derivedLineageRefs ?? [],
        settlement,
        audit,
      });
      return Object.freeze({
        settlement: commit.settlement,
        binding: commit.binding,
        currentPointer: commit.pointer,
        derivedPatientRefSettlements: commit.derivedSettlements,
        audit: commit.audit,
        replayed: false,
      });
    },
    async createFreezeHold(input) {
      const observedAt = input.observedAt ?? nowIso();
      const hold = Object.freeze({
        freezeHoldRef: deterministicId("ibfh", {
          subjectRef: input.subjectRef,
          reasonCodes: input.reasonCodes,
          observedAt,
        }),
        subjectRef: input.subjectRef,
        state: "active" as const,
        reasonCodes: Object.freeze(["BINDING_179_FREEZE_AWARE_REFUSAL_HOOK", ...input.reasonCodes]),
        createdAt: observedAt,
        releasedAt: null,
      });
      await repository.saveFreezeHold(hold);
      return hold;
    },
    async getCurrentBinding(subjectRef) {
      return repository.getCurrentPointer(subjectRef);
    },
  };
}

export function createIdentityBindingAuthorityApplication(options?: {
  readonly repository?: IdentityBindingAuthorityRepository;
}): IdentityBindingAuthorityApplication {
  const repository = options?.repository ?? createInMemoryIdentityBindingAuthorityRepository();
  return Object.freeze({
    identityBindingAuthority: createIdentityBindingAuthorityService(repository),
    repository,
    migrationPlanRef: identityBindingAuthorityMigrationPlanRefs[0],
    migrationPlanRefs: identityBindingAuthorityMigrationPlanRefs,
    persistenceTables: identityBindingAuthorityPersistenceTables,
    parallelInterfaceGaps: identityBindingAuthorityParallelInterfaceGaps,
  });
}
