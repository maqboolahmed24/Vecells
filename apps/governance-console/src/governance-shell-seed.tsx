import React, { startTransition, useEffect, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  resolveAutomationAnchorProfile,
} from "@vecells/persistent-shell";
import {
  GOVERNANCE_DEFAULT_PATH,
  acknowledgeGovernanceReview,
  createInitialGovernanceShellState,
  listGovernanceRoutes,
  navigateGovernanceShell,
  parseGovernancePath,
  resolveGovernanceShellSnapshot,
  reviewRouteForLocation,
  returnFromGovernanceReview,
  selectGovernanceObject,
  setGovernanceFreezeDisposition,
  setGovernanceSupportRegion,
  type GovernanceCluster,
  type GovernanceFreezeDisposition,
  type GovernanceLayoutMode,
  type GovernanceShellState,
  type GovernanceShellSnapshot,
  type GovernanceSupportRegion,
} from "./governance-shell-seed.model";

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function clusterTitle(cluster: GovernanceCluster): string {
  switch (cluster) {
    case "governance":
      return "Governance";
    case "access":
      return "Access";
    case "config":
      return "Config";
    case "comms":
      return "Comms";
    case "release":
      return "Release";
  }
}

function layoutClass(layoutMode: GovernanceLayoutMode): string {
  switch (layoutMode) {
    case "three_plane":
      return "governance-shell governance-shell--three-plane";
    case "mission_stack":
      return "governance-shell governance-shell--mission-stack";
    default:
      return "governance-shell governance-shell--two-plane";
  }
}

function freezeTone(disposition: GovernanceFreezeDisposition): string {
  switch (disposition) {
    case "writable":
      return "info";
    case "review_only":
      return "neutral";
    case "scope_drift":
      return "critical";
    case "freeze_conflict":
      return "caution";
  }
}

function statusTone(status: string): string {
  switch (status) {
    case "critical":
    case "missing":
    case "exception":
    case "blocked":
      return "critical";
    case "caution":
    case "expiring":
    case "pending":
      return "caution";
    case "success":
    case "settled":
    case "attested":
      return "success";
    default:
      return "info";
  }
}

function currentPathname(): string {
  if (typeof window === "undefined") {
    return GOVERNANCE_DEFAULT_PATH;
  }
  return parseGovernancePath(window.location.pathname).pathname;
}

