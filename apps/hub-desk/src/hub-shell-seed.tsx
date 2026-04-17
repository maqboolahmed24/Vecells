import React, { startTransition, useEffect, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  resolveAutomationAnchorProfile,
} from "@vecells/persistent-shell";
import {
  HUB_DEFAULT_PATH,
  createInitialHubShellState,
  navigateHubShell,
  resolveHubShellSnapshot,
  returnFromHubChildRoute,
  selectHubCase,
  selectHubOption,
  setHubExceptionFilter,
  type HubAckState,
  type HubExceptionFilter,
  type HubOptionTruthMode,
  type HubOwnershipState,
  type HubRankedOption,
  type HubShellSnapshot,
  type HubShellState,
} from "./hub-shell-seed.model";

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function truthTone(truthMode: HubOptionTruthMode): string {
  switch (truthMode) {
    case "exclusive_hold":
      return "ready";
    case "truthful_nonexclusive":
      return "watch";
    case "confirmed":
      return "calm";
    case "confirmation_pending":
      return "caution";
    case "callback_only":
      return "fallback";
    case "diagnostic_only":
      return "neutral";
  }
}

function ackTone(ackState: HubAckState): string {
  switch (ackState) {
    case "not_due":
    case "acknowledged":
      return "calm";
    case "awaiting_ack":
      return "watch";
    case "overdue":
      return "critical";
  }
}

function ownershipTone(ownershipState: HubOwnershipState): string {
  switch (ownershipState) {
    case "claimed_active":
      return "ready";
    case "transfer_pending":
      return "watch";
    case "stale_owner_recovery":
      return "critical";
  }
}

