import React, { startTransition, useEffect, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";
import {
  buildAutomationAnchorElementAttributes,
  buildAutomationSurfaceAttributes,
  resolveAutomationAnchorProfile,
} from "@vecells/persistent-shell";
import {
  BACKUP_RESTORE_CHANNEL_VISUAL_MODE,
  OPERATIONAL_DESTINATION_VISUAL_MODE,
  SECURITY_COMPLIANCE_EXPORT_VISUAL_MODE,
  applyPhase9LiveProjectionFixture,
  backupDatasetScopeOptions,
  backupSecretRefForScope,
  createBackupRestoreChannelRegistryProjection,
  createBackupTargetSyntheticPayload,
  createComplianceExportSyntheticPayload,
  createDestinationSyntheticPayload,
  createLivePhase9ProjectionGatewayProjection,
  createOperationalDestinationRegistryProjection,
  createRestoreReportSyntheticPayload,
  createSecurityComplianceExportRegistryProjection,
  createSecurityReportingSyntheticPayload,
  exportDestinationClassOptions,
  normalizeBackupRestoreScenarioState,
  normalizeOperationalDestinationScenarioState,
  normalizePhase9LiveGatewayScenarioState,
  normalizeSecurityComplianceExportScenarioState,
  operationalDestinationClassOptions,
  phase9LiveSurfaceCodeForPath,
  requiredExportArtifactClasses,
  restoreReportSecretRefForChannel,
  secretRefForExportDestination,
  secretRefForOperationalDestination,
  type BackupDatasetScope,
  type BackupRestoreChannelRegistryProjection,
  type BackupRestoreScenarioState,
  type BackupTargetBinding,
  type ExportArtifactClass,
  type ExportDestinationClass,
  type ExportFrameworkCode,
  type GovernedExportDestinationBinding,
  type LivePhase9ProjectionGatewayProjection,
  type OperationalDestinationBinding,
  type OperationalDestinationClass,
  type OperationalDestinationRegistryProjection,
  type OperationalDestinationScenarioState,
  type Phase9LiveGatewayScenarioState,
  type RestoreReportChannelBinding,
  type SecurityComplianceExportRegistryProjection,
  type SecurityComplianceExportScenarioState,
  type SecurityReportingDestinationBinding,
} from "../../../packages/domains/operations/src/index";
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
import {
  createRecordsGovernanceProjection,
  normalizeRecordsGovernanceScenarioState,
  type RecordsGovernanceActionProjection,
  type RecordsGovernanceArtifactStageProjection,
  type RecordsGovernanceProjection,
} from "./records-governance-phase9.model";
import {
  createTenantGovernanceProjection,
  normalizeTenantGovernanceMatrixFilter,
  normalizeTenantGovernanceScenarioState,
  type TenantGovernanceActionProjection,
  type TenantGovernanceMatrixFilter,
  type TenantGovernanceProjection,
  type TenantGovernanceWatchlistFinding,
} from "./tenant-governance-phase9.model";
import {
  createRoleScopeStudioProjection,
  normalizeRoleScopeStudioScenarioState,
  type AccessPreviewArtifactMaskProjection,
  type BreakGlassElevationSummaryProjection,
  type DeniedActionExplainerProjection,
  type EffectiveAccessPreviewProjection,
  type GovernanceRoleScopeStudioProjection,
  type GovernanceReturnContextStripProjection,
  type GovernanceScopeRibbonProjection,
  type ReleaseFreezeCardProjection,
  type RoleGrantMatrixProjection,
  type RoleScopeStudioActionProjection,
  type ScopeTupleInspectorProjection,
} from "./role-scope-studio-phase9.model";
import {
  createFinalSignoff477Projection,
  normalizeFinalSignoff477ExceptionFilter,
  normalizeFinalSignoff477ScenarioState,
  type FinalSignoff477EvidenceProjection,
  type FinalSignoff477ExceptionFilter,
} from "./final-signoff-cockpit-477.model";

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

function currentRecordsScenarioState(): string {
  if (typeof window === "undefined") {
    return "normal";
  }
  return normalizeRecordsGovernanceScenarioState(
    new URLSearchParams(window.location.search).get("state"),
  );
}

function currentTenantGovernanceScenarioState(): string {
  if (typeof window === "undefined") {
    return "normal";
  }
  return normalizeTenantGovernanceScenarioState(
    new URLSearchParams(window.location.search).get("state"),
  );
}

function currentTenantGovernanceMatrixFilter(): TenantGovernanceMatrixFilter {
  if (typeof window === "undefined") {
    return "all";
  }
  return normalizeTenantGovernanceMatrixFilter(
    new URLSearchParams(window.location.search).get("filter"),
  );
}

function currentRoleScopeStudioScenarioState(): string {
  if (typeof window === "undefined") {
    return "normal";
  }
  return normalizeRoleScopeStudioScenarioState(
    new URLSearchParams(window.location.search).get("state"),
  );
}

function currentOperationalDestinationScenarioState(): OperationalDestinationScenarioState {
  if (typeof window === "undefined") {
    return "normal";
  }
  return normalizeOperationalDestinationScenarioState(
    new URLSearchParams(window.location.search).get("state"),
  );
}

function currentBackupRestoreScenarioState(): BackupRestoreScenarioState {
  if (typeof window === "undefined") {
    return "normal";
  }
  return normalizeBackupRestoreScenarioState(
    new URLSearchParams(window.location.search).get("backupState") ??
      new URLSearchParams(window.location.search).get("state"),
  );
}

function currentSecurityComplianceExportScenarioState(): SecurityComplianceExportScenarioState {
  if (typeof window === "undefined") {
    return "normal";
  }
  const params = new URLSearchParams(window.location.search);
  return normalizeSecurityComplianceExportScenarioState(
    params.get("exportState") ?? params.get("state"),
  );
}

function currentPhase9LiveScenarioState(): Phase9LiveGatewayScenarioState {
  if (typeof window === "undefined") {
    return "normal";
  }
  const params = new URLSearchParams(window.location.search);
  return normalizePhase9LiveGatewayScenarioState(params.get("liveState") ?? params.get("state"));
}

function currentFinalSignoff477ScenarioState(): string {
  if (typeof window === "undefined") {
    return "ready_with_constraints";
  }
  const params = new URLSearchParams(window.location.search);
  return normalizeFinalSignoff477ScenarioState(
    params.get("signoffState") ?? params.get("state") ?? params.get("releaseSignoffState"),
  );
}

function currentFinalSignoff477ExceptionFilter(): FinalSignoff477ExceptionFilter {
  if (typeof window === "undefined") {
    return "all";
  }
  const params = new URLSearchParams(window.location.search);
  return normalizeFinalSignoff477ExceptionFilter(params.get("signoffFilter"));
}

function automationId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function compactHash(value: string): string {
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
}

function recordsActionTone(action: RecordsGovernanceActionProjection): string {
  if (action.allowed) return "success";
  if (action.settlementState === "pending" || action.settlementState === "requires_revalidation") {
    return "caution";
  }
  return "critical";
}

function tenantGovernanceActionTone(action: TenantGovernanceActionProjection): string {
  if (action.allowed) return "success";
  if (action.gateState === "review_required" || action.gateState === "settlement_pending") {
    return "caution";
  }
  return "critical";
}

function tenantFindingTone(finding: TenantGovernanceWatchlistFinding): string {
  if (finding.severity === "blocking") return "critical";
  if (finding.severity === "legacy") return "caution";
  return "info";
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
      <div
        className="governance-status-strip__message"
        data-tone={freezeTone(props.snapshot.freezeDisposition)}
      >
        <strong>{titleCase(props.snapshot.freezeDisposition)}</strong>
        <span>{props.snapshot.scopeToken.driftSummary}</span>
      </div>
      <div
        className="governance-status-strip__toggles"
        data-testid="governance-disposition-controls"
      >
        {(["writable", "review_only", "scope_drift", "freeze_conflict"] as const).map(
          (disposition) => (
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
          ),
        )}
      </div>
    </section>
  );
}

