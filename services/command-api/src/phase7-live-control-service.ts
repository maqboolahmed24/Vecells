import { createHash } from "node:crypto";
import {
  createDefaultPhase7EnvironmentTelemetryApplication,
  type EnvironmentProfileValidationResult,
  type Phase7EnvironmentTelemetryApplication,
} from "./phase7-environment-telemetry-service";
import {
  PHASE7_COMPATIBILITY_EVIDENCE_REF,
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  PHASE7_RELEASE_CANDIDATE_REF,
  createDefaultPhase7NhsAppManifestApplication,
  type NhsAppEnvironment,
  type Phase7NhsAppManifestApplication,
} from "./phase7-nhs-app-manifest-service";
import {
  createDefaultPhase7RouteReadinessApplication,
  type Phase7RouteReadinessApplication,
  type PromotionReadinessResult,
  type RouteReadinessResult,
} from "./phase7-route-readiness-service";

export const PHASE7_LIVE_CONTROL_SERVICE_NAME = "Phase7NHSAppLiveRolloutAndGovernanceControlPlane";
export const PHASE7_LIVE_CONTROL_SCHEMA_VERSION = "385.phase7.live-control.v1";

const RECORDED_AT = "2026-04-27T02:45:15.000Z";
const DEFAULT_POLICY_REF = "ReleaseGuardrailPolicy:385:phase7-default";
const DEFAULT_PROFILE_POLICY_REF = "ReleaseGuardrailPolicy:385:phase7-default-pending";
const DEFAULT_KILL_SWITCH_REF = "KillSwitch:385:nhs-app-channel-disable-jump-off";
const DEFAULT_OPERATOR_NOTE_REF = "OperatorNote:385:automated-live-control";

export type ChannelReleaseStage = "sandpit" | "aos" | "limited_release" | "full_release";
export type ChannelReleaseCohortState =
  | "disabled"
  | "monitoring"
  | "enabled"
  | "frozen"
  | "kill_switch_active"
  | "rollback_recommended"
  | "completed";
export type FreezeTriggerType =
  | "telemetry_missing"
  | "threshold_breach"
  | "assurance_slice_degraded"
  | "compatibility_drift"
  | "continuity_evidence_degraded";
export type FreezeState =
  | "monitoring"
  | "frozen"
  | "kill_switch_active"
  | "rollback_recommended"
  | "released";
export type FreezeMode = "hidden" | "read_only" | "placeholder_only" | "redirect_to_safe_route";
export type LiveControlDecision =
  | "enable"
  | "blocked"
  | "freeze"
  | "release"
  | "rollback_recommendation"
  | "kill_switch_activation";
export type LiveControlFailureReason =
  | "readiness_not_ready"
  | "telemetry_missing"
  | "threshold_breach"
  | "compatibility_drift"
  | "continuity_evidence_degraded"
  | "assurance_slice_degraded"
  | "environment_profile_drift"
  | "active_freeze"
  | "release_tuple_drift"
  | "sample_size_below_minimum"
  | "change_notice_lead_time_unmet"
  | "rollback_evidence_missing";
export type AssuranceSliceState = "current" | "degraded" | "quarantined";
export type EvidenceFreshnessState = "current" | "stale" | "degraded" | "missing";
export type JourneyChangeType = "minor" | "significant" | "new_journey";
export type JourneyChangeApprovalState =
  | "draft"
  | "submitted"
  | "approved"
  | "blocked_lead_time"
  | "superseded";

export interface ChannelReleaseCohort {
  readonly cohortId: string;
  readonly odsRules: readonly string[];
  readonly patientPopulationRules: readonly string[];
  readonly enabledJourneys: readonly string[];
  readonly releaseStage: ChannelReleaseStage;
  readonly environment: NhsAppEnvironment;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly guardrailPolicyRef: string;
  readonly killSwitchRef: string;
  readonly cohortState: ChannelReleaseCohortState;
  readonly startAt: string;
  readonly endAt: string | null;
}

export interface ReleaseGuardrailPolicy {
  readonly policyId: string;
  readonly minimumSampleSize: number;
  readonly maxAuthFailureRate: number;
  readonly maxJourneyErrorRate: number;
  readonly maxDownloadFailureRate: number;
  readonly maxSupportContactRate: number;
  readonly maxBridgeFailureRate: number;
  readonly sustainedGreenWindow: string;
  readonly freezeDuration: string;
  readonly rollbackAction: string;
}

export interface GuardrailObservationWindow {
  readonly sampleSize: number;
  readonly telemetryPresent: boolean;
  readonly authFailureRate: number;
  readonly journeyErrorRate: number;
  readonly downloadFailureRate: number;
  readonly supportContactRate: number;
  readonly bridgeFailureRate: number;
  readonly routeResolutionFailureRate: number;
  readonly assuranceSliceState: AssuranceSliceState;
  readonly compatibilityEvidenceState: EvidenceFreshnessState;
  readonly continuityEvidenceState: EvidenceFreshnessState;
  readonly incidentCount: number;
  readonly accessibilityIssueCount: number;
  readonly safetyIssueCount: number;
  readonly observedAt: string;
}

export interface GuardrailEvaluationResult {
  readonly policyRef: string;
  readonly guardrailState: "green" | "blocked" | "freeze_required";
  readonly failureReasons: readonly LiveControlFailureReason[];
  readonly triggerTypes: readonly FreezeTriggerType[];
  readonly rollbackRecommended: boolean;
  readonly observationWindow: GuardrailObservationWindow;
}

export interface ChannelReleaseFreezeRecord {
  readonly freezeRecordId: string;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly cohortRef: string;
  readonly journeyPathRefs: readonly string[];
  readonly triggerType: FreezeTriggerType;
  readonly assuranceSliceTrustRefs: readonly string[];
  readonly continuityEvidenceRefs: readonly string[];
  readonly freezeState: FreezeState;
  readonly openedAt: string;
  readonly releasedAt: string | null;
  readonly operatorNoteRef: string;
  readonly rollbackActionRef: string | null;
}

export interface RouteFreezeDisposition {
  readonly dispositionId: string;
  readonly journeyPathRef: string;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly freezeRecordRef: string;
  readonly freezeMode: FreezeMode;
  readonly patientMessageRef: string;
  readonly safeRouteRef: string | null;
  readonly supportRecoveryRef: string;
  readonly activatedAt: string;
  readonly releasedAt: string | null;
}

export interface NHSAppJourneyUsage {
  readonly journeyPathRef: string;
  readonly cohortRef: string;
  readonly routeEntryCount: number;
  readonly successfulCompletionCount: number;
}

export interface NHSAppJourneyRate {
  readonly journeyPathRef: string;
  readonly rate: number;
}

