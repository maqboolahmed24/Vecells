import type { ReactNode } from "react";

export const STATUS_TRUTH_TASK_ID = "par_107";
export const STATUS_TRUTH_VISUAL_MODE = "Status_Truth_Lab";
export const STATUS_TRUTH_SOURCE_PRECEDENCE = [
  "prompt/107.md",
  "prompt/shared_operating_contract_106_to_115.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "blueprint/platform-frontend-blueprint.md#1.1F StatusStripAuthority",
  "blueprint/platform-frontend-blueprint.md#1.2 CasePulse",
  "blueprint/platform-frontend-blueprint.md#1.6 AmbientStateRibbon",
  "blueprint/platform-frontend-blueprint.md#1.7 FreshnessChip",
  "blueprint/platform-frontend-blueprint.md#1.7A ProjectionFreshnessEnvelope",
  "blueprint/ux-quiet-clarity-redesign.md#StatusStripAuthority",
  "blueprint/patient-account-and-communications-blueprint.md#Purpose",
  "blueprint/patient-portal-experience-architecture-blueprint.md#1A. Calm route posture and artifact delivery",
  "blueprint/staff-workspace-interface-architecture.md#3. Active task shell",
  "blueprint/operations-console-frontend-blueprint.md#State and interaction model",
  "blueprint/governance-admin-console-frontend-blueprint.md#Core shell responsibilities",
  "blueprint/pharmacy-console-frontend-architecture.md#Phase 0 shell law",
  "blueprint/phase-5-the-network-horizon.md#Hub shell",
  "blueprint/accessibility-and-content-system-contract.md#FreshnessAccessibilityContract",
  "blueprint/forensic-audit-findings.md#Finding 86",
  "blueprint/forensic-audit-findings.md#Finding 89",
  "blueprint/forensic-audit-findings.md#Finding 92",
  "blueprint/forensic-audit-findings.md#Finding 97",
  "blueprint/forensic-audit-findings.md#Finding 99",
  "blueprint/forensic-audit-findings.md#Finding 116",
  "blueprint/forensic-audit-findings.md#Finding 120",
] as const;

export type StatusAudienceProfile =
  | "patient"
  | "workspace"
  | "hub"
  | "operations"
  | "governance"
  | "pharmacy";

export type StatusAudienceTier = "patient" | "professional";
export type StatusMacroState =
  | "received"
  | "in_review"
  | "reviewing_next_steps"
  | "awaiting_external"
  | "action_required"
  | "settled"
  | "blocked"
  | "recovery_required";
export type ProjectionTrustState = "trusted" | "partial" | "degraded" | "blocked";
export type ProjectionFreshnessState =
  | "fresh"
  | "updating"
  | "stale_review"
  | "blocked_recovery";
export type ProjectionTransportState = "live" | "reconnecting" | "disconnected" | "paused";
export type ProjectionActionabilityState = "live" | "guarded" | "frozen" | "recovery_only";
export type StatusStripDegradeMode =
  | "quiet_pending"
  | "refresh_required"
  | "recovery_required";
export type LocalFeedbackState = "none" | "shown" | "queued" | "superseded";
export type ProcessingAcceptanceState =
  | "none"
  | "accepted_for_processing"
  | "awaiting_external_confirmation"
  | "rejected"
  | "timed_out";
export type PendingExternalState =
  | "none"
  | "awaiting_confirmation"
  | "awaiting_reply"
  | "awaiting_ack";
export type AuthoritativeOutcomeState =
  | "none"
  | "pending"
  | "review_required"
  | "recovery_required"
  | "settled"
  | "failed";
export type SaveState = "idle" | "saving" | "saved" | "failed";
export type StatusTone = "neutral" | "caution" | "critical";
export type StatusRecoveryPosture =
  | "none"
  | "guarded"
  | "review_required"
  | "recovery_required"
  | "blocked";
export type StatusStripRenderMode = "integrated_status_strip" | "promoted_banner";
export type CasePulseAxisKey =
  | "lifecycle"
  | "ownership"
  | "trust"
  | "urgency"
  | "interaction";

export interface ProjectionFreshnessEnvelope {
  projectionFreshnessEnvelopeId: string;
  continuityKey: string;
  entityScope: string;
  surfaceRef: string;
  selectedAnchorRef: string;
  consistencyClass: "informational_eventual" | "operational_guarded" | "command_following";
  scope: "shell" | "region" | "anchor" | "command_following";
  projectionFreshnessState: ProjectionFreshnessState;
  transportState: ProjectionTransportState;
  actionabilityState: ProjectionActionabilityState;
  lastProjectionVersionRef: string;
  lastCausalTokenApplied: string;
  lastKnownGoodSnapshotRef: string;
  lastKnownGoodAt: string;
  staleAfterAt: string;
  reasonRefs: readonly string[];
  localizedDegradationRefs: readonly string[];
  derivedFromRefs: readonly string[];
  evaluatedAt: string;
}

export interface StatusStripAuthority {
  authorityId: string;
  macroStateRef: StatusMacroState;
  bundleVersion: string;
  audienceTier: StatusAudienceTier;
  shellFreshnessEnvelopeRef: string;
  projectionTrustState: ProjectionTrustState;
  ownedSignalClasses: readonly string[];
  localSignalSuppressionRef: string;
  degradeMode: StatusStripDegradeMode;
}

