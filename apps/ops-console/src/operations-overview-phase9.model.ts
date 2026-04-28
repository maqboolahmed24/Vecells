export const OPS_OVERVIEW_TASK_ID = "par_450";
export const OPS_OVERVIEW_SCHEMA_VERSION = "450.phase9.ops-overview-route.v1";
export const OPS_OVERVIEW_BOARD_SCOPE_REF = "tenant:demo-gp:ops-board";
export const OPS_OVERVIEW_TIME_HORIZON = "24h rolling";
export const OPS_OVERVIEW_SCOPE_POLICY_REF = "scope-policy:ops-service-owner-read";
export const OPS_OVERVIEW_SHELL_CONTINUITY_KEY =
  "operations:tenant-demo-gp:ops-board:24h-rolling:scope-policy-ops-service-owner-read";

export type OpsOverviewScenarioState =
  | "normal"
  | "stable_service"
  | "empty"
  | "stale"
  | "degraded"
  | "quarantined"
  | "blocked"
  | "permission_denied"
  | "freeze"
  | "settlement_pending";

export type OpsOverviewHealthState =
  | "healthy"
  | "degraded_but_operating"
  | "fallback_active"
  | "blocked"
  | "unknown_or_stale";

export type OpsOverviewOverlayState =
  | "live_trusted"
  | "constrained_fallback"
  | "diagnostic_only"
  | "recovery_only"
  | "blocked";

export type OpsOverviewAuthorityState = "enabled" | "constrained" | "observe_only" | "blocked";
export type OpsOverviewBoardSurfaceState =
  | "stable"
  | "no_material_anomaly"
  | "partial"
  | "degraded"
  | "recovery_required";

export interface OpsOverviewNorthStarMetric {
  readonly metricId: string;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly changeLabel: string;
  readonly interpretation: string;
  readonly stateLabel: OpsOverviewHealthState;
  readonly freshnessLabel: string;
  readonly confidenceLabel: string;
  readonly trend: readonly number[];
  readonly drillPath: string;
}

export interface OpsOverviewServiceHealthCell {
  readonly serviceRef: string;
  readonly serviceLabel: string;
  readonly functionCode: string;
  readonly state: OpsOverviewHealthState;
  readonly overlayState: OpsOverviewOverlayState;
  readonly mitigationAuthorityState: OpsOverviewAuthorityState;
  readonly requiredTrustState:
    | "trusted_complete"
    | "trusted_partial"
    | "degraded_partial"
    | "quarantined"
    | "blocked";
  readonly freshnessAge: string;
  readonly blockerCount: number;
  readonly latestMarker: string;
  readonly fallbackReadiness: string;
  readonly safeUntil: string;
  readonly operatorConstraint: string;
  readonly blockingProducerRefs: readonly string[];
  readonly blockingNamespaceRefs: readonly string[];
  readonly actionPosture: string;
  readonly drillPath: string;
  readonly trend: readonly number[];
  readonly summary: string;
}

export interface OpsOverviewFreshnessStrip {
  readonly surfaceRef: "ops-freshness-strip";
  readonly freshnessState: "fresh" | "watch" | "stale_review" | "read_only";
  readonly trustState: "trusted" | "degraded" | "quarantined" | "blocked";
  readonly freezeState: "none" | "release_freeze" | "diagnostic_freeze";
  readonly publicationState: "live" | "diagnostic_only" | "recovery_only" | "blocked";
  readonly liveControlState: "live" | "paused" | "read_only";
  readonly label: string;
  readonly summary: string;
  readonly restoreReport: string;
}

export interface OpsStableServiceDigest {
  readonly opsStableServiceDigestId: string;
  readonly scopeRef: string;
  readonly timeHorizon: string;
  readonly topHealthySignals: readonly string[];
  readonly watchItems: readonly string[];
  readonly guardedFunctionRefs: readonly string[];
  readonly recentResolvedInterventionRefs: readonly string[];
  readonly nextRecommendedCheckRef: string;
  readonly freshnessSummary: string;
  readonly trustBasis: string;
  readonly generatedAt: string;
}

