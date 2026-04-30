import type { ReactNode } from "react";

export const CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE = "Governed_Artifact_Handoff_Studio";

export type CrossOrgArtifactTone = "neutral" | "verified" | "preview" | "warning" | "blocked";
export type CrossOrgArtifactStageMode =
  | "summary_first"
  | "preview"
  | "print"
  | "download"
  | "export"
  | "external_handoff"
  | "summary_only"
  | "handoff_only";
export type CrossOrgArtifactGrantState = "active" | "summary_only" | "blocked";
export type CrossOrgReturnAnchorState = "safe" | "guarded" | "blocked";

export interface CrossOrgSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface CrossOrgContentLegendItem {
  readonly term: string;
  readonly meaning: string;
  readonly tone?: CrossOrgArtifactTone;
}

export interface CrossOrgTimelineStatusAnnotation {
  readonly annotationId: string;
  readonly label: string;
  readonly state: string;
  readonly detail: string;
}

export interface CrossOrgArtifactAction {
  readonly actionId: string;
  readonly label: string;
  readonly detail: string;
  readonly disabled?: boolean;
  readonly tone?: "primary" | "secondary" | "warn";
}

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function CrossOrgArtifactSurfaceFrame(props: {
  title: string;
  summary: string;
  eyebrow?: string;
  tone?: CrossOrgArtifactTone;
  testId?: string;
  contextId?: string;
  visualMode?: string;
  metadata?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={joinClasses(
        "cross-org-artifact-surface",
        props.tone && `cross-org-artifact-surface--${props.tone}`,
      )}
      data-testid={props.testId ?? "CrossOrgArtifactSurfaceFrame"}
      data-artifact-context={props.contextId}
      data-visual-mode={props.visualMode ?? CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE}
    >
      <header className="cross-org-artifact-surface__header">
        <div className="cross-org-artifact-surface__copy">
          <p className="cross-org-artifact-surface__eyebrow">
            {props.eyebrow ?? "CrossOrgArtifactSurfaceFrame"}
          </p>
          <h3>{props.title}</h3>
          <p>{props.summary}</p>
        </div>
        {props.metadata ? (
          <div className="cross-org-artifact-surface__meta">{props.metadata}</div>
        ) : null}
      </header>
      <div className="cross-org-artifact-surface__body">{props.children}</div>
    </section>
  );
}

export function ArtifactParityBanner(props: {
  title: string;
  summary: string;
  tone?: CrossOrgArtifactTone;
  parityLabel: string;
  authorityLabel: string;
  stageMode: CrossOrgArtifactStageMode;
}) {
  return (
    <section
      className={joinClasses(
        "cross-org-artifact-banner",
        props.tone && `cross-org-artifact-banner--${props.tone}`,
      )}
      data-testid="ArtifactParityBanner"
      data-parity-stage-mode={props.stageMode}
    >
      <div>
        <p className="cross-org-artifact-surface__eyebrow">ArtifactParityBanner</p>
        <h4>{props.title}</h4>
        <p>{props.summary}</p>
      </div>
      <dl className="cross-org-artifact-banner__facts">
        <div>
          <dt>Parity</dt>
          <dd>{props.parityLabel}</dd>
        </div>
        <div>
          <dt>Authority</dt>
          <dd>{props.authorityLabel}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{props.stageMode.replaceAll("_", " ")}</dd>
        </div>
      </dl>
    </section>
  );
}

