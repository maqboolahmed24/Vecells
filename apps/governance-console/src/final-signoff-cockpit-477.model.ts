import finalSignoffRegisterJson from "../../../data/signoff/477_final_signoff_register.json";

export type FinalSignoff477ScenarioState =
  | "ready"
  | "ready_with_constraints"
  | "blocked"
  | "expired_signoff"
  | "missing_signoff"
  | "tuple_mismatch"
  | "exception_blocking";

export type FinalSignoff477ExceptionFilter =
  | "all"
  | "launch-blocking"
  | "launch-with-constraint"
  | "BAU-follow-up"
  | "not-applicable";

export interface FinalSignoff477LaneProjection {
  readonly laneId: string;
  readonly laneLabel: string;
  readonly status: string;
  readonly authority: string;
  readonly signerDisplayName: string;
  readonly roleRef: string;
  readonly evidenceHash: string;
  readonly expiresAt: string;
  readonly scope: string;
  readonly exceptionCount: number;
  readonly tone: "success" | "caution" | "critical" | "info";
}

export interface FinalSignoff477EvidenceProjection {
  readonly evidenceBindingId: string;
  readonly laneId: string;
  readonly evidenceTitle: string;
  readonly evidenceClass: string;
  readonly evidenceState: string;
  readonly evidenceHash: string;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly authority: string;
  readonly signerDisplayName: string;
  readonly roleRef: string;
}

export interface FinalSignoff477ExceptionProjection {
  readonly exceptionId: string;
  readonly title: string;
  readonly laneId: string;
  readonly effectiveClassification: FinalSignoff477ExceptionFilter;
  readonly declaredClassification: string;
  readonly sourceAlgorithmClassification: string;
  readonly ownerDisplayName: string;
  readonly expiresAt: string | null;
  readonly scopeAppliesTo: string;
  readonly state: string;
  readonly blockerRefs: readonly string[];
}

export interface FinalSignoff477Projection {
  readonly scenarioState: FinalSignoff477ScenarioState;
  readonly overallSignoffState: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly waveManifestRef: string;
  readonly waveManifestHash: string;
  readonly signoffBlockerCount: number;
  readonly constrainedLaunchCount: number;
  readonly downstreamLaunchBlockerCount: number;
  readonly commandSettlementState: "current" | "pending";
  readonly launchApprovalActionState:
    | "review_allowed_settlement_pending"
    | "blocked_by_signoff"
    | "settled_current";
  readonly launchApprovalReviewAllowed: boolean;
  readonly lanes: readonly FinalSignoff477LaneProjection[];
  readonly evidenceRows: readonly FinalSignoff477EvidenceProjection[];
  readonly exceptions: readonly FinalSignoff477ExceptionProjection[];
  readonly filteredExceptions: readonly FinalSignoff477ExceptionProjection[];
  readonly exceptionFilter: FinalSignoff477ExceptionFilter;
  readonly selectedEvidence: FinalSignoff477EvidenceProjection;
}

type Register = typeof finalSignoffRegisterJson;
type Authority = Register["authorities"][number];
type EvidenceBinding = Register["evidenceBindings"][number];
type SignoffException = Register["activeExceptions"][number];

const baseRegister = finalSignoffRegisterJson as Register;

const scenarioStates: readonly FinalSignoff477ScenarioState[] = [
  "ready",
  "ready_with_constraints",
  "blocked",
  "expired_signoff",
  "missing_signoff",
  "tuple_mismatch",
  "exception_blocking",
];

const exceptionFilters: readonly FinalSignoff477ExceptionFilter[] = [
  "all",
  "launch-blocking",
  "launch-with-constraint",
  "BAU-follow-up",
  "not-applicable",
];

function cloneRegister(): Register {
  return JSON.parse(JSON.stringify(baseRegister)) as Register;
}

export function normalizeFinalSignoff477ScenarioState(
  value?: string | null,
): FinalSignoff477ScenarioState {
  const normalized = (value ?? "").replace(/-/g, "_");
  return scenarioStates.includes(normalized as FinalSignoff477ScenarioState)
    ? (normalized as FinalSignoff477ScenarioState)
    : "ready_with_constraints";
}

export function normalizeFinalSignoff477ExceptionFilter(
  value?: string | null,
): FinalSignoff477ExceptionFilter {
  const normalized = value === "blocker" ? "launch-blocking" : (value ?? "all");
  return exceptionFilters.includes(normalized as FinalSignoff477ExceptionFilter)
    ? (normalized as FinalSignoff477ExceptionFilter)
    : "all";
}