export interface NHSAppPerformancePack {
  readonly packId: string;
  readonly period: string;
  readonly environment: NhsAppEnvironment;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly telemetryPlanRef: string;
  readonly eventContractRefs: readonly string[];
  readonly journeyUsage: readonly NHSAppJourneyUsage[];
  readonly completionRates: readonly NHSAppJourneyRate[];
  readonly dropOffs: readonly NHSAppJourneyRate[];
  readonly guardrailBreaches: readonly LiveControlFailureReason[];
  readonly incidentSummary: readonly string[];
  readonly accessibilityIssues: readonly string[];
  readonly safetyIssues: readonly string[];
  readonly generatedAt: string;
  readonly packHash: string;
}

export interface JourneyChangeNotice {
  readonly noticeId: string;
  readonly changeType: JourneyChangeType;
  readonly affectedJourneys: readonly string[];
  readonly manifestVersion: string;
  readonly leadTimeRequired: "P1M" | "P3M";
  readonly leadTimeDays: number;
  readonly submittedAt: string;
  readonly plannedChangeAt: string;
  readonly approvalState: JourneyChangeApprovalState;
  readonly integrationManagerRef: string;
}

export interface LiveControlAuditEvent {
  readonly eventId: string;
  readonly decision: LiveControlDecision;
  readonly cohortRef: string | null;
  readonly freezeRecordRef: string | null;
  readonly manifestVersionRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly failureReasons: readonly LiveControlFailureReason[];
  readonly evidenceRefs: readonly string[];
  readonly occurredAt: string;
}

export interface CohortEvaluationInput {
  readonly cohortId: string;
  readonly expectedManifestVersion?: string;
  readonly expectedConfigFingerprint?: string;
  readonly expectedReleaseCandidateRef?: string;
  readonly expectedReleaseApprovalFreezeRef?: string;
  readonly expectedCompatibilityEvidenceRef?: string;
  readonly observationWindow?: Partial<GuardrailObservationWindow>;
  readonly operatorNoteRef?: string;
  readonly now?: string;
}

export interface CohortEvaluationResult {
  readonly schemaVersion: typeof PHASE7_LIVE_CONTROL_SCHEMA_VERSION;
  readonly decision: LiveControlDecision;
  readonly cohort: ChannelReleaseCohort;
  readonly failureReasons: readonly LiveControlFailureReason[];
  readonly environmentProfile: EnvironmentProfileValidationResult;
  readonly promotionReadiness: PromotionReadinessResult;
  readonly guardrailEvaluation: GuardrailEvaluationResult;
  readonly freezeRecord: ChannelReleaseFreezeRecord | null;
  readonly routeDispositions: readonly RouteFreezeDisposition[];
  readonly auditEvent: LiveControlAuditEvent;
}

export interface Phase7LiveControlInventory {
  readonly schemaVersion: typeof PHASE7_LIVE_CONTROL_SCHEMA_VERSION;
  readonly cohorts: readonly ChannelReleaseCohort[];
  readonly guardrailPolicies: readonly ReleaseGuardrailPolicy[];
  readonly freezeRecords: readonly ChannelReleaseFreezeRecord[];
  readonly journeyChangeNotices: readonly JourneyChangeNotice[];
  readonly auditEvents: readonly LiveControlAuditEvent[];
}

