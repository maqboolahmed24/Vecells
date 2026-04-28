export type Wave1Promotion482State =
  | "ready"
  | "blocked"
  | "pending"
  | "settled"
  | "parity_failed"
  | "role_denied";

export interface Wave1Promotion482Lane {
  readonly laneId:
    | "scorecard"
    | "migration"
    | "bau"
    | "wave_plan"
    | "signoffs"
    | "dependencies"
    | "dress_rehearsal"
    | "uat"
    | "dr_smoke";
  readonly label: string;
  readonly state: "exact" | "blocked";
  readonly evidenceRef: string;
  readonly owner: string;
  readonly detail: string;
  readonly blockerRef: string | null;
}

export interface Wave1Promotion482Projection {
  readonly state: Wave1Promotion482State;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly waveRef: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly watchTupleRef: string;
  readonly preflightState: "exact" | "blocked";
  readonly settlementState: "not_started" | "pending" | "settled" | "blocked";
  readonly publicationParityState: "current" | "pending" | "failed";
  readonly activationClaim:
    | "not_active"
    | "pending_settlement"
    | "active_under_observation"
    | "blocked";
  readonly hasReleaseManagerAuthority: boolean;
  readonly actionEnabled: boolean;
  readonly commandId: string;
  readonly settlementId: string;
  readonly lanes: readonly Wave1Promotion482Lane[];
  readonly blockers: readonly {
    readonly blockerRef: string;
    readonly fallbackAction: string;
  }[];
}

const baseLanes: readonly Wave1Promotion482Lane[] = [
  {
    laneId: "scorecard",
    label: "Scorecard",
    state: "exact",
    evidenceRef: "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
    owner: "programme-assurance",
    detail:
      "Master scorecard is exact for the core release while deferred channel scope remains excluded.",
    blockerRef: null,
  },
  {
    laneId: "migration",
    label: "Migration",
    state: "exact",
    evidenceRef: "data/migration/474_projection_readiness_verdicts.json",
    owner: "data-migration-owner",
    detail: "Wave 1 read paths and projection backfill are exact for the approved cohort.",
    blockerRef: null,
  },
  {
    laneId: "bau",
    label: "BAU",
    state: "exact",
    evidenceRef: "data/bau/475_operating_model.json",
    owner: "service-owner",
    detail: "Runbooks, operating model, and support ownership are bound to Wave 1.",
    blockerRef: null,
  },
  {
    laneId: "wave_plan",
    label: "Wave Plan",
    state: "exact",
    evidenceRef: "data/release/476_release_wave_manifest.json",
    owner: "release-governance",
    detail: "Smallest-safe cohort excludes NHS App, pharmacy dispatch, and assistive visible mode.",
    blockerRef: null,
  },
  {
    laneId: "signoffs",
    label: "Signoffs",
    state: "exact",
    evidenceRef: "data/signoff/477_final_signoff_register.json",
    owner: "release-deployment-approver",
    detail:
      "Security, clinical safety, privacy, regulatory, and accessibility signoffs are current.",
    blockerRef: null,
  },
  {
    laneId: "dependencies",
    label: "Dependencies",
    state: "exact",
    evidenceRef: "data/readiness/478_external_dependency_readiness_matrix.json",
    owner: "platform-operations-lead",
    detail: "Launch-critical dependencies and manual fallback chains are ready for Wave 1.",
    blockerRef: null,
  },
  {
    laneId: "dress_rehearsal",
    label: "Dress Rehearsal",
    state: "exact",
    evidenceRef: "data/evidence/479_dress_rehearsal_report.json",
    owner: "release-manager",
    detail: "Production-like primary flows passed with only deferred channel constraints.",
    blockerRef: null,
  },
  {
    laneId: "uat",
    label: "UAT",
    state: "exact",
    evidenceRef: "data/evidence/480_uat_result_matrix.json",
    owner: "product-owner",
    detail: "Final UAT and visual regression have no launch-blocking findings.",
    blockerRef: null,
  },
  {
    laneId: "dr_smoke",
    label: "DR Smoke",
    state: "exact",
    evidenceRef: "data/evidence/481_dr_and_go_live_smoke_report.json",
    owner: "sre",
    detail: "DR, restore reporting, failover, rollback posture, and go-live smoke are green.",
    blockerRef: null,
  },
];

