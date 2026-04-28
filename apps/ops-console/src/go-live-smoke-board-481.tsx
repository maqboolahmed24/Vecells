import { useEffect, useMemo, useRef, useState } from "react";
import {
  createGoLiveSmoke481Projection,
  normalizeGoLiveSmoke481ScenarioState,
  type GoLiveSmoke481Projection,
  type GoLiveSmoke481ScenarioState,
} from "./go-live-smoke-board-481.model";

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function stateTone(state: string): string {
  if (state.includes("blocked")) return "blocked";
  if (state.includes("constrained") || state.includes("pending") || state.includes("queued")) {
    return "constrained";
  }
  return "passed";
}

function projectionFromLocation(): GoLiveSmoke481Projection {
  const params = new URLSearchParams(window.location.search);
  return createGoLiveSmoke481Projection({
    scenarioState: normalizeGoLiveSmoke481ScenarioState(
      params.get("smokeState") ?? params.get("state"),
    ),
    mobileEmbeddedState: params.get("mobileEmbeddedState"),
  });
}

function GoLiveSmokeLane(props: {
  readonly title: string;
  readonly lane: GoLiveSmoke481Projection["probes"][number]["lane"];
  readonly projection: GoLiveSmoke481Projection;
}) {
  const probes = props.projection.probes.filter((probe) => probe.lane === props.lane);
  return (
    <section
      className="go-live-481-lane"
      aria-label={props.title}
      data-testid={`go-live-481-lane-${props.lane}`}
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Probe lane</p>
          <h3>{props.title}</h3>
        </div>
        <span
          data-tone={stateTone(
            probes.some((probe) => probe.state === "blocked") ? "blocked" : "passed",
          )}
        >
          {probes.filter((probe) => probe.state === "passed").length}/{probes.length}
        </span>
      </header>
      <ol>
        {probes.map((probe) => (
          <li key={probe.probeId} data-probe-state={probe.state}>
            <strong>{probe.label}</strong>
            <span>{titleCase(probe.state)}</span>
            <small>{probe.evidenceHash}</small>
            <em>{titleCase(probe.communicationState)}</em>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GoLiveSmokeTimeline(props: { readonly projection: GoLiveSmoke481Projection }) {
  return (
    <section
      className="go-live-481-timeline"
      aria-label="Restore and failover timeline"
      data-testid="go-live-481-timeline"
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Restore and failover</p>
          <h3>Timeline</h3>
        </div>
        <span>Reduced motion preserves order</span>
      </header>
      <ol aria-label="Timeline diagram">
        {props.projection.timeline.map((step) => (
          <li key={step.stepId} data-step-status={step.status}>
            <span>{step.order}</span>
            <strong>{step.label}</strong>
            <small>{titleCase(step.status)}</small>
          </li>
        ))}
      </ol>
      <div className="go-live-481-table-fallback" data-testid="go-live-481-timeline-table">
        <table className="ops-table">
          <caption>Restore and failover timeline fallback</caption>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Step</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {props.projection.timeline.map((step) => (
              <tr key={step.stepId}>
                <td>{step.order}</td>
                <td>{step.label}</td>
                <td>{titleCase(step.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GoLiveSmokeBlockerRail(props: { readonly projection: GoLiveSmoke481Projection }) {
  return (
    <aside
      className="go-live-481-rail"
      aria-label="Blocked essential functions"
      data-testid="go-live-481-blocker-rail"
    >
      <header>
        <p className="ops-panel__eyebrow">Blocked functions</p>
        <h3>Manual fallback actions</h3>
      </header>
      {props.projection.blockers.length === 0 ? (
        <p>No launch blockers for the approved Wave 1 smoke scope.</p>
      ) : (
        <ul>
          {props.projection.blockers.map((blocker) => (
            <li key={blocker.blockerRef}>
              <strong>{blocker.label}</strong>
              <span>{blocker.fallbackAction}</span>
              <small>{blocker.blockerRef}</small>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export function GoLiveSmokeBoard481() {
  const [projection, setProjection] = useState<GoLiveSmoke481Projection>(() =>
    typeof window === "undefined" ? createGoLiveSmoke481Projection() : projectionFromLocation(),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const motionPolicy = useMemo(() => "reduced-motion-preserves-status-order", []);

  useEffect(() => {
    if (!dialogOpen) return;
    cancelRef.current?.focus();
  }, [dialogOpen]);

  function setScenarioState(scenarioState: GoLiveSmoke481ScenarioState) {
    setProjection(createGoLiveSmoke481Projection({ scenarioState }));
  }

  function closeDialog() {
    setDialogOpen(false);
    window.setTimeout(() => actionRef.current?.focus(), 0);
  }

  return (
    <main
      className="go-live-481-board"
      data-testid="go-live-smoke-481-board"
      data-smoke-verdict={projection.smokeVerdict}
      data-recovery-posture={projection.recoveryPosture}
      data-destructive-rehearsal-allowed={String(projection.destructiveRehearsalAllowed)}
      data-rollback-assistive-insert-visible={String(projection.rollbackAssistiveInsertVisible)}
      data-mobile-embedded-state={projection.mobileEmbeddedState}
      data-motion-policy={motionPolicy}
    >
      <header className="go-live-481-board__header">
        <div>
          <p className="ops-panel__eyebrow">Task 481</p>
          <h1>Go-Live Smoke Board</h1>
        </div>
        <div className="go-live-481-state-switch" aria-label="Go-live smoke state">
          {(["green", "constrained", "blocked", "rollback_smoke"] as const).map((scenarioState) => (
            <button
              key={scenarioState}
              type="button"
              className="ops-chip"
              data-active={projection.scenarioState === scenarioState}
              data-testid={`go-live-481-state-${scenarioState}`}
              onClick={() => setScenarioState(scenarioState)}
            >
              {titleCase(scenarioState)}
            </button>
          ))}
        </div>
      </header>

      <section
        className="go-live-481-strip"
        aria-label="Go-live smoke summary"
        data-testid="go-live-481-top-strip"
      >
        {[
          ["Release candidate", projection.releaseCandidateRef],
          ["Wave manifest", projection.waveManifestRef],
          ["Restore point age", `${projection.restorePointAgeMinutes} minutes`],
          ["Recovery posture", titleCase(projection.recoveryPosture)],
          ["Smoke verdict", titleCase(projection.smokeVerdict)],
        ].map(([label, value]) => (
          <span key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </span>
        ))}
      </section>

      <section className="go-live-481-layout">
        <div className="go-live-481-main">
          <div className="go-live-481-lanes" data-testid="go-live-481-lanes">
            <GoLiveSmokeLane
              title="Backup & Restore"
              lane="backup_restore"
              projection={projection}
            />
            <GoLiveSmokeLane
              title="Failover & Continuity"
              lane="failover_continuity"
              projection={projection}
            />
            <GoLiveSmokeLane title="Go-Live Smoke" lane="go_live_smoke" projection={projection} />
          </div>

          <GoLiveSmokeTimeline projection={projection} />

          <section className="go-live-481-command" aria-label="Scoped rehearsal command">
            <div>
              <p className="ops-panel__eyebrow">Scoped command</p>
              <h3>Recovery rehearsal control</h3>
              <p>
                Destructive rehearsal actions stay blocked unless the route is in approved synthetic
                scope and current settlement evidence is exact.
              </p>
            </div>
            <button
              ref={actionRef}
              type="button"
              className="ops-button"
              data-testid="go-live-481-run-rehearsal"
              disabled={!projection.destructiveRehearsalAllowed}
              onClick={() => setDialogOpen(true)}
            >
              Run scoped recovery rehearsal
            </button>
          </section>
        </div>
        <GoLiveSmokeBlockerRail projection={projection} />
      </section>

      {dialogOpen ? (
        <div
          className="go-live-481-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Scoped recovery rehearsal confirmation"
          data-testid="go-live-481-confirmation-dialog"
        >
          <div>
            <p className="ops-panel__eyebrow">Confirmation required</p>
            <h2>Run synthetic recovery rehearsal?</h2>
            <p>
              This rehearsal is bound to synthetic tenant scope, the current release watch tuple,
              and WORM audit output. It cannot touch live patient data.
            </p>
            <div className="go-live-481-dialog__actions">
              <button
                ref={cancelRef}
                type="button"
                className="ops-button ops-button--ghost"
                data-testid="go-live-481-confirm-safe-cancel"
                onClick={closeDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ops-button"
                data-testid="go-live-481-confirm-run"
                onClick={closeDialog}
              >
                Confirm synthetic run
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default GoLiveSmokeBoard481;