export interface OpsOverviewProjection {
  readonly schemaVersion: typeof OPS_OVERVIEW_SCHEMA_VERSION;
  readonly scenarioState: OpsOverviewScenarioState;
  readonly boardScopeRef: typeof OPS_OVERVIEW_BOARD_SCOPE_REF;
  readonly timeHorizon: typeof OPS_OVERVIEW_TIME_HORIZON;
  readonly scopePolicyRef: typeof OPS_OVERVIEW_SCOPE_POLICY_REF;
  readonly shellContinuityKey: typeof OPS_OVERVIEW_SHELL_CONTINUITY_KEY;
  readonly boardStateDigestRef: string;
  readonly boardTupleHash: string;
  readonly selectedHealthCellRef: string;
  readonly selectedHealthCellTupleHash: string;
  readonly boardSurfaceState: OpsOverviewBoardSurfaceState;
  readonly dominantSurfaceRef: "BottleneckRadar" | "ServiceHealthGrid" | "OpsStableServiceDigest";
  readonly defaultAnomalyRef: string;
  readonly northStarBand: readonly OpsOverviewNorthStarMetric[];
  readonly serviceHealth: readonly OpsOverviewServiceHealthCell[];
  readonly freshnessStrip: OpsOverviewFreshnessStrip;
  readonly stableServiceDigest: OpsStableServiceDigest | null;
  readonly surfaceSummary: string;
  readonly detailRailTitle: string;
  readonly detailRailSummary: string;
  readonly returnFocusAnchorRef: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Record<"437" | "438" | "446", string>;
}

const sourceAlgorithmRefs = [
  "blueprint/operations-console-frontend-blueprint.md#shell-continuity-and-routes",
  "blueprint/operations-console-frontend-blueprint.md#canonical-overview-composition",
  "blueprint/operations-console-frontend-blueprint.md#4.1-NorthStarBand",
  "blueprint/operations-console-frontend-blueprint.md#4.4-ServiceHealthGrid",
  "blueprint/phase-9-the-assurance-ledger.md#9A",
  "blueprint/phase-9-the-assurance-ledger.md#9B",
] as const;

export const opsOverviewScenarioStates: readonly OpsOverviewScenarioState[] = [
  "normal",
  "stable_service",
  "empty",
  "stale",
  "degraded",
  "quarantined",
  "blocked",
  "permission_denied",
  "freeze",
  "settlement_pending",
] as const;

const scenarioAliases: Readonly<Record<string, OpsOverviewScenarioState>> = {
  normal: "normal",
  stable: "stable_service",
  stable_service: "stable_service",
  "stable-service": "stable_service",
  empty: "empty",
  no_material_anomaly: "stable_service",
  "no-material-anomaly": "stable_service",
  stale: "stale",
  degraded: "degraded",
  quarantined: "quarantined",
  quarantine: "quarantined",
  blocked: "blocked",
  permission_denied: "permission_denied",
  "permission-denied": "permission_denied",
  freeze: "freeze",
  frozen: "freeze",
  settlement_pending: "settlement_pending",
  "settlement-pending": "settlement_pending",
};

const baseNorthStarBand: readonly OpsOverviewNorthStarMetric[] = [
  {
    metricId: "north-star-queue-pressure",
    label: "Queue pressure",
    value: "82",
    unit: "index",
    changeLabel: "+6 in 90m",
    interpretation: "Priority referrals are still inside relief range but trending up.",
    stateLabel: "degraded_but_operating",
    freshnessLabel: "8m fresh",
    confidenceLabel: "0.82 lower bound",
    trend: [42, 45, 53, 61, 76, 82],
    drillPath: "/ops/overview/investigations/ops-route-07",
  },
  {
    metricId: "north-star-breach-risk",
    label: "Breach risk",
    value: "14",
    unit: "cases",
    changeLabel: "+3 above watch",
    interpretation: "Risk is concentrated in one confirmation lane.",
    stateLabel: "degraded_but_operating",
    freshnessLabel: "8m fresh",
    confidenceLabel: "supported sample",
    trend: [7, 8, 8, 10, 12, 14],
    drillPath: "/ops/overview/compare/ops-route-07",
  },
  {
    metricId: "north-star-delivery-health",
    label: "Delivery health",
    value: "91",
    unit: "%",
    changeLabel: "-4% vs baseline",
    interpretation: "Supplier acknowledgements are late but protected delivery still works.",
    stateLabel: "fallback_active",
    freshnessLabel: "12m fresh",
    confidenceLabel: "guarded tuple",
    trend: [96, 95, 94, 92, 92, 91],
    drillPath: "/ops/overview/health/ops-route-04",
  },
  {
    metricId: "north-star-dependency-health",
    label: "Dependency health",
    value: "2",
    unit: "watchpoints",
    changeLabel: "1 constrained",
    interpretation: "Outbound confirmations are using the protected path.",
    stateLabel: "fallback_active",
    freshnessLabel: "12m fresh",
    confidenceLabel: "0.74 confidence",
    trend: [1, 1, 2, 2, 2, 2],
    drillPath: "/ops/overview/health/ops-route-04",
  },
  {
    metricId: "north-star-equity-variance",
    label: "Equity variance",
    value: "4",
    unit: "%",
    changeLabel: "flat",
    interpretation: "No cohort has crossed the promotion threshold.",
    stateLabel: "healthy",
    freshnessLabel: "15m fresh",
    confidenceLabel: "exact denominator",
    trend: [5, 4, 4, 4, 4, 4],
    drillPath: "/ops/overview/investigations/ops-route-21",
  },
  {
    metricId: "north-star-trust-posture",
    label: "Trust posture",
    value: "Guarded",
    unit: "live",
    changeLabel: "1 freeze clear",
    interpretation: "Runtime publication is live, with one guarded dependency lane.",
    stateLabel: "degraded_but_operating",
    freshnessLabel: "5m fresh",
    confidenceLabel: "binding exact",
    trend: [4, 4, 4, 3, 3, 3],
    drillPath: "/ops/overview/investigations/ops-route-09",
  },
] as const;

