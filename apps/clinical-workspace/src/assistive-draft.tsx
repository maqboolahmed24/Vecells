import { useEffect, useId, useRef, useState, type RefObject } from "react";
import type { StaffRouteKind, StaffShellLedger } from "./workspace-shell.data";

export const ASSISTIVE_DRAFT_VISUAL_MODE = "Assistive_Draft_Diff_Deck";

export type AssistiveDraftCompareMode = "before" | "after" | "both";
export type AssistiveDraftLeaseState = "live" | "stale" | "expired" | "revoked" | "blocked";
export type AssistiveDraftSlotState = "live" | "stale" | "superseded" | "missing";
export type AssistiveDraftSessionState = "live" | "stale" | "blocked";
export type AssistiveDraftDiffKind = "keep" | "add" | "remove" | "change";

export type AssistiveDraftBlockReasonCode =
  | "stale_slot"
  | "stale_session"
  | "selected_anchor_drift"
  | "decision_epoch_drift"
  | "publication_drift"
  | "trust_posture_drift";

export type AssistiveDraftTargetSlot = {
  label: string;
  contentClass: "note_section" | "message_body" | "endpoint_reasoning" | "question_set";
  slotHash: string;
  state: AssistiveDraftSlotState;
  selectedAnchorRef: string;
};

export type AssistiveDraftPatchLease = {
  leaseRef: string;
  state: AssistiveDraftLeaseState;
  expiresLabel: string;
  validatedAgainst: string;
};

export type AssistiveDraftBlockReason = {
  code: AssistiveDraftBlockReasonCode;
  label: string;
  detail: string;
};

export type AssistiveDraftDiffLine = {
  id: string;
  kind: AssistiveDraftDiffKind;
  label: string;
  before: string;
  after: string;
  intent: string;
};

export type AssistiveDraftSection = {
  id: string;
  title: string;
  statusLabel: string;
  statusTone: "ready" | "blocked" | "queued";
  supportLabel: string;
  targetSlot: AssistiveDraftTargetSlot;
  patchLease: AssistiveDraftPatchLease;
  sessionState: AssistiveDraftSessionState;
  initialCompareMode: AssistiveDraftCompareMode;
  diffLines: AssistiveDraftDiffLine[];
  canInsert: boolean;
  insertLabel: string;
  helperText: string;
  blockedReasons: AssistiveDraftBlockReason[];
};

export type AssistiveDraftDeckState = {
  fixture: string;
  taskRef: string;
  routeKind: StaffRouteKind;
  selectedAnchorRef: string;
  heading: string;
  summary: string;
  draftArtifactRef: string;
  sessionRef: string;
  deckStatus: string;
  sections: AssistiveDraftSection[];
};

export type AssistiveDraftStateAdapterInput = {
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  taskRef: string;
  routeKind: StaffRouteKind;
};

type AssistiveDraftSectionCardProps = {
  section: AssistiveDraftSection;
  index: number;
  active: boolean;
  onFocusSection: (index: number) => void;
};

function readRequestedDraftFixture(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get("assistiveDraft");
}

function normalizeDraftFixture(value: string | null): string | null {
  switch (value) {
    case "enabled":
    case "insert-enabled":
      return "insert-enabled";
    case "blocked-slot":
    case "insert-blocked-slot":
      return "insert-blocked-slot";
    case "blocked-session":
    case "insert-blocked-session":
      return "insert-blocked-session";
    case "compare-open":
      return "compare-open";
    case "compare-closed":
      return "compare-closed";
    case "narrow-stacked":
      return "narrow-stacked";
    default:
      return null;
  }
}

function makeTargetSlot(
  selectedAnchorRef: string,
  overrides: Partial<AssistiveDraftTargetSlot> = {},
): AssistiveDraftTargetSlot {
  return {
    label: "Decision note - history slot",
    contentClass: "note_section",
    slotHash: "slot.412.task-311.anchor-history.v7",
    state: "live",
    selectedAnchorRef,
    ...overrides,
  };
}

function makePatchLease(
  overrides: Partial<AssistiveDraftPatchLease> = {},
): AssistiveDraftPatchLease {
  return {
    leaseRef: "draft_patch_lease.412.task-311.history.live",
    state: "live",
    expiresLabel: "Live for this review snapshot",
    validatedAgainst: "reviewVersion rv.311.19, decisionEpoch de.311.current",
    ...overrides,
  };
}

