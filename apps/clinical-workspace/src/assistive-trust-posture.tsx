import { useEffect, useId, useRef, useState, type RefObject } from "react";
import type { StaffRouteKind, StaffShellLedger } from "./workspace-shell.data";

export const ASSISTIVE_TRUST_POSTURE_VISUAL_MODE = "Assistive_Trust_Posture_Ladder";

// Mirrors AssistiveCapabilityTrustEnvelope, AssistiveCapabilityRolloutVerdict,
// and ReleaseRecoveryDisposition refs without recomputing backend trust.
export type AssistiveTrustPostureKind =
  | "shadow_only"
  | "observe_only"
  | "degraded"
  | "quarantined"
  | "frozen"
  | "blocked_by_policy";

export type AssistiveTrustState = "trusted" | "degraded" | "quarantined" | "shadow_only" | "frozen";
export type AssistiveSurfacePostureState =
  | "interactive"
  | "observe_only"
  | "provenance_only"
  | "placeholder_only"
  | "hidden";
export type AssistiveActionabilityState =
  | "enabled"
  | "regenerate_only"
  | "observe_only"
  | "blocked_by_policy"
  | "blocked";
export type AssistiveConfidencePostureState = "conservative_band" | "suppressed" | "hidden";

export type AssistiveTrustReason = {
  code: string;
  label: string;
  detail: string;
};

export type AssistiveDominantAction = {
  label: string;
  detail: string;
  kind: "continue_review" | "recover" | "provenance_only" | "wait" | "manual_workflow";
  enabled: boolean;
};

export type AssistiveTrustPostureState = {
  fixture: string;
  visualMode: typeof ASSISTIVE_TRUST_POSTURE_VISUAL_MODE;
  placement: "rail_card" | "stage_card" | "narrow_sheet";
  routeKind: StaffRouteKind;
  taskRef: string;
  selectedAnchorRef: string;
  capabilityCode: string;
  trustEnvelopeRef: string;
  rolloutVerdictRef: string;
  releaseRecoveryDispositionRef: string;
  posture: AssistiveTrustPostureKind;
  trustState: AssistiveTrustState;
  surfacePostureState: AssistiveSurfacePostureState;
  actionabilityState: AssistiveActionabilityState;
  confidencePostureState: AssistiveConfidencePostureState;
  postureName: string;
  headline: string;
  reason: AssistiveTrustReason;
  dominantAction: AssistiveDominantAction;
  allowedActions: string[];
  suppressedActions: string[];
  helperRows: AssistiveTrustReason[];
  detailInitiallyOpen?: boolean;
  severity: "neutral" | "watch" | "caution" | "containment" | "frozen" | "hard_stop";
  semanticRole: "status" | "alert";
  preservedText?: string;
};

export type AssistiveTrustStateAdapterInput = {
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  taskRef: string;
  routeKind: StaffRouteKind;
};

