import type {
  HandoffProofLaneModel,
  HandoffReadinessBoardModel,
  InventoryComparisonCandidateModel,
  InventoryComparisonWorkspaceModel,
  InventoryTruthPanelModel,
  InventoryTruthRecordModel,
  MedicationLineCardModel,
  MedicationValidationBoardModel,
  MedicationValidationSignalModel,
  PharmacyCaseWorkbenchModel,
  PharmacyOperationsMetricModel,
  PharmacyOperationsPanelModel,
  PharmacyOperationsQueueRowModel,
  PharmacyStockRiskChipModel,
  PharmacyWatchWindowBannerModel,
  PharmacyWorkbenchDecisionDockModel,
  PharmacyWorkbenchTone,
} from "@vecells/design-system";
import {
  PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE,
} from "@vecells/design-system";
import type {
  PharmacyCaseSeed,
  PharmacyChildRouteKey,
  PharmacyLineItem,
  PharmacyOperationsStateRef,
  PharmacyProviderHealthState,
  PharmacyShellSnapshot,
  PharmacyWatchWindowState,
} from "./pharmacy-shell-seed.model";
import {
  derivePharmacyBlockingReasonCodes,
  derivePharmacyOperationsStateRefs,
  derivePharmacyProviderHealthState,
  derivePharmacyRecoveryOwnerLabel,
  derivePharmacyWatchWindowState,
} from "./pharmacy-shell-seed.model";

export interface PharmacyWorkbenchViewModels {
  operationsPanel: PharmacyOperationsPanelModel;
  caseWorkbench: PharmacyCaseWorkbenchModel;
  inventoryTruthPanel: InventoryTruthPanelModel;
  inventoryComparisonWorkspace: InventoryComparisonWorkspaceModel;
  handoffReadinessBoard: HandoffReadinessBoardModel;
  decisionDock: PharmacyWorkbenchDecisionDockModel;
  stockRiskBand: "low" | "watch" | "high" | "blocked";
  watchWindowState: PharmacyWatchWindowState;
  providerHealthState: PharmacyProviderHealthState;
  settlementState: string;
  handoffState: string;
}