export interface StatusTruthInput {
  audience: StatusAudienceProfile;
  authority: StatusStripAuthority;
  freshnessEnvelope: ProjectionFreshnessEnvelope;
  localFeedbackState: LocalFeedbackState;
  processingAcceptanceState: ProcessingAcceptanceState;
  pendingExternalState: PendingExternalState;
  authoritativeOutcomeState: AuthoritativeOutcomeState;
  saveState: SaveState;
  dominantActionLabel: string;
  lastChangedAt: string;
  provenanceLabel?: string;
}

export interface StatusIssue {
  code: string;
  severity: "warning" | "error";
  message: string;
}

export interface StatusSentence {
  stateSummary: string;
  pendingDetail: string | null;
  ribbonLabel: string;
  ribbonDetail: string;
  freshnessLabel: string;
  actionabilityLabel: string;
  tone: StatusTone;
  renderMode: StatusStripRenderMode;
  liveAnnounce: "polite" | "assertive";
  recoveryPosture: StatusRecoveryPosture;
  issues: readonly StatusIssue[];
}

export interface CasePulseAxis {
  key: CasePulseAxisKey;
  label: string;
  value: string;
  detail: string;
}

export interface CasePulseContract {
  entityRef: string;
  entityType: string;
  audience: StatusAudienceProfile;
  macroState: StatusMacroState;
  headline: string;
  subheadline: string;
  primaryNextActionLabel: string;
  ownershipOrActorSummary: string;
  urgencyBand: string;
  confirmationPosture: string;
  lastMeaningfulUpdateAt: string;
  changedSinceSeen: string;
  stateAxes: readonly CasePulseAxis[];
}

export interface StatusTruthSpecimen {
  id: string;
  audience: StatusAudienceProfile;
  title: string;
  authority: StatusStripAuthority;
  freshnessEnvelope: ProjectionFreshnessEnvelope;
  statusInput: StatusTruthInput;
  pulse: CasePulseContract;
}

const AUDIENCE_TIER_BY_PROFILE: Record<StatusAudienceProfile, StatusAudienceTier> = {
  patient: "patient",
  workspace: "professional",
  hub: "professional",
  operations: "professional",
  governance: "professional",
  pharmacy: "professional",
};

const MACROSTATE_LABELS: Record<StatusMacroState, string> = {
  received: "Received",
  in_review: "In review",
  reviewing_next_steps: "Reviewing next steps",
  awaiting_external: "Awaiting external confirmation",
  action_required: "Action required",
  settled: "Settled",
  blocked: "Blocked",
  recovery_required: "Recovery required",
};

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

function audienceCopy(
  audience: StatusAudienceProfile,
  patientCopy: string,
  professionalCopy: string,
): string {
  return AUDIENCE_TIER_BY_PROFILE[audience] === "patient" ? patientCopy : professionalCopy;
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString().slice(0, 16).replace("T", " ");
}

function actionabilityLabel(actionabilityState: ProjectionActionabilityState): string {
  switch (actionabilityState) {
    case "live":
      return "Actionable";
    case "guarded":
      return "Guarded";
    case "frozen":
      return "Frozen";
    case "recovery_only":
      return "Recovery only";
  }
}

function freshnessLabel(envelope: ProjectionFreshnessEnvelope): string {
  if (
    envelope.projectionFreshnessState === "fresh" &&
    envelope.actionabilityState === "live" &&
    envelope.transportState === "live"
  ) {
    return "Fresh verified details";
  }
  if (envelope.projectionFreshnessState === "fresh") {
    return "Fresh but guarded";
  }
  if (envelope.projectionFreshnessState === "updating") {
    return envelope.transportState === "live" ? "Guarded update" : "Update paused";
  }
  if (envelope.projectionFreshnessState === "stale_review") {
    return "Stale review";
  }
  return "Recovery only";
}

export function validateStatusTruthInput(input: StatusTruthInput): readonly StatusIssue[] {
  const issues: StatusIssue[] = [];

  if (input.authority.audienceTier !== AUDIENCE_TIER_BY_PROFILE[input.audience]) {
    issues.push({
      code: "STATUS_AUDIENCE_TIER_MISMATCH",
      severity: "error",
      message:
        "The status audience profile and the declared authority audience tier disagree.",
    });
  }

  if (
    input.authority.shellFreshnessEnvelopeRef !==
    input.freshnessEnvelope.projectionFreshnessEnvelopeId
  ) {
    issues.push({
      code: "STATUS_AUTHORITY_ENVELOPE_MISMATCH",
      severity: "error",
      message: "StatusStripAuthority must point at the current ProjectionFreshnessEnvelope.",
    });
  }

  if (
    input.freshnessEnvelope.projectionFreshnessState === "fresh" &&
    input.freshnessEnvelope.actionabilityState !== "live"
  ) {
    issues.push({
      code: "STATUS_FRESHNESS_ACTIONABILITY_CONFLICT",
      severity: "error",
      message:
        "Fresh verified details cannot be rendered while the freshness envelope keeps the shell guarded, frozen, or recovery only.",
    });
  }

  if (
    input.authoritativeOutcomeState === "settled" &&
    input.freshnessEnvelope.actionabilityState !== "live"
  ) {
    issues.push({
      code: "STATUS_SETTLEMENT_SUPPRESSION_REQUIRED",
      severity: "warning",
      message:
        "Authoritative settlement exists, but the strip must suppress calm success language until actionability returns to live.",
    });
  }

  if (
    input.localFeedbackState === "shown" &&
    input.authoritativeOutcomeState === "settled" &&
    input.processingAcceptanceState === "accepted_for_processing"
  ) {
    issues.push({
      code: "STATUS_LOCAL_AND_AUTHORITATIVE_OVERLAP",
      severity: "warning",
      message:
        "The strip should collapse overlapping local, processing, and authoritative cues into one clear status sentence.",
    });
  }

  return issues;
}

