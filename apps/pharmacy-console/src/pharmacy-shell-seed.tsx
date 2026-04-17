import React, { startTransition, useEffect, useState } from "react";
import { CasePulse, SharedStatusStrip, VecellLogoLockup } from "@vecells/design-system";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  resolveAutomationAnchorProfile,
} from "@vecells/persistent-shell";
import {
  PHARMACY_DEFAULT_PATH,
  PHARMACY_SHELL_TASK_ID,
  PHARMACY_SHELL_VISUAL_MODE,
  createInitialPharmacyShellState,
  navigatePharmacyShell,
  openPharmacyCase,
  openPharmacyChildRoute,
  pharmacyCheckpointAndProofMatrixRows,
  pharmacyRouteContractSeedRows,
  resolvePharmacyShellSnapshot,
  returnFromPharmacyChildRoute,
  selectPharmacyCheckpoint,
  selectPharmacyLineItem,
  type PharmacyCaseSeed,
  type PharmacyChildRouteKey,
  type PharmacyCheckpoint,
  type PharmacyLineItem,
  type PharmacyRouteKey,
  type PharmacyShellSnapshot,
  type PharmacyShellState,
} from "./pharmacy-shell-seed.model";

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function routeLabel(routeKey: PharmacyRouteKey): string {
  switch (routeKey) {
    case "lane":
      return "Queue";
    case "case":
      return "Workbench";
    case "validate":
      return "Validate";
    case "inventory":
      return "Inventory";
    case "resolve":
      return "Resolve";
    case "handoff":
      return "Handoff";
    case "assurance":
      return "Assurance";
  }
}

function queueToneLabel(queueTone: PharmacyCaseSeed["queueTone"]): string {
  switch (queueTone) {
    case "success":
      return "Ready";
    case "watch":
      return "Watch";
    case "caution":
      return "Guarded";
    case "critical":
      return "Critical";
  }
}

function checkpointTone(checkpoint: PharmacyCheckpoint["state"]): string {
  switch (checkpoint) {
    case "satisfied":
      return "ready";
    case "pending":
      return "neutral";
    case "watch":
      return "guarded";
    case "review_required":
      return "review";
    case "blocked":
      return "blocked";
  }
}

function lineItemTone(lineItem: PharmacyLineItem["posture"]): string {
  switch (lineItem) {
    case "ready":
      return "ready";
    case "partial_supply":
      return "guarded";
    case "clarification_required":
      return "review";
    case "manual_review":
      return "review";
    case "blocked":
      return "blocked";
  }
}

function workbenchTone(
  posture: PharmacyCaseSeed["workbenchPosture"],
): "ready" | "guarded" | "read_only" | "reopen" {
  switch (posture) {
    case "ready":
      return "ready";
    case "guarded":
      return "guarded";
    case "read_only":
      return "read_only";
    case "reopen_for_safety":
      return "reopen";
  }
}

function artifactModeForSnapshot(snapshot: PharmacyShellSnapshot): string {
  switch (snapshot.visualizationMode) {
    case "chart_plus_table":
      return "interactive_live";
    case "table_only":
      return "table_only";
    case "summary_only":
      return "summary_only";
  }
}

function visualizationAuthorityForSnapshot(
  snapshot: PharmacyShellSnapshot,
): "visual_table_summary" | "table_only" | "summary_only" {
  switch (snapshot.visualizationMode) {
    case "chart_plus_table":
      return "visual_table_summary";
    case "table_only":
      return "table_only";
    case "summary_only":
      return "summary_only";
  }
}

