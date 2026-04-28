import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  PharmacyAccessibleStatusBadge,
  PharmacyDialogAndDrawerSemantics,
} from "./pharmacy-accessibility-micro-interactions";

export const PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE = "Pharmacy_Dispatch_Assurance";

export type DispatchSurfaceTone = "ready" | "pending" | "watch" | "blocked";
export type DispatchWarningKind = "proof_drift" | "consent_drift" | "anchor_drift";
export type DispatchArtifactDisposition = "included" | "redacted" | "omitted";

export interface ChosenPharmacyAnchorCardModel {
  requestLineageLabel: string;
  providerLabel: string;
  providerSummary: string;
  preservedSelectionLabel: string | null;
  continuityKey: string;
  audienceLabel: string;
  anchorState: "current" | "read_only" | "stale";
  chips: readonly string[];
}

export interface DispatchProofStatusStripModel {
  tone: DispatchSurfaceTone;
  eyebrow: string;
  title: string;
  summary: string;
  statusPill: string;
  proofDeadlineLabel: string;
  nextStepLabel: string;
  recoveryOwnerLabel: string;
}

export interface DispatchEvidenceRowModel {
  rowId:
    | "transport_acceptance"
    | "provider_acceptance"
    | "authoritative_proof"
    | "proof_deadline"
    | "recovery_owner";
  label: string;
  value: string;
  summary: string;
  detail: string;
  tone: DispatchSurfaceTone;
}

export interface DispatchArtifactSummaryRowModel {
  artifactRef: string;
  label: string;
  disposition: DispatchArtifactDisposition;
  summary: string;
}

export interface DispatchArtifactSummaryCardModel {
  title: string;
  summary: string;
  transformNotesLabel: string;
  classificationLabel: string;
  rows: readonly DispatchArtifactSummaryRowModel[];
}

export interface PatientDispatchPendingStateModel {
  title: string;
  summary: string;
  dominantActionLabel: string;
  nextStepTitle: string;
  nextStepSummary: string;
  reassuranceLabel: string;
}

export interface PatientConsentCheckpointNoticeModel {
  title: string;
  summary: string;
  actionLabel: string;
  blockingReasonLabel: string;
}

export interface DispatchContinuityWarningStripModel {
  kind: DispatchWarningKind;
  tone: Exclude<DispatchSurfaceTone, "ready">;
  title: string;
  summary: string;
  actionLabel: string;
}

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function defaultEvidenceRowId(rows: readonly DispatchEvidenceRowModel[]): string | null {
  return (
    rows.find((row) => row.tone === "blocked" || row.tone === "watch")?.rowId ??
    rows[0]?.rowId ??
    null
  );
}

export function ChosenPharmacyAnchorCard(props: {
  anchor: ChosenPharmacyAnchorCardModel;
  compact?: boolean;
  footer?: ReactNode;
}) {
  return (
    <section
      className={joinClasses(
        "pharmacy-dispatch-anchor",
        props.compact && "pharmacy-dispatch-anchor--compact",
      )}
      data-testid="ChosenPharmacyAnchorCard"
      data-anchor-state={props.anchor.anchorState}
    >
      <header className="pharmacy-dispatch-anchor__header">
        <div>
          <p className="pharmacy-dispatch-kicker">{props.anchor.audienceLabel}</p>
          <h3>{props.anchor.providerLabel}</h3>
        </div>
        <PharmacyAccessibleStatusBadge
          label={titleCase(props.anchor.anchorState)}
          tone={props.anchor.anchorState}
          contextLabel="Anchor state"
          compact
          className="pharmacy-dispatch-pill"
        />
      </header>
      <p>{props.anchor.providerSummary}</p>
      {props.anchor.preservedSelectionLabel ? (
        <p className="pharmacy-dispatch-anchor__provenance">
          Previous selection preserved as provenance: {props.anchor.preservedSelectionLabel}
        </p>
      ) : null}
      <dl className="pharmacy-dispatch-inline-meta">
        <div>
          <dt>Request lineage</dt>
          <dd>{props.anchor.requestLineageLabel}</dd>
        </div>
        <div>
          <dt>Continuity key</dt>
          <dd>{props.anchor.continuityKey}</dd>
        </div>
      </dl>
      <div className="pharmacy-dispatch-chip-row">
        {props.anchor.chips.map((chip) => (
          <span key={chip} className="pharmacy-dispatch-chip">
            {chip}
          </span>
        ))}
      </div>
      {props.footer ? <div className="pharmacy-dispatch-anchor__footer">{props.footer}</div> : null}
    </section>
  );
}