function historyDiffLines(): AssistiveDraftDiffLine[] {
  return [
    {
      id: "history-keep-presenting-issue",
      kind: "keep",
      label: "Keep",
      before: "Patient reports cough and wheeze after a viral illness.",
      after: "Patient reports cough and wheeze after a viral illness.",
      intent: "Keeps the current history wording.",
    },
    {
      id: "history-add-red-flags",
      kind: "add",
      label: "Add",
      before: "",
      after: "No same-day red flags are recorded in the request.",
      intent: "Adds safety context from the reviewed evidence.",
    },
    {
      id: "history-change-antibiotics",
      kind: "change",
      label: "Clarify",
      before: "Parent asks for antibiotics.",
      after: "Parent asks whether antibiotics are needed.",
      intent: "Avoids implying a request that was not stated.",
    },
  ];
}

function planDiffLines(): AssistiveDraftDiffLine[] {
  return [
    {
      id: "plan-keep-review",
      kind: "keep",
      label: "Keep",
      before: "Review if breathing worsens or fever persists.",
      after: "Review if breathing worsens or fever persists.",
      intent: "Keeps the current safety-net instruction.",
    },
    {
      id: "plan-add-inhaler",
      kind: "add",
      label: "Add",
      before: "",
      after: "Advise reliever inhaler use as already prescribed.",
      intent: "Adds a limited plan item supported by the medication record.",
    },
  ];
}

function buildEnabledSections(
  selectedAnchorRef: string,
  compareMode: AssistiveDraftCompareMode,
): AssistiveDraftSection[] {
  return [
    {
      id: "history-summary",
      title: "History summary",
      statusLabel: "Ready for human review",
      statusTone: "ready",
      supportLabel: "Evidence mapped to current task snapshot",
      targetSlot: makeTargetSlot(selectedAnchorRef),
      patchLease: makePatchLease(),
      sessionState: "live",
      initialCompareMode: compareMode,
      diffLines: historyDiffLines(),
      canInsert: true,
      insertLabel: "Insert in shown slot",
      helperText: "Insert creates draft text only; final note wording remains a human action.",
      blockedReasons: [],
    },
    {
      id: "safety-net-plan",
      title: "Safety-net plan",
      statusLabel: "Ready for human review",
      statusTone: "ready",
      supportLabel: "Uses current decision epoch and policy bundle",
      targetSlot: makeTargetSlot(selectedAnchorRef, {
        label: "Decision note - plan slot",
        slotHash: "slot.412.task-311.anchor-plan.v3",
      }),
      patchLease: makePatchLease({
        leaseRef: "draft_patch_lease.412.task-311.plan.live",
      }),
      sessionState: "live",
      initialCompareMode: compareMode,
      diffLines: planDiffLines(),
      canInsert: true,
      insertLabel: "Insert in shown slot",
      helperText: "The patch lease is scoped to the displayed plan slot only.",
      blockedReasons: [],
    },
  ];
}

function buildBlockedSlotSections(selectedAnchorRef: string): AssistiveDraftSection[] {
  const slotReason: AssistiveDraftBlockReason = {
    code: "stale_slot",
    label: "Target slot changed",
    detail: "The slot hash no longer matches the active insertion point.",
  };
  const anchorReason: AssistiveDraftBlockReason = {
    code: "selected_anchor_drift",
    label: "Selected anchor changed",
    detail: "The draft was prepared for an earlier selected anchor.",
  };

  return [
    {
      id: "history-summary",
      title: "History summary",
      statusLabel: "Insert blocked",
      statusTone: "blocked",
      supportLabel: "Draft remains readable as stale-recoverable context",
      targetSlot: makeTargetSlot(selectedAnchorRef, {
        state: "stale",
        slotHash: "slot.412.task-311.anchor-history.v6-stale",
      }),
      patchLease: makePatchLease({
        state: "stale",
        expiresLabel: "Stale after target slot moved",
      }),
      sessionState: "live",
      initialCompareMode: "both",
      diffLines: historyDiffLines(),
      canInsert: false,
      insertLabel: "Insert in shown slot",
      helperText: "Regenerate in place before any insert attempt.",
      blockedReasons: [slotReason, anchorReason],
    },
    {
      id: "safety-net-plan",
      title: "Safety-net plan",
      statusLabel: "Insert blocked",
      statusTone: "blocked",
      supportLabel: "Draft preserved; target must be revalidated",
      targetSlot: makeTargetSlot(selectedAnchorRef, {
        label: "Decision note - plan slot",
        state: "superseded",
        slotHash: "slot.412.task-311.anchor-plan.superseded",
      }),
      patchLease: makePatchLease({
        leaseRef: "draft_patch_lease.412.task-311.plan.stale",
        state: "stale",
        expiresLabel: "Stale after selected anchor drift",
      }),
      sessionState: "live",
      initialCompareMode: "after",
      diffLines: planDiffLines(),
      canInsert: false,
      insertLabel: "Insert in shown slot",
      helperText: "The rail stays in the same shell while the target is repaired.",
      blockedReasons: [anchorReason],
    },
  ];
}

