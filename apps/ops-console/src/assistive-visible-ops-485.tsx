import { useMemo } from "react";
import { createAssistiveVisibleOps485Projection } from "./assistive-visible-ops-485.model";

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function AssistiveVisibleOps485() {
  const projection = useMemo(() => createAssistiveVisibleOps485Projection(), []);

  return (
    <main
      className="assistive-ops-485"
      data-testid="assistive-485-ops"
      data-active-mode={projection.activeRow.eligibleMode}
      data-edge-cases={projection.edgeCaseCount}
    >
      <header className="assistive-ops-485__header">
        <div>
          <p className="assistive-ops-485__eyebrow">Assistive Ops</p>
          <h1>Visible mode authority</h1>
        </div>
        <dl>
          <div>
            <dt>Active mode</dt>
            <dd>{titleCase(projection.activeRow.eligibleMode)}</dd>
          </div>
          <div>
            <dt>Watch tuple</dt>
            <dd>{projection.activeRow.watchTupleHash}</dd>
          </div>
          <div>
            <dt>Insert staff</dt>
            <dd>{projection.activeRow.insertEnabledStaffCount}</dd>
          </div>
        </dl>
      </header>

      <section
        className="assistive-ops-485__matrix"
        aria-label="Assistive visible mode matrix"
        data-testid="assistive-485-ops-matrix"
      >
        <table>
          <caption>Assistive visible mode matrix</caption>
          <thead>
            <tr>
              <th scope="col">Scenario</th>
              <th scope="col">Capability</th>
              <th scope="col">Route</th>
              <th scope="col">Cohort</th>
              <th scope="col">Rung</th>
              <th scope="col">Mode</th>
              <th scope="col">Trust</th>
              <th scope="col">Envelope</th>
              <th scope="col">Freeze</th>
              <th scope="col">Disclosure</th>
              <th scope="col">Blockers</th>
            </tr>
          </thead>
          <tbody>
            {projection.rows.map((row) => (
              <tr key={row.scenarioId} data-mode={row.eligibleMode}>
                <th scope="row">{row.scenarioId}</th>
                <td>{row.capabilityCode}</td>
                <td>{row.routeFamilyRef}</td>
                <td>{row.releaseCohortRef}</td>
                <td>{titleCase(row.rolloutRung)}</td>
                <td>{titleCase(row.eligibleMode)}</td>
                <td>
                  {titleCase(row.trustState)} {row.trustScore.toFixed(2)}
                </td>
                <td>
                  {titleCase(row.envelopePosture)} / {titleCase(row.actionabilityState)}
                </td>
                <td>{titleCase(row.freezeState)}</td>
                <td>{titleCase(row.disclosureFenceHealth)}</td>
                <td>{row.blockerRefs.length === 0 ? "none" : row.blockerRefs.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section
        className="assistive-ops-485__freeze"
        aria-label="Assistive freeze explanation"
        data-testid="assistive-485-freeze-explanation"
      >
        <p className="assistive-ops-485__eyebrow">Freeze disposition</p>
        <h2>Suppress write controls, preserve provenance</h2>
        <p>{projection.freezeExplanation}</p>
      </section>
    </main>
  );
}