function LandingSurface(props: {
  snapshot: GovernanceShellSnapshot;
  onNavigate: (path: string) => void;
}) {
  return (
    <section
      className="governance-panel governance-panel--hero"
      data-testid="governance-landing-surface"
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">Governance foyer</p>
          <h2>{props.snapshot.location.title}</h2>
        </div>
        <span className="governance-panel__meta">{props.snapshot.location.summary}</span>
      </header>
      <div className="governance-hero-grid">
        <article
          className="governance-hero-callout"
          data-tone={statusTone(props.snapshot.selectedObject.statusTone)}
        >
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
            <tr
              key={row.objectId}
              data-selected={row.objectId === props.snapshot.selectedObject.objectId}
            >
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

function destinationTone(status: string): string {
  switch (status) {
    case "verified":
    case "ready":
    case "delivered":
      return "success";
    case "stale":
    case "failed":
      return "caution";
    case "missing_secret":
    case "denied_scope":
    case "blocked":
    case "permission_denied":
      return "critical";
    default:
      return "info";
  }
}

function DestinationDownstreamReadinessStrip(props: {
  projection: OperationalDestinationRegistryProjection;
}) {
  return (
    <section
      className="destination-readiness-strip"
      data-testid="destination-downstream-readiness-strip"
      data-ready-count={props.projection.readyCount}
      data-blocked-count={props.projection.blockedCount}
      aria-label="Destination downstream readiness"
    >
      {props.projection.downstreamReadiness.map((readiness) => (
        <article
          key={readiness.surface}
          data-testid={`destination-readiness-${readiness.surface}`}
          data-surface={readiness.surface}
          data-route={readiness.route}
          data-readiness-state={readiness.readinessState}
          data-tone={destinationTone(readiness.readinessState)}
        >
          <strong>{titleCase(readiness.surface)}</strong>
          <span>{titleCase(readiness.readinessState)}</span>
          <small>{readiness.summary}</small>
        </article>
      ))}
    </section>
  );
}

function DestinationBindingTable(props: {
  projection: OperationalDestinationRegistryProjection;
  onSelect: (binding: OperationalDestinationBinding) => void;
}) {
  return (
    <section
      className="destination-ledger-table"
      data-testid="destination-binding-table"
      aria-label="Destination binding table"
    >
      <table className="governance-table">
        <caption>Operational destination bindings</caption>
        <thead>
          <tr>
            <th scope="col">Destination</th>
            <th scope="col">Purpose</th>
            <th scope="col">Threshold</th>
            <th scope="col">Verification</th>
            <th scope="col">Fallback</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.bindings.map((binding) => (
            <tr
              key={binding.bindingId}
              data-selected={binding.bindingId === props.projection.selectedBindingId}
              data-verification-state={binding.lastVerification.status}
              data-delivery-result={binding.settlement.result}
            >
              <th scope="row">
                <button
                  type="button"
                  className="destination-row-button"
                  data-testid={`destination-row-${automationId(binding.destinationClass)}`}
                  onClick={() => props.onSelect(binding)}
                >
                  {binding.label}
                </button>
                <small>{binding.eventClass}</small>
              </th>
              <td>{binding.purpose}</td>
              <td>{titleCase(binding.severityThreshold)}</td>
              <td>
                <span data-tone={destinationTone(binding.lastVerification.status)}>
                  {titleCase(binding.lastVerification.status)}
                </span>
                <small>{binding.lastVerification.verificationId}</small>
              </td>
              <td>{binding.fallbackBindingId ?? "Self fallback"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DestinationErrorSummary(props: { errors: readonly string[] }) {
  if (props.errors.length === 0) {
    return null;
  }
  return (
    <section
      className="destination-error-summary"
      data-testid="destination-error-summary"
      role="alert"
      tabIndex={-1}
      aria-labelledby="destination-error-summary-title"
    >
      <h3 id="destination-error-summary-title">There is a problem</h3>
      <ul>
        {props.errors.map((error) => (
          <li key={error}>
            <a href="#destination-secret-ref-input">{error}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DestinationFakeReceiverLedger(props: {
  projection: OperationalDestinationRegistryProjection;
}) {
  return (
    <section
      className="destination-ledger-receiver"
      data-testid="destination-fake-receiver-ledger"
      aria-label="Fake receiver ledger"
    >
      <header>
        <p className="governance-panel__eyebrow">Fake receiver</p>
        <h3>Verification receiver log</h3>
      </header>
      <table className="governance-table">
        <caption>Fake receiver records</caption>
        <thead>
          <tr>
            <th scope="col">Receiver</th>
            <th scope="col">Accepted</th>
            <th scope="col">Payload hash</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.fakeReceiverRecords.map((record) => (
            <tr key={record.receiverRecordId} data-response-code={record.responseCode}>
              <td>{record.receiverRef}</td>
              <td>{record.accepted ? "Accepted" : "Rejected"}</td>
              <td>{record.payloadHash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DestinationRedactionSecretRail(props: { binding: OperationalDestinationBinding }) {
  return (
    <aside
      className="destination-redaction-rail"
      data-testid="destination-redaction-secret-rail"
      data-secret-inline="false"
      data-redaction-policy-hash={props.binding.redactionPolicyHash}
      aria-label="Destination redaction and secret references"
    >
      <header>
        <p className="governance-panel__eyebrow">Redaction and vault references</p>
        <h3>{props.binding.label}</h3>
      </header>
      <dl className="governance-fact-grid">
        <div>
          <dt>Secret ref</dt>
          <dd>{props.binding.secretRef || "Missing vault reference"}</dd>
        </div>
        <div>
          <dt>Redaction</dt>
          <dd>{props.binding.redactionPolicy.policyHash}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{titleCase(props.binding.redactionPolicy.mode)}</dd>
        </div>
        <div>
          <dt>Fail closed</dt>
          <dd>Stale secret, policy, publication, or verification</dd>
        </div>
      </dl>
      <ul className="destination-policy-list">
        {props.binding.redactionPolicy.disallowedFields.map((field) => (
          <li key={field}>{field}</li>
        ))}
      </ul>
    </aside>
  );
}

function OperationalDestinationConfigSurface(props: { snapshot: GovernanceShellSnapshot }) {
  const [scenarioState, setScenarioState] = useState<OperationalDestinationScenarioState>(() =>
    currentOperationalDestinationScenarioState(),
  );
  const [tenantRef, setTenantRef] = useState("tenant-demo-gp");
  const [environmentRef, setEnvironmentRef] = useState("local");
  const [destinationClass, setDestinationClass] = useState<OperationalDestinationClass>(
    "service_level_breach_risk_alert",
  );
  const [secretRef, setSecretRef] = useState(() =>
    currentOperationalDestinationScenarioState() === "missing_secret"
      ? ""
      : secretRefForOperationalDestination("service_level_breach_risk_alert"),
  );
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [liveMessage, setLiveMessage] = useState("No verification action has run in this session.");
  const [sessionVerificationState, setSessionVerificationState] = useState("pending");

  const projection = createOperationalDestinationRegistryProjection({
    scenarioState,
    tenantRef,
    environmentRef,
    destinationClass,
    secretRefOverride: secretRef,
  });
  const selectedBinding = projection.selectedBinding;

  function selectBinding(binding: OperationalDestinationBinding) {
    setDestinationClass(binding.destinationClass);
    setSecretRef(
      binding.secretRef ||
        secretRefForOperationalDestination(binding.destinationClass, tenantRef, environmentRef),
    );
    setErrors([]);
    setLiveMessage(`${binding.label} selected for verification.`);
  }

  function setScenario(next: string) {
    const normalized = normalizeOperationalDestinationScenarioState(next);
    setScenarioState(normalized);
    setSecretRef(
      normalized === "missing_secret"
        ? ""
        : secretRefForOperationalDestination(destinationClass, tenantRef, environmentRef),
    );
    setSessionVerificationState("pending");
    setErrors([]);
  }

  function setTenant(nextTenantRef: string) {
    setTenantRef(nextTenantRef);
    setSecretRef(
      secretRefForOperationalDestination(destinationClass, nextTenantRef, environmentRef),
    );
  }

  function setEnvironment(nextEnvironmentRef: string) {
    setEnvironmentRef(nextEnvironmentRef);
    setSecretRef(
      secretRefForOperationalDestination(destinationClass, tenantRef, nextEnvironmentRef),
    );
  }

  function setDestination(nextClass: string) {
    const option = operationalDestinationClassOptions.find((item) => item.value === nextClass);
    if (!option) {
      return;
    }
    setDestinationClass(option.value);
    setSecretRef(secretRefForOperationalDestination(option.value, tenantRef, environmentRef));
    setErrors([]);
  }

  async function verifyDelivery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: string[] = [];
    if (!secretRef.trim()) {
      nextErrors.push("Enter a vault reference before testing delivery.");
    }
    if (scenarioState === "denied_scope") {
      nextErrors.push("Select a tenant and environment within the operator scope.");
    }
    if (scenarioState === "permission_denied") {
      nextErrors.push("The current operator cannot configure this destination scope.");
    }
    if (scenarioState === "stale_destination") {
      nextErrors.push("Refresh the runtime publication binding before testing delivery.");
    }
    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      setSessionVerificationState(selectedBinding.lastVerification.status);
      setLiveMessage(nextErrors[0] ?? "Destination verification blocked.");
      return;
    }
    const response = await fetch("/phase9/fake-alert-receiver", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createDestinationSyntheticPayload(selectedBinding)),
    });
    const delivery = (await response.json().catch(() => ({ accepted: response.ok }))) as {
      accepted?: boolean;
    };
    if (!response.ok || delivery.accepted === false) {
      setErrors(["Fake receiver rejected the delivery; fallback route remains required."]);
      setSessionVerificationState("failed");
      setLiveMessage("Delivery failed and fallback route was retained.");
      return;
    }
    setScenarioState("normal");
    setErrors([]);
    setSessionVerificationState("verified");
    setLiveMessage("Delivery verified by the fake receiver and readiness projections refreshed.");
  }

  return (
    <section
      className="governance-panel operational-destination-config"
      data-testid="operational-destination-config-surface"
      data-visual-mode={OPERATIONAL_DESTINATION_VISUAL_MODE}
      data-scenario-state={projection.scenarioState}
      data-selected-binding-id={projection.selectedBindingId}
      data-selected-destination-class={selectedBinding.destinationClass}
      data-verification-state={
        sessionVerificationState === "pending"
          ? selectedBinding.lastVerification.status
          : sessionVerificationState
      }
      data-ready-count={projection.readyCount}
      data-blocked-count={projection.blockedCount}
      data-registry-hash={projection.registryHash}
      aria-label="Operational destination configuration"
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">OperationalDestinationBinding</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
        <span className="governance-panel__meta">{props.snapshot.location.summary}</span>
      </header>

      <section
        className="destination-scope-ribbon"
        data-testid="destination-scope-ribbon"
        data-tenant-ref={projection.tenantRef}
        data-environment-ref={projection.environmentRef}
        aria-label="Destination scope"
      >
        <dl className="governance-fact-grid">
          <div>
            <dt>Tenant</dt>
            <dd>{projection.tenantRef}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>{projection.environmentRef}</dd>
          </div>
          <div>
            <dt>Registry</dt>
            <dd>{projection.registryHash}</dd>
          </div>
          <div>
            <dt>Gap ref</dt>
            <dd>{projection.interfaceGapArtifactRef}</dd>
          </div>
        </dl>
      </section>

      <DestinationDownstreamReadinessStrip projection={projection} />

      <DestinationErrorSummary errors={errors} />

      <div className="destination-config-grid">
        <form
          className="destination-binding-wizard"
          data-testid="destination-binding-wizard"
          onSubmit={verifyDelivery}
          aria-describedby="destination-verify-live"
        >
          <div className="destination-form-grid">
            <label>
              <span>Fixture state</span>
              <select
                data-testid="destination-fixture-state"
                value={scenarioState}
                onChange={(event) => setScenario(event.target.value)}
              >
                {[
                  "normal",
                  "missing_secret",
                  "denied_scope",
                  "stale_destination",
                  "delivery_failed",
                  "permission_denied",
                ].map((state) => (
                  <option key={state} value={state}>
                    {titleCase(state)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tenant</span>
              <select
                data-testid="destination-tenant-select"
                value={tenantRef}
                onChange={(event) => setTenant(event.target.value)}
              >
                <option value="tenant-demo-gp">tenant-demo-gp</option>
                <option value="tenant-assurance-lab">tenant-assurance-lab</option>
              </select>
            </label>
            <label>
              <span>Environment</span>
              <select
                data-testid="destination-environment-select"
                value={environmentRef}
                onChange={(event) => setEnvironment(event.target.value)}
              >
                <option value="local">local</option>
                <option value="preview">preview</option>
                <option value="integration">integration</option>
              </select>
            </label>
            <label>
              <span>Destination class</span>
              <select
                data-testid="destination-class-select"
                value={destinationClass}
                onChange={(event) => setDestination(event.target.value)}
              >
                {operationalDestinationClassOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="destination-secret-input">
              <span>Secret ref</span>
              <input
                id="destination-secret-ref-input"
                data-testid="destination-secret-ref-input"
                value={secretRef}
                onChange={(event) => setSecretRef(event.target.value)}
                aria-invalid={errors.length > 0 && !secretRef.trim()}
              />
            </label>
          </div>
          <div className="destination-form-actions">
            <button
              type="submit"
              className="governance-button"
              data-testid="destination-test-delivery-action"
            >
              Test delivery
            </button>
            <p
              id="destination-verify-live"
              data-testid="destination-verify-live"
              aria-live="polite"
            >
              {liveMessage}
            </p>
          </div>
        </form>
        <DestinationRedactionSecretRail binding={selectedBinding} />
      </div>

      <DestinationBindingTable projection={projection} onSelect={selectBinding} />
      <DestinationFakeReceiverLedger projection={projection} />
    </section>
  );
}

function backupRestoreTone(status: string): string {
  switch (status) {
    case "verified":
    case "delivered":
    case "ready":
    case "live_control":
    case "current":
      return "success";
    case "pending_creation":
    case "stale_checksum":
    case "stale":
    case "diagnostic":
    case "diagnostic_only":
      return "caution";
    case "missing_secret":
    case "missing_immutability_proof":
    case "unsupported_scope":
    case "tuple_drift":
    case "blocked":
    case "failed":
    case "withdrawn":
      return "critical";
    default:
      return "info";
  }
}

function BackupRestoreReadinessStrip(props: {
  projection: BackupRestoreChannelRegistryProjection;
}) {
  const readiness = props.projection.readiness;
  const readinessCards: readonly {
    readonly label: string;
    readonly state: string;
    readonly summary: string;
  }[] = [
    {
      label: "Readiness",
      state: readiness.readinessState,
      summary: readiness.summary,
    },
    {
      label: "Recovery controls",
      state: readiness.recoveryControlState,
      summary: "Live controls require current manifests, channels, and tuple hashes.",
    },
    {
      label: "Evidence pack",
      state: readiness.evidencePackState,
      summary: "Restore reports render through governed artifact presentation grants.",
    },
    {
      label: "Tuple",
      state: readiness.tupleState,
      summary: props.projection.registryHash,
    },
  ];
  return (
    <section
      className="backup-restore-readiness-strip"
      data-testid="backup-restore-readiness-strip"
      data-readiness-state={readiness.readinessState}
      data-recovery-control-state={readiness.recoveryControlState}
      data-evidence-pack-state={readiness.evidencePackState}
      data-tuple-state={readiness.tupleState}
      data-target-ready-count={readiness.targetReadyCount}
      data-target-blocked-count={readiness.targetBlockedCount}
      data-channel-ready-count={readiness.channelReadyCount}
      data-channel-blocked-count={readiness.channelBlockedCount}
      aria-label="Backup restore readiness"
    >
      {readinessCards.map((card) => (
        <article key={card.label} data-tone={backupRestoreTone(card.state)}>
          <strong>{card.label}</strong>
          <span>{titleCase(card.state)}</span>
          <small>{card.summary}</small>
        </article>
      ))}
    </section>
  );
}

function BackupTargetTable(props: {
  projection: BackupRestoreChannelRegistryProjection;
  onSelect: (binding: BackupTargetBinding) => void;
}) {
  return (
    <section
      className="backup-restore-table"
      data-testid="backup-target-table"
      aria-label="Backup target table"
    >
      <table className="governance-table">
        <caption>Backup target bindings</caption>
        <thead>
          <tr>
            <th scope="col">Dataset scope</th>
            <th scope="col">Essential functions</th>
            <th scope="col">Tier</th>
            <th scope="col">Verification</th>
            <th scope="col">Manifest</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.targetBindings.map((binding) => (
            <tr
              key={binding.bindingId}
              data-selected={binding.bindingId === props.projection.selectedTargetBindingId}
              data-target-verification-state={binding.latestVerificationRecord.status}
              data-binding-state={binding.bindingState}
            >
              <th scope="row">
                <button
                  type="button"
                  className="destination-row-button"
                  data-testid={`backup-target-row-${automationId(binding.datasetScope)}`}
                  onClick={() => props.onSelect(binding)}
                >
                  {binding.label}
                </button>
                <small>{binding.datasetScope}</small>
              </th>
              <td>{binding.essentialFunctionRefs.map(titleCase).join(", ")}</td>
              <td>{binding.recoveryTierRefs.map(titleCase).join(", ")}</td>
              <td>
                <span data-tone={backupRestoreTone(binding.latestVerificationRecord.status)}>
                  {titleCase(binding.latestVerificationRecord.status)}
                </span>
                <small>{binding.latestVerificationRecord.verificationId}</small>
              </td>
              <td>{binding.backupSetManifestRef}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function RestoreReportChannelTable(props: {
  projection: BackupRestoreChannelRegistryProjection;
  onSelect: (channel: RestoreReportChannelBinding) => void;
}) {
  return (
    <section
      className="backup-restore-table"
      data-testid="restore-report-channel-table"
      aria-label="Restore report channel table"
    >
      <table className="governance-table">
        <caption>Restore report channel bindings</caption>
        <thead>
          <tr>
            <th scope="col">Channel</th>
            <th scope="col">Artifact types</th>
            <th scope="col">Recipients</th>
            <th scope="col">Settlement</th>
            <th scope="col">Policy</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.reportChannels.map((channel) => (
            <tr
              key={channel.channelId}
              data-selected={channel.channelId === props.projection.selectedChannelId}
              data-report-delivery-state={channel.latestSettlement.result}
              data-channel-state={channel.channelState}
            >
              <th scope="row">
                <button
                  type="button"
                  className="destination-row-button"
                  data-testid={`restore-channel-row-${automationId(channel.channelId)}`}
                  onClick={() => props.onSelect(channel)}
                >
                  {channel.label}
                </button>
                <small>{channel.destinationClass}</small>
              </th>
              <td>{channel.artifactTypes.map(titleCase).join(", ")}</td>
              <td>{channel.permittedRecipients.map(titleCase).join(", ")}</td>
              <td>
                <span data-tone={backupRestoreTone(channel.latestSettlement.result)}>
                  {titleCase(channel.latestSettlement.result)}
                </span>
                <small>{channel.latestSettlement.settlementId}</small>
              </td>
              <td>{channel.artifactPresentationPolicy.policyId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function BackupRestoreErrorSummary(props: { errors: readonly string[] }) {
  if (props.errors.length === 0) {
    return null;
  }
  return (
    <section
      className="backup-restore-error-summary"
      data-testid="backup-restore-error-summary"
      role="alert"
      tabIndex={-1}
      aria-labelledby="backup-restore-error-summary-title"
    >
      <h3 id="backup-restore-error-summary-title">There is a problem</h3>
      <ul>
        {props.errors.map((error) => (
          <li key={error}>
            <a
              href={
                error.includes("report")
                  ? "#restore-channel-secret-ref-input"
                  : "#backup-target-secret-ref-input"
              }
            >
              {error}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FakeBackupTargetLedger(props: { projection: BackupRestoreChannelRegistryProjection }) {
  return (
    <section
      className="backup-restore-ledger"
      data-testid="fake-backup-target-ledger"
      aria-label="Fake backup target ledger"
    >
      <header>
        <p className="governance-panel__eyebrow">Fake backup target</p>
        <h3>Checksum and immutability observations</h3>
      </header>
      <table className="governance-table">
        <caption>Fake backup target records</caption>
        <thead>
          <tr>
            <th scope="col">Target</th>
            <th scope="col">Accepted</th>
            <th scope="col">Payload hash</th>
            <th scope="col">Response</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.fakeBackupTargetRecords.map((record) => (
            <tr key={record.targetRecordId} data-response-code={record.responseCode}>
              <td>{record.targetRef}</td>
              <td>{record.accepted ? "Accepted" : "Blocked"}</td>
              <td>{record.payloadHash}</td>
              <td>{record.responseCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function FakeRestoreReportReceiverLedger(props: {
  projection: BackupRestoreChannelRegistryProjection;
}) {
  return (
    <section
      className="backup-restore-ledger"
      data-testid="fake-restore-report-receiver-ledger"
      aria-label="Fake restore report receiver ledger"
    >
      <header>
        <p className="governance-panel__eyebrow">Fake restore report receiver</p>
        <h3>Artifact delivery observations</h3>
      </header>
      <table className="governance-table">
        <caption>Fake restore report receiver records</caption>
        <thead>
          <tr>
            <th scope="col">Receiver</th>
            <th scope="col">Accepted</th>
            <th scope="col">Artifact</th>
            <th scope="col">Payload hash</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.fakeRestoreReportReceiverRecords.map((record) => (
            <tr key={record.receiverRecordId} data-response-code={record.responseCode}>
              <td>{record.receiverRef}</td>
              <td>{record.accepted ? "Accepted" : "Blocked"}</td>
              <td>{titleCase(record.payload.artifactType)}</td>
              <td>{record.payloadHash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function RecoveryArtifactPolicyRail(props: {
  channel: RestoreReportChannelBinding;
  target: BackupTargetBinding;
}) {
  return (
    <aside
      className="backup-restore-policy-rail"
      data-testid="recovery-artifact-policy-rail"
      data-no-raw-artifact-urls={String(
        !props.channel.artifactPresentationPolicy.rawObjectStoreUrlsAllowed,
      )}
      data-outbound-grant-required={String(
        props.channel.artifactPresentationPolicy.outboundGrantRequired,
      )}
      data-redaction-policy-hash={props.channel.maskingRedactionPolicyHash}
      aria-label="Recovery artifact channel policy"
    >
      <header>
        <p className="governance-panel__eyebrow">RecoveryArtifactChannelPolicy</p>
        <h3>{props.channel.label}</h3>
      </header>
      <dl className="governance-fact-grid">
        <div>
          <dt>Presentation</dt>
          <dd>{props.channel.artifactPresentationPolicy.presentationContractRef}</dd>
        </div>
        <div>
          <dt>Mode truth</dt>
          <dd>{props.channel.artifactPresentationPolicy.artifactModeTruthProjectionRef}</dd>
        </div>
        <div>
          <dt>Grant</dt>
          <dd>{props.channel.latestSettlement.presentationGrantRef}</dd>
        </div>
        <div>
          <dt>Retention</dt>
          <dd>{titleCase(props.channel.artifactPresentationPolicy.retentionClass)}</dd>
        </div>
        <div>
          <dt>Target vault</dt>
          <dd>{props.target.secretRef || "Missing vault reference"}</dd>
        </div>
        <div>
          <dt>Channel vault</dt>
          <dd>{props.channel.secretRef || "Missing vault reference"}</dd>
        </div>
        <div>
          <dt>Fallback</dt>
          <dd>{titleCase(props.channel.safeFallbackDisposition)}</dd>
        </div>
      </dl>
      <ul className="destination-policy-list">
        {props.channel.artifactTypes.map((artifactType) => (
          <li key={artifactType}>{titleCase(artifactType)}</li>
        ))}
      </ul>
    </aside>
  );
}

function BackupRestoreChannelConfigSurface(props: { snapshot: GovernanceShellSnapshot }) {
  const [scenarioState, setScenarioState] = useState<BackupRestoreScenarioState>(() =>
    currentBackupRestoreScenarioState(),
  );
  const [tenantRef, setTenantRef] = useState("tenant-demo-gp");
  const [environmentRef, setEnvironmentRef] = useState("local");
  const [releaseRef, setReleaseRef] = useState("release-wave-blue-42");
  const [datasetScope, setDatasetScope] = useState<BackupDatasetScope>("patient_intake_event_data");
  const [selectedChannelId, setSelectedChannelId] = useState("restore-channel-resilience-board");
  const [targetSecretRef, setTargetSecretRef] = useState(() =>
    currentBackupRestoreScenarioState() === "missing_secret"
      ? ""
      : backupSecretRefForScope("patient_intake_event_data"),
  );
  const [reportSecretRef, setReportSecretRef] = useState(() =>
    currentBackupRestoreScenarioState() === "missing_secret"
      ? ""
      : restoreReportSecretRefForChannel("restore-channel-resilience-board"),
  );
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [liveMessage, setLiveMessage] = useState(
    "No backup or report verification has run in this session.",
  );
  const [sessionTargetState, setSessionTargetState] = useState("pending");
  const [sessionReportState, setSessionReportState] = useState("pending");

  const projection = createBackupRestoreChannelRegistryProjection({
    scenarioState,
    tenantRef,
    environmentRef,
    releaseRef,
    selectedDatasetScope: datasetScope,
    selectedChannelId,
    targetSecretRefOverride: targetSecretRef,
    reportSecretRefOverride: reportSecretRef,
  });
  const selectedTarget = projection.selectedTargetBinding;
  const selectedChannel = projection.selectedChannel;

  function resetSecrets(nextDatasetScope: BackupDatasetScope, nextChannelId: string) {
    setTargetSecretRef(
      scenarioState === "missing_secret"
        ? ""
        : backupSecretRefForScope(nextDatasetScope, tenantRef, environmentRef),
    );
    setReportSecretRef(
      scenarioState === "missing_secret"
        ? ""
        : restoreReportSecretRefForChannel(nextChannelId, tenantRef, environmentRef),
    );
  }

  function setScenario(next: string) {
    const normalized = normalizeBackupRestoreScenarioState(next);
    setScenarioState(normalized);
    setTargetSecretRef(
      normalized === "missing_secret"
        ? ""
        : backupSecretRefForScope(datasetScope, tenantRef, environmentRef),
    );
    setReportSecretRef(
      normalized === "missing_secret"
        ? ""
        : restoreReportSecretRefForChannel(selectedChannelId, tenantRef, environmentRef),
    );
    setSessionTargetState("pending");
    setSessionReportState("pending");
    setErrors([]);
  }

  function setTenant(nextTenantRef: string) {
    setTenantRef(nextTenantRef);
    setTargetSecretRef(backupSecretRefForScope(datasetScope, nextTenantRef, environmentRef));
    setReportSecretRef(
      restoreReportSecretRefForChannel(selectedChannelId, nextTenantRef, environmentRef),
    );
  }

  function setEnvironment(nextEnvironmentRef: string) {
    setEnvironmentRef(nextEnvironmentRef);
    setTargetSecretRef(backupSecretRefForScope(datasetScope, tenantRef, nextEnvironmentRef));
    setReportSecretRef(
      restoreReportSecretRefForChannel(selectedChannelId, tenantRef, nextEnvironmentRef),
    );
  }

  function selectTarget(binding: BackupTargetBinding) {
    setDatasetScope(binding.datasetScope);
    setTargetSecretRef(
      binding.secretRef || backupSecretRefForScope(binding.datasetScope, tenantRef, environmentRef),
    );
    setErrors([]);
    setLiveMessage(`${binding.label} selected for backup target verification.`);
  }

  function selectChannel(channel: RestoreReportChannelBinding) {
    setSelectedChannelId(channel.channelId);
    setReportSecretRef(
      channel.secretRef ||
        restoreReportSecretRefForChannel(channel.channelId, tenantRef, environmentRef),
    );
    setErrors([]);
    setLiveMessage(`${channel.label} selected for restore report delivery.`);
  }

  function selectDatasetScope(nextScope: string) {
    const option = backupDatasetScopeOptions.find((item) => item.value === nextScope);
    if (!option) return;
    setDatasetScope(option.value);
    resetSecrets(option.value, selectedChannelId);
    setErrors([]);
  }

  async function verifyTarget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: string[] = [];
    if (!targetSecretRef.trim()) {
      nextErrors.push("Enter a backup target vault reference before verification.");
    }
    if (scenarioState === "unsupported_scope") {
      nextErrors.push("Select a supported tenant, environment, and essential-function scope.");
    }
    if (scenarioState === "stale_checksum") {
      nextErrors.push("Refresh the backup checksum and manifest proof before verification.");
    }
    if (scenarioState === "missing_immutability_proof") {
      nextErrors.push("Provide immutability proof before the backup target can be trusted.");
    }
    if (scenarioState === "tuple_drift") {
      nextErrors.push("Reconcile the recovery tuple hash before enabling live controls.");
    }
    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      setSessionTargetState(selectedTarget.latestVerificationRecord.status);
      setLiveMessage(nextErrors[0] ?? "Backup target verification blocked.");
      return;
    }
    const response = await fetch("/phase9/fake-backup-target", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createBackupTargetSyntheticPayload(selectedTarget)),
    });
    const delivery = (await response.json().catch(() => ({ accepted: response.ok }))) as {
      accepted?: boolean;
    };
    if (!response.ok || delivery.accepted === false) {
      setErrors(["Fake backup target rejected the checksum or immutability proof."]);
      setSessionTargetState("blocked");
      setLiveMessage("Backup target verification failed and recovery controls remain blocked.");
      return;
    }
    setScenarioState("normal");
    setErrors([]);
    setSessionTargetState("verified");
    setLiveMessage(
      "Backup target verified with checksum, immutability, and dependency digest proof.",
    );
  }

  async function testRestoreReportDelivery() {
    const nextErrors: string[] = [];
    if (!reportSecretRef.trim()) {
      nextErrors.push("Enter a restore report vault reference before delivery.");
    }
    if (scenarioState === "report_delivery_failed") {
      nextErrors.push("Fake restore report receiver rejected the governed artifact summary.");
    }
    if (scenarioState === "withdrawn_channel") {
      nextErrors.push(
        "Restore report channel is withdrawn and must use the human handoff fallback.",
      );
    }
    if (
      scenarioState === "stale_checksum" ||
      scenarioState === "missing_immutability_proof" ||
      scenarioState === "unsupported_scope" ||
      scenarioState === "tuple_drift" ||
      scenarioState === "target_creation"
    ) {
      nextErrors.push("Complete backup target verification before sending restore reports.");
    }
    if (nextErrors.length > 0 && scenarioState !== "report_delivery_failed") {
      setErrors(nextErrors);
      setSessionReportState(selectedChannel.latestSettlement.result);
      setLiveMessage(nextErrors[0] ?? "Restore report delivery blocked.");
      return;
    }
    const response = await fetch("/phase9/fake-restore-report-receiver", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createRestoreReportSyntheticPayload(selectedChannel)),
    });
    const delivery = (await response.json().catch(() => ({ accepted: response.ok }))) as {
      accepted?: boolean;
    };
    if (!response.ok || delivery.accepted === false || scenarioState === "report_delivery_failed") {
      setErrors(
        nextErrors.length > 0
          ? nextErrors
          : ["Fake restore report receiver rejected the governed artifact summary."],
      );
      setSessionReportState("failed");
      setLiveMessage(
        "Restore report delivery failed and the safe fallback disposition remains active.",
      );
      return;
    }
    setScenarioState("normal");
    setErrors([]);
    setSessionReportState("delivered");
    setLiveMessage("Restore report delivery settled through the governed artifact channel.");
  }

  return (
    <section
      className="governance-panel backup-restore-config"
      data-testid="backup-restore-config-surface"
      data-visual-mode={BACKUP_RESTORE_CHANNEL_VISUAL_MODE}
      data-scenario-state={projection.scenarioState}
      data-selected-target-binding-id={projection.selectedTargetBindingId}
      data-selected-dataset-scope={projection.selectedDatasetScope}
      data-selected-channel-id={projection.selectedChannelId}
      data-target-verification-state={
        sessionTargetState === "pending"
          ? selectedTarget.latestVerificationRecord.status
          : sessionTargetState
      }
      data-report-delivery-state={
        sessionReportState === "pending"
          ? selectedChannel.latestSettlement.result
          : sessionReportState
      }
      data-recovery-control-state={projection.readiness.recoveryControlState}
      data-readiness-state={projection.readiness.readinessState}
      data-registry-hash={projection.registryHash}
      data-no-raw-artifact-urls={String(projection.noRawArtifactUrls)}
      aria-label="Backup target and restore report channel configuration"
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">BackupRestoreChannelBinding</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
        <span className="governance-panel__meta">{props.snapshot.location.summary}</span>
      </header>

      <section
        className="backup-restore-scope-ribbon"
        data-testid="backup-restore-scope-ribbon"
        data-tenant-ref={projection.tenantRef}
        data-environment-ref={projection.environmentRef}
        data-release-ref={projection.releaseRef}
        aria-label="Backup restore scope"
      >
        <dl className="governance-fact-grid">
          <div>
            <dt>Tenant</dt>
            <dd>{projection.tenantRef}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>{projection.environmentRef}</dd>
          </div>
          <div>
            <dt>Release</dt>
            <dd>{projection.releaseRef}</dd>
          </div>
          <div>
            <dt>Gap ref</dt>
            <dd>{projection.interfaceGapArtifactRef}</dd>
          </div>
        </dl>
      </section>

      <BackupRestoreReadinessStrip projection={projection} />
      <BackupRestoreErrorSummary errors={errors} />

      <div className="backup-restore-config-grid">
        <form
          className="backup-restore-wizard"
          data-testid="backup-restore-wizard"
          onSubmit={verifyTarget}
          aria-describedby="backup-restore-live"
        >
          <div className="destination-form-grid">
            <label>
              <span>Fixture state</span>
              <select
                data-testid="backup-restore-fixture-state"
                value={scenarioState}
                onChange={(event) => setScenario(event.target.value)}
              >
                {[
                  "normal",
                  "target_creation",
                  "stale_checksum",
                  "missing_secret",
                  "missing_immutability_proof",
                  "report_delivery_failed",
                  "unsupported_scope",
                  "tuple_drift",
                  "withdrawn_channel",
                ].map((state) => (
                  <option key={state} value={state}>
                    {titleCase(state)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tenant</span>
              <select
                data-testid="backup-restore-tenant-select"
                value={tenantRef}
                onChange={(event) => setTenant(event.target.value)}
              >
                <option value="tenant-demo-gp">tenant-demo-gp</option>
                <option value="tenant-assurance-lab">tenant-assurance-lab</option>
              </select>
            </label>
            <label>
              <span>Environment</span>
              <select
                data-testid="backup-restore-environment-select"
                value={environmentRef}
                onChange={(event) => setEnvironment(event.target.value)}
              >
                <option value="local">local</option>
                <option value="preview">preview</option>
                <option value="integration">integration</option>
              </select>
            </label>
            <label>
              <span>Release</span>
              <select
                data-testid="backup-restore-release-select"
                value={releaseRef}
                onChange={(event) => setReleaseRef(event.target.value)}
              >
                <option value="release-wave-blue-42">release-wave-blue-42</option>
                <option value="release-recovery-green-17">release-recovery-green-17</option>
              </select>
            </label>
            <label>
              <span>Essential function</span>
              <select
                data-testid="backup-essential-function-select"
                value={datasetScope}
                onChange={(event) => selectDatasetScope(event.target.value)}
              >
                {backupDatasetScopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="destination-secret-input">
              <span>Backup target vault ref</span>
              <input
                id="backup-target-secret-ref-input"
                data-testid="backup-target-secret-ref-input"
                value={targetSecretRef}
                onChange={(event) => setTargetSecretRef(event.target.value)}
                aria-invalid={errors.some((error) => error.includes("backup target"))}
              />
            </label>
            <label className="destination-secret-input">
              <span>Restore report vault ref</span>
              <input
                id="restore-channel-secret-ref-input"
                data-testid="restore-channel-secret-ref-input"
                value={reportSecretRef}
                onChange={(event) => setReportSecretRef(event.target.value)}
                aria-invalid={errors.some((error) => error.includes("report"))}
              />
            </label>
          </div>
          <div className="destination-form-actions">
            <button
              type="submit"
              className="governance-button"
              data-testid="backup-target-verify-action"
            >
              Verify target
            </button>
            <button
              type="button"
              className="governance-button governance-button--secondary"
              data-testid="restore-channel-test-delivery-action"
              onClick={testRestoreReportDelivery}
            >
              Test report delivery
            </button>
            <p id="backup-restore-live" data-testid="backup-restore-live" aria-live="polite">
              {liveMessage}
            </p>
          </div>
        </form>
        <RecoveryArtifactPolicyRail channel={selectedChannel} target={selectedTarget} />
      </div>

      <BackupTargetTable projection={projection} onSelect={selectTarget} />
      <RestoreReportChannelTable projection={projection} onSelect={selectChannel} />
      <FakeBackupTargetLedger projection={projection} />
      <FakeRestoreReportReceiverLedger projection={projection} />
    </section>
  );
}

function securityComplianceExportTone(status: string): string {
  switch (status) {
    case "verified":
    case "delivered":
    case "ready":
    case "live":
    case "acknowledged":
      return "success";
    case "stale":
    case "stale_graph":
    case "stale_redaction_policy":
    case "pending":
    case "pending_reportability":
    case "reportability_pending":
      return "caution";
    case "missing":
    case "missing_secret":
    case "missing_destination":
    case "denied_scope":
    case "blocked":
    case "blocked_graph":
    case "blocked_redaction":
    case "failed":
    case "permission_denied":
      return "critical";
    default:
      return "info";
  }
}

function aggregateExportSourceReadiness(
  projection: SecurityComplianceExportRegistryProjection,
): string {
  if (projection.sourceReadiness.some((source) => source.readinessState === "permission_denied")) {
    return "permission_denied";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "blocked")) {
    return "blocked";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "stale")) {
    return "stale";
  }
  if (projection.sourceReadiness.some((source) => source.readinessState === "pending")) {
    return "pending";
  }
  return "ready";
}

function reportabilityHandoffState(binding: GovernedExportDestinationBinding): string {
  if (binding.destinationKind === "security_reporting") {
    return (binding as SecurityReportingDestinationBinding).reportabilityHandoffVerificationRecord
      .handoffState;
  }
  return "not_applicable";
}

function SecurityComplianceExportReadinessStrip(props: {
  projection: SecurityComplianceExportRegistryProjection;
}) {
  return (
    <section
      className="security-compliance-export-readiness-strip"
      data-testid="security-compliance-export-readiness-strip"
      data-source-readiness-state={aggregateExportSourceReadiness(props.projection)}
      data-ready-count={props.projection.readyCount}
      data-blocked-count={props.projection.blockedCount}
      data-stale-count={props.projection.staleCount}
      data-failed-count={props.projection.failedCount}
      data-permission-denied-count={props.projection.permissionDeniedCount}
      aria-label="Security compliance export readiness"
    >
      {props.projection.sourceReadiness.map((source) => (
        <article
          key={source.surface}
          data-tone={securityComplianceExportTone(source.readinessState)}
          data-source-surface={source.surface}
          data-source-route={source.route}
          data-destination-count={source.destinationRefs.length}
          data-blocked-destination-count={source.blockedDestinationRefs.length}
        >
          <strong>{titleCase(source.surface)}</strong>
          <span>{titleCase(source.readinessState)}</span>
          <small>{source.summary}</small>
        </article>
      ))}
    </section>
  );
}

function ExportDestinationTable(props: {
  projection: SecurityComplianceExportRegistryProjection;
  onSelect: (binding: GovernedExportDestinationBinding) => void;
}) {
  return (
    <section
      className="export-destination-table"
      data-testid="export-destination-table"
      aria-label="Export destination table"
    >
      <table className="governance-table">
        <caption>Governed export destination bindings</caption>
        <thead>
          <tr>
            <th scope="col">Destination</th>
            <th scope="col">Framework</th>
            <th scope="col">Artifact classes</th>
            <th scope="col">Verification</th>
            <th scope="col">Settlement</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.bindings.map((binding) => (
            <tr
              key={binding.bindingId}
              data-selected={binding.bindingId === props.projection.selectedBindingId}
              data-destination-class={binding.destinationClass}
              data-verification-state={binding.latestVerificationRecord.status}
              data-delivery-result={binding.latestDeliverySettlement.result}
              data-binding-state={binding.bindingState}
            >
              <th scope="row">
                <button
                  type="button"
                  className="destination-row-button"
                  data-testid={`export-destination-row-${automationId(binding.destinationClass)}`}
                  onClick={() => props.onSelect(binding)}
                >
                  {binding.label}
                </button>
                <small>{binding.destinationKind}</small>
              </th>
              <td>{binding.frameworkCode}</td>
              <td>{binding.artifactClassesAllowed.map(titleCase).join(", ")}</td>
              <td>
                <span
                  data-tone={securityComplianceExportTone(binding.latestVerificationRecord.status)}
                >
                  {titleCase(binding.latestVerificationRecord.status)}
                </span>
                <small>{binding.latestVerificationRecord.verificationId}</small>
              </td>
              <td>
                <span
                  data-tone={securityComplianceExportTone(binding.latestDeliverySettlement.result)}
                >
                  {titleCase(binding.latestDeliverySettlement.result)}
                </span>
                <small>{binding.latestDeliverySettlement.settlementId}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SecurityComplianceExportErrorSummary(props: { errors: readonly string[] }) {
  if (props.errors.length === 0) {
    return null;
  }
  return (
    <section
      className="security-compliance-export-error-summary"
      data-testid="security-compliance-export-error-summary"
      role="alert"
      tabIndex={-1}
      aria-labelledby="security-compliance-export-error-summary-title"
    >
      <h3 id="security-compliance-export-error-summary-title">There is a problem</h3>
      <ul>
        {props.errors.map((error) => (
          <li key={error}>
            <a
              href={
                error.includes("vault")
                  ? "#export-destination-secret-ref-input"
                  : "#export-destination-fixture-state"
              }
            >
              {error}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FakeSecurityReportingReceiverLedger(props: {
  projection: SecurityComplianceExportRegistryProjection;
}) {
  return (
    <section
      className="security-compliance-export-ledger"
      data-testid="fake-security-reporting-receiver-ledger"
      aria-label="Fake security reporting receiver ledger"
    >
      <header>
        <p className="governance-panel__eyebrow">Fake security reporting receiver</p>
        <h3>Reportability handoff observations</h3>
      </header>
      <table className="governance-table">
        <caption>Fake security reporting receiver records</caption>
        <thead>
          <tr>
            <th scope="col">Receiver</th>
            <th scope="col">Accepted</th>
            <th scope="col">Handoff</th>
            <th scope="col">Payload hash</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.fakeSecurityReportingReceiverRecords.map((record) => (
            <tr key={record.receiverRecordId} data-response-code={record.responseCode}>
              <td>{record.receiverRef}</td>
              <td>{record.accepted ? "Accepted" : "Blocked"}</td>
              <td>{titleCase(record.payload.handoffState)}</td>
              <td>{record.payloadHash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function FakeComplianceExportReceiverLedger(props: {
  projection: SecurityComplianceExportRegistryProjection;
}) {
  return (
    <section
      className="security-compliance-export-ledger"
      data-testid="fake-compliance-export-receiver-ledger"
      aria-label="Fake compliance export receiver ledger"
    >
      <header>
        <p className="governance-panel__eyebrow">Fake compliance export receiver</p>
        <h3>Artifact settlement observations</h3>
      </header>
      <table className="governance-table">
        <caption>Fake compliance export receiver records</caption>
        <thead>
          <tr>
            <th scope="col">Receiver</th>
            <th scope="col">Accepted</th>
            <th scope="col">Artifact</th>
            <th scope="col">Payload hash</th>
          </tr>
        </thead>
        <tbody>
          {props.projection.fakeComplianceExportReceiverRecords.map((record) => (
            <tr key={record.receiverRecordId} data-response-code={record.responseCode}>
              <td>{record.receiverRef}</td>
              <td>{record.accepted ? "Accepted" : "Blocked"}</td>
              <td>{titleCase(record.payload.artifactClass)}</td>
              <td>{record.payloadHash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ExportArtifactPolicyRail(props: { binding: GovernedExportDestinationBinding }) {
  return (
    <aside
      className="export-artifact-policy-rail"
      data-testid="export-artifact-policy-rail"
      data-no-raw-export-urls={String(props.binding.policyBinding.rawExportUrlsAllowed === false)}
      data-outbound-grant-ref={props.binding.latestDeliverySettlement.outboundNavigationGrantRef}
      data-redaction-policy-hash={props.binding.redactionPolicyHash}
      data-manifest-hash={props.binding.latestVerificationRecord.exportManifestHash}
      aria-label="Export artifact policy"
    >
      <header>
        <p className="governance-panel__eyebrow">ComplianceExportPolicyBinding</p>
        <h3>{props.binding.label}</h3>
      </header>
      <dl className="governance-fact-grid">
        <div>
          <dt>Presentation</dt>
          <dd>{props.binding.artifactPresentationContractRef}</dd>
        </div>
        <div>
          <dt>Grant</dt>
          <dd>{props.binding.latestDeliverySettlement.outboundNavigationGrantRef}</dd>
        </div>
        <div>
          <dt>Vault ref</dt>
          <dd>{props.binding.secretRef || "Missing vault reference"}</dd>
        </div>
        <div>
          <dt>Framework version</dt>
          <dd>{props.binding.policyBinding.frameworkVersionRef}</dd>
        </div>
        <div>
          <dt>Manifest</dt>
          <dd>{compactHash(props.binding.latestVerificationRecord.exportManifestHash)}</dd>
        </div>
        <div>
          <dt>Redaction</dt>
          <dd>{compactHash(props.binding.redactionPolicyHash)}</dd>
        </div>
        <div>
          <dt>Fallback</dt>
          <dd>{titleCase(props.binding.failureFallbackDisposition)}</dd>
        </div>
      </dl>
      <ul className="destination-policy-list">
        {props.binding.artifactClassesAllowed.map((artifactClass) => (
          <li key={artifactClass}>{titleCase(artifactClass)}</li>
        ))}
      </ul>
    </aside>
  );
}

function exportValidationErrors(
  scenarioState: SecurityComplianceExportScenarioState,
  secretRef: string,
): string[] {
  const nextErrors: string[] = [];
  if (!secretRef.trim()) {
    nextErrors.push("Enter a security compliance export vault reference before verification.");
  }
  if (scenarioState === "missing_destination") {
    nextErrors.push(
      "Create a destination binding for the selected artifact class before verification.",
    );
  }
  if (scenarioState === "denied_scope") {
    nextErrors.push("Select an allowed tenant, environment, framework, and artifact class scope.");
  }
  if (scenarioState === "stale_graph") {
    nextErrors.push("Refresh the assurance graph hash before export verification.");
  }
  if (scenarioState === "stale_redaction_policy") {
    nextErrors.push("Refresh the redaction policy hash before export verification.");
  }
  if (scenarioState === "blocked_graph") {
    nextErrors.push("Graph completeness verdict blocks artifact presentation handoff.");
  }
  if (scenarioState === "blocked_redaction") {
    nextErrors.push("Redaction parity blocks outbound delivery.");
  }
  if (scenarioState === "permission_denied") {
    nextErrors.push("The current operator cannot configure this export destination scope.");
  }
  if (scenarioState === "reportability_pending") {
    nextErrors.push("Reportability decision needs senior review before handoff.");
  }
  return nextErrors;
}

function SecurityComplianceExportConfigSurface(props: { snapshot: GovernanceShellSnapshot }) {
  const [scenarioState, setScenarioState] = useState<SecurityComplianceExportScenarioState>(() =>
    currentSecurityComplianceExportScenarioState(),
  );
  const [tenantRef, setTenantRef] = useState("tenant-demo-gp");
  const [environmentRef, setEnvironmentRef] = useState("local");
  const [frameworkCode, setFrameworkCode] = useState<ExportFrameworkCode>("DSPT");
  const [destinationClass, setDestinationClass] = useState<ExportDestinationClass>(
    "reportable_data_security_incident_handoff",
  );
  const [artifactClass, setArtifactClass] = useState<ExportArtifactClass>(
    "reportable_incident_handoff",
  );
  const [secretRef, setSecretRef] = useState(() =>
    currentSecurityComplianceExportScenarioState() === "missing_secret"
      ? ""
      : secretRefForExportDestination("reportable_data_security_incident_handoff"),
  );
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [liveMessage, setLiveMessage] = useState(
    "No security reporting or compliance export verification has run in this session.",
  );
  const [sessionVerificationState, setSessionVerificationState] = useState("pending");
  const [sessionDeliveryResult, setSessionDeliveryResult] = useState("pending");
  const [sessionReportabilityState, setSessionReportabilityState] = useState("pending");

  const projection = createSecurityComplianceExportRegistryProjection({
    scenarioState,
    tenantRef,
    environmentRef,
    destinationClass,
    secretRefOverride: secretRef,
  });
  const selectedBinding = projection.selectedBinding;
  const frameworkOptions = Array.from(
    new Set(exportDestinationClassOptions.map((option) => option.frameworkCode)),
  ) as ExportFrameworkCode[];

  function resetSecret(
    nextDestinationClass: ExportDestinationClass,
    nextTenant = tenantRef,
    nextEnv = environmentRef,
  ) {
    setSecretRef(
      scenarioState === "missing_secret"
        ? ""
        : secretRefForExportDestination(nextDestinationClass, nextTenant, nextEnv),
    );
  }

  function setScenario(next: string) {
    const normalized = normalizeSecurityComplianceExportScenarioState(next);
    setScenarioState(normalized);
    setSecretRef(
      normalized === "missing_secret"
        ? ""
        : secretRefForExportDestination(destinationClass, tenantRef, environmentRef),
    );
    setSessionVerificationState("pending");
    setSessionDeliveryResult("pending");
    setSessionReportabilityState("pending");
    setErrors([]);
  }

  function setTenant(nextTenantRef: string) {
    setTenantRef(nextTenantRef);
    resetSecret(destinationClass, nextTenantRef, environmentRef);
  }

  function setEnvironment(nextEnvironmentRef: string) {
    setEnvironmentRef(nextEnvironmentRef);
    resetSecret(destinationClass, tenantRef, nextEnvironmentRef);
  }

  function setFramework(nextFrameworkCode: string) {
    const option = exportDestinationClassOptions.find(
      (candidate) => candidate.frameworkCode === nextFrameworkCode,
    );
    if (!option) return;
    setFrameworkCode(option.frameworkCode);
    setDestinationClass(option.value);
    resetSecret(option.value);
    setErrors([]);
  }

  function setDestination(nextDestinationClass: string) {
    const option = exportDestinationClassOptions.find(
      (candidate) => candidate.value === nextDestinationClass,
    );
    if (!option) return;
    setDestinationClass(option.value);
    setFrameworkCode(option.frameworkCode);
    resetSecret(option.value);
    setErrors([]);
  }

  function setArtifact(nextArtifactClass: string) {
    if (!requiredExportArtifactClasses.includes(nextArtifactClass as ExportArtifactClass)) return;
    setArtifactClass(nextArtifactClass as ExportArtifactClass);
    setErrors([]);
  }

  function selectBinding(binding: GovernedExportDestinationBinding) {
    setDestinationClass(binding.destinationClass);
    setFrameworkCode(binding.frameworkCode);
    setArtifactClass(binding.artifactClassesAllowed[0] ?? artifactClass);
    setSecretRef(
      binding.secretRef ||
        secretRefForExportDestination(binding.destinationClass, tenantRef, environmentRef),
    );
    setErrors([]);
    setLiveMessage(`${binding.label} selected for governed export verification.`);
  }

  async function verifySecurityReporting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = exportValidationErrors(scenarioState, secretRef);
    if (selectedBinding.destinationKind !== "security_reporting") {
      nextErrors.push(
        "Select a security reporting destination before running reportability handoff.",
      );
    }
    if (nextErrors.length > 0 && scenarioState !== "delivery_failed") {
      setErrors(nextErrors);
      setSessionVerificationState(selectedBinding.latestVerificationRecord.status);
      setSessionDeliveryResult(selectedBinding.latestDeliverySettlement.result);
      setSessionReportabilityState(reportabilityHandoffState(selectedBinding));
      setLiveMessage(nextErrors[0] ?? "Security reporting verification blocked.");
      return;
    }
    const response = await fetch("/phase9/fake-security-reporting-receiver", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        createSecurityReportingSyntheticPayload(
          selectedBinding as SecurityReportingDestinationBinding,
        ),
      ),
    });
    const delivery = (await response.json().catch(() => ({ accepted: response.ok }))) as {
      accepted?: boolean;
    };
    if (!response.ok || delivery.accepted === false || scenarioState === "delivery_failed") {
      setErrors(["Fake security reporting receiver rejected the governed handoff summary."]);
      setSessionVerificationState("failed");
      setSessionDeliveryResult("failed");
      setSessionReportabilityState("blocked");
      setLiveMessage("Reportability handoff failed and the governed fallback remains active.");
      return;
    }
    setScenarioState("normal");
    setErrors([]);
    setSessionVerificationState("verified");
    setSessionDeliveryResult("delivered");
    setSessionReportabilityState("verified");
    setLiveMessage(
      "Reportability handoff verified through artifact presentation and outbound grant policy.",
    );
  }

  async function testComplianceExportDelivery() {
    const nextErrors = exportValidationErrors(scenarioState, secretRef);
    if (selectedBinding.destinationKind !== "compliance_export") {
      nextErrors.push("Select a compliance export destination before testing delivery.");
    }
    if (nextErrors.length > 0 && scenarioState !== "delivery_failed") {
      setErrors(nextErrors);
      setSessionVerificationState(selectedBinding.latestVerificationRecord.status);
      setSessionDeliveryResult(selectedBinding.latestDeliverySettlement.result);
      setSessionReportabilityState(reportabilityHandoffState(selectedBinding));
      setLiveMessage(nextErrors[0] ?? "Compliance export delivery blocked.");
      return;
    }
    const response = await fetch("/phase9/fake-compliance-export-receiver", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createComplianceExportSyntheticPayload(selectedBinding)),
    });
    const delivery = (await response.json().catch(() => ({ accepted: response.ok }))) as {
      accepted?: boolean;
    };
    if (!response.ok || delivery.accepted === false || scenarioState === "delivery_failed") {
      setErrors(["Fake compliance export receiver rejected the governed artifact summary."]);
      setSessionVerificationState("failed");
      setSessionDeliveryResult("failed");
      setLiveMessage(
        "Compliance export delivery failed and the fallback settlement remains active.",
      );
      return;
    }
    setScenarioState("normal");
    setErrors([]);
    setSessionVerificationState("verified");
    setSessionDeliveryResult("delivered");
    setLiveMessage(
      "Compliance export delivery settled with manifest metadata and redacted summary only.",
    );
  }

  return (
    <section
      className="governance-panel security-compliance-export-config"
      data-testid="security-compliance-export-config-surface"
      data-visual-mode={SECURITY_COMPLIANCE_EXPORT_VISUAL_MODE}
      data-scenario-state={projection.scenarioState}
      data-selected-binding-id={projection.selectedBindingId}
      data-selected-destination-class={projection.selectedDestinationClass}
      data-selected-artifact-class={artifactClass}
      data-verification-state={
        sessionVerificationState === "pending"
          ? selectedBinding.latestVerificationRecord.status
          : sessionVerificationState
      }
      data-delivery-result={
        sessionDeliveryResult === "pending"
          ? selectedBinding.latestDeliverySettlement.result
          : sessionDeliveryResult
      }
      data-reportability-handoff-state={
        sessionReportabilityState === "pending"
          ? reportabilityHandoffState(selectedBinding)
          : sessionReportabilityState
      }
      data-source-readiness-state={aggregateExportSourceReadiness(projection)}
      data-no-raw-export-urls={String(projection.noRawExportUrls)}
      data-outbound-grant-ref={selectedBinding.latestDeliverySettlement.outboundNavigationGrantRef}
      data-artifact-presentation-contract={selectedBinding.artifactPresentationContractRef}
      data-registry-hash={projection.registryHash}
      aria-label="Security reporting and compliance export destination configuration"
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">GovernedExportDestinationBinding</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
        <span className="governance-panel__meta">{props.snapshot.location.summary}</span>
      </header>

      <section
        className="security-compliance-export-scope-ribbon"
        data-testid="security-compliance-export-scope-ribbon"
        data-tenant-ref={projection.tenantRef}
        data-environment-ref={projection.environmentRef}
        data-framework-code={frameworkCode}
        data-artifact-class={artifactClass}
        aria-label="Security compliance export scope"
      >
        <dl className="governance-fact-grid">
          <div>
            <dt>Tenant</dt>
            <dd>{projection.tenantRef}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>{projection.environmentRef}</dd>
          </div>
          <div>
            <dt>Framework</dt>
            <dd>{frameworkCode}</dd>
          </div>
          <div>
            <dt>Gap ref</dt>
            <dd>{projection.interfaceGapArtifactRef}</dd>
          </div>
        </dl>
      </section>

      <SecurityComplianceExportReadinessStrip projection={projection} />
      <SecurityComplianceExportErrorSummary errors={errors} />

      <div className="security-compliance-export-config-grid">
        <form
          className="security-compliance-export-wizard"
          data-testid="security-compliance-export-wizard"
          onSubmit={verifySecurityReporting}
          aria-describedby="security-compliance-export-live"
        >
          <div className="destination-form-grid">
            <label>
              <span>Fixture state</span>
              <select
                id="export-destination-fixture-state"
                data-testid="export-destination-fixture-state"
                value={scenarioState}
                onChange={(event) => setScenario(event.target.value)}
              >
                {[
                  "normal",
                  "missing_secret",
                  "missing_destination",
                  "denied_scope",
                  "stale_graph",
                  "stale_redaction_policy",
                  "blocked_graph",
                  "blocked_redaction",
                  "delivery_failed",
                  "permission_denied",
                  "reportability_pending",
                ].map((state) => (
                  <option key={state} value={state}>
                    {titleCase(state)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tenant</span>
              <select
                data-testid="export-tenant-select"
                value={tenantRef}
                onChange={(event) => setTenant(event.target.value)}
              >
                <option value="tenant-demo-gp">tenant-demo-gp</option>
                <option value="tenant-assurance-lab">tenant-assurance-lab</option>
              </select>
            </label>
            <label>
              <span>Environment</span>
              <select
                data-testid="export-environment-select"
                value={environmentRef}
                onChange={(event) => setEnvironment(event.target.value)}
              >
                <option value="local">local</option>
                <option value="preview">preview</option>
                <option value="integration">integration</option>
              </select>
            </label>
            <label>
              <span>Framework</span>
              <select
                data-testid="export-framework-select"
                value={frameworkCode}
                onChange={(event) => setFramework(event.target.value)}
              >
                {frameworkOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Destination class</span>
              <select
                data-testid="export-destination-class-select"
                value={destinationClass}
                onChange={(event) => setDestination(event.target.value)}
              >
                {exportDestinationClassOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Artifact class</span>
              <select
                data-testid="export-artifact-class-select"
                value={artifactClass}
                onChange={(event) => setArtifact(event.target.value)}
              >
                {requiredExportArtifactClasses.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="destination-secret-input">
              <span>Destination vault ref</span>
              <input
                id="export-destination-secret-ref-input"
                data-testid="export-destination-secret-ref-input"
                value={secretRef}
                onChange={(event) => setSecretRef(event.target.value)}
                aria-invalid={errors.some((error) => error.includes("vault"))}
              />
            </label>
          </div>
          <div className="destination-form-actions">
            <button
              type="submit"
              className="governance-button"
              data-testid="security-reporting-verify-action"
            >
              Verify reportability handoff
            </button>
            <button
              type="button"
              className="governance-button governance-button--secondary"
              data-testid="compliance-export-test-delivery-action"
              onClick={testComplianceExportDelivery}
            >
              Test compliance export
            </button>
            <p
              id="security-compliance-export-live"
              data-testid="security-compliance-export-live"
              aria-live="polite"
            >
              {liveMessage}
            </p>
          </div>
        </form>
        <ExportArtifactPolicyRail binding={selectedBinding} />
      </div>

      <ExportDestinationTable projection={projection} onSelect={selectBinding} />
      <FakeSecurityReportingReceiverLedger projection={projection} />
      <FakeComplianceExportReceiverLedger projection={projection} />
    </section>
  );
}

function RecordsSecurityComplianceExportReadinessStrip(props: {
  scenarioState: SecurityComplianceExportScenarioState;
}) {
  const projection = createSecurityComplianceExportRegistryProjection({
    scenarioState: props.scenarioState,
    destinationClass: "archive_manifest_deletion_certificate_export",
  });
  const recordsReadiness =
    projection.sourceReadiness.find((source) => source.surface === "records") ??
    projection.sourceReadiness[0]!;
  return (
    <section
      className="records-security-compliance-export-readiness"
      data-testid="records-security-compliance-export-readiness-strip"
      data-records-export-readiness-state={recordsReadiness.readinessState}
      data-source-readiness-state={aggregateExportSourceReadiness(projection)}
      data-selected-destination-class={projection.selectedDestinationClass}
      data-no-raw-export-urls={String(projection.noRawExportUrls)}
      aria-label="Records export readiness"
    >
      <dl>
        <div>
          <dt>Records export</dt>
          <dd>{titleCase(recordsReadiness.readinessState)}</dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>{titleCase(projection.selectedDestinationClass)}</dd>
        </div>
        <div>
          <dt>Grant</dt>
          <dd>{projection.selectedBinding.latestDeliverySettlement.outboundNavigationGrantRef}</dd>
        </div>
        <div>
          <dt>Manifest</dt>
          <dd>
            {compactHash(projection.selectedBinding.latestVerificationRecord.exportManifestHash)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function GovernancePhase9LiveProjectionGatewayStrip(props: {
  projection: LivePhase9ProjectionGatewayProjection;
  currentRoute: string;
}) {
  const firstFixtureId = props.projection.testEventProducerFixtures[0]?.fixtureId ?? "";
  const [localProjection, setLocalProjection] = useState(props.projection);
  const [fixtureId, setFixtureId] = useState(firstFixtureId);

  useEffect(() => {
    setLocalProjection(props.projection);
    setFixtureId(firstFixtureId);
  }, [firstFixtureId, props.projection.liveGatewayHash, props.projection.selectedSurfaceCode]);

  const selectedSurface = localProjection.selectedSurface;
  const selectedFixture =
    localProjection.testEventProducerFixtures.find((fixture) => fixture.fixtureId === fixtureId) ??
    localProjection.testEventProducerFixtures[0];

  return (
    <section
      className="phase9-live-projection-gateway"
      data-testid="phase9-live-projection-gateway-strip"
      data-surface="phase9-live-projection-gateway-strip"
      data-current-route={props.currentRoute}
      data-visual-mode={localProjection.visualMode}
      data-live-gateway-state={localProjection.scenarioState}
      data-selected-surface-code={localProjection.selectedSurfaceCode}
      data-live-channel-state={selectedSurface.projectionState}
      data-runtime-binding-state={selectedSurface.runtimeBindingState}
      data-action-settlement-state={selectedSurface.actionSettlementState}
      data-graph-verdict-state={selectedSurface.graphVerdictState}
      data-delta-gate-state={selectedSurface.deltaGateState}
      data-return-token-state={selectedSurface.returnTokenState}
      data-telemetry-fence-state={selectedSurface.telemetryDisclosureFenceState}
      data-raw-event-browser-join-allowed={String(localProjection.rawEventBrowserJoinAllowed)}
      data-raw-domain-event-payload-allowed={String(localProjection.rawDomainEventPayloadAllowed)}
      data-subscription-cleanup-proven={String(localProjection.subscriptionCleanupProven)}
      data-live-gateway-hash={localProjection.liveGatewayHash}
      aria-label="Phase 9 live projection gateway"
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">LivePhase9ProjectionGateway</p>
          <h2>Live projection gateway</h2>
        </div>
        <span
          className="governance-panel__meta"
          data-testid="phase9-live-gateway-status"
          role="status"
          aria-live="polite"
        >
          {titleCase(selectedSurface.projectionState)} / {selectedSurface.changedBecauseSummary}
        </span>
      </header>

      <div className="phase9-live-projection-gateway__summary">
        <dl>
          <div>
            <dt>Channel</dt>
            <dd>{selectedSurface.channelContract.liveUpdateChannelRef}</dd>
          </div>
          <div>
            <dt>Contract</dt>
            <dd>{selectedSurface.channelContract.projectionContractVersion}</dd>
          </div>
          <div>
            <dt>Runtime binding</dt>
            <dd>{selectedSurface.runtimeBindingState}</dd>
          </div>
          <div>
            <dt>Selected anchor</dt>
            <dd>{selectedSurface.selectedAnchorPreserved ? "preserved" : "released"}</dd>
          </div>
        </dl>
        <p data-testid="phase9-live-return-token-panel">
          Return token {titleCase(selectedSurface.returnTokenState)}.{" "}
          {selectedSurface.changedBecauseSummary} {selectedSurface.nextSafeAction}
        </p>
      </div>

      <div
        className="phase9-live-projection-gateway__producer"
        data-testid="phase9-live-update-fixture-producer"
      >
        <label>
          <span>Fixture</span>
          <select
            data-testid="phase9-live-fixture-select"
            value={fixtureId}
            onChange={(event) => setFixtureId(event.currentTarget.value)}
          >
            {localProjection.testEventProducerFixtures.map((fixture) => (
              <option key={fixture.fixtureId} value={fixture.fixtureId}>
                {titleCase(fixture.patchKind)} / {titleCase(fixture.targetSurface)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="governance-button"
          data-testid="phase9-live-apply-fixture-action"
          onClick={() =>
            setLocalProjection(applyPhase9LiveProjectionFixture(localProjection, fixtureId))
          }
        >
          Apply live patch
        </button>
        <span data-testid="phase9-live-queued-delta-digest">
          {selectedFixture?.changedBecauseSummary ?? selectedSurface.changedBecauseSummary}
        </span>
      </div>

      <table className="governance-table" data-testid="phase9-live-source-slice-table">
        <caption>Live projection source slice readiness</caption>
        <thead>
          <tr>
            <th scope="col">Surface</th>
            <th scope="col">Projection</th>
            <th scope="col">Patch</th>
            <th scope="col">Action</th>
            <th scope="col">Consequence</th>
          </tr>
        </thead>
        <tbody>
          {localProjection.surfaces.map((surface) => (
            <tr
              key={surface.surfaceCode}
              data-testid={`phase9-live-surface-row-${surface.surfaceCode}`}
              data-route={surface.route}
              data-projection-state={surface.projectionState}
              data-patch-state={surface.patchState}
              data-selected={surface.surfaceCode === localProjection.selectedSurfaceCode}
              data-affected-only={String(surface.affectedOnly)}
              data-selected-anchor-preserved={String(surface.selectedAnchorPreserved)}
            >
              <th scope="row">{surface.label}</th>
              <td>{titleCase(surface.projectionState)}</td>
              <td>{titleCase(surface.patchState)}</td>
              <td>{titleCase(surface.actionSettlementState)}</td>
              <td>{surface.changedBecauseSummary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TenantGovernanceSurface(props: {
  snapshot: GovernanceShellSnapshot;
  onNavigate: (path: string) => void;
  onSelectObject: (objectId: string) => void;
}) {
  const [matrixFilter, setMatrixFilter] = useState<TenantGovernanceMatrixFilter>(() =>
    currentTenantGovernanceMatrixFilter(),
  );
  const [selectedTenantRef, setSelectedTenantRef] = useState(
    props.snapshot.selectedObject.objectId,
  );
  const [selectedDomainRef, setSelectedDomainRef] = useState("policy_packs");
  const [selectedFindingRef, setSelectedFindingRef] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTenantRef(props.snapshot.selectedObject.objectId);
  }, [props.snapshot.location.pathname, props.snapshot.selectedObject.objectId]);

  const projection: TenantGovernanceProjection = createTenantGovernanceProjection({
    routePath: props.snapshot.location.pathname,
    scenarioState: currentTenantGovernanceScenarioState(),
    selectedTenantRef,
    selectedDomainRef,
    selectedFindingRef,
    matrixFilter,
  });
  const selectedFinding = projection.selectedFinding;

  function selectCell(shellObjectId: string, tenantRef: string, domainRef: string) {
    setSelectedTenantRef(tenantRef);
    setSelectedDomainRef(domainRef);
    props.onSelectObject(shellObjectId);
  }

  return (
    <section
      className="governance-panel tenant-governance"
      data-testid="tenant-governance"
      data-surface="tenant-governance"
      data-route-mode={projection.routeMode}
      data-scenario-state={projection.scenarioState}
      data-binding-state={projection.bindingState}
      data-action-control-state={projection.actionControlState}
      data-watchlist-state={projection.watchlistState}
      data-selected-tenant={projection.selectedTenantRef}
      data-selected-domain={projection.selectedDomainRef}
      data-watchlist-hash={projection.standardsWatchlist.watchlistHash}
      aria-label="Tenant governance"
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">Tenant governance</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
        <span className="governance-panel__meta">{projection.surfaceSummary}</span>
      </header>

      <nav className="tenant-governance__route-nav" aria-label="Tenant governance routes">
        {[
          { path: "/ops/governance/tenants", label: "Tenant matrix" },
          { path: "/ops/config/tenants", label: "Config tenants" },
          { path: "/ops/config/bundles", label: "Policy packs" },
          { path: "/ops/config/promotions", label: "Promotions" },
          { path: "/ops/release", label: "Release watch" },
        ].map((route) => (
          <button
            key={route.path}
            type="button"
            className="governance-chip"
            data-testid={`tenant-route-${automationId(route.path)}`}
            data-active={projection.route === route.path}
            onClick={() => props.onNavigate(route.path)}
          >
            {route.label}
          </button>
        ))}
      </nav>

      <div className="tenant-governance__status" aria-label="Tenant governance status strip">
        <dl>
          <div>
            <dt>Compilation</dt>
            <dd>{projection.promotionApprovalStatus.configCompilationRecordRef}</dd>
          </div>
          <div>
            <dt>Simulation</dt>
            <dd>{projection.promotionApprovalStatus.configSimulationEnvelopeRef}</dd>
          </div>
          <div>
            <dt>Watchlist</dt>
            <dd>{projection.scopeStrip.watchlistRef}</dd>
          </div>
          <div>
            <dt>Watch hash</dt>
            <dd>{compactHash(projection.scopeStrip.watchlistHash)}</dd>
          </div>
          <div>
            <dt>Release tuple</dt>
            <dd>{compactHash(projection.scopeStrip.releaseFreezeTupleHash)}</dd>
          </div>
        </dl>
      </div>

      <div className="tenant-governance__review-grid">
        <section
          className="tenant-surface tenant-baseline-matrix"
          data-testid="tenant-baseline-matrix"
          data-surface="tenant-baseline-matrix"
          aria-label="Tenant baseline matrix"
        >
          <header>
            <div>
              <p className="governance-panel__eyebrow">TenantBaselineProfile matrix</p>
              <h3>Baselines by governance domain</h3>
            </div>
            <div className="tenant-governance__filters" aria-label="Matrix filters">
              {(["all", "drift", "blocked", "overridden"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className="governance-chip"
                  data-testid={`tenant-filter-${filter}`}
                  data-active={projection.matrixFilter === filter}
                  onClick={() => setMatrixFilter(filter)}
                >
                  {titleCase(filter)}
                </button>
              ))}
            </div>
          </header>
          <div className="tenant-table-frame">
            <table className="governance-table">
              <caption>Tenant baseline matrix with exact and effective values</caption>
              <thead>
                <tr>
                  <th scope="col">Tenant / scope</th>
                  {projection.matrixDomains.map((domain) => (
                    <th key={domain.domainRef} scope="col">
                      {domain.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projection.tenantBaselineMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={projection.matrixDomains.length + 1}>
                      No tenant baselines match this governed scope.
                    </td>
                  </tr>
                ) : (
                  projection.tenantBaselineMatrix.map((row) => (
                    <tr
                      key={row.tenantRef}
                      data-selected={row.selected}
                      data-row-drift-state={row.rowDriftState}
                      data-filter-preserved={row.preservedByFilter}
                    >
                      <th scope="row">
                        <button
                          type="button"
                          className="tenant-row-button"
                          data-testid={`tenant-row-${automationId(row.tenantRef)}`}
                          onClick={() => {
                            setSelectedTenantRef(row.tenantRef);
                            props.onSelectObject(row.shellObjectId);
                          }}
                        >
                          {row.tenantLabel}
                        </button>
                        <small>{row.scopeRef}</small>
                      </th>
                      {row.cells.map((cell) => (
                        <td
                          key={`${row.tenantRef}-${cell.domainRef}`}
                          data-drift-state={cell.driftState}
                          data-inheritance-state={cell.inheritanceState}
                        >
                          <button
                            type="button"
                            className="tenant-cell-button"
                            data-testid={`tenant-matrix-cell-${automationId(row.tenantRef)}-${automationId(cell.domainRef)}`}
                            data-selected={row.selected && cell.selected}
                            data-compile-gate-state={cell.compileGateState}
                            data-promotion-gate-state={cell.promotionGateState}
                            onClick={() =>
                              selectCell(row.shellObjectId, row.tenantRef, cell.domainRef)
                            }
                          >
                            <strong>{cell.effectiveValue}</strong>
                            <span>{cell.inheritanceState}</span>
                            <small>{cell.versionRef}</small>
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside
          className="tenant-surface tenant-evidence-rail"
          data-testid="tenant-selected-evidence"
          aria-label="Selected tenant evidence"
        >
          <header>
            <p className="governance-panel__eyebrow">Selected anchor</p>
            <h3>{projection.selectedMatrixRow.tenantLabel}</h3>
          </header>
          <dl className="tenant-fact-grid">
            <div>
              <dt>TenantBaselineProfile</dt>
              <dd>{projection.selectedMatrixRow.tenantBaselineProfileRef}</dd>
            </div>
            <div>
              <dt>Candidate baseline hash</dt>
              <dd>{compactHash(projection.selectedMatrixRow.candidateBaselineHash)}</dd>
            </div>
            <div>
              <dt>Approval state</dt>
              <dd>{projection.selectedMatrixRow.approvalState}</dd>
            </div>
            <div>
              <dt>Policy refs</dt>
              <dd>{projection.selectedMatrixRow.expandedPolicyRefs.join(", ")}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section
        className="tenant-surface config-diff-viewer"
        data-testid="config-diff-viewer"
        data-surface="config-diff-viewer"
        aria-label="Config diff viewer"
      >
        <header>
          <p className="governance-panel__eyebrow">Config diff viewer</p>
          <h3>{projection.selectedDiffEntry.title}</h3>
        </header>
        <div className="tenant-diff-summary">
          <article>
            <strong>Before</strong>
            <p>{projection.selectedDiffEntry.beforeSummary}</p>
          </article>
          <article>
            <strong>After</strong>
            <p>{projection.selectedDiffEntry.afterSummary}</p>
          </article>
        </div>
        <div className="tenant-diff-grid">
          <article>
            <strong>Baseline/live</strong>
            <p>{projection.selectedDiffEntry.baselineLiveValue}</p>
          </article>
          <article>
            <strong>Candidate</strong>
            <p>{projection.selectedDiffEntry.candidateValue}</p>
          </article>
          <article>
            <strong>Impact/evidence</strong>
            <p>{projection.selectedDiffEntry.impactSummary}</p>
            <small>{projection.selectedDiffEntry.evidenceRefs.join(", ")}</small>
          </article>
        </div>
      </section>

      <div className="tenant-governance__two-column">
        <section
          className="tenant-surface policy-pack-history"
          data-testid="policy-pack-history"
          data-surface="policy-pack-history"
          aria-label="Policy-pack history"
        >
          <header>
            <p className="governance-panel__eyebrow">PolicyPackVersion history</p>
            <h3>Candidate-bound packs</h3>
          </header>
          <table className="governance-table">
            <caption>Policy pack history</caption>
            <thead>
              <tr>
                <th scope="col">Pack</th>
                <th scope="col">Window</th>
                <th scope="col">Compatibility</th>
                <th scope="col">Hash</th>
              </tr>
            </thead>
            <tbody>
              {projection.policyPackHistory.map((pack) => (
                <tr key={pack.policyPackVersionId} data-selected={pack.selected}>
                  <td>
                    <strong>{pack.packType}</strong>
                    <small>{pack.policyPackVersionId}</small>
                  </td>
                  <td>
                    {pack.effectiveFrom} to {pack.effectiveTo}
                  </td>
                  <td>{pack.compatibilityRefs.join(", ")}</td>
                  <td>{compactHash(pack.packHash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section
          className="tenant-surface standards-watchlist"
          data-testid="standards-watchlist"
          data-surface="standards-watchlist"
          data-watchlist-state={projection.standardsWatchlist.watchlistState}
          data-compile-gate-state={projection.standardsWatchlist.compileGateState}
          data-promotion-gate-state={projection.standardsWatchlist.promotionGateState}
          aria-label="Standards dependency watchlist"
        >
          <header>
            <p className="governance-panel__eyebrow">StandardsDependencyWatchlist</p>
            <h3>{projection.standardsWatchlist.standardsDependencyWatchlistRef}</h3>
          </header>
          <dl className="tenant-fact-grid">
            <div>
              <dt>Blocking</dt>
              <dd>{projection.standardsWatchlist.blockingFindingRefs.join(", ") || "none"}</dd>
            </div>
            <div>
              <dt>Advisory</dt>
              <dd>{projection.standardsWatchlist.advisoryFindingRefs.join(", ") || "none"}</dd>
            </div>
            <div>
              <dt>Affected routes</dt>
              <dd>{projection.standardsWatchlist.affectedRouteFamilyRefs.join(", ") || "none"}</dd>
            </div>
            <div>
              <dt>Simulations</dt>
              <dd>{projection.standardsWatchlist.affectedSimulationRefs.join(", ") || "none"}</dd>
            </div>
          </dl>
          <ul className="tenant-watchlist-list">
            {projection.standardsWatchlist.findings.length === 0 ? (
              <li>No watchlist findings for this scope.</li>
            ) : (
              projection.standardsWatchlist.findings.map((finding) => (
                <li key={finding.findingRef} data-tone={tenantFindingTone(finding)}>
                  <button
                    type="button"
                    className="tenant-watchlist-button"
                    data-testid={`tenant-watchlist-finding-${automationId(finding.findingRef)}`}
                    data-selected={finding.selected}
                    data-finding-type={finding.findingType}
                    data-severity={finding.severity}
                    onClick={() => setSelectedFindingRef(finding.findingRef)}
                  >
                    <strong>{finding.findingRef}</strong>
                    <span>{finding.summary}</span>
                    <small>
                      {finding.ownerRef} / {finding.replacementRef} / {finding.deadline}
                    </small>
                  </button>
                </li>
              ))
            )}
          </ul>
          {selectedFinding ? (
            <div className="tenant-selected-finding" data-testid="tenant-selected-finding">
              <strong>{selectedFinding.findingRef}</strong>
              <span>{selectedFinding.actionLabel}</span>
              <small>{selectedFinding.settlementRef}</small>
            </div>
          ) : null}
        </section>
      </div>

      <div className="tenant-governance__three-column">
        <section
          className="tenant-surface"
          data-testid="legacy-reference-findings"
          data-surface="legacy-reference-findings"
          aria-label="Legacy reference findings"
        >
          <header>
            <p className="governance-panel__eyebrow">LegacyReferenceFinding</p>
            <h3>Reopened and legacy refs</h3>
          </header>
          <ul className="tenant-mini-list">
            {projection.legacyReferenceFindings.length === 0 ? (
              <li>No legacy references in this scope.</li>
            ) : (
              projection.legacyReferenceFindings.map((finding) => (
                <li key={finding.findingRef}>
                  <strong>{finding.findingRef}</strong>
                  <span>{finding.findingState}</span>
                  <small>{finding.summary}</small>
                </li>
              ))
            )}
          </ul>
        </section>

        <section
          className="tenant-surface"
          data-testid="policy-compatibility-alerts"
          aria-label="Policy compatibility alerts"
        >
          <header>
            <p className="governance-panel__eyebrow">PolicyCompatibilityAlert</p>
            <h3>Compatibility posture</h3>
          </header>
          <ul className="tenant-mini-list">
            {projection.policyCompatibilityAlerts.length === 0 ? (
              <li>No policy compatibility alerts.</li>
            ) : (
              projection.policyCompatibilityAlerts.map((finding) => (
                <li key={finding.findingRef}>
                  <strong>{finding.findingRef}</strong>
                  <span>{finding.promotionGateState}</span>
                  <small>{finding.summary}</small>
                </li>
              ))
            )}
          </ul>
        </section>

        <section
          className="tenant-surface"
          data-testid="standards-exceptions"
          aria-label="Standards exceptions"
        >
          <header>
            <p className="governance-panel__eyebrow">StandardsExceptionRecord</p>
            <h3>Exception lineage</h3>
          </header>
          <ul className="tenant-mini-list">
            {projection.standardsExceptions.length === 0 ? (
              <li>No active standards exceptions.</li>
            ) : (
              projection.standardsExceptions.map((finding) => (
                <li key={finding.findingRef}>
                  <strong>{finding.findingRef}</strong>
                  <span>{finding.findingState}</span>
                  <small>{finding.summary}</small>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <div className="tenant-governance__two-column">
        <section
          className="tenant-surface promotion-approval-status"
          data-testid="promotion-approval-status"
          data-surface="promotion-approval-status"
          data-promotion-readiness-state={
            projection.promotionApprovalStatus.promotionReadinessState
          }
          aria-label="Promotion approval status"
        >
          <header>
            <p className="governance-panel__eyebrow">PromotionReadinessAssessment</p>
            <h3>Approval and controls</h3>
          </header>
          <dl className="tenant-fact-grid">
            <div>
              <dt>Compilation tuple</dt>
              <dd>{compactHash(projection.promotionApprovalStatus.compilationTupleHash)}</dd>
            </div>
            <div>
              <dt>Watchlist hash</dt>
              <dd>{compactHash(projection.promotionApprovalStatus.standardsWatchlistHash)}</dd>
            </div>
            <div>
              <dt>Migration tuple</dt>
              <dd>{compactHash(projection.promotionApprovalStatus.migrationExecutionTupleHash)}</dd>
            </div>
            <div>
              <dt>Blockers</dt>
              <dd>{projection.promotionApprovalStatus.blockerRefs.join(", ") || "none"}</dd>
            </div>
          </dl>
          <div className="tenant-action-rail" aria-label="Tenant governance actions">
            {projection.actionRail.map((action) => (
              <button
                key={action.actionType}
                type="button"
                className="governance-button"
                data-testid={`tenant-action-${action.actionType}`}
                data-action-allowed={action.allowed}
                data-gate-state={action.gateState}
                data-tone={tenantGovernanceActionTone(action)}
                disabled={!action.allowed}
                title={action.disabledReason}
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>

        <section
          className="tenant-surface release-watch-status"
          data-testid="release-watch-status"
          data-surface="release-watch-status"
          data-wave-settlement-state={projection.releaseWatchStatus.waveSettlementState}
          aria-label="Release watch status"
        >
          <header>
            <p className="governance-panel__eyebrow">ReleaseFreezeTupleCard</p>
            <h3>{projection.releaseWatchStatus.releaseFreezeTupleRef}</h3>
          </header>
          <p>{projection.releaseWatchStatus.summary}</p>
          <dl className="tenant-fact-grid">
            <div>
              <dt>Release watch tuple</dt>
              <dd>{projection.releaseWatchStatus.releaseWatchTupleRef}</dd>
            </div>
            <div>
              <dt>Wave observation</dt>
              <dd>{projection.releaseWatchStatus.waveObservationRef}</dd>
            </div>
            <div>
              <dt>Recovery dispositions</dt>
              <dd>{projection.releaseWatchStatus.recoveryDispositionRefs.join(", ") || "none"}</dd>
            </div>
            <div>
              <dt>Rollback readiness</dt>
              <dd>{projection.releaseWatchStatus.rollbackReadinessState}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section
        className="tenant-surface migration-posture"
        data-testid="migration-posture"
        data-surface="migration-posture"
        data-read-path-state={projection.migrationPosture.readPathCompatibilityState}
        aria-label="Migration and backfill posture"
      >
        <header>
          <p className="governance-panel__eyebrow">Migration and backfill posture</p>
          <h3>Read-path compatibility and projection ledger</h3>
        </header>
        <dl className="tenant-fact-grid">
          <div>
            <dt>Migration binding</dt>
            <dd>{projection.migrationPosture.migrationExecutionBindingRef}</dd>
          </div>
          <div>
            <dt>Read-path digest</dt>
            <dd>{projection.migrationPosture.readPathCompatibilityDigestRef}</dd>
          </div>
          <div>
            <dt>Projection backfill ledger</dt>
            <dd>{projection.migrationPosture.projectionBackfillLedgerRef}</dd>
          </div>
          <div>
            <dt>Blockers</dt>
            <dd>{projection.migrationPosture.blockerRefs.join(", ") || "none"}</dd>
          </div>
        </dl>
      </section>
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

function RecordsArtifactStage(props: {
  stage: RecordsGovernanceArtifactStageProjection;
  testId: string;
}) {
  return (
    <section
      className="records-artifact-stage"
      data-testid={props.testId}
      data-surface={props.testId}
      data-artifact-state={props.stage.artifactState}
      aria-label={props.stage.artifactKind.replace(/_/g, " ")}
    >
      <header>
        <p className="governance-panel__eyebrow">{props.stage.artifactKind.replace(/_/g, " ")}</p>
        <h3>{props.stage.artifactRef}</h3>
      </header>
      <p>{props.stage.summary}</p>
      <dl className="records-hash-grid">
        <div>
          <dt>ArtifactPresentationContract</dt>
          <dd>{props.stage.artifactPresentationContractRef}</dd>
        </div>
        <div>
          <dt>ArtifactTransferSettlement</dt>
          <dd>{props.stage.artifactTransferSettlementRef}</dd>
        </div>
        <div>
          <dt>OutboundNavigationGrant</dt>
          <dd>{props.stage.outboundNavigationGrantRef}</dd>
        </div>
        <div>
          <dt>Graph hash</dt>
          <dd>{compactHash(props.stage.graphHash)}</dd>
        </div>
        <div>
          <dt>Artifact hash</dt>
          <dd>{compactHash(props.stage.artifactHash)}</dd>
        </div>
      </dl>
    </section>
  );
}

function RecordsSurface(props: {
  snapshot: GovernanceShellSnapshot;
  onNavigate: (path: string) => void;
  onSelectObject: (objectId: string) => void;
}) {
  const projection: RecordsGovernanceProjection = createRecordsGovernanceProjection({
    routePath: props.snapshot.location.pathname,
    scenarioState: currentRecordsScenarioState(),
    selectedObjectId: props.snapshot.selectedObject.objectId,
  });
  const selectedRow = projection.lifecycleLedgerRows.find((row) => row.selected);
  return (
    <section
      className="governance-panel records-governance"
      data-testid="records-governance"
      data-surface="records-governance"
      data-route-mode={projection.routeMode}
      data-scenario-state={projection.scenarioState}
      data-binding-state={projection.bindingState}
      data-action-control-state={projection.actionControlState}
      data-artifact-state={projection.artifactState}
      data-graph-state={projection.graphCompletenessState}
      data-selected-artifact={projection.selectedArtifactRef}
      aria-label="Records governance"
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">Records lifecycle governance</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
        <span className="governance-panel__meta">{projection.surfaceSummary}</span>
      </header>

      <nav className="records-mode-nav" aria-label="Records governance routes">
        {[
          { path: "/ops/governance/records", label: "Lifecycle ledger" },
          { path: "/ops/governance/records/holds", label: "Holds" },
          { path: "/ops/governance/records/disposition", label: "Disposition" },
        ].map((route) => (
          <button
            key={route.path}
            type="button"
            className="governance-chip"
            data-testid={`records-route-${automationId(route.path)}`}
            data-active={projection.route === route.path}
            onClick={() => props.onNavigate(route.path)}
          >
            {route.label}
          </button>
        ))}
      </nav>

      <div className="records-status-strip" aria-label="Records status strip">
        <dl>
          <div>
            <dt>Binding</dt>
            <dd>{projection.bindingState}</dd>
          </div>
          <div>
            <dt>Action posture</dt>
            <dd>{projection.actionControlState}</dd>
          </div>
          <div>
            <dt>Graph</dt>
            <dd>{projection.graphCompletenessState}</dd>
          </div>
          <div>
            <dt>Lifecycle tuple</dt>
            <dd>{compactHash(projection.lifecycleTupleHash)}</dd>
          </div>
        </dl>
      </div>

      <RecordsSecurityComplianceExportReadinessStrip
        scenarioState={currentSecurityComplianceExportScenarioState()}
      />

      <div className="records-governance__layout">
        <aside
          className="records-surface records-retention-browser"
          data-testid="retention-class-browser"
          data-surface="retention-class-browser"
          aria-label="Retention class browser"
        >
          <header>
            <p className="governance-panel__eyebrow">Retention class browser</p>
            <h3>Policy-bound classes</h3>
          </header>
          <ul>
            {projection.retentionClasses.map((retentionClass) => (
              <li key={retentionClass.retentionClassRef} data-selected={retentionClass.selected}>
                <strong>{retentionClass.recordType}</strong>
                <span>{retentionClass.minimumRetention}</span>
                <small>
                  {retentionClass.disposalMode} / {retentionClass.immutabilityMode}
                </small>
                <code>{compactHash(retentionClass.policyTupleHash)}</code>
              </li>
            ))}
          </ul>
        </aside>

        <section
          className="records-surface records-lifecycle-ledger"
          data-testid="lifecycle-ledger"
          data-surface="lifecycle-ledger"
          aria-label="Lifecycle ledger"
        >
          <header>
            <p className="governance-panel__eyebrow">Lifecycle ledger</p>
            <h3>Current refs together</h3>
          </header>
          <table className="governance-table">
            <caption>
              Current retention binding, decision, hold, freeze, and assessment rows
            </caption>
            <thead>
              <tr>
                <th scope="col">Artifact</th>
                <th scope="col">Lifecycle binding</th>
                <th scope="col">Decision</th>
                <th scope="col">Hold/freeze refs</th>
                <th scope="col">Assessment</th>
                <th scope="col">Graph</th>
                <th scope="col">Disposition</th>
              </tr>
            </thead>
            <tbody>
              {projection.lifecycleLedgerRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>No lifecycle rows are in scope for this review.</td>
                </tr>
              ) : (
                projection.lifecycleLedgerRows.map((row) => (
                  <tr
                    key={row.artifactRef}
                    data-selected={row.selected}
                    data-delete-control-state={row.deleteControlState}
                    data-eligibility-state={row.eligibilityState}
                    data-graph-criticality={row.graphCriticality}
                  >
                    <td>
                      <button
                        type="button"
                        className="records-row-button"
                        data-testid={`records-row-${automationId(row.governanceObjectId)}-${automationId(row.artifactRef)}`}
                        onClick={() => props.onSelectObject(row.governanceObjectId)}
                      >
                        {row.artifactLabel}
                      </button>
                    </td>
                    <td>{row.retentionLifecycleBindingRef}</td>
                    <td>
                      <span>{row.retentionDecisionRef}</span>
                      <small>{compactHash(row.decisionHash)}</small>
                    </td>
                    <td>
                      {[...row.activeFreezeRefs, ...row.activeLegalHoldRefs].length > 0
                        ? [...row.activeFreezeRefs, ...row.activeLegalHoldRefs].join(", ")
                        : "none"}
                    </td>
                    <td>
                      <span>{row.dispositionEligibilityAssessmentRef}</span>
                      <small>{compactHash(row.assessmentHash)}</small>
                    </td>
                    <td>{row.graphCompletenessState}</td>
                    <td>
                      <strong>{row.effectiveDisposition}</strong>
                      <small>{row.eligibilityState}</small>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <aside
          className="records-surface records-selected-summary"
          data-testid="records-selected-summary"
          aria-label="Selected lifecycle summary"
        >
          <header>
            <p className="governance-panel__eyebrow">Selected lifecycle row</p>
            <h3>{projection.selectedArtifactLabel}</h3>
          </header>
          {selectedRow ? (
            <dl className="records-hash-grid">
              <div>
                <dt>RetentionLifecycleBinding</dt>
                <dd>{selectedRow.retentionLifecycleBindingRef}</dd>
              </div>
              <div>
                <dt>RetentionDecision</dt>
                <dd>{selectedRow.retentionDecisionRef}</dd>
              </div>
              <div>
                <dt>DispositionEligibilityAssessment</dt>
                <dd>{selectedRow.dispositionEligibilityAssessmentRef}</dd>
              </div>
              <div>
                <dt>Dependency summary</dt>
                <dd>{selectedRow.dependencySummary}</dd>
              </div>
              <div>
                <dt>Delete control</dt>
                <dd>{selectedRow.deleteControlState}</dd>
              </div>
            </dl>
          ) : (
            <p>No selected lifecycle row.</p>
          )}
        </aside>
      </div>

      <div className="records-work-grid">
        <section
          className="records-surface"
          data-testid="legal-hold-queue"
          data-surface="legal-hold-queue"
          aria-label="Legal hold queue"
        >
          <header>
            <p className="governance-panel__eyebrow">Legal hold queue</p>
            <h3>Scope seals</h3>
          </header>
          <ul className="records-list">
            {projection.legalHoldQueue.length === 0 ? (
              <li>No legal holds in scope.</li>
            ) : (
              projection.legalHoldQueue.map((hold) => (
                <li key={hold.legalHoldRecordRef} data-selected={hold.selected}>
                  <strong>{hold.legalHoldRecordRef}</strong>
                  <span>{hold.holdState}</span>
                  <small>
                    {hold.reasonCode} / {hold.artifactCount} artifacts / {hold.dependencyCount}{" "}
                    dependencies
                  </small>
                  <code>{compactHash(hold.scopeHash)}</code>
                </li>
              ))
            )}
          </ul>
        </section>

        <section
          className="records-surface"
          data-testid="hold-scope-review"
          data-surface="hold-scope-review"
          aria-label="Hold scope review"
        >
          <header>
            <p className="governance-panel__eyebrow">Hold scope review</p>
            <h3>{projection.holdScopeReview?.legalHoldRecordRef ?? "No hold selected"}</h3>
          </header>
          {projection.holdScopeReview ? (
            <dl className="records-hash-grid">
              <div>
                <dt>LegalHoldScopeManifest.scopeHash</dt>
                <dd>{projection.holdScopeReview.scopeHash}</dd>
              </div>
              <div>
                <dt>RetentionFreezeRecord.freezeScopeHash</dt>
                <dd>{projection.holdScopeReview.freezeScopeHash}</dd>
              </div>
              <div>
                <dt>Release lineage</dt>
                <dd>{projection.holdScopeReview.releaseLineageRef}</dd>
              </div>
              <div>
                <dt>Supersession</dt>
                <dd>{projection.holdScopeReview.supersessionState}</dd>
              </div>
            </dl>
          ) : (
            <p>Hold scope lookup remains summary-first.</p>
          )}
        </section>

        <section
          className="records-surface"
          data-testid="disposition-queue"
          data-surface="disposition-queue"
          aria-label="Disposition queue"
        >
          <header>
            <p className="governance-panel__eyebrow">Disposition queue</p>
            <h3>Current assessment candidates only</h3>
          </header>
          <table className="governance-table">
            <caption>Upcoming disposition jobs</caption>
            <thead>
              <tr>
                <th scope="col">Job</th>
                <th scope="col">Action</th>
                <th scope="col">Admission basis</th>
                <th scope="col">Result</th>
                <th scope="col">Assessments</th>
              </tr>
            </thead>
            <tbody>
              {projection.dispositionJobs.length === 0 ? (
                <tr>
                  <td colSpan={5}>No disposition jobs admitted for this scope.</td>
                </tr>
              ) : (
                projection.dispositionJobs.map((job) => (
                  <tr key={job.dispositionJobRef} data-result-state={job.resultState}>
                    <td>{job.dispositionJobRef}</td>
                    <td>{job.actionType}</td>
                    <td>{job.admissionBasis}</td>
                    <td>{job.resultState}</td>
                    <td>{job.candidateAssessmentRefs.join(", ") || "none"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section
          className="records-surface"
          data-testid="block-explainer"
          data-surface="block-explainer"
          aria-label="Dependency and immutability explainer"
        >
          <header>
            <p className="governance-panel__eyebrow">DispositionBlockExplainer</p>
            <h3>{projection.blockExplainer?.artifactRef ?? "No blocker selected"}</h3>
          </header>
          {projection.blockExplainer ? (
            <ul className="records-tree">
              <li>
                <strong>Blocking reasons</strong>
                <span>{projection.blockExplainer.blockingReasonRefs.join(", ")}</span>
              </li>
              <li>
                <strong>Dependencies</strong>
                <span>{projection.blockExplainer.activeDependencyRefs.join(", ") || "none"}</span>
              </li>
              <li>
                <strong>Freeze refs</strong>
                <span>{projection.blockExplainer.activeFreezeRefs.join(", ") || "none"}</span>
              </li>
              <li>
                <strong>Legal hold refs</strong>
                <span>{projection.blockExplainer.activeLegalHoldRefs.join(", ") || "none"}</span>
              </li>
            </ul>
          ) : (
            <p>No disposition blocker for the current row.</p>
          )}
        </section>
      </div>

      <section
        className="records-action-rail"
        aria-label="Records governance actions"
        aria-live="polite"
      >
        {projection.actionRail.map((action) => (
          <button
            key={action.actionType}
            type="button"
            className="governance-button"
            data-testid={`records-action-${action.actionType}`}
            data-action-allowed={action.allowed}
            data-control-state={action.controlState}
            data-settlement-state={action.settlementState}
            data-tone={recordsActionTone(action)}
            disabled={!action.allowed}
            title={action.disabledReason}
          >
            {action.label}
          </button>
        ))}
      </section>

      <div className="records-artifact-grid">
        <RecordsArtifactStage
          stage={projection.deletionCertificateStage}
          testId="deletion-certificate-stage"
        />
        <RecordsArtifactStage
          stage={projection.archiveManifestStage}
          testId="archive-manifest-stage"
        />
      </div>
    </section>
  );
}

function roleScopeActionTone(action: RoleScopeStudioActionProjection): string {
  if (action.allowed) return "success";
  if (action.controlState === "settlement_pending" || action.controlState === "frozen") {
    return "caution";
  }
  return "critical";
}

function releaseFreezeTone(card: ReleaseFreezeCardProjection): string {
  if (card.status === "live") return "success";
  if (card.status === "diagnostic_only" || card.status === "recovery_only") return "caution";
  return "critical";
}

function GovernanceScopeRibbon(props: { ribbon: GovernanceScopeRibbonProjection }) {
  return (
    <section
      className="role-scope-ribbon"
      data-testid="governance-scope-ribbon-458"
      data-release-freeze-verdict={props.ribbon.releaseFreezeVerdict}
      data-write-state={props.ribbon.writeState}
      aria-label="Governance role scope ribbon"
    >
      <dl>
        <div>
          <dt>Tenant</dt>
          <dd>{props.ribbon.tenantLabel}</dd>
        </div>
        <div>
          <dt>Organisation</dt>
          <dd>{props.ribbon.organisationLabel}</dd>
        </div>
        <div>
          <dt>Acting role</dt>
          <dd>{props.ribbon.actingRoleLabel}</dd>
        </div>
        <div>
          <dt>Purpose</dt>
          <dd>{props.ribbon.purposeLabel}</dd>
        </div>
        <div>
          <dt>Elevation</dt>
          <dd>{titleCase(props.ribbon.elevationState)}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{titleCase(props.ribbon.runtimePublicationState)}</dd>
        </div>
        <div>
          <dt>Freeze verdict</dt>
          <dd>{titleCase(props.ribbon.releaseFreezeVerdict)}</dd>
        </div>
      </dl>
      <p>
        {props.ribbon.governanceScopeTokenRef} / {compactHash(props.ribbon.scopeTupleHash)}
      </p>
    </section>
  );
}

function RoleScopeMatrix(props: {
  matrix: RoleGrantMatrixProjection;
  onSelectRouteFamily: (routeFamilyRef: string) => void;
}) {
  return (
    <section
      className="role-scope-surface role-scope-matrix"
      data-testid="role-scope-matrix"
      data-surface="role-scope-matrix"
      aria-label="Role scope matrix"
    >
      <header>
        <div>
          <p className="governance-panel__eyebrow">RoleGrantMatrixProjection</p>
          <h3>{props.matrix.roleLabel}</h3>
        </div>
        <span>{props.matrix.rolePackageRef}</span>
      </header>
      <div className="role-scope-table-frame">
        <table className="governance-table">
          <caption>
            Role grants by route family and capability. Cell text is the authority state.
          </caption>
          <thead>
            <tr>
              <th scope="col">Route/action family</th>
              {props.matrix.capabilityColumns.map((column) => (
                <th key={column.columnRef} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.matrix.rows.length === 0 ? (
              <tr>
                <td colSpan={props.matrix.capabilityColumns.length + 1}>
                  {props.matrix.emptyStateReason ?? "No role-scope rows are in scope."}
                </td>
              </tr>
            ) : (
              props.matrix.rows.map((row) => (
                <tr key={row.routeFamilyRef} data-selected={row.selected}>
                  <th scope="row">
                    <button
                      type="button"
                      className="role-scope-row-button"
                      data-testid={`role-scope-row-${automationId(row.routeFamilyRef)}`}
                      data-selected={row.selected}
                      onClick={() => props.onSelectRouteFamily(row.routeFamilyRef)}
                    >
                      <strong>{row.label}</strong>
                      <span>{row.artifactClass}</span>
                      <small>{row.consequence}</small>
                    </button>
                  </th>
                  {row.cells.map((cell) => (
                    <td key={`${row.routeFamilyRef}-${cell.columnRef}`} data-state={cell.state}>
                      <button
                        type="button"
                        className="role-scope-cell"
                        data-testid={`role-scope-cell-${automationId(row.routeFamilyRef)}-${cell.columnRef}`}
                        data-state={cell.state}
                        data-icon-shape={cell.iconShape}
                        aria-label={`${row.label} ${titleCase(cell.columnRef)} ${cell.stateLabel}. ${cell.explanation}`}
                        onClick={() => props.onSelectRouteFamily(row.routeFamilyRef)}
                      >
                        <span aria-hidden="true" className="role-scope-cell__shape" />
                        <strong>{cell.stateLabel}</strong>
                        <small>{cell.mutableControlState}</small>
                      </button>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EffectiveAccessPreviewPane(props: {
  preview: EffectiveAccessPreviewProjection;
  personaRefs: readonly string[];
  selectedPersonaRef: string;
  onSelectPersona: (personaRef: string) => void;
}) {
  return (
    <section
      className="role-scope-surface effective-access-preview-pane"
      data-testid="effective-access-preview-pane"
      data-surface="effective-access-preview-pane"
      data-decision={props.preview.decision}
      data-preview-state={props.preview.previewState}
      aria-label="Effective access preview pane"
    >
      <header>
        <div>
          <p className="governance-panel__eyebrow">EffectiveAccessPreviewProjection</p>
          <h3>{props.preview.personaLabel}</h3>
        </div>
        <span>{titleCase(props.preview.previewState)}</span>
      </header>
      <div className="role-scope-persona-switcher" aria-label="Preview persona">
        {props.personaRefs.map((personaRef) => (
          <button
            key={personaRef}
            type="button"
            className="governance-chip"
            data-testid={`role-scope-persona-${automationId(personaRef)}`}
            data-active={props.selectedPersonaRef === personaRef}
            onClick={() => props.onSelectPersona(personaRef)}
          >
            {titleCase(personaRef.replace("persona:", ""))}
          </button>
        ))}
      </div>
      <dl className="role-scope-facts">
        <div>
          <dt>Decision</dt>
          <dd>{titleCase(props.preview.decision)}</dd>
        </div>
        <div>
          <dt>Object type</dt>
          <dd>{props.preview.objectTypeRef}</dd>
        </div>
        <div>
          <dt>Review burden</dt>
          <dd>{titleCase(props.preview.reviewBurdenState)}</dd>
        </div>
        <div>
          <dt>Artifact mode</dt>
          <dd>{titleCase(props.preview.artifactMode)}</dd>
        </div>
      </dl>
      <p>{props.preview.visibilityImpactSummary}</p>
      <div className="role-scope-preview-regions">
        <article>
          <strong>Visible</strong>
          <ul>
            {props.preview.visiblePanels.map((panel) => (
              <li key={panel}>{panel}</li>
            ))}
          </ul>
        </article>
        <article>
          <strong>Masked</strong>
          <ul>
            {props.preview.maskedFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </article>
        <article>
          <strong>Hidden</strong>
          <ul>
            {props.preview.hiddenFields.map((field) => (
              <li key={field}>Hidden field withheld</li>
            ))}
          </ul>
        </article>
        <article>
          <strong>Export blocked</strong>
          <ul>
            {props.preview.exportBlockedDestinationControls.map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function AccessMaskDiffCard(props: { mask: AccessPreviewArtifactMaskProjection }) {
  const afterRegions = props.mask.afterRegions.filter(
    (region) => region.exposureState !== "hidden",
  );
  return (
    <section
      className="role-scope-surface access-mask-diff-card"
      data-testid="access-mask-diff-card"
      data-surface="access-mask-diff-card"
      data-telemetry-redacted={props.mask.telemetryRedacted}
      data-hidden-fields-not-rendered={props.mask.hiddenFieldsNotRendered}
      aria-label="Access mask diff card"
    >
      <header>
        <div>
          <p className="governance-panel__eyebrow">AccessPreviewArtifactMaskProjection</p>
          <h3>{props.mask.artifactLabel}</h3>
        </div>
        <span>{props.mask.maskPolicyRef}</span>
      </header>
      <div className="role-scope-mask-grid">
        <article>
          <strong>Before</strong>
          <ul>
            {props.mask.beforeRegions.map((region) => (
              <li key={region.regionRef} data-exposure-state={region.exposureState}>
                <span>{region.domText}</span>
                <small>{titleCase(region.exposureState)}</small>
              </li>
            ))}
          </ul>
        </article>
        <article>
          <strong>After</strong>
          <ul>
            {afterRegions.map((region) => (
              <li
                key={region.regionRef}
                data-exposure-state={region.exposureState}
                aria-label={region.ariaName}
              >
                <span>{region.domText}</span>
                <small>{region.telemetryValue}</small>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function BreakGlassElevationSummary(props: { summary: BreakGlassElevationSummaryProjection }) {
  return (
    <section
      className="role-scope-surface break-glass-elevation-summary"
      data-testid="break-glass-elevation-summary"
      data-surface="break-glass-elevation-summary"
      data-review-state={props.summary.reviewState}
      aria-label="Break-glass elevation summary"
    >
      <header>
        <p className="governance-panel__eyebrow">BreakGlassElevationSummary</p>
        <h3>{titleCase(props.summary.eligibilityState)}</h3>
      </header>
      <dl className="role-scope-facts">
        <div>
          <dt>Reason adequacy</dt>
          <dd>{titleCase(props.summary.reasonAdequacyState)}</dd>
        </div>
        <div>
          <dt>Expiry</dt>
          <dd>{props.summary.expiresAt ?? "No active elevation"}</dd>
        </div>
        <div>
          <dt>Review state</dt>
          <dd>{titleCase(props.summary.reviewState)}</dd>
        </div>
      </dl>
      <p>{props.summary.scopeWideningSummary}</p>
      <p>{props.summary.followUpBurden}</p>
    </section>
  );
}

function ReleaseFreezeCardRail(props: { cards: readonly ReleaseFreezeCardProjection[] }) {
  return (
    <section
      className="role-scope-surface release-freeze-card-rail"
      data-testid="release-freeze-card-rail"
      data-surface="release-freeze-card-rail"
      aria-label="Release freeze card rail"
    >
      <header>
        <p className="governance-panel__eyebrow">ReleaseFreezeCardProjection</p>
        <h3>Freeze cards</h3>
      </header>
      <ol className="role-scope-freeze-list">
        {props.cards.map((card) => (
          <li
            key={card.releaseFreezeCardRef}
            data-release-freeze-card={card.freezeKind}
            data-status={card.status}
            data-tone={releaseFreezeTone(card)}
          >
            <span className="role-scope-freeze-list__timeline" aria-hidden="true" />
            <strong>{card.title}</strong>
            <span>{titleCase(card.status)}</span>
            <small>
              Since {card.beganAt}; affects {card.affects.join(", ")}
            </small>
            <em>{card.releaseCondition}</em>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DeniedActionExplainer(props: {
  explainers: readonly DeniedActionExplainerProjection[];
  selected: DeniedActionExplainerProjection;
  onSelect: (actionRef: string) => void;
}) {
  return (
    <section
      className="role-scope-surface denied-action-explainer"
      data-testid="denied-action-explainer"
      data-surface="denied-action-explainer"
      data-selected-action={props.selected.actionRef}
      aria-label="Denied action explainer"
    >
      <header>
        <p className="governance-panel__eyebrow">DeniedActionExplainer</p>
        <h3>{props.selected.actionLabel}</h3>
      </header>
      <div className="role-scope-denied-tabs" aria-label="Denied actions">
        {props.explainers.map((explainer) => (
          <button
            key={explainer.actionRef}
            type="button"
            className="governance-chip"
            data-testid={`denied-action-${explainer.actionRef}`}
            data-active={props.selected.actionRef === explainer.actionRef}
            onClick={() => props.onSelect(explainer.actionRef)}
          >
            {explainer.actionLabel}
          </button>
        ))}
      </div>
      <dl className="role-scope-denied-detail">
        <div>
          <dt>Source object</dt>
          <dd>{props.selected.sourceObjectRef}</dd>
        </div>
        <div>
          <dt>Failed predicate</dt>
          <dd>{props.selected.failedPredicate}</dd>
        </div>
        <div>
          <dt>Consequence</dt>
          <dd>{props.selected.consequence}</dd>
        </div>
        <div>
          <dt>Next safe action</dt>
          <dd>{props.selected.nextSafeAction}</dd>
        </div>
      </dl>
    </section>
  );
}

function ScopeTupleInspector(props: { tuple: ScopeTupleInspectorProjection }) {
  return (
    <section
      className="role-scope-surface scope-tuple-inspector"
      data-testid="scope-tuple-inspector"
      data-surface="scope-tuple-inspector"
      aria-label="Scope tuple inspector"
    >
      <header>
        <p className="governance-panel__eyebrow">ScopeTupleInspector</p>
        <h3>{compactHash(props.tuple.scopeTupleHash)}</h3>
      </header>
      <dl className="role-scope-facts">
        <div>
          <dt>ActingScopeTuple</dt>
          <dd>{props.tuple.actingScopeTupleRef}</dd>
        </div>
        <div>
          <dt>GovernanceScopeToken</dt>
          <dd>{props.tuple.governanceScopeTokenRef}</dd>
        </div>
        <div>
          <dt>RouteIntentBinding</dt>
          <dd>{props.tuple.routeIntentBindingRef}</dd>
        </div>
        <div>
          <dt>Visibility coverage</dt>
          <dd>{props.tuple.audienceVisibilityCoverageRef}</dd>
        </div>
        <div>
          <dt>Minimum necessary</dt>
          <dd>{props.tuple.minimumNecessaryContractRef}</dd>
        </div>
        <div>
          <dt>Release freeze</dt>
          <dd>{props.tuple.releaseApprovalFreezeRef}</dd>
        </div>
      </dl>
    </section>
  );
}

function GovernanceReturnContextStrip(props: { context: GovernanceReturnContextStripProjection }) {
  return (
    <section
      className="role-scope-return-strip"
      data-testid="governance-return-context-strip"
      data-surface="governance-return-context-strip"
      data-safe-return-state={props.context.safeReturnState}
      aria-label="Governance return context strip"
    >
      <strong>{props.context.returnLabel}</strong>
      <span>{props.context.originLabel}</span>
      <small>
        {props.context.returnTokenRef} / {compactHash(props.context.originScopeHash)}
      </small>
    </section>
  );
}

function RoleScopeStudioSurface(props: {
  snapshot: GovernanceShellSnapshot;
  onNavigate: (path: string) => void;
}) {
  const [selectedRouteFamilyRef, setSelectedRouteFamilyRef] = useState(
    "route-family:access-governance",
  );
  const [selectedPersonaRef, setSelectedPersonaRef] = useState("persona:governance-leader");
  const [selectedDeniedActionRef, setSelectedDeniedActionRef] = useState("approve_role");

  const projection: GovernanceRoleScopeStudioProjection = createRoleScopeStudioProjection({
    routePath: props.snapshot.location.pathname,
    scenarioState: currentRoleScopeStudioScenarioState(),
    selectedRouteFamilyRef,
    selectedPersonaRef,
    selectedDeniedActionRef,
  });

  return (
    <section
      className="governance-panel role-scope-studio"
      data-testid="role-scope-studio"
      data-surface="role-scope-studio"
      data-visual-mode={projection.visualMode}
      data-scenario-state={projection.scenarioState}
      data-binding-state={projection.bindingState}
      data-action-control-state={projection.actionControlState}
      data-no-live-mutation-controls={projection.noLiveMutationControls}
      data-selected-route-family={projection.roleGrantMatrix.selectedRouteFamilyRef}
      data-preview-state={projection.effectiveAccessPreview.previewState}
      data-access-decision={projection.effectiveAccessPreview.decision}
      data-freeze-verdict={projection.governanceScopeRibbon.releaseFreezeVerdict}
      aria-label="Governance role scope studio"
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">GovernanceRoleScopeStudioProjection</p>
          <h2>{props.snapshot.reviewHeadline}</h2>
        </div>
        <span className="governance-panel__meta">{projection.surfaceSummary}</span>
      </header>

      <nav className="role-scope-route-nav" aria-label="Role scope routes">
        {[
          { path: "/ops/access/role-scope-studio", label: "Role scope studio" },
          { path: "/ops/access/roles", label: "Role packages" },
          { path: "/ops/access/users", label: "User access" },
          { path: "/ops/access/reviews", label: "Access reviews" },
        ].map((route) => (
          <button
            key={route.path}
            type="button"
            className="governance-chip"
            data-testid={`role-scope-route-${automationId(route.path)}`}
            data-active={route.path === props.snapshot.location.pathname}
            onClick={() => props.onNavigate(route.path)}
          >
            {route.label}
          </button>
        ))}
      </nav>

      <GovernanceScopeRibbon ribbon={projection.governanceScopeRibbon} />

      <div className="role-scope-studio__split">
        <RoleScopeMatrix
          matrix={projection.roleGrantMatrix}
          onSelectRouteFamily={setSelectedRouteFamilyRef}
        />
        <aside className="role-scope-studio__preview">
          <EffectiveAccessPreviewPane
            preview={projection.effectiveAccessPreview}
            personaRefs={[
              "persona:governance-leader",
              "persona:incident-commander",
              "persona:assurance-auditor",
              "persona:service-owner-denied",
            ]}
            selectedPersonaRef={selectedPersonaRef}
            onSelectPersona={setSelectedPersonaRef}
          />
          <AccessMaskDiffCard mask={projection.accessPreviewArtifactMask} />
          <BreakGlassElevationSummary summary={projection.breakGlassElevationSummary} />
        </aside>
      </div>

      <ReleaseFreezeCardRail cards={projection.releaseFreezeCards} />

      <section
        className="role-scope-action-rail"
        aria-label="Role scope studio actions"
        aria-live="polite"
      >
        {projection.actionRail.map((action) => (
          <button
            key={action.actionType}
            type="button"
            className="governance-button"
            data-testid={`role-scope-action-${action.actionType}`}
            data-action-allowed={action.allowed}
            data-control-state={action.controlState}
            data-tone={roleScopeActionTone(action)}
            disabled={!action.allowed}
            title={action.disabledReason}
          >
            {action.label}
          </button>
        ))}
      </section>

      <div className="role-scope-studio__lower">
        <DeniedActionExplainer
          explainers={projection.deniedActionExplainers}
          selected={projection.selectedDeniedAction}
          onSelect={setSelectedDeniedActionRef}
        />
        <ScopeTupleInspector tuple={projection.scopeTupleInspector} />
      </div>

      <section
        className="role-scope-telemetry-fence"
        data-testid="ui-telemetry-disclosure-fence"
        data-surface="ui-telemetry-disclosure-fence"
        data-raw-sensitive-text-absent={projection.telemetryDisclosureFence.rawSensitiveTextAbsent}
        aria-label="UI telemetry disclosure fence"
      >
        <strong>{projection.telemetryDisclosureFence.fenceRef}</strong>
        <span>
          Allowed payload keys: {projection.telemetryDisclosureFence.allowedPayloadKeys.join(", ")}
        </span>
        <span>
          Blocked payload keys: {projection.telemetryDisclosureFence.blockedPayloadKeys.join(", ")}
        </span>
      </section>

      <GovernanceReturnContextStrip context={projection.governanceReturnContextStrip} />
    </section>
  );
}

function AccessSurface(props: { snapshot: GovernanceShellSnapshot }) {
  return (
    <section className="governance-panel" data-testid="governance-access-surface">
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">
            {props.snapshot.location.routeKey === "access_roles"
              ? "RoleScopeStudio"
              : "EffectiveAccessPreview"}
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
            <tr
              key={row.objectId}
              data-selected={row.objectId === props.snapshot.selectedObject.objectId}
            >
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
            <tr
              key={row.objectId}
              data-selected={row.objectId === props.snapshot.selectedObject.objectId}
            >
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
    <>
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
      <FinalSignoffCockpit477Surface />
    </>
  );
}

function exceptionFilterLabel(filter: FinalSignoff477ExceptionFilter): string {
  switch (filter) {
    case "launch-blocking":
      return "Blocker";
    case "launch-with-constraint":
      return "Constrained launch";
    case "BAU-follow-up":
      return "BAU follow-up";
    case "not-applicable":
      return "Not applicable";
    default:
      return "All";
  }
}

function evidenceRowTestId(evidenceBindingId: string): string {
  return `final-477-evidence-row-${automationId(evidenceBindingId)}`;
}

function FinalSignoff477SourceDrawer(props: {
  evidence: FinalSignoff477EvidenceProjection;
  open: boolean;
  onClose: (evidenceBindingId: string) => void;
}) {
  if (!props.open) return null;
  return (
    <aside
      className="final-signoff-source-drawer"
      role="region"
      aria-label="Source trace drawer"
      data-testid="final-477-source-drawer"
    >
      <header>
        <div>
          <p className="governance-panel__eyebrow">Source trace drawer</p>
          <h3>{props.evidence.evidenceTitle}</h3>
        </div>
        <button
          type="button"
          className="governance-link"
          data-testid="final-477-close-source-drawer"
          onClick={() => props.onClose(props.evidence.evidenceBindingId)}
        >
          Close source drawer
        </button>
      </header>
      <dl className="final-signoff-source-drawer__facts">
        <div>
          <dt>Authority</dt>
          <dd>{props.evidence.authority}</dd>
        </div>
        <div>
          <dt>Signer</dt>
          <dd>{props.evidence.signerDisplayName}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{props.evidence.roleRef}</dd>
        </div>
        <div>
          <dt>Evidence hash</dt>
          <dd>{props.evidence.evidenceHash}</dd>
        </div>
      </dl>
      <div className="final-signoff-source-drawer__lists">
        <div>
          <h4>Evidence rows</h4>
          <ul>
            {props.evidence.evidenceRefs.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Source authority</h4>
          <ul>
            {props.evidence.sourceRefs.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

function FinalSignoffCockpit477Surface() {
  const [exceptionFilter, setExceptionFilter] = useState<FinalSignoff477ExceptionFilter>(() =>
    currentFinalSignoff477ExceptionFilter(),
  );
  const [selectedEvidenceRef, setSelectedEvidenceRef] = useState<string | null>(null);
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(true);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const projection = createFinalSignoff477Projection({
    scenarioState: currentFinalSignoff477ScenarioState(),
    exceptionFilter,
    selectedEvidenceRef,
  });
  const filters: readonly FinalSignoff477ExceptionFilter[] = [
    "all",
    "launch-blocking",
    "launch-with-constraint",
    "BAU-follow-up",
    "not-applicable",
  ];

  function selectEvidence(evidenceBindingId: string) {
    setSelectedEvidenceRef(evidenceBindingId);
    setSourceDrawerOpen(true);
  }

  function closeSourceDrawer(evidenceBindingId: string) {
    setSourceDrawerOpen(false);
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(
        `[data-testid="${evidenceRowTestId(evidenceBindingId)}"]`,
      );
      target?.focus();
    }, 0);
  }

  return (
    <section
      className="governance-panel final-signoff-cockpit"
      data-testid="final-477-signoff-cockpit"
      data-scenario-state={projection.scenarioState}
      data-overall-signoff-state={projection.overallSignoffState}
      data-signoff-blocker-count={projection.signoffBlockerCount}
      data-launch-approval-action-state={projection.launchApprovalActionState}
      data-command-settlement-state={projection.commandSettlementState}
    >
      <header className="governance-panel__header">
        <div>
          <p className="governance-panel__eyebrow">Final Signoff Cockpit</p>
          <h2>Task 477 launch signoff register</h2>
        </div>
        <span className="final-signoff-seal" aria-label="Signed evidence seal">
          Signed
        </span>
      </header>

      <section
        className="final-signoff-decision-strip"
        role="region"
        aria-label="Launch decision strip"
        data-testid="final-477-launch-decision-strip"
      >
        <dl>
          <div>
            <dt>Release candidate</dt>
            <dd>{projection.releaseCandidateRef}</dd>
          </div>
          <div>
            <dt>Runtime bundle</dt>
            <dd>{projection.runtimePublicationBundleRef}</dd>
          </div>
          <div>
            <dt>Wave manifest</dt>
            <dd>{projection.waveManifestRef}</dd>
          </div>
          <div>
            <dt>Blockers</dt>
            <dd>{projection.signoffBlockerCount}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="governance-button"
          data-testid="final-477-launch-approval-action"
          disabled={!projection.launchApprovalReviewAllowed}
          onClick={() => setCommandDialogOpen(true)}
        >
          Review launch signoff command
        </button>
      </section>

      <div
        className="final-signoff-lanes"
        role="region"
        aria-label="Five signoff lanes"
        data-testid="final-477-signoff-lanes"
      >
        {projection.lanes.map((lane) => (
          <article
            key={lane.laneId}
            className="final-signoff-lane"
            data-tone={lane.tone}
            data-testid={`final-477-lane-${lane.laneId.replace(/_/g, "-")}`}
            aria-label={`${lane.laneLabel} signoff lane`}
          >
            <header>
              <div>
                <p>{lane.laneLabel}</p>
                <h3>{titleCase(lane.status)}</h3>
              </div>
              <span aria-hidden="true">Seal</span>
            </header>
            <dl>
              <div>
                <dt>Authority</dt>
                <dd>{lane.authority}</dd>
              </div>
              <div>
                <dt>Signer</dt>
                <dd>{lane.signerDisplayName}</dd>
              </div>
              <div>
                <dt>Evidence hash</dt>
                <dd>{compactHash(lane.evidenceHash)}</dd>
              </div>
              <div>
                <dt>Expiry</dt>
                <dd>{lane.expiresAt}</dd>
              </div>
              <div>
                <dt>Scope</dt>
                <dd>{lane.scope}</dd>
              </div>
              <div>
                <dt>Exceptions</dt>
                <dd>{lane.exceptionCount}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <section
        className="final-signoff-exception-ledger"
        role="region"
        aria-label="Exception ledger"
        data-testid="final-477-exception-ledger"
      >
        <header>
          <div>
            <p className="governance-panel__eyebrow">Exception ledger</p>
            <h3>Open exceptions and constrained launch conditions</h3>
          </div>
          <div className="final-signoff-filter-bar" aria-label="Exception filters">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="governance-chip"
                data-active={projection.exceptionFilter === filter}
                data-testid={`final-477-filter-${filter}`}
                onClick={() => setExceptionFilter(filter)}
              >
                {exceptionFilterLabel(filter)}
              </button>
            ))}
          </div>
        </header>
        <table className="governance-table">
          <caption>Exception ledger rows</caption>
          <thead>
            <tr>
              <th scope="col">Exception</th>
              <th scope="col">Classification</th>
              <th scope="col">Owner</th>
              <th scope="col">Expiry</th>
              <th scope="col">Scope</th>
            </tr>
          </thead>
          <tbody>
            {projection.filteredExceptions.length > 0 ? (
              projection.filteredExceptions.map((entry) => (
                <tr key={entry.exceptionId}>
                  <th scope="row">{entry.title}</th>
                  <td>{entry.effectiveClassification}</td>
                  <td>{entry.ownerDisplayName}</td>
                  <td>{entry.expiresAt ?? "not applicable"}</td>
                  <td>{entry.scopeAppliesTo}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No exceptions in this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="final-signoff-evidence-grid" aria-label="Evidence source rows">
        <div className="final-signoff-evidence-grid__rows">
          <h3>Evidence rows</h3>
          {projection.evidenceRows.map((row) => (
            <button
              key={row.evidenceBindingId}
              type="button"
              className="final-signoff-evidence-row"
              data-testid={evidenceRowTestId(row.evidenceBindingId)}
              data-selected={row.evidenceBindingId === projection.selectedEvidence.evidenceBindingId}
              onClick={() => selectEvidence(row.evidenceBindingId)}
            >
              <strong>{row.evidenceTitle}</strong>
              <span>{row.evidenceClass}</span>
              <small>{row.evidenceHash}</small>
            </button>
          ))}
        </div>
        <FinalSignoff477SourceDrawer
          evidence={projection.selectedEvidence}
          open={sourceDrawerOpen}
          onClose={closeSourceDrawer}
        />
      </section>

      {commandDialogOpen ? (
        <div
          className="final-signoff-command-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Launch signoff command confirmation"
          data-testid="final-477-command-confirmation-dialog"
        >
          <div>
            <p className="governance-panel__eyebrow">Command settlement</p>
            <h3>Backend settlement is pending</h3>
            <p>
              The signed register can be reviewed, but launch approval cannot settle until the
              command settlement authority is current.
            </p>
            <div className="final-signoff-command-dialog__actions">
              <button
                type="button"
                className="governance-link"
                onClick={() => setCommandDialogOpen(false)}
              >
                Close command review
              </button>
              <button
                type="button"
                className="governance-button"
                data-testid="final-477-command-confirm"
                disabled
              >
                Settle launch signoff
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MainSurface(props: {
  snapshot: GovernanceShellSnapshot;
  onNavigate: (path: string) => void;
  onSelectObject: (objectId: string) => void;
}) {
  switch (props.snapshot.location.routeKey) {
    case "governance_home":
      return <LandingSurface snapshot={props.snapshot} onNavigate={props.onNavigate} />;
    case "governance_tenants":
    case "config_tenants":
      return (
        <TenantGovernanceSurface
          snapshot={props.snapshot}
          onNavigate={props.onNavigate}
          onSelectObject={props.onSelectObject}
        />
      );
    case "governance_authority_links":
      return <AuthoritySurface snapshot={props.snapshot} />;
    case "governance_compliance":
      return <ComplianceSurface snapshot={props.snapshot} />;
    case "governance_records":
    case "governance_records_holds":
    case "governance_records_disposition":
      return (
        <RecordsSurface
          snapshot={props.snapshot}
          onNavigate={props.onNavigate}
          onSelectObject={props.onSelectObject}
        />
      );
    case "access_home":
    case "access_users":
    case "access_roles":
      return <AccessSurface snapshot={props.snapshot} />;
    case "access_role_scope_studio":
      return <RoleScopeStudioSurface snapshot={props.snapshot} onNavigate={props.onNavigate} />;
    case "access_reviews":
      return <AccessSurface snapshot={props.snapshot} />;
    case "config_home":
      return <ChangeEnvelopeSurface snapshot={props.snapshot} caption="Configuration overview" />;
    case "config_bundles":
      return <ChangeEnvelopeSurface snapshot={props.snapshot} caption="Policy bundles" />;
    case "config_operational_destinations":
      return <OperationalDestinationConfigSurface snapshot={props.snapshot} />;
    case "config_backup_restore_channels":
      return <BackupRestoreChannelConfigSurface snapshot={props.snapshot} />;
    case "config_security_compliance_exports":
      return <SecurityComplianceExportConfigSurface snapshot={props.snapshot} />;
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

      <section
        className="governance-panel governance-panel--decision"
        data-testid="governance-decision-dock"
      >
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
            <span>
              The diff anchor stays visible until the promoted review is explicitly acknowledged.
            </span>
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
    dominantActionRef: dominantActionBinding?.markerRef ?? automationProfile.dominantActionRef,
    artifactModeState: snapshot.artifactModeState,
    recoveryPosture: snapshot.recoveryPosture,
    visualizationAuthority: snapshot.visualizationAuthority,
    routeShellPosture:
      snapshot.recoveryPosture === "live" ? "shell_live" : `shell_${snapshot.recoveryPosture}`,
  });
  const phase9LiveGatewayProjection = createLivePhase9ProjectionGatewayProjection({
    scenarioState: currentPhase9LiveScenarioState(),
    selectedSurfaceCode: phase9LiveSurfaceCodeForPath(snapshot.location.pathname),
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
      data-phase9-live-gateway-state={phase9LiveGatewayProjection.scenarioState}
      data-phase9-live-channel-state={phase9LiveGatewayProjection.selectedSurface.projectionState}
      data-phase9-live-action-settlement-state={
        phase9LiveGatewayProjection.selectedSurface.actionSettlementState
      }
      data-phase9-live-graph-verdict-state={
        phase9LiveGatewayProjection.selectedSurface.graphVerdictState
      }
      data-phase9-live-delta-gate-state={phase9LiveGatewayProjection.selectedSurface.deltaGateState}
      data-phase9-live-return-token-state={
        phase9LiveGatewayProjection.selectedSurface.returnTokenState
      }
      data-phase9-live-raw-event-browser-join-allowed={String(
        phase9LiveGatewayProjection.rawEventBrowserJoinAllowed,
      )}
      data-reduced-motion="respect"
      {...rootAutomationAttributes}
    >
      <header className="governance-shell__header" role="banner">
        <ScopeRibbon snapshot={snapshot} />
        <StatusStrip snapshot={snapshot} onSetDisposition={props.onSetDisposition} />
      </header>
      <GovernancePhase9LiveProjectionGatewayStrip
        projection={phase9LiveGatewayProjection}
        currentRoute={snapshot.location.pathname}
      />

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

          <MainSurface
            snapshot={snapshot}
            onNavigate={props.onNavigate}
            onSelectObject={props.onSelectObject}
          />

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