type AssistiveTrustPostureKeyboardControllerProps = {
  rootRef: RefObject<HTMLElement | null>;
  detailOpen: boolean;
  onClose: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

function readRequestedTrustFixture(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get("assistiveTrust");
}

function normalizeTrustFixture(value: string | null): string | null {
  switch (value) {
    case "shadow-only":
    case "shadow_only":
      return "shadow-only";
    case "observe-only":
    case "observe_only":
      return "observe-only";
    case "degraded":
    case "degraded-recovery":
      return "degraded";
    case "quarantined":
    case "quarantine":
      return "quarantined";
    case "frozen":
    case "frozen-preserved":
      return "frozen";
    case "blocked-policy":
    case "blocked-by-policy":
    case "blocked_by_policy":
      return "blocked-by-policy";
    case "detail-open":
      return "detail-open";
    case "narrow-folded":
      return "narrow-folded";
    default:
      return null;
  }
}

function baseRefs({
  selectedAnchorRef,
  taskRef,
  routeKind,
}: AssistiveTrustStateAdapterInput) {
  return {
    visualMode: ASSISTIVE_TRUST_POSTURE_VISUAL_MODE,
    placement: routeKind === "task" ? "rail_card" : "stage_card",
    routeKind,
    taskRef,
    selectedAnchorRef,
    capabilityCode: "assistive_documentation_shadow",
    trustEnvelopeRef: `assistive_capability_trust_envelope.422.${taskRef}.${selectedAnchorRef}`,
    rolloutVerdictRef: `assistive_rollout_verdict.415.${taskRef}.documentation_composer`,
    releaseRecoveryDispositionRef: `release_recovery_disposition.416.${taskRef}.assistive`,
  } satisfies Pick<
    AssistiveTrustPostureState,
    | "visualMode"
    | "placement"
    | "routeKind"
    | "taskRef"
    | "selectedAnchorRef"
    | "capabilityCode"
    | "trustEnvelopeRef"
    | "rolloutVerdictRef"
    | "releaseRecoveryDispositionRef"
  >;
}

function postureForScenario(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): AssistiveTrustPostureKind {
  switch (runtimeScenario) {
    case "read_only":
      return "observe_only";
    case "recovery_only":
    case "stale_review":
      return "degraded";
    case "blocked":
      return "frozen";
    case "live":
    default:
      return "shadow_only";
  }
}

function stateForPosture(
  posture: AssistiveTrustPostureKind,
  input: AssistiveTrustStateAdapterInput,
): AssistiveTrustPostureState {
  const refs = baseRefs(input);
  const sharedSuppressed = ["Insert draft", "Accept artifact", "Export artifact", "Complete task"];

  switch (posture) {
    case "observe_only":
      return {
        ...refs,
        fixture: "observe-only",
        posture,
        trustState: "degraded",
        surfacePostureState: "observe_only",
        actionabilityState: "observe_only",
        confidencePostureState: "suppressed",
        postureName: "Observe-only",
        headline: "Readable assistive context, no write posture",
        reason: {
          code: "workspace_read_only",
          label: "Workspace read-only",
          detail: "Prior assistive context may remain readable while insert and completion-adjacent actions stay suppressed.",
        },
        dominantAction: {
          label: "Continue manual review",
          detail: "Use the primary task canvas as the writable source of truth.",
          kind: "continue_review",
          enabled: false,
        },
        allowedActions: ["Read summary", "Read provenance"],
        suppressedActions: sharedSuppressed,
        helperRows: [
          {
            code: "completion_adjacent_blocked",
            label: "Completion cues blocked",
            detail: "The rail may not imply settlement or final action while in observe-only posture.",
          },
        ],
        severity: "watch",
        semanticRole: "status",
      };
    case "degraded":
      return {
        ...refs,
        fixture: "degraded",
        posture,
        trustState: "degraded",
        surfacePostureState: "observe_only",
        actionabilityState: "regenerate_only",
        confidencePostureState: "suppressed",
        postureName: "Degraded",
        headline: "Trust degraded with bounded recovery available",
        reason: {
          code: "trust_projection_degraded",
          label: "Trust projection degraded",
          detail: "Monitoring permits provenance and recovery guidance, but not fresh insert or acceptance controls.",
        },
        dominantAction: {
          label: "Review recovery options",
          detail: "Open bounded recovery detail without leaving the current task shell.",
          kind: "recover",
          enabled: true,
        },
        allowedActions: ["Read provenance", "Review recovery options"],
        suppressedActions: ["Insert draft", "Accept artifact", "Export artifact", "Complete task"],
        helperRows: [
          {
            code: "current_posture_fail_closed",
            label: "Current posture fails closed",
            detail: "The browser may narrow the posture, but it may not widen beyond the current trust envelope.",
          },
          {
            code: "provenance_allowed",
            label: "Provenance remains visible",
            detail: "The provenance footer can stay readable because policy still allows bounded context.",
          },
        ],
        severity: "caution",
        semanticRole: "status",
      };
    case "quarantined":
      return {
        ...refs,
        fixture: "quarantined",
        posture,
        trustState: "quarantined",
        surfacePostureState: "provenance_only",
        actionabilityState: "blocked",
        confidencePostureState: "hidden",
        postureName: "Quarantined",
        headline: "Contained to provenance only",
        reason: {
          code: "incident_or_threshold_containment",
          label: "Containment active",
          detail: "The capability is quarantined by trust or safety containment and cannot drive visible assertions.",
        },
        dominantAction: {
          label: "Use provenance only",
          detail: "Treat the artifact as lineage context until governed replay clears containment.",
          kind: "provenance_only",
          enabled: false,
        },
        allowedActions: ["Read provenance refs"],
        suppressedActions: ["Insert draft", "Accept artifact", "Regenerate", "Export artifact", "Complete task"],
        helperRows: [
          {
            code: "deterministic_replay_required",
            label: "Governed replay required",
            detail: "Quarantined outputs require explicit recovery and replay before reuse.",
          },
        ],
        severity: "containment",
        semanticRole: "alert",
      };
    case "frozen":
      return {
        ...refs,
        fixture: "frozen",
        posture,
        trustState: "frozen",
        surfacePostureState: "provenance_only",
        actionabilityState: "blocked",
        confidencePostureState: "suppressed",
        postureName: "Frozen",
        headline: "Preserved text, frozen actions",
        reason: {
          code: "active_freeze_frame",
          label: "Freeze frame active",
          detail: "The assistive artifact is preserved in place while write and completion controls remain frozen.",
        },
        dominantAction: {
          label: "Wait for governed recovery",
          detail: "Continue reviewing manually; stale recovery is handled by the recovery surface.",
          kind: "wait",
          enabled: false,
        },
        allowedActions: ["Read preserved text", "Read provenance"],
        suppressedActions: ["Insert draft", "Accept artifact", "Regenerate", "Export artifact", "Complete task"],
        helperRows: [
          {
            code: "preserved_context",
            label: "Context preserved",
            detail: "Frozen is preservation in place, not quarantine containment.",
          },
        ],
        preservedText:
          "Preserved assistive text remains readable for context. It is not writable, insertable, or completion-adjacent.",
        severity: "frozen",
        semanticRole: "status",
      };
    case "blocked_by_policy":
      return {
        ...refs,
        fixture: "blocked-by-policy",
        posture,
        trustState: "quarantined",
        surfacePostureState: "placeholder_only",
        actionabilityState: "blocked_by_policy",
        confidencePostureState: "hidden",
        postureName: "Blocked by policy",
        headline: "Policy hard stop",
        reason: {
          code: "policy_ceiling_blocks_surface",
          label: "Policy ceiling blocks this surface",
          detail: "The current policy bundle does not permit assistive rendering or local recovery from this workspace.",
        },
        dominantAction: {
          label: "Use manual workflow",
          detail: "Do not work around this block. Continue through the primary clinical workflow.",
          kind: "manual_workflow",
          enabled: false,
        },
        allowedActions: ["Manual review only"],
        suppressedActions: ["Show assistive text", "Insert draft", "Accept artifact", "Regenerate", "Export artifact"],
        helperRows: [
          {
            code: "no_local_workaround",
            label: "No local workaround",
            detail: "Policy blocks must clear through the governing release and trust process.",
          },
        ],
        severity: "hard_stop",
        semanticRole: "alert",
      };
    case "shadow_only":
    default:
      return {
        ...refs,
        fixture: "shadow-only",
        posture: "shadow_only",
        trustState: "shadow_only",
        surfacePostureState: "hidden",
        actionabilityState: "observe_only",
        confidencePostureState: "hidden",
        postureName: "Shadow-only",
        headline: "Awareness only, not a visible action surface",
        reason: {
          code: "missing_visible_readiness",
          label: "Visible readiness not established",
          detail: "The capability lacks the visible readiness evidence required to render as more than shadow awareness.",
        },
        dominantAction: {
          label: "Keep reviewing primary canvas",
          detail: "The assistive companion remains non-authoritative and cannot influence the workflow.",
          kind: "continue_review",
          enabled: false,
        },
        allowedActions: ["Read bounded summary stub"],
        suppressedActions: sharedSuppressed,
        helperRows: [
          {
            code: "no_local_widening",
            label: "No local widening",
            detail: "Client-side toggles may not promote shadow-only capability into a richer posture.",
          },
        ],
        severity: "neutral",
        semanticRole: "status",
      };
  }
}

export function AssistiveTrustStateAdapter(
  input: AssistiveTrustStateAdapterInput,
): AssistiveTrustPostureState | null {
  const fixture = normalizeTrustFixture(readRequestedTrustFixture());
  if (!fixture) {
    return null;
  }

  const posture =
    fixture === "shadow-only"
      ? "shadow_only"
      : fixture === "observe-only"
        ? "observe_only"
        : fixture === "quarantined"
          ? "quarantined"
          : fixture === "frozen"
            ? "frozen"
            : fixture === "blocked-by-policy"
              ? "blocked_by_policy"
              : fixture === "narrow-folded"
                ? postureForScenario(input.runtimeScenario)
                : "degraded";

  const state = stateForPosture(posture, input);
  return {
    ...state,
    fixture,
    placement: fixture === "narrow-folded" ? "narrow_sheet" : state.placement,
    detailInitiallyOpen: fixture === "detail-open",
  };
}

function AssistiveTrustPostureKeyboardController({
  rootRef,
  detailOpen,
  onClose,
  buttonRef,
}: AssistiveTrustPostureKeyboardControllerProps) {
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
      onClose();
      buttonRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [buttonRef, detailOpen, onClose, rootRef]);

  return null;
}

