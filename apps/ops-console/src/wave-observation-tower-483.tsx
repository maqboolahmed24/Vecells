import { useEffect, useMemo, useRef, useState } from "react";
import {
  createWaveObservation483Projection,
  normalizeWaveObservation483State,
  type WaveObservation483Guardrail,
  type WaveObservation483Probe,
  type WaveObservation483Projection,
  type WaveObservation483Recommendation,
  type WaveObservation483State,
} from "./wave-observation-tower-483.model";

type DrawerItem = {
  readonly title: string;
  readonly detail: string;
  readonly blockerRef: string | null;
  readonly sourceRef: string;
};

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function projectionFromLocation(): WaveObservation483Projection {
  const params = new URLSearchParams(window.location.search);
  return createWaveObservation483Projection(normalizeWaveObservation483State(params.get("state")));
}

function moveFocus(selector: string, current: HTMLElement, delta: number): void {
  const controls = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const index = controls.indexOf(current);
  const next = controls[(index + delta + controls.length) % controls.length];
  next?.focus();
}

function handleRovingKey(selector: string, event: React.KeyboardEvent<HTMLElement>): void {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    moveFocus(selector, event.currentTarget, 1);
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    moveFocus(selector, event.currentTarget, -1);
  }
  if (event.key === "Home") {
    event.preventDefault();
    document.querySelector<HTMLElement>(selector)?.focus();
  }
  if (event.key === "End") {
    event.preventDefault();
    const controls = Array.from(document.querySelectorAll<HTMLElement>(selector));
    controls.at(-1)?.focus();
  }
}