const stableNorthStarBand: readonly OpsOverviewNorthStarMetric[] = baseNorthStarBand.map(
  (metric) => ({
    ...metric,
    value:
      metric.metricId === "north-star-queue-pressure"
        ? "31"
        : metric.metricId === "north-star-breach-risk"
          ? "0"
          : metric.metricId === "north-star-delivery-health"
            ? "98"
            : metric.metricId === "north-star-dependency-health"
              ? "0"
              : metric.metricId === "north-star-equity-variance"
                ? "2"
                : "Live",
    changeLabel:
      metric.metricId === "north-star-trust-posture"
        ? "all required refs exact"
        : "inside quiet band",
    interpretation:
      metric.metricId === "north-star-trust-posture"
        ? "All required overview trust slices are exact for the current scope."
        : "Checked and below the material anomaly threshold for this scope.",
    stateLabel: "healthy",
    confidenceLabel: "trusted complete",
    trend: [3, 3, 2, 2, 2, 2],
  }),
);

const baseServiceHealth: readonly OpsOverviewServiceHealthCell[] = [
  {
    serviceRef: "svc_confirmation",
    serviceLabel: "Referral confirmation",
    functionCode: "confirmation_flow",
    state: "degraded_but_operating",
    overlayState: "live_trusted",
    mitigationAuthorityState: "enabled",
    requiredTrustState: "trusted_complete",
    freshnessAge: "8m",
    blockerCount: 1,
    latestMarker: "Queue relief lease OSL_OPS_ROUTE_07",
    fallbackReadiness: "Manual relief ready",
    safeUntil: "2026-04-28T15:30:00Z",
    operatorConstraint: "Keep priority lane owner unchanged while applying relief.",
    blockingProducerRefs: ["triage-queue"],
    blockingNamespaceRefs: ["queue.priority.referral-confirmation"],
    actionPosture: "enabled relief plan",
    drillPath: "/ops/overview/health/ops-route-07",
    trend: [62, 66, 71, 75, 80, 82],
    summary:
      "Confirmation is degraded but still operating inside the current staffing relief window.",
  },
  {
    serviceRef: "svc_notification",
    serviceLabel: "Notification delivery",
    functionCode: "notification_delivery",
    state: "fallback_active",
    overlayState: "constrained_fallback",
    mitigationAuthorityState: "constrained",
    requiredTrustState: "trusted_partial",
    freshnessAge: "12m",
    blockerCount: 2,
    latestMarker: "Supplier watch tuple SWT-04",
    fallbackReadiness: "Protected delivery path active",
    safeUntil: "2026-04-28T16:00:00Z",
    operatorConstraint: "Priority confirmations only; ordinary retry remains held.",
    blockingProducerRefs: ["supplier-outbound-ack"],
    blockingNamespaceRefs: ["comms.delivery.receipt"],
    actionPosture: "constrained handoff",
    drillPath: "/ops/overview/health/ops-route-04",
    trend: [96, 94, 93, 91, 92, 91],
    summary: "Outbound confirmations remain visible through a constrained fallback path.",
  },
  {
    serviceRef: "svc_pharmacy_loop",
    serviceLabel: "Pharmacy loop continuity",
    functionCode: "pharmacy_loop",
    state: "degraded_but_operating",
    overlayState: "live_trusted",
    mitigationAuthorityState: "observe_only",
    requiredTrustState: "trusted_complete",
    freshnessAge: "6m",
    blockerCount: 1,
    latestMarker: "Urgent return PHC-2103",
    fallbackReadiness: "Same request anchor preserved",
    safeUntil: "2026-04-28T17:00:00Z",
    operatorConstraint: "Review before calm or closure.",
    blockingProducerRefs: ["pharmacy-outcome"],
    blockingNamespaceRefs: ["pharmacy.bounceback.urgent-return"],
    actionPosture: "observe-only review",
    drillPath: "/ops/overview/health/ops-route-pharmacy-2103",
    trend: [2, 2, 3, 4, 4, 4],
    summary: "Urgent-return continuity is authoritative but still requires active review.",
  },
  {
    serviceRef: "svc_continuity",
    serviceLabel: "Continuity evidence",
    functionCode: "continuity_evidence",
    state: "unknown_or_stale",
    overlayState: "diagnostic_only",
    mitigationAuthorityState: "observe_only",
    requiredTrustState: "degraded_partial",
    freshnessAge: "31m",
    blockerCount: 2,
    latestMarker: "Replay checkpoint RPL-12",
    fallbackReadiness: "Last stable proof readable",
    safeUntil: "diagnostic only",
    operatorConstraint: "No calmness upgrade until replay tuple realigns.",
    blockingProducerRefs: ["support-replay"],
    blockingNamespaceRefs: ["continuity.replay.checkpoint"],
    actionPosture: "diagnostic-only",
    drillPath: "/ops/overview/health/ops-route-12",
    trend: [4, 4, 5, 5, 6, 6],
    summary: "Preserved proof is readable while live rebinding remains under diagnostic review.",
  },
  {
    serviceRef: "svc_recovery",
    serviceLabel: "Recovery readiness",
    functionCode: "recovery_readiness",
    state: "healthy",
    overlayState: "live_trusted",
    mitigationAuthorityState: "observe_only",
    requiredTrustState: "trusted_complete",
    freshnessAge: "18m",
    blockerCount: 0,
    latestMarker: "Tier-2 rehearsal debt watch",
    fallbackReadiness: "Restore evidence current",
    safeUntil: "2026-04-29T09:00:00Z",
    operatorConstraint: "Schedule rehearsal before raising confidence.",
    blockingProducerRefs: [],
    blockingNamespaceRefs: [],
    actionPosture: "watch only",
    drillPath: "/ops/overview/health/ops-route-18",
    trend: [2, 2, 2, 2, 2, 2],
    summary: "Recovery posture is serviceable with one rehearsal debt watchpoint.",
  },
  {
    serviceRef: "svc_equity_watch",
    serviceLabel: "Equity watch",
    functionCode: "equity_access",
    state: "healthy",
    overlayState: "live_trusted",
    mitigationAuthorityState: "observe_only",
    requiredTrustState: "trusted_complete",
    freshnessAge: "15m",
    blockerCount: 0,
    latestMarker: "Variance under promotion band",
    fallbackReadiness: "Not required",
    safeUntil: "2026-04-28T18:00:00Z",
    operatorConstraint: "Keep watch; no intervention threshold crossed.",
    blockingProducerRefs: [],
    blockingNamespaceRefs: [],
    actionPosture: "watch only",
    drillPath: "/ops/overview/investigations/ops-route-21",
    trend: [5, 4, 4, 4, 4, 4],
    summary: "No cohort variance currently merits dominant escalation.",
  },
] as const;

