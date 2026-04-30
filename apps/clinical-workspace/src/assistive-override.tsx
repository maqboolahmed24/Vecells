import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from "react";
import type { StaffRouteKind, StaffShellLedger } from "./workspace-shell.data";

export const ASSISTIVE_OVERRIDE_VISUAL_MODE = "Assistive_Override_Trail_Review";

export type AssistiveOverrideDisposition =
  | "accepted_unchanged"
  | "accepted_after_edit"
  | "rejected_to_alternative"
  | "abstained_by_human"
  | "regenerated_superseded";

export type AssistiveOverrideScope =
  | "style_only"
  | "content_material"
  | "policy_exception"
  | "trust_recovery";

export type AssistiveOverrideReasonRequirement = "not_required" | "optional" | "required" | "completed";

export type AssistiveOverrideReasonCode =
  | "clinical_safety"
  | "evidence_mismatch"
  | "patient_context"
  | "policy_exception"
  | "low_confidence_acceptance"
  | "trust_recovery"
  | "alternative_more_appropriate"
  | "style_only";

export type AssistiveOverrideDiffKind = "unchanged" | "added" | "removed" | "changed";

export type AssistiveOverrideReasonCodeDefinition = {
  code: AssistiveOverrideReasonCode;
  label: string;
  detail: string;
};

export type AssistiveOverrideDiffLine = {
  id: string;
  kind: AssistiveOverrideDiffKind;
  label: string;
  before: string;
  after: string;
};

export type AssistiveOverrideTrailEvent = {
  id: string;
  label: string;
  actorLabel: string;
  timestampLabel: string;
  postureLabel: string;
};

export type AssistiveFinalHumanArtifactSummary = {
  artifactRef: string;
  title: string;
  finalText: string;
  authoredByLabel: string;
  settledAtLabel: string;
  settlementPosture: "settled_human_artifact" | "awaiting_reason" | "dual_review_required";
};

export type AssistiveOverrideState = {
  fixture: string;
  visualMode: typeof ASSISTIVE_OVERRIDE_VISUAL_MODE;
  routeKind: StaffRouteKind;
  taskRef: string;
  selectedAnchorRef: string;
  feedbackChainRef: string;
  actionRecordRef: string;
  overrideRecordRef: string;
  finalArtifactRef: string;
  confidenceDigestRef: string;
  provenanceEnvelopeRef: string;
  actorLabel: string;
  timestampLabel: string;
  disposition: AssistiveOverrideDisposition;
  scope: AssistiveOverrideScope;
  statusLabel: string;
  materialChange: boolean;
  reasonRequirementState: AssistiveOverrideReasonRequirement;
  initialReasonSheetOpen?: boolean;
  initialDiffOpen?: boolean;
  selectedReasonCodes: AssistiveOverrideReasonCode[];
  allowedReasonCodes: AssistiveOverrideReasonCode[];
  optionalFreeTextAllowed: boolean;
  approvalBurdenLabel: string;
  approvalBurdenDetail: string;
  dualReviewRequired: boolean;
  diffLines: AssistiveOverrideDiffLine[];
  finalArtifact: AssistiveFinalHumanArtifactSummary;
  trailEvents: AssistiveOverrideTrailEvent[];
};

export type AssistiveOverrideStateAdapterInput = {
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  taskRef: string;
  routeKind: StaffRouteKind;
};

type AssistiveOverrideKeyboardControllerProps = {
  rootRef: RefObject<HTMLElement | null>;
  diffOpen: boolean;
  reasonOpen: boolean;
  onCloseDiff: () => void;
  onCloseReason: () => void;
  diffButtonRef: RefObject<HTMLButtonElement | null>;
  reasonButtonRef: RefObject<HTMLButtonElement | null>;
};