export function composeStatusSentence(input: StatusTruthInput): StatusSentence {
  const issues = validateStatusTruthInput(input);
  const envelope = input.freshnessEnvelope;
  const authority = input.authority;
  const trustBlocked = authority.projectionTrustState === "blocked";
  const recoveryRequired =
    authority.degradeMode === "recovery_required" ||
    envelope.projectionFreshnessState === "blocked_recovery" ||
    envelope.actionabilityState === "recovery_only" ||
    input.authoritativeOutcomeState === "recovery_required" ||
    input.authoritativeOutcomeState === "failed";
  const reviewRequired =
    envelope.projectionFreshnessState === "stale_review" ||
    envelope.actionabilityState === "frozen" ||
    authority.degradeMode === "refresh_required" ||
    authority.projectionTrustState === "degraded" ||
    input.authoritativeOutcomeState === "review_required";
  const pendingExternal =
    input.pendingExternalState !== "none" ||
    input.processingAcceptanceState === "awaiting_external_confirmation" ||
    input.authoritativeOutcomeState === "pending";
  const localOrProcessing =
    input.saveState === "saving" ||
    input.saveState === "saved" ||
    input.localFeedbackState !== "none" ||
    input.processingAcceptanceState === "accepted_for_processing";
  const settled =
    input.authoritativeOutcomeState === "settled" && envelope.actionabilityState === "live";

  let stateSummary = audienceCopy(
    input.audience,
    `${MACROSTATE_LABELS[authority.macroStateRef]}.`,
    `${MACROSTATE_LABELS[authority.macroStateRef]}.`,
  );
  let pendingDetail: string | null = null;
  let ribbonLabel = stateSummary;
  let ribbonDetail = input.provenanceLabel ?? `Last meaningful update ${formatTimestamp(input.lastChangedAt)}`;
  let tone: StatusTone = "neutral";
  let renderMode: StatusStripRenderMode = "integrated_status_strip";
  let liveAnnounce: "polite" | "assertive" = "polite";
  let recoveryPosture: StatusRecoveryPosture = "none";

  if (recoveryRequired || trustBlocked) {
    stateSummary = audienceCopy(
      input.audience,
      "Recovery is required before you continue.",
      "Recovery required before the shell can resume approved work.",
    );
    pendingDetail = audienceCopy(
      input.audience,
      "The last trustworthy summary stays visible while the recovery path catches up.",
      "Keep the last trustworthy summary visible while the recovery path or blocked verified details settles.",
    );
    ribbonLabel = audienceCopy(
      input.audience,
      "Recovery required",
      trustBlocked ? "Blocked verified details" : "Recovery required",
    );
    ribbonDetail = audienceCopy(
      input.audience,
      "The shell stays honest instead of implying that work is complete.",
      "The shell is limited to recovery status until freshness, trust, and settlement align again.",
    );
    tone = trustBlocked ? "critical" : "critical";
    renderMode = "promoted_banner";
    liveAnnounce = "assertive";
    recoveryPosture = trustBlocked ? "blocked" : "recovery_required";
  } else if (reviewRequired) {
    stateSummary = audienceCopy(
      input.audience,
      "This view needs review before you act.",
      "Projection review required before the current action remains safe.",
    );
    pendingDetail = audienceCopy(
      input.audience,
      "We are keeping the same shell summary visible, but the verified details needs review first.",
      "Keep the same shell verified details visible while stale or degraded projection state is reviewed.",
    );
    ribbonLabel = audienceCopy(
      input.audience,
      "Review required",
      "Stale review",
    );
    ribbonDetail = audienceCopy(
      input.audience,
      "Recent transport activity does not clear the need for review.",
      "Transport health alone cannot restore writable status or quiet success language.",
    );
    tone = "caution";
    liveAnnounce = "assertive";
    recoveryPosture = envelope.actionabilityState === "frozen" ? "review_required" : "guarded";
  } else if (pendingExternal) {
    stateSummary = audienceCopy(
      input.audience,
      "We are waiting for confirmation from another service.",
      "Awaiting external confirmation before the shell can settle.",
    );
    pendingDetail = audienceCopy(
      input.audience,
      "The shell can stay calm, but it cannot overclaim that the outcome is final yet.",
      "Keep the shell quiet pending, but do not allow local acknowledgement to outrun authoritative settlement.",
    );
    ribbonLabel = audienceCopy(
      input.audience,
      "Pending confirmation",
      "Awaiting authoritative confirmation",
    );
    ribbonDetail = audienceCopy(
      input.audience,
      "The latest safe summary remains visible while confirmation is pending.",
      "The shared strip stays quiet pending while external work is still outstanding.",
    );
    tone = "neutral";
  } else if (localOrProcessing) {
    stateSummary =
      input.processingAcceptanceState === "accepted_for_processing"
        ? audienceCopy(
            input.audience,
            "Your change was accepted for processing.",
            "Accepted for processing while authoritative settlement remains pending.",
          )
        : input.saveState === "saving"
          ? audienceCopy(
              input.audience,
              "We are updating the latest safe summary.",
              "Projection refresh in progress while shell verified details stays calm.",
            )
          : audienceCopy(
              input.audience,
              "Your change was captured locally.",
              "Local acknowledgement shown; authoritative settlement still governs the final outcome.",
            );
    pendingDetail = audienceCopy(
      input.audience,
      "Captured here does not mean confirmed everywhere yet.",
      "Local or processing cues stay subordinate to settlement and freshness authority.",
    );
    ribbonLabel =
      input.saveState === "saving"
        ? audienceCopy(input.audience, "Updating", "Guarded update")
        : audienceCopy(input.audience, "Local acknowledgement", "Local acknowledgement");
    ribbonDetail = audienceCopy(
      input.audience,
      "The shell remains in one verified details strip instead of adding a second save banner.",
      "The strip suppresses duplicate save, sync, and processing banners.",
    );
    tone = "neutral";
  } else if (settled) {
    stateSummary = audienceCopy(
      input.audience,
      "Confirmed and safe to view.",
      "Authoritative settlement recorded and aligned to the current projection.",
    );
    pendingDetail = audienceCopy(
      input.audience,
      "The latest shell summary matches the settled outcome.",
      "Fresh projection verified details, current settlement, and shell interpretation are aligned.",
    );
    ribbonLabel = audienceCopy(input.audience, "Confirmed", "Authoritative settlement");
    ribbonDetail = audienceCopy(
      input.audience,
      "This is settled, not just locally saved.",
      "Quiet completion copy is legal because settlement and freshness align.",
    );
    tone = "neutral";
  }

  return {
    stateSummary,
    pendingDetail,
    ribbonLabel,
    ribbonDetail,
    freshnessLabel: freshnessLabel(envelope),
    actionabilityLabel: actionabilityLabel(envelope.actionabilityState),
    tone,
    renderMode,
    liveAnnounce,
    recoveryPosture,
    issues,
  };
}

