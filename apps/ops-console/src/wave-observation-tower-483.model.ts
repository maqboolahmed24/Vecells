export type WaveObservation483State =
  | "observing"
  | "insufficient_evidence"
  | "stable"
  | "pause_recommended"
  | "rollback_recommended"
  | "blocked";

export type WaveObservation483GuardrailState =
  | "exact"
  | "observing"
  | "insufficient_evidence"
  | "breached"
  | "stale"
  | "blocked";

export interface WaveObservation483Guardrail {
  readonly guardrailId:
    | "latency"
    | "error_rate"
    | "incident"
    | "support_load"
    | "projection_lag"
    | "safety"
    | "runtime_parity"
    | "channel_monthly";
  readonly label: string;
  readonly metric: string;
  readonly method: string;
  readonly sampleSize: string;
  readonly interval: string;
  readonly currentValue: string;
  readonly threshold: string;
  readonly state: WaveObservation483GuardrailState;
  readonly sourceProjection: string;
  readonly routeFamily: string;
  readonly blockerRef: string | null;
  readonly detail: string;
}

export interface WaveObservation483Probe {
  readonly probeId: string;
  readonly label: string;
  readonly hour: string;
  readonly state: WaveObservation483GuardrailState;
  readonly value: string;
  readonly threshold: string;
  readonly sourceProjection: string;
}

export interface WaveObservation483Recommendation {
  readonly recommendationId: string;
  readonly kind: "pause" | "rollback" | "block" | "watch";
  readonly title: string;
  readonly detail: string;
  readonly blockerRef: string | null;
  readonly commandRef: string;
}

export interface WaveObservation483Projection {
  readonly state: WaveObservation483State;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly waveRef: string;
  readonly watchTupleRef: string;
  readonly watchTupleHash: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly dwellTimer: string;
  readonly dwellState: "complete" | "observing" | "insufficient_evidence";
  readonly stabilityVerdict: WaveObservation483State;
  readonly publicationParityState: "current" | "stale";
  readonly wideningEnabled: boolean;
  readonly nextSafeAction: string;
  readonly whyNotStable: string | null;
  readonly guardrails: readonly WaveObservation483Guardrail[];
  readonly timeline: readonly WaveObservation483Probe[];
  readonly recommendations: readonly WaveObservation483Recommendation[];
  readonly incidentCorrelations: readonly {
    readonly label: string;
    readonly aggregateState: "exact" | "breached";
    readonly sliceState: "exact" | "breached";
    readonly detail: string;
  }[];
  readonly supportLoad: {
    readonly launchTickets: number;
    readonly threshold: number;
    readonly technicalProbeState: "exact" | "breached";
    readonly owner: string;
  };
  readonly recoveryDisposition: string;
}

