import { useEffect, useMemo, useRef, useState } from "react";
import {
  canaryRollout484States,
  createCanaryRollout484Projection,
  normalizeCanaryRollout484State,
  type CanaryRollout484Node,
  type CanaryRollout484Projection,
  type CanaryRollout484State,
} from "./canary-rollout-console-484.model";

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function projectionFromLocation(): CanaryRollout484Projection {
  const params = new URLSearchParams(window.location.search);
  return createCanaryRollout484Projection(normalizeCanaryRollout484State(params.get("state")));
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

function StateSwitch(props: {
  readonly projection: CanaryRollout484Projection;
  readonly onSelectState: (state: CanaryRollout484State) => void;
}) {
  return (
    <div className="canary-484-state-switch" aria-label="Canary projection state">
      {canaryRollout484States.map((state) => (
        <button
          key={state}
          type="button"
          className="ops-chip"
          data-active={props.projection.state === state}
          data-testid={`canary-484-state-${state}`}
          onClick={() => props.onSelectState(state)}
        >
          {titleCase(state)}
        </button>
      ))}
    </div>
  );
}

function WaveLadder(props: {
  readonly projection: CanaryRollout484Projection;
  readonly selectedNodeId: CanaryRollout484Node["nodeId"];
  readonly onSelectNode: (node: CanaryRollout484Node) => void;
}) {
  return (
    <section
      className="canary-484-panel canary-484-ladder"
      aria-label="Remaining wave canary ladder"
      data-testid="canary-484-ladder"
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Canary order</p>
          <h2>{titleCase(props.projection.decisionState)}</h2>
        </div>
        <span data-policy-state={props.projection.policyState}>
          {titleCase(props.projection.policyState)}
        </span>
      </header>
      <ol>
        {props.projection.nodes.map((node, index) => (
          <li key={node.nodeId} data-node-state={node.state}>
            <button
              type="button"
              data-ladder-node="true"
              data-selected={props.selectedNodeId === node.nodeId}
              data-testid={`canary-484-node-${node.nodeId}`}
              aria-current={props.selectedNodeId === node.nodeId ? "step" : undefined}
              onClick={() => props.onSelectNode(node)}
              onKeyDown={(event) => handleRovingKey("[data-ladder-node='true']", event)}
            >
              <small>0{index + 1}</small>
              <strong>{node.label}</strong>
              <span>{titleCase(node.state)}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NodeDetails(props: { readonly node: CanaryRollout484Node }) {
  return (
    <section
      className="canary-484-panel canary-484-node"
      aria-label="Selected canary node"
      data-testid="canary-484-node-details"
      data-node-state={props.node.state}
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Selected wave</p>
          <h2>{props.node.label}</h2>
        </div>
        <span>{titleCase(props.node.selectorKind)}</span>
      </header>
      <dl>
        <div>
          <dt>Wave</dt>
          <dd>{props.node.waveRef}</dd>
        </div>
        <div>
          <dt>Cohort</dt>
          <dd>{props.node.cohortScope}</dd>
        </div>
        <div>
          <dt>Channel</dt>
          <dd>{props.node.channelScope}</dd>
        </div>
        <div>
          <dt>Blocker</dt>
          <dd>{props.node.blockerRef ?? "none"}</dd>
        </div>
      </dl>
      <p>{props.node.detail}</p>
    </section>
  );
}

function ScopeComparison(props: { readonly projection: CanaryRollout484Projection }) {
  const rows = [
    ["Patients", "patients"],
    ["Staff", "staff"],
    ["Pharmacy", "pharmacy"],
    ["Hub", "hub"],
    ["NHS App", "nhs_app"],
    ["Assistive", "assistive"],
  ] as const;
  const maxDelta = Math.max(
    1,
    ...rows.map(([, key]) => Number(props.projection.maxPermittedDelta[key])),
  );

  return (
    <section
      className="canary-484-panel canary-484-scope"
      aria-label="Scope and blast radius comparison"
      data-testid="canary-484-scope-comparison"
      data-blast-radius-state={props.projection.blastRadiusState}
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Scope comparison</p>
          <h2>{titleCase(props.projection.selectorKind)} selector</h2>
        </div>
        <span data-selector-state={props.projection.selectorState}>
          {titleCase(props.projection.selectorState)}
        </span>
      </header>
      <div className="canary-484-scope__bars" aria-hidden="true">
        {rows.map(([label, key]) => {
          const delta = Number(props.projection.deltaExposure[key]);
          const width = Math.min(100, Math.round((delta / maxDelta) * 100));
          return (
            <div key={key}>
              <span>{label}</span>
              <i style={{ width: `${width}%` }} />
              <strong>{delta}</strong>
            </div>
          );
        })}
      </div>
      <table className="ops-table">
        <caption>Blast radius fallback</caption>
        <thead>
          <tr>
            <th scope="col">Scope</th>
            <th scope="col">Previous</th>
            <th scope="col">Proposed</th>
            <th scope="col">Delta</th>
            <th scope="col">Maximum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, key]) => (
            <tr key={key}>
              <th scope="row">{label}</th>
              <td>{props.projection.previousExposure[key]}</td>
              <td>{props.projection.proposedExposure[key]}</td>
              <td>{props.projection.deltaExposure[key]}</td>
              <td>{props.projection.maxPermittedDelta[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function GuardrailPanel(props: { readonly projection: CanaryRollout484Projection }) {
  return (
    <section
      className="canary-484-panel canary-484-guardrails"
      aria-label="Canary guardrail evaluations"
      data-testid="canary-484-guardrails"
    >
      <header>
        <div>
          <p className="ops-panel__eyebrow">Guardrails</p>
          <h2>Settlement checks</h2>
        </div>
      </header>
      <div>
        {props.projection.guardrails.map((guardrail) => (
          <article
            key={guardrail.guardrailId}
            data-guardrail-state={guardrail.state}
            data-testid={`canary-484-guardrail-${guardrail.guardrailId}`}
          >
            <span>{guardrail.label}</span>
            <strong>{guardrail.observedValue}</strong>
            <small>{guardrail.threshold}</small>
            <small>{guardrail.blockerRef ?? guardrail.interval}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function ControlRail(props: {
  readonly projection: CanaryRollout484Projection;
  readonly actionRef: React.RefObject<HTMLButtonElement | null>;
  readonly onOpenConfirm: () => void;
}) {
  return (
    <aside
      className="canary-484-controls"
      aria-label="Canary rollout controls"
      data-testid="canary-484-controls"
    >
      <section>
        <p className="ops-panel__eyebrow">Action</p>
        <h2>{props.projection.actionLabel}</h2>
        <button
          ref={props.actionRef}
          type="button"
          className="ops-button ops-button--primary"
          data-testid="canary-484-widen-action"
          disabled={!props.projection.wideningEnabled}
          onClick={props.onOpenConfirm}
        >
          Widen
        </button>
      </section>
      <section>
        <p className="ops-panel__eyebrow">Recovery</p>
        <h2>{titleCase(props.projection.observationState)}</h2>
        <dl>
          <div>
            <dt>Disposition</dt>
            <dd>{props.projection.recoveryDisposition}</dd>
          </div>
          <div>
            <dt>Settlement</dt>
            <dd>{titleCase(props.projection.settlementState)}</dd>
          </div>
          <div>
            <dt>Policy</dt>
            <dd>{titleCase(props.projection.policyState)}</dd>
          </div>
        </dl>
      </section>
      <section>
        <p className="ops-panel__eyebrow">Blockers</p>
        <h2>{props.projection.blockerRefs.length === 0 ? "None" : "Active"}</h2>
        {props.projection.blockerRefs.length === 0 ? (
          <p>No blocker is attached to this canary projection.</p>
        ) : (
          <ul>
            {props.projection.blockerRefs.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        )}
      </section>
      {props.projection.pauseRecord ? (
        <section data-testid="canary-484-pause-record">
          <p className="ops-panel__eyebrow">Pause</p>
          <h2>{titleCase(props.projection.pauseRecord.state)}</h2>
          <p>{props.projection.pauseRecord.reasonCode}</p>
        </section>
      ) : null}
      {props.projection.rollbackRecord ? (
        <section data-testid="canary-484-rollback-record">
          <p className="ops-panel__eyebrow">Rollback</p>
          <h2>{titleCase(props.projection.rollbackRecord.state)}</h2>
          <dl>
            <div>
              <dt>Route</dt>
              <dd>{titleCase(props.projection.rollbackRecord.routeRollbackReadinessState)}</dd>
            </div>
            <div>
              <dt>Channel</dt>
              <dd>{titleCase(props.projection.rollbackRecord.channelRollbackReadinessState)}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </aside>
  );
}

function ConfirmationDialog(props: {
  readonly projection: CanaryRollout484Projection;
  readonly cancelRef: React.RefObject<HTMLButtonElement | null>;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
}) {
  return (
    <div
      className="canary-484-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="canary-484-dialog-title"
      data-testid="canary-484-confirmation-dialog"
    >
      <div>
        <header>
          <p className="ops-panel__eyebrow">Confirm canary</p>
          <h2 id="canary-484-dialog-title">Guarded widening</h2>
        </header>
        <dl>
          <div>
            <dt>Selector kind</dt>
            <dd>{titleCase(props.projection.selectorKind)}</dd>
          </div>
          <div>
            <dt>Tenant selector</dt>
            <dd>{props.projection.tenantScope}</dd>
          </div>
          <div>
            <dt>Cohort selector</dt>
            <dd>{props.projection.cohortScope}</dd>
          </div>
          <div>
            <dt>Channel selector</dt>
            <dd>{props.projection.channelScope}</dd>
          </div>
          <div>
            <dt>Recovery disposition</dt>
            <dd>{props.projection.recoveryDisposition}</dd>
          </div>
        </dl>
        <div className="canary-484-dialog__actions">
          <button
            ref={props.cancelRef}
            type="button"
            className="ops-button ops-button--ghost"
            data-testid="canary-484-confirm-cancel"
            onClick={props.onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ops-button ops-button--primary"
            data-testid="canary-484-confirm-submit"
            onClick={props.onSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export function CanaryRolloutConsole484() {
  const [projection, setProjection] = useState<CanaryRollout484Projection>(() =>
    typeof window === "undefined"
      ? createCanaryRollout484Projection("ready")
      : projectionFromLocation(),
  );
  const [selectedNodeId, setSelectedNodeId] = useState<CanaryRollout484Node["nodeId"]>("wave2");
  const [dialogOpen, setDialogOpen] = useState(false);
  const actionRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const selectedNode =
    projection.nodes.find((node) => node.nodeId === selectedNodeId) ??
    projection.nodes[0] ??
    ({
      nodeId: "wave2",
      label: "Wave 2",
      state: "blocked",
      waveRef: projection.waveRef,
      selectorKind: projection.selectorKind,
      cohortScope: projection.cohortScope,
      channelScope: projection.channelScope,
      detail: projection.nextSafeAction,
      blockerRef: projection.blockerRefs[0] ?? null,
    } satisfies CanaryRollout484Node);
  const motionPolicy = useMemo(() => "reduced-motion-no-optimistic-completion", []);

  useEffect(() => {
    if (!dialogOpen) return;
    cancelRef.current?.focus();
  }, [dialogOpen]);

  function selectState(state: CanaryRollout484State): void {
    setProjection(createCanaryRollout484Projection(state));
    setSelectedNodeId("wave2");
    setDialogOpen(false);
  }

  function closeDialog(): void {
    setDialogOpen(false);
    window.setTimeout(() => actionRef.current?.focus(), 0);
  }

  function submitCanary(): void {
    setDialogOpen(false);
    setProjection(createCanaryRollout484Projection("active"));
    setSelectedNodeId("wave2");
    window.setTimeout(() => actionRef.current?.focus(), 0);
  }

  return (
    <main
      className="canary-484-console"
      data-testid="canary-484-console"
      data-canary-state={projection.state}
      data-widening-enabled={String(projection.wideningEnabled)}
      data-previous-stability={projection.previousStabilityState}
      data-selector-state={projection.selectorState}
      data-settlement-state={projection.settlementState}
      data-motion-policy={motionPolicy}
    >
      <header className="canary-484-header">
        <div>
          <p className="ops-panel__eyebrow">Task 484</p>
          <h1>Guardrailed Canary Rollout</h1>
        </div>
        <StateSwitch projection={projection} onSelectState={selectState} />
      </header>

      <section
        className="canary-484-strip"
        aria-label="Release tuple"
        data-testid="canary-484-release-strip"
      >
        {[
          ["Candidate", projection.releaseCandidateRef],
          ["Runtime", projection.runtimePublicationBundleRef],
          ["Wave", projection.waveRef],
          ["Selector", projection.selectorId],
          ["Artifacts", String(projection.artifactCount)],
        ].map(([label, value]) => (
          <span key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </span>
        ))}
      </section>

      <div className="canary-484-layout">
        <div className="canary-484-main">
          <WaveLadder
            projection={projection}
            selectedNodeId={selectedNodeId}
            onSelectNode={(node) => setSelectedNodeId(node.nodeId)}
          />
          <NodeDetails node={selectedNode} />
          <ScopeComparison projection={projection} />
          <GuardrailPanel projection={projection} />
        </div>
        <ControlRail
          projection={projection}
          actionRef={actionRef}
          onOpenConfirm={() => setDialogOpen(true)}
        />
      </div>

      {dialogOpen ? (
        <ConfirmationDialog
          projection={projection}
          cancelRef={cancelRef}
          onCancel={closeDialog}
          onSubmit={submitCanary}
        />
      ) : null}
    </main>
  );
}