function buildBlockedSessionSections(selectedAnchorRef: string): AssistiveDraftSection[] {
  const sessionReason: AssistiveDraftBlockReason = {
    code: "stale_session",
    label: "Assistive session is stale",
    detail: "The session fence no longer matches the current review version.",
  };
  const decisionReason: AssistiveDraftBlockReason = {
    code: "decision_epoch_drift",
    label: "Decision epoch advanced",
    detail: "The current decision epoch superseded the draft lease.",
  };
  const publicationReason: AssistiveDraftBlockReason = {
    code: "publication_drift",
    label: "Publication tuple changed",
    detail: "The surface or runtime publication tuple must be refreshed.",
  };
  const trustReason: AssistiveDraftBlockReason = {
    code: "trust_posture_drift",
    label: "Trust status degraded",
    detail: "The assistive trust envelope no longer authorizes insert.",
  };

  return [
    {
      id: "history-summary",
      title: "History summary",
      statusLabel: "Insert blocked",
      statusTone: "blocked",
      supportLabel: "Draft is visible but write controls are frozen",
      targetSlot: makeTargetSlot(selectedAnchorRef),
      patchLease: makePatchLease({
        state: "blocked",
        expiresLabel: "Blocked by stale session fence",
      }),
      sessionState: "stale",
      initialCompareMode: "both",
      diffLines: historyDiffLines(),
      canInsert: false,
      insertLabel: "Insert in shown slot",
      helperText: "Regenerate in place to mint a fresh session and lease.",
      blockedReasons: [sessionReason, decisionReason],
    },
    {
      id: "safety-net-plan",
      title: "Safety-net plan",
      statusLabel: "Insert blocked",
      statusTone: "blocked",
      supportLabel: "Approved fallback keeps draft text read-only",
      targetSlot: makeTargetSlot(selectedAnchorRef, {
        label: "Decision note - plan slot",
        slotHash: "slot.412.task-311.anchor-plan.v3",
      }),
      patchLease: makePatchLease({
        leaseRef: "draft_patch_lease.412.task-311.plan.blocked",
        state: "blocked",
        expiresLabel: "Blocked by publication and trust drift",
      }),
      sessionState: "blocked",
      initialCompareMode: "after",
      diffLines: planDiffLines(),
      canInsert: false,
      insertLabel: "Insert in shown slot",
      helperText: "Insert remains disabled until publication and trust clear.",
      blockedReasons: [publicationReason, trustReason],
    },
  ];
}

export function buildAssistiveDraftDeckState({
  runtimeScenario,
  selectedAnchorRef,
  taskRef,
  routeKind,
}: AssistiveDraftStateAdapterInput): AssistiveDraftDeckState | null {
  const fixture = normalizeDraftFixture(readRequestedDraftFixture());
  if (!fixture) {
    return null;
  }

  const blockedByScenario = runtimeScenario !== "live";
  const effectiveFixture = blockedByScenario ? "insert-blocked-session" : fixture;
  const compareMode: AssistiveDraftCompareMode =
    fixture === "compare-open" || fixture === "narrow-stacked" ? "both" : "after";
  const sections =
    effectiveFixture === "insert-blocked-slot"
      ? buildBlockedSlotSections(selectedAnchorRef)
      : effectiveFixture === "insert-blocked-session"
        ? buildBlockedSessionSections(selectedAnchorRef)
        : buildEnabledSections(
            selectedAnchorRef,
            fixture === "compare-closed" ? "after" : compareMode,
          );

  return {
    fixture: effectiveFixture,
    taskRef,
    routeKind,
    selectedAnchorRef,
    heading: "Draft note sections",
    summary:
      "Each section shows the draft wording, the exact target slot, and the current patch lease before insert is available.",
    draftArtifactRef: `draft_note_artifact.408.${taskRef}.clinician_note.v1`,
    sessionRef: `assistive_session.412.${taskRef}.${selectedAnchorRef}`,
    deckStatus: sections.some((section) => !section.canInsert)
      ? "Insert blocked until lease verified details is refreshed"
      : "Live patch lease available for shown slots",
    sections,
  };
}