const exactGuardrails: readonly WaveObservation483Guardrail[] = [
  {
    guardrailId: "latency",
    label: "Latency p95",
    metric: "metric:ops:request-latency-p95",
    method: "<= 900 ms over PT5M",
    sampleSize: "288 of 288",
    interval: "PT5M",
    currentValue: "612 ms",
    threshold: "900 ms",
    state: "exact",
    sourceProjection: "projection:release-watch-approved-signals:synthetic:483",
    routeFamily: "aggregate",
    blockerRef: null,
    detail: "Wave 1 request latency remains within the approved guardrail snapshot.",
  },
  {
    guardrailId: "error_rate",
    label: "5xx error rate",
    metric: "metric:ops:http-5xx-rate",
    method: "<= 0.5 percent over PT5M",
    sampleSize: "288 of 288",
    interval: "PT5M",
    currentValue: "0.08 percent",
    threshold: "0.5 percent",
    state: "exact",
    sourceProjection: "projection:release-watch-approved-signals:synthetic:483",
    routeFamily: "aggregate",
    blockerRef: null,
    detail: "HTTP 5xx rate is exact for the approved Wave 1 cohort.",
  },
  {
    guardrailId: "incident",
    label: "Incident ceiling",
    metric: "metric:ops:major-incident-count",
    method: "== 0 sev1 or sev2 over PT24H",
    sampleSize: "288 of 288",
    interval: "PT24H",
    currentValue: "0 aggregate",
    threshold: "0",
    state: "exact",
    sourceProjection: "projection:ops-incident-correlation:synthetic:483",
    routeFamily: "aggregate",
    blockerRef: null,
    detail: "Aggregate incident count is exact. Tenant slice correlation is shown separately.",
  },
  {
    guardrailId: "support_load",
    label: "Support load",
    metric: "metric:support:launch-ticket-count",
    method: "<= 3 launch tickets over PT24H",
    sampleSize: "288 of 288",
    interval: "PT24H",
    currentValue: "1 ticket",
    threshold: "3 tickets",
    state: "exact",
    sourceProjection: "projection:support-launch-load:synthetic:483",
    routeFamily: "support_intake",
    blockerRef: null,
    detail: "Support load is below the Wave 1 launch threshold.",
  },
  {
    guardrailId: "projection_lag",
    label: "Projection lag",
    metric: "metric:projection:max-lag-seconds",
    method: "<= 120 seconds over PT15M",
    sampleSize: "288 of 288",
    interval: "PT15M",
    currentValue: "34 seconds",
    threshold: "120 seconds",
    state: "exact",
    sourceProjection: "projection:runtime-read-model-lag:synthetic:483",
    routeFamily: "aggregate",
    blockerRef: null,
    detail: "Approved read-model projections are current for the active wave.",
  },
  {
    guardrailId: "safety",
    label: "Clinical safety signal",
    metric: "metric:safety:untriaged-release-signal-count",
    method: "== 0 untriaged signals over PT24H",
    sampleSize: "288 of 288",
    interval: "PT24H",
    currentValue: "0",
    threshold: "0",
    state: "exact",
    sourceProjection: "projection:clinical-safety-release-watch:synthetic:483",
    routeFamily: "clinical_safety",
    blockerRef: null,
    detail: "No untriaged clinical safety signal is attached to Wave 1.",
  },
  {
    guardrailId: "runtime_parity",
    label: "Runtime parity",
    metric: "metric:runtime:publication-parity-age-minutes",
    method: "<= 15 minutes after promotion",
    sampleSize: "288 of 288",
    interval: "PT15M",
    currentValue: "9 minutes",
    threshold: "15 minutes",
    state: "exact",
    sourceProjection: "projection:runtime-publication-parity:synthetic:483",
    routeFamily: "runtime_publication",
    blockerRef: null,
    detail: "Publication parity is current for the promoted runtime bundle.",
  },
];

const stableTimeline: readonly WaveObservation483Probe[] = [
  {
    probeId: "dwell_opened",
    label: "Dwell opened",
    hour: "0h",
    state: "exact",
    value: "Wave active",
    threshold: "settlement applied",
    sourceProjection: "data/release/482_wave1_promotion_settlement.json",
  },
  {
    probeId: "latency_probe",
    label: "Latency",
    hour: "6h",
    state: "exact",
    value: "612 ms",
    threshold: "900 ms",
    sourceProjection: "projection:release-watch-approved-signals:synthetic:483",
  },
  {
    probeId: "incident_probe",
    label: "Incident slice",
    hour: "12h",
    state: "exact",
    value: "0 slice incidents",
    threshold: "0",
    sourceProjection: "projection:ops-incident-correlation:synthetic:483",
  },
  {
    probeId: "support_probe",
    label: "Support load",
    hour: "18h",
    state: "exact",
    value: "1 ticket",
    threshold: "3 tickets",
    sourceProjection: "projection:support-launch-load:synthetic:483",
  },
  {
    probeId: "dwell_complete",
    label: "Dwell complete",
    hour: "24h",
    state: "exact",
    value: "288 samples",
    threshold: "288 samples",
    sourceProjection: "data/release/483_wave1_dwell_window_evidence.json",
  },
];

function setGuardrail(
  guardrails: readonly WaveObservation483Guardrail[],
  guardrailId: WaveObservation483Guardrail["guardrailId"],
  patch: Partial<WaveObservation483Guardrail>,
): WaveObservation483Guardrail[] {
  return guardrails.map((guardrail) =>
    guardrail.guardrailId === guardrailId ? { ...guardrail, ...patch } : guardrail,
  );
}