function QueueRail(props: {
  snapshot: HubShellSnapshot;
  onSelectCase: (caseId: string) => void;
  onOpenCase: (caseId: string) => void;
}) {
  return (
    <section className="hub-panel hub-panel--queue" aria-label="Hub queue plane">
      <header className="hub-panel__header">
        <div>
          <p className="hub-panel__eyebrow">Queue plane</p>
          <h2>Ranked coordination cases</h2>
        </div>
        <span>{props.snapshot.queueCases.length} live cases</span>
      </header>
      <div className="hub-case-list">
        {props.snapshot.queueCases.map((hubCase) => (
          <article
            key={hubCase.caseId}
            className="hub-case-card"
            data-testid={`hub-case-card-${hubCase.caseId}`}
            data-selected={hubCase.caseId === props.snapshot.currentCase.caseId}
          >
            <button
              type="button"
              className="hub-case-card__select"
              onClick={() => props.onSelectCase(hubCase.caseId)}
            >
              <span className="hub-case-card__rank">#{hubCase.queueRank}</span>
              <span className="hub-case-card__body">
                <strong>{hubCase.patientLabel}</strong>
                <span>{hubCase.queueSummary}</span>
              </span>
            </button>
            <div className="hub-case-card__meta">
              <span className="hub-chip" data-tone={ackTone(hubCase.ackState)}>
                {titleCase(hubCase.ackState)}
              </span>
              <span className="hub-chip" data-tone={ownershipTone(hubCase.ownershipState)}>
                {titleCase(hubCase.ownershipState)}
              </span>
            </div>
            <button
              type="button"
              className="hub-link"
              data-testid={`hub-open-case-${hubCase.caseId}`}
              onClick={() => props.onOpenCase(hubCase.caseId)}
            >
              Open case
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function OptionCard(props: {
  option: HubRankedOption;
  selected: boolean;
  onSelect: () => void;
  automationAttributes: Readonly<Record<string, string>>;
}) {
  return (
    <button
      type="button"
      className="hub-option-card"
      data-testid={`hub-option-${props.option.optionId}`}
      data-selected={props.selected}
      data-truth-mode={props.option.truthMode}
      data-timer-mode={props.option.timerMode}
      data-tone={truthTone(props.option.truthMode)}
      onClick={props.onSelect}
      {...props.automationAttributes}
    >
      <div className="hub-option-card__header">
        <div>
          <p className="hub-option-card__eyebrow">{props.option.laneLabel}</p>
          <h3>{props.option.optionLabel}</h3>
        </div>
        <span className="hub-badge" data-tone={truthTone(props.option.truthMode)}>
          {titleCase(props.option.truthMode)}
        </span>
      </div>
      <ul className="hub-inline-list">
        <li>{props.option.siteLabel}</li>
        <li>{props.option.slotLabel}</li>
        <li>{props.option.modality}</li>
      </ul>
      <p className="hub-option-card__summary">{props.option.patientChoiceSummary}</p>
      <dl className="hub-fact-grid">
        <div>
          <dt>Truth</dt>
          <dd>{props.option.truthSummary}</dd>
        </div>
        <div>
          <dt>Timer</dt>
          <dd>{props.option.timerLabel}</dd>
        </div>
        <div>
          <dt>Fallback</dt>
          <dd>{props.option.fallbackSummary}</dd>
        </div>
        <div>
          <dt>Proof</dt>
          <dd>{props.option.auditRef}</dd>
        </div>
      </dl>
    </button>
  );
}

function CasePulse(props: { snapshot: HubShellSnapshot }) {
  const { currentCase, currentOption } = props.snapshot;
  return (
    <section className="hub-panel hub-panel--casepulse" data-testid="hub-casepulse" aria-label="Hub case pulse">
      <header className="hub-panel__header">
        <div>
          <p className="hub-panel__eyebrow">CasePulse</p>
          <h2>{currentCase.patientLabel}</h2>
        </div>
        <span>{currentCase.lastProgressLabel}</span>
      </header>
      <p className="hub-panel__lead">{currentCase.queueSummary}</p>
      <div className="hub-status-grid">
        <article className="hub-status-card">
          <strong>Current truth</strong>
          <p>{currentCase.truthSummary}</p>
        </article>
        <article className="hub-status-card">
          <strong>Selected option</strong>
          <p>{currentOption.optionLabel}</p>
        </article>
        <article className="hub-status-card">
          <strong>Continuity question</strong>
          <p>{currentCase.continuityQuestion}</p>
        </article>
      </div>
    </section>
  );
}

function QueueOrCaseOptions(props: {
  snapshot: HubShellSnapshot;
  selectedAnchorAttributes: (option: HubRankedOption) => Readonly<Record<string, string>>;
  onSelectOption: (optionId: string) => void;
  onOpenAlternatives: () => void;
  onOpenAudit: () => void;
}) {
  const { currentCase, currentOption, location } = props.snapshot;
  return (
    <section
      className="hub-panel"
      data-testid={location.viewMode === "queue" ? "hub-queue-route" : "hub-case-route"}
      aria-label={location.viewMode === "queue" ? "Queue detail" : "Case detail"}
    >
      <header className="hub-panel__header">
        <div>
          <p className="hub-panel__eyebrow">
            {location.viewMode === "queue" ? "Ranked options" : "Case management"}
          </p>
          <h2>{currentCase.reasonForHubRouting}</h2>
        </div>
        <span>{currentCase.priorityBand}</span>
      </header>
      <div className="hub-detail-grid">
        <article className="hub-detail-card">
          <strong>Origin practice</strong>
          <p>{currentCase.originPractice}</p>
        </article>
        <article className="hub-detail-card">
          <strong>Confirmation state</strong>
          <p>{currentCase.confirmationState}</p>
        </article>
        <article className="hub-detail-card">
          <strong>Acknowledgement</strong>
          <p>{currentCase.ackDueLabel}</p>
        </article>
      </div>
      <div className="hub-option-grid">
        {currentCase.options.map((option) => (
          <OptionCard
            key={option.optionId}
            option={option}
            selected={option.optionId === currentOption.optionId}
            onSelect={() => props.onSelectOption(option.optionId)}
            automationAttributes={props.selectedAnchorAttributes(option)}
          />
        ))}
      </div>
      <div className="hub-actions">
        <button
          type="button"
          className="hub-button"
          data-testid="hub-open-alternatives"
          onClick={props.onOpenAlternatives}
        >
          Open alternatives
        </button>
        <button
          type="button"
          className="hub-button hub-button--ghost"
          data-testid="hub-open-audit"
          onClick={props.onOpenAudit}
        >
          Open audit rail
        </button>
      </div>
    </section>
  );
}

function AlternativesPanel(props: {
  snapshot: HubShellSnapshot;
  selectedAnchorAttributes: (option: HubRankedOption) => Readonly<Record<string, string>>;
  onSelectOption: (optionId: string) => void;
  onReturn: () => void;
}) {
  return (
    <section className="hub-panel" data-testid="hub-alternatives-route" aria-label="Alternative offers">
      <header className="hub-panel__header">
        <div>
          <p className="hub-panel__eyebrow">AlternativeOfferSession</p>
          <h2>Open-choice review stays inside the same shell</h2>
        </div>
        <button
          type="button"
          className="hub-link"
          data-testid="hub-return-button"
          onClick={props.onReturn}
        >
          Return to case
        </button>
      </header>
      <p className="hub-panel__lead">
        Held options may use reserved wording. Nonexclusive options name response windows but never fake countdown
        urgency, and callback remains an explicit fallback rather than a speculative promise.
      </p>
      <div className="hub-option-grid">
        {props.snapshot.currentCase.options.map((option) => (
          <OptionCard
            key={option.optionId}
            option={option}
            selected={option.optionId === props.snapshot.currentOption.optionId}
            onSelect={() => props.onSelectOption(option.optionId)}
            automationAttributes={props.selectedAnchorAttributes(option)}
          />
        ))}
      </div>
    </section>
  );
}

function ExceptionsPanel(props: {
  snapshot: HubShellSnapshot;
  onSetFilter: (filter: HubExceptionFilter) => void;
  onOpenCase: (caseId: string) => void;
}) {
  return (
    <section className="hub-panel" data-testid="hub-exceptions-route" aria-label="Hub exceptions">
      <header className="hub-panel__header">
        <div>
          <p className="hub-panel__eyebrow">Exceptions</p>
          <h2>Blockers stay attached to the active case</h2>
        </div>
        <span>{props.snapshot.exceptionRows.length} visible blockers</span>
      </header>
      <div className="hub-filter-row">
        {(["all", "confirmation_pending", "ack_debt", "fallback"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            className="hub-chip"
            data-testid={`hub-filter-${filter}`}
            data-active={props.snapshot.location.viewMode === "exceptions"}
            onClick={() => props.onSetFilter(filter)}
          >
            {filter === "ack_debt" ? "Ack debt" : titleCase(filter)}
          </button>
        ))}
      </div>
      <table className="hub-table" data-testid="hub-exceptions-table">
        <caption>Confirmation, acknowledgement, and fallback blockers</caption>
        <thead>
          <tr>
            <th scope="col">Case</th>
            <th scope="col">Category</th>
            <th scope="col">Summary</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {props.snapshot.exceptionRows.map((row) => (
            <tr key={`${row.caseId}-${row.category}`} data-severity={row.severity}>
              <td>{row.patientLabel}</td>
              <td>{titleCase(row.category)}</td>
              <td>{row.summary}</td>
              <td>
                <button
                  type="button"
                  className="hub-link"
                  data-testid={`hub-open-exception-case-${row.caseId}`}
                  onClick={() => props.onOpenCase(row.caseId)}
                >
                  {row.nextAction}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AuditPanel(props: { snapshot: HubShellSnapshot; onReturn: () => void }) {
  const { currentCase, currentOption } = props.snapshot;
  return (
    <section className="hub-panel" data-testid="hub-audit-route" aria-label="Audit rail">
      <header className="hub-panel__header">
        <div>
          <p className="hub-panel__eyebrow">Audit rail</p>
          <h2>Proof review is bounded inside the hub shell</h2>
        </div>
        <button
          type="button"
          className="hub-link"
          data-testid="hub-return-button"
          onClick={props.onReturn}
        >
          Return to case
        </button>
      </header>
      <div className="hub-detail-grid">
        <article className="hub-detail-card">
          <strong>Audit summary</strong>
          <p>{currentCase.auditSummary}</p>
        </article>
        <article className="hub-detail-card">
          <strong>Comms summary</strong>
          <p>{currentCase.commsSummary}</p>
        </article>
        <article className="hub-detail-card">
          <strong>Selected proof ref</strong>
          <p>{currentOption.auditRef}</p>
        </article>
      </div>
      <table className="hub-table">
        <caption>Current proof tuple</caption>
        <thead>
          <tr>
            <th scope="col">Facet</th>
            <th scope="col">Current truth</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Selected option</td>
            <td>{currentOption.optionLabel}</td>
          </tr>
          <tr>
            <td>Truth posture</td>
            <td>{currentOption.truthSummary}</td>
          </tr>
          <tr>
            <td>Acknowledgement</td>
            <td>{currentCase.ackDueLabel}</td>
          </tr>
          <tr>
            <td>Fallback</td>
            <td>{currentOption.fallbackSummary}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function HubShellSeedDocument(props: {
  state: HubShellState;
  viewportWidth: number;
  onNavigate: (path: string) => void;
  onSelectCase: (caseId: string) => void;
  onSelectOption: (optionId: string) => void;
  onSetExceptionFilter: (filter: HubExceptionFilter) => void;
  onReturn: () => void;
}) {
  const snapshot = resolveHubShellSnapshot(props.state, props.viewportWidth);
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
    focusRestoreRef: props.state.continuitySnapshot.focusRestoreTargetRef,
    dominantActionRef: `dock.${snapshot.currentCase.caseId}.${snapshot.currentOption.optionId}`,
    artifactModeState: snapshot.artifactModeState,
    recoveryPosture: snapshot.recoveryPosture,
    visualizationAuthority: snapshot.visualizationAuthority,
    routeShellPosture: snapshot.routeShellPosture,
  });

  const selectedAnchorAttributes = (option: HubRankedOption) =>
    selectedAnchorBinding
      ? buildAutomationAnchorElementAttributes(selectedAnchorBinding, {
          instanceKey: option.optionId,
        })
      : {};

  return (
    <div
      className={`hub-shell hub-shell--${snapshot.frameMode}`}
      data-testid="hub-shell-root"
      data-layout-mode={snapshot.frameMode}
      data-current-path={snapshot.location.pathname}
      data-view-mode={snapshot.location.viewMode}
      data-selected-case-id={snapshot.currentCase.caseId}
      data-selected-option-id={snapshot.currentOption.optionId}
      data-option-truth-mode={snapshot.currentOption.truthMode}
      data-timer-mode={snapshot.currentOption.timerMode}
      data-ack-state={snapshot.currentCase.ackState}
      data-route-mutation={snapshot.routeMutationEnabled ? "enabled" : "disabled"}
      data-reduced-motion="respect"
      {...rootAutomationAttributes}
    >
      <header className="hub-shell__masthead" role="banner">
        <div className="hub-shell__brand">
          <VecellLogoLockup
            aria-hidden="true"
            className="hub-insignia"
            style={{ width: 164, height: "auto" }}
          />
          <div>
            <p className="hub-shell__brand-kicker">Queue-first network coordination</p>
            <h1>Hub desk</h1>
          </div>
        </div>
        <nav className="hub-shell__nav" aria-label="Hub shell routes">
          <button
            type="button"
            className="hub-shell__nav-link"
            data-testid="hub-nav-queue"
            data-active={snapshot.location.viewMode === "queue"}
            onClick={() => props.onNavigate("/hub/queue")}
          >
            Queue
          </button>
          <button
            type="button"
            className="hub-shell__nav-link"
            data-testid="hub-nav-exceptions"
            data-active={snapshot.location.viewMode === "exceptions"}
            onClick={() => props.onNavigate("/hub/exceptions")}
          >
            Exceptions
          </button>
          <button
            type="button"
            className="hub-shell__nav-link"
            data-testid="hub-nav-case"
            data-active={snapshot.location.viewMode === "case"}
            onClick={() => props.onNavigate(`/hub/case/${snapshot.currentCase.caseId}`)}
          >
            Active case
          </button>
        </nav>
      </header>

      <section className="hub-status-strip" aria-label="Hub status strip">
        <article className="hub-status-pill" data-tone={truthTone(snapshot.currentOption.truthMode)}>
          <strong>{titleCase(snapshot.currentOption.truthMode)}</strong>
          <span>{snapshot.currentOption.timerLabel}</span>
        </article>
        <article className="hub-status-pill" data-tone={ackTone(snapshot.currentCase.ackState)}>
          <strong>{titleCase(snapshot.currentCase.ackState)}</strong>
          <span>{snapshot.currentCase.ackDueLabel}</span>
        </article>
        <article className="hub-status-pill" data-tone={ownershipTone(snapshot.currentCase.ownershipState)}>
          <strong>{titleCase(snapshot.currentCase.ownershipState)}</strong>
          <span>{snapshot.currentCase.claimedBy}</span>
        </article>
        <article className="hub-status-pill" data-tone="neutral">
          <strong>{titleCase(snapshot.currentCase.fallbackDisposition)}</strong>
          <span>{snapshot.summarySentence}</span>
        </article>
      </section>

      <div className="hub-shell__frame">
        <main className="hub-shell__main" role="main">
          <QueueRail
            snapshot={snapshot}
            onSelectCase={props.onSelectCase}
            onOpenCase={(caseId) => props.onNavigate(`/hub/case/${caseId}`)}
          />
          <CasePulse snapshot={snapshot} />
          {snapshot.location.viewMode === "queue" || snapshot.location.viewMode === "case" ? (
            <QueueOrCaseOptions
              snapshot={snapshot}
              selectedAnchorAttributes={selectedAnchorAttributes}
              onSelectOption={props.onSelectOption}
              onOpenAlternatives={() =>
                props.onNavigate(`/hub/alternatives/${snapshot.currentCase.offerSessionId}`)
              }
              onOpenAudit={() => props.onNavigate(`/hub/audit/${snapshot.currentCase.caseId}`)}
            />
          ) : null}
          {snapshot.location.viewMode === "alternatives" ? (
            <AlternativesPanel
              snapshot={snapshot}
              selectedAnchorAttributes={selectedAnchorAttributes}
              onSelectOption={props.onSelectOption}
              onReturn={props.onReturn}
            />
          ) : null}
          {snapshot.location.viewMode === "exceptions" ? (
            <ExceptionsPanel
              snapshot={snapshot}
              onSetFilter={props.onSetExceptionFilter}
              onOpenCase={(caseId) => props.onNavigate(`/hub/case/${caseId}`)}
            />
          ) : null}
          {snapshot.location.viewMode === "audit" ? (
            <AuditPanel snapshot={snapshot} onReturn={props.onReturn} />
          ) : null}
        </main>

        <aside className="hub-shell__aside" aria-label="Hub decision and proof rail">
          <section
            className="hub-panel hub-panel--dock"
            data-testid="hub-decision-dock"
            {...(dominantActionBinding
              ? buildAutomationAnchorElementAttributes(dominantActionBinding, {
                  instanceKey: snapshot.currentOption.optionId,
                })
              : {})}
          >
            <header className="hub-panel__header">
              <div>
                <p className="hub-panel__eyebrow">DecisionDock</p>
                <h2>{snapshot.currentCase.dominantActionLabel}</h2>
              </div>
              <span className="hub-badge" data-tone={snapshot.decisionDock.actionState}>
                {titleCase(snapshot.decisionDock.actionState)}
              </span>
            </header>
            <p className="hub-panel__lead">{snapshot.currentCase.blockerSummary}</p>
            <dl className="hub-fact-grid">
              <div>
                <dt>Next action</dt>
                <dd>{snapshot.decisionDock.dominantActionLabel}</dd>
              </div>
              <div>
                <dt>Timer truth</dt>
                <dd>{snapshot.decisionDock.timerTruth}</dd>
              </div>
              <div>
                <dt>Fallback law</dt>
                <dd>{snapshot.decisionDock.fallbackSummary}</dd>
              </div>
              <div>
                <dt>Mutation route</dt>
                <dd>{snapshot.routeMutationEnabled ? "Case management only" : "Read-only route"}</dd>
              </div>
            </dl>
          </section>

          <section className="hub-panel">
            <header className="hub-panel__header">
              <div>
                <p className="hub-panel__eyebrow">Practice visibility</p>
                <h3>Origin continuity</h3>
              </div>
            </header>
            <p className="hub-panel__lead">{snapshot.currentCase.commsSummary}</p>
            <ul className="hub-inline-list">
              <li>{snapshot.currentCase.originPractice}</li>
              <li>{snapshot.currentCase.confirmationState}</li>
              <li>{snapshot.currentCase.ackDueLabel}</li>
            </ul>
          </section>

          <section className="hub-panel" aria-label="Telemetry log">
            <header className="hub-panel__header">
              <div>
                <p className="hub-panel__eyebrow">DOM markers and telemetry</p>
                <h3>Recent hub events</h3>
              </div>
              <span>{props.state.telemetry.length} envelopes</span>
            </header>
            <ol className="hub-telemetry-log" data-testid="hub-telemetry-log">
              {props.state.telemetry.slice(-5).reverse().map((envelope) => (
                <li key={envelope.envelopeId}>
                  <strong>{envelope.eventName}</strong>
                  <span>
                    {String(
                      envelope.payload.optionId ??
                        envelope.payload.caseId ??
                        envelope.payload.pathname ??
                        envelope.eventCode,
                    )}
                  </span>
                </li>
              ))}
            </ol>
            {focusRestoreBinding ? (
              <button
                type="button"
                className="hub-link"
                data-testid="hub-focus-restore-marker"
                {...buildAutomationAnchorElementAttributes(focusRestoreBinding, {
                  instanceKey: snapshot.currentCase.caseId,
                })}
              >
                {props.state.continuitySnapshot.focusRestoreTargetRef}
              </button>
            ) : null}
          </section>

          <section className="hub-panel">
            <header className="hub-panel__header">
              <div>
                <p className="hub-panel__eyebrow">Timer and truth matrix</p>
                <h3>Current option law</h3>
              </div>
            </header>
            <table className="hub-table">
              <caption>Selected option truth contract</caption>
              <tbody>
                <tr>
                  <th scope="row">Option</th>
                  <td>{snapshot.currentOption.optionLabel}</td>
                </tr>
                <tr>
                  <th scope="row">Truth mode</th>
                  <td>{titleCase(snapshot.currentOption.truthMode)}</td>
                </tr>
                <tr>
                  <th scope="row">Timer mode</th>
                  <td>{titleCase(snapshot.currentOption.timerMode)}</td>
                </tr>
                <tr>
                  <th scope="row">Reserved copy</th>
                  <td>{snapshot.currentOption.truthMode === "exclusive_hold" ? "Allowed" : "Blocked"}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HubShellSeedApp() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [state, setState] = useState<HubShellState>(() =>
    typeof window === "undefined"
      ? createInitialHubShellState()
      : createInitialHubShellState(window.location.pathname),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!window.location.pathname.startsWith("/hub/")) {
      window.history.replaceState({}, "", HUB_DEFAULT_PATH);
      setState(createInitialHubShellState(HUB_DEFAULT_PATH));
    }

    const handlePopState = () => {
      startTransition(() => {
        setState((current) => navigateHubShell(current, window.location.pathname));
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      Object.assign(window, {
        __hubShellState: {
          pathname: state.location.pathname,
          selectedCaseId: state.selectedCaseId,
          selectedOptionId: state.selectedOptionId,
          telemetryCount: state.telemetry.length,
        },
      });
    }
  }, [state]);

  const updatePath = (nextPath: string, nextState: HubShellState) => {
    if (typeof window !== "undefined" && window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setState(nextState);
  };

  return (
    <HubShellSeedDocument
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={(path) => {
        startTransition(() => {
          const nextState = navigateHubShell(state, path);
          updatePath(path, nextState);
        });
      }}
      onSelectCase={(caseId) => {
        startTransition(() => {
          setState((current) => selectHubCase(current, caseId));
        });
      }}
      onSelectOption={(optionId) => {
        startTransition(() => {
          setState((current) => selectHubOption(current, optionId));
        });
      }}
      onSetExceptionFilter={(filter) => {
        startTransition(() => {
          setState((current) => setHubExceptionFilter(current, filter));
        });
      }}
      onReturn={() => {
        startTransition(() => {
          const nextState = returnFromHubChildRoute(state);
          updatePath(nextState.location.pathname, nextState);
        });
      }}
    />
  );
}

export { HubShellSeedApp, HubShellSeedDocument };
