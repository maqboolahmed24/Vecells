import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  formatClockLabel,
  routeStepLabel,
  type ContinueYourRequestEntry,
  type DraftMergePlanRecord,
  type DraftRecoveryRecordView,
  type DraftSaveTruthView,
} from "./patient-intake-save-truth";

function stateMarkGlyph(tone: DraftSaveTruthView["stateMarkTone"]) {
  if (tone === "safe") {
    return "check";
  }
  if (tone === "review") {
    return "swap";
  }
  if (tone === "continuity") {
    return "bridge";
  }
  return "pulse";
}

function SaveStateMark({ tone }: { tone: DraftSaveTruthView["stateMarkTone"] }) {
  const glyph = stateMarkGlyph(tone);
  return (
    <span
      className="patient-intake-mission-frame__state-mark"
      data-tone={tone}
      aria-hidden="true"
    >
      <span data-glyph={glyph} />
    </span>
  );
}

export function AmbientStateRibbon({
  truth,
  onAction,
}: {
  truth: DraftSaveTruthView;
  onAction: (() => void) | null;
}) {
  const liveRegionId = useId();
  const [announcement, setAnnouncement] = useState(truth.liveAnnouncement);
  const lastAnnouncementKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAnnouncementKeyRef.current === truth.announcementKey) {
      return;
    }
    lastAnnouncementKeyRef.current = truth.announcementKey;
    setAnnouncement(truth.liveAnnouncement);
  }, [truth.announcementKey, truth.liveAnnouncement]);

  return (
    <section
      className="patient-intake-mission-frame__status-strip"
      data-testid="patient-intake-status-strip"
      data-status-state={truth.state}
      data-warn-on-hard-exit={truth.shouldWarnOnHardExit ? "true" : "false"}
      data-suppress-saved-reason={truth.suppressSavedReason ?? ""}
      aria-describedby={liveRegionId}
    >
      <div className="patient-intake-mission-frame__status-cluster patient-intake-mission-frame__status-cluster--left">
        <SaveStateMark tone={truth.stateMarkTone} />
        <div className="patient-intake-mission-frame__status-stack">
          <span className="patient-intake-mission-frame__status-kicker">Draft status</span>
          <strong data-testid="patient-intake-save-label">{truth.label}</strong>
        </div>
      </div>
      <div className="patient-intake-mission-frame__status-cluster patient-intake-mission-frame__status-cluster--center">
        <p data-testid="patient-intake-save-detail">{truth.detail}</p>
        <span id={liveRegionId} aria-live="polite" aria-atomic="true">
          {announcement}
        </span>
        <small>{truth.meta}</small>
      </div>
      <div className="patient-intake-mission-frame__status-cluster patient-intake-mission-frame__status-cluster--right">
        {truth.actionLabel && onAction ? (
          <button
            type="button"
            className="patient-intake-mission-frame__status-action"
            data-tone={truth.actionTone}
            onClick={onAction}
            data-testid="patient-intake-save-action"
          >
            {truth.actionLabel}
          </button>
        ) : (
          <span className="patient-intake-mission-frame__status-placeholder" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}

export function ContinueYourRequestCard({
  entry,
  onContinue,
  onStartAgain,
}: {
  entry: ContinueYourRequestEntry;
  onContinue: () => void;
  onStartAgain: () => void;
}) {
  return (
    <section
      className="patient-intake-mission-frame__continue-card"
      data-testid="patient-intake-continue-card"
      data-status-state={entry.statusState}
    >
      <div className="patient-intake-mission-frame__continue-card-head">
        <span>Saved request thread</span>
        <strong>{entry.lastUpdatedLabel}</strong>
      </div>
      <h3>{entry.title}</h3>
      <p>{entry.summary}</p>
      <dl className="patient-intake-mission-frame__continue-card-meta">
        <div>
          <dt>Step</dt>
          <dd>{entry.stepLabel}</dd>
        </div>
        <div>
          <dt>Next</dt>
          <dd>{entry.statusState === "resume safely" ? "Reopen the last safe draft state" : "Continue where you left off"}</dd>
        </div>
      </dl>
      <div className="patient-intake-mission-frame__continue-card-actions">
        <button
          type="button"
          className="patient-intake-mission-frame__primary-button"
          onClick={onContinue}
          data-testid="patient-intake-continue-action"
        >
          {entry.dominantActionLabel}
        </button>
        <button
          type="button"
          className="patient-intake-mission-frame__ghost-button"
          onClick={onStartAgain}
          data-testid="patient-intake-start-again-action"
        >
          Start again
        </button>
      </div>
    </section>
  );
}

function ConflictRow({
  groupKey,
  title,
  localLabel,
  localValue,
  serverLabel,
  serverValue,
  selectedResolution,
  systemReason,
  onChoose,
}: {
  groupKey: string;
  title: string;
  localLabel: string;
  localValue: string;
  serverLabel: string;
  serverValue: string;
  selectedResolution: "keep_local" | "use_server";
  systemReason: string;
  onChoose: (resolution: "keep_local" | "use_server") => void;
}) {
  return (
    <article className="patient-intake-mission-frame__merge-row">
      <div className="patient-intake-mission-frame__merge-row-head">
        <strong>{title}</strong>
        <small>{systemReason}</small>
      </div>
      <div className="patient-intake-mission-frame__merge-columns">
        <section data-selected={selectedResolution === "keep_local" ? "true" : "false"}>
          <span>{localLabel}</span>
          <p>{localValue}</p>
          <button
            type="button"
            onClick={() => onChoose("keep_local")}
            data-testid={`patient-intake-merge-choice-${groupKey}-keep-local`}
          >
            Keep mine
          </button>
        </section>
        <section data-selected={selectedResolution === "use_server" ? "true" : "false"}>
          <span>{serverLabel}</span>
          <p>{serverValue}</p>
          <button
            type="button"
            onClick={() => onChoose("use_server")}
            data-testid={`patient-intake-merge-choice-${groupKey}-use-server`}
          >
            Use newer
          </button>
        </section>
      </div>
    </article>
  );
}

export function MergeReviewSheet({
  mergePlan,
  onChoose,
  onConfirm,
}: {
  mergePlan: DraftMergePlanRecord;
  onChoose: (groupId: string, resolution: "keep_local" | "use_server") => void;
  onConfirm: () => void;
}) {
  const grouped = useMemo(
    () =>
      mergePlan.groups.reduce<Record<string, DraftMergePlanRecord["groups"][number][]>>(
        (accumulator, group) => {
          const bucket = accumulator[group.groupType] ?? [];
          bucket.push(group);
          accumulator[group.groupType] = bucket;
          return accumulator;
        },
        {},
      ),
    [mergePlan.groups],
  );

  return (
    <section
      className="patient-intake-mission-frame__merge-sheet"
      data-testid="patient-intake-merge-sheet"
      tabIndex={-1}
    >
      <div className="patient-intake-mission-frame__merge-sheet-head">
        <span>Review changes</span>
        <h3>Choose one result for every changed group</h3>
        <p>
          Another saved draft version now exists. Select the result that should remain authoritative before this shell continues.
        </p>
      </div>
      {(["answer_fields", "attachments", "step_markers"] as const).map((groupType) => {
        const groups = grouped[groupType];
        if (!groups || groups.length === 0) {
          return null;
        }
        return (
          <section key={groupType} className="patient-intake-mission-frame__merge-group">
            <div className="patient-intake-mission-frame__merge-group-head">
              <span>
                {groupType === "answer_fields"
                  ? "Question answers"
                  : groupType === "attachments"
                    ? "Supporting files"
                    : "Resume position"}
              </span>
              <strong>{groups.length}</strong>
            </div>
            {groups.map((group) => (
              <ConflictRow
                key={group.groupId}
                groupKey={group.groupId}
                title={group.title}
                localLabel={group.localLabel}
                localValue={group.localValue}
                serverLabel={group.serverLabel}
                serverValue={group.serverValue}
                selectedResolution={group.selectedResolution}
                systemReason={group.systemReason}
                onChoose={(resolution) => onChoose(group.groupId, resolution)}
              />
            ))}
          </section>
        );
      })}
      <div className="patient-intake-mission-frame__merge-sheet-footer">
        <small>
          Opened at {formatClockLabel(mergePlan.openedAt)} · server version {mergePlan.actualDraftVersion}
        </small>
        <button
          type="button"
          className="patient-intake-mission-frame__primary-button"
          onClick={onConfirm}
          data-testid="patient-intake-merge-confirm"
        >
          Confirm selected result
        </button>
      </div>
    </section>
  );
}

export function RecoveryBridgePanel({
  recovery,
  onResume,
}: {
  recovery: DraftRecoveryRecordView;
  onResume: () => void;
}) {
  return (
    <section
      className="patient-intake-mission-frame__recovery-bridge"
      data-testid="patient-intake-recovery-bridge"
      tabIndex={-1}
    >
      <div className="patient-intake-mission-frame__recovery-head">
        <span>Resume safely</span>
        <h3>We kept the last safe request state</h3>
        <p>{recovery.explanation}</p>
      </div>
      <div className="patient-intake-mission-frame__recovery-card">
        <strong>What we kept</strong>
        <ul>
          {recovery.keptItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="patient-intake-mission-frame__recovery-meta">
        <span>{routeStepLabel("review_submit")}</span>
        <strong>{formatClockLabel(recovery.recordedAt)}</strong>
      </div>
      <button
        type="button"
        className="patient-intake-mission-frame__primary-button"
        onClick={onResume}
        data-testid="patient-intake-recovery-action"
      >
        {recovery.dominantActionLabel}
      </button>
    </section>
  );
}