export function AssistiveDraftKeyboardNavigator({
  deckRef,
  activeIndex,
  cardCount,
  onActiveIndexChange,
}: {
  deckRef: RefObject<HTMLElement | null>;
  activeIndex: number;
  cardCount: number;
  onActiveIndexChange: (index: number) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const deck = deckRef.current;
      if (!deck || !deck.contains(document.activeElement)) {
        return;
      }

      const lastIndex = Math.max(0, cardCount - 1);
      let nextIndex = activeIndex;
      if (event.key === "ArrowDown") {
        nextIndex = activeIndex >= lastIndex ? 0 : activeIndex + 1;
      } else if (event.key === "ArrowUp") {
        nextIndex = activeIndex <= 0 ? lastIndex : activeIndex - 1;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = lastIndex;
      } else {
        return;
      }

      event.preventDefault();
      onActiveIndexChange(nextIndex);
      deck.querySelector<HTMLElement>(`[data-assistive-draft-card-index="${nextIndex}"]`)?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, cardCount, deckRef, onActiveIndexChange]);

  return null;
}

export function AssistiveDraftSectionDeck({ deck }: { deck: AssistiveDraftDeckState }) {
  const headingId = useId();
  const deckRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const compareExpanded = deck.sections.some((section) => section.initialCompareMode === "both");

  return (
    <section
      ref={deckRef}
      className="assistive-draft"
      data-testid="AssistiveDraftSectionDeck"
      data-visual-mode={ASSISTIVE_DRAFT_VISUAL_MODE}
      data-fixture={deck.fixture}
      data-task-ref={deck.taskRef}
      data-selected-anchor-ref={deck.selectedAnchorRef}
      data-route-kind={deck.routeKind}
      data-compare-expanded={compareExpanded ? "true" : "false"}
      aria-labelledby={headingId}
    >
      <AssistiveDraftKeyboardNavigator
        deckRef={deckRef}
        activeIndex={activeIndex}
        cardCount={deck.sections.length}
        onActiveIndexChange={setActiveIndex}
      />
      <header className="assistive-draft__header">
        <div>
          <span className="assistive-draft__eyebrow">Draft deck</span>
          <h3 id={headingId}>{deck.heading}</h3>
        </div>
        <span className="assistive-draft__deck-status">{deck.deckStatus}</span>
      </header>
      <p className="assistive-draft__summary">{deck.summary}</p>
      <dl className="assistive-draft__deck-meta" aria-label="Draft deck references">
        <div>
          <dt>Artifact</dt>
          <dd>{deck.draftArtifactRef}</dd>
        </div>
        <div>
          <dt>Session</dt>
          <dd>{deck.sessionRef}</dd>
        </div>
      </dl>
      <div className="assistive-draft__section-list" role="list" aria-label="Draft note sections">
        {deck.sections.map((section, index) => (
          <AssistiveDraftSectionCard
            key={section.id}
            section={section}
            index={index}
            active={activeIndex === index}
            onFocusSection={setActiveIndex}
          />
        ))}
      </div>
    </section>
  );
}