function toneForStatus(status: string): FinalSignoff477LaneProjection["tone"] {
  if (["missing", "expired", "tuple_mismatch", "blocked"].includes(status)) return "critical";
  if (status.includes("constraint") || status === "deferred") return "caution";
  if (status === "signed" || status === "ready") return "success";
  return "info";
}

function addBlockingException(register: Register, exception: SignoffException): Register {
  return {
    ...register,
    activeExceptions: [...register.activeExceptions, exception],
  };
}

function applyScenario(register: Register, scenarioState: FinalSignoff477ScenarioState): Register {
  if (scenarioState === "ready") {
    return {
      ...register,
      scenarioState,
      overallSignoffState: "ready",
      activeExceptions: [],
    };
  }
  if (scenarioState === "ready_with_constraints") {
    return register;
  }

  const nextRegister = { ...register, scenarioState };
  if (scenarioState === "expired_signoff") {
    return {
      ...nextRegister,
      overallSignoffState: "expired_signoff",
      authorities: register.authorities.map((authority) =>
        authority.laneId === "clinical_safety"
          ? { ...authority, signoffState: "expired", expiresAt: "2026-04-01T23:59:59.000Z" }
          : authority,
      ),
    };
  }
  if (scenarioState === "missing_signoff") {
    return {
      ...nextRegister,
      overallSignoffState: "missing_signoff",
      authorities: register.authorities.map((authority) =>
        authority.laneId === "privacy_records"
          ? {
              ...authority,
              signoffState: "missing",
              signerDisplayName: "Unassigned privacy authority",
              signedAt: "not signed",
              expiresAt: "not applicable",
            }
          : authority,
      ),
    };
  }
  if (scenarioState === "tuple_mismatch") {
    return {
      ...nextRegister,
      overallSignoffState: "tuple_mismatch",
      authorities: register.authorities.map((authority) =>
        authority.laneId === "regulatory_dtac"
          ? {
              ...authority,
              signoffState: "tuple_mismatch",
              releaseBinding: {
                ...authority.releaseBinding,
                releaseCandidateRef: "RC_SUPERSEDED_PREVIOUS",
              },
            }
          : authority,
      ),
    };
  }

  const blockingException = {
    ...register.activeExceptions[0],
    exceptionId:
      scenarioState === "blocked"
        ? "ex_477_blocked_dpia_telemetry_destination"
        : "ex_477_exception_register_understates_blocker",
    title:
      scenarioState === "blocked"
        ? "DPIA closure references a stale telemetry destination"
        : "Exception register says BAU follow-up but source algorithm marks it release-blocking",
    laneId: scenarioState === "blocked" ? "privacy_records" : "downstream_launch_authority",
    declaredClassification: scenarioState === "blocked" ? "launch-blocking" : "BAU-follow-up",
    sourceAlgorithmClassification: "launch-blocking",
    effectiveClassification: "launch-blocking",
    state: "blocked",
    blockerRefs:
      scenarioState === "blocked"
        ? ["blocker:477:dpia-closure-telemetry-destination-stale"]
        : ["blocker:477:exception-register-contradicts-source-release-blocking-rule"],
  } as SignoffException;

  return {
    ...addBlockingException(nextRegister, blockingException),
    overallSignoffState: "blocked",
  };
}

function classificationCount(
  exceptions: readonly FinalSignoff477ExceptionProjection[],
  classification: FinalSignoff477ExceptionFilter,
): number {
  return exceptions.filter((entry) => entry.effectiveClassification === classification).length;
}

function createEvidenceRows(
  authorities: readonly Authority[],
  evidenceBindings: readonly EvidenceBinding[],
): readonly FinalSignoff477EvidenceProjection[] {
  return evidenceBindings.map((binding) => {
    const authority = authorities.find((candidate) =>
      candidate.evidenceBindingRefs.includes(binding.evidenceBindingId),
    );
    return {
      evidenceBindingId: binding.evidenceBindingId,
      laneId: binding.laneId,
      evidenceTitle: binding.evidenceTitle,
      evidenceClass: binding.evidenceClass,
      evidenceState: binding.evidenceState,
      evidenceHash: binding.evidenceHash,
      evidenceRefs: binding.evidenceRefs,
      sourceRefs: binding.sourceRefs,
      authority: authority?.roleDisplayName ?? "Supplier dependency authority",
      signerDisplayName: authority?.signerDisplayName ?? "Supplier Dependency Owner",
      roleRef: authority?.roleRef ?? "ROLE_SUPPLIER_DEPENDENCY_OWNER",
    };
  });
}