export function DispatchProofStatusStrip(props: {
  status: DispatchProofStatusStripModel;
  compact?: boolean;
}) {
  return (
    <section
      className={joinClasses(
        "pharmacy-dispatch-status-strip",
        props.compact && "pharmacy-dispatch-status-strip--compact",
      )}
      data-testid="DispatchProofStatusStrip"
      data-tone={props.status.tone}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pharmacy-dispatch-status-strip__summary">
        <div>
          <p className="pharmacy-dispatch-kicker">{props.status.eyebrow}</p>
          <h3>{props.status.title}</h3>
          <p>{props.status.summary}</p>
        </div>
        <PharmacyAccessibleStatusBadge
          label={props.status.statusPill}
          tone={props.status.tone === "pending" ? "pending" : props.status.tone}
          contextLabel="Dispatch status"
          compact
          className="pharmacy-dispatch-pill"
        />
      </div>
      <dl className="pharmacy-dispatch-status-strip__meta">
        <div>
          <dt>Proof deadline</dt>
          <dd>{props.status.proofDeadlineLabel}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>{props.status.nextStepLabel}</dd>
        </div>
        <div>
          <dt>Recovery owner</dt>
          <dd>{props.status.recoveryOwnerLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function DispatchEvidenceRows(props: {
  rows: readonly DispatchEvidenceRowModel[];
}) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(() =>
    defaultEvidenceRowId(props.rows),
  );
  const scopeId = useId();

  useEffect(() => {
    setExpandedRowId(defaultEvidenceRowId(props.rows));
  }, [props.rows]);

  return (
    <section
      className="pharmacy-dispatch-evidence"
      data-testid="DispatchEvidenceRows"
      aria-label="Dispatch evidence rows"
    >
      <header className="pharmacy-dispatch-section-header">
        <div>
          <p className="pharmacy-dispatch-kicker">Evidence lanes</p>
          <h3>Proof, deadline, and recovery stay distinct</h3>
        </div>
      </header>
      <ol className="pharmacy-dispatch-evidence__list">
        {props.rows.map((row) => {
          const panelId = `${scopeId}-${row.rowId}`;
          const expanded = expandedRowId === row.rowId;
          return (
            <li key={row.rowId} className="pharmacy-dispatch-evidence__item">
              <button
                type="button"
                className="pharmacy-dispatch-evidence__button"
                data-testid={`dispatch-evidence-row-${row.rowId}`}
                data-tone={row.tone}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() =>
                  setExpandedRowId((current) => (current === row.rowId ? null : row.rowId))
                }
              >
                <span className="pharmacy-dispatch-evidence__copy">
                  <strong>{row.label}</strong>
                  <span>{row.summary}</span>
                </span>
                <span className="pharmacy-dispatch-evidence__value">{row.value}</span>
              </button>
              <div
                className="pharmacy-dispatch-evidence__detail"
                id={panelId}
                hidden={!expanded}
              >
                <p>{row.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function DispatchArtifactSummaryCard(props: {
  artifactSummary: DispatchArtifactSummaryCardModel;
}) {
  const [expanded, setExpanded] = useState(true);
  const detailsId = useId();

  return (
    <section
      className="pharmacy-dispatch-artifacts"
      data-testid="DispatchArtifactSummaryCard"
    >
      <header className="pharmacy-dispatch-section-header">
        <div>
          <p className="pharmacy-dispatch-kicker">Artifact scope</p>
          <h3>{props.artifactSummary.title}</h3>
        </div>
        <button
          type="button"
          className="pharmacy-dispatch-link-button"
          data-testid="dispatch-artifact-summary-toggle"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Hide artifact detail" : "Show artifact detail"}
        </button>
      </header>
      <p>{props.artifactSummary.summary}</p>
      <dl className="pharmacy-dispatch-inline-meta">
        <div>
          <dt>Transform notes</dt>
          <dd>{props.artifactSummary.transformNotesLabel}</dd>
        </div>
        <div>
          <dt>Classification</dt>
          <dd>{props.artifactSummary.classificationLabel}</dd>
        </div>
      </dl>
      <div id={detailsId} hidden={!expanded}>
        <ul className="pharmacy-dispatch-artifacts__list">
          {props.artifactSummary.rows.map((row) => (
            <li
              key={row.artifactRef}
              className="pharmacy-dispatch-artifacts__row"
              data-disposition={row.disposition}
            >
              <div>
                <strong>{row.label}</strong>
                <p>{row.summary}</p>
              </div>
              <span className="pharmacy-dispatch-pill" data-tone={row.disposition}>
                {titleCase(row.disposition)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function DispatchContinuityWarningStrip(props: {
  warning: DispatchContinuityWarningStripModel;
  onAction?: () => void;
}) {
  const isAlert = props.warning.tone === "blocked";

  return (
    <section
      className="pharmacy-dispatch-warning"
      data-testid="DispatchContinuityWarningStrip"
      data-kind={props.warning.kind}
      data-tone={props.warning.tone}
      role={isAlert ? "alert" : "status"}
      aria-live={isAlert ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <div>
        <p className="pharmacy-dispatch-kicker">Continuity warning</p>
        <h3>{props.warning.title}</h3>
        <p>{props.warning.summary}</p>
      </div>
      {props.onAction ? (
        <button
          type="button"
          className="pharmacy-dispatch-secondary-action"
          data-testid="dispatch-warning-action"
          onClick={props.onAction}
        >
          {props.warning.actionLabel}
        </button>
      ) : (
        <span className="pharmacy-dispatch-pill" data-tone={props.warning.tone}>
          {props.warning.actionLabel}
        </span>
      )}
    </section>
  );
}

export function PatientConsentCheckpointNotice(props: {
  notice: PatientConsentCheckpointNoticeModel;
  onAction?: () => void;
}) {
  return (
    <section
      className="pharmacy-dispatch-patient-notice"
      data-testid="PatientConsentCheckpointNotice"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div>
        <p className="pharmacy-dispatch-kicker">Current checkpoint</p>
        <h3>{props.notice.title}</h3>
        <p>{props.notice.summary}</p>
      </div>
      <div className="pharmacy-dispatch-patient-notice__footer">
        <span className="pharmacy-dispatch-pill" data-tone="blocked">
          {props.notice.blockingReasonLabel}
        </span>
        {props.onAction ? (
          <button
            type="button"
            className="pharmacy-dispatch-secondary-action"
            data-testid="patient-consent-checkpoint-action"
            onClick={props.onAction}
          >
            {props.notice.actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function PatientDispatchPendingState(props: {
  pendingState: PatientDispatchPendingStateModel;
  onAction?: () => void;
}) {
  return (
    <section
      className="pharmacy-dispatch-patient-state"
      data-testid="PatientDispatchPendingState"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <header className="pharmacy-dispatch-section-header">
        <div>
          <p className="pharmacy-dispatch-kicker">Referral status</p>
          <h3>{props.pendingState.title}</h3>
        </div>
        <span className="pharmacy-dispatch-pill" data-tone="watch">
          {props.pendingState.reassuranceLabel}
        </span>
      </header>
      <p>{props.pendingState.summary}</p>
      <article className="pharmacy-dispatch-next-step">
        <strong>{props.pendingState.nextStepTitle}</strong>
        <p>{props.pendingState.nextStepSummary}</p>
      </article>
      {props.onAction ? (
        <button
          type="button"
          className="pharmacy-dispatch-primary-action"
          data-testid="patient-dispatch-pending-action"
          onClick={props.onAction}
        >
          {props.pendingState.dominantActionLabel}
        </button>
      ) : null}
    </section>
  );
}

export function PharmacyReferralConfirmationDrawer(props: {
  open: boolean;
  title: string;
  summary: string;
  transportLabel: string;
  pathwayLabel: string;
  referralSummary: string;
  anchor: ChosenPharmacyAnchorCardModel;
  statusStrip: DispatchProofStatusStripModel;
  evidenceRows: readonly DispatchEvidenceRowModel[];
  artifactSummary: DispatchArtifactSummaryCardModel;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const drawerRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  if (!props.open) {
    return null;
  }

  return (
    <PharmacyDialogAndDrawerSemantics
      open={props.open}
      kind="drawer"
      title={props.title}
      closeLabel="Close referral confirmation drawer"
      onClose={props.onClose}
      panelRef={drawerRef}
      initialFocusRef={titleRef}
      panelClassName="pharmacy-dispatch-drawer"
      backdropClassName="pharmacy-dispatch-drawer-backdrop"
      panelTestId="PharmacyReferralConfirmationDrawer"
      backdropTestId="PharmacyReferralConfirmationDrawerBackdrop"
      ariaLabelledby={titleId}
      ariaDescribedby={descriptionId}
    >
      <header className="pharmacy-dispatch-drawer__header">
        <div>
          <p className="pharmacy-dispatch-kicker">Referral confirmation drawer</p>
          <h2 id={titleId} ref={titleRef} tabIndex={-1}>
            {props.title}
          </h2>
          <p id={descriptionId}>{props.summary}</p>
        </div>
        <button
          type="button"
          className="pharmacy-dispatch-icon-button"
          data-testid="dispatch-drawer-close"
          aria-label="Close referral confirmation drawer"
          onClick={props.onClose}
        >
          Close
        </button>
      </header>

      <div className="pharmacy-dispatch-drawer__meta">
        <article className="pharmacy-dispatch-drawer__meta-card">
          <span>Pathway</span>
          <strong>{props.pathwayLabel}</strong>
        </article>
        <article className="pharmacy-dispatch-drawer__meta-card">
          <span>Transport method</span>
          <strong>{props.transportLabel}</strong>
        </article>
      </div>

      <p className="pharmacy-dispatch-drawer__summary">{props.referralSummary}</p>

      <ChosenPharmacyAnchorCard anchor={props.anchor} compact />
      <DispatchProofStatusStrip status={props.statusStrip} compact />
      <DispatchEvidenceRows rows={props.evidenceRows} />
      <DispatchArtifactSummaryCard artifactSummary={props.artifactSummary} />
    </PharmacyDialogAndDrawerSemantics>
  );
}