const REASON_CODE_DEFINITIONS: AssistiveOverrideReasonCodeDefinition[] = [
  {
    code: "clinical_safety",
    label: "Clinical safety",
    detail: "Final wording was changed to reduce clinical risk or ambiguity.",
  },
  {
    code: "evidence_mismatch",
    label: "Evidence mismatch",
    detail: "Assistive text did not match the limited evidence snapshot.",
  },
  {
    code: "patient_context",
    label: "Patient context",
    detail: "Human context changed the final artifact beyond the assistive source.",
  },
  {
    code: "policy_exception",
    label: "Policy exception",
    detail: "Policy status requires an explicit override reason.",
  },
  {
    code: "low_confidence_acceptance",
    label: "Low confidence acceptance",
    detail: "The artifact was used despite low or suppressed support.",
  },
  {
    code: "trust_recovery",
    label: "Trust recovery",
    detail: "Continuity, freshness, or trust recovery shaped the final action.",
  },
  {
    code: "alternative_more_appropriate",
    label: "Alternative more appropriate",
    detail: "The clinician chose a safer or more suitable alternative.",
  },
  {
    code: "style_only",
    label: "Style only",
    detail: "Only tone, grammar, or local formatting changed.",
  },
];

function readRequestedOverrideFixture(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get("assistiveOverride");
}

function normalizeOverrideFixture(value: string | null): string | null {
  switch (value) {
    case "accepted-unchanged":
    case "unchanged":
      return "accepted-unchanged";
    case "accepted-edited":
    case "accepted-after-edit":
    case "material-edit":
      return "accepted-edited";
    case "rejected-mandatory":
    case "reject-alternative":
      return "rejected-mandatory";
    case "abstained":
    case "abstained-human":
      return "abstained";
    case "regenerated":
    case "superseded":
      return "regenerated";
    case "policy-exception":
    case "low-confidence":
      return "policy-exception";
    case "completed-trail":
    case "completed":
      return "completed-trail";
    case "reason-open":
      return "reason-open";
    default:
      return null;
  }
}

function reasonCodeLabel(code: AssistiveOverrideReasonCode): string {
  return REASON_CODE_DEFINITIONS.find((definition) => definition.code === code)?.label ?? code;
}

function baseDiffLines(): AssistiveOverrideDiffLine[] {
  return [
    {
      id: "delta-safety-net",
      kind: "changed",
      label: "Safety-net wording",
      before: "Review if breathing worsens or fever persists.",
      after: "Seek urgent review if breathing worsens, blue lips appear, or fever persists.",
    },
    {
      id: "delta-red-flags",
      kind: "added",
      label: "Red-flag qualifier",
      before: "",
      after: "No same-day red flags are recorded in the current request.",
    },
    {
      id: "delta-antibiotics",
      kind: "changed",
      label: "Request phrasing",
      before: "Parent asks for antibiotics.",
      after: "Parent asks whether antibiotics are needed.",
    },
    {
      id: "delta-plan",
      kind: "unchanged",
      label: "Existing plan",
      before: "Use the reliever inhaler already prescribed.",
      after: "Use the reliever inhaler already prescribed.",
    },
  ];
}

function unchangedDiffLines(): AssistiveOverrideDiffLine[] {
  return [
    {
      id: "delta-unchanged-summary",
      kind: "unchanged",
      label: "History summary",
      before: "Patient reports cough and wheeze after a viral illness.",
      after: "Patient reports cough and wheeze after a viral illness.",
    },
    {
      id: "delta-unchanged-plan",
      kind: "unchanged",
      label: "Safety-net plan",
      before: "Review if breathing worsens or fever persists.",
      after: "Review if breathing worsens or fever persists.",
    },
  ];
}

function baseTrailEvents(
  actorLabel: string,
  timestampLabel: string,
  disposition: AssistiveOverrideDisposition,
): AssistiveOverrideTrailEvent[] {
  return [
    {
      id: "event-assistive-source",
      label: "Assistive source captured",
      actorLabel: "Documentation composer",
      timestampLabel: "09:20",
      postureLabel: "Source artifact only",
    },
    {
      id: "event-human-action",
      label: disposition.replaceAll("_", " "),
      actorLabel,
      timestampLabel,
      postureLabel: "Human action recorded",
    },
    {
      id: "event-final-artifact",
      label: "Final human artifact linked",
      actorLabel,
      timestampLabel,
      postureLabel: "Settlement status visible",
    },
  ];
}