export function NetworkConfirmationArtifactStage(props: {
  title: string;
  summary: string;
  stageMode: CrossOrgArtifactStageMode;
  identityRows: readonly CrossOrgSummaryRow[];
  truthRows?: readonly CrossOrgSummaryRow[];
  previewTitle?: string;
  previewSummary?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className="cross-org-artifact-stage"
      data-testid="NetworkConfirmationArtifactStage"
      data-artifact-stage-mode={props.stageMode}
    >
      <div className="cross-org-artifact-stage__hero">
        <div>
          <p className="cross-org-artifact-surface__eyebrow">NetworkConfirmationArtifactStage</p>
          <h4>{props.title}</h4>
          <p>{props.summary}</p>
        </div>
        <span className="cross-org-artifact-chip">{props.stageMode.replaceAll("_", " ")}</span>
      </div>
      <div className="cross-org-artifact-stage__grid">
        <dl className="cross-org-artifact-grid">
          {props.identityRows.map((row) => (
            <div key={`identity-${row.label}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {props.previewTitle || props.previewSummary || props.truthRows?.length ? (
          <section className="cross-org-artifact-stage__preview">
            <h5>{props.previewTitle ?? "Approved summary"}</h5>
            {props.previewSummary ? <p>{props.previewSummary}</p> : null}
            {props.truthRows?.length ? (
              <dl className="cross-org-artifact-grid cross-org-artifact-grid--compact">
                {props.truthRows.map((row) => (
                  <div key={`truth-${row.label}`}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ) : null}
      </div>
      {props.children ? <div className="cross-org-artifact-stage__footer">{props.children}</div> : null}
    </section>
  );
}

export function PracticeNotificationArtifactSummary(props: {
  title: string;
  summary: string;
  rows: readonly CrossOrgSummaryRow[];
  previewTitle?: string;
  previewBody?: string;
}) {
  return (
    <section
      className="cross-org-artifact-panel"
      data-testid="PracticeNotificationArtifactSummary"
    >
      <div className="cross-org-artifact-panel__head">
        <div>
          <p className="cross-org-artifact-surface__eyebrow">
            PracticeNotificationArtifactSummary
          </p>
          <h4>{props.title}</h4>
          <p>{props.summary}</p>
        </div>
      </div>
      {props.previewTitle || props.previewBody ? (
        <div className="cross-org-artifact-stage__preview">
          <h5>{props.previewTitle ?? "Notification preview"}</h5>
          {props.previewBody ? <p>{props.previewBody}</p> : null}
        </div>
      ) : null}
      <dl className="cross-org-artifact-grid cross-org-artifact-grid--compact">
        {props.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function GovernedPlaceholderSummary(props: {
  title: string;
  summary: string;
  rows: readonly CrossOrgSummaryRow[];
  reasonLabel: string;
}) {
  return (
    <section
      className="cross-org-artifact-panel cross-org-artifact-panel--summary"
      data-testid="GovernedPlaceholderSummary"
      data-placeholder-reason={props.reasonLabel}
    >
      <div className="cross-org-artifact-panel__head">
        <div>
          <p className="cross-org-artifact-surface__eyebrow">GovernedPlaceholderSummary</p>
          <h4>{props.title}</h4>
          <p>{props.summary}</p>
        </div>
        <span className="cross-org-artifact-chip">{props.reasonLabel}</span>
      </div>
      <dl className="cross-org-artifact-grid cross-org-artifact-grid--compact">
        {props.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ArtifactHandoffActionBar(props: {
  toolbarLabel: string;
  actions: readonly CrossOrgArtifactAction[];
  activeActionId?: string | null;
  onAction?: (actionId: string) => void;
}) {
  return (
    <section
      className="cross-org-artifact-action-bar"
      data-testid="ArtifactHandoffActionBar"
      aria-label={props.toolbarLabel}
    >
      {props.actions.map((action) => (
        <button
          key={action.actionId}
          type="button"
          className={joinClasses(
            "cross-org-artifact-action",
            action.tone && `cross-org-artifact-action--${action.tone}`,
          )}
          data-action-id={action.actionId}
          data-active={props.activeActionId === action.actionId}
          disabled={action.disabled}
          aria-disabled={action.disabled}
          onClick={() => props.onAction?.(action.actionId)}
        >
          <strong>{action.label}</strong>
          <span>{action.detail}</span>
        </button>
      ))}
    </section>
  );
}

export function AccessibleTimelineStatusAnnotations(props: {
  title: string;
  summary: string;
  annotations: readonly CrossOrgTimelineStatusAnnotation[];
}) {
  return (
    <section
      className="cross-org-artifact-panel"
      data-testid="AccessibleTimelineStatusAnnotations"
      aria-label={props.title}
    >
      <div className="cross-org-artifact-panel__head">
        <div>
          <p className="cross-org-artifact-surface__eyebrow">
            AccessibleTimelineStatusAnnotations
          </p>
          <h4>{props.title}</h4>
          <p>{props.summary}</p>
        </div>
      </div>
      <ol className="cross-org-artifact-annotations">
        {props.annotations.map((annotation) => (
          <li key={annotation.annotationId} data-annotation-state={annotation.state}>
            <strong>{annotation.label}</strong>
            <span>{annotation.state}</span>
            <p>{annotation.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ReturnAnchorReceipt(props: {
  title: string;
  summary: string;
  anchorLabel: string;
  actionLabel?: string;
  state?: CrossOrgReturnAnchorState;
  onReturn?: () => void;
}) {
  return (
    <section
      className={joinClasses(
        "cross-org-artifact-panel",
        "cross-org-artifact-panel--receipt",
        props.state && `cross-org-artifact-panel--${props.state}`,
      )}
      data-testid="ReturnAnchorReceipt"
      data-return-anchor-state={props.state ?? "safe"}
    >
      <div className="cross-org-artifact-panel__head">
        <div>
          <p className="cross-org-artifact-surface__eyebrow">ReturnAnchorReceipt</p>
          <h4>{props.title}</h4>
          <p>{props.summary}</p>
        </div>
        <span className="cross-org-artifact-chip">{props.anchorLabel}</span>
      </div>
      {props.onReturn ? (
        <button
          type="button"
          className="cross-org-artifact-return"
          onClick={props.onReturn}
        >
          {props.actionLabel ?? `Return to ${props.anchorLabel}`}
        </button>
      ) : null}
    </section>
  );
}

export function CrossOrgContentLegend(props: {
  title: string;
  summary: string;
  items: readonly CrossOrgContentLegendItem[];
}) {
  return (
    <section className="cross-org-artifact-panel" data-testid="CrossOrgContentLegend">
      <div className="cross-org-artifact-panel__head">
        <div>
          <p className="cross-org-artifact-surface__eyebrow">CrossOrgContentLegend</p>
          <h4>{props.title}</h4>
          <p>{props.summary}</p>
        </div>
      </div>
      <div className="cross-org-artifact-legend">
        {props.items.map((item) => (
          <article
            key={item.term}
            className={joinClasses(
              "cross-org-artifact-legend__item",
              item.tone && `cross-org-artifact-legend__item--${item.tone}`,
            )}
          >
            <strong>{item.term}</strong>
            <p>{item.meaning}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GrantBoundPreviewState(props: {
  title: string;
  summary: string;
  grantState: CrossOrgArtifactGrantState;
  rows: readonly CrossOrgSummaryRow[];
}) {
  return (
    <section
      className={joinClasses(
        "cross-org-artifact-panel",
        "cross-org-artifact-panel--grant",
        `cross-org-artifact-panel--grant-${props.grantState}`,
      )}
      data-testid="GrantBoundPreviewState"
      data-grant-state={props.grantState}
    >
      <div className="cross-org-artifact-panel__head">
        <div>
          <p className="cross-org-artifact-surface__eyebrow">GrantBoundPreviewState</p>
          <h4>{props.title}</h4>
          <p>{props.summary}</p>
        </div>
        <span className="cross-org-artifact-chip">{props.grantState.replaceAll("_", " ")}</span>
      </div>
      <dl className="cross-org-artifact-grid cross-org-artifact-grid--compact">
        {props.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
