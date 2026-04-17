import {
  type BackboneIdGenerator,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import {
  type AssimilationSafetyDependencies,
  type PersistedSafetyDecisionRecordRow,
  type PersistedUrgentDiversionSettlementRow,
  type SafetyDecisionRecordSnapshot,
  type UrgentDiversionActionMode,
  type UrgentDiversionSettlementState,
  UrgentDiversionSettlementDocument,
  createAssimilationSafetyStore,
} from "./assimilation-safety-backbone";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
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

function nextUrgentDiversionId(idGenerator: BackboneIdGenerator): string {
  return (idGenerator.nextId as unknown as (scope: string) => string)(
    "urgent_diversion_settlement",
  );
}

function normalizeIssuedState(input: {
  settlementState: UrgentDiversionSettlementState;
  issuedAt: string | null;
  settledAt: string | null;
}): { issuedAt: string | null; settledAt: string | null } {
  if (input.settlementState === "issued") {
    const issuedAt = ensureIsoTimestamp(input.issuedAt ?? "", "issuedAt");
    return {
      issuedAt,
      settledAt: ensureIsoTimestamp(input.settledAt ?? issuedAt, "settledAt"),
    };
  }
  if (input.settlementState === "failed") {
    const settledAt = ensureIsoTimestamp(
      input.settledAt ?? input.issuedAt ?? "",
      "settledAt",
    );
    return {
      issuedAt: optionalRef(input.issuedAt),
      settledAt,
    };
  }
  return {
    issuedAt: optionalRef(input.issuedAt),
    settledAt: optionalRef(input.settledAt),
  };
}

function settlementsEquivalent(
  left: PersistedUrgentDiversionSettlementRow,
  right: {
    requestId: string;
    safetyDecisionRef: string;
    actionMode: UrgentDiversionActionMode;
    presentationArtifactRef: string | null;
    authoritativeActionRef: string | null;
    settlementState: UrgentDiversionSettlementState;
    issuedAt: string | null;
    settledAt: string | null;
  },
): boolean {
  return (
    left.requestId === right.requestId &&
    left.safetyDecisionRef === right.safetyDecisionRef &&
    left.actionMode === right.actionMode &&
    left.presentationArtifactRef === right.presentationArtifactRef &&
    left.authoritativeActionRef === right.authoritativeActionRef &&
    left.settlementState === right.settlementState &&
    left.issuedAt === right.issuedAt &&
    left.settledAt === right.settledAt
  );
}

function requireUrgentDecision(
  requestId: string,
  safetyDecision: PersistedSafetyDecisionRecordRow | null,
): SafetyDecisionRecordSnapshot {
  invariant(
    !!safetyDecision,
    "URGENT_DIVERSION_SAFETY_DECISION_NOT_FOUND",
    "Urgent diversion issuance requires a current settled SafetyDecisionRecord.",
  );
  invariant(
    safetyDecision.requestId === requestId,
    "URGENT_DIVERSION_REQUEST_DECISION_MISMATCH",
    "Urgent diversion issuance must stay bound to the same request lineage.",
  );
  invariant(
    safetyDecision.decisionState === "settled",
    "URGENT_DIVERSION_DECISION_NOT_SETTLED",
    "Urgent diversion issuance requires a settled SafetyDecisionRecord.",
  );
  invariant(
    safetyDecision.requestedSafetyState === "urgent_diversion_required",
    "URGENT_DIVERSION_DECISION_NOT_URGENT",
    "Urgent diversion issuance may only proceed from urgent_diversion_required.",
  );
  return UrgentDiversionSettlementService.cloneSafetyDecision(safetyDecision);
}

export interface IssueUrgentDiversionSettlementInput {
  requestId: string;
  safetyDecisionRef: string;
  actionMode: UrgentDiversionActionMode;
  presentationArtifactRef?: string | null;
  authoritativeActionRef?: string | null;
  settlementState?: Extract<UrgentDiversionSettlementState, "pending" | "issued" | "failed">;
  issuedAt?: string | null;
  settledAt?: string | null;
}

export interface UrgentDiversionSettlementIssueResult {
  replayed: boolean;
  safetyDecision: SafetyDecisionRecordSnapshot;
  urgentDiversionSettlement: PersistedUrgentDiversionSettlementRow;
  supersededSettlementRef: string | null;
}

export class UrgentDiversionSettlementService {
  constructor(
    readonly repositories: AssimilationSafetyDependencies,
    private readonly idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
      "intake_safety_urgent_diversion",
    ),
  ) {}

  static cloneSafetyDecision(
    row: PersistedSafetyDecisionRecordRow,
  ): SafetyDecisionRecordSnapshot {
    return JSON.parse(JSON.stringify(row)) as SafetyDecisionRecordSnapshot;
  }

  async issueSettlement(
    input: IssueUrgentDiversionSettlementInput,
  ): Promise<UrgentDiversionSettlementIssueResult> {
    const requestId = requireRef(input.requestId, "requestId");
    const safetyDecisionRef = requireRef(input.safetyDecisionRef, "safetyDecisionRef");
    const actionMode = input.actionMode;
    const settlementState = input.settlementState ?? "issued";
    const normalizedTiming = normalizeIssuedState({
      settlementState,
      issuedAt: optionalRef(input.issuedAt),
      settledAt: optionalRef(input.settledAt),
    });
    const presentationArtifactRef = optionalRef(input.presentationArtifactRef);
    const authoritativeActionRef = optionalRef(input.authoritativeActionRef);

    const safetyDecision = requireUrgentDecision(
      requestId,
      await this.repositories.getSafetyDecisionRecord(safetyDecisionRef),
    );
    const latest = await this.repositories.findLatestUrgentDiversionSettlementForRequest(requestId);
    const existingMatches = (
      await this.repositories.listUrgentDiversionSettlementsByRequest(requestId)
    ).find((candidate) =>
      settlementsEquivalent(candidate, {
        requestId,
        safetyDecisionRef,
        actionMode,
        presentationArtifactRef,
        authoritativeActionRef,
        settlementState,
        issuedAt: normalizedTiming.issuedAt,
        settledAt: normalizedTiming.settledAt,
      }),
    );

    if (existingMatches) {
      return {
        replayed: true,
        safetyDecision,
        urgentDiversionSettlement: existingMatches,
        supersededSettlementRef: existingMatches.supersedesSettlementRef,
      };
    }

    const settlement = UrgentDiversionSettlementDocument.create({
      urgentDiversionSettlementId: nextUrgentDiversionId(this.idGenerator),
      requestId,
      preemptionRef: safetyDecision.preemptionRef,
      safetyDecisionRef,
      actionMode,
      presentationArtifactRef,
      authoritativeActionRef,
      settlementState,
      supersedesSettlementRef: latest?.urgentDiversionSettlementId ?? null,
      issuedAt: normalizedTiming.issuedAt,
      settledAt: normalizedTiming.settledAt,
    }).toPersistedRow();
    await this.repositories.saveUrgentDiversionSettlement(settlement);

    return {
      replayed: false,
      safetyDecision,
      urgentDiversionSettlement: settlement,
      supersededSettlementRef: settlement.supersedesSettlementRef,
    };
  }
}

export function createUrgentDiversionSettlementService(
  repositories: AssimilationSafetyDependencies = createAssimilationSafetyStore(),
  options?: {
    idGenerator?: BackboneIdGenerator;
  },
): UrgentDiversionSettlementService {
  return new UrgentDiversionSettlementService(
    repositories,
    options?.idGenerator,
  );
}