export function AssistiveDraftSectionCard({
  section,
  index,
  active,
  onFocusSection,
}: AssistiveDraftSectionCardProps) {
  const headingId = useId();
  const statusId = useId();
  const blockReasonId = useId();
  const [compareMode, setCompareMode] = useState<AssistiveDraftCompareMode>(
    section.initialCompareMode,
  );
  const [insertRequested, setInsertRequested] = useState(false);

  useEffect(() => {
    setCompareMode(section.initialCompareMode);
    setInsertRequested(false);
  }, [section.id, section.initialCompareMode]);

  return (
    <article
      className="assistive-draft__section-card"
      data-testid="AssistiveDraftSectionCard"
      data-assistive-draft-card="true"
      data-assistive-draft-card-index={index}
      data-section-id={section.id}
      data-insert-allowed={section.canInsert ? "true" : "false"}
      data-insert-requested={insertRequested ? "true" : "false"}
      data-status-tone={section.statusTone}
      role="listitem"
      tabIndex={active ? 0 : -1}
      aria-labelledby={headingId}
      aria-describedby={statusId}
      onFocus={() => onFocusSection(index)}
      onClick={() => onFocusSection(index)}
    >
      <header className="assistive-draft__section-title-row">
        <div className="assistive-draft__section-title-copy">
          <span className="assistive-draft__section-index">Section {index + 1}</span>
          <h4 id={headingId}>{section.title}</h4>
        </div>
        <span className="assistive-draft__section-status" data-status-tone={section.statusTone}>
          {section.statusLabel}
        </span>
      </header>
      <p className="assistive-draft__section-support" id={statusId}>
        {section.supportLabel}
      </p>
      <AssistiveBeforeAfterToggle
        sectionTitle={section.title}
        compareMode={compareMode}
        onCompareModeChange={setCompareMode}
      />
      <AssistiveDraftDiffBlock
        sectionTitle={section.title}
        compareMode={compareMode}
        lines={section.diffLines}
      />
      <div className="assistive-draft__slot-row">
        <AssistiveTargetSlotPill targetSlot={section.targetSlot} />
        <AssistivePatchLeaseStatus
          patchLease={section.patchLease}
          sessionState={section.sessionState}
        />
      </div>
      {section.blockedReasons.length > 0 && (
        <AssistiveInsertBlockReason id={blockReasonId} reasons={section.blockedReasons} />
      )}
      <AssistiveSectionActionCluster
        section={section}
        blockReasonId={section.blockedReasons.length > 0 ? blockReasonId : undefined}
        insertRequested={insertRequested}
        onInsert={() => setInsertRequested(true)}
      />
    </article>
  );
}

export function AssistiveBeforeAfterToggle({
  sectionTitle,
  compareMode,
  onCompareModeChange,
}: {
  sectionTitle: string;
  compareMode: AssistiveDraftCompareMode;
  onCompareModeChange: (mode: AssistiveDraftCompareMode) => void;
}) {
  return (
    <div
      className="assistive-draft__compare-toggle"
      role="group"
      aria-label={`Compare view for ${sectionTitle}`}
      data-testid="AssistiveBeforeAfterToggle"
    >
      {(["before", "after", "both"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          className="assistive-draft__compare-button"
          data-compare-choice={mode}
          aria-pressed={compareMode === mode}
          onClick={() => onCompareModeChange(mode)}
        >
          {mode === "both" ? "Compare" : mode === "before" ? "Before" : "After"}
        </button>
      ))}
    </div>
  );
}