function stableServiceHealth(): readonly OpsOverviewServiceHealthCell[] {
  return baseServiceHealth.map((row) => ({
    ...row,
    state:
      row.serviceRef === "svc_notification"
        ? "healthy"
        : row.state === "healthy"
          ? "healthy"
          : "healthy",
    overlayState: "live_trusted",
    mitigationAuthorityState: row.serviceRef === "svc_confirmation" ? "enabled" : "observe_only",
    requiredTrustState: "trusted_complete",
    freshnessAge: row.serviceRef === "svc_recovery" ? "18m" : "7m",
    blockerCount: 0,
    latestMarker:
      row.serviceRef === "svc_recovery" ? "Tier-2 rehearsal scheduled" : "Within quiet band",
    fallbackReadiness:
      row.serviceRef === "svc_notification" ? "Fallback available, inactive" : "Not required",
    safeUntil: "2026-04-29T09:00:00Z",
    operatorConstraint: "No material intervention required.",
    blockingProducerRefs: [],
    blockingNamespaceRefs: [],
    actionPosture: "watch only",
    trend: [2, 2, 2, 2, 2, 2],
    summary:
      "Checked against the current trust envelope and inside the material anomaly threshold.",
  }));
}

function scenarioServiceHealth(
  scenarioState: OpsOverviewScenarioState,
): readonly OpsOverviewServiceHealthCell[] {
  if (scenarioState === "stable_service" || scenarioState === "empty") {
    return stableServiceHealth();
  }

  if (scenarioState === "stale") {
    return baseServiceHealth.map((row) =>
      row.serviceRef === "svc_continuity"
        ? {
            ...row,
            state: "unknown_or_stale",
            overlayState: "diagnostic_only",
            mitigationAuthorityState: "observe_only",
            requiredTrustState: "degraded_partial",
            freshnessAge: "48m",
            blockerCount: 3,
            latestMarker: "Last stable snapshot OBS-450-STABLE-07",
            summary:
              "The last stable proof remains visible while live continuity evidence is too old for mutation.",
          }
        : row,
    );
  }

  if (scenarioState === "quarantined") {
    return baseServiceHealth.map((row) =>
      row.serviceRef === "svc_notification"
        ? {
            ...row,
            state: "unknown_or_stale",
            overlayState: "diagnostic_only",
            mitigationAuthorityState: "blocked",
            requiredTrustState: "quarantined",
            freshnessAge: "quarantined",
            blockerCount: 4,
            latestMarker: "Producer namespace quarantine PNQ-446",
            blockingProducerRefs: ["supplier-outbound-ack", "assurance-ingest-checkpoint"],
            blockingNamespaceRefs: ["comms.delivery.receipt", "assurance.metric-trust"],
            actionPosture: "read-only diagnostic",
            summary:
              "Supplier acknowledgement evidence is quarantined; the cell stays visible and cannot look healthier than the trust record.",
          }
        : row,
    );
  }

  if (scenarioState === "blocked" || scenarioState === "permission_denied") {
    return baseServiceHealth.map((row) =>
      row.serviceRef === "svc_confirmation"
        ? {
            ...row,
            state: "blocked",
            overlayState: "blocked",
            mitigationAuthorityState: "blocked",
            requiredTrustState: "blocked",
            freshnessAge: scenarioState === "permission_denied" ? "scope denied" : "blocked",
            blockerCount: 5,
            latestMarker:
              scenarioState === "permission_denied"
                ? "Purpose-of-use denied"
                : "Runtime publication blocked",
            actionPosture: "blocked",
            summary:
              scenarioState === "permission_denied"
                ? "The shell is preserved, but detail remains hidden until scope is repaired."
                : "Runtime publication is blocked; only the last safe board context remains readable.",
          }
        : row,
    );
  }

  if (scenarioState === "freeze") {
    return baseServiceHealth.map((row) =>
      row.serviceRef === "svc_notification" || row.serviceRef === "svc_confirmation"
        ? {
            ...row,
            state:
              row.serviceRef === "svc_notification" ? "fallback_active" : "degraded_but_operating",
            overlayState: "recovery_only",
            mitigationAuthorityState: "observe_only",
            requiredTrustState: "trusted_partial",
            latestMarker: "Release freeze RFZ-450 active",
            actionPosture: "governance handoff only",
            summary:
              "A release freeze is active; context stays visible while executable mitigation is downgraded.",
          }
        : row,
    );
  }

  if (scenarioState === "settlement_pending") {
    return baseServiceHealth.map((row) =>
      row.serviceRef === "svc_confirmation"
        ? {
            ...row,
            state: "degraded_but_operating",
            overlayState: "live_trusted",
            mitigationAuthorityState: "constrained",
            latestMarker: "Relief settlement pending",
            actionPosture: "pending settlement",
            summary:
              "The relief plan is pending authoritative settlement; do not show applied calmness yet.",
          }
        : row,
    );
  }

  if (scenarioState === "degraded") {
    return baseServiceHealth.map((row) =>
      row.serviceRef === "svc_notification" || row.serviceRef === "svc_continuity"
        ? {
            ...row,
            state: row.serviceRef === "svc_notification" ? "fallback_active" : "unknown_or_stale",
            overlayState:
              row.serviceRef === "svc_notification" ? "constrained_fallback" : "diagnostic_only",
            mitigationAuthorityState: "observe_only",
            requiredTrustState: "degraded_partial",
            blockerCount: row.blockerCount + 1,
            actionPosture: "observe-only",
          }
        : row,
    );
  }

  return baseServiceHealth;
}