function primaryRouteForCheckpoint(checkpointId: string): PharmacyChildRouteKey {
  switch (checkpointId) {
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

function proofLaneLabel(
  value: PharmacyCaseSeed["dispatchTruth"]["transportAcceptanceState"],
): string {
  switch (value) {
    case "ready":
      return "Ready";
    case "pending":
      return "Pending";
    case "disputed":
      return "Disputed";
  }
}

function routeSummaryEyebrow(routeKey: PharmacyRouteKey): string {
  switch (routeKey) {
    case "lane":
      return "Queue spine";
    case "case":
      return "Validation board";
    case "validate":
      return "Checkpoint review";
    case "inventory":
      return "Inventory truth";
    case "resolve":
      return "Outcome truth";
    case "handoff":
      return "Dispatch proof";
    case "assurance":
      return "Assurance and reopen";
  }
}

function InventoryVisual({ lineItem }: { lineItem: PharmacyLineItem }) {
  const reservedRatio = Math.min(
    100,
    Math.round((lineItem.reservedUnits / Math.max(lineItem.requestedUnits, 1)) * 100),
  );
  const availableRatio = Math.min(
    100,
    Math.round((lineItem.availableUnits / Math.max(lineItem.requestedUnits, 1)) * 100),
  );
  return (
    <div className="pharmacy-meter-cluster" data-testid="pharmacy-inventory-visual">
      <article className="pharmacy-meter-card">
        <span>Reserved against request</span>
        <strong>{reservedRatio}%</strong>
        <div className="pharmacy-meter">
          <div className="pharmacy-meter__fill" style={{ width: `${reservedRatio}%` }} />
        </div>
      </article>
      <article className="pharmacy-meter-card">
        <span>Available against request</span>
        <strong>{availableRatio}%</strong>
        <div className="pharmacy-meter">
          <div className="pharmacy-meter__fill pharmacy-meter__fill--secondary" style={{ width: `${availableRatio}%` }} />
        </div>
      </article>
    </div>
  );
}

function ChildRoutePanel(props: {
  snapshot: PharmacyShellSnapshot;
  state: PharmacyShellState;
  onReturn: () => void;
}) {
  const { snapshot } = props;
  const currentCase = snapshot.currentCase;
  const returnToken = props.state.returnToken;

  if (snapshot.location.routeKey === "inventory") {
    return (
      <section
        className="pharmacy-support-card"
        data-testid="pharmacy-inventory-route"
        data-parity-mode={snapshot.visualizationMode}
        aria-label="Inventory review"
      >
        <header className="pharmacy-support-card__header">
          <div>
            <p className="pharmacy-shell__eyebrow">Inventory truth</p>
            <h3>{currentCase.inventorySummary}</h3>
          </div>
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-return-button"
            onClick={props.onReturn}
          >
            Return via {returnToken?.returnTokenId ?? "PRT"}
          </button>
        </header>
        <p className="pharmacy-support-card__summary">{snapshot.activeLineItem.summary}</p>
        {snapshot.visualizationMode === "summary_only" ? (
          <div className="pharmacy-placeholder">
            <strong>Summary-only inventory posture</strong>
            <span>The shell keeps the strongest confirmed stock explanation visible while richer compare visuals stay frozen.</span>
          </div>
        ) : snapshot.visualizationMode === "table_only" ? (
          <div className="pharmacy-placeholder">
            <strong>Table-first inventory review</strong>
            <span>Freshness has degraded, so release stays guarded and the board falls back to explicit line-item facts.</span>
          </div>
        ) : (
          <InventoryVisual lineItem={snapshot.activeLineItem} />
        )}
        <table className="pharmacy-table">
          <caption>Inventory comparison fallback</caption>
          <thead>
            <tr>
              <th scope="col">Line item</th>
              <th scope="col">Requested</th>
              <th scope="col">Reserved</th>
              <th scope="col">Available</th>
              <th scope="col">Posture</th>
            </tr>
          </thead>
          <tbody>
            {currentCase.lineItems.map((lineItem) => (
              <tr key={lineItem.lineItemId} data-selected={lineItem.lineItemId === snapshot.activeLineItem.lineItemId}>
                <td>{lineItem.medicationLabel}</td>
                <td>{lineItem.requestedUnits}</td>
                <td>{lineItem.reservedUnits}</td>
                <td>{lineItem.availableUnits}</td>
                <td>{titleCase(lineItem.posture)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }

  if (snapshot.location.routeKey === "validate") {
    return (
      <section className="pharmacy-support-card" data-testid="pharmacy-validate-route" aria-label="Checkpoint review">
        <header className="pharmacy-support-card__header">
          <div>
            <p className="pharmacy-shell__eyebrow">Checkpoint review</p>
            <h3>{snapshot.activeCheckpoint.label}</h3>
          </div>
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-return-button"
            onClick={props.onReturn}
          >
            Return via {returnToken?.returnTokenId ?? "PRT"}
          </button>
        </header>
        <p className="pharmacy-support-card__summary">{currentCase.checkpointQuestion}</p>
        <dl className="pharmacy-definition-list">
          <div>
            <dt>Evidence basis</dt>
            <dd>{snapshot.activeCheckpoint.evidenceLabel}</dd>
          </div>
          <div>
            <dt>Current state</dt>
            <dd>{titleCase(snapshot.activeCheckpoint.state)}</dd>
          </div>
          <div>
            <dt>Watch window</dt>
            <dd>{currentCase.watchWindowSummary}</dd>
          </div>
          <div>
            <dt>Support region</dt>
            <dd>{currentCase.supportSummary}</dd>
          </div>
        </dl>
      </section>
    );
  }

  if (snapshot.location.routeKey === "resolve") {
    return (
      <section className="pharmacy-support-card" data-testid="pharmacy-resolve-route" aria-label="Outcome resolution">
        <header className="pharmacy-support-card__header">
          <div>
            <p className="pharmacy-shell__eyebrow">Outcome truth</p>
            <h3>{currentCase.outcomeTruth.summary}</h3>
          </div>
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-return-button"
            onClick={props.onReturn}
          >
            Return via {returnToken?.returnTokenId ?? "PRT"}
          </button>
        </header>
        <div className="pharmacy-signal-grid">
          <article className="pharmacy-signal-card" data-tone="review">
            <span>Outcome truth</span>
            <strong>{titleCase(currentCase.outcomeTruth.outcomeTruthState)}</strong>
            <p>{currentCase.outcomeTruth.summary}</p>
          </article>
          <article className="pharmacy-signal-card" data-tone="guarded">
            <span>Confidence</span>
            <strong>{currentCase.outcomeTruth.matchConfidenceLabel}</strong>
            <p>Weak match and manual-review debt stay explicit instead of tinting the shell as quietly resolved.</p>
          </article>
          <article className="pharmacy-signal-card" data-tone="review">
            <span>Manual review</span>
            <strong>{titleCase(currentCase.outcomeTruth.manualReviewState)}</strong>
            <p>{currentCase.reopenSummary}</p>
          </article>
        </div>
      </section>
    );
  }

  if (snapshot.location.routeKey === "handoff") {
    return (
      <section className="pharmacy-support-card" data-testid="pharmacy-handoff-route" aria-label="Dispatch proof">
        <header className="pharmacy-support-card__header">
          <div>
            <p className="pharmacy-shell__eyebrow">Dispatch proof</p>
            <h3>{currentCase.dispatchTruth.summary}</h3>
          </div>
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-return-button"
            onClick={props.onReturn}
          >
            Return via {returnToken?.returnTokenId ?? "PRT"}
          </button>
        </header>
        <div className="pharmacy-signal-grid">
          <article className="pharmacy-signal-card" data-tone={currentCase.dispatchTruth.transportAcceptanceState === "disputed" ? "blocked" : "guarded"}>
            <span>Transport acceptance</span>
            <strong>{proofLaneLabel(currentCase.dispatchTruth.transportAcceptanceState)}</strong>
            <p>Transport receipts widen pending copy but may not promote release on their own.</p>
          </article>
          <article className="pharmacy-signal-card" data-tone={currentCase.dispatchTruth.providerAcceptanceState === "disputed" ? "blocked" : "guarded"}>
            <span>Provider acceptance</span>
            <strong>{proofLaneLabel(currentCase.dispatchTruth.providerAcceptanceState)}</strong>
            <p>Provider acknowledgement remains distinct from authoritative dispatch proof.</p>
          </article>
          <article className="pharmacy-signal-card" data-tone={currentCase.dispatchTruth.authoritativeProofState === "ready_to_dispatch" ? "ready" : currentCase.dispatchTruth.authoritativeProofState === "proof_pending" ? "guarded" : "blocked"}>
            <span>Authoritative proof</span>
            <strong>{titleCase(currentCase.dispatchTruth.authoritativeProofState)}</strong>
            <p>{currentCase.proofSummary}</p>
          </article>
        </div>
      </section>
    );
  }

  if (snapshot.location.routeKey === "assurance") {
    return (
      <section className="pharmacy-support-card" data-testid="pharmacy-assurance-route" aria-label="Assurance and reopen">
        <header className="pharmacy-support-card__header">
          <div>
            <p className="pharmacy-shell__eyebrow">Reopen and assurance</p>
            <h3>{currentCase.reopenSummary}</h3>
          </div>
          <button
            type="button"
            className="pharmacy-link"
            data-testid="pharmacy-return-button"
            onClick={props.onReturn}
          >
            Return via {returnToken?.returnTokenId ?? "PRT"}
          </button>
        </header>
        <div className="pharmacy-assurance-grid">
          <article className="pharmacy-signal-card" data-tone="blocked">
            <span>Watch window</span>
            <strong>{currentCase.watchWindowSummary}</strong>
            <p>Late handoff or return signals reopen the same shell rather than creating an unbound follow-up page.</p>
          </article>
          <article className="pharmacy-signal-card" data-tone="review">
            <span>Outcome posture</span>
            <strong>{titleCase(currentCase.outcomeTruth.outcomeTruthState)}</strong>
            <p>{currentCase.outcomeTruth.summary}</p>
          </article>
          <article className="pharmacy-signal-card" data-tone="review">
            <span>Recovery consequence</span>
            <strong>{titleCase(currentCase.workbenchPosture)}</strong>
            <p>{currentCase.supportSummary}</p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="pharmacy-support-card" data-testid="pharmacy-workbench-summary" aria-label="Validation board summary">
      <header className="pharmacy-support-card__header">
        <div>
          <p className="pharmacy-shell__eyebrow">Validation board</p>
          <h3>{currentCase.queueSummary}</h3>
        </div>
        <span className="pharmacy-pill" data-tone={workbenchTone(currentCase.workbenchPosture)}>
          {titleCase(currentCase.workbenchPosture)}
        </span>
      </header>
      <p className="pharmacy-support-card__summary">{snapshot.summarySentence}</p>
      <dl className="pharmacy-definition-list">
        <div>
          <dt>Dominant question</dt>
          <dd>{currentCase.checkpointQuestion}</dd>
        </div>
        <div>
          <dt>Decision posture</dt>
          <dd>{currentCase.dominantActionLabel}</dd>
        </div>
        <div>
          <dt>Inventory truth</dt>
          <dd>{currentCase.inventorySummary}</dd>
        </div>
        <div>
          <dt>Return safety</dt>
          <dd>Child routes preserve the same case, checkpoint, and line-item continuity frame.</dd>
        </div>
      </dl>
    </section>
  );
}

export function PharmacyShellSeedDocument(props: {
  state: PharmacyShellState;
  viewportWidth: number;
  onNavigate: (path: string) => void;
  onOpenCase: (pharmacyCaseId: string) => void;
  onSelectCheckpoint: (checkpointId: string) => void;
  onSelectLineItem: (lineItemId: string) => void;
  onOpenChildRoute: (routeKey: PharmacyChildRouteKey) => void;
  onReturn: () => void;
}) {
  const snapshot = resolvePharmacyShellSnapshot(props.state, props.viewportWidth);
  const automationProfile = resolveAutomationAnchorProfile(props.state.location.routeFamilyRef);
  const selectedAnchorBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "selected_anchor",
  );
  const dominantActionBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "dominant_action",
  );
  const focusRestoreBinding = automationProfile.markerBindings.find(
    (binding) => binding.markerClass === "focus_restore",
  );
  const rootAutomationAttributes = buildAutomationSurfaceAttributes(automationProfile, {
    selectedAnchorRef: props.state.continuitySnapshot.selectedAnchor.anchorId,
    focusRestoreRef: props.state.activeLineItemId,
    dominantActionRef: dominantActionBinding?.markerRef ?? snapshot.currentCase.pharmacyCaseId,
    artifactModeState: artifactModeForSnapshot(snapshot),
    recoveryPosture: snapshot.recoveryPosture,
    visualizationAuthority: visualizationAuthorityForSnapshot(snapshot),
    routeShellPosture: snapshot.routeShellPosture,
  });
  const primaryRoute = primaryRouteForCheckpoint(snapshot.activeCheckpoint.checkpointId);

  return (
    <div
      className={`pharmacy-shell pharmacy-shell--${snapshot.layoutMode}`}
      data-testid="pharmacy-shell-root"
      data-task-id={PHARMACY_SHELL_TASK_ID}
      data-visual-mode={PHARMACY_SHELL_VISUAL_MODE}
      data-current-path={snapshot.location.pathname}
      data-layout-mode={snapshot.layoutMode}
      data-route-key={snapshot.location.routeKey}
      data-visualization-mode={snapshot.visualizationMode}
      data-selected-case-id={snapshot.currentCase.pharmacyCaseId}
      data-selected-checkpoint-id={snapshot.activeCheckpoint.checkpointId}
      data-selected-line-item-id={snapshot.activeLineItem.lineItemId}
      data-recovery-posture={snapshot.recoveryPosture}
      data-route-shell-posture={snapshot.routeShellPosture}
      data-reduced-motion="respect"
      {...rootAutomationAttributes}
    >
      <header className="pharmacy-shell__masthead" role="banner">
        <div className="pharmacy-shell__brand">
          <VecellLogoLockup
            aria-hidden="true"
            className="pharmacy-insignia"
            style={{ width: 166, height: "auto" }}
          />
          <div>
            <p className="pharmacy-shell__eyebrow">vecell pharmacy shell seed</p>
            <h1>Checkpoint-driven pharmacy console</h1>
            <p>
              One case, one checkpoint, one dominant action, one promoted support region.
              Same-shell validation, inventory, handoff, and reopen posture stay causally honest.
            </p>
          </div>
        </div>
        <div className="pharmacy-shell__masthead-meta">
          <span className="pharmacy-pill" data-tone={queueToneLabel(snapshot.currentCase.queueTone).toLowerCase()}>
            {snapshot.currentCase.queueLane}
          </span>
          <span className="pharmacy-pill" data-tone={workbenchTone(snapshot.currentCase.workbenchPosture)}>
            {titleCase(snapshot.currentCase.workbenchPosture)}
          </span>
          <span className="pharmacy-pill" data-tone={snapshot.visualizationMode === "chart_plus_table" ? "ready" : snapshot.visualizationMode === "table_only" ? "guarded" : "blocked"}>
            {titleCase(snapshot.visualizationMode)}
          </span>
        </div>
      </header>

      <SharedStatusStrip input={snapshot.statusInput} />
      <CasePulse pulse={snapshot.casePulse} />

      <section className="pharmacy-shell__layout">
        <aside className="pharmacy-shell__queue" aria-label="Pharmacy queue spine">
          <header className="pharmacy-panel__header">
            <div>
              <p className="pharmacy-shell__eyebrow">Queue spine</p>
              <h2>Anchored case lanes</h2>
            </div>
            <button
              type="button"
              className="pharmacy-link"
              data-testid="pharmacy-route-button-lane"
              onClick={() => props.onNavigate(PHARMACY_DEFAULT_PATH)}
            >
              View queue root
            </button>
          </header>
          <ol className="pharmacy-queue-list">
            {snapshot.queueCases.map((caseSeed) => (
              <li key={caseSeed.pharmacyCaseId}>
                <button
                  type="button"
                  className="pharmacy-queue-row"
                  data-testid={`pharmacy-case-${caseSeed.pharmacyCaseId}`}
                  data-selected={caseSeed.pharmacyCaseId === snapshot.currentCase.pharmacyCaseId}
                  data-tone={caseSeed.queueTone}
                  onClick={() => props.onOpenCase(caseSeed.pharmacyCaseId)}
                  {...(selectedAnchorBinding && caseSeed.pharmacyCaseId === snapshot.currentCase.pharmacyCaseId
                    ? buildAutomationAnchorElementAttributes(selectedAnchorBinding, {
                        instanceKey: caseSeed.pharmacyCaseId,
                      })
                    : {})}
                >
                  <div className="pharmacy-queue-row__header">
                    <strong>{caseSeed.patientLabel}</strong>
                    <span>{caseSeed.dueLabel}</span>
                  </div>
                  <div className="pharmacy-queue-row__meta">
                    <span>{caseSeed.queueLane}</span>
                    <span>{caseSeed.providerLabel}</span>
                  </div>
                  <p>{caseSeed.queueSummary}</p>
                  <div className="pharmacy-chip-row">
                    <span className="pharmacy-chip">{queueToneLabel(caseSeed.queueTone)}</span>
                    <span className="pharmacy-chip">{titleCase(caseSeed.proofState)}</span>
                    <span className="pharmacy-chip">{titleCase(caseSeed.inventoryPosture)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <main className="pharmacy-shell__main" role="main">
          <section className="pharmacy-board-hero" aria-label="Validation board">
            <div className="pharmacy-board-hero__copy">
              <p className="pharmacy-shell__eyebrow">{routeSummaryEyebrow(snapshot.location.routeKey)}</p>
              <h2>{snapshot.currentCase.caseSummary}</h2>
              <p>{snapshot.summarySentence}</p>
            </div>
            <div className="pharmacy-chip-row pharmacy-chip-row--meta">
              <span className="pharmacy-chip">{snapshot.currentCase.providerLabel}</span>
              <span className="pharmacy-chip">{snapshot.currentCase.pathwayLabel}</span>
              <span className="pharmacy-chip">{snapshot.currentCase.dueLabel}</span>
            </div>
            <nav className="pharmacy-route-nav" aria-label="Pharmacy route posture toggles">
              <button
                type="button"
                className="pharmacy-route-nav__button"
                data-active={snapshot.location.routeKey === "case"}
                data-testid="pharmacy-route-button-case"
                onClick={() => props.onOpenCase(snapshot.currentCase.pharmacyCaseId)}
              >
                Workbench
              </button>
              {(["validate", "inventory", "resolve", "handoff", "assurance"] as const).map((routeKey) => (
                <button
                  key={routeKey}
                  type="button"
                  className="pharmacy-route-nav__button"
                  data-active={snapshot.location.routeKey === routeKey}
                  data-testid={`pharmacy-route-button-${routeKey}`}
                  onClick={() => props.onOpenChildRoute(routeKey)}
                >
                  {routeLabel(routeKey)}
                </button>
              ))}
            </nav>
          </section>

          <section className="pharmacy-board-grid">
            <section className="pharmacy-checkpoint-rail" aria-label="Checkpoint rail">
              <header className="pharmacy-panel__header">
                <div>
                  <p className="pharmacy-shell__eyebrow">Checkpoint rail</p>
                  <h3>Safety and consequence remain visible</h3>
                </div>
              </header>
              <ol className="pharmacy-checkpoint-list">
                {snapshot.currentCase.checkpoints.map((checkpoint) => (
                  <li key={checkpoint.checkpointId}>
                    <button
                      type="button"
                      className="pharmacy-checkpoint"
                      data-testid={`pharmacy-checkpoint-${checkpoint.checkpointId}`}
                      data-selected={checkpoint.checkpointId === snapshot.activeCheckpoint.checkpointId}
                      data-tone={checkpointTone(checkpoint.state)}
                      onClick={() => props.onSelectCheckpoint(checkpoint.checkpointId)}
                    >
                      <div>
                        <strong>{checkpoint.label}</strong>
                        <p>{checkpoint.summary}</p>
                      </div>
                      <span>{checkpoint.evidenceLabel}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>

            <section className="pharmacy-line-stage" aria-label="Line item stage">
              <header className="pharmacy-panel__header">
                <div>
                  <p className="pharmacy-shell__eyebrow">Active line item</p>
                  <h3>{snapshot.activeLineItem.medicationLabel}</h3>
                </div>
                <span className="pharmacy-pill" data-tone={lineItemTone(snapshot.activeLineItem.posture)}>
                  {titleCase(snapshot.activeLineItem.posture)}
                </span>
              </header>
              <article className="pharmacy-line-card" data-testid="pharmacy-active-line-item">
                <div className="pharmacy-line-card__header">
                  <div>
                    <h4>{snapshot.activeLineItem.instructionLabel}</h4>
                    <p>{snapshot.activeLineItem.summary}</p>
                  </div>
                  <div className="pharmacy-line-card__metrics">
                    <span>Requested {snapshot.activeLineItem.requestedUnits}</span>
                    <span>Reserved {snapshot.activeLineItem.reservedUnits}</span>
                    <span>Available {snapshot.activeLineItem.availableUnits}</span>
                  </div>
                </div>
                <div className="pharmacy-line-card__meter">
                  <div
                    className="pharmacy-line-card__meter-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (snapshot.activeLineItem.reservedUnits /
                            Math.max(snapshot.activeLineItem.requestedUnits, 1)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
                <p className="pharmacy-line-card__reconciliation">{snapshot.activeLineItem.reconciliationLabel}</p>
              </article>
              <div className="pharmacy-line-stack" aria-label="Line item stack">
                {snapshot.currentCase.lineItems.map((lineItem) => (
                  <button
                    key={lineItem.lineItemId}
                    type="button"
                    className="pharmacy-line-stack__row"
                    data-testid={`pharmacy-line-item-${lineItem.lineItemId}`}
                    data-selected={lineItem.lineItemId === snapshot.activeLineItem.lineItemId}
                    data-tone={lineItemTone(lineItem.posture)}
                    onClick={() => props.onSelectLineItem(lineItem.lineItemId)}
                  >
                    <div>
                      <strong>{lineItem.medicationLabel}</strong>
                      <p>{lineItem.summary}</p>
                    </div>
                    <span>{lineItem.reservedUnits}/{lineItem.requestedUnits}</span>
                  </button>
                ))}
              </div>
              <ChildRoutePanel snapshot={snapshot} state={props.state} onReturn={props.onReturn} />
            </section>
          </section>
        </main>

        <aside className="pharmacy-shell__decision" aria-label="Decision dock">
          <section
            className="pharmacy-decision-dock"
            data-testid="pharmacy-decision-dock"
            data-tone={workbenchTone(snapshot.currentCase.workbenchPosture)}
            {...(dominantActionBinding
              ? buildAutomationAnchorElementAttributes(dominantActionBinding, {
                  instanceKey: snapshot.currentCase.pharmacyCaseId,
                })
              : {})}
          >
            <header className="pharmacy-panel__header">
              <div>
                <p className="pharmacy-shell__eyebrow">DecisionDock</p>
                <h2>{snapshot.currentCase.dominantActionLabel}</h2>
              </div>
              <span className="pharmacy-pill" data-tone={workbenchTone(snapshot.currentCase.workbenchPosture)}>
                {titleCase(snapshot.currentCase.workbenchPosture)}
              </span>
            </header>
            <p className="pharmacy-decision-dock__summary">{snapshot.currentCase.checkpointQuestion}</p>
            <ul className="pharmacy-inline-list">
              <li>{snapshot.currentCase.watchWindowSummary}</li>
              <li>{snapshot.currentCase.proofSummary}</li>
              <li>{snapshot.currentCase.consentSummary}</li>
            </ul>
            <button
              type="button"
              className="pharmacy-button"
              data-testid="pharmacy-primary-route-button"
              data-route-target={primaryRoute}
              onClick={() => props.onOpenChildRoute(primaryRoute)}
            >
              Open {routeLabel(primaryRoute)}
            </button>
            <div className="pharmacy-action-grid">
              {(["validate", "inventory", "resolve", "handoff", "assurance"] as const).map((routeKey) => (
                <button
                  key={routeKey}
                  type="button"
                  className="pharmacy-button pharmacy-button--ghost"
                  data-testid={`pharmacy-dock-button-${routeKey}`}
                  onClick={() => props.onOpenChildRoute(routeKey)}
                >
                  {routeLabel(routeKey)}
                </button>
              ))}
            </div>
          </section>

          <section className="pharmacy-panel">
            <header className="pharmacy-panel__header">
              <div>
                <p className="pharmacy-shell__eyebrow">Telemetry log</p>
                <h3>Recent shell-truth events</h3>
              </div>
              <span>{props.state.telemetry.length} envelopes</span>
            </header>
            <ol className="pharmacy-telemetry-log" data-testid="pharmacy-telemetry-log">
              {props.state.telemetry.slice(-5).reverse().map((envelope) => (
                <li key={envelope.envelopeId}>
                  <strong>{envelope.eventName}</strong>
                  <span>
                    {String(
                      envelope.payload.pathname ??
                        envelope.payload.proofState ??
                        envelope.payload.checkpointId ??
                        envelope.eventCode,
                    )}
                  </span>
                </li>
              ))}
            </ol>
            {focusRestoreBinding ? (
              <button
                type="button"
                className="pharmacy-link"
                data-testid="pharmacy-focus-restore-marker"
                {...buildAutomationAnchorElementAttributes(focusRestoreBinding, {
                  instanceKey: snapshot.activeLineItem.lineItemId,
                })}
              >
                {props.state.continuitySnapshot.focusRestoreTargetRef}
              </button>
            ) : null}
          </section>

          <section className="pharmacy-panel">
            <header className="pharmacy-panel__header">
              <div>
                <p className="pharmacy-shell__eyebrow">Truth matrix</p>
                <h3>Checkpoint, proof, and outcome posture</h3>
              </div>
            </header>
            <table className="pharmacy-table">
              <caption>Checkpoint and proof matrix</caption>
              <thead>
                <tr>
                  <th scope="col">Case</th>
                  <th scope="col">Consent</th>
                  <th scope="col">Proof</th>
                  <th scope="col">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyCheckpointAndProofMatrixRows.map((row) => (
                  <tr key={row.pharmacyCaseId} data-selected={row.pharmacyCaseId === snapshot.currentCase.pharmacyCaseId}>
                    <td>{row.pharmacyCaseId}</td>
                    <td>{titleCase(row.consentState)}</td>
                    <td>{titleCase(row.proofState)}</td>
                    <td>{titleCase(row.outcomeTruthState)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="pharmacy-panel">
            <header className="pharmacy-panel__header">
              <div>
                <p className="pharmacy-shell__eyebrow">Route contract</p>
                <h3>Same-shell route law</h3>
              </div>
            </header>
            <ul className="pharmacy-route-contract-list">
              {pharmacyRouteContractSeedRows.map((row) => (
                <li key={row.path}>
                  <strong>{row.path}</strong>
                  <span>{row.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}

export function PharmacyShellSeedApp() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [state, setState] = useState<PharmacyShellState>(() =>
    typeof window === "undefined"
      ? createInitialPharmacyShellState()
      : createInitialPharmacyShellState(window.location.pathname),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!window.location.pathname.startsWith("/workspace/pharmacy")) {
      window.history.replaceState({}, "", PHARMACY_DEFAULT_PATH);
      setState(createInitialPharmacyShellState(PHARMACY_DEFAULT_PATH));
    }

    const handlePopState = () => {
      startTransition(() => {
        setState((current) => navigatePharmacyShell(current, window.location.pathname));
      });
    };
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function commit(nextState: PharmacyShellState, mode: "push" | "replace" = "push") {
    if (typeof window !== "undefined") {
      const method = mode === "replace" ? "replaceState" : "pushState";
      window.history[method]({}, "", nextState.location.pathname);
    }
    setState(nextState);
  }

  function navigate(path: string) {
    startTransition(() => {
      setState((current) => {
        const nextState = navigatePharmacyShell(current, path);
        if (typeof window !== "undefined") {
          window.history.pushState({}, "", nextState.location.pathname);
        }
        return nextState;
      });
    });
  }

  function handleOpenCase(pharmacyCaseId: string) {
    startTransition(() => {
      setState((current) => {
        const nextState = openPharmacyCase(current, pharmacyCaseId);
        if (typeof window !== "undefined") {
          window.history.pushState({}, "", nextState.location.pathname);
        }
        return nextState;
      });
    });
  }

  function handleSelectCheckpoint(checkpointId: string) {
    startTransition(() => {
      setState((current) => selectPharmacyCheckpoint(current, checkpointId));
    });
  }

  function handleSelectLineItem(lineItemId: string) {
    startTransition(() => {
      setState((current) => selectPharmacyLineItem(current, lineItemId));
    });
  }

  function handleOpenChildRoute(routeKey: PharmacyChildRouteKey) {
    startTransition(() => {
      setState((current) => {
        const nextState = openPharmacyChildRoute(current, routeKey);
        if (typeof window !== "undefined") {
          window.history.pushState({}, "", nextState.location.pathname);
        }
        return nextState;
      });
    });
  }

  function handleReturn() {
    startTransition(() => {
      setState((current) => {
        const nextState = returnFromPharmacyChildRoute(current);
        if (typeof window !== "undefined") {
          window.history.pushState({}, "", nextState.location.pathname);
        }
        return nextState;
      });
    });
  }

  return (
    <PharmacyShellSeedDocument
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={navigate}
      onOpenCase={handleOpenCase}
      onSelectCheckpoint={handleSelectCheckpoint}
      onSelectLineItem={handleSelectLineItem}
      onOpenChildRoute={handleOpenChildRoute}
      onReturn={handleReturn}
    />
  );
}

export default PharmacyShellSeedApp;