export function AssistiveTrustStateChip({
  state,
}: {
  state: Pick<AssistiveTrustPostureState, "posture" | "postureName" | "severity">;
}) {
  return (
    <span
      className="assistive-trust__chip"
      data-testid="AssistiveTrustStateChip"
      data-posture={state.posture}
      data-severity={state.severity}
    >
      {state.postureName}
    </span>
  );
}

function AssistiveActionRows({ state }: { state: AssistiveTrustPostureState }) {
  return (
    <dl className="assistive-trust__action-rows" aria-label="Assistive actionability">
      <div>
        <dt>Current actionability</dt>
        <dd>{state.actionabilityState.replaceAll("_", " ")}</dd>
      </div>
      <div>
        <dt>Confidence posture</dt>
        <dd>{state.confidencePostureState.replaceAll("_", " ")}</dd>
      </div>
    </dl>
  );
}

function AssistiveSuppressedActionList({ actions }: { actions: string[] }) {
  return (
    <ul className="assistive-trust__suppressed-actions" aria-label="Suppressed assistive actions">
      {actions.map((action) => (
        <li key={action}>{action}</li>
      ))}
    </ul>
  );
}

function AssistiveAllowedActionList({ actions }: { actions: string[] }) {
  return (
    <ul className="assistive-trust__allowed-actions" aria-label="Allowed assistive actions">
      {actions.map((action) => (
        <li key={action}>{action}</li>
      ))}
    </ul>
  );
}