function scenarioNorthStarBand(
  scenarioState: OpsOverviewScenarioState,
): readonly OpsOverviewNorthStarMetric[] {
  if (scenarioState === "stable_service" || scenarioState === "empty") {
    return stableNorthStarBand;
  }
  if (scenarioState === "blocked" || scenarioState === "permission_denied") {
    return baseNorthStarBand.map((metric) =>
      metric.metricId === "north-star-trust-posture"
        ? {
            ...metric,
            value: "Blocked",
            unit: "read-only",
            changeLabel: "live controls disabled",
            stateLabel: "blocked",
            interpretation:
              scenarioState === "permission_denied"
                ? "Scope repair is required before details can be shown."
                : "Publication or trust posture blocks live mitigation.",
          }
        : metric,
    );
  }
  if (scenarioState === "stale" || scenarioState === "quarantined") {
    return baseNorthStarBand.map((metric) =>
      metric.metricId === "north-star-trust-posture"
        ? {
            ...metric,
            value: scenarioState === "quarantined" ? "Quarantined" : "Stale",
            unit: "diagnostic",
            changeLabel: "last stable board pinned",
            stateLabel: "unknown_or_stale",
            freshnessLabel: scenarioState === "quarantined" ? "quarantine active" : "48m stale",
            interpretation:
              "The board preserves the last stable context and downgrades affected controls.",
          }
        : metric,
    );
  }
  if (scenarioState === "freeze") {
    return baseNorthStarBand.map((metric) =>
      metric.metricId === "north-star-trust-posture"
        ? {
            ...metric,
            value: "Frozen",
            unit: "release",
            changeLabel: "governance only",
            stateLabel: "fallback_active",
            interpretation:
              "The active freeze is rendered as an operational state, not a generic banner.",
          }
        : metric,
    );
  }
  return baseNorthStarBand;
}