function labelFromToken(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toneFromQueueTone(queueTone: PharmacyCaseSeed["queueTone"]): PharmacyWorkbenchTone {
  switch (queueTone) {
    case "success":
      return "ready";
    case "watch":
    case "caution":
      return "watch";
    case "critical":
      return "blocked";
  }
}

function toneFromLineItem(
  lineItem: PharmacyLineItem,
  caseSeed: PharmacyCaseSeed,
): PharmacyWorkbenchTone {
  if (lineItem.posture === "blocked") {
    return "blocked";
  }
  if (lineItem.posture === "manual_review" || lineItem.posture === "clarification_required") {
    return "review";
  }
  if (
    lineItem.posture === "partial_supply" ||
    caseSeed.inventoryPosture === "partial_supply" ||
    caseSeed.inventoryPosture === "stale_review"
  ) {
    return "watch";
  }
  return "ready";
}

function toneFromWatchWindowState(
  state: PharmacyWatchWindowState,
): PharmacyWorkbenchTone {
  switch (state) {
    case "clear":
      return "ready";
    case "watch":
      return "watch";
    case "blocked":
      return "blocked";
  }
}

function toneFromProviderHealth(
  state: PharmacyProviderHealthState,
): PharmacyWorkbenchTone {
  switch (state) {
    case "nominal":
      return "ready";
    case "degraded":
      return "watch";
    case "outage":
      return "blocked";
  }
}

function workbenchTone(
  caseSeed: PharmacyCaseSeed,
): PharmacyWorkbenchTone {
  switch (caseSeed.workbenchPosture) {
    case "ready":
      return "ready";
    case "guarded":
      return "watch";
    case "read_only":
      return "review";
    case "reopen_for_safety":
      return "blocked";
  }
}

function primaryRouteForCase(
  caseSeed: PharmacyCaseSeed,
): PharmacyChildRouteKey {
  switch (caseSeed.defaultCheckpointId) {
    case "inventory":
      return "inventory";
    case "dispatch":
      return "handoff";
    case "outcome":
      return "resolve";
    case "consent":
    case "validation":
    default:
      return "validate";
  }
}

function currentSupportRegionLabel(routeKey: PharmacyShellSnapshot["location"]["routeKey"]): string {
  switch (routeKey) {
    case "inventory":
      return "Inventory comparison";
    case "handoff":
      return "Handoff readiness";
    case "validate":
      return "Eligibility evidence";
    case "resolve":
      return "Outcome confirmation";
    case "assurance":
      return "Assurance and recovery";
    case "case":
    case "lane":
    default:
      return "Inventory status";
  }
}

function stockRiskBandForLine(
  lineItem: PharmacyLineItem,
  caseSeed: PharmacyCaseSeed,
): "low" | "watch" | "high" | "blocked" {
  if (lineItem.posture === "blocked" || caseSeed.inventoryPosture === "blocked") {
    return "blocked";
  }
  if (lineItem.posture === "manual_review" || lineItem.posture === "clarification_required") {
    return "high";
  }
  if (
    lineItem.posture === "partial_supply" ||
    caseSeed.inventoryPosture === "partial_supply" ||
    caseSeed.inventoryPosture === "stale_review"
  ) {
    return "watch";
  }
  return "low";
}

function stockRiskChipForLine(
  lineItem: PharmacyLineItem,
  caseSeed: PharmacyCaseSeed,
): PharmacyStockRiskChipModel {
  const band = stockRiskBandForLine(lineItem, caseSeed);
  switch (band) {
    case "blocked":
      return {
        tone: "blocked",
        label: "Release blocked",
        summary: "A blocked line cannot advance until the current fence or recovery status clears.",
      };
    case "high":
      return {
        tone: "review",
        label: "Supervisor review",
        summary: "The line remains visible but depends on review or clarification before release.",
      };
    case "watch":
      return {
        tone: "watch",
        label: "Stock risk watch",
        summary: "Supply, freshness, or substitution burden still needs explicit operator review.",
      };
    case "low":
    default:
      return {
        tone: "ready",
        label: "Stock ready",
        summary: "The current stock details are stable enough for routine validation work.",
      };
  }
}

function signalForLine(
  lineItem: PharmacyLineItem,
  caseSeed: PharmacyCaseSeed,
): readonly MedicationValidationSignalModel[] {
  const requested = Math.max(lineItem.requestedUnits, 1);
  const reservedRatio = `${Math.round((lineItem.reservedUnits / requested) * 100)}% held`;
  const availableRatio = `${Math.round((lineItem.availableUnits / requested) * 100)}% visible`;
  return [
    {
      signalId: `${lineItem.lineItemId}-inventory`,
      label: "Inventory",
      value: reservedRatio,
      detail: caseSeed.inventorySummary,
      tone: toneFromLineItem(lineItem, caseSeed),
    },
    {
      signalId: `${lineItem.lineItemId}-proof`,
      label: "Settlement",
      value: caseSeed.dispatchTruth.summary,
      detail: caseSeed.proofSummary,
      tone:
        caseSeed.dispatchTruth.authoritativeProofState === "ready_to_dispatch"
          ? "ready"
          : caseSeed.dispatchTruth.authoritativeProofState === "proof_pending"
            ? "watch"
            : "blocked",
    },
    {
      signalId: `${lineItem.lineItemId}-checkpoint`,
      label: "Checkpoint",
      value: caseSeed.checkpointQuestion,
      detail: lineItem.reconciliationLabel,
      tone: workbenchTone(caseSeed),
    },
  ];
}

function validationBoardForSnapshot(
  snapshot: PharmacyShellSnapshot,
): MedicationValidationBoardModel {
  return {
    title: snapshot.currentCase.caseSummary,
    summary: snapshot.summarySentence,
    checkpointLabel: snapshot.activeCheckpoint.label,
    checkpointSummary: snapshot.activeCheckpoint.summary,
    lineCards: snapshot.currentCase.lineItems.map((lineItem) => ({
      lineItemId: lineItem.lineItemId,
      medicationLabel: lineItem.medicationLabel,
      instructionLabel: lineItem.instructionLabel,
      summary: lineItem.summary,
      requestedUnitsLabel: `${lineItem.requestedUnits}`,
      reservedUnitsLabel: `${lineItem.reservedUnits}`,
      availableUnitsLabel: `${lineItem.availableUnits}`,
      postureLabel: labelFromToken(lineItem.posture),
      stockRisk: stockRiskChipForLine(lineItem, snapshot.currentCase),
      signals: signalForLine(lineItem, snapshot.currentCase),
      expanded: lineItem.lineItemId === snapshot.activeLineItem.lineItemId,
    })),
  };
}

function inventoryFreshnessLabel(caseSeed: PharmacyCaseSeed): string {
  switch (caseSeed.inventoryPosture) {
    case "live":
      return "Fresh inventory projection";
    case "partial_supply":
      return "Fresh but supply-constrained";
    case "stale_review":
      return "Table-first review";
    case "blocked":
      return "Reference-only inventory";
  }
}

function inventoryTrustLabel(caseSeed: PharmacyCaseSeed): string {
  switch (caseSeed.inventoryPosture) {
    case "live":
      return "Trusted stock details";
    case "partial_supply":
      return "Trusted with active delta";
    case "stale_review":
      return "Degraded but visible";
    case "blocked":
      return "Read-only reference";
  }
}

function buildInventoryTruthRecords(
  snapshot: PharmacyShellSnapshot,
): readonly InventoryTruthRecordModel[] {
  const lineItem = snapshot.activeLineItem;
  const caseSeed = snapshot.currentCase;
  const records: InventoryTruthRecordModel[] = [
    {
      recordId: `${lineItem.lineItemId}-primary`,
      productLabel: lineItem.medicationLabel,
      quantityLabel: `${lineItem.reservedUnits} reserved / ${lineItem.availableUnits} visible`,
      freshnessLabel: inventoryFreshnessLabel(caseSeed),
      trustLabel: inventoryTrustLabel(caseSeed),
      expiryLabel:
        lineItem.posture === "partial_supply" || caseSeed.inventoryPosture === "stale_review"
          ? "Short-dated check required"
          : "In-date pack window",
      storageLabel:
        lineItem.posture === "blocked" ? "Reference-only controlled shelf" : "Dispensary ready bin",
      flags:
        lineItem.posture === "blocked"
          ? ["Hard stop", "Do not release"]
          : lineItem.posture === "partial_supply"
            ? ["Split-pack risk", "Compare before release"]
            : ["Primary held stock"],
    },
  ];

  if (lineItem.availableUnits > lineItem.reservedUnits) {
    records.push({
      recordId: `${lineItem.lineItemId}-secondary`,
      productLabel: `${lineItem.medicationLabel} reserve bin`,
      quantityLabel: `${Math.max(lineItem.availableUnits - lineItem.reservedUnits, 0)} overflow units`,
      freshnessLabel:
        caseSeed.inventoryPosture === "stale_review"
          ? "Secondary bin / review before use"
          : "Secondary bin / available",
      trustLabel: derivePharmacyProviderHealthState(caseSeed) === "outage" ? "Outage-held" : "Visible reserve",
      expiryLabel:
        lineItem.posture === "manual_review"
          ? "Check expiry against alternative pack"
          : "In-date reserve",
      storageLabel: "Overflow or alternate storage",
      flags: ["Secondary stock anchor"],
    });
  }
  return records;
}

function comparisonCandidatesForLine(
  snapshot: PharmacyShellSnapshot,
): readonly InventoryComparisonCandidateModel[] {
  const lineItem = snapshot.activeLineItem;
  const caseSeed = snapshot.currentCase;
  const tone = toneFromLineItem(lineItem, caseSeed);
  const baseCandidates: InventoryComparisonCandidateModel[] = [
    {
      candidateId: `${lineItem.lineItemId}-held`,
      title: `${lineItem.medicationLabel} / held pack`,
      summary: "Current reserved stock remains the primary comparison anchor for this line.",
      coverageLabel: `${lineItem.reservedUnits}/${lineItem.requestedUnits} units held`,
      reservationLabel:
        lineItem.reservedUnits >= lineItem.requestedUnits
          ? "Reservation held"
          : "Reservation incomplete",
      approvalLabel:
        lineItem.posture === "partial_supply" || lineItem.posture === "manual_review"
          ? "Supervisor acknowledgement may be required"
          : "No additional approval burden",
      patientCommunicationLabel:
        lineItem.posture === "partial_supply"
          ? "Patient delta copy required"
          : "No patient delta required",
      handoffConsequenceLabel:
        caseSeed.dispatchTruth.authoritativeProofState === "ready_to_dispatch"
          ? "Handoff can remain aligned with current pack"
          : "Handoff stays pending until the active fence clears",
      tone,
      selected: true,
      commitReady:
        lineItem.posture === "ready" &&
        caseSeed.dispatchTruth.authoritativeProofState !== "contradictory_proof" &&
        caseSeed.inventoryPosture !== "blocked",
      blockingLabels:
        lineItem.posture === "ready"
          ? []
          : derivePharmacyBlockingReasonCodes(caseSeed),
    },
  ];

  baseCandidates.push({
    candidateId: `${lineItem.lineItemId}-alternate`,
    title:
      lineItem.posture === "partial_supply"
        ? "Partial supply / same line"
        : `${lineItem.medicationLabel} / alternate pack`,
    summary:
      lineItem.posture === "partial_supply"
        ? "An explicit partial-supply path remains visible instead of being hidden behind a missing stock toast."
        : "An alternate pack keeps substitution, coverage, and patient communication burden visible in one compare row.",
    coverageLabel:
      lineItem.posture === "partial_supply"
        ? `${lineItem.reservedUnits}/${lineItem.requestedUnits} units released now`
        : `${Math.max(lineItem.availableUnits, 1)}/${lineItem.requestedUnits} units visible`,
    reservationLabel:
      lineItem.posture === "partial_supply" ? "Fence required" : "Reserve after compare",
    approvalLabel:
      lineItem.posture === "blocked"
        ? "Override not allowed"
        : "Approval burden shown inline",
    patientCommunicationLabel:
      lineItem.posture === "blocked"
        ? "Calm copy suppressed"
        : "Patient-facing delta stays explicit",
    handoffConsequenceLabel:
      lineItem.posture === "blocked"
        ? "No handoff allowed"
        : "Handoff board remains bounded to the active line item",
    tone:
      lineItem.posture === "blocked"
        ? "blocked"
        : lineItem.posture === "ready"
          ? "watch"
          : "review",
    selected: false,
    commitReady: false,
    blockingLabels:
      lineItem.posture === "ready"
        ? ["comparison_fence_required"]
        : derivePharmacyBlockingReasonCodes(caseSeed),
  });

  return baseCandidates;
}

function handoffProofLanes(
  snapshot: PharmacyShellSnapshot,
): readonly HandoffProofLaneModel[] {
  const dispatch = snapshot.currentCase.dispatchTruth;
  return [
    {
      laneId: "transport",
      label: "Transport acceptance",
      value: labelFromToken(dispatch.transportAcceptanceState),
      detail: "Transport-local delivery stays distinct from authoritative proof.",
      tone:
        dispatch.transportAcceptanceState === "ready"
          ? "ready"
          : dispatch.transportAcceptanceState === "pending"
            ? "watch"
            : "blocked",
    },
    {
      laneId: "provider",
      label: "Provider acceptance",
      value: labelFromToken(dispatch.providerAcceptanceState),
      detail: "Provider acknowledgement cannot on its own paint final release.",
      tone:
        dispatch.providerAcceptanceState === "ready"
          ? "ready"
          : dispatch.providerAcceptanceState === "pending"
            ? "watch"
            : "blocked",
    },
    {
      laneId: "proof",
      label: "Authoritative proof",
      value: labelFromToken(dispatch.authoritativeProofState),
      detail: snapshot.currentCase.proofSummary,
      tone:
        dispatch.authoritativeProofState === "ready_to_dispatch"
          ? "ready"
          : dispatch.authoritativeProofState === "proof_pending"
            ? "watch"
            : "blocked",
    },
  ];
}

function operationsMetrics(
  cases: readonly PharmacyCaseSeed[],
): readonly PharmacyOperationsMetricModel[] {
  const counts = new Map<PharmacyOperationsStateRef, number>();
  for (const caseSeed of cases) {
    for (const stateRef of derivePharmacyOperationsStateRefs(caseSeed)) {
      counts.set(stateRef, (counts.get(stateRef) ?? 0) + 1);
    }
  }
  const getCount = (stateRef: PharmacyOperationsStateRef) => counts.get(stateRef) ?? 0;
  return [
    {
      metricId: "waiting_choice",
      label: "Waiting for choice",
      count: getCount("waiting_for_patient_choice"),
      summary: "Warned-choice or consent checkpoint work still visible in the queue.",
      tone: "review",
    },
    {
      metricId: "waiting_outcome",
      label: "Waiting for outcome",
      count: getCount("waiting_for_outcome"),
      summary: "Cases that remain procedurally open behind proof or outcome confirmation.",
      tone: "watch",
    },
    {
      metricId: "stock_risk",
      label: "Stock risk",
      count: getCount("stock_risk"),
      summary: "Partial supply, stale compare, or hard-stop inventory status.",
      tone: "watch",
    },
    {
      metricId: "blocked_handoff",
      label: "Handoff blocked",
      count: getCount("handoff_blocked") + getCount("provider_outage") + getCount("transport_failure"),
      summary: "Transport, provider-health, or proof conditions currently blocking release.",
      tone: "blocked",
    },
  ];
}

function queueRowForCase(caseSeed: PharmacyCaseSeed): PharmacyOperationsQueueRowModel {
  const states = derivePharmacyOperationsStateRefs(caseSeed);
  const providerHealth = derivePharmacyProviderHealthState(caseSeed);
  const tone =
    providerHealth === "outage"
      ? "blocked"
      : states.includes("transport_failure")
        ? "blocked"
        : states.includes("waiting_for_patient_choice") || states.includes("validation_due")
          ? "review"
          : toneFromQueueTone(caseSeed.queueTone);
  return {
    pharmacyCaseId: caseSeed.pharmacyCaseId,
    patientLabel: caseSeed.patientLabel,
    queueLaneLabel: caseSeed.queueLane,
    providerLabel: caseSeed.providerLabel,
    pathwayLabel: caseSeed.pathwayLabel,
    dueLabel: caseSeed.dueLabel,
    summary: caseSeed.queueSummary,
    settlementLabel:
      caseSeed.dispatchTruth.authoritativeProofState === "ready_to_dispatch"
        ? "Settlement ready"
        : caseSeed.dispatchTruth.authoritativeProofState === "proof_pending"
          ? "Settlement pending"
          : "Settlement blocked",
    watchLabel: caseSeed.watchWindowSummary,
    rowTone: tone,
    stockRisk: stockRiskChipForLine(caseSeed.lineItems[0]!, caseSeed),
    indicatorLabels: states.map(labelFromToken),
    blockingLabels: derivePharmacyBlockingReasonCodes(caseSeed),
  };
}

export function resolvePharmacyWorkbenchViewModels(
  snapshot: PharmacyShellSnapshot,
): PharmacyWorkbenchViewModels {
  const caseSeed = snapshot.currentCase;
  const activeLine = snapshot.activeLineItem;
  const states = derivePharmacyOperationsStateRefs(caseSeed);
  const providerHealthState = derivePharmacyProviderHealthState(caseSeed);
  const watchWindowState = derivePharmacyWatchWindowState(caseSeed);
  const stockRiskBand = stockRiskBandForLine(activeLine, caseSeed);
  const settlementState =
    caseSeed.dispatchTruth.authoritativeProofState === "ready_to_dispatch"
      ? "Settlement ready"
      : caseSeed.dispatchTruth.authoritativeProofState === "proof_pending"
        ? "Settlement pending"
        : "Settlement blocked";
  const handoffState =
    caseSeed.dispatchTruth.authoritativeProofState === "ready_to_dispatch"
      ? "Verified handoff"
      : states.includes("provider_outage")
        ? "Outage hold"
        : states.includes("transport_failure")
          ? "Proof contradiction"
          : "Release pending";

  const watchWindow: PharmacyWatchWindowBannerModel | null =
    watchWindowState === "clear"
      ? null
      : {
          tone: toneFromWatchWindowState(watchWindowState),
          title:
            watchWindowState === "blocked"
              ? "Watch window is currently blocking quiet continuation"
              : "Watch window is active around the current line and settlement",
          summary: caseSeed.watchWindowSummary,
          windowLabel: caseSeed.dueLabel,
          recoveryOwnerLabel: derivePharmacyRecoveryOwnerLabel(caseSeed),
          blockerRefs: derivePharmacyBlockingReasonCodes(caseSeed),
        };

  return {
    operationsPanel: {
      visualMode: PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE,
      title: "Pharmacy operations workbench",
      summary:
        "Scan waiting choice, waiting outcome, bounce-backs, stock risk, provider outage, and handoff blockers without losing the active case anchor.",
      statusPill: `${snapshot.queueCases.length} active cases`,
      metrics: operationsMetrics(snapshot.queueCases),
      queueTable: {
        title: "Active pharmacy queue",
        summary:
          "The queue remains dense, keyboard reachable, and clear about blocked release and review debt.",
        selectedCaseId: caseSeed.pharmacyCaseId,
        rows: snapshot.queueCases.map(queueRowForCase),
      },
    },
    caseWorkbench: {
      visualMode: PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE,
      title: caseSeed.patientLabel,
      summary: caseSeed.caseSummary,
      queueLaneLabel: caseSeed.queueLane,
      providerLabel: caseSeed.providerLabel,
      pathwayLabel: caseSeed.pathwayLabel,
      dueLabel: caseSeed.dueLabel,
      postureLabel: labelFromToken(caseSeed.workbenchPosture),
      postureTone: workbenchTone(caseSeed),
      supportRegionLabel: currentSupportRegionLabel(snapshot.location.routeKey),
      watchWindow,
      validationBoard: validationBoardForSnapshot(snapshot),
    },
    inventoryTruthPanel: {
      title: activeLine.medicationLabel,
      summary: caseSeed.inventorySummary,
      freshnessStateLabel: inventoryFreshnessLabel(caseSeed),
      trustStateLabel: inventoryTrustLabel(caseSeed),
      hardStopLabel:
        caseSeed.inventoryPosture === "blocked"
          ? "Current status is read-only: release and substitution remain fenced."
          : "The strongest confirmed stock artifact remains visible until a compare or release action overrides it.",
      records: buildInventoryTruthRecords(snapshot),
    },
    inventoryComparisonWorkspace: {
      title: `${activeLine.medicationLabel} comparison workspace`,
      summary:
        "Comparison, substitution, and partial-supply reasoning stay in one promoted support region bound to the active line item.",
      compareStateLabel:
        stockRiskBand === "low"
          ? "Ready to compare"
          : stockRiskBand === "watch"
            ? "Compare under watch"
            : stockRiskBand === "high"
              ? "Review required"
              : "Blocked compare",
      activeFenceLabel:
        stockRiskBand === "low"
          ? `Fence epoch stable for ${activeLine.lineItemId}`
          : `Fence preserved for ${activeLine.lineItemId}`,
      preservedFenceLabel:
        stockRiskBand === "blocked"
          ? "Read-only fence remains visible while recovery or clarification is active."
          : "Previous compare basis stays visible if the candidate set changes.",
      candidates: comparisonCandidatesForLine(snapshot),
    },
    handoffReadinessBoard: {
      title: "Governed handoff readiness",
      summary:
        "Release remains settlement-aware. Transport, provider, and authoritative proof stay separate until convergence.",
      readinessLabel: handoffState,
      settlementLabel: settlementState,
      continuityLabel:
        snapshot.recoveryPosture === "live"
          ? "Continuity validated"
          : snapshot.recoveryPosture === "read_only"
            ? "Continuity held in read-only status"
            : "Recovery continuity active",
      patientCommunicationLabel:
        providerHealthState === "outage"
          ? "Patient copy held behind outage status"
          : stockRiskBand === "low"
            ? "Preview ready"
            : "Preview still guarded",
      watchWindowLabel: caseSeed.watchWindowSummary,
      proofLanes: handoffProofLanes(snapshot),
      blockingLabels: derivePharmacyBlockingReasonCodes(caseSeed),
    },
    decisionDock: {
      tone: workbenchTone(caseSeed),
      title: caseSeed.dominantActionLabel,
      summary: caseSeed.checkpointQuestion,
      currentLineLabel: activeLine.medicationLabel,
      currentOwnerLabel: derivePharmacyRecoveryOwnerLabel(caseSeed),
      settlementLabel: settlementState,
      continuityLabel:
        snapshot.recoveryPosture === "live"
          ? "Same-case continuity confirmed"
          : snapshot.recoveryPosture === "read_only"
            ? "Continuity preserved in review status"
            : "Recovery-only continuity",
      consequenceTitle: "Action consequence",
      consequenceSummary:
        snapshot.location.routeKey === "inventory"
          ? "The active compare fence and the chosen candidate remain tied to the current line item."
          : snapshot.location.routeKey === "handoff"
            ? "Release status stays pending until authoritative proof, settlement, and continuity all agree."
            : "The active case, selected line, and promoted support region stay pinned while the current action completes.",
      closeBlockers: derivePharmacyBlockingReasonCodes(caseSeed),
      primaryAction: {
        actionId: `${caseSeed.pharmacyCaseId}-primary`,
        label: `Open ${labelFromToken(primaryRouteForCase(caseSeed))}`,
        detail: caseSeed.dominantActionLabel,
        routeTarget: primaryRouteForCase(caseSeed),
        emphasis: "primary",
      },
      secondaryActions: (["validate", "inventory", "handoff", "assurance"] as const)
        .filter((routeTarget) => routeTarget !== primaryRouteForCase(caseSeed))
        .map((routeTarget) => ({
          actionId: `${caseSeed.pharmacyCaseId}-${routeTarget}`,
          label: `Open ${labelFromToken(routeTarget)}`,
          detail: caseSeed.supportSummary,
          routeTarget,
          emphasis: "secondary" as const,
        })),
    },
    stockRiskBand,
    watchWindowState,
    providerHealthState,
    settlementState,
    handoffState,
  };
}