export const phase7LiveControlRoutes = [
  {
    routeId: "phase7_nhs_app_live_cohorts_list",
    method: "GET",
    path: "/internal/v1/nhs-app/live-control/cohorts",
    contractFamily: "ChannelReleaseCohortContract",
    purpose:
      "List governed NHS App channel release cohorts for Sandpit, AOS, limited release, and full release.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_live_cohort_evaluate",
    method: "POST",
    path: "/internal/v1/nhs-app/live-control/cohorts:evaluate",
    contractFamily: "ChannelReleaseCohortEvaluationContract",
    purpose:
      "Evaluate cohort expansion against route readiness, environment telemetry, continuity evidence, compatibility, and live guardrails.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_live_freeze_evaluate",
    method: "POST",
    path: "/internal/v1/nhs-app/live-control/freeze-records:evaluate",
    contractFamily: "ChannelReleaseFreezeRecordContract",
    purpose:
      "Open or reuse live channel freeze records when telemetry, assurance, compatibility, continuity, or threshold guardrails drift.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_live_freeze_release",
    method: "POST",
    path: "/internal/v1/nhs-app/live-control/freeze-records/{freezeRecordId}:release",
    contractFamily: "ChannelReleaseFreezeRecordContract",
    purpose: "Release a live channel freeze record only under the same manifest and release tuple.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_live_route_freeze_disposition",
    method: "GET",
    path: "/internal/v1/nhs-app/live-control/route-freeze-dispositions/current",
    contractFamily: "RouteFreezeDispositionContract",
    purpose:
      "Resolve patient-safe route degradation for an active channel freeze under the same manifest tuple.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_live_kill_switch_activate",
    method: "POST",
    path: "/internal/v1/nhs-app/live-control/kill-switches:activate",
    contractFamily: "ChannelReleaseKillSwitchContract",
    purpose:
      "Activate the NHS App jump-off kill switch without redeploy and retain rollback recommendation audit.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "phase7_nhs_app_live_monthly_pack_generate",
    method: "GET",
    path: "/internal/v1/nhs-app/live-control/performance-pack",
    contractFamily: "NHSAppPerformancePackContract",
    purpose:
      "Generate the replayable monthly NHS App performance pack from governed event contracts.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "phase7_nhs_app_live_change_notice_submit",
    method: "POST",
    path: "/internal/v1/nhs-app/live-control/change-notices",
    contractFamily: "JourneyChangeNoticeContract",
    purpose:
      "Record journey-change notices against manifest versions and enforce one-month or three-month lead times.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

const DEFAULT_GREEN_OBSERVATION_WINDOW: GuardrailObservationWindow = {
  sampleSize: 50,
  telemetryPresent: true,
  authFailureRate: 0.004,
  journeyErrorRate: 0.006,
  downloadFailureRate: 0.004,
  supportContactRate: 0.003,
  bridgeFailureRate: 0.002,
  routeResolutionFailureRate: 0.001,
  assuranceSliceState: "current",
  compatibilityEvidenceState: "current",
  continuityEvidenceState: "current",
  incidentCount: 0,
  accessibilityIssueCount: 0,
  safetyIssueCount: 0,
  observedAt: RECORDED_AT,
};

const DEFAULT_POLICIES: ReleaseGuardrailPolicy[] = [
  buildDefaultPolicy(DEFAULT_POLICY_REF),
  buildDefaultPolicy(DEFAULT_PROFILE_POLICY_REF),
];

const DEFAULT_COHORTS: ChannelReleaseCohort[] = [
  buildCohort({
    cohortId: "ChannelReleaseCohort:385:sandpit-pharmacy-controlled",
    releaseStage: "sandpit",
    environment: "sandpit",
    odsRules: ["A83001", "B82001"],
    patientPopulationRules: ["synthetic_patients_only", "nhs_app_team_demo_users"],
    cohortState: "enabled",
    startAt: "2026-04-27T03:00:00.000Z",
  }),
  buildCohort({
    cohortId: "ChannelReleaseCohort:385:aos-pharmacy-assurance",
    releaseStage: "aos",
    environment: "aos",
    odsRules: ["A83001", "B82001"],
    patientPopulationRules: ["aos_assurance_users", "integration_manager_observers"],
    cohortState: "enabled",
    startAt: "2026-04-28T09:00:00.000Z",
  }),
  buildCohort({
    cohortId: "ChannelReleaseCohort:385:limited-release-pharmacy",
    releaseStage: "limited_release",
    environment: "limited_release",
    odsRules: ["A83001"],
    patientPopulationRules: ["sample_users_agreed_with_nhs_app_team"],
    cohortState: "monitoring",
    startAt: "2026-05-04T09:00:00.000Z",
  }),
  buildCohort({
    cohortId: "ChannelReleaseCohort:385:full-release-pharmacy",
    releaseStage: "full_release",
    environment: "full_release",
    odsRules: ["*"],
    patientPopulationRules: ["all_eligible_users_after_limited_release_green_window"],
    cohortState: "disabled",
    startAt: "2026-06-01T09:00:00.000Z",
  }),
];

const DEFAULT_DISPOSITION_TEMPLATES: Readonly<
  Record<
    string,
    Omit<
      RouteFreezeDisposition,
      | "dispositionId"
      | "manifestVersionRef"
      | "releaseApprovalFreezeRef"
      | "freezeRecordRef"
      | "activatedAt"
      | "releasedAt"
    >
  >
> = {
  jp_pharmacy_status: {
    journeyPathRef: "jp_pharmacy_status",
    freezeMode: "read_only",
    patientMessageRef: "PatientMessage:385:pharmacy-status-read-only",
    safeRouteRef: "/requests/:requestId/status",
    supportRecoveryRef: "SupportRecovery:385:pharmacy-status-safe-status",
  },
  jp_manage_local_appointment: {
    journeyPathRef: "jp_manage_local_appointment",
    freezeMode: "placeholder_only",
    patientMessageRef: "PatientMessage:385:appointment-placeholder",
    safeRouteRef: null,
    supportRecoveryRef: "SupportRecovery:385:appointment-contact-practice",
  },
  jp_records_letters_summary: {
    journeyPathRef: "jp_records_letters_summary",
    freezeMode: "hidden",
    patientMessageRef: "PatientMessage:385:records-hidden-during-freeze",
    safeRouteRef: null,
    supportRecoveryRef: "SupportRecovery:385:records-browser-route",
  },
  jp_waitlist_offer_response: {
    journeyPathRef: "jp_waitlist_offer_response",
    freezeMode: "redirect_to_safe_route",
    patientMessageRef: "PatientMessage:385:waitlist-safe-redirect",
    safeRouteRef: "/appointments/waitlist/offers",
    supportRecoveryRef: "SupportRecovery:385:waitlist-safe-route",
  },
};

export class ChannelReleaseCohortRegistry {
  private readonly cohorts = new Map<string, ChannelReleaseCohort>();

  constructor(seed: readonly ChannelReleaseCohort[] = DEFAULT_COHORTS) {
    for (const cohort of seed) {
      this.save(cohort);
    }
  }

  save(cohort: ChannelReleaseCohort): ChannelReleaseCohort {
    const cloned = clone(cohort);
    this.cohorts.set(cloned.cohortId, cloned);
    return clone(cloned);
  }

  get(cohortId: string): ChannelReleaseCohort | null {
    const cohort = this.cohorts.get(cohortId);
    return cohort ? clone(cohort) : null;
  }

  list(): ChannelReleaseCohort[] {
    return Array.from(this.cohorts.values()).map((cohort) => clone(cohort));
  }

  updateState(cohortId: string, cohortState: ChannelReleaseCohortState): ChannelReleaseCohort {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) {
      throw new Error(`CHANNEL_RELEASE_COHORT_MISSING: ${cohortId}`);
    }
    const updated = { ...cohort, cohortState };
    this.cohorts.set(cohortId, updated);
    return clone(updated);
  }
}

export class ReleaseGuardrailPolicyRegistry {
  private readonly policies = new Map<string, ReleaseGuardrailPolicy>();

  constructor(seed: readonly ReleaseGuardrailPolicy[] = DEFAULT_POLICIES) {
    for (const policy of seed) {
      this.policies.set(policy.policyId, clone(policy));
    }
  }

  get(policyId: string): ReleaseGuardrailPolicy | null {
    const policy = this.policies.get(policyId);
    return policy ? clone(policy) : null;
  }

  list(): ReleaseGuardrailPolicy[] {
    return Array.from(this.policies.values()).map((policy) => clone(policy));
  }

  evaluate(policyId: string, observation: GuardrailObservationWindow): GuardrailEvaluationResult {
    const policy = this.get(policyId);
    if (!policy) {
      throw new Error(`RELEASE_GUARDRAIL_POLICY_MISSING: ${policyId}`);
    }
    const failureReasons: LiveControlFailureReason[] = [];
    const triggerTypes: FreezeTriggerType[] = [];

    if (observation.sampleSize < policy.minimumSampleSize) {
      appendUnique(failureReasons, "sample_size_below_minimum");
    }
    if (!observation.telemetryPresent) {
      appendUnique(failureReasons, "telemetry_missing");
      appendUnique(triggerTypes, "telemetry_missing");
    }
    if (
      observation.authFailureRate > policy.maxAuthFailureRate ||
      observation.journeyErrorRate > policy.maxJourneyErrorRate ||
      observation.downloadFailureRate > policy.maxDownloadFailureRate ||
      observation.supportContactRate > policy.maxSupportContactRate ||
      observation.bridgeFailureRate > policy.maxBridgeFailureRate
    ) {
      appendUnique(failureReasons, "threshold_breach");
      appendUnique(triggerTypes, "threshold_breach");
    }
    if (observation.assuranceSliceState !== "current") {
      appendUnique(failureReasons, "assurance_slice_degraded");
      appendUnique(triggerTypes, "assurance_slice_degraded");
    }
    if (observation.compatibilityEvidenceState !== "current") {
      appendUnique(failureReasons, "compatibility_drift");
      appendUnique(triggerTypes, "compatibility_drift");
    }
    if (observation.continuityEvidenceState !== "current") {
      appendUnique(failureReasons, "continuity_evidence_degraded");
      appendUnique(triggerTypes, "continuity_evidence_degraded");
    }

    const rollbackRecommended =
      observation.authFailureRate > policy.maxAuthFailureRate * 2 ||
      observation.journeyErrorRate > policy.maxJourneyErrorRate * 2 ||
      observation.downloadFailureRate > policy.maxDownloadFailureRate * 2 ||
      observation.supportContactRate > policy.maxSupportContactRate * 2 ||
      observation.bridgeFailureRate > policy.maxBridgeFailureRate * 2 ||
      observation.safetyIssueCount > 0;

    return freeze({
      policyRef: policy.policyId,
      guardrailState:
        triggerTypes.length > 0
          ? "freeze_required"
          : failureReasons.length > 0
            ? "blocked"
            : "green",
      failureReasons,
      triggerTypes,
      rollbackRecommended,
      observationWindow: clone(observation),
    });
  }
}

export class ChannelReleaseFreezeManager {
  private readonly records = new Map<string, ChannelReleaseFreezeRecord>();

  constructor(seed: readonly ChannelReleaseFreezeRecord[] = []) {
    for (const record of seed) {
      this.records.set(record.freezeRecordId, clone(record));
    }
  }

  list(): ChannelReleaseFreezeRecord[] {
    return Array.from(this.records.values()).map((record) => clone(record));
  }

  get(freezeRecordId: string): ChannelReleaseFreezeRecord | null {
    const record = this.records.get(freezeRecordId);
    return record ? clone(record) : null;
  }

  findActive(input: {
    readonly cohortRef?: string;
    readonly journeyPathRef?: string;
    readonly manifestVersionRef: string;
    readonly releaseApprovalFreezeRef: string;
  }): ChannelReleaseFreezeRecord | null {
    const record = Array.from(this.records.values()).find((candidate) => {
      const stateActive =
        candidate.freezeState === "frozen" ||
        candidate.freezeState === "kill_switch_active" ||
        candidate.freezeState === "rollback_recommended" ||
        candidate.freezeState === "monitoring";
      const sameTuple =
        candidate.manifestVersionRef === input.manifestVersionRef &&
        candidate.releaseApprovalFreezeRef === input.releaseApprovalFreezeRef;
      const sameCohort = !input.cohortRef || candidate.cohortRef === input.cohortRef;
      const includesRoute =
        !input.journeyPathRef || candidate.journeyPathRefs.includes(input.journeyPathRef);
      return stateActive && sameTuple && sameCohort && includesRoute;
    });
    return record ? clone(record) : null;
  }

  openFreeze(input: {
    readonly cohort: ChannelReleaseCohort;
    readonly triggerType: FreezeTriggerType;
    readonly freezeState?: FreezeState;
    readonly assuranceSliceTrustRefs?: readonly string[];
    readonly continuityEvidenceRefs?: readonly string[];
    readonly operatorNoteRef?: string;
    readonly rollbackActionRef?: string | null;
    readonly now?: string;
  }): ChannelReleaseFreezeRecord {
    const active = this.findActive({
      cohortRef: input.cohort.cohortId,
      manifestVersionRef: input.cohort.manifestVersionRef,
      releaseApprovalFreezeRef: input.cohort.releaseApprovalFreezeRef,
    });
    if (active) {
      return active;
    }
    const openedAt = input.now ?? RECORDED_AT;
    const core = {
      manifestVersionRef: input.cohort.manifestVersionRef,
      releaseApprovalFreezeRef: input.cohort.releaseApprovalFreezeRef,
      cohortRef: input.cohort.cohortId,
      journeyPathRefs: Array.from(input.cohort.enabledJourneys),
      triggerType: input.triggerType,
      assuranceSliceTrustRefs: Array.from(
        input.assuranceSliceTrustRefs ?? ["AssuranceSliceTrust:385:nhs-app-channel-current"],
      ),
      continuityEvidenceRefs: Array.from(
        input.continuityEvidenceRefs ?? ["ContinuityEvidence:383:route-readiness-current"],
      ),
      freezeState: input.freezeState ?? "frozen",
      openedAt,
      releasedAt: null,
      operatorNoteRef: input.operatorNoteRef ?? DEFAULT_OPERATOR_NOTE_REF,
      rollbackActionRef: input.rollbackActionRef ?? null,
    };
    const freezeRecordId = `ChannelReleaseFreezeRecord:385:${hashString(stableStringify(core)).slice(7, 23)}`;
    const record = freeze({
      freezeRecordId,
      ...core,
    });
    this.records.set(freezeRecordId, clone(record));
    return record;
  }

  releaseFreeze(input: {
    readonly freezeRecordId: string;
    readonly expectedManifestVersion?: string;
    readonly expectedReleaseApprovalFreezeRef?: string;
    readonly operatorNoteRef?: string;
    readonly now?: string;
  }): ChannelReleaseFreezeRecord {
    const record = this.records.get(input.freezeRecordId);
    if (!record) {
      throw new Error(`CHANNEL_RELEASE_FREEZE_RECORD_MISSING: ${input.freezeRecordId}`);
    }
    if (
      (input.expectedManifestVersion &&
        input.expectedManifestVersion !== record.manifestVersionRef) ||
      (input.expectedReleaseApprovalFreezeRef &&
        input.expectedReleaseApprovalFreezeRef !== record.releaseApprovalFreezeRef)
    ) {
      throw new Error(`CHANNEL_RELEASE_FREEZE_TUPLE_DRIFT: ${input.freezeRecordId}`);
    }
    const released = freeze({
      ...record,
      freezeState: "released" as const,
      releasedAt: input.now ?? RECORDED_AT,
      operatorNoteRef: input.operatorNoteRef ?? record.operatorNoteRef,
    });
    this.records.set(input.freezeRecordId, clone(released));
    return released;
  }
}

export class RouteFreezeDispositionResolver {
  constructor(
    private readonly templates: Readonly<
      Record<
        string,
        Omit<
          RouteFreezeDisposition,
          | "dispositionId"
          | "manifestVersionRef"
          | "releaseApprovalFreezeRef"
          | "freezeRecordRef"
          | "activatedAt"
          | "releasedAt"
        >
      >
    > = DEFAULT_DISPOSITION_TEMPLATES,
  ) {}

  resolve(input: {
    readonly journeyPathRef: string;
    readonly activeFreeze: ChannelReleaseFreezeRecord | null;
  }): RouteFreezeDisposition | null {
    if (!input.activeFreeze) {
      return null;
    }
    const template =
      this.templates[input.journeyPathRef] ??
      ({
        journeyPathRef: input.journeyPathRef,
        freezeMode: "redirect_to_safe_route" as const,
        patientMessageRef: "PatientMessage:385:generic-safe-route",
        safeRouteRef: "/",
        supportRecoveryRef: "SupportRecovery:385:generic-safe-route",
      } satisfies Omit<
        RouteFreezeDisposition,
        | "dispositionId"
        | "manifestVersionRef"
        | "releaseApprovalFreezeRef"
        | "freezeRecordRef"
        | "activatedAt"
        | "releasedAt"
      >);
    const core = {
      ...template,
      manifestVersionRef: input.activeFreeze.manifestVersionRef,
      releaseApprovalFreezeRef: input.activeFreeze.releaseApprovalFreezeRef,
      freezeRecordRef: input.activeFreeze.freezeRecordId,
      activatedAt: input.activeFreeze.openedAt,
      releasedAt: input.activeFreeze.releasedAt,
    };
    return freeze({
      dispositionId: `RouteFreezeDisposition:385:${hashString(stableStringify(core)).slice(7, 23)}`,
      ...core,
    });
  }
}

export class JourneyChangeNoticeRegistry {
  private readonly notices = new Map<string, JourneyChangeNotice>();

  constructor(seed: readonly JourneyChangeNotice[] = []) {
    for (const notice of seed) {
      this.notices.set(notice.noticeId, clone(notice));
    }
  }

  list(): JourneyChangeNotice[] {
    return Array.from(this.notices.values()).map((notice) => clone(notice));
  }

  submit(input: {
    readonly changeType: JourneyChangeType;
    readonly affectedJourneys: readonly string[];
    readonly manifestVersion?: string;
    readonly submittedAt?: string;
    readonly plannedChangeAt: string;
    readonly integrationManagerRef?: string;
  }): JourneyChangeNotice {
    const submittedAt = input.submittedAt ?? RECORDED_AT;
    const requiredDays = input.changeType === "minor" ? 30 : 90;
    const leadTimeRequired: JourneyChangeNotice["leadTimeRequired"] =
      input.changeType === "minor" ? "P1M" : "P3M";
    const leadTimeDays = daysBetween(submittedAt, input.plannedChangeAt);
    const approvalState: JourneyChangeApprovalState =
      leadTimeDays >= requiredDays ? "submitted" : "blocked_lead_time";
    const core = {
      changeType: input.changeType,
      affectedJourneys: Array.from(input.affectedJourneys),
      manifestVersion: input.manifestVersion ?? PHASE7_MANIFEST_VERSION,
      leadTimeRequired,
      leadTimeDays,
      submittedAt,
      plannedChangeAt: input.plannedChangeAt,
      approvalState,
      integrationManagerRef: input.integrationManagerRef ?? "IntegrationManager:nhs-app-phase7",
    };
    const notice = freeze({
      noticeId: `JourneyChangeNotice:385:${hashString(stableStringify(core)).slice(7, 23)}`,
      ...core,
    });
    this.notices.set(notice.noticeId, clone(notice));
    return notice;
  }
}

export class LiveControlAuditLog {
  private readonly events: LiveControlAuditEvent[] = [];

  append(input: Omit<LiveControlAuditEvent, "eventId">): LiveControlAuditEvent {
    const event = freeze({
      eventId: `LiveControlAuditEvent:385:${input.decision}:${hashString(stableStringify(input)).slice(7, 23)}`,
      ...input,
    });
    this.events.push(clone(event));
    return event;
  }

  list(): LiveControlAuditEvent[] {
    return this.events.map((event) => clone(event));
  }
}

export interface Phase7LiveControlApplication {
  readonly manifestApplication: Phase7NhsAppManifestApplication;
  readonly routeReadinessApplication: Phase7RouteReadinessApplication;
  readonly environmentTelemetryApplication: Phase7EnvironmentTelemetryApplication;
  readonly cohortRegistry: ChannelReleaseCohortRegistry;
  readonly guardrailPolicyRegistry: ReleaseGuardrailPolicyRegistry;
  readonly freezeManager: ChannelReleaseFreezeManager;
  readonly routeFreezeDispositionResolver: RouteFreezeDispositionResolver;
  readonly journeyChangeNoticeRegistry: JourneyChangeNoticeRegistry;
  readonly auditLog: LiveControlAuditLog;
  evaluateCohort(input: CohortEvaluationInput): CohortEvaluationResult;
  evaluateFreeze(input: CohortEvaluationInput): CohortEvaluationResult;
  activateKillSwitch(input: {
    readonly cohortId: string;
    readonly operatorNoteRef?: string;
    readonly now?: string;
  }): CohortEvaluationResult;
  releaseFreeze(input: {
    readonly freezeRecordId: string;
    readonly expectedManifestVersion?: string;
    readonly expectedReleaseApprovalFreezeRef?: string;
    readonly operatorNoteRef?: string;
    readonly now?: string;
  }): ChannelReleaseFreezeRecord;
  resolveRouteFreezeDisposition(input: {
    readonly cohortId?: string;
    readonly journeyPathRef: string;
    readonly manifestVersionRef?: string;
    readonly releaseApprovalFreezeRef?: string;
  }): RouteFreezeDisposition | null;
  generatePerformancePack(input: {
    readonly environment: NhsAppEnvironment;
    readonly period: string;
    readonly cohortId?: string;
    readonly observationWindow?: Partial<GuardrailObservationWindow>;
    readonly now?: string;
  }): NHSAppPerformancePack;
  submitJourneyChangeNotice(
    input: Parameters<JourneyChangeNoticeRegistry["submit"]>[0],
  ): JourneyChangeNotice;
  listEvidence(): Phase7LiveControlInventory;
}

export function createDefaultPhase7LiveControlApplication(input?: {
  readonly manifestApplication?: Phase7NhsAppManifestApplication;
  readonly routeReadinessApplication?: Phase7RouteReadinessApplication;
  readonly environmentTelemetryApplication?: Phase7EnvironmentTelemetryApplication;
  readonly cohortRegistry?: ChannelReleaseCohortRegistry;
  readonly guardrailPolicyRegistry?: ReleaseGuardrailPolicyRegistry;
  readonly freezeManager?: ChannelReleaseFreezeManager;
  readonly routeFreezeDispositionResolver?: RouteFreezeDispositionResolver;
  readonly journeyChangeNoticeRegistry?: JourneyChangeNoticeRegistry;
  readonly auditLog?: LiveControlAuditLog;
}): Phase7LiveControlApplication {
  const manifestApplication =
    input?.manifestApplication ?? createDefaultPhase7NhsAppManifestApplication();
  const routeReadinessApplication =
    input?.routeReadinessApplication ??
    createDefaultPhase7RouteReadinessApplication({ manifestApplication });
  const environmentTelemetryApplication =
    input?.environmentTelemetryApplication ??
    createDefaultPhase7EnvironmentTelemetryApplication({
      manifestApplication,
      routeReadinessApplication,
    });
  const cohortRegistry = input?.cohortRegistry ?? new ChannelReleaseCohortRegistry();
  const guardrailPolicyRegistry =
    input?.guardrailPolicyRegistry ?? new ReleaseGuardrailPolicyRegistry();
  const freezeManager = input?.freezeManager ?? new ChannelReleaseFreezeManager();
  const routeFreezeDispositionResolver =
    input?.routeFreezeDispositionResolver ?? new RouteFreezeDispositionResolver();
  const journeyChangeNoticeRegistry =
    input?.journeyChangeNoticeRegistry ?? new JourneyChangeNoticeRegistry();
  const auditLog = input?.auditLog ?? new LiveControlAuditLog();

  function evaluateCohort(input: CohortEvaluationInput): CohortEvaluationResult {
    const cohort = requireCohort(input.cohortId);
    return evaluateCohortInternal(cohort, input);
  }

  function evaluateFreeze(input: CohortEvaluationInput): CohortEvaluationResult {
    return evaluateCohort({
      ...input,
      observationWindow: {
        ...input.observationWindow,
        telemetryPresent: input.observationWindow?.telemetryPresent ?? false,
      },
    });
  }

  function activateKillSwitch(input: {
    readonly cohortId: string;
    readonly operatorNoteRef?: string;
    readonly now?: string;
  }): CohortEvaluationResult {
    const cohort = requireCohort(input.cohortId);
    const freezeRecord = freezeManager.openFreeze({
      cohort,
      triggerType: "threshold_breach",
      freezeState: "kill_switch_active",
      operatorNoteRef: input.operatorNoteRef ?? "OperatorNote:385:kill-switch-activation",
      rollbackActionRef:
        guardrailPolicyRegistry.get(cohort.guardrailPolicyRef)?.rollbackAction ?? null,
      now: input.now,
    });
    const updatedCohort = cohortRegistry.updateState(cohort.cohortId, "kill_switch_active");
    const environmentProfile = validateProfile(updatedCohort);
    const promotionReadiness = verifyPromotion(updatedCohort);
    const observation = mergeObservationWindow({
      ...DEFAULT_GREEN_OBSERVATION_WINDOW,
      observedAt: input.now ?? RECORDED_AT,
    });
    const guardrailEvaluation = guardrailPolicyRegistry.evaluate(
      updatedCohort.guardrailPolicyRef,
      observation,
    );
    const routeDispositions = resolveDispositions(freezeRecord);
    const auditEvent = auditLog.append({
      decision: "kill_switch_activation",
      cohortRef: updatedCohort.cohortId,
      freezeRecordRef: freezeRecord.freezeRecordId,
      manifestVersionRef: updatedCohort.manifestVersionRef,
      releaseApprovalFreezeRef: updatedCohort.releaseApprovalFreezeRef,
      failureReasons: ["threshold_breach"],
      evidenceRefs: auditEvidenceRefs({
        environmentProfile,
        promotionReadiness,
        freezeRecord,
      }),
      occurredAt: input.now ?? RECORDED_AT,
    });
    return freeze({
      schemaVersion: PHASE7_LIVE_CONTROL_SCHEMA_VERSION,
      decision: "kill_switch_activation",
      cohort: updatedCohort,
      failureReasons: ["threshold_breach"],
      environmentProfile,
      promotionReadiness,
      guardrailEvaluation,
      freezeRecord,
      routeDispositions,
      auditEvent,
    });
  }

  function releaseFreeze(input: {
    readonly freezeRecordId: string;
    readonly expectedManifestVersion?: string;
    readonly expectedReleaseApprovalFreezeRef?: string;
    readonly operatorNoteRef?: string;
    readonly now?: string;
  }): ChannelReleaseFreezeRecord {
    const released = freezeManager.releaseFreeze(input);
    cohortRegistry.updateState(released.cohortRef, "enabled");
    auditLog.append({
      decision: "release",
      cohortRef: released.cohortRef,
      freezeRecordRef: released.freezeRecordId,
      manifestVersionRef: released.manifestVersionRef,
      releaseApprovalFreezeRef: released.releaseApprovalFreezeRef,
      failureReasons: [],
      evidenceRefs: [
        released.operatorNoteRef,
        "SustainedGreenWindow:385:released-freeze-evidence",
        PHASE7_COMPATIBILITY_EVIDENCE_REF,
      ],
      occurredAt: input.now ?? RECORDED_AT,
    });
    return released;
  }

  function resolveRouteFreezeDisposition(input: {
    readonly cohortId?: string;
    readonly journeyPathRef: string;
    readonly manifestVersionRef?: string;
    readonly releaseApprovalFreezeRef?: string;
  }): RouteFreezeDisposition | null {
    const activeFreeze = freezeManager.findActive({
      cohortRef: input.cohortId,
      journeyPathRef: input.journeyPathRef,
      manifestVersionRef: input.manifestVersionRef ?? PHASE7_MANIFEST_VERSION,
      releaseApprovalFreezeRef:
        input.releaseApprovalFreezeRef ?? PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    });
    return routeFreezeDispositionResolver.resolve({
      journeyPathRef: input.journeyPathRef,
      activeFreeze,
    });
  }

  function generatePerformancePack(input: {
    readonly environment: NhsAppEnvironment;
    readonly period: string;
    readonly cohortId?: string;
    readonly observationWindow?: Partial<GuardrailObservationWindow>;
    readonly now?: string;
  }): NHSAppPerformancePack {
    const telemetryPlan = environmentTelemetryApplication.buildTelemetryPlan({
      environment: input.environment,
    });
    const cohort =
      (input.cohortId ? cohortRegistry.get(input.cohortId) : null) ??
      cohortRegistry.list().find((candidate) => candidate.environment === input.environment) ??
      null;
    const observation = mergeObservationWindow({
      ...input.observationWindow,
      observedAt: input.now ?? input.observationWindow?.observedAt ?? RECORDED_AT,
    });
    const policy = guardrailPolicyRegistry.evaluate(
      cohort?.guardrailPolicyRef ?? DEFAULT_POLICY_REF,
      observation,
    );
    const journeys = telemetryPlan.trackedJourneys.length
      ? telemetryPlan.trackedJourneys
      : ["jp_pharmacy_status"];
    const journeyUsage = journeys.map((journeyPathRef) => {
      const routeEntryCount = observation.sampleSize;
      return {
        journeyPathRef,
        cohortRef: cohort?.cohortId ?? `cohort:${input.environment}:aggregate`,
        routeEntryCount,
        successfulCompletionCount: Math.max(
          0,
          Math.round(routeEntryCount * (1 - observation.journeyErrorRate)),
        ),
      };
    });
    const completionRates = journeyUsage.map((usage) => ({
      journeyPathRef: usage.journeyPathRef,
      rate:
        usage.routeEntryCount === 0 ? 0 : usage.successfulCompletionCount / usage.routeEntryCount,
    }));
    const dropOffs = journeyUsage.map((usage) => ({
      journeyPathRef: usage.journeyPathRef,
      rate: Math.min(1, observation.journeyErrorRate + observation.authFailureRate),
    }));
    const core = {
      period: input.period,
      environment: input.environment,
      manifestVersionRef: PHASE7_MANIFEST_VERSION,
      releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      telemetryPlanRef: telemetryPlan.planId,
      eventContractRefs: telemetryPlan.eventContractRefs,
      journeyUsage,
      completionRates,
      dropOffs,
      guardrailBreaches: policy.failureReasons,
      incidentSummary:
        observation.incidentCount > 0
          ? [`IncidentSummary:385:${input.period}:count-${observation.incidentCount}`]
          : [],
      accessibilityIssues:
        observation.accessibilityIssueCount > 0
          ? [`AccessibilityIssue:385:${input.period}:count-${observation.accessibilityIssueCount}`]
          : [],
      safetyIssues:
        observation.safetyIssueCount > 0
          ? [`SafetyIssue:385:${input.period}:count-${observation.safetyIssueCount}`]
          : [],
      generatedAt: input.now ?? RECORDED_AT,
    };
    return freeze({
      packId: `NHSAppPerformancePack:385:${input.environment}:${input.period}`,
      ...core,
      packHash: hashString(stableStringify(core)),
    });
  }

  function submitJourneyChangeNotice(
    input: Parameters<JourneyChangeNoticeRegistry["submit"]>[0],
  ): JourneyChangeNotice {
    const notice = journeyChangeNoticeRegistry.submit(input);
    auditLog.append({
      decision: notice.approvalState === "blocked_lead_time" ? "blocked" : "enable",
      cohortRef: null,
      freezeRecordRef: null,
      manifestVersionRef: notice.manifestVersion,
      releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      failureReasons:
        notice.approvalState === "blocked_lead_time" ? ["change_notice_lead_time_unmet"] : [],
      evidenceRefs: [notice.noticeId, notice.integrationManagerRef],
      occurredAt: notice.submittedAt,
    });
    return notice;
  }

  function listEvidence(): Phase7LiveControlInventory {
    return freeze({
      schemaVersion: PHASE7_LIVE_CONTROL_SCHEMA_VERSION,
      cohorts: cohortRegistry.list(),
      guardrailPolicies: guardrailPolicyRegistry.list(),
      freezeRecords: freezeManager.list(),
      journeyChangeNotices: journeyChangeNoticeRegistry.list(),
      auditEvents: auditLog.list(),
    });
  }

  function evaluateCohortInternal(
    cohort: ChannelReleaseCohort,
    input: CohortEvaluationInput,
  ): CohortEvaluationResult {
    const environmentProfile = validateProfile(cohort, input);
    const promotionReadiness = verifyPromotion(cohort, input);
    const observation = mergeObservationWindow({
      ...input.observationWindow,
      observedAt: input.now ?? input.observationWindow?.observedAt ?? RECORDED_AT,
    });
    const guardrailEvaluation = guardrailPolicyRegistry.evaluate(
      cohort.guardrailPolicyRef,
      observation,
    );
    const failureReasons: LiveControlFailureReason[] = [];
    if (hasTupleDrift(cohort, input)) {
      appendUnique(failureReasons, "release_tuple_drift");
    }
    if (
      environmentProfile.failureReasons.length > 0 ||
      environmentProfile.parityState !== "matching"
    ) {
      appendUnique(failureReasons, "environment_profile_drift");
    }
    if (promotionReadiness.promotionState !== "promotable") {
      appendUnique(failureReasons, "readiness_not_ready");
    }
    appendAll(failureReasons, guardrailEvaluation.failureReasons);

    const activeFreeze = freezeManager.findActive({
      cohortRef: cohort.cohortId,
      manifestVersionRef: cohort.manifestVersionRef,
      releaseApprovalFreezeRef: cohort.releaseApprovalFreezeRef,
    });
    if (activeFreeze) {
      appendUnique(failureReasons, "active_freeze");
    }

    let freezeRecord: ChannelReleaseFreezeRecord | null = activeFreeze;
    let decision: LiveControlDecision;
    let updatedCohort = cohort;
    if (!freezeRecord && guardrailEvaluation.triggerTypes.length > 0) {
      const triggerType = guardrailEvaluation.triggerTypes[0] ?? "threshold_breach";
      const freezeState = guardrailEvaluation.rollbackRecommended
        ? "rollback_recommended"
        : "frozen";
      freezeRecord = freezeManager.openFreeze({
        cohort,
        triggerType,
        freezeState,
        assuranceSliceTrustRefs: guardrailEvaluation.failureReasons.includes(
          "assurance_slice_degraded",
        )
          ? ["AssuranceSliceTrust:385:degraded"]
          : ["AssuranceSliceTrust:385:current"],
        continuityEvidenceRefs: promotionReadiness.routeResults
          .map((result) => result.evidence.continuityEvidence?.bundleId ?? null)
          .filter((ref): ref is string => ref !== null),
        operatorNoteRef: input.operatorNoteRef,
        rollbackActionRef: guardrailEvaluation.rollbackRecommended
          ? (guardrailPolicyRegistry.get(cohort.guardrailPolicyRef)?.rollbackAction ?? null)
          : null,
        now: input.now,
      });
      updatedCohort = cohortRegistry.updateState(
        cohort.cohortId,
        guardrailEvaluation.rollbackRecommended ? "rollback_recommended" : "frozen",
      );
      decision = guardrailEvaluation.rollbackRecommended ? "rollback_recommendation" : "freeze";
    } else if (freezeRecord) {
      updatedCohort = cohortRegistry.updateState(
        cohort.cohortId,
        freezeRecord.freezeState === "kill_switch_active"
          ? "kill_switch_active"
          : freezeRecord.freezeState === "rollback_recommended"
            ? "rollback_recommended"
            : "frozen",
      );
      decision =
        freezeRecord.freezeState === "kill_switch_active"
          ? "kill_switch_activation"
          : freezeRecord.freezeState === "rollback_recommended"
            ? "rollback_recommendation"
            : "freeze";
    } else if (failureReasons.length > 0) {
      updatedCohort = cohortRegistry.updateState(cohort.cohortId, "monitoring");
      decision = "blocked";
    } else {
      updatedCohort = cohortRegistry.updateState(cohort.cohortId, "enabled");
      decision = "enable";
    }

    const routeDispositions = freezeRecord ? resolveDispositions(freezeRecord) : [];
    const auditEvent = auditLog.append({
      decision,
      cohortRef: updatedCohort.cohortId,
      freezeRecordRef: freezeRecord?.freezeRecordId ?? null,
      manifestVersionRef: updatedCohort.manifestVersionRef,
      releaseApprovalFreezeRef: updatedCohort.releaseApprovalFreezeRef,
      failureReasons: unique(failureReasons),
      evidenceRefs: auditEvidenceRefs({
        environmentProfile,
        promotionReadiness,
        freezeRecord,
      }),
      occurredAt: input.now ?? RECORDED_AT,
    });

    return freeze({
      schemaVersion: PHASE7_LIVE_CONTROL_SCHEMA_VERSION,
      decision,
      cohort: updatedCohort,
      failureReasons: unique(failureReasons),
      environmentProfile,
      promotionReadiness,
      guardrailEvaluation,
      freezeRecord,
      routeDispositions,
      auditEvent,
    });
  }

  function requireCohort(cohortId: string): ChannelReleaseCohort {
    const cohort = cohortRegistry.get(cohortId);
    if (!cohort) {
      throw new Error(`CHANNEL_RELEASE_COHORT_MISSING: ${cohortId}`);
    }
    return cohort;
  }

  function validateProfile(
    cohort: ChannelReleaseCohort,
    input?: CohortEvaluationInput,
  ): EnvironmentProfileValidationResult {
    return environmentTelemetryApplication.validateEnvironmentProfile({
      environment: cohort.environment,
      expectedManifestVersion: input?.expectedManifestVersion ?? cohort.manifestVersionRef,
      expectedConfigFingerprint: input?.expectedConfigFingerprint ?? PHASE7_CONFIG_FINGERPRINT,
      expectedReleaseApprovalFreezeRef:
        input?.expectedReleaseApprovalFreezeRef ?? cohort.releaseApprovalFreezeRef,
    });
  }

  function verifyPromotion(
    cohort: ChannelReleaseCohort,
    input?: CohortEvaluationInput,
  ): PromotionReadinessResult {
    return routeReadinessApplication.verifyPromotionReadiness({
      environment: cohort.environment,
      journeyPathIds: cohort.enabledJourneys,
      expectedManifestVersion: input?.expectedManifestVersion ?? cohort.manifestVersionRef,
      expectedConfigFingerprint: input?.expectedConfigFingerprint ?? PHASE7_CONFIG_FINGERPRINT,
      expectedReleaseCandidateRef:
        input?.expectedReleaseCandidateRef ?? PHASE7_RELEASE_CANDIDATE_REF,
      expectedReleaseApprovalFreezeRef:
        input?.expectedReleaseApprovalFreezeRef ?? cohort.releaseApprovalFreezeRef,
      expectedCompatibilityEvidenceRef:
        input?.expectedCompatibilityEvidenceRef ?? PHASE7_COMPATIBILITY_EVIDENCE_REF,
    });
  }

  function resolveDispositions(
    freezeRecord: ChannelReleaseFreezeRecord,
  ): readonly RouteFreezeDisposition[] {
    return freezeRecord.journeyPathRefs
      .map((journeyPathRef) =>
        routeFreezeDispositionResolver.resolve({
          journeyPathRef,
          activeFreeze: freezeRecord,
        }),
      )
      .filter((disposition): disposition is RouteFreezeDisposition => disposition !== null);
  }

  return {
    manifestApplication,
    routeReadinessApplication,
    environmentTelemetryApplication,
    cohortRegistry,
    guardrailPolicyRegistry,
    freezeManager,
    routeFreezeDispositionResolver,
    journeyChangeNoticeRegistry,
    auditLog,
    evaluateCohort,
    evaluateFreeze,
    activateKillSwitch,
    releaseFreeze,
    resolveRouteFreezeDisposition,
    generatePerformancePack,
    submitJourneyChangeNotice,
    listEvidence,
  };
}

function buildDefaultPolicy(policyId: string): ReleaseGuardrailPolicy {
  return freeze({
    policyId,
    minimumSampleSize: 25,
    maxAuthFailureRate: 0.02,
    maxJourneyErrorRate: 0.03,
    maxDownloadFailureRate: 0.05,
    maxSupportContactRate: 0.02,
    maxBridgeFailureRate: 0.03,
    sustainedGreenWindow: "P7D",
    freezeDuration: "PT24H",
    rollbackAction: "disable_jump_off_and_restore_browser_route",
  });
}

function buildCohort(input: {
  readonly cohortId: string;
  readonly releaseStage: ChannelReleaseStage;
  readonly environment: NhsAppEnvironment;
  readonly odsRules: readonly string[];
  readonly patientPopulationRules: readonly string[];
  readonly cohortState: ChannelReleaseCohortState;
  readonly startAt: string;
}): ChannelReleaseCohort {
  return freeze({
    cohortId: input.cohortId,
    odsRules: Array.from(input.odsRules),
    patientPopulationRules: Array.from(input.patientPopulationRules),
    enabledJourneys: ["jp_pharmacy_status"],
    releaseStage: input.releaseStage,
    environment: input.environment,
    manifestVersionRef: PHASE7_MANIFEST_VERSION,
    releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    guardrailPolicyRef: DEFAULT_POLICY_REF,
    killSwitchRef: DEFAULT_KILL_SWITCH_REF,
    cohortState: input.cohortState,
    startAt: input.startAt,
    endAt: null,
  });
}

function mergeObservationWindow(
  input?: Partial<GuardrailObservationWindow>,
): GuardrailObservationWindow {
  return freeze({
    ...DEFAULT_GREEN_OBSERVATION_WINDOW,
    ...input,
  });
}

function hasTupleDrift(cohort: ChannelReleaseCohort, input: CohortEvaluationInput): boolean {
  return (
    (input.expectedManifestVersion !== undefined &&
      input.expectedManifestVersion !== cohort.manifestVersionRef) ||
    (input.expectedConfigFingerprint !== undefined &&
      input.expectedConfigFingerprint !== PHASE7_CONFIG_FINGERPRINT) ||
    (input.expectedReleaseCandidateRef !== undefined &&
      input.expectedReleaseCandidateRef !== PHASE7_RELEASE_CANDIDATE_REF) ||
    (input.expectedReleaseApprovalFreezeRef !== undefined &&
      input.expectedReleaseApprovalFreezeRef !== cohort.releaseApprovalFreezeRef) ||
    (input.expectedCompatibilityEvidenceRef !== undefined &&
      input.expectedCompatibilityEvidenceRef !== PHASE7_COMPATIBILITY_EVIDENCE_REF)
  );
}

function auditEvidenceRefs(input: {
  readonly environmentProfile: EnvironmentProfileValidationResult;
  readonly promotionReadiness: PromotionReadinessResult;
  readonly freezeRecord: ChannelReleaseFreezeRecord | null;
}): string[] {
  const routeRefs = input.promotionReadiness.routeResults.flatMap((result: RouteReadinessResult) =>
    [
      result.readinessId,
      result.evidence.continuityEvidence?.bundleId ?? null,
      result.evidence.accessibilityAudit?.auditRef ?? null,
      result.evidence.compatibilityAudit?.auditRef ?? null,
    ].filter((ref): ref is string => ref !== null),
  );
  return unique(
    [
      input.environmentProfile.profile?.profileId ?? "NHSAppEnvironmentProfile:missing",
      input.environmentProfile.profile?.telemetryPlanRef ?? "ChannelTelemetryPlan:missing",
      input.environmentProfile.profile?.scalBundleRef ?? "SCALBundle:missing",
      ...routeRefs,
      input.freezeRecord?.freezeRecordId ?? null,
    ].filter((ref): ref is string => ref !== null),
  );
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return 0;
  }
  return Math.floor((to - from) / 86_400_000);
}

function appendUnique<T>(values: T[], value: T): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function appendAll<T>(values: T[], additions: readonly T[]): void {
  for (const addition of additions) {
    appendUnique(values, addition);
  }
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, nestedValue) => {
    if (
      nestedValue &&
      typeof nestedValue === "object" &&
      !Array.isArray(nestedValue) &&
      !(nestedValue instanceof Date)
    ) {
      return Object.keys(nestedValue as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((accumulator, key) => {
          accumulator[key] = (nestedValue as Record<string, unknown>)[key];
          return accumulator;
        }, {});
    }
    return nestedValue;
  });
}

function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value);
}