function DwellTimeline(props: {
  readonly projection: WaveObservation483Projection;
  readonly onSelectProbe: (probe: WaveObservation483Probe, trigger: HTMLButtonElement) => void;
}) {
  return (
    <section
      className="wave-483-panel wave-483-timeline"
      aria-label="Dwell-window timeline"
      data-testid="wave-observation-483-dwell-timeline"
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Dwell window</p>
          <h2>{props.projection.dwellTimer}</h2>
        </div>
        <span data-dwell-state={props.projection.dwellState}>
          {titleCase(props.projection.dwellState)}
        </span>
      </header>
      {props.projection.whyNotStable ? (
        <p className="wave-483-explainer" data-testid="wave-observation-483-why-not-stable">
          {props.projection.whyNotStable}
        </p>
      ) : null}
      <ol>
        {props.projection.timeline.map((probe) => (
          <li key={probe.probeId} data-probe-state={probe.state}>
            <button
              type="button"
              data-timeline-probe="true"
              data-testid={`wave-observation-483-probe-${probe.probeId}`}
              onClick={(event) => props.onSelectProbe(probe, event.currentTarget)}
              onKeyDown={(event) => handleRovingKey("[data-timeline-probe='true']", event)}
            >
              <small>{probe.hour}</small>
              <strong>{probe.label}</strong>
              <span>{probe.value}</span>
            </button>
          </li>
        ))}
      </ol>
      <table className="ops-table" data-testid="wave-observation-483-dwell-table">
        <caption>Dwell timeline fallback</caption>
        <thead>
          <tr>
            <th scope="col">Probe</th>
            <th scope="col">Hour</th>
            <th scope="col">State</th>
            <th scope="col">Value</th>
            <th scope="col">Threshold</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.timeline.map((probe) => (
            <tr key={probe.probeId}>
              <th scope="row">{probe.label}</th>
              <td>{probe.hour}</td>
              <td>{titleCase(probe.state)}</td>
              <td>{probe.value}</td>
              <td>{probe.threshold}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function GuardrailCards(props: {
  readonly guardrails: readonly WaveObservation483Guardrail[];
  readonly onSelectGuardrail: (
    guardrail: WaveObservation483Guardrail,
    trigger: HTMLButtonElement,
  ) => void;
}) {
  return (
    <section
      className="wave-483-panel wave-483-guardrails"
      aria-label="Guardrail evaluations"
      data-testid="wave-observation-483-guardrail-cards"
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Guardrail evaluations</p>
          <h2>Approved projections only</h2>
        </div>
      </header>
      <div className="wave-483-guardrails__grid">
        {props.guardrails.map((guardrail) => (
          <button
            key={guardrail.guardrailId}
            type="button"
            className="wave-483-guardrail"
            data-guardrail-card="true"
            data-guardrail-state={guardrail.state}
            data-testid={`wave-observation-483-guardrail-${guardrail.guardrailId}`}
            onClick={(event) => props.onSelectGuardrail(guardrail, event.currentTarget)}
            onKeyDown={(event) => handleRovingKey("[data-guardrail-card='true']", event)}
          >
            <span>{guardrail.label}</span>
            <strong>{guardrail.currentValue}</strong>
            <small>{guardrail.method}</small>
            <dl>
              <div>
                <dt>Samples</dt>
                <dd>{guardrail.sampleSize}</dd>
              </div>
              <div>
                <dt>Interval</dt>
                <dd>{guardrail.interval}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{titleCase(guardrail.state)}</dd>
              </div>
            </dl>
          </button>
        ))}
      </div>
    </section>
  );
}

function RecommendationRail(props: {
  readonly projection: WaveObservation483Projection;
  readonly onSelectRecommendation: (
    recommendation: WaveObservation483Recommendation,
    trigger: HTMLButtonElement,
  ) => void;
}) {
  return (
    <aside
      className="wave-483-rail"
      aria-label="Observation recommendations"
      data-testid="wave-observation-483-rail"
    >
      <section>
        <p className="ops-panel__eyebrow">Recommendations</p>
        <h2>
          {props.projection.recommendations.length === 0 ? "No action required" : "Action required"}
        </h2>
        {props.projection.recommendations.length === 0 ? (
          <p>No pause or rollback recommendation is active for the current projection.</p>
        ) : (
          <ul>
            {props.projection.recommendations.map((recommendation) => (
              <li key={recommendation.recommendationId}>
                <button
                  type="button"
                  data-testid={`wave-observation-483-recommendation-${recommendation.recommendationId}`}
                  onClick={(event) =>
                    props.onSelectRecommendation(recommendation, event.currentTarget)
                  }
                >
                  <strong>{recommendation.title}</strong>
                  <span>{recommendation.blockerRef ?? recommendation.commandRef}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-testid="wave-observation-483-incident-correlation-rail">
        <p className="ops-panel__eyebrow">Incident correlation</p>
        {props.projection.incidentCorrelations.map((entry) => (
          <article key={entry.label}>
            <strong>{entry.label}</strong>
            <span>
              Aggregate {titleCase(entry.aggregateState)}; slice {titleCase(entry.sliceState)}
            </span>
            <p>{entry.detail}</p>
          </article>
        ))}
      </section>

      <section>
        <p className="ops-panel__eyebrow">Support load</p>
        <dl>
          <div>
            <dt>Tickets</dt>
            <dd>
              {props.projection.supportLoad.launchTickets} /{" "}
              {props.projection.supportLoad.threshold}
            </dd>
          </div>
          <div>
            <dt>Technical probes</dt>
            <dd>{titleCase(props.projection.supportLoad.technicalProbeState)}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{props.projection.supportLoad.owner}</dd>
          </div>
        </dl>
      </section>

      <section>
        <p className="ops-panel__eyebrow">Recovery disposition</p>
        <p>{props.projection.recoveryDisposition}</p>
      </section>
    </aside>
  );
}

function RecommendationDrawer(props: {
  readonly item: DrawerItem | null;
  readonly onClose: () => void;
}) {
  if (!props.item) return null;
  return (
    <aside
      className="wave-483-drawer"
      aria-label={`${props.item.title} drawer`}
      data-testid="wave-observation-483-recommendation-drawer"
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Evidence detail</p>
          <h2>{props.item.title}</h2>
        </div>
        <button
          type="button"
          className="ops-button ops-button--ghost"
          data-testid="wave-observation-483-close-drawer"
          onClick={props.onClose}
        >
          Close
        </button>
      </header>
      <dl>
        <div>
          <dt>Blocker</dt>
          <dd>{props.item.blockerRef ?? "none"}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{props.item.sourceRef}</dd>
        </div>
      </dl>
      <p>{props.item.detail}</p>
    </aside>
  );
}

export function WaveObservationTower483() {
  const [projection, setProjection] = useState<WaveObservation483Projection>(() =>
    typeof window === "undefined"
      ? createWaveObservation483Projection("stable")
      : projectionFromLocation(),
  );
  const [drawerItem, setDrawerItem] = useState<DrawerItem | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const motionPolicy = useMemo(() => "reduced-motion-no-optimistic-widening", []);

  useEffect(() => {
    if (!drawerItem) window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  }, [drawerItem]);

  function setState(state: WaveObservation483State) {
    setProjection(createWaveObservation483Projection(state));
    setDrawerItem(null);
  }

  function selectProbe(probe: WaveObservation483Probe, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setDrawerItem({
      title: probe.label,
      detail: `${probe.label} is ${titleCase(probe.state)} at ${probe.hour}.`,
      blockerRef: probe.state === "exact" ? null : `state:${probe.state}`,
      sourceRef: probe.sourceProjection,
    });
  }

  function selectGuardrail(guardrail: WaveObservation483Guardrail, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setDrawerItem({
      title: guardrail.label,
      detail: guardrail.detail,
      blockerRef: guardrail.blockerRef,
      sourceRef: guardrail.sourceProjection,
    });
  }

  function selectRecommendation(
    recommendation: WaveObservation483Recommendation,
    trigger: HTMLButtonElement,
  ) {
    lastTriggerRef.current = trigger;
    setDrawerItem({
      title: recommendation.title,
      detail: recommendation.detail,
      blockerRef: recommendation.blockerRef,
      sourceRef: recommendation.commandRef,
    });
  }

  return (
    <main
      className="wave-483-tower"
      data-testid="wave-observation-483-tower"
      data-stability-verdict={projection.stabilityVerdict}
      data-widening-enabled={String(projection.wideningEnabled)}
      data-dwell-state={projection.dwellState}
      data-publication-parity-state={projection.publicationParityState}
      data-motion-policy={motionPolicy}
    >
      <header className="wave-483-header">
        <div>
          <p className="ops-panel__eyebrow">Task 483</p>
          <h1>Wave Observation Tower</h1>
        </div>
        <div className="wave-483-state-switch" aria-label="Wave observation state">
          {(
            [
              "observing",
              "insufficient_evidence",
              "stable",
              "pause_recommended",
              "rollback_recommended",
              "blocked",
            ] as const
          ).map((state) => (
            <button
              key={state}
              type="button"
              className="ops-chip"
              data-active={projection.state === state}
              data-testid={`wave-observation-483-state-${state}`}
              onClick={() => setState(state)}
            >
              {titleCase(state)}
            </button>
          ))}
        </div>
      </header>

      <section
        className="wave-483-banner"
        aria-label="Wave observation summary"
        data-testid="wave-observation-483-top-banner"
      >
        {[
          ["Watch tuple", projection.watchTupleRef],
          ["Tuple hash", projection.watchTupleHash],
          ["Wave", projection.waveRef],
          ["Cohort", projection.cohortScope],
          ["Verdict", titleCase(projection.stabilityVerdict)],
        ].map(([label, value]) => (
          <span key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </span>
        ))}
        <button
          type="button"
          className="ops-button"
          data-testid="wave-observation-483-widen-action"
          disabled={!projection.wideningEnabled}
        >
          Widen wave
        </button>
      </section>

      <section className="wave-483-next-action" aria-label="Next safe action">
        <strong>Next safe action</strong>
        <span>{projection.nextSafeAction}</span>
      </section>

      <section className="wave-483-layout">
        <div className="wave-483-main">
          <DwellTimeline projection={projection} onSelectProbe={selectProbe} />
          <GuardrailCards guardrails={projection.guardrails} onSelectGuardrail={selectGuardrail} />
        </div>
        <RecommendationRail projection={projection} onSelectRecommendation={selectRecommendation} />
      </section>

      <RecommendationDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </main>
  );
}

export default WaveObservationTower483;
