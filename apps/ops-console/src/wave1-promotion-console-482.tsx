import { useEffect, useMemo, useRef, useState } from "react";
import {
  createWave1Promotion482Projection,
  normalizeWave1Promotion482State,
  type Wave1Promotion482Lane,
  type Wave1Promotion482Projection,
  type Wave1Promotion482State,
} from "./wave1-promotion-console-482.model";

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function projectionFromLocation(): Wave1Promotion482Projection {
  const params = new URLSearchParams(window.location.search);
  return createWave1Promotion482Projection(normalizeWave1Promotion482State(params.get("state")));
}

function EvidenceDrawer(props: {
  readonly lane: Wave1Promotion482Lane | null;
  readonly onClose: () => void;
}) {
  if (!props.lane) return null;
  return (
    <aside
      className="promotion-482-drawer"
      aria-label={`${props.lane.label} evidence drawer`}
      data-testid="promotion-482-evidence-drawer"
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Evidence lane</p>
          <h2>{props.lane.label}</h2>
        </div>
        <button
          type="button"
          className="ops-button ops-button--ghost"
          data-testid="promotion-482-close-drawer"
          onClick={props.onClose}
        >
          Close
        </button>
      </header>
      <dl>
        <div>
          <dt>State</dt>
          <dd>{titleCase(props.lane.state)}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{props.lane.owner}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{props.lane.evidenceRef}</dd>
        </div>
        <div>
          <dt>Blocker</dt>
          <dd>{props.lane.blockerRef ?? "none"}</dd>
        </div>
      </dl>
      <p>{props.lane.detail}</p>
    </aside>
  );
}

function PreflightLanes(props: {
  readonly projection: Wave1Promotion482Projection;
  readonly onSelectLane: (lane: Wave1Promotion482Lane) => void;
}) {
  return (
    <section
      className="promotion-482-lanes"
      aria-label="Promotion preflight evidence lanes"
      data-testid="promotion-482-preflight-lanes"
    >
      {props.projection.lanes.map((lane) => (
        <button
          key={lane.laneId}
          type="button"
          className="promotion-482-lane"
          data-lane-state={lane.state}
          data-testid={`promotion-482-lane-${lane.laneId}`}
          onClick={() => props.onSelectLane(lane)}
        >
          <span>{lane.label}</span>
          <strong>{titleCase(lane.state)}</strong>
          <small>{lane.evidenceRef}</small>
        </button>
      ))}
    </section>
  );
}

function SettlementPanel(props: { readonly projection: Wave1Promotion482Projection }) {
  return (
    <section
      className="promotion-482-settlement"
      aria-label="Promotion settlement"
      data-testid="promotion-482-settlement-panel"
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Backend settlement</p>
          <h2>{titleCase(props.projection.settlementState)}</h2>
        </div>
        <span data-parity-state={props.projection.publicationParityState}>
          {titleCase(props.projection.publicationParityState)}
        </span>
      </header>
      <dl>
        <div>
          <dt>Command</dt>
          <dd>{props.projection.commandId}</dd>
        </div>
        <div>
          <dt>Settlement</dt>
          <dd>{props.projection.settlementId}</dd>
        </div>
        <div>
          <dt>Activation claim</dt>
          <dd>{titleCase(props.projection.activationClaim)}</dd>
        </div>
      </dl>
    </section>
  );
}