export const StatusSentenceComposer = composeStatusSentence;

export function FreshnessActionabilityBadge({
  actionabilityState,
}: {
  actionabilityState: ProjectionActionabilityState;
}) {
  return (
    <span
      className={joinClasses(
        "status-truth-badge",
        actionabilityState === "live" && "status-truth-badge--neutral",
        actionabilityState === "guarded" && "status-truth-badge--caution",
        actionabilityState === "frozen" && "status-truth-badge--caution",
        actionabilityState === "recovery_only" && "status-truth-badge--critical",
      )}
      data-testid="freshness-actionability-badge"
      data-actionability-state={actionabilityState}
    >
      {actionabilityLabel(actionabilityState)}
    </span>
  );
}

export function FreshnessChip({
  sentence,
  envelope,
}: {
  sentence: StatusSentence;
  envelope: ProjectionFreshnessEnvelope;
}) {
  return (
    <span
      className={joinClasses(
        "status-truth-freshness-chip",
        sentence.tone === "caution" && "status-truth-freshness-chip--caution",
        sentence.tone === "critical" && "status-truth-freshness-chip--critical",
      )}
      data-testid="freshness-chip"
      data-freshness-state={envelope.projectionFreshnessState}
      data-transport-state={envelope.transportState}
      data-actionability-state={envelope.actionabilityState}
      aria-label={`${sentence.freshnessLabel}. ${sentence.actionabilityLabel}.`}
    >
      <span className="status-truth-freshness-chip__label">{sentence.freshnessLabel}</span>
      <FreshnessActionabilityBadge actionabilityState={envelope.actionabilityState} />
    </span>
  );
}

export function AmbientStateRibbon({
  sentence,
}: {
  sentence: StatusSentence;
}) {
  return (
    <span
      className={joinClasses(
        "status-truth-ribbon",
        sentence.tone === "caution" && "status-truth-ribbon--caution",
        sentence.tone === "critical" && "status-truth-ribbon--critical",
      )}
      data-testid="ambient-state-ribbon"
      data-render-mode={sentence.renderMode}
      data-recovery-posture={sentence.recoveryPosture}
    >
      <strong>{sentence.ribbonLabel}</strong>
      <span>{sentence.ribbonDetail}</span>
    </span>
  );
}

export function SharedStatusStrip({
  input,
}: {
  input: StatusTruthInput;
}) {
  const sentence = composeStatusSentence(input);
  return (
    <section
      className={joinClasses(
        "status-truth-strip",
        sentence.renderMode === "promoted_banner" && "status-truth-strip--promoted",
        sentence.tone === "caution" && "status-truth-strip--caution",
        sentence.tone === "critical" && "status-truth-strip--critical",
      )}
      data-testid="shared-status-strip"
      data-render-mode={sentence.renderMode}
      data-state-summary={sentence.stateSummary}
      data-freshness-state={input.freshnessEnvelope.projectionFreshnessState}
      data-dominant-action={input.dominantActionLabel}
      data-recovery-posture={sentence.recoveryPosture}
      data-issue-count={sentence.issues.length}
      aria-label="Shared status strip"
      role={sentence.renderMode === "promoted_banner" ? "alert" : "status"}
    >
      <div className="status-truth-strip__left">
        <AmbientStateRibbon sentence={sentence} />
      </div>
      <div
        className="status-truth-strip__center"
        aria-live={sentence.liveAnnounce}
        data-testid="status-summary"
      >
        <strong>{sentence.stateSummary}</strong>
        {sentence.pendingDetail ? <span>{sentence.pendingDetail}</span> : null}
      </div>
      <div className="status-truth-strip__right">
        <FreshnessChip sentence={sentence} envelope={input.freshnessEnvelope} />
        <span className="status-truth-strip__timestamp" data-testid="status-last-changed">
          {formatTimestamp(input.lastChangedAt)}
        </span>
      </div>
    </section>
  );
}

