import { useEffect, useId, useRef, useState, type RefObject } from "react";
import type { StaffRouteKind, StaffShellLedger } from "./workspace-shell.data";

export const ASSISTIVE_FREEZE_RECOVERY_VISUAL_MODE = "Assistive_Freeze_Regen_In_Place";

// Mirrors AssistiveFreezeFrame, AssistiveFreezeDisposition, ReleaseRecoveryDisposition,
// ReviewActionLease, AssistiveDraftInsertionPoint, and AssistiveDraftPatchLease refs
// without recomputing backend freshness or actionability truth in the browser.
export type AssistiveFreezeDriftCategory =
  | "trust_drift"
  | "publication_drift"
  | "selected_anchor_drift"
  | "insertion_point_invalidation"
  | "review_version_drift"
  | "decision_epoch_drift"
  | "policy_freshness_drift";

export type AssistiveFreezeRecoveryActionability =
  | "frozen"
  | "regenerate_only"
  | "recovery_only"
  | "observe_only"
  | "blocked";

export type AssistiveFreezeRecoveryDisposition =
  | "regenerate_in_place"
  | "recover_in_place"
  | "observe_only_continue"
  | "manual_review";

export type AssistiveFreezeRecoveryStatus =
  | "frozen"
  | "regenerating"
  | "regenerated"
  | "observe_only"
  | "blocked";

export type AssistiveFreezeReason = {
  code: AssistiveFreezeDriftCategory;
  label: string;
  detail: string;
  ref: string;
};

export type AssistivePreservedArtifact = {
  artifactRef: string;
  title: string;
  generatedAtLabel: string;
  body: string[];
  provenance: Array<{
    label: string;
    value: string;
  }>;
  preservedTextVisible: boolean;
  preservedProvenanceVisible: boolean;
};

export type AssistiveFreezeDominantAction = {
  kind: AssistiveFreezeRecoveryDisposition;
  label: string;
  detail: string;
  enabled: boolean;
};

export type AssistiveFreezeRecoveryState = {
  fixture: string;
  visualMode: typeof ASSISTIVE_FREEZE_RECOVERY_VISUAL_MODE;
  placement: "rail_card" | "stage_card" | "narrow_sheet";
  routeKind: StaffRouteKind;
  taskRef: string;
  selectedAnchorRef: string;
  assistiveSessionRef: string;
  freezeFrameRef: string;
  releaseRecoveryDispositionRef: string;
  reviewActionLeaseRef: string;
  draftInsertionPointRef: string;
  draftPatchLeaseRef: string;
  recoveryStatus: AssistiveFreezeRecoveryStatus;
  actionabilityState: AssistiveFreezeRecoveryActionability;
  surfacePostureState: "frozen_in_place" | "preserved_read_only" | "placeholder_only";
  headline: string;
  bannerLabel: string;
  primaryReason: AssistiveFreezeReason;
  secondaryReasons: AssistiveFreezeReason[];
  preservedArtifact: AssistivePreservedArtifact;
  suppressedControls: string[];
  dominantAction: AssistiveFreezeDominantAction;
  semanticRole: "status" | "alert";
  severity: "recoverable" | "caution" | "blocked";
  detailInitiallyOpen?: boolean;
  focusOnActionBar?: boolean;
};

export type AssistiveFreezeRecoveryStateAdapterInput = {
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  taskRef: string;
  routeKind: StaffRouteKind;
};

type AssistiveRecoveryFocusManagerProps = {
  rootRef: RefObject<HTMLElement | null>;
  detailOpen: boolean;
  focusOnActionBar?: boolean;
  actionButtonRef: RefObject<HTMLButtonElement | null>;
  detailButtonRef: RefObject<HTMLButtonElement | null>;
  onCloseDetail: () => void;
};

function readRequestedRecoveryFixture(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get("assistiveRecovery");
}

function normalizeRecoveryFixture(value: string | null): string | null {
  switch (value) {
    case "trust-drift":
      return "trust-drift";
    case "publication-drift":
      return "publication-drift";
    case "anchor-drift":
    case "selected-anchor-drift":
      return "selected-anchor-drift";
    case "insertion-drift":
    case "insertion-point-drift":
      return "insertion-drift";
    case "review-version-drift":
    case "review-version-drift-editing":
      return "review-version-drift-editing";
    case "decision-epoch-drift":
      return "decision-epoch-drift";
    case "policy-drift":
    case "policy-freshness-drift":
      return "policy-freshness-drift";
    case "detail-open":
      return "detail-open";
    case "narrow-folded":
      return "narrow-folded";
    case "regenerate-success":
      return "regenerate-success";
    default:
      return null;
  }
}