function BlockerRail(props: { readonly projection: Wave1Promotion482Projection }) {
  return (
    <aside
      className="promotion-482-rail"
      aria-label="Promotion blockers"
      data-testid="promotion-482-blocker-rail"
    >
      <header>
        <p className="ops-panel__eyebrow">Promotion blockers</p>
        <h2>Fallback actions</h2>
      </header>
      {props.projection.blockers.length === 0 ? (
        <p>No blockers for the Wave 1 promotion command.</p>
      ) : (
        <ul>
          {props.projection.blockers.map((blocker) => (
            <li key={blocker.blockerRef}>
              <strong>{blocker.blockerRef}</strong>
              <span>{blocker.fallbackAction}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export function Wave1PromotionConsole482() {
  const [projection, setProjection] = useState<Wave1Promotion482Projection>(() =>
    typeof window === "undefined"
      ? createWave1Promotion482Projection("ready")
      : projectionFromLocation(),
  );
  const [selectedLane, setSelectedLane] = useState<Wave1Promotion482Lane | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const motionPolicy = useMemo(() => "reduced-motion-no-optimistic-activation", []);

  useEffect(() => {
    if (!dialogOpen) return;
    cancelRef.current?.focus();
  }, [dialogOpen]);

  function setState(state: Wave1Promotion482State) {
    setProjection(createWave1Promotion482Projection(state));
    setSelectedLane(null);
  }

  function closeDialog() {
    setDialogOpen(false);
    window.setTimeout(() => actionRef.current?.focus(), 0);
  }

  function confirmPromotion() {
    setDialogOpen(false);
    setProjection(createWave1Promotion482Projection("pending"));
  }

  return (
    <main
      className="promotion-482-console"
      data-testid="promotion-482-console"
      data-preflight-state={projection.preflightState}
      data-settlement-state={projection.settlementState}
      data-publication-parity-state={projection.publicationParityState}
      data-activation-claim={projection.activationClaim}
      data-release-manager-authority={String(projection.hasReleaseManagerAuthority)}
      data-motion-policy={motionPolicy}
    >
      <header className="promotion-482-console__header">
        <div>
          <p className="ops-panel__eyebrow">Task 482</p>
          <h1>Promote Wave 1</h1>
        </div>
        <div className="promotion-482-state-switch" aria-label="Promotion console state">
          {(
            ["ready", "blocked", "pending", "settled", "parity_failed", "role_denied"] as const
          ).map((state) => (
            <button
              key={state}
              type="button"
              className="ops-chip"
              data-active={projection.state === state}
              data-testid={`promotion-482-state-${state}`}
              onClick={() => setState(state)}
            >
              {titleCase(state)}
            </button>
          ))}
        </div>
      </header>

      <section
        className="promotion-482-strip"
        aria-label="Promotion tuple summary"
        data-testid="promotion-482-top-strip"
      >
        {[
          ["Release candidate", projection.releaseCandidateRef],
          ["Runtime bundle", projection.runtimePublicationBundleRef],
          ["Wave", projection.waveRef],
          ["Cohort", projection.cohortScope],
          ["Watch tuple", projection.watchTupleRef],
        ].map(([label, value]) => (
          <span key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </span>
        ))}
      </section>

      <section className="promotion-482-layout">
        <div className="promotion-482-main">
          <section className="promotion-482-decision" aria-label="Promotion decision panel">
            <div>
              <p className="ops-panel__eyebrow">Signed release seal</p>
              <h2>{titleCase(projection.preflightState)} preflight</h2>
              <p>
                Wave 1 remains inactive until backend settlement and publication parity are current.
              </p>
            </div>
            <button
              ref={actionRef}
              type="button"
              className="ops-button"
              data-testid="promotion-482-promote-action"
              disabled={!projection.actionEnabled}
              onClick={() => setDialogOpen(true)}
            >
              Promote Wave 1
            </button>
          </section>

          <PreflightLanes projection={projection} onSelectLane={setSelectedLane} />

          <section
            className="promotion-482-ladder"
            aria-label="Wave ladder"
            data-testid="promotion-482-wave-ladder"
          >
            <ol>
              {["Approved", "Command accepted", "Settlement", "Parity current", "Observe"].map(
                (label, index) => (
                  <li
                    key={label}
                    data-step-current={index === 0 || projection.activationClaim !== "not_active"}
                  >
                    <span>{index + 1}</span>
                    <strong>{label}</strong>
                  </li>
                ),
              )}
            </ol>
            <table className="ops-table">
              <caption>Wave ladder fallback</caption>
              <tbody>
                <tr>
                  <th scope="row">Current activation claim</th>
                  <td>{titleCase(projection.activationClaim)}</td>
                </tr>
                <tr>
                  <th scope="row">Channel scope</th>
                  <td>{projection.channelScope}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <SettlementPanel projection={projection} />

          {projection.state === "pending" ? (
            <button
              type="button"
              className="ops-button ops-button--ghost"
              data-testid="promotion-482-apply-settlement"
              onClick={() => setState("settled")}
            >
              Apply backend settlement
            </button>
          ) : null}
        </div>

        <div className="promotion-482-side">
          <EvidenceDrawer lane={selectedLane} onClose={() => setSelectedLane(null)} />
          <BlockerRail projection={projection} />
        </div>
      </section>

      {dialogOpen ? (
        <div
          className="promotion-482-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Wave 1 promotion confirmation"
          data-testid="promotion-482-confirmation-dialog"
        >
          <div>
            <p className="ops-panel__eyebrow">Confirmation required</p>
            <h2>Submit the Wave 1 promotion command?</h2>
            <p>
              The command binds release candidate, runtime bundle, Wave 1 scope, rollback binding,
              purpose, idempotency key, and WORM audit output.
            </p>
            <div className="promotion-482-dialog__actions">
              <button
                ref={cancelRef}
                type="button"
                className="ops-button ops-button--ghost"
                data-testid="promotion-482-confirm-safe-cancel"
                onClick={closeDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ops-button"
                data-testid="promotion-482-confirm-promote"
                onClick={confirmPromotion}
              >
                Submit command
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default Wave1PromotionConsole482;