function createExceptions(
  exceptions: readonly SignoffException[],
): readonly FinalSignoff477ExceptionProjection[] {
  return exceptions.map((entry) => ({
    exceptionId: entry.exceptionId,
    title: entry.title,
    laneId: entry.laneId,
    effectiveClassification:
      entry.effectiveClassification as FinalSignoff477ExceptionProjection["effectiveClassification"],
    declaredClassification: entry.declaredClassification,
    sourceAlgorithmClassification: entry.sourceAlgorithmClassification,
    ownerDisplayName: entry.ownerDisplayName,
    expiresAt: entry.expiresAt,
    scopeAppliesTo: entry.scopeAppliesTo,
    state: entry.state,
    blockerRefs: entry.blockerRefs,
  }));
}

function createLanes(
  authorities: readonly Authority[],
  evidenceRows: readonly FinalSignoff477EvidenceProjection[],
  exceptions: readonly FinalSignoff477ExceptionProjection[],
): readonly FinalSignoff477LaneProjection[] {
  return authorities.map((authority) => {
    const laneEvidenceRows = evidenceRows.filter((row) => row.laneId === authority.laneId);
    const laneExceptions = exceptions.filter((entry) => entry.laneId === authority.laneId);
    return {
      laneId: authority.laneId,
      laneLabel: authority.laneLabel,
      status: authority.signoffState,
      authority: authority.roleDisplayName,
      signerDisplayName: authority.signerDisplayName,
      roleRef: authority.roleRef,
      evidenceHash: laneEvidenceRows[0]?.evidenceHash ?? authority.authorityTupleHash,
      expiresAt: authority.expiresAt ?? "not applicable",
      scope: `${authority.releaseBinding.tenantCohortScope} | ${authority.releaseBinding.channelScope} | ${authority.releaseBinding.assistiveScope}`,
      exceptionCount: laneExceptions.length,
      tone: toneForStatus(authority.signoffState),
    };
  });
}

export function createFinalSignoff477Projection(options: {
  readonly scenarioState?: string | null;
  readonly exceptionFilter?: string | null;
  readonly selectedEvidenceRef?: string | null;
}): FinalSignoff477Projection {
  const scenarioState = normalizeFinalSignoff477ScenarioState(options.scenarioState);
  const exceptionFilter = normalizeFinalSignoff477ExceptionFilter(options.exceptionFilter);
  const register = applyScenario(cloneRegister(), scenarioState);
  const evidenceRows = createEvidenceRows(register.authorities, register.evidenceBindings);
  const exceptions = createExceptions(register.activeExceptions);
  const authorityBlockerCount = register.authorities.filter((authority) =>
    ["missing", "expired", "tuple_mismatch", "blocked"].includes(authority.signoffState),
  ).length;
  const signoffBlockerCount =
    authorityBlockerCount + classificationCount(exceptions, "launch-blocking");
  const filteredExceptions =
    exceptionFilter === "all"
      ? exceptions
      : exceptions.filter((entry) => entry.effectiveClassification === exceptionFilter);
  const selectedEvidence =
    evidenceRows.find((row) => row.evidenceBindingId === options.selectedEvidenceRef) ??
    evidenceRows[0]!;
  const launchApprovalReviewAllowed = signoffBlockerCount === 0;
  const commandSettlementState = "pending";

  return {
    scenarioState,
    overallSignoffState: register.overallSignoffState,
    releaseCandidateRef: register.releaseBinding.releaseCandidateRef,
    runtimePublicationBundleRef: register.releaseBinding.runtimePublicationBundleRef,
    waveManifestRef: register.releaseBinding.waveManifestRef,
    waveManifestHash: register.releaseBinding.waveManifestHash,
    signoffBlockerCount,
    constrainedLaunchCount: classificationCount(exceptions, "launch-with-constraint"),
    downstreamLaunchBlockerCount: register.launchDecision.downstreamLaunchBlockerCount,
    commandSettlementState,
    launchApprovalActionState: launchApprovalReviewAllowed
      ? "review_allowed_settlement_pending"
      : "blocked_by_signoff",
    launchApprovalReviewAllowed,
    lanes: createLanes(register.authorities, evidenceRows, exceptions),
    evidenceRows,
    exceptions,
    filteredExceptions,
    exceptionFilter,
    selectedEvidence,
  };
}