function RouteRail(props: {
  snapshot: GovernanceShellSnapshot;
  onNavigate: (path: string) => void;
  onSelectObject: (objectId: string) => void;
}) {
  const routes = listGovernanceRoutes();
  const activeCluster = props.snapshot.location.cluster;
  const objectRows = props.snapshot.objectRows;
  return (
    <aside className="governance-shell__rail" aria-label="Governance route index">
      <section className="governance-panel governance-panel--rail">
        <header className="governance-panel__header">
          <div>
            <p className="governance-panel__eyebrow">ShellFamilyOwnershipContract</p>
            <h2>Route family index</h2>
          </div>
        </header>
        <div className="governance-shell__route-groups">
          {(["governance", "access", "config", "comms", "release"] as const).map((cluster) => (
            <section key={cluster} className="governance-shell__route-group">
              <h3>{clusterTitle(cluster)}</h3>
              <div className="governance-shell__route-list">
                {routes
                  .filter((route) => route.cluster === cluster)
                  .map((route) => (
                    <button
                      key={route.pathname}
                      type="button"
                      className="governance-shell__route-button"
                      data-testid={`governance-route-${route.routeKey}`}
                      data-active={props.snapshot.location.pathname === route.pathname}
                      onClick={() => props.onNavigate(route.pathname)}
                    >
                      <strong>{route.title}</strong>
                      <span>{route.summary}</span>
                    </button>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="governance-panel governance-panel--rail">
        <header className="governance-panel__header">
          <div>
            <p className="governance-panel__eyebrow">GovernanceAnchorLease</p>
            <h2>{clusterTitle(activeCluster)} focus objects</h2>
          </div>
        </header>
        <div className="governance-shell__object-list">
          {objectRows.map((row) => (
            <button
              key={row.objectId}
              type="button"
              className="governance-shell__object-row"
              data-tone={row.statusTone}
              data-selected={row.objectId === props.snapshot.selectedObject.objectId}
              data-testid={`governance-object-${row.objectId}`}
              onClick={() => props.onSelectObject(row.objectId)}
            >
              <strong>{row.label}</strong>
              <span>{row.kind}</span>
              <small>{row.summary}</small>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

function ScopeRibbon(props: { snapshot: GovernanceShellSnapshot }) {
  return (
    <section
      className="governance-scope-ribbon"
      data-testid="governance-scope-ribbon"
      data-freeze-disposition={props.snapshot.freezeDisposition}
      aria-label="Scope ribbon"
    >
      <div className="governance-scope-ribbon__brand">
        <VecellLogoLockup
          aria-hidden="true"
          className="governance-shell__insignia"
          style={{ width: 166, height: "auto" }}
        />
        <div>
          <p className="governance-scope-ribbon__kicker">Quiet governance studio</p>
          <h1>Governance console</h1>
        </div>
      </div>
      <dl className="governance-scope-ribbon__facts">
        <div>
          <dt>Tenant</dt>
          <dd>{props.snapshot.scopeToken.tenantLabel}</dd>
        </div>
        <div>
          <dt>Organisation</dt>
          <dd>{props.snapshot.scopeToken.organisationLabel}</dd>
        </div>
        <div>
          <dt>Environment</dt>
          <dd>{props.snapshot.scopeToken.environmentLabel}</dd>
        </div>
        <div>
          <dt>Purpose</dt>
          <dd>{props.snapshot.scopeToken.purposeLabel}</dd>
        </div>
        <div>
          <dt>Review object</dt>
          <dd>{props.snapshot.scopeToken.changeLabel}</dd>
        </div>
        <div>
          <dt>Freeze</dt>
          <dd>{props.snapshot.scopeToken.freezeLabel}</dd>
        </div>
        <div>
          <dt>Write state</dt>
          <dd>{props.snapshot.scopeToken.writeStateLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

function StatusStrip(props: {
  snapshot: GovernanceShellSnapshot;
  onSetDisposition: (disposition: GovernanceFreezeDisposition) => void;
}) {
  return (
    <section className="governance-status-strip" aria-label="Governance status strip">
      <div className="governance-status-strip__message" data-tone={freezeTone(props.snapshot.freezeDisposition)}>
        <strong>{titleCase(props.snapshot.freezeDisposition)}</strong>
        <span>{props.snapshot.scopeToken.driftSummary}</span>
      </div>
      <div className="governance-status-strip__toggles" data-testid="governance-disposition-controls">
        {(["writable", "review_only", "scope_drift", "freeze_conflict"] as const).map((disposition) => (
          <button
            key={disposition}
            type="button"
            className="governance-chip"
            data-testid={`governance-disposition-${disposition}`}
            data-active={props.snapshot.freezeDisposition === disposition}
            onClick={() => props.onSetDisposition(disposition)}
          >
            {titleCase(disposition)}
          </button>
        ))}
      </div>
    </section>
  );
}

function LandingSurface(props: { snapshot: GovernanceShellSnapshot; onNavigate: (path: string) => void }) {
  return (
    <section className="governance-panel governance-panel--hero" data-testid="governance-landing-surface">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">Governance foyer</p>
          <h2>{props.snapshot.location.title}</h2>
        </div>
        <span className="governance-panel__meta">{props.snapshot.location.summary}</span>
      </header>
      <div className="governance-hero-grid">
        <article className="governance-hero-callout" data-tone={statusTone(props.snapshot.selectedObject.statusTone)}>
          <strong>{props.snapshot.selectedObject.label}</strong>
          <p>{props.snapshot.selectedObject.summary}</p>
          <small>{props.snapshot.selectedObject.nextSafeAction}</small>
        </article>
        <article className="governance-hero-callout">
          <strong>Release tuple</strong>
          <p>{props.snapshot.releaseTuple.publicationState}</p>
          <small>{props.snapshot.releaseTuple.watchState}</small>
        </article>
        <article className="governance-hero-callout">
          <strong>Safest next step</strong>
          <p>{props.snapshot.location.calmNextStep}</p>
          <button
            type="button"
            className="governance-link"
            data-testid="governance-home-open-release"
            onClick={() => props.onNavigate("/ops/release")}
          >
            Open the release tuple
          </button>
        </article>
      </div>
      <table className="governance-table">
        <caption>Most relevant governance reviews</caption>
        <thead>
          <tr>
            <th scope="col">Object</th>
            <th scope="col">Owner</th>
            <th scope="col">Burden</th>
            <th scope="col">Next safe action</th>
          </tr>
        </thead>
        <tbody>
          {props.snapshot.objectRows.map((row) => (
            <tr key={row.objectId} data-tone={row.statusTone}>
              <td>{row.label}</td>
              <td>{row.ownerLabel}</td>
              <td>{row.approvalBurden}</td>
              <td>{row.nextSafeAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function MatrixSurface(props: { snapshot: GovernanceShellSnapshot }) {
  return (
    <section className="governance-panel" data-testid="governance-tenant-config-matrix">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">TenantConfigMatrix</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
        <span className="governance-panel__meta">{props.snapshot.location.summary}</span>
      </header>
      <table className="governance-table">
        <caption>Tenant configuration matrix</caption>
        <thead>
          <tr>
            <th scope="col">Domain</th>
            <th scope="col">Inherited</th>
            <th scope="col">Live</th>
            <th scope="col">Draft</th>
            <th scope="col">Guardrail</th>
          </tr>
        </thead>
        <tbody>
          {props.snapshot.objectRows.map((row) => (
            <tr key={row.objectId} data-selected={row.objectId === props.snapshot.selectedObject.objectId}>
              <td>{row.label}</td>
              <td>{row.baselineLabel}</td>
              <td>{row.summary}</td>
              <td>{row.nextSafeAction}</td>
              <td>{row.approvalBurden}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AuthoritySurface(props: { snapshot: GovernanceShellSnapshot }) {
  return (
    <section className="governance-panel" data-testid="governance-authority-map">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">AuthorityMap</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
      </header>
      <table className="governance-table">
        <caption>Authority link posture</caption>
        <thead>
          <tr>
            <th scope="col">Link</th>
            <th scope="col">Summary</th>
            <th scope="col">Evidence age</th>
            <th scope="col">Overlap risk</th>
          </tr>
        </thead>
        <tbody>
          {props.snapshot.objectRows.map((row) => (
            <tr key={row.objectId}>
              <td>{row.label}</td>
              <td>{row.summary}</td>
              <td>{row.evidenceAge}</td>
              <td>{row.nextSafeAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ComplianceSurface(props: { snapshot: GovernanceShellSnapshot }) {
  return (
    <section className="governance-panel" data-testid="governance-compliance-ledger">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">ComplianceLedgerPanel</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
      </header>
      <table className="governance-table">
        <caption>Compliance controls</caption>
        <thead>
          <tr>
            <th scope="col">Control</th>
            <th scope="col">Owner</th>
            <th scope="col">Evidence age</th>
            <th scope="col">Next safe action</th>
          </tr>
        </thead>
        <tbody>
          {props.snapshot.objectRows.map((row) => (
            <tr key={row.objectId}>
              <td>{row.label}</td>
              <td>{row.ownerLabel}</td>
              <td>{row.evidenceAge}</td>
              <td>{row.nextSafeAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function RecordsSurface(props: { snapshot: GovernanceShellSnapshot }) {
  return (
    <section className="governance-panel" data-testid="governance-records-lifecycle">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">Records lifecycle</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
      </header>
      <table className="governance-table">
        <caption>Records lifecycle posture</caption>
        <thead>
          <tr>
            <th scope="col">Decision</th>
            <th scope="col">Baseline</th>
            <th scope="col">Burden</th>
            <th scope="col">Constraint</th>
          </tr>
        </thead>
        <tbody>
          {props.snapshot.objectRows.map((row) => (
            <tr key={row.objectId}>
              <td>{row.label}</td>
              <td>{row.baselineLabel}</td>
              <td>{row.approvalBurden}</td>
              <td>{row.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AccessSurface(props: { snapshot: GovernanceShellSnapshot }) {
  return (
    <section className="governance-panel" data-testid="governance-access-surface">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">
            {props.snapshot.location.routeKey === "access_roles" ? "RoleScopeStudio" : "EffectiveAccessPreview"}
          </p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
      </header>
      <table className="governance-table">
        <caption>Access review grammar</caption>
        <thead>
          <tr>
            <th scope="col">Subject or role</th>
            <th scope="col">Operational meaning</th>
            <th scope="col">Burden</th>
            <th scope="col">Next safe action</th>
          </tr>
        </thead>
        <tbody>
          {props.snapshot.objectRows.map((row) => (
            <tr key={row.objectId} data-selected={row.objectId === props.snapshot.selectedObject.objectId}>
              <td>{row.label}</td>
              <td>{row.summary}</td>
              <td>{row.approvalBurden}</td>
              <td>{row.nextSafeAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ChangeEnvelopeSurface(props: { snapshot: GovernanceShellSnapshot; caption: string }) {
  return (
    <section className="governance-panel" data-testid="governance-change-envelope">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">ChangeEnvelope</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
        <span className="governance-panel__meta">{props.snapshot.location.summary}</span>
      </header>
      <table className="governance-table">
        <caption>{props.caption}</caption>
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Baseline</th>
            <th scope="col">Diff posture</th>
            <th scope="col">Next safe action</th>
          </tr>
        </thead>
        <tbody>
          {props.snapshot.objectRows.map((row) => (
            <tr key={row.objectId} data-selected={row.objectId === props.snapshot.selectedObject.objectId}>
              <td>{row.label}</td>
              <td>{row.baselineLabel}</td>
              <td>{row.summary}</td>
              <td>{row.nextSafeAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ReleaseSurface(props: { snapshot: GovernanceShellSnapshot }) {
  return (
    <section className="governance-panel" data-testid="governance-release-surface">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">ReleaseFreezeTupleCard</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
      </header>
      <div className="governance-tuple-grid">
        <article className="governance-tuple-card">
          <strong>Freeze</strong>
          <p>{props.snapshot.releaseTuple.freezeLabel}</p>
        </article>
        <article className="governance-tuple-card">
          <strong>Publication</strong>
          <p>{props.snapshot.releaseTuple.publicationState}</p>
        </article>
        <article className="governance-tuple-card">
          <strong>Compatibility</strong>
          <p>{props.snapshot.releaseTuple.compatibilityState}</p>
        </article>
      </div>
      <table className="governance-table">
        <caption>Release watch posture</caption>
        <tbody>
          <tr>
            <th scope="row">Watch state</th>
            <td>{props.snapshot.releaseTuple.watchState}</td>
          </tr>
          <tr>
            <th scope="row">Blast radius</th>
            <td>{props.snapshot.releaseTuple.blastRadiusLabel}</td>
          </tr>
          <tr>
            <th scope="row">Continuity impact</th>
            <td>{props.snapshot.releaseTuple.continuityImpactLabel}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function MainSurface(props: { snapshot: GovernanceShellSnapshot; onNavigate: (path: string) => void }) {
  switch (props.snapshot.location.routeKey) {
    case "governance_home":
      return <LandingSurface snapshot={props.snapshot} onNavigate={props.onNavigate} />;
    case "governance_tenants":
      return <MatrixSurface snapshot={props.snapshot} />;
    case "governance_authority_links":
      return <AuthoritySurface snapshot={props.snapshot} />;
    case "governance_compliance":
      return <ComplianceSurface snapshot={props.snapshot} />;
    case "governance_records":
      return <RecordsSurface snapshot={props.snapshot} />;
    case "access_home":
    case "access_users":
    case "access_roles":
    case "access_reviews":
      return <AccessSurface snapshot={props.snapshot} />;
    case "config_home":
      return <ChangeEnvelopeSurface snapshot={props.snapshot} caption="Configuration overview" />;
    case "config_bundles":
      return <ChangeEnvelopeSurface snapshot={props.snapshot} caption="Policy bundles" />;
    case "config_promotions":
      return <ChangeEnvelopeSurface snapshot={props.snapshot} caption="Promotion review" />;
    case "comms_home":
      return <ChangeEnvelopeSurface snapshot={props.snapshot} caption="Communications overview" />;
    case "comms_templates":
      return <ChangeEnvelopeSurface snapshot={props.snapshot} caption="Template review" />;
    case "release_home":
      return <ReleaseSurface snapshot={props.snapshot} />;
  }
}

function SupportRegion(props: {
  snapshot: GovernanceShellSnapshot;
  state: GovernanceShellState;
  onSetSupportRegion: (supportRegion: GovernanceSupportRegion) => void;
  onNavigate: (path: string) => void;
  onReturn: () => void;
  onAcknowledge: () => void;
}) {
  const reviewPath = reviewRouteForLocation(props.snapshot.location);
  return (
    <aside className="governance-shell__aside" aria-label="Governance support region">
      <section className="governance-panel">
        <header className="governance-panel__header">
          <div>
            <p className="governance-panel__eyebrow">Promoted support region</p>
            <h2>{props.snapshot.supportHeadline}</h2>
          </div>
        </header>
        <p className="governance-panel__lede">{props.snapshot.supportSummary}</p>
        <div className="governance-support-switcher" aria-label="Support regions">
          {(["impact", "approval", "evidence", "release", "access"] as const).map((region) => (
            <button
              key={region}
              type="button"
              className="governance-chip"
              data-testid={`governance-support-${region}`}
              data-active={props.snapshot.supportRegion === region}
              onClick={() => props.onSetSupportRegion(region)}
            >
              {titleCase(region)}
            </button>
          ))}
        </div>
        {props.snapshot.supportRegion === "impact" ? (
          <ul className="governance-summary-list" data-testid="governance-impact-preview">
            {props.snapshot.impactItems.map((item) => (
              <li key={item.impactId}>
                <strong>{item.title}</strong>
                <span>{item.effectLabel}</span>
                <small>{item.summary}</small>
              </li>
            ))}
          </ul>
        ) : null}
        {props.snapshot.supportRegion === "approval" ? (
          <ol className="governance-stepper" data-testid="governance-approval-stepper">
            {props.snapshot.approvalSteps.map((step) => (
              <li key={step.stepId} data-tone={statusTone(step.state)}>
                <strong>{step.label}</strong>
                <span>{titleCase(step.state)}</span>
                <small>{step.evidence}</small>
              </li>
            ))}
          </ol>
        ) : null}
        {props.snapshot.supportRegion === "evidence" ? (
          <table className="governance-table" data-testid="governance-evidence-panel">
            <caption>Evidence bundle posture</caption>
            <thead>
              <tr>
                <th scope="col">Bundle</th>
                <th scope="col">Owner</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {props.snapshot.evidenceRows.map((row) => (
                <tr key={row.controlId}>
                  <td>{row.title}</td>
                  <td>{row.owner}</td>
                  <td>{titleCase(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {props.snapshot.supportRegion === "release" ? (
          <section data-testid="governance-release-tuple">
            <dl className="governance-fact-grid">
              <div>
                <dt>Freeze</dt>
                <dd>{props.snapshot.releaseTuple.freezeLabel}</dd>
              </div>
              <div>
                <dt>Publication</dt>
                <dd>{props.snapshot.releaseTuple.publicationState}</dd>
              </div>
              <div>
                <dt>Watch</dt>
                <dd>{props.snapshot.releaseTuple.watchState}</dd>
              </div>
              <div>
                <dt>Compatibility</dt>
                <dd>{props.snapshot.releaseTuple.compatibilityState}</dd>
              </div>
            </dl>
          </section>
        ) : null}
        {props.snapshot.supportRegion === "access" ? (
          <table className="governance-table" data-testid="governance-access-preview">
            <caption>Effective access preview</caption>
            <tbody>
              <tr>
                <th scope="row">Subject or role</th>
                <td>{props.snapshot.selectedObject.label}</td>
              </tr>
              <tr>
                <th scope="row">Operational meaning</th>
                <td>{props.snapshot.selectedObject.summary}</td>
              </tr>
              <tr>
                <th scope="row">Approval burden</th>
                <td>{props.snapshot.selectedObject.approvalBurden}</td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="governance-panel governance-panel--decision" data-testid="governance-decision-dock">
        <header className="governance-panel__header">
          <div>
            <p className="governance-panel__eyebrow">DecisionDock</p>
            <h2>{props.snapshot.location.primaryActionLabel}</h2>
          </div>
        </header>
        <p className="governance-panel__lede">{props.snapshot.location.calmNextStep}</p>
        {props.snapshot.hasPendingReplacement ? (
          <div className="governance-inline-notice" data-testid="governance-review-notice">
            <strong>Review acknowledgement required.</strong>
            <span>The diff anchor stays visible until the promoted review is explicitly acknowledged.</span>
          </div>
        ) : null}
        <div className="governance-decision-actions">
          <button type="button" className="governance-button">
            {props.snapshot.location.primaryActionLabel}
          </button>
          {reviewPath ? (
            <button
              type="button"
              className="governance-button governance-button--ghost"
              data-testid="governance-open-review"
              onClick={() => props.onNavigate(reviewPath)}
            >
              Open promoted review
            </button>
          ) : null}
          {props.snapshot.hasPendingReplacement ? (
            <button
              type="button"
              className="governance-button governance-button--ghost"
              data-testid="governance-acknowledge-review"
              onClick={props.onAcknowledge}
            >
              Acknowledge promoted review
            </button>
          ) : null}
          {props.state.returnIntent ? (
            <button
              type="button"
              className="governance-link"
              data-testid="governance-return-button"
              onClick={props.onReturn}
            >
              {props.state.returnIntent.label}
            </button>
          ) : null}
        </div>
      </section>

      <section className="governance-panel">
        <header className="governance-panel__header">
          <div>
            <p className="governance-panel__eyebrow">Telemetry log</p>
            <h2>Recent governance events</h2>
          </div>
          <span>{props.state.telemetry.length} events</span>
        </header>
        <ol className="governance-telemetry-log" data-testid="governance-telemetry-log">
          {props.state.telemetry
            .slice(-5)
            .reverse()
            .map((event) => (
              <li key={event.eventId}>
                <strong>{event.eventName}</strong>
                <span>{event.summary}</span>
              </li>
            ))}
        </ol>
      </section>
    </aside>
  );
}

export function GovernanceShellSeedDocument(props: {
  state: GovernanceShellState;
  viewportWidth: number;
  onNavigate: (path: string) => void;
  onSelectObject: (objectId: string) => void;
  onSetDisposition: (disposition: GovernanceFreezeDisposition) => void;
  onSetSupportRegion: (supportRegion: GovernanceSupportRegion) => void;
  onReturn: () => void;
  onAcknowledge: () => void;
}) {
  const snapshot = resolveGovernanceShellSnapshot(props.state, props.viewportWidth);
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
    dominantActionRef:
      dominantActionBinding?.markerRef ?? automationProfile.dominantActionRef,
    artifactModeState: snapshot.artifactModeState,
    recoveryPosture: snapshot.recoveryPosture,
    visualizationAuthority: snapshot.visualizationAuthority,
    routeShellPosture:
      snapshot.recoveryPosture === "live"
        ? "shell_live"
        : `shell_${snapshot.recoveryPosture}`,
  });

  return (
    <div
      className={layoutClass(snapshot.layoutMode)}
      data-testid="governance-shell-root"
      data-layout-mode={snapshot.layoutMode}
      data-current-path={snapshot.location.pathname}
      data-selected-object-id={snapshot.selectedObject.objectId}
      data-support-region={snapshot.supportRegion}
      data-freeze-disposition={snapshot.freezeDisposition}
      data-reduced-motion="respect"
      {...rootAutomationAttributes}
    >
      <header className="governance-shell__header" role="banner">
        <ScopeRibbon snapshot={snapshot} />
        <StatusStrip snapshot={snapshot} onSetDisposition={props.onSetDisposition} />
      </header>

      <div className="governance-shell__frame">
        {snapshot.layoutMode === "three_plane" ? (
          <RouteRail
            snapshot={snapshot}
            onNavigate={props.onNavigate}
            onSelectObject={props.onSelectObject}
          />
        ) : null}

        <main className="governance-shell__main" role="main">
          {snapshot.layoutMode !== "three_plane" ? (
            <section className="governance-panel governance-panel--compact-rail">
              <header className="governance-panel__header">
                <div>
                  <p className="governance-panel__eyebrow">Continuity frame</p>
                  <h2>{snapshot.location.title}</h2>
                </div>
              </header>
              <nav className="governance-inline-nav" aria-label="Governance routes">
                {listGovernanceRoutes().map((route) => (
                  <button
                    key={route.pathname}
                    type="button"
                    className="governance-chip"
                    data-testid={`governance-route-${route.routeKey}`}
                    data-active={route.pathname === snapshot.location.pathname}
                    onClick={() => props.onNavigate(route.pathname)}
                  >
                    {route.title}
                  </button>
                ))}
              </nav>
              <div className="governance-shell__object-list governance-shell__object-list--compact">
                {snapshot.objectRows.map((row) => (
                  <button
                    key={row.objectId}
                    type="button"
                    className="governance-shell__object-row"
                    data-tone={row.statusTone}
                    data-selected={row.objectId === snapshot.selectedObject.objectId}
                    data-testid={`governance-object-${row.objectId}`}
                    onClick={() => props.onSelectObject(row.objectId)}
                    {...(selectedAnchorBinding && row.objectId === snapshot.selectedObject.objectId
                      ? buildAutomationAnchorElementAttributes(selectedAnchorBinding, {
                          instanceKey: row.objectId,
                        })
                      : {})}
                  >
                    <strong>{row.label}</strong>
                    <span>{row.kind}</span>
                    <small>{row.summary}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {snapshot.layoutMode === "three_plane" ? (
            <section className="governance-panel governance-panel--selection-strip">
              <header className="governance-panel__header">
                <div>
                  <p className="governance-panel__eyebrow">Selected anchor</p>
                  <h2>{snapshot.reviewHeadline}</h2>
                </div>
              </header>
              <div
                className="governance-inline-notice"
                data-testid="governance-selected-anchor"
                {...(selectedAnchorBinding
                  ? buildAutomationAnchorElementAttributes(selectedAnchorBinding, {
                      instanceKey: snapshot.selectedObject.objectId,
                    })
                  : {})}
              >
                <strong>{props.state.continuitySnapshot.selectedAnchor.lastKnownLabel}</strong>
                <span>{snapshot.location.summary}</span>
              </div>
            </section>
          ) : null}

          <MainSurface snapshot={snapshot} onNavigate={props.onNavigate} />

          <section className="governance-panel">
            <header className="governance-panel__header">
              <div>
                <p className="governance-panel__eyebrow">GovernanceShellConsistencyProjection</p>
                <h2>Continuity and tuple summary</h2>
              </div>
            </header>
            <dl className="governance-fact-grid">
              <div>
                <dt>Review package</dt>
                <dd>{snapshot.selectedObject.baselineLabel}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{snapshot.selectedObject.ownerLabel}</dd>
              </div>
              <div>
                <dt>Evidence age</dt>
                <dd>{snapshot.selectedObject.evidenceAge}</dd>
              </div>
              <div>
                <dt>Standards version</dt>
                <dd>{snapshot.scopeToken.standardsVersion}</dd>
              </div>
            </dl>
            {focusRestoreBinding ? (
              <button
                type="button"
                className="governance-link"
                data-testid="governance-focus-restore"
                {...buildAutomationAnchorElementAttributes(focusRestoreBinding, {
                  instanceKey: snapshot.selectedObject.objectId,
                })}
              >
                {props.state.continuitySnapshot.focusRestoreTargetRef}
              </button>
            ) : null}
          </section>
        </main>

        <SupportRegion
          snapshot={snapshot}
          state={props.state}
          onSetSupportRegion={props.onSetSupportRegion}
          onNavigate={props.onNavigate}
          onReturn={props.onReturn}
          onAcknowledge={props.onAcknowledge}
        />
      </div>
    </div>
  );
}

export function GovernanceShellSeedApp() {
  const [state, setState] = useState(() => createInitialGovernanceShellState(currentPathname()));
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const handlePopState = () => {
      startTransition(() => {
        setState((current) => navigateGovernanceShell(current, currentPathname()));
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

  function navigate(path: string) {
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    startTransition(() => {
      setState((current) => navigateGovernanceShell(current, path));
    });
  }

  return (
    <GovernanceShellSeedDocument
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={navigate}
      onSelectObject={(objectId) =>
        startTransition(() => {
          setState((current) => selectGovernanceObject(current, objectId));
        })
      }
      onSetDisposition={(disposition) =>
        startTransition(() => {
          setState((current) => setGovernanceFreezeDisposition(current, disposition));
        })
      }
      onSetSupportRegion={(supportRegion) =>
        startTransition(() => {
          setState((current) => setGovernanceSupportRegion(current, supportRegion));
        })
      }
      onReturn={() =>
        startTransition(() => {
          setState((current) => {
            const returned = returnFromGovernanceReview(current);
            if (typeof window !== "undefined") {
              window.history.pushState({}, "", returned.location.pathname);
            }
            return returned;
          });
        })
      }
      onAcknowledge={() =>
        startTransition(() => {
          setState((current) => acknowledgeGovernanceReview(current));
        })
      }
    />
  );
}
