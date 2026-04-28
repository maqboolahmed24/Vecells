export type GoLiveSmoke481ScenarioState = "green" | "constrained" | "blocked" | "rollback_smoke";

export interface GoLiveSmoke481Probe {
  readonly probeId: string;
  readonly label: string;
  readonly lane: "backup_restore" | "failover_continuity" | "go_live_smoke";
  readonly state: "passed" | "constrained" | "blocked";
  readonly evidenceHash: string;
  readonly communicationState: "delivered" | "queued" | "blocked";
}

export interface GoLiveSmoke481TimelineStep {
  readonly stepId: string;
  readonly label: string;
  readonly status: "settled" | "pending" | "blocked";
  readonly order: number;
}

export interface GoLiveSmoke481Projection {
  readonly scenarioState: GoLiveSmoke481ScenarioState;
  readonly smokeVerdict:
    | "go_live_smoke_green"
    | "go_live_smoke_constrained"
    | "go_live_smoke_blocked";
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly waveManifestRef: string;
  readonly releaseWatchTupleRef: string;
  readonly restorePointAgeMinutes: number;
  readonly recoveryPosture: "live_control" | "diagnostic_only" | "governed_recovery" | "blocked";
  readonly destructiveRehearsalAllowed: boolean;
  readonly rollbackAssistiveInsertVisible: boolean;
  readonly mobileEmbeddedState: "passed" | "constrained" | "blocked";
  readonly ownerRotaState: "present" | "absent";
  readonly staffQueueLagSeconds: number;
  readonly blockers: readonly {
    readonly blockerRef: string;
    readonly label: string;
    readonly fallbackAction: string;
  }[];
  readonly probes: readonly GoLiveSmoke481Probe[];
  readonly timeline: readonly GoLiveSmoke481TimelineStep[];
}

const baseProbes: readonly GoLiveSmoke481Probe[] = [
  {
    probeId: "probe_481_backup_manifest_current",
    label: "Backup manifest current",
    lane: "backup_restore",
    state: "passed",
    evidenceHash: "sha256:481b9f3b0fd1",
    communicationState: "delivered",
  },
  {
    probeId: "probe_481_restore_report_channel",
    label: "Restore report channel configured",
    lane: "backup_restore",
    state: "passed",
    evidenceHash: "sha256:481e0a5f9a20",
    communicationState: "delivered",
  },
  {
    probeId: "probe_481_failover_publication_parity",
    label: "Failover publication parity",
    lane: "failover_continuity",
    state: "passed",
    evidenceHash: "sha256:481d6f4d2191",
    communicationState: "delivered",
  },
  {
    probeId: "probe_481_staff_queue_projection",
    label: "Staff queue projection lag",
    lane: "failover_continuity",
    state: "passed",
    evidenceHash: "sha256:481a77df44c2",
    communicationState: "delivered",
  },
  {
    probeId: "probe_481_patient_status_smoke",
    label: "Patient start and status smoke",
    lane: "go_live_smoke",
    state: "passed",
    evidenceHash: "sha256:481f10a88217",
    communicationState: "delivered",
  },
  {
    probeId: "probe_481_mobile_embedded_smoke",
    label: "Embedded mobile route smoke",
    lane: "go_live_smoke",
    state: "passed",
    evidenceHash: "sha256:481c1120aa91",
    communicationState: "delivered",
  },
];

function timelineForState(
  scenarioState: GoLiveSmoke481ScenarioState,
): readonly GoLiveSmoke481TimelineStep[] {
  const failoverStatus = scenarioState === "blocked" ? "blocked" : "settled";
  const smokeStatus = scenarioState === "blocked" ? "blocked" : "settled";
  const rollbackStatus = scenarioState === "rollback_smoke" ? "pending" : failoverStatus;
  return [
    {
      stepId: "timeline_481_restore_point",
      label: "Restore point verified",
      status: "settled",
      order: 1,
    },
    {
      stepId: "timeline_481_restore_drill",
      label: "Clean restore drill",
      status: "settled",
      order: 2,
    },
    { stepId: "timeline_481_failover", label: "Failover probe", status: failoverStatus, order: 3 },
    {
      stepId: "timeline_481_smoke",
      label: "Patient and staff smoke",
      status: smokeStatus,
      order: 4,
    },
    {
      stepId: "timeline_481_rollback",
      label: "Rollback smoke freeze",
      status: rollbackStatus,
      order: 5,
    },
  ];
}

function updateProbe(
  probes: GoLiveSmoke481Probe[],
  index: number,
  patch: Partial<Pick<GoLiveSmoke481Probe, "state" | "evidenceHash" | "communicationState">>,
): void {
  const probe = probes[index];
  if (!probe) return;
  probes[index] = {
    ...probe,
    ...patch,
  };
}