export function AssistiveShadowOnlyNotice({ state }: { state: AssistiveTrustPostureState }) {
  return (
    <section className="assistive-trust__notice" data-testid="AssistiveShadowOnlyNotice">
      <h4>Shadow awareness only</h4>
      <p>{state.reason.detail}</p>
    </section>
  );
}

export function AssistiveObserveOnlyNotice({ state }: { state: AssistiveTrustPostureState }) {
  return (
    <section className="assistive-trust__notice" data-testid="AssistiveObserveOnlyNotice">
      <h4>Observe-only posture</h4>
      <p>{state.reason.detail}</p>
    </section>
  );
}

export function AssistiveDegradedStatePanel({ state }: { state: AssistiveTrustPostureState }) {
  return (
    <section className="assistive-trust__notice" data-testid="AssistiveDegradedStatePanel">
      <h4>Degraded, recoverable context</h4>
      <p>{state.reason.detail}</p>
    </section>
  );
}

export function AssistiveQuarantinedStatePanel({ state }: { state: AssistiveTrustPostureState }) {
  return (
    <section className="assistive-trust__notice" data-testid="AssistiveQuarantinedStatePanel">
      <h4>Quarantined containment</h4>
      <p>{state.reason.detail}</p>
    </section>
  );
}

export function AssistiveFrozenStatePanel({ state }: { state: AssistiveTrustPostureState }) {
  return (
    <section className="assistive-trust__notice" data-testid="AssistiveFrozenStatePanel">
      <h4>Frozen in place</h4>
      <p>{state.reason.detail}</p>
      {state.preservedText && <blockquote>{state.preservedText}</blockquote>}
    </section>
  );
}

export function AssistiveBlockedByPolicyPanel({ state }: { state: AssistiveTrustPostureState }) {
  return (
    <section className="assistive-trust__notice" data-testid="AssistiveBlockedByPolicyPanel">
      <h4>Hard stop</h4>
      <p>{state.reason.detail}</p>
    </section>
  );
}

function AssistivePostureSpecificPanel({ state }: { state: AssistiveTrustPostureState }) {
  switch (state.posture) {
    case "observe_only":
      return <AssistiveObserveOnlyNotice state={state} />;
    case "degraded":
      return <AssistiveDegradedStatePanel state={state} />;
    case "quarantined":
      return <AssistiveQuarantinedStatePanel state={state} />;
    case "frozen":
      return <AssistiveFrozenStatePanel state={state} />;
    case "blocked_by_policy":
      return <AssistiveBlockedByPolicyPanel state={state} />;
    case "shadow_only":
    default:
      return <AssistiveShadowOnlyNotice state={state} />;
  }
}