export function AssistiveDraftDiffBlock({
  sectionTitle,
  compareMode,
  lines,
}: {
  sectionTitle: string;
  compareMode: AssistiveDraftCompareMode;
  lines: AssistiveDraftDiffLine[];
}) {
  const headingId = useId();

  return (
    <section
      className="assistive-draft__diff-block"
      data-testid="AssistiveDraftDiffBlock"
      data-compare-mode={compareMode}
      aria-labelledby={headingId}
    >
      <div className="assistive-draft__diff-heading-row">
        <h5 id={headingId}>{sectionTitle} wording</h5>
        <span>{compareMode === "both" ? "Before and after" : `${compareMode} view`}</span>
      </div>
      {compareMode === "both" ? (
        <div className="assistive-draft__diff-columns">
          <DiffColumn label="Before" lines={lines} field="before" />
          <DiffColumn label="After" lines={lines} field="after" />
        </div>
      ) : (
        <ul className="assistive-draft__diff-lines" aria-label={`${compareMode} draft lines`}>
          {lines.map((line) => (
            <li key={`${line.id}-${compareMode}`} data-diff-kind={line.kind}>
              <span className="assistive-draft__diff-tag">{line.label}</span>
              <span className="assistive-draft__diff-text">
                {compareMode === "before" ? line.before || "No current wording." : line.after}
              </span>
              <span className="assistive-draft__diff-intent">{line.intent}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DiffColumn({
  label,
  lines,
  field,
}: {
  label: string;
  lines: AssistiveDraftDiffLine[];
  field: "before" | "after";
}) {
  return (
    <div className="assistive-draft__diff-column" data-diff-column={field}>
      <span className="assistive-draft__diff-column-label">{label}</span>
      <ul className="assistive-draft__diff-lines" aria-label={`${label} wording`}>
        {lines.map((line) => (
          <li
            key={`${line.id}-${field}`}
            data-diff-kind={field === "before" ? "remove" : line.kind}
          >
            <span className="assistive-draft__diff-tag">
              {field === "before" && line.kind === "add" ? "None" : line.label}
            </span>
            <span className="assistive-draft__diff-text">
              {line[field] || "No current wording."}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AssistiveTargetSlotPill({ targetSlot }: { targetSlot: AssistiveDraftTargetSlot }) {
  return (
    <span
      className="assistive-draft__target-slot-pill"
      data-testid="AssistiveTargetSlotPill"
      data-slot-state={targetSlot.state}
      title={`${targetSlot.label}: ${targetSlot.slotHash}`}
    >
      <span className="assistive-draft__target-label">{targetSlot.label}</span>
      <span className="assistive-draft__target-meta">
        {targetSlot.contentClass.replaceAll("_", " ")} - {targetSlot.state}
      </span>
    </span>
  );
}

export function AssistivePatchLeaseStatus({
  patchLease,
  sessionState,
}: {
  patchLease: AssistiveDraftPatchLease;
  sessionState: AssistiveDraftSessionState;
}) {
  return (
    <dl
      className="assistive-draft__lease-status"
      data-testid="AssistivePatchLeaseStatus"
      data-lease-state={patchLease.state}
      data-session-state={sessionState}
      aria-label="Patch lease status"
    >
      <div>
        <dt>Lease</dt>
        <dd>{patchLease.state}</dd>
      </div>
      <div>
        <dt>Session</dt>
        <dd>{sessionState}</dd>
      </div>
      <div className="assistive-draft__lease-detail">
        <dt>Fence</dt>
        <dd>{patchLease.expiresLabel}</dd>
      </div>
    </dl>
  );
}

export function AssistiveInsertBlockReason({
  id,
  reasons,
}: {
  id: string;
  reasons: AssistiveDraftBlockReason[];
}) {
  return (
    <div
      className="assistive-draft__block-reason"
      data-testid="AssistiveInsertBlockReason"
      id={id}
      role="note"
      aria-label="Insert blocked reasons"
    >
      <strong>Insert blocked before click</strong>
      <ul>
        {reasons.map((reason) => (
          <li key={reason.code} data-block-reason-code={reason.code}>
            <span>{reason.label}</span>
            <small>{reason.detail}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AssistiveBoundedInsertBar({
  section,
  blockReasonId,
  insertRequested,
  onInsert,
}: {
  section: AssistiveDraftSection;
  blockReasonId?: string;
  insertRequested: boolean;
  onInsert: () => void;
}) {
  const statusId = useId();
  const descriptionId = blockReasonId ?? statusId;

  return (
    <div
      className="assistive-draft__insert-bar"
      data-testid="AssistiveBoundedInsertBar"
      data-insert-state={insertRequested ? "queued" : section.canInsert ? "available" : "blocked"}
    >
      <p id={statusId} aria-live="polite">
        {insertRequested
          ? `Insert queued for review against ${section.targetSlot.label}.`
          : section.canInsert
            ? `Bound to ${section.targetSlot.label}.`
            : "Insert is unavailable until the shown lease and slot are live."}
      </p>
      <button
        type="button"
        className="assistive-draft__insert-button"
        disabled={!section.canInsert || insertRequested}
        aria-describedby={descriptionId}
        onClick={onInsert}
      >
        {insertRequested ? "Insert queued for review" : section.insertLabel}
      </button>
    </div>
  );
}

export function AssistiveSectionActionCluster({
  section,
  blockReasonId,
  insertRequested,
  onInsert,
}: {
  section: AssistiveDraftSection;
  blockReasonId?: string;
  insertRequested: boolean;
  onInsert: () => void;
}) {
  return (
    <div className="assistive-draft__action-cluster" data-testid="AssistiveSectionActionCluster">
      <div className="assistive-draft__secondary-actions">
        <button type="button" className="assistive-draft__text-button">
          Review target
        </button>
        <button type="button" className="assistive-draft__text-button">
          Keep draft visible
        </button>
      </div>
      <AssistiveBoundedInsertBar
        section={section}
        blockReasonId={blockReasonId}
        insertRequested={insertRequested}
        onInsert={onInsert}
      />
      <p className="assistive-draft__helper-text">{section.helperText}</p>
    </div>
  );
}