function stableDigestForScenario(
  scenarioState: OpsOverviewScenarioState,
): OpsStableServiceDigest | null {
  if (scenarioState !== "stable_service" && scenarioState !== "empty") {
    return null;
  }

  return {
    opsStableServiceDigestId: `OSD_450_${scenarioState.toUpperCase()}`,
    scopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    topHealthySignals: [
      "All six essential functions are live-trusted for the current scope.",
      "No queue, dependency, delivery, equity, or recovery signal crosses the promotion threshold.",
      "Runtime publication bundle and release freeze verdict are exact.",
    ],
    watchItems:
      scenarioState === "empty"
        ? [
            "Current filters suppress every visible entity; widen scope or clear filters to inspect recent interventions.",
          ]
        : ["Recovery rehearsal debt remains scheduled watch, not a live blocker."],
    guardedFunctionRefs: [],
    recentResolvedInterventionRefs: ["ops-intervention-confirmation-relief-449"],
    nextRecommendedCheckRef:
      scenarioState === "empty"
        ? "clear-filter-and-review-recent-interventions"
        : "next-15m-freshness-refresh",
    freshnessSummary: "All included cells are <= 18m old and inside declared cadence.",
    trustBasis: "Assurance slice trust is trusted/complete for required overview slices.",
    generatedAt: "2026-04-28T13:10:00Z",
  };
}