function blockedLane(
  laneId: Wave1Promotion482Lane["laneId"],
  blockerRef: string,
): Wave1Promotion482Lane {
  const lane = baseLanes.find((entry) => entry.laneId === laneId) ?? baseLanes[0];
  if (!lane) {
    throw new Error(`Unknown Wave 1 promotion lane ${laneId}`);
  }
  return {
    ...lane,
    state: "blocked",
    blockerRef,
    detail: `${lane.detail} Current fixture blocks promotion with ${blockerRef}.`,
  };
}

export function normalizeWave1Promotion482State(value: unknown): Wave1Promotion482State {
  return value === "blocked" ||
    value === "pending" ||
    value === "settled" ||
    value === "parity_failed" ||
    value === "role_denied"
    ? value
    : "ready";
}

export function createWave1Promotion482Projection(
  state: Wave1Promotion482State = "ready",
): Wave1Promotion482Projection {
  let lanes: Wave1Promotion482Lane[] = [...baseLanes];
  let settlementState: Wave1Promotion482Projection["settlementState"] = "not_started";
  let publicationParityState: Wave1Promotion482Projection["publicationParityState"] = "current";
  let activationClaim: Wave1Promotion482Projection["activationClaim"] = "not_active";
  let hasReleaseManagerAuthority = true;
  const blockers: Array<Wave1Promotion482Projection["blockers"][number]> = [];

  if (state === "blocked") {
    lanes = lanes.map((lane) =>
      lane.laneId === "migration"
        ? blockedLane("migration", "blocker:482:migration-readiness-stale-after-wave-manifest")
        : lane,
    );
    settlementState = "blocked";
    activationClaim = "blocked";
    blockers.push({
      blockerRef: "blocker:482:migration-readiness-stale-after-wave-manifest",
      fallbackAction: "Rerun projection readiness and rebuild the promotion authority tuple.",
    });
  }

  if (state === "pending") {
    settlementState = "pending";
    publicationParityState = "pending";
    activationClaim = "pending_settlement";
  }

  if (state === "settled") {
    settlementState = "settled";
    publicationParityState = "current";
    activationClaim = "active_under_observation";
  }

  if (state === "parity_failed") {
    settlementState = "blocked";
    publicationParityState = "failed";
    activationClaim = "blocked";
    blockers.push({
      blockerRef: "blocker:482:post-promotion-publication-parity-mismatch",
      fallbackAction: "Keep Wave 1 inactive and republish exact publication parity.",
    });
  }

  if (state === "role_denied") {
    hasReleaseManagerAuthority = false;
    settlementState = "blocked";
    activationClaim = "blocked";
    blockers.push({
      blockerRef: "blocker:482:operator-lacks-release-manager-authority",
      fallbackAction: "Require release-manager authority before promotion can be submitted.",
    });
  }

  const preflightState = lanes.every((lane) => lane.state === "exact") ? "exact" : "blocked";
  return {
    state,
    releaseCandidateRef: "RC_LOCAL_V1",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    waveRef: "wave_476_1_core_web_canary",
    cohortScope: "wtc_476_wave1_core_web_smallest_safe",
    channelScope: "wcs_476_wave1_core_web_only",
    watchTupleRef: "RWT_LOCAL_V1",
    preflightState,
    settlementState,
    publicationParityState,
    activationClaim,
    hasReleaseManagerAuthority,
    actionEnabled: state === "ready" && preflightState === "exact" && hasReleaseManagerAuthority,
    commandId: "promotion_command_482_wave1_ready",
    settlementId: "wave_action_settlement_482_wave1_ready",
    lanes,
    blockers,
  };
}