function finalArtifactFor(
  taskRef: string,
  actorLabel: string,
  timestampLabel: string,
  overrides: Partial<AssistiveFinalHumanArtifactSummary> = {},
): AssistiveFinalHumanArtifactSummary {
  return {
    artifactRef: `final_human_artifact.413.${taskRef}.clinician_note.v1`,
    title: "Final human note",
    finalText:
      "Parent asks whether antibiotics are needed. No same-day red flags are recorded. Seek urgent review if breathing worsens, blue lips appear, or fever persists.",
    authoredByLabel: actorLabel,
    settledAtLabel: timestampLabel,
    settlementPosture: "settled_human_artifact",
    ...overrides,
  };
}

function baseState({
  selectedAnchorRef,
  taskRef,
  routeKind,
}: AssistiveOverrideStateAdapterInput): AssistiveOverrideState {
  const actorLabel = "Edited by clinician: Dr A. Rahman";
  const timestampLabel = "Today 09:26";
  const disposition: AssistiveOverrideDisposition = "accepted_after_edit";
  return {
    fixture: "accepted-edited",
    visualMode: ASSISTIVE_OVERRIDE_VISUAL_MODE,
    routeKind,
    taskRef,
    selectedAnchorRef,
    feedbackChainRef: `assistive_feedback_chain.413.${taskRef}.${selectedAnchorRef}`,
    actionRecordRef: `assistive_action_record.413.${taskRef}.accept_after_edit`,
    overrideRecordRef: `override_record.413.${taskRef}.content_material`,
    finalArtifactRef: `final_human_artifact.413.${taskRef}.clinician_note.v1`,
    confidenceDigestRef: `assistive_confidence_digest.420.${taskRef}.${selectedAnchorRef}`,
    provenanceEnvelopeRef: `assistive_provenance.420.${taskRef}.${selectedAnchorRef}`,
    actorLabel,
    timestampLabel,
    disposition,
    scope: "content_material",
    statusLabel: "Accepted after material edit",
    materialChange: true,
    reasonRequirementState: "required",
    selectedReasonCodes: [],
    allowedReasonCodes: [
      "clinical_safety",
      "evidence_mismatch",
      "patient_context",
      "policy_exception",
      "low_confidence_acceptance",
      "trust_recovery",
      "alternative_more_appropriate",
      "style_only",
    ],
    optionalFreeTextAllowed: true,
    approvalBurdenLabel: "Reason required",
    approvalBurdenDetail:
      "Material edits, policy exceptions, low-confidence acceptance, rejection, and abstention require deterministic reason capture.",
    dualReviewRequired: false,
    diffLines: baseDiffLines(),
    finalArtifact: finalArtifactFor(taskRef, actorLabel, timestampLabel),
    trailEvents: baseTrailEvents(actorLabel, timestampLabel, disposition),
  };
}

