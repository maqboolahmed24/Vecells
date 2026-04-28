import {
  createNHSAppActivation486Projection,
  isNHSAppActivation486Path,
  type NHSAppActivation486Projection,
} from "./nhs-app-channel-activation-486.model";

export { isNHSAppActivation486Path };

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function ActivationStrip({ projection }: { readonly projection: NHSAppActivation486Projection }) {
  return (
    <section className="nhs-activation-486__strip" aria-label="Activation settlement">
      <div>
        <span>Manifest</span>
        <strong>{projection.manifestVersionRef}</strong>
      </div>
      <div>
        <span>Exposure</span>
        <strong>{titleCase(projection.channelExposureState)}</strong>
      </div>
      <div>
        <span>Settlement</span>
        <strong>{projection.settlementResult}</strong>
      </div>
      <div>
        <span>Watch tuple</span>
        <strong>{projection.releaseWatchTupleRef}</strong>
      </div>
    </section>
  );
}

function EnvironmentLadder({ projection }: { readonly projection: NHSAppActivation486Projection }) {
  return (
    <section
      className="nhs-activation-486__panel"
      aria-labelledby="nhs-activation-486-env-title"
      data-testid="nhs-app-486-environment-ladder"
    >
      <header>
        <p className="ops-panel__eyebrow">Environment ladder</p>
        <h2 id="nhs-activation-486-env-title">Sandpit to live profile</h2>
      </header>
      <ol className="nhs-activation-486__ladder">
        {projection.environmentLadder.map((step, index) => (
          <li key={step.label} data-state={step.state}>
            <span>{index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.evidenceRef}</small>
            </div>
            <em>{titleCase(step.state)}</em>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RouteCoverageTable({
  projection,
}: {
  readonly projection: NHSAppActivation486Projection;
}) {
  return (
    <section
      className="nhs-activation-486__panel"
      aria-labelledby="nhs-activation-486-routes-title"
    >
      <header>
        <p className="ops-panel__eyebrow">Embedded route coverage</p>
        <h2 id="nhs-activation-486-routes-title">Approved route families</h2>
      </header>
      <div className="nhs-activation-486__table-wrap">
        <table data-testid="nhs-app-486-route-coverage-table">
          <caption>Embedded route activation coverage after NHS App channel activation</caption>
          <thead>
            <tr>
              <th scope="col">Route family</th>
              <th scope="col">Journey paths</th>
              <th scope="col">Coverage</th>
              <th scope="col">Safe return</th>
              <th scope="col">Artifact posture</th>
              <th scope="col">Freeze</th>
            </tr>
          </thead>
          <tbody>
            {projection.routeRows.map((row) => (
              <tr key={row.routeFamily}>
                <th scope="row">{row.routeFamily}</th>
                <td>{row.journeyPaths.join(", ")}</td>
                <td>{titleCase(row.coverageState)}</td>
                <td>{titleCase(row.safeReturn)}</td>
                <td>{titleCase(row.artifactPosture)}</td>
                <td>{titleCase(row.freezeDisposition)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MonthlyObligations({
  projection,
}: {
  readonly projection: NHSAppActivation486Projection;
}) {
  return (
    <section
      className="nhs-activation-486__panel"
      aria-labelledby="nhs-activation-486-obligation-title"
      data-testid="nhs-app-486-monthly-obligations"
    >
      <header>
        <p className="ops-panel__eyebrow">Assurance obligations</p>
        <h2 id="nhs-activation-486-obligation-title">Monthly data and change control</h2>
      </header>
      <ul className="nhs-activation-486__obligations">
        {projection.monthlyObligations.map((obligation) => (
          <li key={obligation.label}>
            <strong>{obligation.label}</strong>
            <span>{titleCase(obligation.state)}</span>
            <small>{obligation.evidenceRef}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActivationSettlement({
  projection,
}: {
  readonly projection: NHSAppActivation486Projection;
}) {
  return (
    <section
      className="nhs-activation-486__panel"
      aria-labelledby="nhs-activation-486-settlement-title"
      data-testid="nhs-app-486-activation-settlement"
    >
      <header>
        <p className="ops-panel__eyebrow">Command settlement</p>
        <h2 id="nhs-activation-486-settlement-title">WORM-bound activation</h2>
      </header>
      <dl className="nhs-activation-486__key-values">
        <div>
          <dt>Plan</dt>
          <dd>{projection.activationPlanRef}</dd>
        </div>
        <div>
          <dt>Command</dt>
          <dd>{projection.commandRef}</dd>
        </div>
        <div>
          <dt>Settlement</dt>
          <dd>{projection.settlementRef}</dd>
        </div>
        <div>
          <dt>Runtime publication</dt>
          <dd>{projection.runtimePublicationBundleRef}</dd>
        </div>
        <div>
          <dt>Freeze disposition</dt>
          <dd>
            {projection.freezeDisposition.state}, {projection.freezeDisposition.mode}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function NHSAppChannelActivation486() {
  const projection = createNHSAppActivation486Projection();
  return (
    <main
      className="nhs-activation-486 token-foundation"
      data-testid="nhs-app-486-ops"
      data-channel-exposure={projection.channelExposureState}
      data-settlement-result={projection.settlementResult}
    >
      <div className="nhs-activation-486__shell">
        <header className="nhs-activation-486__masthead">
          <div>
            <p className="ops-panel__eyebrow">NHS App channel</p>
            <h1>Manifest activation</h1>
          </div>
          <span>{projection.releaseCandidateRef}</span>
        </header>
        <ActivationStrip projection={projection} />
        <div className="nhs-activation-486__grid">
          <EnvironmentLadder projection={projection} />
          <MonthlyObligations projection={projection} />
          <ActivationSettlement projection={projection} />
        </div>
        <RouteCoverageTable projection={projection} />
      </div>
    </main>
  );
}
