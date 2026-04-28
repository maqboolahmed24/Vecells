import { useEffect, useState } from "react";
import type {
  AdminDependencyPanelProjection,
  AdminResolutionStageProjection,
  BoundaryDriftRecoveryProjection,
  PatientExpectationPreviewProjection,
  SelfCareAdminViewsRouteProjection,
  SelfCareIssueStageProjection,
  SelfCarePreviewSummaryProjection,
} from "./workspace-selfcare-admin.data";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function labelFromToken(value: string): string {
  return value.replaceAll("_", " ");
}

function toneForBoundary(value: string): "self_care" | "admin" | "reopen" {
  if (value === "self_care") {
    return "self_care";
  }
  if (value === "admin_resolution") {
    return "admin";
  }
  return "reopen";
}

function ConsequenceWorkbenchRow({
  row,
  onSelectCase,
}: {
  row: SelfCareAdminViewsRouteProjection["rows"][number];
  onSelectCase: (taskId: string, anchorRef: string) => void;
}) {
  return (
    <article
      className="staff-shell__consequence-row"
      data-testid="ConsequenceWorkbenchRow"
      data-task-id={row.taskId}
      data-selected={row.selected ? "true" : "false"}
      data-boundary-mode={row.boundaryMode}
      data-admin-dependency-state={row.dependencyState}
      data-advice-settlement={row.adviceSettlement}
      data-admin-settlement={row.adminSettlement}
    >
      <button
        type="button"
        className="staff-shell__consequence-row-main"
        onClick={() => onSelectCase(row.taskId, row.anchorRef)}
      >
        <div className="staff-shell__consequence-row-head">
          <div>
            <strong>{row.patientLabel}</strong>
            <span>{row.modeLabel}</span>
          </div>
          <span
            className="staff-shell__consequence-chip"
            data-tone={toneForBoundary(row.boundaryMode)}
          >
            {labelFromToken(row.boundaryMode)}
          </span>
        </div>
        <p>{row.summary}</p>
        <div className="staff-shell__consequence-row-meta">
          <span>{labelFromToken(row.reopenState)}</span>
          <span>{labelFromToken(row.dependencyState)}</span>
        </div>
      </button>
      <div className="staff-shell__consequence-row-signals">
        <span className="staff-shell__consequence-badge">{labelFromToken(row.adviceSettlement)}</span>
        <span className="staff-shell__consequence-badge">{labelFromToken(row.adminSettlement)}</span>
      </div>
    </article>
  );
}