function freshnessStripForScenario(
  scenarioState: OpsOverviewScenarioState,
): OpsOverviewFreshnessStrip {
  switch (scenarioState) {
    case "stable_service":
    case "empty":
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "fresh",
        trustState: "trusted",
        freezeState: "none",
        publicationState: "live",
        liveControlState: "live",
        label: "Fresh trusted service digest",
        summary: "All visible overview slices are current for the selected scope and horizon.",
        restoreReport: "Full restore available through the current board digest.",
      };
    case "stale":
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "stale_review",
        trustState: "degraded",
        freezeState: "diagnostic_freeze",
        publicationState: "diagnostic_only",
        liveControlState: "read_only",
        label: "Stale review",
        summary: "The last stable board remains visible; affected mutation controls are frozen.",
        restoreReport: "Restore is read-only until the stale slice reacquires freshness.",
      };
    case "quarantined":
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "read_only",
        trustState: "quarantined",
        freezeState: "diagnostic_freeze",
        publicationState: "diagnostic_only",
        liveControlState: "read_only",
        label: "Quarantined slice",
        summary:
          "A mandatory producer namespace is quarantined; affected cells stay visible and diagnostic-only.",
        restoreReport: "Nearest valid board restored with quarantined evidence named.",
      };
    case "blocked":
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "read_only",
        trustState: "blocked",
        freezeState: "diagnostic_freeze",
        publicationState: "blocked",
        liveControlState: "read_only",
        label: "Blocked runtime posture",
        summary: "Publication or required trust is blocked; no live control is armed.",
        restoreReport: "The shell is preserved with blocked recovery posture.",
      };
    case "permission_denied":
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "read_only",
        trustState: "blocked",
        freezeState: "none",
        publicationState: "blocked",
        liveControlState: "read_only",
        label: "Permission denied",
        summary:
          "The board shell remains, but protected details are withheld for this purpose-of-use scope.",
        restoreReport: "Return token restores the shell only after scope repair.",
      };
    case "freeze":
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "watch",
        trustState: "degraded",
        freezeState: "release_freeze",
        publicationState: "recovery_only",
        liveControlState: "read_only",
        label: "Release freeze active",
        summary:
          "Affected journeys and fallback posture are visible; mitigation requires governance handoff.",
        restoreReport: "Return restores the same frozen basis before any re-entry.",
      };
    case "settlement_pending":
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "watch",
        trustState: "trusted",
        freezeState: "none",
        publicationState: "live",
        liveControlState: "paused",
        label: "Settlement pending",
        summary:
          "The current relief action is pending authoritative settlement and cannot display applied calmness.",
        restoreReport: "Queued changes are digest-only until settlement completes.",
      };
    case "degraded":
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "watch",
        trustState: "degraded",
        freezeState: "none",
        publicationState: "diagnostic_only",
        liveControlState: "read_only",
        label: "Degraded but operating",
        summary:
          "Local degraded posture is contained to affected services while the last stable board stays visible.",
        restoreReport: "Return restores visible degraded cells with observe-only controls.",
      };
    case "normal":
    default:
      return {
        surfaceRef: "ops-freshness-strip",
        freshnessState: "fresh",
        trustState: "trusted",
        freezeState: "none",
        publicationState: "live",
        liveControlState: "live",
        label: "Fresh guarded live",
        summary:
          "The board is live; selected health and anomaly leases are pinned against the current digest.",
        restoreReport: "Full restore available through the current return token.",
      };
  }
}

function boardSurfaceStateForScenario(
  scenarioState: OpsOverviewScenarioState,
): OpsOverviewBoardSurfaceState {
  switch (scenarioState) {
    case "stable_service":
      return "stable";
    case "empty":
      return "no_material_anomaly";
    case "stale":
      return "partial";
    case "degraded":
    case "quarantined":
      return "degraded";
    case "blocked":
    case "permission_denied":
    case "freeze":
      return "recovery_required";
    case "settlement_pending":
    case "normal":
    default:
      return "partial";
  }
}

export function normalizeOpsOverviewScenarioState(
  rawState: string | null | undefined,
): OpsOverviewScenarioState {
  const normalized = rawState?.trim().toLowerCase();
  return normalized ? (scenarioAliases[normalized] ?? "normal") : "normal";
}

export function defaultAnomalyIdForOverviewState(scenarioState: OpsOverviewScenarioState): string {
  switch (scenarioState) {
    case "stable_service":
    case "empty":
      return "ops-route-21";
    case "quarantined":
    case "degraded":
      return "ops-route-04";
    case "stale":
      return "ops-route-12";
    case "blocked":
    case "permission_denied":
      return "ops-route-07";
    case "freeze":
      return "ops-route-15";
    case "settlement_pending":
    case "normal":
    default:
      return "ops-route-07";
  }
}

export function defaultHealthCellForOverviewState(scenarioState: OpsOverviewScenarioState): string {
  switch (scenarioState) {
    case "stable_service":
    case "empty":
      return "svc_recovery";
    case "quarantined":
    case "degraded":
    case "freeze":
      return "svc_notification";
    case "stale":
      return "svc_continuity";
    case "blocked":
    case "permission_denied":
    case "settlement_pending":
    case "normal":
    default:
      return "svc_confirmation";
  }
}