export function normalizeWaveObservation483State(value: unknown): WaveObservation483State {
  return value === "observing" ||
    value === "insufficient_evidence" ||
    value === "pause_recommended" ||
    value === "rollback_recommended" ||
    value === "blocked"
    ? value
    : "stable";
}

export function createWaveObservation483Projection(
  state: WaveObservation483State = "stable",
): WaveObservation483Projection {
  let guardrails = [...exactGuardrails];
  let timeline = [...stableTimeline];
  const recommendations: WaveObservation483Recommendation[] = [];
  const incidentCorrelations: Array<WaveObservation483Projection["incidentCorrelations"][number]> =
    [
      {
        label: "Aggregate and Wave 1 tenant slice",
        aggregateState: "exact",
        sliceState: "exact",
        detail: "Aggregate and tenant-slice incident counts are exact.",
      },
    ];
  let dwellTimer = "24h of 24h";
  let dwellState: WaveObservation483Projection["dwellState"] = "complete";
  let publicationParityState: WaveObservation483Projection["publicationParityState"] = "current";
  let whyNotStable: string | null = null;
  let nextSafeAction = "Wave 1 is stable. Task 484 may compute the next canary widening scope.";
  let supportLoad: WaveObservation483Projection["supportLoad"] = {
    launchTickets: 1,
    threshold: 3,
    technicalProbeState: "exact",
    owner: "support-operations",
  };
  let recoveryDisposition = "Rollback and manual fallback posture is ready for Wave 1.";

  if (state === "observing") {
    dwellTimer = "8h of 24h";
    dwellState = "observing";
    whyNotStable = "Dwell window is not complete even though point metrics are green.";
    nextSafeAction = "Continue observing Wave 1 until the full dwell window is complete.";
    timeline = timeline.map((probe) =>
      probe.probeId === "dwell_complete"
        ? { ...probe, state: "observing", value: "96 samples", threshold: "288 samples" }
        : probe,
    );
  }

  if (state === "insufficient_evidence") {
    dwellTimer = "24h of 24h";
    dwellState = "insufficient_evidence";
    whyNotStable =
      "The dwell window elapsed, but approved projection sample count is below policy.";
    nextSafeAction = "Keep Wave 1 active but do not widen until approved samples meet policy.";
    guardrails = guardrails.map((guardrail) => ({
      ...guardrail,
      sampleSize: "48 of 288",
      state: "insufficient_evidence",
      detail: `${guardrail.label} cannot be used for stability until the approved sample count reaches policy.`,
    }));
    timeline = timeline.map((probe) =>
      probe.probeId === "dwell_complete"
        ? { ...probe, state: "insufficient_evidence", value: "48 samples" }
        : probe,
    );
  }

  if (state === "pause_recommended") {
    nextSafeAction = "Open the typed pause command and hold widening until blockers are settled.";
    guardrails = setGuardrail(guardrails, "incident", {
      state: "breached",
      currentValue: "0 aggregate, 2 tenant-slice",
      blockerRef: "blocker:483:tenant-slice-incident-spike-hidden-by-aggregate",
      detail:
        "Aggregate incident count is green, but the tenant slice has two sev1 or sev2 incidents.",
    });
    guardrails = setGuardrail(guardrails, "projection_lag", {
      state: "breached",
      currentValue: "181 seconds on staff queue",
      routeFamily: "staff_queue",
      blockerRef: "blocker:483:staff-queue-projection-lag-over-threshold",
      detail:
        "Staff queue projection lag breaches even though aggregate projection lag remains green.",
    });
    supportLoad = {
      launchTickets: 5,
      threshold: 3,
      technicalProbeState: "exact",
      owner: "support-operations",
    };
    guardrails = setGuardrail(guardrails, "support_load", {
      state: "breached",
      currentValue: "5 tickets",
      blockerRef: "blocker:483:support_load_breach:support-load",
      detail: "Support threshold is breached while technical probes remain exact.",
    });
    timeline = timeline.map((probe) =>
      probe.probeId === "incident_probe"
        ? { ...probe, state: "breached", value: "2 tenant-slice incidents" }
        : probe.probeId === "support_probe"
          ? { ...probe, state: "breached", value: "5 tickets" }
          : probe,
    );
    incidentCorrelations[0] = {
      label: "Aggregate and Wave 1 tenant slice",
      aggregateState: "exact",
      sliceState: "breached",
      detail: "Aggregate healthy, slice breached: Wave 1 must pause before widening.",
    };
    recommendations.push({
      recommendationId: "pause_rec_483_tenant_slice_incident",
      kind: "pause",
      title: "Pause Wave 1",
      detail: "Create a scoped WaveActionRecord pause command for the Wave 1 cohort.",
      blockerRef: "blocker:483:tenant-slice-incident-spike-hidden-by-aggregate",
      commandRef: "WaveActionRecord:483:pause-command-handler",
    });
  }

  if (state === "rollback_recommended") {
    publicationParityState = "stale";
    nextSafeAction = "Open rollback recommendation and restore exact runtime publication parity.";
    recoveryDisposition = "Rollback is recommended until publication parity is fresh.";
    guardrails = setGuardrail(guardrails, "runtime_parity", {
      state: "stale",
      currentValue: "47 minutes",
      blockerRef: "blocker:483:runtime-publication-parity-stale-after-promotion",
      detail: "Runtime publication parity became stale after Wave 1 promotion.",
    });
    timeline = timeline.map((probe) =>
      probe.probeId === "dwell_complete"
        ? { ...probe, state: "stale", value: "parity stale" }
        : probe,
    );
    recommendations.push({
      recommendationId: "rollback_rec_483_runtime_parity_stale",
      kind: "rollback",
      title: "Rollback runtime publication",
      detail: "Use the typed rollback recommendation until runtime parity is exact.",
      blockerRef: "blocker:483:runtime-publication-parity-stale-after-promotion",
      commandRef: "WaveActionRecord:483:rollback-command-handler",
    });
  }

  if (state === "blocked") {
    nextSafeAction = "Block stability and widening until active channel monthly data is current.";
    guardrails = [
      ...guardrails,
      {
        guardrailId: "channel_monthly",
        label: "Channel monthly data",
        metric: "metric:channel:monthly-data-pack-missing",
        method: "== 0 missing packs for active channel cohort",
        sampleSize: "288 of 288",
        interval: "P1D",
        currentValue: "1 missing pack",
        threshold: "0 missing packs",
        state: "blocked",
        sourceProjection: "projection:assistive-channel-posture:synthetic:483",
        routeFamily: "nhs_app_channel",
        blockerRef: "blocker:483:active-channel-monthly-data-obligation-missing",
        detail: "An active channel cohort cannot be declared stable without current monthly data.",
      },
    ];
    recommendations.push({
      recommendationId: "block_rec_483_channel_monthly_missing",
      kind: "block",
      title: "Block widening",
      detail:
        "Resolve the active channel monthly-data obligation before stability can be published.",
      blockerRef: "blocker:483:active-channel-monthly-data-obligation-missing",
      commandRef: "WaveObservationPolicy:483:block-channel-monthly-missing",
    });
  }

  const wideningEnabled = state === "stable";
  return {
    state,
    releaseCandidateRef: "RC_LOCAL_V1",
    runtimePublicationBundleRef: "rpb::local::authoritative",
    waveRef: "wave_476_1_core_web_canary",
    watchTupleRef: "RWT_LOCAL_V1",
    watchTupleHash: "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
    cohortScope: "wtc_476_wave1_core_web_smallest_safe",
    channelScope: "wcs_476_wave1_core_web_only",
    dwellTimer,
    dwellState,
    stabilityVerdict: state,
    publicationParityState,
    wideningEnabled,
    nextSafeAction,
    whyNotStable,
    guardrails,
    timeline,
    recommendations,
    incidentCorrelations,
    supportLoad,
    recoveryDisposition,
  };
}