export function SelfCarePreviewSummary({
  projection,
}: {
  projection: SelfCarePreviewSummaryProjection;
}) {
  return (
    <section
      className="staff-shell__consequence-panel staff-shell__consequence-panel--selfcare"
      data-testid="SelfCarePreviewSummary"
      data-advice-settlement={projection.adviceSettlement}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">SelfCarePreviewSummary</span>
        <h3>Current self-care preview</h3>
        <p>{projection.safetyNetSummary}</p>
      </header>
      <dl className="staff-shell__consequence-facts">
        <div>
          <dt>Bundle version</dt>
          <dd>{projection.bundleVersionRef}</dd>
        </div>
        <div>
          <dt>Variant</dt>
          <dd>{projection.variantLabel}</dd>
        </div>
        <div>
          <dt>Locale</dt>
          <dd>{projection.localeLabel}</dd>
        </div>
        <div>
          <dt>Watch window</dt>
          <dd>{projection.watchWindowLabel}</dd>
        </div>
        <div>
          <dt>Release watch</dt>
          <dd>{projection.releaseWatchRef}</dd>
        </div>
        <div>
          <dt>Trust</dt>
          <dd>{labelFromToken(projection.trustState)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function SelfCareIssueStage({
  projection,
  draftValue,
  onDraftChange,
}: {
  projection: SelfCareIssueStageProjection;
  draftValue: string;
  onDraftChange: (value: string) => void;
}) {
  const frozen = projection.stageState !== "issue_ready";
  return (
    <section
      className="staff-shell__consequence-panel staff-shell__consequence-panel--stage"
      data-testid="SelfCareIssueStage"
      data-stage-state={projection.stageState}
      data-advice-settlement={projection.stageState === "issue_ready" ? "renderable" : "frozen"}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">SelfCareIssueStage</span>
        <h3>Issue informational guidance</h3>
        <p>{projection.summary}</p>
      </header>

      <div className="staff-shell__consequence-evidence-list">
        {projection.issueEvidence.map((item) => (
          <article key={item} className="staff-shell__consequence-evidence-item">
            <strong>Issue guard</strong>
            <p>{item}</p>
          </article>
        ))}
      </div>

      <label className="staff-shell__consequence-field">
        <span>Staff confirmation note</span>
        <textarea
          value={draftValue}
          onChange={(event) => onDraftChange(event.currentTarget.value)}
          readOnly={frozen}
          aria-label="Self-care confirmation draft"
        />
      </label>

      {projection.freezeReason && (
        <div className="staff-shell__consequence-alert" data-tone="critical">
          <strong>Issue frozen</strong>
          <p>{projection.freezeReason}</p>
        </div>
      )}

      <div className="staff-shell__consequence-action-row">
        <button
          type="button"
          className="staff-shell__inline-action"
          disabled={!projection.actionEnabled}
        >
          {projection.actionLabel}
        </button>
        <span className="staff-shell__consequence-footnote">
          Informational advice only. This path may not imply bounded admin completion.
        </span>
      </div>
    </section>
  );
}

export function AdminDependencyPanel({
  projection,
}: {
  projection: AdminDependencyPanelProjection;
}) {
  return (
    <aside
      className="staff-shell__consequence-panel staff-shell__consequence-panel--side"
      data-testid="AdminDependencyPanel"
      data-admin-dependency-state={projection.dependencyState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">AdminDependencyPanel</span>
        <h3>Dependency and reopen fence</h3>
        <p>{projection.dominantRecoveryLabel}</p>
      </header>
      <dl className="staff-shell__consequence-facts">
        <div>
          <dt>Dependency set</dt>
          <dd>{projection.dependencySetRef}</dd>
        </div>
        <div>
          <dt>Dependency state</dt>
          <dd>{labelFromToken(projection.dependencyState)}</dd>
        </div>
        <div>
          <dt>Reopen state</dt>
          <dd>{labelFromToken(projection.reopenState)}</dd>
        </div>
        <div>
          <dt>Recovery route</dt>
          <dd>{projection.dominantRecoveryRouteRef}</dd>
        </div>
      </dl>
      <div className="staff-shell__consequence-blockers">
        {projection.blockers.map((blocker) => (
          <article
            key={blocker.blockerId}
            className="staff-shell__consequence-blocker"
            data-tone={blocker.tone}
            data-dominant={blocker.dominant ? "true" : "false"}
          >
            <strong>{blocker.label}</strong>
            <p>{blocker.summary}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

export function PatientExpectationPreview({
  projection,
}: {
  projection: PatientExpectationPreviewProjection;
}) {
  return (
    <section
      className="staff-shell__consequence-panel staff-shell__consequence-panel--side"
      data-testid="PatientExpectationPreview"
      data-expectation-class={projection.expectationClass}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">PatientExpectationPreview</span>
        <h3>What the patient will see</h3>
        <p>{projection.headline}</p>
      </header>
      <div className="staff-shell__consequence-preview-copy">
        <p>{projection.summary}</p>
      </div>
      <dl className="staff-shell__consequence-facts">
        <div>
          <dt>Template</dt>
          <dd>{projection.expectationTemplateRef}</dd>
        </div>
        <div>
          <dt>Expectation class</dt>
          <dd>{labelFromToken(projection.expectationClass)}</dd>
        </div>
        <div>
          <dt>Delivery mode</dt>
          <dd>{labelFromToken(projection.deliveryMode)}</dd>
        </div>
        <div>
          <dt>Next review</dt>
          <dd>{projection.nextReviewLabel}</dd>
        </div>
      </dl>
      <p className="staff-shell__consequence-footnote">{projection.tupleAlignmentLabel}</p>
    </section>
  );
}

export function AdminResolutionStage({
  projection,
  selectedSubtypeRef,
  onSelectSubtype,
}: {
  projection: AdminResolutionStageProjection;
  selectedSubtypeRef: string;
  onSelectSubtype: (subtypeRef: string) => void;
}) {
  const frozen =
    projection.stageState === "reopened" ||
    projection.stageState === "blocked_pending_safety" ||
    projection.stageState === "stale_recoverable";
  return (
    <section
      className="staff-shell__consequence-panel staff-shell__consequence-panel--stage"
      data-testid="AdminResolutionStage"
      data-admin-settlement={projection.settlementState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">AdminResolutionStage</span>
        <h3>{projection.subtypeLabel}</h3>
        <p>{projection.subtypeSummary}</p>
      </header>

      <div className="staff-shell__consequence-facts">
        <div>
          <strong>Owner</strong>
          <span>{projection.ownerLabel}</span>
        </div>
        <div>
          <strong>Waiting shape</strong>
          <span>{projection.waitingShapeLabel}</span>
        </div>
        <div>
          <strong>Waiting reason</strong>
          <span>{projection.waitingReasonLabel}</span>
        </div>
        <div>
          <strong>Required artifact</strong>
          <span>{projection.completionArtifactLabel}</span>
        </div>
      </div>

      <div className="staff-shell__consequence-option-list" role="listbox" aria-label="Admin subtype options">
        {projection.subtypeOptions.map((option) => {
          const selected = option.subtypeRef === selectedSubtypeRef;
          return (
            <button
              key={option.subtypeRef}
              type="button"
              className="staff-shell__consequence-option"
              aria-selected={selected}
              data-selected={selected ? "true" : "false"}
              onClick={() => onSelectSubtype(option.subtypeRef)}
              disabled={frozen}
            >
              <strong>{option.label}</strong>
              <span>{option.summary}</span>
            </button>
          );
        })}
      </div>

      <div className="staff-shell__consequence-alert" data-tone={projection.stageState === "completed" ? "accent" : "caution"}>
        <strong>Completion artifact</strong>
        <p>{projection.completionArtifactSummary}</p>
        <span>{projection.completionArtifactRef ?? "Artifact not yet recorded"}</span>
      </div>

      {projection.freezeReason && (
        <div className="staff-shell__consequence-alert" data-tone="critical">
          <strong>Admin mutation frozen</strong>
          <p>{projection.freezeReason}</p>
        </div>
      )}

      <div className="staff-shell__consequence-action-row">
        <button
          type="button"
          className="staff-shell__inline-action"
          disabled={!projection.actionEnabled}
        >
          {projection.actionLabel}
        </button>
        <span className="staff-shell__consequence-footnote">
          Bounded admin only. Completion stays illegal once the reopen fence is no longer stable.
        </span>
      </div>
    </section>
  );
}

export function BoundaryDriftRecovery({
  projection,
  preservedDraftSummary,
  preservedSubtypeLabel,
}: {
  projection: BoundaryDriftRecoveryProjection;
  preservedDraftSummary?: string | null;
  preservedSubtypeLabel?: string | null;
}) {
  if (!projection.visible) {
    return null;
  }

  return (
    <section
      className="staff-shell__consequence-panel staff-shell__consequence-panel--recovery"
      data-testid="BoundaryDriftRecovery"
      data-recovery-state={projection.recoveryState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">BoundaryDriftRecovery</span>
        <h3>Preserve context, freeze stale consequence</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__consequence-recovery-list">
        {projection.reasonLabels.map((reason) => (
          <article key={reason}>
            <strong>Tuple reason</strong>
            <p>{reason}</p>
          </article>
        ))}
        {preservedDraftSummary && (
          <article>
            <strong>Preserved draft</strong>
            <p>{preservedDraftSummary}</p>
          </article>
        )}
        {preservedSubtypeLabel && (
          <article>
            <strong>Preserved subtype</strong>
            <p>{preservedSubtypeLabel}</p>
          </article>
        )}
      </div>
      <p className="staff-shell__consequence-footnote">{projection.reopenCue}</p>
      <div className="staff-shell__consequence-alert" data-tone="critical">
        <strong>Same-shell recovery</strong>
        <p>{projection.guidance}</p>
      </div>
    </section>
  );
}

export function SelfCareAdminViewsRoute({
  projection,
  onSelectCase,
  onOpenTask,
}: {
  projection: SelfCareAdminViewsRouteProjection;
  onSelectCase: (taskId: string, anchorRef: string) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const [selfCareDrafts, setSelfCareDrafts] = useState<Record<string, string>>({});
  const [selectedSubtypeMap, setSelectedSubtypeMap] = useState<Record<string, string>>({});
  const detail = projection.detailSurface;

  useEffect(() => {
    const selfCareIssueStage = detail.selfCareIssueStage;
    if (selfCareIssueStage) {
      setSelfCareDrafts((current) =>
        current[detail.taskId]
          ? current
          : {
              ...current,
              [detail.taskId]: selfCareIssueStage.draftDefault,
            },
      );
    }
  }, [detail.selfCareIssueStage, detail.taskId]);

  useEffect(() => {
    const adminResolutionStage = detail.adminResolutionStage;
    if (adminResolutionStage) {
      setSelectedSubtypeMap((current) =>
        current[detail.taskId]
          ? current
          : {
              ...current,
              [detail.taskId]: adminResolutionStage.subtypeRef,
            },
      );
    }
  }, [detail.adminResolutionStage, detail.taskId]);

  const currentDraft = selfCareDrafts[detail.taskId] ?? detail.selfCareIssueStage?.draftDefault ?? "";
  const selectedSubtypeRef =
    selectedSubtypeMap[detail.taskId] ?? detail.adminResolutionStage?.subtypeRef ?? "";
  const preservedSubtypeLabel =
    detail.adminResolutionStage?.subtypeOptions.find((option) => option.subtypeRef === selectedSubtypeRef)?.label ??
    detail.adminResolutionStage?.subtypeLabel ??
    null;

  return (
    <section
      className="staff-shell__peer-route staff-shell__consequence-route"
      data-testid="SelfCareAdminViewsRoute"
      data-design-mode={projection.visualMode}
    >
      <header className="staff-shell__consequence-route-head">
        <div>
          <span className="staff-shell__eyebrow">Bounded_Consequence_Studio</span>
          <h2>Self-care and bounded admin consequence</h2>
          <p>{projection.queueHealthSummary}</p>
        </div>
        <button
          type="button"
          className="staff-shell__utility-button"
          onClick={() => onOpenTask(detail.taskId)}
        >
          Open task shell
        </button>
      </header>

      <div className="staff-shell__consequence-layout">
        <aside className="staff-shell__consequence-worklist" aria-label="Consequence worklist">
          {projection.rows.map((row) => (
            <ConsequenceWorkbenchRow key={row.rowId} row={row} onSelectCase={onSelectCase} />
          ))}
        </aside>

        <div
          className="staff-shell__consequence-main"
          data-testid="SelfCareAdminDetailSurface"
          data-boundary-mode={detail.boundaryMode}
          data-boundary-tuple={detail.boundaryTupleHash}
          data-admin-dependency-state={detail.adminDependencyPanel.dependencyState}
          data-advice-settlement={detail.adviceSettlement}
          data-admin-settlement={detail.adminSettlement}
        >
          <section className="staff-shell__consequence-boundary-summary">
            <div className="staff-shell__consequence-boundary-copy">
              <span className="staff-shell__eyebrow">Boundary digest</span>
              <h3>{detail.patientLabel}</h3>
              <p>{detail.routeSummary}</p>
            </div>
            <div className="staff-shell__consequence-boundary-facts">
              <div>
                <strong>Boundary mode</strong>
                <span>{labelFromToken(detail.boundaryMode)}</span>
              </div>
              <div>
                <strong>Meaning</strong>
                <span>{labelFromToken(detail.clinicalMeaningState)}</span>
              </div>
              <div>
                <strong>Follow-up scope</strong>
                <span>{labelFromToken(detail.operationalFollowUpScope)}</span>
              </div>
              <div>
                <strong>Decision epoch</strong>
                <span>{detail.decisionEpochRef}</span>
              </div>
              <div>
                <strong>Tuple</strong>
                <span>{detail.boundaryTupleHash}</span>
              </div>
              <div>
                <strong>Dominant meaning</strong>
                <span>{detail.dominantMeaningLabel}</span>
              </div>
            </div>
          </section>

          <BoundaryDriftRecovery
            projection={detail.boundaryDriftRecovery}
            preservedDraftSummary={detail.selfCareIssueStage ? currentDraft : null}
            preservedSubtypeLabel={detail.adminResolutionStage ? preservedSubtypeLabel : null}
          />

          {detail.selfCarePreviewSummary && (
            <SelfCarePreviewSummary projection={detail.selfCarePreviewSummary} />
          )}

          <div className="staff-shell__consequence-stage-layout">
            <div className="staff-shell__consequence-stage-column">
              {detail.selfCareIssueStage && (
                <SelfCareIssueStage
                  projection={detail.selfCareIssueStage}
                  draftValue={currentDraft}
                  onDraftChange={(value) =>
                    setSelfCareDrafts((current) => ({
                      ...current,
                      [detail.taskId]: value,
                    }))
                  }
                />
              )}
              {detail.adminResolutionStage && (
                <AdminResolutionStage
                  projection={detail.adminResolutionStage}
                  selectedSubtypeRef={selectedSubtypeRef}
                  onSelectSubtype={(subtypeRef) =>
                    setSelectedSubtypeMap((current) => ({
                      ...current,
                      [detail.taskId]: subtypeRef,
                    }))
                  }
                />
              )}

              <section className="staff-shell__consequence-panel staff-shell__consequence-panel--source">
                <header className="staff-shell__task-stack-header">
                  <span className="staff-shell__eyebrow">Lineage-visible source context</span>
                  <h3>Why this consequence is classified this way</h3>
                </header>
                <div className="staff-shell__consequence-recovery-list">
                  {detail.sourceSummaryPoints.map((item) => (
                    <article key={item}>
                      <strong>Source summary</strong>
                      <p>{item}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="staff-shell__consequence-side-column">
              <AdminDependencyPanel projection={detail.adminDependencyPanel} />
              <PatientExpectationPreview projection={detail.patientExpectationPreview} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