export function CasePulseMetaRow({
  items,
}: {
  items: readonly { label: string; value: string }[];
}) {
  return (
    <div className="status-truth-case-pulse__meta" data-testid="case-pulse-meta-row">
      {items.map((item) => (
        <span key={`${item.label}-${item.value}`} className="status-truth-meta-chip">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}

export function CasePulse({
  pulse,
}: {
  pulse: CasePulseContract;
}) {
  const metaItems = [
    { label: "Macrostate", value: MACROSTATE_LABELS[pulse.macroState] },
    { label: "Next action", value: pulse.primaryNextActionLabel },
    { label: "Last trustworthy update", value: formatTimestamp(pulse.lastMeaningfulUpdateAt) },
  ] as const;

  return (
    <section
      className={joinClasses(
        "status-truth-case-pulse",
        pulse.audience === "patient" && "status-truth-case-pulse--patient",
        pulse.audience !== "patient" && "status-truth-case-pulse--professional",
      )}
      data-testid="case-pulse"
      data-audience-profile={pulse.audience}
      data-macro-state={pulse.macroState}
      data-entity-type={pulse.entityType}
    >
      <div className="status-truth-case-pulse__header">
        <span className="status-truth-kicker">{pulse.entityType}</span>
        <h2>{pulse.headline}</h2>
        <p>{pulse.subheadline}</p>
      </div>
      <CasePulseMetaRow items={metaItems} />
      <div className="status-truth-case-pulse__summary">
        <span className="status-truth-case-pulse__macro">{MACROSTATE_LABELS[pulse.macroState]}</span>
        <span className="status-truth-case-pulse__actor">{pulse.ownershipOrActorSummary}</span>
        <span className="status-truth-case-pulse__urgency">{pulse.urgencyBand}</span>
      </div>
      <div className="status-truth-case-pulse__axes" data-testid="case-pulse-axes">
        {pulse.stateAxes.map((axis) => (
          <article
            key={axis.key}
            className="status-truth-axis"
            data-axis-key={axis.key}
          >
            <span className="status-truth-kicker">{axis.label}</span>
            <strong>{axis.value}</strong>
            <p>{axis.detail}</p>
          </article>
        ))}
      </div>
      <div className="status-truth-case-pulse__footer">
        <span>{pulse.confirmationPosture}</span>
        <span>{pulse.changedSinceSeen}</span>
      </div>
    </section>
  );
}

export function StatusStripAuthorityInspector({
  specimen,
}: {
  specimen: StatusTruthSpecimen;
}) {
  const sentence = composeStatusSentence(specimen.statusInput);
  return (
    <aside
      className="status-truth-inspector"
      data-testid={`authority-inspector-${specimen.id}`}
      aria-label={`${specimen.title} inspector`}
    >
      <h3>Status authority inspector</h3>
      <dl>
        <div>
          <dt>Authority</dt>
          <dd>{specimen.authority.authorityId}</dd>
        </div>
        <div>
          <dt>Bundle</dt>
          <dd>{specimen.authority.bundleVersion}</dd>
        </div>
        <div>
          <dt>Macrostate</dt>
          <dd>{MACROSTATE_LABELS[specimen.authority.macroStateRef]}</dd>
        </div>
        <div>
          <dt>Freshness</dt>
          <dd>{sentence.freshnessLabel}</dd>
        </div>
        <div>
          <dt>Actionability</dt>
          <dd>{sentence.actionabilityLabel}</dd>
        </div>
        <div>
          <dt>Render mode</dt>
          <dd>{sentence.renderMode}</dd>
        </div>
      </dl>
      <ul data-testid="authority-inspector-issues">
        {sentence.issues.length > 0 ? (
          sentence.issues.map((issue) => (
            <li key={issue.code}>
              <strong>{issue.code}</strong>
              <span>{issue.message}</span>
            </li>
          ))
        ) : (
          <li>No contradictions detected.</li>
        )}
      </ul>
    </aside>
  );
}

function StatusTruthSpecimenCard({
  specimen,
}: {
  specimen: StatusTruthSpecimen;
}) {
  return (
    <article
      className="status-truth-specimen"
      data-testid={`status-truth-specimen-${specimen.id}`}
      data-audience-profile={specimen.audience}
      data-continuity-key={specimen.freshnessEnvelope.continuityKey}
    >
      <header className="status-truth-specimen__header">
        <span className="status-truth-kicker">{specimen.title}</span>
        <strong>{specimen.statusInput.dominantActionLabel}</strong>
      </header>
      <SharedStatusStrip input={specimen.statusInput} />
      <CasePulse pulse={specimen.pulse} />
      <StatusStripAuthorityInspector specimen={specimen} />
    </article>
  );
}

function createSpecimen(config: {
  id: string;
  audience: StatusAudienceProfile;
  title: string;
  macroState: StatusMacroState;
  trust: ProjectionTrustState;
  degradeMode: StatusStripDegradeMode;
  freshnessState: ProjectionFreshnessState;
  transportState: ProjectionTransportState;
  actionabilityState: ProjectionActionabilityState;
  localFeedbackState: LocalFeedbackState;
  processingAcceptanceState: ProcessingAcceptanceState;
  pendingExternalState: PendingExternalState;
  authoritativeOutcomeState: AuthoritativeOutcomeState;
  saveState: SaveState;
  dominantActionLabel: string;
  headline: string;
  subheadline: string;
  ownershipSummary: string;
  urgencyBand: string;
  confirmationPosture: string;
  changedSinceSeen: string;
  stateAxes: readonly CasePulseAxis[];
}): StatusTruthSpecimen {
  const envelopeId = `pfe::${config.id}`;
  const authority: StatusStripAuthority = {
    authorityId: `status-authority::${config.id}`,
    macroStateRef: config.macroState,
    bundleVersion: "bundle.signal-atlas-live.v1",
    audienceTier: AUDIENCE_TIER_BY_PROFILE[config.audience],
    shellFreshnessEnvelopeRef: envelopeId,
    projectionTrustState: config.trust,
    ownedSignalClasses: [
      "save",
      "sync",
      "freshness",
      "pending_external",
      "recovery",
    ],
    localSignalSuppressionRef: "local_signal_suppression::shared_strip",
    degradeMode: config.degradeMode,
  };
  const freshnessEnvelope: ProjectionFreshnessEnvelope = {
    projectionFreshnessEnvelopeId: envelopeId,
    continuityKey: `continuity::${config.audience}`,
    entityScope: config.headline.toLowerCase().replace(/\s+/g, "-"),
    surfaceRef: `surface::${config.id}`,
    selectedAnchorRef: `anchor::${config.id}`,
    consistencyClass: "command_following",
    scope: "shell",
    projectionFreshnessState: config.freshnessState,
    transportState: config.transportState,
    actionabilityState: config.actionabilityState,
    lastProjectionVersionRef: `projection::${config.id}@v4`,
    lastCausalTokenApplied: `causal::${config.id}@v4`,
    lastKnownGoodSnapshotRef: `snapshot::${config.id}@v3`,
    lastKnownGoodAt: "2026-04-13T16:20:00Z",
    staleAfterAt: "2026-04-13T16:32:00Z",
    reasonRefs: [`reason::${config.id}`],
    localizedDegradationRefs:
      config.actionabilityState === "live" ? [] : [`degrade::${config.id}`],
    derivedFromRefs: [
      "blueprint/platform-frontend-blueprint.md#1.1F StatusStripAuthority",
      "blueprint/platform-frontend-blueprint.md#1.7A ProjectionFreshnessEnvelope",
    ],
    evaluatedAt: "2026-04-13T16:21:00Z",
  };
  const statusInput: StatusTruthInput = {
    audience: config.audience,
    authority,
    freshnessEnvelope,
    localFeedbackState: config.localFeedbackState,
    processingAcceptanceState: config.processingAcceptanceState,
    pendingExternalState: config.pendingExternalState,
    authoritativeOutcomeState: config.authoritativeOutcomeState,
    saveState: config.saveState,
    dominantActionLabel: config.dominantActionLabel,
    lastChangedAt: "2026-04-13T16:21:00Z",
    provenanceLabel: "Approved by one shared shell record.",
  };
  const pulse: CasePulseContract = {
    entityRef: `entity::${config.id}`,
    entityType:
      config.audience === "patient"
        ? "Patient request"
        : config.audience === "workspace"
          ? "Workspace task"
          : config.audience === "hub"
            ? "Hub case"
            : config.audience === "operations"
              ? "Operations slice"
              : config.audience === "governance"
                ? "Governance review"
                : "Pharmacy case",
    audience: config.audience,
    macroState: config.macroState,
    headline: config.headline,
    subheadline: config.subheadline,
    primaryNextActionLabel: config.dominantActionLabel,
    ownershipOrActorSummary: config.ownershipSummary,
    urgencyBand: config.urgencyBand,
    confirmationPosture: config.confirmationPosture,
    lastMeaningfulUpdateAt: "2026-04-13T16:19:00Z",
    changedSinceSeen: config.changedSinceSeen,
    stateAxes: config.stateAxes,
  };

  return {
    id: config.id,
    audience: config.audience,
    title: config.title,
    authority,
    freshnessEnvelope,
    statusInput,
    pulse,
  };
}

export const statusTruthSpecimens = [
  createSpecimen({
    id: "patient_home_pending_confirmation",
    audience: "patient",
    title: "Patient home specimen",
    macroState: "reviewing_next_steps",
    trust: "trusted",
    degradeMode: "quiet_pending",
    freshnessState: "fresh",
    transportState: "live",
    actionabilityState: "live",
    localFeedbackState: "none",
    processingAcceptanceState: "awaiting_external_confirmation",
    pendingExternalState: "awaiting_confirmation",
    authoritativeOutcomeState: "pending",
    saveState: "idle",
    dominantActionLabel: "Review appointment options",
    headline: "Booking support request",
    subheadline: "One calm shell keeps the request, its trust cue, and the next action visible.",
    ownershipSummary: "Patient-safe summary, same care reference",
    urgencyBand: "Routine follow-up",
    confirmationPosture: "Pending confirmation",
    changedSinceSeen: "Updated since last seen: slot guidance refined",
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: "Reviewing next steps",
        detail: "The request is still active inside the same shell.",
      },
      {
        key: "ownership",
        label: "Ownership",
        value: "Patient-owned",
        detail: "The summary stays attached to the patient's current request.",
      },
      {
        key: "trust",
        label: "Trust",
        value: "Trusted",
        detail: "Fresh projection verified details still supports the current explanation.",
      },
      {
        key: "urgency",
        label: "Urgency",
        value: "Routine",
        detail: "No urgent blocker is currently winning the shell.",
      },
      {
        key: "interaction",
        label: "Interaction",
        value: "One action",
        detail: "The shell keeps one next step instead of a badge storm.",
      },
    ],
  }),
  createSpecimen({
    id: "workspace_stale_review",
    audience: "workspace",
    title: "Workspace specimen",
    macroState: "in_review",
    trust: "degraded",
    degradeMode: "refresh_required",
    freshnessState: "stale_review",
    transportState: "live",
    actionabilityState: "frozen",
    localFeedbackState: "shown",
    processingAcceptanceState: "accepted_for_processing",
    pendingExternalState: "none",
    authoritativeOutcomeState: "review_required",
    saveState: "saved",
    dominantActionLabel: "Recheck decisive delta",
    headline: "Task 014 / referral review",
    subheadline: "Queue continuity stays pinned while the shell verified details shifts to review-required.",
    ownershipSummary: "Assigned to clinical workspace",
    urgencyBand: "Guarded review",
    confirmationPosture: "Review required",
    changedSinceSeen: "Changed since seen: policy note and patient reply landed",
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: "In review",
        detail: "The task remains open inside the same shell.",
      },
      {
        key: "ownership",
        label: "Ownership",
        value: "Queue row pinned",
        detail: "The selected task stays visible while the shell pauses commit.",
      },
      {
        key: "trust",
        label: "Trust",
        value: "Degraded",
        detail: "Fresh transport activity does not clear stale source status.",
      },
      {
        key: "urgency",
        label: "Urgency",
        value: "Review first",
        detail: "The dominant action is review, not commit.",
      },
      {
        key: "interaction",
        label: "Interaction",
        value: "Frozen",
        detail: "Commit status stays visibly frozen until recheck is complete.",
      },
    ],
  }),
  createSpecimen({
    id: "hub_queue_guarded",
    audience: "hub",
    title: "Hub queue specimen",
    macroState: "awaiting_external",
    trust: "partial",
    degradeMode: "quiet_pending",
    freshnessState: "updating",
    transportState: "reconnecting",
    actionabilityState: "guarded",
    localFeedbackState: "queued",
    processingAcceptanceState: "accepted_for_processing",
    pendingExternalState: "awaiting_ack",
    authoritativeOutcomeState: "pending",
    saveState: "saving",
    dominantActionLabel: "Hold the selected offer",
    headline: "Cross-site coordination case",
    subheadline: "Ranked options stay pinned while external confirmation catches up.",
    ownershipSummary: "Hub coordinator owns the active option set",
    urgencyBand: "Window at risk",
    confirmationPosture: "Guarded pending confirmation",
    changedSinceSeen: "Changed since seen: one provider acknowledgement queued",
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: "Awaiting external",
        detail: "The same hub shell stays active while provider confirmation is pending.",
      },
      {
        key: "ownership",
        label: "Ownership",
        value: "Hub owned",
        detail: "Selected candidate and origin practice stay attached to the same case.",
      },
      {
        key: "trust",
        label: "Trust",
        value: "Partial",
        detail: "The latest visible set is still safe, but not fully settled.",
      },
      {
        key: "urgency",
        label: "Urgency",
        value: "At risk",
        detail: "The current time window is shrinking, but the shell stays truthful.",
      },
      {
        key: "interaction",
        label: "Interaction",
        value: "Guarded",
        detail: "The dominant action remains visible while confirmation is still pending.",
      },
    ],
  }),
  createSpecimen({
    id: "operations_blocked_truth",
    audience: "operations",
    title: "Operations specimen",
    macroState: "blocked",
    trust: "blocked",
    degradeMode: "recovery_required",
    freshnessState: "blocked_recovery",
    transportState: "paused",
    actionabilityState: "recovery_only",
    localFeedbackState: "superseded",
    processingAcceptanceState: "timed_out",
    pendingExternalState: "none",
    authoritativeOutcomeState: "failed",
    saveState: "failed",
    dominantActionLabel: "Open approved recovery path",
    headline: "Delayed queue anomaly",
    subheadline: "The shell promotes one blocker without pretending that transport health restored the source record.",
    ownershipSummary: "Operations intervention lane",
    urgencyBand: "Critical anomaly",
    confirmationPosture: "Recovery only",
    changedSinceSeen: "Changed since seen: transport paused and parity drift widened",
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: "Blocked",
        detail: "The current board slice is still visible, but ordinary calmness is gone.",
      },
      {
        key: "ownership",
        label: "Ownership",
        value: "Ops controlled",
        detail: "The investigation remains attached to the same anomaly slice.",
      },
      {
        key: "trust",
        label: "Trust",
        value: "Blocked",
        detail: "The shell cannot treat the current view as trustworthy enough for ordinary action.",
      },
      {
        key: "urgency",
        label: "Urgency",
        value: "Critical",
        detail: "One promoted recovery cue wins instead of multiple competing alerts.",
      },
      {
        key: "interaction",
        label: "Interaction",
        value: "Recovery only",
        detail: "Only the approved recovery path remains actionable.",
      },
    ],
  }),
  createSpecimen({
    id: "governance_settled_read_only",
    audience: "governance",
    title: "Governance specimen",
    macroState: "settled",
    trust: "partial",
    degradeMode: "refresh_required",
    freshnessState: "stale_review",
    transportState: "live",
    actionabilityState: "frozen",
    localFeedbackState: "none",
    processingAcceptanceState: "none",
    pendingExternalState: "none",
    authoritativeOutcomeState: "settled",
    saveState: "idle",
    dominantActionLabel: "Request evidence completion",
    headline: "Access policy delta",
    subheadline: "Governance review keeps settled evidence visible without implying writable approval status.",
    ownershipSummary: "Governance scope diff",
    urgencyBand: "Review gate held",
    confirmationPosture: "Read-only until parity recheck",
    changedSinceSeen: "Changed since seen: evidence tuple drifted after settlement",
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: "Settled",
        detail: "A settled outcome exists, but it is still subordinate to current shell status.",
      },
      {
        key: "ownership",
        label: "Ownership",
        value: "Governance-held",
        detail: "The selected scope and diff remain attached to the same review object.",
      },
      {
        key: "trust",
        label: "Trust",
        value: "Partial",
        detail: "Settlement alone cannot restore writable status after evidence drift.",
      },
      {
        key: "urgency",
        label: "Urgency",
        value: "Review gate",
        detail: "The dominant action is evidence completion, not approval.",
      },
      {
        key: "interaction",
        label: "Interaction",
        value: "Read-only",
        detail: "The shell keeps the settled summary visible while commit remains frozen.",
      },
    ],
  }),
  createSpecimen({
    id: "pharmacy_recovery_case",
    audience: "pharmacy",
    title: "Pharmacy specimen",
    macroState: "recovery_required",
    trust: "degraded",
    degradeMode: "recovery_required",
    freshnessState: "blocked_recovery",
    transportState: "disconnected",
    actionabilityState: "recovery_only",
    localFeedbackState: "superseded",
    processingAcceptanceState: "rejected",
    pendingExternalState: "awaiting_reply",
    authoritativeOutcomeState: "recovery_required",
    saveState: "failed",
    dominantActionLabel: "Start checkpoint recovery",
    headline: "Referral validation case",
    subheadline: "Checkpoint verified details stays visible while the console narrows to one recovery path.",
    ownershipSummary: "Pharmacy checkpoint board",
    urgencyBand: "Safety recovery",
    confirmationPosture: "Recovery path only",
    changedSinceSeen: "Changed since seen: dispatch reply failed and case re-entered recovery",
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: "Recovery required",
        detail: "The pharmacy case remains open in the same shell while recovery runs.",
      },
      {
        key: "ownership",
        label: "Ownership",
        value: "Checkpoint owned",
        detail: "The active line item and validation board stay visible.",
      },
      {
        key: "trust",
        label: "Trust",
        value: "Degraded",
        detail: "The shell cannot imply that referral verified details is current enough to release.",
      },
      {
        key: "urgency",
        label: "Urgency",
        value: "Safety critical",
        detail: "One recovery cue wins while the rest of the shell stays limited.",
      },
      {
        key: "interaction",
        label: "Interaction",
        value: "Recovery only",
        detail: "Ordinary release and closure actions remain suppressed.",
      },
    ],
  }),
] as const satisfies readonly StatusTruthSpecimen[];