function baseRefs({
  selectedAnchorRef,
  taskRef,
  routeKind,
}: AssistiveFreezeRecoveryStateAdapterInput) {
  return {
    visualMode: ASSISTIVE_FREEZE_RECOVERY_VISUAL_MODE,
    placement: routeKind === "task" ? "rail_card" : "stage_card",
    routeKind,
    taskRef,
    selectedAnchorRef,
    assistiveSessionRef: `assistive_session.412.${taskRef}.${selectedAnchorRef}`,
    freezeFrameRef: `assistive_freeze_frame.416.${taskRef}.${selectedAnchorRef}`,
    releaseRecoveryDispositionRef: `release_recovery_disposition.416.${taskRef}.stale_recoverable`,
    reviewActionLeaseRef: `review_action_lease.412.${taskRef}.rv-19`,
    draftInsertionPointRef: `assistive_draft_insertion_point.412.${taskRef}.${selectedAnchorRef}.history`,
    draftPatchLeaseRef: `draft_patch_lease.412.${taskRef}.history.frozen`,
  } satisfies Pick<
    AssistiveFreezeRecoveryState,
    | "visualMode"
    | "placement"
    | "routeKind"
    | "taskRef"
    | "selectedAnchorRef"
    | "assistiveSessionRef"
    | "freezeFrameRef"
    | "releaseRecoveryDispositionRef"
    | "reviewActionLeaseRef"
    | "draftInsertionPointRef"
    | "draftPatchLeaseRef"
  >;
}

function preservedArtifact(taskRef: string, selectedAnchorRef: string): AssistivePreservedArtifact {
  return {
    artifactRef: `draft_note_artifact.408.${taskRef}.history.frozen`,
    title: "History and safety-net draft",
    generatedAtLabel: "Generated against review version rv.311.19 before drift",
    body: [
      "Patient reports cough and wheeze after a viral illness. No same-day red flags are recorded in the reviewed request text.",
      "This preserved wording is shown for orientation only. It is not current enough to insert, export, accept, or complete from.",
    ],
    provenance: [
      {
        label: "Evidence snapshot",
        value: `evidence_snapshot.${taskRef}.${selectedAnchorRef}.summary`,
      },
      {
        label: "Surface publication",
        value: "surface_publication.phase8.assistive_staff_workspace.v1",
      },
      {
        label: "Runtime bundle",
        value: "runtime_bundle.phase8.assistive_shadow.v1",
      },
      {
        label: "Policy bundle",
        value: "policy_bundle.phase8.assistive_visibility.v1",
      },
    ],
    preservedTextVisible: true,
    preservedProvenanceVisible: true,
  };
}

function makeReason(code: AssistiveFreezeDriftCategory, refSuffix: string): AssistiveFreezeReason {
  switch (code) {
    case "trust_drift":
      return {
        code,
        label: "Trust status drift",
        detail:
          "The active AssistiveCapabilityTrustEnvelope no longer authorizes the stale session to keep writable controls live.",
        ref: `assistive_trust_envelope.${refSuffix}.drift`,
      };
    case "publication_drift":
      return {
        code,
        label: "Publication drift",
        detail:
          "The surface publication or runtime bundle changed after the artifact was generated.",
        ref: `surface_publication.${refSuffix}.mismatch`,
      };
    case "selected_anchor_drift":
      return {
        code,
        label: "Selected anchor drift",
        detail:
          "The selected anchor tuple changed, so the artifact remains visible only as stale context.",
        ref: `selected_anchor.${refSuffix}.invalidated`,
      };
    case "insertion_point_invalidation":
      return {
        code,
        label: "Insertion point invalidated",
        detail:
          "The bound draft insertion point or patch lease no longer matches the current note slot.",
        ref: `draft_insertion_point.${refSuffix}.invalidated`,
      };
    case "review_version_drift":
      return {
        code,
        label: "Review version drift",
        detail:
          "The review bundle advanced while the clinician was editing, so mutation must recover in place.",
        ref: `review_version.${refSuffix}.superseded`,
      };
    case "decision_epoch_drift":
      return {
        code,
        label: "Decision epoch drift",
        detail:
          "The decision epoch was superseded before this artifact could remain completion-adjacent.",
        ref: `decision_epoch.${refSuffix}.superseded`,
      };
    case "policy_freshness_drift":
      return {
        code,
        label: "Policy freshness drift",
        detail:
          "A policy freshness tuple changed, so the stale artifact can only continue as read-only context.",
        ref: `policy_freshness.${refSuffix}.stale`,
      };
  }
}

