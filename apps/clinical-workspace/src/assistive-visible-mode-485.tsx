import { useEffect, useRef, useState } from "react";
import {
  assistiveVisible485States,
  createAssistiveVisible485Projection,
  normalizeAssistiveVisible485State,
  type AssistiveVisible485Projection,
  type AssistiveVisible485UiState,
} from "./assistive-visible-mode-485.model";

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function projectionFromLocation(): AssistiveVisible485Projection {
  const params = new URLSearchParams(window.location.search);
  return createAssistiveVisible485Projection(normalizeAssistiveVisible485State(params.get("mode")));
}

function StateSwitch(props: {
  readonly projection: AssistiveVisible485Projection;
  readonly onSelect: (state: AssistiveVisible485UiState) => void;
}) {
  return (
    <div className="assistive-485-switch" aria-label="Assistive visible mode scenario">
      {assistiveVisible485States.map((state) => (
        <button
          key={state}
          type="button"
          data-active={props.projection.uiState === state}
          data-testid={`assistive-485-state-${state}`}
          onClick={() => props.onSelect(state)}
        >
          {titleCase(state)}
        </button>
      ))}
    </div>
  );
}

function ProvenanceDrawer(props: {
  readonly projection: AssistiveVisible485Projection;
  readonly closeRef: React.RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
}) {
  return (
    <aside
      className="assistive-485-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistive-485-drawer-title"
      data-testid="assistive-485-provenance-drawer"
    >
      <div>
        <header>
          <p className="assistive-485-eyebrow">Provenance</p>
          <h2 id="assistive-485-drawer-title">Current trust envelope</h2>
        </header>
        <dl>
          <div>
            <dt>Watch tuple</dt>
            <dd>{props.projection.watchTupleHash}</dd>
          </div>
          <div>
            <dt>Trust envelope</dt>
            <dd>{props.projection.trustEnvelopeRef}</dd>
          </div>
          <div>
            <dt>Rollout verdict</dt>
            <dd>{props.projection.rolloutVerdictRef}</dd>
          </div>
          <div>
            <dt>Route family</dt>
            <dd>{props.projection.routeFamilyRef}</dd>
          </div>
          <div>
            <dt>Disclosure fence</dt>
            <dd>{titleCase(props.projection.disclosureFenceHealth)}</dd>
          </div>
        </dl>
        <div className="assistive-485-drawer__actions">
          <button
            ref={props.closeRef}
            type="button"
            data-testid="assistive-485-close-provenance"
            onClick={props.onClose}
          >
            Close
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AssistiveVisibleMode485Workspace() {
  const [projection, setProjection] = useState<AssistiveVisible485Projection>(() =>
    typeof window === "undefined"
      ? createAssistiveVisible485Projection("visible-insert")
      : projectionFromLocation(),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [downgradeFocusPending, setDowngradeFocusPending] = useState(false);
  const provenanceButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeDrawerRef = useRef<HTMLButtonElement | null>(null);
  const insertButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (drawerOpen) closeDrawerRef.current?.focus();
  }, [drawerOpen]);

  useEffect(() => {
    if (!downgradeFocusPending) return;
    provenanceButtonRef.current?.focus();
    setDowngradeFocusPending(false);
  }, [downgradeFocusPending, projection.uiState]);

  function selectState(state: AssistiveVisible485UiState): void {
    setProjection(createAssistiveVisible485Projection(state));
    setDrawerOpen(false);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    window.setTimeout(() => provenanceButtonRef.current?.focus(), 0);
  }

  function simulateDowngrade(): void {
    setProjection(createAssistiveVisible485Projection("observe-only"));
    setDrawerOpen(false);
    setDowngradeFocusPending(true);
  }

  return (
    <main
      className="assistive-485-workspace"
      data-testid="assistive-485-workspace"
      data-mode={projection.mode}
      data-insert-controls={String(projection.insertControlsVisible)}
      data-trust-state={projection.trustState}
      data-envelope-state={projection.surfacePostureState}
      data-actionability-state={projection.actionabilityState}
    >
      <header className="assistive-485-topbar">
        <div>
          <p className="assistive-485-eyebrow">Staff workspace</p>
          <h1>Assistive visible mode</h1>
        </div>
        <StateSwitch projection={projection} onSelect={selectState} />
      </header>

      <section
        className="assistive-485-panel"
        aria-label="Assistive workspace panel"
        data-testid="assistive-485-workspace-panel"
      >
        <header className="assistive-485-panel__header">
          <div className="assistive-485-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="assistive-485-eyebrow">Provenance-bound assistive stage</p>
            <h2>Draft support for current review</h2>
          </div>
          <strong className="assistive-485-chip" data-mode-chip={projection.mode}>
            {projection.modeLabel}
          </strong>
        </header>

        {projection.mode === "hidden" ? (
          <p data-testid="assistive-485-hidden-copy">
            Assistive chrome is hidden because this staff cohort or route is outside the approved
            visible slice.
          </p>
        ) : (
          <div className="assistive-485-summary">
            <p>
              Synthetic documentation summary for the current staff review remains subordinate to
              the primary task canvas.
            </p>
            <dl>
              <div>
                <dt>Confidence</dt>
                <dd>{titleCase(projection.confidencePostureState)}</dd>
              </div>
              <div>
                <dt>Trust score</dt>
                <dd>{projection.trustScore.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Route</dt>
                <dd>{projection.routeFamilyRef}</dd>
              </div>
              <div>
                <dt>Cohort</dt>
                <dd>{projection.releaseCohortRef}</dd>
              </div>
            </dl>
          </div>
        )}

        <p className="assistive-485-notice" data-testid="assistive-485-review-notice">
          {projection.reviewNotice}
        </p>

        <div className="assistive-485-actions" aria-label="Assistive mode actions">
          <button type="button" data-testid="assistive-485-review-action">
            Review manually
          </button>
          {projection.insertControlsVisible ? (
            <button ref={insertButtonRef} type="button" data-testid="assistive-485-insert-action">
              Insert draft
            </button>
          ) : null}
          {projection.regenerateControlsVisible ? (
            <button type="button" data-testid="assistive-485-regenerate-action">
              Regenerate
            </button>
          ) : null}
          {projection.visibleCommitCeilingAllowed && !projection.concreteCommitAllowed ? (
            <span data-testid="assistive-485-human-approval-required">
              Human approval gate assessment required before commit
            </span>
          ) : null}
          <button
            ref={provenanceButtonRef}
            type="button"
            data-testid="assistive-485-open-provenance"
            onClick={() => setDrawerOpen(true)}
          >
            Provenance
          </button>
          {projection.insertControlsVisible ? (
            <button
              type="button"
              data-testid="assistive-485-downgrade-action"
              onClick={simulateDowngrade}
            >
              Simulate downgrade
            </button>
          ) : null}
        </div>

        <section className="assistive-485-blockers" aria-label="Assistive blockers">
          <h3>Current blockers</h3>
          {projection.blockerRefs.length === 0 ? (
            <p>No blocker for the current visible mode.</p>
          ) : (
            <ul>
              {projection.blockerRefs.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          )}
        </section>

        <table className="assistive-485-table" data-testid="assistive-485-table-fallback">
          <caption>Assistive posture fallback</caption>
          <tbody>
            <tr>
              <th scope="row">Visible staff</th>
              <td>{projection.exposure.visibleStaffCount}</td>
            </tr>
            <tr>
              <th scope="row">Insert enabled staff</th>
              <td>{projection.exposure.insertEnabledStaffCount}</td>
            </tr>
            <tr>
              <th scope="row">Hidden outside cohort</th>
              <td>{projection.exposure.hiddenOutsideCohort ? "yes" : "no"}</td>
            </tr>
            <tr>
              <th scope="row">Settlement</th>
              <td>{titleCase(projection.settlementResult)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {drawerOpen ? (
        <ProvenanceDrawer projection={projection} closeRef={closeDrawerRef} onClose={closeDrawer} />
      ) : null}
    </main>
  );
}