export function deltaGateStateForOverviewState(
  scenarioState: OpsOverviewScenarioState,
): "live" | "buffered" | "stale" | "table_only" {
  switch (scenarioState) {
    case "stale":
    case "quarantined":
    case "blocked":
    case "permission_denied":
    case "freeze":
      return "stale";
    case "settlement_pending":
      return "buffered";
    case "degraded":
      return "table_only";
    case "normal":
    case "stable_service":
    case "empty":
    default:
      return "live";
  }
}

export function createOpsOverviewProjection(
  scenarioState: OpsOverviewScenarioState = "normal",
  selectedHealthCellRef: string = defaultHealthCellForOverviewState(scenarioState),
): OpsOverviewProjection {
  const serviceHealth = scenarioServiceHealth(scenarioState);
  const selectedHealthCell =
    serviceHealth.find((cell) => cell.serviceRef === selectedHealthCellRef) ??
    serviceHealth.find(
      (cell) => cell.serviceRef === defaultHealthCellForOverviewState(scenarioState),
    ) ??
    serviceHealth[0]!;
  const stableServiceDigest = stableDigestForScenario(scenarioState);
  const dominantSurfaceRef =
    stableServiceDigest != null
      ? "OpsStableServiceDigest"
      : selectedHealthCell.state === "blocked" ||
          selectedHealthCell.state === "unknown_or_stale" ||
          selectedHealthCell.state === "fallback_active"
        ? "ServiceHealthGrid"
        : "BottleneckRadar";

  return {
    schemaVersion: OPS_OVERVIEW_SCHEMA_VERSION,
    scenarioState,
    boardScopeRef: OPS_OVERVIEW_BOARD_SCOPE_REF,
    timeHorizon: OPS_OVERVIEW_TIME_HORIZON,
    scopePolicyRef: OPS_OVERVIEW_SCOPE_POLICY_REF,
    shellContinuityKey: OPS_OVERVIEW_SHELL_CONTINUITY_KEY,
    boardStateDigestRef: `OBSD_450_${scenarioState.toUpperCase()}_${selectedHealthCell.serviceRef.toUpperCase()}`,
    boardTupleHash: `ops-board-tuple-450-${scenarioState}-${selectedHealthCell.serviceRef}`,
    selectedHealthCellRef: selectedHealthCell.serviceRef,
    selectedHealthCellTupleHash: `health-tuple-450-${selectedHealthCell.serviceRef}-${selectedHealthCell.state}`,
    boardSurfaceState: boardSurfaceStateForScenario(scenarioState),
    dominantSurfaceRef,
    defaultAnomalyRef: defaultAnomalyIdForOverviewState(scenarioState),
    northStarBand: scenarioNorthStarBand(scenarioState),
    serviceHealth,
    freshnessStrip: freshnessStripForScenario(scenarioState),
    stableServiceDigest,
    surfaceSummary:
      stableServiceDigest != null
        ? "No material anomaly is promoted; the board resolves to one stable service digest and compact watch summaries."
        : selectedHealthCell.summary,
    detailRailTitle: selectedHealthCell.serviceLabel,
    detailRailSummary: selectedHealthCell.summary,
    returnFocusAnchorRef: `ops-health-cell:${selectedHealthCell.serviceRef}`,
    sourceAlgorithmRefs,
    upstreamSchemaVersions: {
      "437": "437.phase9.operational-projection-engine.v1",
      "438": "438.phase9.essential-function-metrics.v1",
      "446": "446.phase9.projection-rebuild-quarantine.v1",
    },
  };
}

export function createOpsOverviewFixture() {
  const scenarioProjections = Object.fromEntries(
    opsOverviewScenarioStates.map((scenarioState) => [
      scenarioState,
      createOpsOverviewProjection(scenarioState),
    ]),
  ) as Record<OpsOverviewScenarioState, OpsOverviewProjection>;

  return {
    taskId: OPS_OVERVIEW_TASK_ID,
    schemaVersion: OPS_OVERVIEW_SCHEMA_VERSION,
    sourceAlgorithmRefs,
    upstreamSchemaVersions: scenarioProjections.normal.upstreamSchemaVersions,
    route: "/ops/overview",
    automationAnchors: [
      "ops-overview",
      "north-star-band",
      "service-health-grid",
      "ops-freshness-strip",
      "ops-stable-service-digest",
      "ops-health-cell",
      "ops-return-token-target",
    ],
    scenarioProjections,
    noGapArtifactRequired: true,
  } as const;
}