function stateForFixture(
  fixture: string,
  input: AssistiveFreezeRecoveryStateAdapterInput,
): AssistiveFreezeRecoveryState {
  const refs = baseRefs(input);
  const artifact = preservedArtifact(input.taskRef, input.selectedAnchorRef);
  const suppressedControls = [
    "Accept artifact",
    "Insert draft",
    "Regenerate from stale session",
    "Export artifact",
    "Complete task",
  ];
  const sharedSecondary = [
    makeReason("publication_drift", `${input.taskRef}.secondary`),
    makeReason("insertion_point_invalidation", `${input.taskRef}.secondary`),
  ];
  const recoverableBase = {
    ...refs,
    fixture,
    recoveryStatus: "frozen" as const,
    actionabilityState: "regenerate_only" as const,
    surfacePostureState: "frozen_in_place" as const,
    bannerLabel: "Stale assistive session",
    preservedArtifact: artifact,
    suppressedControls,
    semanticRole: "status" as const,
    severity: "recoverable" as const,
  };

  switch (fixture) {
    case "publication-drift":
      return {
        ...recoverableBase,
        headline: "Artifact frozen after publication drift",
        primaryReason: makeReason("publication_drift", input.taskRef),
        secondaryReasons: [makeReason("trust_drift", `${input.taskRef}.secondary`)],
        actionabilityState: "recovery_only",
        dominantAction: {
          kind: "recover_in_place",
          label: "Recover in place",
          detail: "Rebind to the current publication tuple without leaving this task shell.",
          enabled: true,
        },
      };
    case "selected-anchor-drift":
      return {
        ...recoverableBase,
        headline: "Artifact frozen because the selected anchor changed",
        primaryReason: makeReason("selected_anchor_drift", input.taskRef),
        secondaryReasons: sharedSecondary,
        dominantAction: {
          kind: "regenerate_in_place",
          label: "Regenerate in place",
          detail: "Generate a fresh artifact against the current selected anchor.",
          enabled: true,
        },
      };
    case "insertion-drift":
      return {
        ...recoverableBase,
        headline: "Artifact frozen after insertion target drift",
        primaryReason: makeReason("insertion_point_invalidation", input.taskRef),
        secondaryReasons: [makeReason("review_version_drift", `${input.taskRef}.secondary`)],
        actionabilityState: "recovery_only",
        dominantAction: {
          kind: "recover_in_place",
          label: "Recover in place",
          detail: "Re-resolve the insertion point before any draft action can return.",
          enabled: true,
        },
      };
    case "review-version-drift-editing":
      return {
        ...recoverableBase,
        headline: "Editing protected, artifact frozen after review drift",
        primaryReason: makeReason("review_version_drift", input.taskRef),
        secondaryReasons: [makeReason("decision_epoch_drift", `${input.taskRef}.secondary`)],
        focusOnActionBar: true,
        dominantAction: {
          kind: "regenerate_in_place",
          label: "Regenerate in place",
          detail: "Keep focus in this rail and regenerate against the new review version.",
          enabled: true,
        },
      };
    case "decision-epoch-drift":
      return {
        ...recoverableBase,
        headline: "Artifact frozen after decision epoch drift",
        primaryReason: makeReason("decision_epoch_drift", input.taskRef),
        secondaryReasons: [makeReason("selected_anchor_drift", `${input.taskRef}.secondary`)],
        dominantAction: {
          kind: "regenerate_in_place",
          label: "Regenerate in place",
          detail: "Regenerate before any endpoint or completion-adjacent action can proceed.",
          enabled: true,
        },
      };
    case "policy-freshness-drift":
      return {
        ...recoverableBase,
        headline: "Read-only continuation after policy freshness drift",
        primaryReason: makeReason("policy_freshness_drift", input.taskRef),
        secondaryReasons: [makeReason("trust_drift", `${input.taskRef}.secondary`)],
        recoveryStatus: "observe_only",
        actionabilityState: "observe_only",
        surfacePostureState: "preserved_read_only",
        semanticRole: "alert",
        severity: "caution",
        dominantAction: {
          kind: "observe_only_continue",
          label: "Continue observe-only",
          detail: "Use preserved context only until approved reclearance is available.",
          enabled: false,
        },
      };
    case "detail-open":
      return {
        ...recoverableBase,
        headline: "Artifact frozen with recovery detail open",
        primaryReason: makeReason("trust_drift", input.taskRef),
        secondaryReasons: sharedSecondary,
        detailInitiallyOpen: true,
        dominantAction: {
          kind: "regenerate_in_place",
          label: "Regenerate in place",
          detail: "Generate fresh assistive text against current trust and publication refs.",
          enabled: true,
        },
      };
    case "narrow-folded":
      return {
        ...recoverableBase,
        placement: "narrow_sheet",
        headline: "Artifact frozen in compact recovery",
        primaryReason: makeReason("selected_anchor_drift", input.taskRef),
        secondaryReasons: [makeReason("publication_drift", `${input.taskRef}.secondary`)],
        dominantAction: {
          kind: "regenerate_in_place",
          label: "Regenerate in place",
          detail: "Recover the artifact without leaving the folded workspace support region.",
          enabled: true,
        },
      };
    case "regenerate-success":
      return {
        ...recoverableBase,
        headline: "Fresh artifact regenerated in place",
        primaryReason: makeReason("trust_drift", input.taskRef),
        secondaryReasons: [makeReason("publication_drift", `${input.taskRef}.secondary`)],
        recoveryStatus: "regenerated",
        actionabilityState: "frozen",
        dominantAction: {
          kind: "regenerate_in_place",
          label: "Fresh artifact restored",
          detail: "The previous stale artifact has been replaced in the same rail footprint.",
          enabled: false,
        },
      };
    case "trust-drift":
    default:
      return {
        ...recoverableBase,
        headline: "Artifact frozen after trust drift",
        primaryReason: makeReason("trust_drift", input.taskRef),
        secondaryReasons: sharedSecondary,
        dominantAction: {
          kind: "regenerate_in_place",
          label: "Regenerate in place",
          detail: "Generate fresh assistive text against current trust and publication refs.",
          enabled: true,
        },
      };
  }
}