export function AssistiveOverrideStateAdapter(
  input: AssistiveOverrideStateAdapterInput,
): AssistiveOverrideState | null {
  const fixture = normalizeOverrideFixture(readRequestedOverrideFixture());
  if (!fixture) {
    return null;
  }

  const state = baseState(input);

  if (fixture === "accepted-unchanged") {
    const disposition: AssistiveOverrideDisposition = "accepted_unchanged";
    return {
      ...state,
      fixture,
      disposition,
      scope: "style_only",
      statusLabel: "Accepted unchanged",
      materialChange: false,
      reasonRequirementState: "not_required",
      selectedReasonCodes: [],
      approvalBurdenLabel: "No reason required",
      approvalBurdenDetail:
        "The final artifact matches the limited assistive source and no policy exception is present.",
      diffLines: unchangedDiffLines(),
      finalArtifact: finalArtifactFor(state.taskRef, state.actorLabel, state.timestampLabel, {
        finalText:
          "Patient reports cough and wheeze after a viral illness. Review if breathing worsens or fever persists.",
      }),
      trailEvents: baseTrailEvents(state.actorLabel, state.timestampLabel, disposition),
    };
  }

  if (fixture === "rejected-mandatory") {
    const disposition: AssistiveOverrideDisposition = "rejected_to_alternative";
    return {
      ...state,
      fixture,
      disposition,
      statusLabel: "Rejected to alternative",
      actionRecordRef: `assistive_action_record.413.${state.taskRef}.reject_to_alternative`,
      overrideRecordRef: `override_record.413.${state.taskRef}.alternative`,
      selectedReasonCodes: ["alternative_more_appropriate"],
      initialReasonSheetOpen: true,
      approvalBurdenLabel: "Reason required before trail completion",
      approvalBurdenDetail:
        "Rejected assistive content must carry a coded reason and preserve the alternative human artifact.",
      finalArtifact: finalArtifactFor(state.taskRef, state.actorLabel, state.timestampLabel, {
        finalText:
          "Alternative note retained by the clinician. No assistive wording is promoted into the final artifact.",
        settlementPosture: "awaiting_reason",
      }),
      trailEvents: baseTrailEvents(state.actorLabel, state.timestampLabel, disposition),
    };
  }

  if (fixture === "abstained") {
    const disposition: AssistiveOverrideDisposition = "abstained_by_human";
    return {
      ...state,
      fixture,
      disposition,
      scope: "trust_recovery",
      statusLabel: "Abstained by human",
      actionRecordRef: `assistive_action_record.413.${state.taskRef}.abstain`,
      selectedReasonCodes: ["trust_recovery"],
      approvalBurdenLabel: "Reason required for abstention",
      approvalBurdenDetail:
        "Human abstention keeps the assistive source visible but blocks it from becoming the final record.",
      finalArtifact: finalArtifactFor(state.taskRef, state.actorLabel, state.timestampLabel, {
        title: "Final human disposition",
        finalText: "No assistive artifact was used. The clinician continued with manual review.",
      }),
      trailEvents: baseTrailEvents(state.actorLabel, state.timestampLabel, disposition),
    };
  }

  if (fixture === "regenerated") {
    const disposition: AssistiveOverrideDisposition = "regenerated_superseded";
    return {
      ...state,
      fixture,
      disposition,
      statusLabel: "Regenerated and superseded",
      actionRecordRef: `assistive_action_record.413.${state.taskRef}.regenerate`,
      selectedReasonCodes: ["evidence_mismatch"],
      approvalBurdenLabel: "Supersession recorded",
      approvalBurdenDetail:
        "The earlier assistive source remains in the chain but is not the final human artifact.",
      finalArtifact: finalArtifactFor(state.taskRef, state.actorLabel, state.timestampLabel, {
        finalText:
          "Regenerated text was reviewed, then rewritten by the clinician before settlement.",
      }),
      trailEvents: baseTrailEvents(state.actorLabel, state.timestampLabel, disposition),
    };
  }

  if (fixture === "policy-exception") {
    return {
      ...state,
      fixture,
      scope: "policy_exception",
      statusLabel: "Policy exception with low support",
      initialReasonSheetOpen: true,
      selectedReasonCodes: ["policy_exception", "low_confidence_acceptance"],
      approvalBurdenLabel: "Mandatory reason and approval burden",
      approvalBurdenDetail:
        "Policy exception plus low-confidence acceptance requires reason capture and a visible approval status.",
      dualReviewRequired: true,
      finalArtifact: finalArtifactFor(state.taskRef, state.actorLabel, state.timestampLabel, {
        settlementPosture: "dual_review_required",
      }),
    };
  }

  if (fixture === "completed-trail") {
    return {
      ...state,
      fixture,
      reasonRequirementState: "completed",
      selectedReasonCodes: ["clinical_safety", "patient_context"],
      approvalBurdenLabel: "Reason captured",
      approvalBurdenDetail:
        "Coded reason capture is complete. Free-text notes are disclosure-fenced and excluded from routine activity data.",
      trailEvents: [
        ...state.trailEvents,
        {
          id: "event-reason-captured",
          label: "Override reason captured",
          actorLabel: state.actorLabel,
          timestampLabel: "Today 09:27",
          postureLabel: "Reason codes only in activity data",
        },
      ],
    };
  }

  if (fixture === "reason-open") {
    return {
      ...state,
      fixture,
      initialReasonSheetOpen: true,
    };
  }

  return {
    ...state,
    fixture,
  };
}