function requireSpecimen(audience: StatusAudienceProfile): StatusTruthSpecimen {
  const specimen = statusTruthSpecimens.find((candidate) => candidate.audience === audience);
  if (!specimen) {
    throw new Error(`STATUS_TRUTH_SPECIMEN_MISSING:${audience}`);
  }
  return specimen;
}

export function PatientStatusTruthSpecimen() {
  return <StatusTruthSpecimenCard specimen={requireSpecimen("patient")} />;
}

export function WorkspaceStatusTruthSpecimen() {
  return <StatusTruthSpecimenCard specimen={requireSpecimen("workspace")} />;
}

export function HubStatusTruthSpecimen() {
  return <StatusTruthSpecimenCard specimen={requireSpecimen("hub")} />;
}

export function OperationsStatusTruthSpecimen() {
  return <StatusTruthSpecimenCard specimen={requireSpecimen("operations")} />;
}

export function GovernanceStatusTruthSpecimen() {
  return <StatusTruthSpecimenCard specimen={requireSpecimen("governance")} />;
}

export function PharmacyStatusTruthSpecimen() {
  return <StatusTruthSpecimenCard specimen={requireSpecimen("pharmacy")} />;
}

export function StatusTruthSpecimenGrid({
  header,
  children,
}: {
  header?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="status-truth-grid" data-testid="status-truth-grid">
      {header ? <div className="status-truth-grid__header">{header}</div> : null}
      <div className="status-truth-grid__specimens">
        <PatientStatusTruthSpecimen />
        <WorkspaceStatusTruthSpecimen />
        <HubStatusTruthSpecimen />
        <OperationsStatusTruthSpecimen />
        <GovernanceStatusTruthSpecimen />
        <PharmacyStatusTruthSpecimen />
      </div>
      {children}
    </section>
  );
}
