import React, { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  CasePulse,
  ChosenPharmacyConfirmationPage,
  ChosenPharmacyAnchorCard,
  DispatchContinuityWarningStrip,
  DispatchProofStatusStrip,
  EligibilitySupersessionNotice,
  PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE,
  PatientConsentCheckpointNotice,
  PatientAlternativeRouteNextStepPanel,
  PatientDispatchPendingState,
  PatientUnsuitableReturnState,
  PharmacyA11yAnnouncementHub,
  PharmacyAccessibleStatusBadge,
  PharmacyContactCard,
  PharmacyContactRouteRepairState,
  PharmacyFocusRouteMap,
  PharmacyNextStepPage,
  PharmacyOutcomePage,
  PharmacyReducedMotionBridge,
  PharmacyReferralReferenceCard,
  PharmacyReviewNextStepPage,
  PharmacyStatusTracker,
  PharmacyTargetSizeGuard,
  SharedStatusStrip,
  VecellLogoLockup,
  type CasePulseContract,
  type StatusTruthInput,
} from "@vecells/design-system";
import {
  resolvePharmacyDispatchPreview,
  type PharmacyDispatchPreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-dispatch-preview";
import {
  resolvePharmacyEligibilityPreview,
  type PharmacyEligibilityPreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-eligibility-preview";
import {
  resolvePharmacyChoicePreview,
  type PharmacyChoicePreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-choice-preview";
import {
  resolvePharmacyPatientStatusPreview,
  type PharmacyPatientStatusPreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-patient-status-preview";
import "./patient-pharmacy-shell.css";
import {
  PharmacyChoicePage,
  PharmacyChosenProviderReview,
  resolvePharmacyChoiceDecisionState,
  usePharmacyChoiceController,
  type PharmacyChoiceController,
} from "./patient-pharmacy-chooser";
import {
  PATIENT_PHARMACY_DEFAULT_PATH,
  PATIENT_PHARMACY_SHELL_TASK_ID,
  PATIENT_PHARMACY_SHELL_VISUAL_MODE,
  createInitialPatientPharmacyShellState,
  isPatientPharmacyShellPath,
  navigatePatientPharmacyShell,
  resolvePatientPharmacyPath,
  resolvePatientPharmacyShellSnapshot,
  type PatientPharmacyRecoveryPosture,
  type PatientPharmacyRouteKey,
  type PatientPharmacyShellSnapshot,
  type PatientPharmacyShellState,
} from "./patient-pharmacy-shell.model";

export { isPatientPharmacyShellPath };

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildPatientAnnouncementState(input: {
  snapshot: PatientPharmacyShellSnapshot;
  selectedAnchorLabel: string;
  patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
  dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
}) {
  const routeHeading = input.snapshot.currentCase.routeHeading[input.snapshot.location.routeKey];
  const politeAnnouncement = [
    titleCase(input.snapshot.location.routeKey),
    routeHeading,
    `Selected anchor ${input.selectedAnchorLabel}.`,
  ].join(". ");

  const blockedPosture = input.patientStatusPreview?.statusProjection.staleOrBlockedPosture;
  const warningSummary =
    blockedPosture && blockedPosture !== "clear"
      ? input.patientStatusPreview?.reviewNextStepPage?.summary ??
        input.dispatchPreview?.continuityWarning?.summary ??
        "Recovery is required before this route can continue."
      : null;

  return {
    politeAnnouncement,
    assertiveAnnouncement: warningSummary ?? null,
  };
}

function macroStateForRecovery(
  recoveryPosture: PatientPharmacyRecoveryPosture,
): StatusTruthInput["authority"]["macroStateRef"] {
  switch (recoveryPosture) {
    case "live":
      return "reviewing_next_steps";
    case "read_only":
      return "awaiting_external";
    case "recovery_only":
      return "recovery_required";
    case "blocked":
      return "blocked";
  }
}

function trustStateForRecovery(
  recoveryPosture: PatientPharmacyRecoveryPosture,
): StatusTruthInput["authority"]["projectionTrustState"] {
  switch (recoveryPosture) {
    case "live":
      return "trusted";
    case "read_only":
      return "partial";
    case "recovery_only":
      return "degraded";
    case "blocked":
      return "blocked";
  }
}

function freshnessStateForRecovery(
  recoveryPosture: PatientPharmacyRecoveryPosture,
): StatusTruthInput["freshnessEnvelope"]["projectionFreshnessState"] {
  switch (recoveryPosture) {
    case "live":
      return "fresh";
    case "read_only":
      return "updating";
    case "recovery_only":
      return "blocked_recovery";
    case "blocked":
      return "blocked_recovery";
  }
}

function transportStateForRecovery(
  recoveryPosture: PatientPharmacyRecoveryPosture,
): StatusTruthInput["freshnessEnvelope"]["transportState"] {
  switch (recoveryPosture) {
    case "live":
      return "live";
    case "read_only":
      return "reconnecting";
    case "recovery_only":
      return "paused";
    case "blocked":
      return "disconnected";
  }
}

function actionabilityStateForRecovery(
  recoveryPosture: PatientPharmacyRecoveryPosture,
): StatusTruthInput["freshnessEnvelope"]["actionabilityState"] {
  switch (recoveryPosture) {
    case "live":
      return "live";
    case "read_only":
      return "guarded";
    case "recovery_only":
      return "recovery_only";
    case "blocked":
      return "frozen";
  }
}

function trustStateForPreview(
  preview: PharmacyPatientStatusPreviewSnapshot | null,
  fallback: PatientPharmacyRecoveryPosture,
): StatusTruthInput["authority"]["projectionTrustState"] {
  if (preview === null) {
    return trustStateForRecovery(fallback);
  }
  switch (preview.statusProjection.staleOrBlockedPosture) {
    case "clear":
      return "trusted";
    case "stale":
      return "partial";
    case "repair_required":
      return "degraded";
    case "blocked":
    case "identity_frozen":
      return "blocked";
  }
}

function freshnessStateForPreview(
  preview: PharmacyPatientStatusPreviewSnapshot | null,
  fallback: PatientPharmacyRecoveryPosture,
): StatusTruthInput["freshnessEnvelope"]["projectionFreshnessState"] {
  if (preview === null) {
    return freshnessStateForRecovery(fallback);
  }
  switch (preview.statusProjection.staleOrBlockedPosture) {
    case "clear":
      return "fresh";
    case "stale":
      return "updating";
    case "repair_required":
    case "identity_frozen":
    case "blocked":
      return "blocked_recovery";
  }
}

function actionabilityStateForPreview(
  preview: PharmacyPatientStatusPreviewSnapshot | null,
  fallback: PatientPharmacyRecoveryPosture,
): StatusTruthInput["freshnessEnvelope"]["actionabilityState"] {
  if (preview === null) {
    return actionabilityStateForRecovery(fallback);
  }
  switch (preview.statusProjection.staleOrBlockedPosture) {
    case "clear":
      return "live";
    case "stale":
      return "guarded";
    case "repair_required":
    case "identity_frozen":
      return "recovery_only";
    case "blocked":
      return "frozen";
  }
}

function transportStateForPreview(
  preview: PharmacyPatientStatusPreviewSnapshot | null,
  fallback: PatientPharmacyRecoveryPosture,
): StatusTruthInput["freshnessEnvelope"]["transportState"] {
  if (preview === null) {
    return transportStateForRecovery(fallback);
  }
  switch (preview.surfaceState) {
    case "completed":
      return "live";
    case "dispatch_pending":
      return "reconnecting";
    case "contact_repair":
    case "review_next_steps":
      return "reconnecting";
    case "urgent_action":
      return "paused";
    case "referral_confirmed":
      return "live";
  }
}

function macroStateForPreview(
  preview: PharmacyPatientStatusPreviewSnapshot | null,
  fallback: PatientPharmacyRecoveryPosture,
): StatusTruthInput["authority"]["macroStateRef"] {
  if (preview === null) {
    return macroStateForRecovery(fallback);
  }
  switch (preview.statusProjection.currentMacroState) {
    case "choose_or_confirm":
      return "action_required";
    case "action_in_progress":
      return "awaiting_external";
    case "reviewing_next_steps":
      return "reviewing_next_steps";
    case "completed":
      return "settled";
    case "urgent_action":
      return "recovery_required";
  }
}

function statusInputForSnapshot(
  snapshot: PatientPharmacyShellSnapshot,
  preview: PharmacyPatientStatusPreviewSnapshot | null,
): StatusTruthInput {
  return {
    audience: "patient",
    authority: {
      authorityId: `patient-pharmacy-status::${snapshot.currentCase.pharmacyCaseId}`,
      macroStateRef: macroStateForPreview(preview, snapshot.currentCase.recoveryPosture),
      bundleVersion: "FCM_356_PATIENT_PHARMACY_SHELL_V1",
      audienceTier: "patient",
      shellFreshnessEnvelopeRef: `patient-pharmacy-freshness::${snapshot.currentCase.pharmacyCaseId}`,
      projectionTrustState: trustStateForPreview(preview, snapshot.currentCase.recoveryPosture),
      ownedSignalClasses: ["freshness", "trust", "dominant_action", "recovery"],
      localSignalSuppressionRef:
        snapshot.currentCase.recoveryPosture === "live"
          ? "none"
          : "quiet_success_suppressed",
      degradeMode:
        snapshot.currentCase.recoveryPosture === "live"
          ? "quiet_pending"
          : "recovery_required",
    },
    freshnessEnvelope: {
      projectionFreshnessEnvelopeId: `patient-pharmacy-freshness::${snapshot.currentCase.pharmacyCaseId}`,
      continuityKey: snapshot.currentCase.continuityKey,
      entityScope: snapshot.currentCase.pharmacyCaseId,
      surfaceRef: "rf_patient_pharmacy",
      selectedAnchorRef: snapshot.currentCase.chosenProviderLabel,
      consistencyClass: "command_following",
      scope: "shell",
      projectionFreshnessState: freshnessStateForPreview(preview, snapshot.currentCase.recoveryPosture),
      transportState: transportStateForPreview(preview, snapshot.currentCase.recoveryPosture),
      actionabilityState: actionabilityStateForPreview(preview, snapshot.currentCase.recoveryPosture),
      lastProjectionVersionRef: `patient-pharmacy-projection::${snapshot.currentCase.pharmacyCaseId}`,
      lastCausalTokenApplied: `patient-pharmacy-cause::${snapshot.currentCase.pharmacyCaseId}`,
      lastKnownGoodSnapshotRef: `patient-pharmacy-snapshot::${snapshot.currentCase.pharmacyCaseId}`,
      lastKnownGoodAt: "2026-04-24T09:30:00Z",
      staleAfterAt: "2026-04-24T10:00:00Z",
      reasonRefs: [],
      localizedDegradationRefs:
        snapshot.currentCase.recoveryPosture === "live"
          ? []
          : [`patient-pharmacy::${snapshot.currentCase.pharmacyCaseId}`],
      derivedFromRefs: [
        "PharmacyChoiceTruthProjection",
        "PharmacyDispatchTruthProjection",
        "PatientPharmacyStatusProjection",
      ],
      evaluatedAt: "2026-04-24T09:32:00Z",
    },
    localFeedbackState: "shown",
    processingAcceptanceState:
      snapshot.currentCase.recoveryPosture === "live"
        ? "accepted_for_processing"
        : "awaiting_external_confirmation",
    pendingExternalState:
      snapshot.currentCase.recoveryPosture === "live" ? "none" : "awaiting_confirmation",
    authoritativeOutcomeState:
      snapshot.currentCase.recoveryPosture === "recovery_only" ? "recovery_required" : "pending",
    saveState: "saved",
    dominantActionLabel: snapshot.currentCase.dominantActionLabel,
    lastChangedAt: "2026-04-24T09:32:00Z",
    provenanceLabel: "Phase 6 patient pharmacy shell seed",
  };
}

function casePulseForSnapshot(
  snapshot: PatientPharmacyShellSnapshot,
  preview: PharmacyPatientStatusPreviewSnapshot | null,
): CasePulseContract {
  const macroState = macroStateForPreview(preview, snapshot.currentCase.recoveryPosture);
  return {
    entityRef: snapshot.currentCase.pharmacyCaseId,
    entityType: "Pharmacy case",
    audience: "patient",
    macroState,
    headline: snapshot.currentCase.routeHeading[snapshot.location.routeKey],
    subheadline: snapshot.currentCase.shellSummary,
    primaryNextActionLabel: snapshot.currentCase.dominantActionLabel,
    ownershipOrActorSummary:
      "The chosen provider anchor and request lineage stay visible while the patient moves between pharmacy child routes.",
    urgencyBand:
      snapshot.currentCase.recoveryPosture === "recovery_only"
        ? "Recovery required"
        : snapshot.currentCase.recoveryPosture === "read_only"
          ? "Pending confirmation"
          : "On track",
    confirmationPosture: snapshot.currentCase.nextStepSummary,
    lastMeaningfulUpdateAt: "2026-04-24T09:32:00Z",
    changedSinceSeen:
      snapshot.currentCase.recoveryPosture === "live"
        ? "No shell continuity drift is active."
        : snapshot.currentCase.checkpointSummary,
    stateAxes: [
      {
        key: "lifecycle",
        label: "Lifecycle",
        value: titleCase(macroState),
        detail: "The patient shell stays distinct from appointment semantics.",
      },
      {
        key: "ownership",
        label: "Chosen pharmacy",
        value: snapshot.currentCase.chosenProviderLabel,
        detail: snapshot.currentCase.providerStateLabel,
      },
      {
        key: "trust",
        label: "Request lineage",
        value: snapshot.currentCase.requestLineageLabel,
        detail: "Lineage stays bound to the same patient shell continuity key.",
      },
      {
        key: "urgency",
        label: "Current route",
        value: titleCase(snapshot.location.routeKey),
        detail: "Choose, instructions, and status are child routes of the same pharmacy shell.",
      },
      {
        key: "interaction",
        label: "Recovery posture",
        value: titleCase(snapshot.currentCase.recoveryPosture),
        detail: snapshot.currentCase.checkpointSummary,
      },
    ],
  };
}

function PatientRequestLineageAnchor({
  snapshot,
}: {
  snapshot: PatientPharmacyShellSnapshot;
}) {
  return (
    <section
      className="patient-pharmacy-shell__anchor-card"
      data-testid="PatientRequestLineageAnchor"
      data-anchor-kind="request_lineage"
    >
      <p className="patient-pharmacy-shell__eyebrow">Request lineage</p>
      <h2>{snapshot.currentCase.requestLineageLabel}</h2>
      <p>{snapshot.currentCase.checkpointSummary}</p>
    </section>
  );
}

export function PharmacyChosenProviderAnchor({
  snapshot,
}: {
  snapshot: PatientPharmacyShellSnapshot;
}) {
  return (
    <section
      className="patient-pharmacy-shell__anchor-card"
      data-testid="PharmacyChosenProviderAnchor"
      data-anchor-kind="chosen_provider"
    >
      <p className="patient-pharmacy-shell__eyebrow">Chosen provider</p>
      <h2>{snapshot.currentCase.chosenProviderLabel}</h2>
      <p>{snapshot.currentCase.chosenProviderSummary}</p>
      <div className="patient-pharmacy-shell__chip-row">
        <span className="patient-pharmacy-shell__chip">{snapshot.currentCase.providerStateLabel}</span>
        <span className="patient-pharmacy-shell__chip">{snapshot.currentCase.continuityKey}</span>
      </div>
    </section>
  );
}

export function PharmacyRouteRecoveryFrame({
  snapshot,
}: {
  snapshot: PatientPharmacyShellSnapshot;
}) {
  if (snapshot.currentCase.recoveryPosture === "live") {
    return null;
  }
  return (
    <section
      className="patient-pharmacy-shell__recovery-frame"
      data-testid="PharmacyRouteRecoveryFrame"
      data-recovery-posture={snapshot.currentCase.recoveryPosture}
    >
      <p className="patient-pharmacy-shell__eyebrow">Recovery framing</p>
      <h2>{snapshot.currentCase.routeHeading[snapshot.location.routeKey]}</h2>
      <p>{snapshot.currentCase.routeSummary[snapshot.location.routeKey]}</p>
    </section>
  );
}

export function PharmacyCasePulseHost({
  snapshot,
  preview,
}: {
  snapshot: PatientPharmacyShellSnapshot;
  preview: PharmacyPatientStatusPreviewSnapshot | null;
}) {
  return (
    <section data-testid="PharmacyCasePulseHost">
      <CasePulse pulse={casePulseForSnapshot(snapshot, preview)} />
    </section>
  );
}

function PatientPharmacyCheckpointRail({
  snapshot,
}: {
  snapshot: PatientPharmacyShellSnapshot;
}) {
  const checkpoints = [
    {
      checkpointId: "consent",
      label: "Provider choice",
      summary: "Chosen provider and route lineage stay bound to the same shell.",
    },
    {
      checkpointId: "dispatch",
      label: "Instructions",
      summary: "Instructions stay inside the same request shell and do not become a detached page.",
    },
    {
      checkpointId: "outcome",
      label: "Status",
      summary: "Status stays explicit about pending, review, or recovery posture.",
    },
  ] as const;

  return (
    <section
      className="patient-pharmacy-shell__checkpoint-rail"
      data-testid="PharmacyCheckpointRail"
    >
      <header className="patient-pharmacy-shell__section-header">
        <div>
          <p className="patient-pharmacy-shell__eyebrow">Checkpoint rail</p>
          <h2>One request, one current checkpoint</h2>
        </div>
      </header>
      <ol className="patient-pharmacy-shell__checkpoint-list">
        {checkpoints.map((checkpoint) => (
          <li
            key={checkpoint.checkpointId}
            className="patient-pharmacy-shell__checkpoint"
            data-selected={checkpoint.checkpointId === snapshot.checkpointId}
          >
            <strong>{checkpoint.label}</strong>
            <p>{checkpoint.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function routeForDispatchSurfaceAction(
  preview: PharmacyDispatchPreviewSnapshot,
): PatientPharmacyRouteKey {
  if (preview.patientConsentNotice) {
    return preview.patientConsentNotice.actionRoute;
  }
  if (preview.patientPendingState) {
    return preview.patientPendingState.dominantActionRoute;
  }
  return preview.surfaceState === "continuity_drift" ? "choose" : "status";
}

function PatientPharmacyDispatchSurface({
  preview,
  onNavigate,
}: {
  preview: PharmacyDispatchPreviewSnapshot;
  onNavigate: (routeKey: PatientPharmacyRouteKey) => void;
}) {
  const actionRoute = routeForDispatchSurfaceAction(preview);

  return (
    <div
      className="patient-pharmacy-shell__dispatch-stack"
      data-testid="PatientPharmacyDispatchSurface"
      data-dispatch-surface-state={preview.surfaceState}
    >
      {preview.continuityWarning ? (
        <DispatchContinuityWarningStrip
          warning={preview.continuityWarning}
          onAction={() => onNavigate(actionRoute)}
        />
      ) : null}
      <DispatchProofStatusStrip status={preview.statusStrip} />
      {preview.patientConsentNotice ? (
        <PatientConsentCheckpointNotice
          notice={preview.patientConsentNotice}
          onAction={() => onNavigate(preview.patientConsentNotice!.actionRoute)}
        />
      ) : null}
      {preview.patientPendingState ? (
        <PatientDispatchPendingState
          pendingState={preview.patientPendingState}
          onAction={() => onNavigate(preview.patientPendingState!.dominantActionRoute)}
        />
      ) : null}
    </div>
  );
}

function PatientPharmacyStatusSurface({
  preview,
  routeKey,
}: {
  preview: PharmacyPatientStatusPreviewSnapshot;
  routeKey: Exclude<PatientPharmacyRouteKey, "choose">;
}) {
  if (routeKey === "instructions") {
    return (
      <div
        className="patient-pharmacy-shell__status-stack"
        data-testid="PatientPharmacyStatusSurface"
        data-surface-state={preview.surfaceState}
      >
        {preview.contactRouteRepairState ? (
          <PharmacyContactRouteRepairState state={preview.contactRouteRepairState} />
        ) : null}
        {preview.reviewNextStepPage ? (
          <PharmacyReviewNextStepPage page={preview.reviewNextStepPage} />
        ) : null}
        {preview.confirmationPage ? (
          <ChosenPharmacyConfirmationPage page={preview.confirmationPage} />
        ) : null}
        {preview.nextStepPage ? <PharmacyNextStepPage page={preview.nextStepPage} /> : null}
        {!preview.nextStepPage && preview.outcomePage ? (
          <PharmacyOutcomePage page={preview.outcomePage} />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="patient-pharmacy-shell__status-stack"
      data-testid="PatientPharmacyStatusSurface"
      data-surface-state={preview.surfaceState}
    >
      <PharmacyStatusTracker tracker={preview.statusTracker} />
      {preview.outcomePage ? <PharmacyOutcomePage page={preview.outcomePage} /> : null}
      {!preview.outcomePage && preview.contactRouteRepairState ? (
        <PharmacyContactRouteRepairState state={preview.contactRouteRepairState} />
      ) : null}
      {!preview.outcomePage && !preview.contactRouteRepairState && preview.reviewNextStepPage ? (
        <PharmacyReviewNextStepPage page={preview.reviewNextStepPage} />
      ) : null}
      {!preview.outcomePage &&
      !preview.contactRouteRepairState &&
      !preview.reviewNextStepPage &&
      preview.nextStepPage ? (
        <PharmacyNextStepPage page={preview.nextStepPage} />
      ) : null}
    </div>
  );
}

export function PharmacyPatientSupportRegionHost({
  snapshot,
  preview,
  dispatchPreview,
  patientStatusPreview,
  onNavigate,
}: {
  snapshot: PatientPharmacyShellSnapshot;
  preview: PharmacyEligibilityPreviewSnapshot | null;
  dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
  onNavigate: (routeKey: PatientPharmacyRouteKey) => void;
}) {
  const unsuitablePreview =
    snapshot.location.routeKey === "choose" && preview?.finalDisposition === "ineligible_returned"
      ? preview
      : null;
  const patientStatusSupport =
    snapshot.location.routeKey !== "choose" ? patientStatusPreview : null;

  return (
    <section
      className="patient-pharmacy-shell__support-card"
      data-testid="PharmacySupportRegionHost"
      data-support-region={
        unsuitablePreview ? "patient_next_step_panel" : snapshot.promotedSupportRegion
      }
    >
      <header className="patient-pharmacy-shell__section-header">
        <div>
          <p className="patient-pharmacy-shell__eyebrow">Promoted support region</p>
          <h2>
            {unsuitablePreview
              ? unsuitablePreview.nextStepPanel.title
              : snapshot.currentCase.routeHeading[snapshot.location.routeKey]}
          </h2>
        </div>
        <span className="patient-pharmacy-shell__chip">
          {titleCase(
            unsuitablePreview ? "patient_next_step_panel" : snapshot.promotedSupportRegion,
          )}
        </span>
      </header>
      {unsuitablePreview ? (
        <div
          className="patient-pharmacy-shell__eligibility-stack"
          data-testid="patient-pharmacy-return-next-step-host"
        >
          {unsuitablePreview.supersessionNotice ? (
            <EligibilitySupersessionNotice notice={unsuitablePreview.supersessionNotice} />
          ) : null}
          <PatientAlternativeRouteNextStepPanel
            preview={unsuitablePreview}
            onPrimaryAction={() => onNavigate("instructions")}
            primaryDisabled={snapshot.location.routeKey === "instructions"}
          />
        </div>
      ) : patientStatusSupport ? (
        <div
          className="patient-pharmacy-shell__support-grid"
          data-testid="patient-pharmacy-status-support-host"
        >
          {patientStatusSupport.contactCard ? (
            <PharmacyContactCard card={patientStatusSupport.contactCard} />
          ) : null}
          {patientStatusSupport.referralReferenceCard ? (
            <PharmacyReferralReferenceCard card={patientStatusSupport.referralReferenceCard} />
          ) : null}
          {!patientStatusSupport.contactCard && !patientStatusSupport.referralReferenceCard ? (
            <article className="patient-pharmacy-shell__support-note">
              <strong>Current shell support</strong>
              <p>
                The next safe step stays in the main surface because there is no additional
                provider or reference detail to show on this route.
              </p>
            </article>
          ) : null}
        </div>
      ) : (
        <>
          <p>{snapshot.currentCase.routeSummary[snapshot.location.routeKey]}</p>
          <div className="patient-pharmacy-shell__support-grid">
            <article className="patient-pharmacy-shell__support-note">
              <strong>Shell law</strong>
              <p>Choose, instructions, and status stay in the same shell family.</p>
            </article>
            {dispatchPreview ? (
              <article className="patient-pharmacy-shell__support-note">
                <strong>Current checkpoint</strong>
                <p>{dispatchPreview.statusStrip.nextStepLabel}</p>
              </article>
            ) : null}
            <article className="patient-pharmacy-shell__support-note">
              <strong>Anchor law</strong>
              <p>The chosen provider anchor remains visible across child-route changes.</p>
            </article>
            {dispatchPreview ? (
              <article className="patient-pharmacy-shell__support-note">
                <strong>Current reassurance fence</strong>
                <p>
                  Calm referral wording stays blocked until consent, proof, and continuity all stay current for the same chosen pharmacy.
                </p>
              </article>
            ) : (
              <article className="patient-pharmacy-shell__support-note">
                <strong>Next owner</strong>
                <p>Later Phase 6 tasks can replace this host region without replacing the shell.</p>
              </article>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function PharmacyDecisionDockHost({
  snapshot,
  onNavigate,
  choicePreview,
  choiceController,
  dispatchPreview,
  patientStatusPreview,
}: {
  snapshot: PatientPharmacyShellSnapshot;
  onNavigate: (routeKey: PatientPharmacyRouteKey) => void;
  choicePreview: PharmacyChoicePreviewSnapshot | null;
  choiceController: PharmacyChoiceController;
  dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
}) {
  const nextRoute: PatientPharmacyRouteKey =
    snapshot.location.routeKey === "choose"
      ? "instructions"
      : snapshot.location.routeKey === "instructions"
        ? "status"
        : "choose";
  const choiceDecision =
    snapshot.location.routeKey === "choose"
      ? resolvePharmacyChoiceDecisionState(choicePreview, choiceController)
      : null;
  const dispatchActionRoute = dispatchPreview
    ? routeForDispatchSurfaceAction(dispatchPreview)
    : nextRoute;
  const dispatchHeadline = dispatchPreview?.patientConsentNotice
    ? dispatchPreview.patientConsentNotice.title
    : dispatchPreview?.patientPendingState?.title ?? dispatchPreview?.statusStrip.title;
  const dispatchSummary = dispatchPreview?.patientConsentNotice
    ? dispatchPreview.patientConsentNotice.summary
    : dispatchPreview?.patientPendingState?.summary ??
      dispatchPreview?.continuityWarning?.summary ??
      dispatchPreview?.statusStrip.summary;
  const dispatchButtonLabel = dispatchPreview?.patientConsentNotice
    ? dispatchPreview.patientConsentNotice.actionLabel
    : dispatchPreview?.patientPendingState?.dominantActionLabel ??
      dispatchPreview?.continuityWarning?.actionLabel ??
      `Open ${titleCase(dispatchActionRoute)}`;
  const statusActionRoute = patientStatusPreview?.primaryActionRoute ?? nextRoute;
  const statusHeadline =
    patientStatusPreview?.contactRouteRepairState?.title ??
    patientStatusPreview?.reviewNextStepPage?.title ??
    patientStatusPreview?.confirmationPage?.title ??
    patientStatusPreview?.outcomePage?.title ??
    patientStatusPreview?.nextStepPage?.title ??
    null;
  const statusSummary =
    patientStatusPreview?.contactRouteRepairState?.summary ??
    patientStatusPreview?.reviewNextStepPage?.summary ??
    patientStatusPreview?.confirmationPage?.summary ??
    patientStatusPreview?.outcomePage?.summary ??
    patientStatusPreview?.nextStepPage?.summary ??
    null;
  const statusButtonLabel =
    patientStatusPreview?.primaryActionLabel ?? `Open ${titleCase(statusActionRoute)}`;

  function handlePrimaryAction() {
    if (choiceDecision?.mode === "focus_list") {
      choiceController.focusChooserList();
      return;
    }
    if (choiceDecision?.mode === "focus_warning") {
      choiceController.focusWarningPanel();
      return;
    }
    if (patientStatusPreview && snapshot.location.routeKey !== "choose") {
      onNavigate(statusActionRoute);
      return;
    }
    onNavigate(dispatchPreview ? dispatchActionRoute : nextRoute);
  }

  return (
    <section
      className="patient-pharmacy-shell__decision-dock"
      data-testid="PharmacyDecisionDockHost"
      data-dominant-action-state={snapshot.currentCase.recoveryPosture}
      data-decision-mode={
        choiceDecision?.mode ??
        (patientStatusPreview && snapshot.location.routeKey !== "choose"
          ? "status_route_navigation"
          : dispatchPreview
            ? "dispatch_route_navigation"
            : "route_navigation")
      }
    >
      <p className="patient-pharmacy-shell__eyebrow">DecisionDock</p>
      <h2>
        {choiceDecision?.headline ??
          statusHeadline ??
          dispatchHeadline ??
          snapshot.currentCase.dominantActionLabel}
      </h2>
      <p>
        {choiceDecision?.summary ??
          statusSummary ??
          dispatchSummary ??
          snapshot.currentCase.nextStepSummary}
      </p>
      <PharmacyTargetSizeGuard minSizePx={44}>
        <button
          type="button"
          className="patient-pharmacy-shell__primary-action"
          data-testid="patient-pharmacy-primary-action"
          onClick={handlePrimaryAction}
        >
          {choiceDecision?.buttonLabel ??
            (patientStatusPreview && snapshot.location.routeKey !== "choose"
              ? statusButtonLabel
              : dispatchButtonLabel)}
        </button>
      </PharmacyTargetSizeGuard>
    </section>
  );
}

function PatientPharmacyRouteNav({
  snapshot,
  onNavigate,
  controlledRegionId,
}: {
  snapshot: PatientPharmacyShellSnapshot;
  onNavigate: (routeKey: PatientPharmacyRouteKey) => void;
  controlledRegionId: string;
}) {
  return (
    <nav
      className="patient-pharmacy-shell__route-nav"
      aria-label="Patient pharmacy routes"
      data-testid="PatientPharmacyRouteNav"
    >
      {(["choose", "instructions", "status"] as const).map((routeKey) => (
        <PharmacyTargetSizeGuard key={routeKey} minSizePx={44}>
          <button
            type="button"
            className="patient-pharmacy-shell__route-button"
            data-active={routeKey === snapshot.location.routeKey}
            data-testid={`patient-pharmacy-route-${routeKey}`}
            aria-pressed={routeKey === snapshot.location.routeKey}
            aria-controls={controlledRegionId}
            onClick={() => onNavigate(routeKey)}
          >
            {titleCase(routeKey)}
          </button>
        </PharmacyTargetSizeGuard>
      ))}
    </nav>
  );
}

function PatientPharmacyMainRegion({
  snapshot,
  preview,
  choicePreview,
  choiceController,
  dispatchPreview,
  patientStatusPreview,
  onNavigate,
}: {
  snapshot: PatientPharmacyShellSnapshot;
  preview: PharmacyEligibilityPreviewSnapshot | null;
  choicePreview: PharmacyChoicePreviewSnapshot | null;
  choiceController: PharmacyChoiceController;
  dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
  onNavigate: (routeKey: PatientPharmacyRouteKey) => void;
}) {
  const unsuitablePreview =
    snapshot.location.routeKey === "choose" && preview?.finalDisposition === "ineligible_returned"
      ? preview
      : null;
  const chooserPreview =
    snapshot.location.routeKey === "choose" && !unsuitablePreview ? choicePreview : null;
  const headingId = `patient-pharmacy-main-region-heading-${snapshot.currentCase.pharmacyCaseId}`;

  return (
    <section
      className="patient-pharmacy-shell__main-card"
      data-testid="PatientPharmacyMainRegion"
      data-route-kind={snapshot.location.routeKey}
      id={`patient-pharmacy-main-region-${snapshot.currentCase.pharmacyCaseId}`}
      aria-labelledby={headingId}
    >
      <header className="patient-pharmacy-shell__section-header">
        <div>
          <p className="patient-pharmacy-shell__eyebrow">
            {snapshot.currentCase.routeEyebrow[snapshot.location.routeKey]}
          </p>
          <h2 id={headingId}>{snapshot.currentCase.routeHeading[snapshot.location.routeKey]}</h2>
        </div>
        <PharmacyAccessibleStatusBadge
          label={titleCase(snapshot.currentCase.recoveryPosture)}
          tone={snapshot.currentCase.recoveryPosture === "live" ? "ready" : "read_only"}
          contextLabel="Recovery posture"
          compact
          className="patient-pharmacy-shell__chip"
        />
      </header>
      {chooserPreview ? (
        <PharmacyChoicePage
          preview={chooserPreview}
          controller={choiceController}
        />
      ) : unsuitablePreview ? (
        <div
          className="patient-pharmacy-shell__eligibility-stack"
          data-testid="patient-pharmacy-unsuitable-host"
        >
          <PatientUnsuitableReturnState preview={unsuitablePreview} />
          <article className="patient-pharmacy-shell__host-card">
            <strong>Checkpoint summary</strong>
            <p>{snapshot.currentCase.checkpointSummary}</p>
          </article>
        </div>
      ) : patientStatusPreview && snapshot.location.routeKey !== "choose" ? (
        <PatientPharmacyStatusSurface
          preview={patientStatusPreview}
          routeKey={snapshot.location.routeKey}
        />
      ) : dispatchPreview && snapshot.location.routeKey !== "choose" ? (
        <PatientPharmacyDispatchSurface preview={dispatchPreview} onNavigate={onNavigate} />
      ) : (
        <>
          <p>{snapshot.currentCase.routeSummary[snapshot.location.routeKey]}</p>
          <div className="patient-pharmacy-shell__host-grid">
            <article className="patient-pharmacy-shell__host-card">
              <strong>Stable host region</strong>
              <p>
                This route is structurally live now so later Phase 6 tasks can mount
                real pharmacy content without reworking the shell or continuity
                contract.
              </p>
            </article>
            <article className="patient-pharmacy-shell__host-card">
              <strong>Checkpoint summary</strong>
              <p>{snapshot.currentCase.checkpointSummary}</p>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

export function PharmacyPatientShell() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  const [state, setState] = useState<PatientPharmacyShellState>(() =>
    typeof window === "undefined"
      ? createInitialPatientPharmacyShellState()
      : createInitialPatientPharmacyShellState(window.location.pathname),
  );
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handlePopState = () => {
      startTransition(() => {
        setState((current) => navigatePatientPharmacyShell(current, window.location.pathname));
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

  const snapshot = resolvePatientPharmacyShellSnapshot(state, viewportWidth);
  const eligibilityPreview = useMemo(
    () => resolvePharmacyEligibilityPreview(snapshot.currentCase.pharmacyCaseId),
    [snapshot.currentCase.pharmacyCaseId],
  );
  const choicePreview = useMemo(
    () => resolvePharmacyChoicePreview(snapshot.currentCase.pharmacyCaseId),
    [snapshot.currentCase.pharmacyCaseId],
  );
  const dispatchPreview = useMemo(
    () => resolvePharmacyDispatchPreview(snapshot.currentCase.pharmacyCaseId),
    [snapshot.currentCase.pharmacyCaseId],
  );
  const patientStatusPreview = useMemo(
    () => resolvePharmacyPatientStatusPreview(snapshot.currentCase.pharmacyCaseId),
    [snapshot.currentCase.pharmacyCaseId],
  );
  const choiceController = usePharmacyChoiceController(choicePreview);
  const selectedProviderAnchorRef =
    choiceController.selectedProvider?.displayName ??
    patientStatusPreview?.chosenPharmacyAnchor.providerLabel ??
    dispatchPreview?.chosenPharmacy.providerLabel ??
    choicePreview?.driftRecovery?.previousSelectionLabel ??
    snapshot.currentCase.chosenProviderLabel;
  const patientAnnouncementState = buildPatientAnnouncementState({
    snapshot,
    selectedAnchorLabel: selectedProviderAnchorRef,
    patientStatusPreview,
    dispatchPreview,
  });
  const mainRegionId = `patient-pharmacy-main-region-${snapshot.currentCase.pharmacyCaseId}`;

  function navigate(routeKey: PatientPharmacyRouteKey) {
    startTransition(() => {
      const nextPath = resolvePatientPharmacyPath(
        stateRef.current.location.pharmacyCaseId,
        routeKey,
      );
      const nextState = navigatePatientPharmacyShell(stateRef.current, nextPath);
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", nextPath);
      }
      setState(nextState);
    });
  }

  return (
    <div
      className={`patient-pharmacy-shell patient-pharmacy-shell--${snapshot.layoutMode}`}
      data-testid="pharmacy-patient-shell-root"
      data-task-id={PATIENT_PHARMACY_SHELL_TASK_ID}
      data-visual-mode={PATIENT_PHARMACY_SHELL_VISUAL_MODE}
      data-current-path={snapshot.location.pathname}
      data-current-route={snapshot.location.routeKey}
      data-layout-mode={snapshot.layoutMode}
      data-breakpoint-class={snapshot.breakpointClass}
      data-route-family="rf_patient_pharmacy"
      data-selected-case-id={snapshot.currentCase.pharmacyCaseId}
      data-decision-tuple-hash={eligibilityPreview?.decisionTupleHash}
      data-eligibility-bundle-id={eligibilityPreview?.explanationBundle.bundleId}
      data-eligibility-final-disposition={eligibilityPreview?.finalDisposition}
      data-eligibility-publication-state={eligibilityPreview?.publicationState}
      data-eligibility-rule-pack-version={eligibilityPreview?.policyPack.versionLabel}
      data-choice-visible-set-hash={choicePreview?.truthProjection.visibleChoiceSetHash}
      data-choice-projection-state={choicePreview?.truthProjection.projectionState}
      data-choice-selected-provider-id={choiceController.selectedProviderId}
      data-choice-filter-bucket={choiceController.filterBucket}
      data-choice-map-visible={choiceController.mapVisible}
      data-choice-warning-acknowledged={choiceController.warningAcknowledged}
      data-choice-drift-state={choicePreview?.driftRecovery?.state ?? "stable"}
      data-dispatch-visual-mode={dispatchPreview?.visualMode ?? "none"}
      data-dispatch-surface-state={dispatchPreview?.surfaceState ?? "none"}
      data-dispatch-authoritative-proof-state={
        dispatchPreview?.truthBinding.authoritativeProofState ?? "none"
      }
      data-dispatch-proof-risk-state={dispatchPreview?.truthBinding.proofRiskState ?? "none"}
      data-consent-checkpoint-state={dispatchPreview?.consentBinding.checkpointState ?? "none"}
      data-consent-continuity-state={dispatchPreview?.consentBinding.continuityState ?? "none"}
      data-dispatch-warning-kind={dispatchPreview?.continuityWarning?.kind ?? "none"}
      data-patient-calm-allowed={
        patientStatusPreview?.statusProjection.calmCopyAllowed ?? dispatchPreview?.patientCalmAllowed ?? false
      }
      data-patient-status-visual-mode={patientStatusPreview?.visualMode ?? "none"}
      data-patient-status-surface-state={patientStatusPreview?.surfaceState ?? "none"}
      data-patient-status-macro-state={
        patientStatusPreview?.statusProjection.currentMacroState ?? "none"
      }
      data-patient-status-posture={
        patientStatusPreview?.statusProjection.staleOrBlockedPosture ?? "none"
      }
      data-patient-status-outcome-state={
        patientStatusPreview?.outcomeTruth.outcomeTruthState ?? "none"
      }
      data-patient-status-repair-state={
        patientStatusPreview?.repairProjection?.repairProjectionState ?? "none"
      }
      data-patient-status-reference-mode={
        patientStatusPreview?.referralReferenceSummary?.displayMode ?? "none"
      }
      data-patient-status-opening-state={
        patientStatusPreview?.providerSummary?.openingState ?? "none"
      }
      data-selected-anchor-ref={selectedProviderAnchorRef}
      data-request-lineage-ref={snapshot.currentCase.requestLineageLabel}
      data-chosen-provider-ref={selectedProviderAnchorRef}
      data-active-checkpoint-id={snapshot.checkpointId}
      data-promoted-support-region={snapshot.promotedSupportRegion}
      data-recovery-posture={snapshot.currentCase.recoveryPosture}
      data-dominant-action-state={snapshot.currentCase.recoveryPosture}
      data-pharmacy-a11y-visual-mode={PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE}
    >
      <PharmacyReducedMotionBridge testId="patient-pharmacy-reduced-motion-bridge">
      <header className="patient-pharmacy-shell__masthead" role="banner">
        <div className="patient-pharmacy-shell__brand">
          <VecellLogoLockup
            aria-hidden="true"
            className="patient-pharmacy-shell__logo"
            style={{ width: 152, height: "auto" }}
          />
          <div>
            <p className="patient-pharmacy-shell__eyebrow">Phase 6 patient pharmacy shell</p>
            <h1>One shell for choice, instructions, and status</h1>
            <p>{snapshot.currentCase.shellSummary}</p>
          </div>
        </div>
      </header>

      <SharedStatusStrip input={statusInputForSnapshot(snapshot, patientStatusPreview)} />
      <PharmacyA11yAnnouncementHub
        scopeLabel="Patient pharmacy shell"
        politeAnnouncement={patientAnnouncementState.politeAnnouncement}
        assertiveAnnouncement={patientAnnouncementState.assertiveAnnouncement}
        testId="PatientPharmacyAnnouncementHub"
      />
      <PharmacyFocusRouteMap
        title="Patient pharmacy continuity"
        routeFamilyLabel="rf_patient_pharmacy"
        currentRouteLabel={titleCase(snapshot.location.routeKey)}
        selectedAnchorLabel={selectedProviderAnchorRef}
        focusReturnLabel={`Patient pharmacy route ${titleCase(snapshot.location.routeKey)}`}
        supportRegionLabel={snapshot.promotedSupportRegion}
        compact
        testId="PatientPharmacyFocusRouteMap"
      />
      <PharmacyRouteRecoveryFrame snapshot={snapshot} />
      <PharmacyCasePulseHost snapshot={snapshot} preview={patientStatusPreview} />
      <PatientPharmacyRouteNav
        snapshot={snapshot}
        onNavigate={navigate}
        controlledRegionId={mainRegionId}
      />

      <section className="patient-pharmacy-shell__layout">
        <main className="patient-pharmacy-shell__main" role="main">
          <PatientPharmacyMainRegion
            snapshot={snapshot}
            preview={eligibilityPreview}
            choicePreview={choicePreview}
            choiceController={choiceController}
            dispatchPreview={dispatchPreview}
            patientStatusPreview={patientStatusPreview}
            onNavigate={navigate}
          />
          <PatientPharmacyCheckpointRail snapshot={snapshot} />
          <PharmacyPatientSupportRegionHost
            snapshot={snapshot}
            preview={eligibilityPreview}
            dispatchPreview={dispatchPreview}
            patientStatusPreview={patientStatusPreview}
            onNavigate={navigate}
          />
        </main>

        <aside className="patient-pharmacy-shell__rail" aria-label="Patient pharmacy anchors">
          <PatientRequestLineageAnchor snapshot={snapshot} />
          {snapshot.location.routeKey === "choose" && choicePreview ? (
            <PharmacyChosenProviderReview
              preview={choicePreview}
              controller={choiceController}
            />
          ) : patientStatusPreview ? (
            <ChosenPharmacyAnchorCard anchor={patientStatusPreview.chosenPharmacyAnchor} />
          ) : dispatchPreview ? (
            <ChosenPharmacyAnchorCard anchor={dispatchPreview.chosenPharmacy} />
          ) : (
            <PharmacyChosenProviderAnchor snapshot={snapshot} />
          )}
          <PharmacyDecisionDockHost
            snapshot={snapshot}
            onNavigate={navigate}
            choicePreview={choicePreview}
            choiceController={choiceController}
            dispatchPreview={dispatchPreview}
            patientStatusPreview={patientStatusPreview}
          />
        </aside>
      </section>
      </PharmacyReducedMotionBridge>
    </div>
  );
}

export default PharmacyPatientShell;