export function AssistiveFreezeRecoveryStateAdapter(
  input: AssistiveFreezeRecoveryStateAdapterInput,
): AssistiveFreezeRecoveryState | null {
  const fixture = normalizeRecoveryFixture(readRequestedRecoveryFixture());
  if (!fixture) {
    return null;
  }
  return stateForFixture(fixture, input);
}

export function AssistiveRecoveryFocusManager({
  rootRef,
  detailOpen,
  focusOnActionBar,
  actionButtonRef,
  detailButtonRef,
  onCloseDetail,
}: AssistiveRecoveryFocusManagerProps) {
  useEffect(() => {
    if (!focusOnActionBar) {
      return;
    }
    const timeout = window.setTimeout(() => actionButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [actionButtonRef, focusOnActionBar]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !detailOpen) {
        return;
      }

      const root = rootRef.current;
      if (!root || !root.contains(document.activeElement)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      onCloseDetail();
      detailButtonRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [detailButtonRef, detailOpen, onCloseDetail, rootRef]);

  return null;
}

export function AssistiveStaleSessionBanner({
  state,
  recoveryStatus,
}: {
  state: AssistiveFreezeRecoveryState;
  recoveryStatus: AssistiveFreezeRecoveryStatus;
}) {
  return (
    <header className="assistive-freeze__banner" data-testid="AssistiveStaleSessionBanner">
      <div>
        <span>{state.bannerLabel}</span>
        <h3>
          {recoveryStatus === "regenerated" ? "Fresh assistive artifact restored" : state.headline}
        </h3>
      </div>
      <strong data-status={recoveryStatus}>{recoveryStatus.replaceAll("_", " ")}</strong>
    </header>
  );
}

export function AssistiveFreezeReasonList({
  state,
}: {
  state: Pick<AssistiveFreezeRecoveryState, "primaryReason" | "secondaryReasons">;
}) {
  return (
    <section className="assistive-freeze__reasons" data-testid="AssistiveFreezeReasonList">
      <h4>Why this artifact froze</h4>
      <ol>
        <li data-primary="true">
          <strong>{state.primaryReason.label}</strong>
          <span>{state.primaryReason.detail}</span>
          <code>{state.primaryReason.ref}</code>
        </li>
        {state.secondaryReasons.slice(0, 2).map((reason) => (
          <li key={reason.code}>
            <strong>{reason.label}</strong>
            <span>{reason.detail}</span>
            <code>{reason.ref}</code>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AssistivePreservedArtifactView({
  artifact,
  recovered,
}: {
  artifact: AssistivePreservedArtifact;
  recovered: boolean;
}) {
  return (
    <article
      className="assistive-freeze__artifact"
      data-testid="AssistivePreservedArtifactView"
      data-recovered={recovered ? "true" : "false"}
      aria-label="Preserved stale assistive artifact"
    >
      <div className="assistive-freeze__artifact-header">
        <span>{recovered ? "Regenerated artifact" : "Preserved artifact"}</span>
        <h4>{artifact.title}</h4>
        <p>
          {recovered
            ? "Regenerated against the current recovery tuple."
            : artifact.generatedAtLabel}
        </p>
      </div>
      <div className="assistive-freeze__artifact-body">
        {(recovered
          ? [
              "Fresh assistive text is available in the same shell after recovery. It still requires human review before insertion or settlement.",
              "The prior stale artifact remains represented through history rather than writable controls.",
            ]
          : artifact.body
        ).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <footer className="assistive-freeze__artifact-provenance">
        <span>Preserved history</span>
        <dl>
          {artifact.provenance.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </footer>
    </article>
  );
}

export function AssistiveStaleControlSuppression({ controls }: { controls: string[] }) {
  return (
    <section
      className="assistive-freeze__suppression"
      data-testid="AssistiveStaleControlSuppression"
      aria-label="Suppressed stale controls"
    >
      <h4>Suppressed immediately</h4>
      <ul>
        {controls.map((control) => (
          <li key={control} aria-disabled="true">
            {control}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AssistiveRecoverableNotice({
  state,
  recovered,
}: {
  state: AssistiveFreezeRecoveryState;
  recovered: boolean;
}) {
  return (
    <section className="assistive-freeze__notice" data-testid="AssistiveRecoverableNotice">
      <h4>{recovered ? "Recovered in this shell" : "Same-shell recovery status"}</h4>
      <p>
        {recovered
          ? "The stale frame patched in place and focus stayed inside the assistive recovery region."
          : state.dominantAction.detail}
      </p>
    </section>
  );
}

export function AssistiveRegenerateInPlaceActionBar({
  state,
  recoveryStatus,
  detailOpen,
  detailId,
  actionButtonRef,
  detailButtonRef,
  onDominantAction,
  onToggleDetail,
}: {
  state: AssistiveFreezeRecoveryState;
  recoveryStatus: AssistiveFreezeRecoveryStatus;
  detailOpen: boolean;
  detailId: string;
  actionButtonRef: RefObject<HTMLButtonElement | null>;
  detailButtonRef: RefObject<HTMLButtonElement | null>;
  onDominantAction: () => void;
  onToggleDetail: () => void;
}) {
  const recovered = recoveryStatus === "regenerated";
  const enabled = state.dominantAction.enabled && !recovered;

  return (
    <section
      className="assistive-freeze__action-bar"
      data-testid="AssistiveRegenerateInPlaceActionBar"
      aria-label="Stale assistive recovery actions"
    >
      <div>
        <span>Dominant safe next action</span>
        <strong>{recovered ? "Fresh artifact restored" : state.dominantAction.label}</strong>
        <p>
          {recovered
            ? "Recovery completed without remounting the assistive surface."
            : state.dominantAction.detail}
        </p>
      </div>
      <div className="assistive-freeze__action-buttons">
        {state.dominantAction.enabled ? (
          <button
            ref={actionButtonRef}
            type="button"
            className="assistive-freeze__primary-action"
            data-testid="AssistiveRecoveryDominantAction"
            aria-disabled={enabled ? undefined : "true"}
            onClick={enabled ? onDominantAction : undefined}
          >
            {recovered ? "Fresh artifact restored" : state.dominantAction.label}
          </button>
        ) : (
          <span className="assistive-freeze__no-local-action">
            No local stale mutation is available.
          </span>
        )}
        <button
          ref={detailButtonRef}
          type="button"
          className="assistive-freeze__detail-action"
          aria-expanded={detailOpen}
          aria-controls={detailId}
          onClick={onToggleDetail}
        >
          {detailOpen ? "Hide stale reason detail" : "Show stale reason detail"}
        </button>
      </div>
    </section>
  );
}

export function AssistiveRecoveryExplanationPanel({
  state,
  id,
  open,
}: {
  state: AssistiveFreezeRecoveryState;
  id: string;
  open: boolean;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      className="assistive-freeze__detail"
      data-testid="AssistiveRecoveryExplanationPanel"
      data-expanded={open ? "true" : "false"}
      aria-labelledby={headingId}
      hidden={!open}
    >
      <h4 id={headingId}>Recovery rules detail</h4>
      <dl>
        <div>
          <dt>Freeze frame</dt>
          <dd>{state.freezeFrameRef}</dd>
        </div>
        <div>
          <dt>Recovery disposition</dt>
          <dd>{state.releaseRecoveryDispositionRef}</dd>
        </div>
        <div>
          <dt>Review action lease</dt>
          <dd>{state.reviewActionLeaseRef}</dd>
        </div>
        <div>
          <dt>Draft insertion point</dt>
          <dd>{state.draftInsertionPointRef}</dd>
        </div>
        <div>
          <dt>Patch lease</dt>
          <dd>{state.draftPatchLeaseRef}</dd>
        </div>
      </dl>
    </section>
  );
}

export function AssistiveFreezeInPlaceFrame({ state }: { state: AssistiveFreezeRecoveryState }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);
  const detailButtonRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();
  const detailId = useId();
  const [detailOpen, setDetailOpen] = useState(Boolean(state.detailInitiallyOpen));
  const [recoveryStatus, setRecoveryStatus] = useState<AssistiveFreezeRecoveryStatus>(
    state.recoveryStatus,
  );
  const recovered = recoveryStatus === "regenerated";

  const handleDominantAction = () => {
    if (!state.dominantAction.enabled || recovered) {
      return;
    }
    setRecoveryStatus("regenerated");
    window.requestAnimationFrame(() => actionButtonRef.current?.focus());
  };

  return (
    <section
      ref={rootRef}
      className="assistive-freeze"
      data-testid="AssistiveFreezeInPlaceFrame"
      data-visual-mode={state.visualMode}
      data-placement={state.placement}
      data-fixture={state.fixture}
      data-primary-drift={state.primaryReason.code}
      data-actionability-state={state.actionabilityState}
      data-recovery-state={recoveryStatus}
      data-selected-anchor-ref={state.selectedAnchorRef}
      data-freeze-frame-ref={state.freezeFrameRef}
      role={state.semanticRole}
      aria-live={state.semanticRole === "alert" ? "assertive" : "polite"}
      aria-labelledby={headingId}
    >
      <AssistiveRecoveryFocusManager
        rootRef={rootRef}
        detailOpen={detailOpen}
        focusOnActionBar={state.focusOnActionBar}
        actionButtonRef={actionButtonRef}
        detailButtonRef={detailButtonRef}
        onCloseDetail={() => setDetailOpen(false)}
      />
      <div id={headingId} className="sr-only">
        {state.headline}
      </div>
      <AssistiveStaleSessionBanner state={state} recoveryStatus={recoveryStatus} />
      <AssistiveFreezeReasonList state={state} />
      <AssistivePreservedArtifactView artifact={state.preservedArtifact} recovered={recovered} />
      <AssistiveStaleControlSuppression controls={state.suppressedControls} />
      <AssistiveRegenerateInPlaceActionBar
        state={state}
        recoveryStatus={recoveryStatus}
        detailOpen={detailOpen}
        detailId={detailId}
        actionButtonRef={actionButtonRef}
        detailButtonRef={detailButtonRef}
        onDominantAction={handleDominantAction}
        onToggleDetail={() => setDetailOpen((current) => !current)}
      />
      <AssistiveRecoverableNotice state={state} recovered={recovered} />
      <AssistiveRecoveryExplanationPanel state={state} id={detailId} open={detailOpen} />
    </section>
  );
}