export function AssistiveRecoveryActionPanel({
  state,
  detailOpen,
  controlsId,
  buttonRef,
  onToggleDetail,
}: {
  state: AssistiveTrustPostureState;
  detailOpen: boolean;
  controlsId: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onToggleDetail: () => void;
}) {
  return (
    <section className="assistive-trust__recovery" data-testid="AssistiveRecoveryActionPanel">
      <div>
        <span>Dominant safe next action</span>
        <strong>{state.dominantAction.label}</strong>
        <p>{state.dominantAction.detail}</p>
      </div>
      {state.dominantAction.enabled ? (
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={detailOpen}
          aria-controls={controlsId}
          onClick={onToggleDetail}
        >
          {detailOpen ? "Hide recovery detail" : state.dominantAction.label}
        </button>
      ) : (
        <p className="assistive-trust__no-workaround">No local assistive action is available.</p>
      )}
    </section>
  );
}

function AssistiveTrustDetailDrawer({
  state,
  id,
  open,
}: {
  state: AssistiveTrustPostureState;
  id: string;
  open: boolean;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      className="assistive-trust__detail"
      data-testid="AssistiveTrustDetailDrawer"
      data-expanded={open ? "true" : "false"}
      aria-labelledby={headingId}
      hidden={!open}
    >
      <h4 id={headingId}>Governing trust detail</h4>
      <dl>
        {[state.reason, ...state.helperRows].map((row) => (
          <div key={row.code}>
            <dt>{row.label}</dt>
            <dd>{row.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AssistiveTrustStateFrame({ state }: { state: AssistiveTrustPostureState }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const detailButtonRef = useRef<HTMLButtonElement | null>(null);
  const detailId = useId();
  const headingId = useId();
  const [detailOpen, setDetailOpen] = useState(Boolean(state.detailInitiallyOpen));

  return (
    <section
      ref={rootRef}
      className="assistive-trust"
      data-testid="AssistiveTrustStateFrame"
      data-visual-mode={state.visualMode}
      data-placement={state.placement}
      data-posture={state.posture}
      data-trust-state={state.trustState}
      data-actionability-state={state.actionabilityState}
      data-confidence-posture={state.confidencePostureState}
      data-trust-envelope-ref={state.trustEnvelopeRef}
      role={state.semanticRole}
      aria-live={state.semanticRole === "alert" ? "assertive" : "polite"}
      aria-labelledby={headingId}
    >
      <AssistiveTrustPostureKeyboardController
        rootRef={rootRef}
        detailOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        buttonRef={detailButtonRef}
      />
      <header className="assistive-trust__header">
        <div>
          <span className="assistive-trust__label">Assistive trust posture</span>
          <h3 id={headingId}>{state.headline}</h3>
        </div>
        <AssistiveTrustStateChip state={state} />
      </header>

      <p className="assistive-trust__reason">
        <strong>{state.reason.label}</strong>
        <span>{state.reason.detail}</span>
      </p>

      <AssistivePostureSpecificPanel state={state} />
      <AssistiveActionRows state={state} />
      <div className="assistive-trust__lists">
        <section>
          <h4>Allowed now</h4>
          <AssistiveAllowedActionList actions={state.allowedActions} />
        </section>
        <section>
          <h4>Suppressed</h4>
          <AssistiveSuppressedActionList actions={state.suppressedActions} />
        </section>
      </div>
      <AssistiveRecoveryActionPanel
        state={state}
        detailOpen={detailOpen}
        controlsId={detailId}
        buttonRef={detailButtonRef}
        onToggleDetail={() => setDetailOpen((current) => !current)}
      />
      <AssistiveTrustDetailDrawer state={state} id={detailId} open={detailOpen} />
      <footer className="assistive-trust__footer" aria-label="Assistive trust references">
        <dl>
          <div>
            <dt>Trust envelope</dt>
            <dd>{state.trustEnvelopeRef}</dd>
          </div>
          <div>
            <dt>Rollout verdict</dt>
            <dd>{state.rolloutVerdictRef}</dd>
          </div>
          <div>
            <dt>Recovery disposition</dt>
            <dd>{state.releaseRecoveryDispositionRef}</dd>
          </div>
        </dl>
      </footer>
    </section>
  );
}