export function normalizeGoLiveSmoke481ScenarioState(value: unknown): GoLiveSmoke481ScenarioState {
  return value === "constrained" || value === "blocked" || value === "rollback_smoke"
    ? value
    : "green";
}

export function createGoLiveSmoke481Projection(
  options: {
    readonly scenarioState?: unknown;
    readonly mobileEmbeddedState?: unknown;
  } = {},
): GoLiveSmoke481Projection {
  const scenarioState = normalizeGoLiveSmoke481ScenarioState(options.scenarioState);
  const mobileEmbeddedState =
    options.mobileEmbeddedState === "blocked"
      ? "blocked"
      : options.mobileEmbeddedState === "constrained"
        ? "constrained"
        : scenarioState === "constrained"
          ? "constrained"
          : "passed";
  const blockers: Array<GoLiveSmoke481Projection["blockers"][number]> = [];
  const probes: GoLiveSmoke481Probe[] = baseProbes.map((probe) => ({ ...probe }));
  let smokeVerdict: GoLiveSmoke481Projection["smokeVerdict"] = "go_live_smoke_green";
  let recoveryPosture: GoLiveSmoke481Projection["recoveryPosture"] = "live_control";
  let restorePointAgeMinutes = 18;
  let ownerRotaState: GoLiveSmoke481Projection["ownerRotaState"] = "present";
  let staffQueueLagSeconds = 24;
  let rollbackAssistiveInsertVisible = false;

  if (scenarioState === "constrained") {
    smokeVerdict = "go_live_smoke_constrained";
    recoveryPosture = "diagnostic_only";
    restorePointAgeMinutes = 42;
    ownerRotaState = "absent";
    staffQueueLagSeconds = 144;
    blockers.push({
      blockerRef: "blocker:481:owner-rota-absent",
      label: "Alert destination fired but owner rota is absent.",
      fallbackAction: "Hold promotion and assign release incident owner before Wave 1.",
    });
    updateProbe(probes, 3, {
      state: "constrained",
      evidenceHash: "sha256:481a77df44c2-lag",
      communicationState: "queued",
    });
    updateProbe(probes, 5, {
      state: mobileEmbeddedState === "blocked" ? "blocked" : "constrained",
      evidenceHash: "sha256:481c1120aa91-mobile",
      communicationState: "queued",
    });
  }

  if (scenarioState === "blocked") {
    smokeVerdict = "go_live_smoke_blocked";
    recoveryPosture = "blocked";
    restorePointAgeMinutes = 91;
    blockers.push(
      {
        blockerRef: "blocker:481:restore-report-channel-missing",
        label: "Backup target is ready but restore report channel is missing.",
        fallbackAction: "Keep release paused and configure restore report destination.",
      },
      {
        blockerRef: "blocker:481:failover-publication-parity-mismatch",
        label: "Failover switched runtime but publication parity mismatched.",
        fallbackAction: "Stand down failover and republish parity record before promotion.",
      },
    );
    updateProbe(probes, 1, {
      state: "blocked",
      evidenceHash: "sha256:481e0a5f9a20-missing",
      communicationState: "blocked",
    });
    updateProbe(probes, 2, {
      state: "blocked",
      evidenceHash: "sha256:481d6f4d2191-mismatch",
      communicationState: "blocked",
    });
  }

  if (scenarioState === "rollback_smoke") {
    smokeVerdict = "go_live_smoke_constrained";
    recoveryPosture = "governed_recovery";
    rollbackAssistiveInsertVisible = true;
    blockers.push({
      blockerRef: "blocker:481:rollback-assistive-insert-visible",
      label: "Rollback smoke detected assistive insert controls visible after freeze.",
      fallbackAction: "Keep assistive writeback hidden and rerun rollback smoke.",
    });
    updateProbe(probes, 5, {
      state: "constrained",
      evidenceHash: "sha256:481c1120aa91-freeze",
      communicationState: "queued",
    });
  }

  return {
    scenarioState,
    smokeVerdict,
    releaseCandidateRef: "release-candidate:vecells-2026-04-28.1",
    runtimePublicationBundleRef: "runtime-publication-bundle:480-final-uat",
    waveManifestRef: "wave-manifest:476-wave-1-smallest-safe-cohort",
    releaseWatchTupleRef: "release-watch-tuple:476-wave-1-observation",
    restorePointAgeMinutes,
    recoveryPosture,
    destructiveRehearsalAllowed: scenarioState === "green",
    rollbackAssistiveInsertVisible,
    mobileEmbeddedState,
    ownerRotaState,
    staffQueueLagSeconds,
    blockers,
    probes,
    timeline: timelineForState(scenarioState),
  };
}