function AssistiveOverrideKeyboardController({
  rootRef,
  diffOpen,
  reasonOpen,
  onCloseDiff,
  onCloseReason,
  diffButtonRef,
  reasonButtonRef,
}: AssistiveOverrideKeyboardControllerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || (!diffOpen && !reasonOpen)) {
        return;
      }

      const root = rootRef.current;
      if (!root || !root.contains(document.activeElement)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if (diffOpen) {
        onCloseDiff();
        diffButtonRef.current?.focus();
        return;
      }

      onCloseReason();
      reasonButtonRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    diffButtonRef,
    diffOpen,
    onCloseDiff,
    onCloseReason,
    reasonButtonRef,
    reasonOpen,
    rootRef,
  ]);

  return null;
}

export function AssistiveHumanArtifactSummary({
  artifact,
}: {
  artifact: AssistiveFinalHumanArtifactSummary;
}) {
  const headingId = useId();
  return (
    <section
      className="assistive-override__human-artifact"
      data-testid="AssistiveHumanArtifactSummary"
      data-settlement-posture={artifact.settlementPosture}
      aria-labelledby={headingId}
    >
      <div>
        <span className="assistive-override__section-label">Final human artifact</span>
        <h4 id={headingId}>{artifact.title}</h4>
      </div>
      <p>{artifact.finalText}</p>
      <dl>
        <div>
          <dt>Authored by</dt>
          <dd>{artifact.authoredByLabel}</dd>
        </div>
        <div>
          <dt>Settled</dt>
          <dd>{artifact.settledAtLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveEditDeltaSummary({
  state,
  expanded,
  controlsId,
  buttonRef,
  onToggle,
}: {
  state: AssistiveOverrideState;
  expanded: boolean;
  controlsId: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
}) {
  const changedLines = state.diffLines.filter((line) => line.kind !== "unchanged");
  const summary =
    changedLines.length === 0
      ? "Final artifact matches the assistive source."
      : `${changedLines.length} material change${changedLines.length === 1 ? "" : "s"} from the assistive source.`;

  return (
    <section className="assistive-override__delta-summary" data-testid="AssistiveEditDeltaSummary">
      <div className="assistive-override__delta-head">
        <span
          className="assistive-override__material-chip"
          data-material-change={state.materialChange ? "true" : "false"}
        >
          {state.materialChange ? "Material change" : "No material change"}
        </span>
        <span>{summary}</span>
      </div>
      <ul aria-label="Compact edit delta">
        {state.diffLines.slice(0, 4).map((line) => (
          <li key={line.id} data-diff-kind={line.kind}>
            <span>{line.label}</span>
            <small>{line.kind.replaceAll("_", " ")}</small>
          </li>
        ))}
      </ul>
      <button
        ref={buttonRef}
        type="button"
        className="assistive-override__text-button"
        aria-expanded={expanded}
        aria-controls={controlsId}
        onClick={onToggle}
      >
        {expanded ? "Hide change detail" : "Review change detail"}
      </button>
    </section>
  );
}

export function AssistiveEditDeltaDrawer({
  state,
  id,
  expanded,
}: {
  state: AssistiveOverrideState;
  id: string;
  expanded: boolean;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      className="assistive-override__delta-drawer"
      data-testid="AssistiveEditDeltaDrawer"
      data-expanded={expanded ? "true" : "false"}
      aria-labelledby={headingId}
      hidden={!expanded}
    >
      <h4 id={headingId}>Before and after at capture</h4>
      <div className="assistive-override__diff-list">
        {state.diffLines.map((line) => (
          <article key={line.id} data-diff-kind={line.kind}>
            <h5>{line.label}</h5>
            <dl>
              <div>
                <dt>Assistive source</dt>
                <dd>{line.before || "No source text"}</dd>
              </div>
              <div>
                <dt>Final human artifact</dt>
                <dd>{line.after || "Removed from final artifact"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AssistiveApprovalBurdenNotice({ state }: { state: AssistiveOverrideState }) {
  const required = state.reasonRequirementState === "required";
  return (
    <aside
      className="assistive-override__approval-notice"
      data-testid="AssistiveApprovalBurdenNotice"
      data-reason-required={required ? "true" : "false"}
      data-dual-review-required={state.dualReviewRequired ? "true" : "false"}
      role="note"
      aria-label="Override approval burden"
    >
      <strong>{state.approvalBurdenLabel}</strong>
      <span>{state.approvalBurdenDetail}</span>
    </aside>
  );
}

export function AssistiveOverrideReasonValidationState({
  id,
  invalid,
  required,
}: {
  id: string;
  invalid: boolean;
  required: boolean;
}) {
  if (invalid) {
    return (
      <p
        id={id}
        className="assistive-override__validation assistive-override__validation--error"
        data-testid="AssistiveOverrideReasonValidationState"
        role="alert"
      >
        Select at least one coded override reason before completing this trail.
      </p>
    );
  }

  return (
    <p
      id={id}
      className="assistive-override__validation"
      data-testid="AssistiveOverrideReasonValidationState"
    >
      {required
        ? "A coded reason is required. Optional note text stays disclosure-fenced."
        : "Reason capture is optional for this unchanged artifact."}
    </p>
  );
}

export function AssistiveOverrideReasonCodeGroup({
  codes,
  selectedCodes,
  describedBy,
  onToggle,
}: {
  codes: AssistiveOverrideReasonCode[];
  selectedCodes: AssistiveOverrideReasonCode[];
  describedBy: string;
  onToggle: (code: AssistiveOverrideReasonCode) => void;
}) {
  const groupId = useId();
  const definitions = codes
    .map((code) => REASON_CODE_DEFINITIONS.find((definition) => definition.code === code))
    .filter((definition): definition is AssistiveOverrideReasonCodeDefinition => Boolean(definition));

  return (
    <fieldset
      className="assistive-override__reason-codes"
      data-testid="AssistiveOverrideReasonCodeGroup"
      aria-describedby={describedBy}
    >
      <legend>Override reason codes</legend>
      {definitions.map((definition) => {
        const detailId = `${groupId}-${definition.code}-detail`;
        return (
          <label key={definition.code} className="assistive-override__reason-code">
            <input
              type="checkbox"
              checked={selectedCodes.includes(definition.code)}
              aria-describedby={detailId}
              onChange={() => onToggle(definition.code)}
            />
            <span>{definition.label}</span>
            <small id={detailId}>{definition.detail}</small>
          </label>
        );
      })}
    </fieldset>
  );
}

export function AssistiveOverrideReasonSheet({
  state,
  open,
  requirementState,
  selectedCodes,
  controlsId,
  buttonRef,
  onToggleOpen,
  onToggleCode,
  onCompleted,
}: {
  state: AssistiveOverrideState;
  open: boolean;
  requirementState: AssistiveOverrideReasonRequirement;
  selectedCodes: AssistiveOverrideReasonCode[];
  controlsId: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onToggleOpen: () => void;
  onToggleCode: (code: AssistiveOverrideReasonCode) => void;
  onCompleted: () => void;
}) {
  const headingId = useId();
  const validationId = useId();
  const [invalid, setInvalid] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteCaptured, setNoteCaptured] = useState(false);
  const required = requirementState === "required";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (required && selectedCodes.length === 0) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    setNoteCaptured(noteDraft.trim().length > 0);
    setNoteDraft("");
    onCompleted();
  };

  if (requirementState === "completed") {
    return (
      <section
        className="assistive-override__reason-sheet assistive-override__reason-sheet--complete"
        data-testid="AssistiveOverrideReasonSheet"
        data-reason-state="completed"
        data-note-capture="disclosure-fenced"
        aria-labelledby={headingId}
      >
        <div>
          <span className="assistive-override__section-label">Override reason</span>
          <h4 id={headingId}>Reason captured</h4>
        </div>
        <p>
          Captured codes:{" "}
          {selectedCodes.length > 0
            ? selectedCodes.map((code) => reasonCodeLabel(code)).join(", ")
            : "No coded reason required"}
        </p>
        <p className="assistive-override__note-fence">
          Optional free-text notes are disclosure-fenced and not included in routine telemetry.
        </p>
        {noteCaptured && (
          <p className="assistive-override__note-fence" data-note-present="true">
            Optional note captured behind disclosure fence.
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      className="assistive-override__reason-host"
      data-testid="AssistiveOverrideReasonSheet"
      data-reason-state={requirementState}
      data-note-capture="disclosure-fenced"
      aria-labelledby={headingId}
    >
      <div className="assistive-override__reason-summary">
        <div>
          <span className="assistive-override__section-label">Override reason</span>
          <h4 id={headingId}>{required ? "Capture required reason" : "Optional reason capture"}</h4>
        </div>
        <button
          ref={buttonRef}
          type="button"
          className="assistive-override__text-button"
          aria-expanded={open}
          aria-controls={controlsId}
          onClick={onToggleOpen}
        >
          {open ? "Hide reason sheet" : "Record override reason"}
        </button>
      </div>

      <form
        id={controlsId}
        className="assistive-override__reason-sheet"
        hidden={!open}
        onSubmit={handleSubmit}
      >
        <AssistiveOverrideReasonValidationState
          id={validationId}
          invalid={invalid}
          required={required}
        />
        <AssistiveOverrideReasonCodeGroup
          codes={state.allowedReasonCodes}
          selectedCodes={selectedCodes}
          describedBy={validationId}
          onToggle={(code) => {
            setInvalid(false);
            onToggleCode(code);
          }}
        />
        {state.optionalFreeTextAllowed && (
          <details className="assistive-override__note-disclosure">
            <summary>Optional note</summary>
            <label>
              Optional override note
              <textarea
                value={noteDraft}
                rows={3}
                onChange={(event) => setNoteDraft(event.currentTarget.value)}
              />
            </label>
            <p className="assistive-override__note-fence">
              Notes remain in the protected override record and are excluded from routine telemetry.
            </p>
          </details>
        )}
        {noteCaptured && (
          <p className="assistive-override__note-fence" data-note-present="true">
            Optional note captured behind disclosure fence.
          </p>
        )}
        <button type="submit" className="assistive-override__submit-button">
          Complete reason capture
        </button>
      </form>
    </section>
  );
}

export function AssistiveOverrideTrailEventRow({ event }: { event: AssistiveOverrideTrailEvent }) {
  return (
    <li className="assistive-override__event-row" data-testid="AssistiveOverrideTrailEventRow">
      <span>{event.label}</span>
      <small>
        {event.actorLabel} - {event.timestampLabel}
      </small>
      <em>{event.postureLabel}</em>
    </li>
  );
}

export function AssistiveEditedByClinicianTrail({ state }: { state: AssistiveOverrideState }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const diffButtonRef = useRef<HTMLButtonElement | null>(null);
  const reasonButtonRef = useRef<HTMLButtonElement | null>(null);
  const diffId = useId();
  const reasonId = useId();
  const [diffOpen, setDiffOpen] = useState(Boolean(state.initialDiffOpen));
  const [reasonOpen, setReasonOpen] = useState(Boolean(state.initialReasonSheetOpen));
  const [reasonSubmitted, setReasonSubmitted] = useState(state.reasonRequirementState === "completed");
  const [selectedCodes, setSelectedCodes] = useState<AssistiveOverrideReasonCode[]>(
    state.selectedReasonCodes,
  );
  const requirementState: AssistiveOverrideReasonRequirement = reasonSubmitted
    ? "completed"
    : state.reasonRequirementState;

  const toggleCode = (code: AssistiveOverrideReasonCode) => {
    setSelectedCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  };

  return (
    <section
      ref={rootRef}
      className="assistive-override"
      data-testid="AssistiveEditedByClinicianTrail"
      data-visual-mode={state.visualMode}
      data-disposition={state.disposition}
      data-material-change={state.materialChange ? "true" : "false"}
      data-reason-state={requirementState}
      data-feedback-chain-ref={state.feedbackChainRef}
      data-final-artifact-ref={state.finalArtifactRef}
      aria-labelledby="assistive-override-heading"
    >
      <AssistiveOverrideKeyboardController
        rootRef={rootRef}
        diffOpen={diffOpen}
        reasonOpen={reasonOpen}
        onCloseDiff={() => setDiffOpen(false)}
        onCloseReason={() => setReasonOpen(false)}
        diffButtonRef={diffButtonRef}
        reasonButtonRef={reasonButtonRef}
      />
      <header className="assistive-override__header">
        <div>
          <span className="assistive-override__section-label">Human edit trail</span>
          <h3 id="assistive-override-heading">{state.statusLabel}</h3>
        </div>
        <span className="assistive-override__clinician-chip">{state.actorLabel}</span>
      </header>

      <AssistiveHumanArtifactSummary artifact={state.finalArtifact} />
      <AssistiveEditDeltaSummary
        state={state}
        expanded={diffOpen}
        controlsId={diffId}
        buttonRef={diffButtonRef}
        onToggle={() => setDiffOpen((current) => !current)}
      />
      <AssistiveEditDeltaDrawer state={state} id={diffId} expanded={diffOpen} />
      <AssistiveApprovalBurdenNotice state={{ ...state, reasonRequirementState: requirementState }} />
      <AssistiveOverrideReasonSheet
        state={state}
        open={reasonOpen}
        requirementState={requirementState}
        selectedCodes={selectedCodes}
        controlsId={reasonId}
        buttonRef={reasonButtonRef}
        onToggleOpen={() => setReasonOpen((current) => !current)}
        onToggleCode={toggleCode}
        onCompleted={() => {
          setReasonSubmitted(true);
          setReasonOpen(false);
        }}
      />

      <section className="assistive-override__trail" aria-labelledby="assistive-trail-events-heading">
        <h4 id="assistive-trail-events-heading">Action trail</h4>
        <ol>
          {state.trailEvents.map((event) => (
            <AssistiveOverrideTrailEventRow key={event.id} event={event} />
          ))}
          {reasonSubmitted && state.reasonRequirementState !== "completed" && (
            <AssistiveOverrideTrailEventRow
              event={{
                id: "event-reason-completed",
                label: "Override reason captured",
                actorLabel: state.actorLabel,
                timestampLabel: "Just now",
                postureLabel: "Reason codes only in activity data",
              }}
            />
          )}
        </ol>
      </section>

      <footer className="assistive-override__chain-footer" aria-label="Override chain references">
        <dl>
          <div>
            <dt>Action record</dt>
            <dd>{state.actionRecordRef}</dd>
          </div>
          <div>
            <dt>Override record</dt>
            <dd>{state.overrideRecordRef}</dd>
          </div>
          <div>
            <dt>Confidence digest</dt>
            <dd>{state.confidenceDigestRef}</dd>
          </div>
          <div>
            <dt>History envelope</dt>
            <dd>{state.provenanceEnvelopeRef}</dd>
          </div>
        </dl>
      </footer>
    </section>
  );
}
