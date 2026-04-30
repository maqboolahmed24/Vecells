import { useId, useRef, type ReactNode } from "react";
import {
  PharmacyAccessibleStatusBadge,
  PharmacyDialogAndDrawerSemantics,
} from "./pharmacy-accessibility-micro-interactions";

export const PHARMACY_MISSION_STACK_RECOVERY_VISUAL_MODE =
  "Pharmacy_Mission_Stack_Recovery";

export type PharmacyMissionStackTone = "ready" | "watch" | "review" | "blocked";

export interface PharmacyMissionStackControllerModel {
  title: string;
  summary: string;
  caseLabel: string;
  routeLabel: string;
  checkpointLabel: string;
  lineItemLabel: string;
  queueCountLabel: string;
  supportRegionLabel: string;
  selectedAnchorLabel: string;
  queueActionLabel: string;
  supportActionLabel: string;
}

export interface PharmacyQueuePeekDrawerModel {
  title: string;
  summary: string;
  queueCountLabel: string;
  selectedCaseLabel: string;
  selectedLaneLabel: string;
  closeActionLabel: string;
  open: boolean;
}

export interface PharmacyCaseResumeStubModel {
  patientLabel: string;
  summary: string;
  routeLabel: string;
  checkpointLabel: string;
  lineItemLabel: string;
  supportRegionLabel: string;
  recoveryLabel: string;
}

export interface PharmacyRecoveryStripModel {
  tone: PharmacyMissionStackTone;
  title: string;
  summary: string;
  postureLabel: string;
  recoveryOwnerLabel: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
}

export interface PharmacyContinuityFrozenOverlayModel {
  tone: PharmacyMissionStackTone;
  title: string;
  summary: string;
  postureLabel: string;
  actionLabel?: string;
}

export interface PharmacySupportRegionResumeCardModel {
  title: string;
  summary: string;
  supportRegionLabel: string;
  statusLabel: string;
  actionLabel: string;
  expanded: boolean;
}

export interface PharmacyWatchWindowReentryBannerModel {
  tone: PharmacyMissionStackTone;
  title: string;
  summary: string;
  windowLabel: string;
  ownerLabel: string;
  actionLabel: string;
}

function joinClasses(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function PharmacyMissionStackController(props: {
  controller: PharmacyMissionStackControllerModel;
  onToggleQueue?: () => void;
  onOpenSupport?: () => void;
}) {
  const { controller } = props;
  return (
    <section
      className="pharmacy-mission-stack-controller"
      data-testid="PharmacyMissionStackController"
      data-visual-mode={PHARMACY_MISSION_STACK_RECOVERY_VISUAL_MODE}
    >
      <div className="pharmacy-mission-stack-controller__copy">
        <p className="pharmacy-mission-stack-kicker">Mission stack</p>
        <h2>{controller.title}</h2>
        <p>{controller.summary}</p>
      </div>
      <dl className="pharmacy-mission-stack-controller__facts">
        <div>
          <dt>Case</dt>
          <dd>{controller.caseLabel}</dd>
        </div>
        <div>
          <dt>Route</dt>
          <dd>{controller.routeLabel}</dd>
        </div>
        <div>
          <dt>Checkpoint</dt>
          <dd>{controller.checkpointLabel}</dd>
        </div>
        <div>
          <dt>Line</dt>
          <dd>{controller.lineItemLabel}</dd>
        </div>
        <div>
          <dt>Selected anchor</dt>
          <dd>{controller.selectedAnchorLabel}</dd>
        </div>
        <div>
          <dt>Promoted support</dt>
          <dd>{controller.supportRegionLabel}</dd>
        </div>
      </dl>
      <div className="pharmacy-mission-stack-controller__actions">
        <button
          type="button"
          className="pharmacy-mission-stack-button"
          data-testid="pharmacy-mission-stack-queue-toggle"
          onClick={props.onToggleQueue}
        >
          <span>{controller.queueActionLabel}</span>
          <strong>{controller.queueCountLabel}</strong>
        </button>
        <button
          type="button"
          className="pharmacy-mission-stack-button pharmacy-mission-stack-button--secondary"
          data-testid="pharmacy-mission-stack-support-toggle"
          onClick={props.onOpenSupport}
        >
          <span>{controller.supportActionLabel}</span>
          <strong>{controller.supportRegionLabel}</strong>
        </button>
      </div>
    </section>
  );
}

export function PharmacyQueuePeekDrawer(props: {
  drawer: PharmacyQueuePeekDrawerModel;
  children?: ReactNode;
  onClose?: () => void;
}) {
  const { drawer } = props;
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  return (
    <PharmacyDialogAndDrawerSemantics
      open={drawer.open}
      kind="drawer"
      title={drawer.title}
      closeLabel={drawer.closeActionLabel}
      onClose={() => props.onClose?.()}
      panelRef={panelRef}
      initialFocusRef={titleRef}
      panelClassName="pharmacy-queue-peek__panel"
      backdropClassName="pharmacy-queue-peek__backdrop"
      panelTestId="PharmacyQueuePeekDrawer"
      backdropTestId="pharmacy-queue-peek-backdrop"
      ariaLabelledby={titleId}
      ariaDescribedby={descriptionId}
    >
      <header className="pharmacy-queue-peek__header">
        <div>
          <p className="pharmacy-mission-stack-kicker">Queue peek</p>
          <h2 id={titleId} ref={titleRef} tabIndex={-1}>
            {drawer.title}
          </h2>
          <p id={descriptionId}>{drawer.summary}</p>
        </div>
        <button
          type="button"
          className="pharmacy-mission-stack-close"
          data-testid="pharmacy-queue-peek-close"
          onClick={props.onClose}
        >
          {drawer.closeActionLabel}
        </button>
      </header>
      <div className="pharmacy-queue-peek__facts">
        <span>{drawer.queueCountLabel}</span>
        <span>{drawer.selectedCaseLabel}</span>
        <span>{drawer.selectedLaneLabel}</span>
      </div>
      <div className="pharmacy-queue-peek__content">{props.children}</div>
    </PharmacyDialogAndDrawerSemantics>
  );
}

export function PharmacyCaseResumeStub(props: {
  stub: PharmacyCaseResumeStubModel;
}) {
  const { stub } = props;
  return (
    <section
      className="pharmacy-case-resume-stub"
      data-testid="PharmacyCaseResumeStub"
      data-visual-mode={PHARMACY_MISSION_STACK_RECOVERY_VISUAL_MODE}
    >
      <div className="pharmacy-case-resume-stub__copy">
        <p className="pharmacy-mission-stack-kicker">Resume summary</p>
        <h3>{stub.patientLabel}</h3>
        <p>{stub.summary}</p>
      </div>
      <dl className="pharmacy-case-resume-stub__facts">
        <div>
          <dt>Route</dt>
          <dd>{stub.routeLabel}</dd>
        </div>
        <div>
          <dt>Checkpoint</dt>
          <dd>{stub.checkpointLabel}</dd>
        </div>
        <div>
          <dt>Line</dt>
          <dd>{stub.lineItemLabel}</dd>
        </div>
        <div>
          <dt>Support</dt>
          <dd>{stub.supportRegionLabel}</dd>
        </div>
        <div>
          <dt>Recovery</dt>
          <dd>{stub.recoveryLabel}</dd>
        </div>
      </dl>
    </section>
  );
}

export function PharmacyRecoveryStrip(props: {
  strip: PharmacyRecoveryStripModel;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}) {
  const { strip } = props;
  return (
    <section
      className="pharmacy-recovery-strip-v2"
      data-testid="PharmacyRecoveryStrip"
      data-tone={strip.tone}
      role={strip.tone === "blocked" ? "alert" : "status"}
      aria-live={strip.tone === "blocked" ? "assertive" : "polite"}
    >
      <div className="pharmacy-recovery-strip-v2__copy">
        <p className="pharmacy-mission-stack-kicker">Recovery status</p>
        <h2>{strip.title}</h2>
        <p>{strip.summary}</p>
      </div>
      <dl className="pharmacy-recovery-strip-v2__facts">
        <div>
          <dt>Status</dt>
          <dd>{strip.postureLabel}</dd>
        </div>
        <div>
          <dt>Recovery owner</dt>
          <dd>{strip.recoveryOwnerLabel}</dd>
        </div>
      </dl>
      {strip.primaryActionLabel || strip.secondaryActionLabel ? (
        <div className="pharmacy-recovery-strip-v2__actions">
          {strip.primaryActionLabel ? (
            <button
              type="button"
              className="pharmacy-mission-stack-button"
              data-testid="pharmacy-recovery-primary-action"
              onClick={props.onPrimaryAction}
            >
              {strip.primaryActionLabel}
            </button>
          ) : null}
          {strip.secondaryActionLabel ? (
            <button
              type="button"
              className="pharmacy-mission-stack-button pharmacy-mission-stack-button--secondary"
              data-testid="pharmacy-recovery-secondary-action"
              onClick={props.onSecondaryAction}
            >
              {strip.secondaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function PharmacyContinuityFrozenOverlay(props: {
  overlay: PharmacyContinuityFrozenOverlayModel;
  onAction?: () => void;
}) {
  const { overlay } = props;
  return (
    <div
      className="pharmacy-continuity-overlay"
      data-testid="PharmacyContinuityFrozenOverlay"
      data-tone={overlay.tone}
      role="status"
      aria-live="polite"
    >
      <div className="pharmacy-continuity-overlay__card">
        <p className="pharmacy-mission-stack-kicker">Continuity fence</p>
        <h3>{overlay.title}</h3>
        <p>{overlay.summary}</p>
        <div className="pharmacy-continuity-overlay__fact">
          <span>{overlay.postureLabel}</span>
          {overlay.actionLabel ? (
            <button
              type="button"
              className="pharmacy-mission-stack-button"
              data-testid="pharmacy-continuity-overlay-action"
              onClick={props.onAction}
            >
              {overlay.actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PharmacySupportRegionResumeCard(props: {
  card: PharmacySupportRegionResumeCardModel;
  children?: ReactNode;
  onToggle?: () => void;
}) {
  const { card } = props;
  return (
    <section
      className={joinClasses(
        "pharmacy-support-resume-card",
        card.expanded && "pharmacy-support-resume-card--expanded",
      )}
      data-testid="PharmacySupportRegionResumeCard"
      data-expanded={card.expanded}
      data-support-region={card.supportRegionLabel}
    >
      <header className="pharmacy-support-resume-card__header">
        <div>
          <p className="pharmacy-mission-stack-kicker">Support region</p>
          <h3>{card.title}</h3>
          <p>{card.summary}</p>
        </div>
        <PharmacyAccessibleStatusBadge
          label={card.statusLabel}
          tone={card.expanded ? "ready" : "watch"}
          contextLabel="Support status"
          compact
          className="pharmacy-mission-stack-chip"
        />
      </header>
      <button
        type="button"
        className="pharmacy-mission-stack-button pharmacy-mission-stack-button--secondary"
        data-testid="pharmacy-support-region-toggle"
        aria-expanded={card.expanded}
        onClick={props.onToggle}
      >
        {card.actionLabel}
      </button>
      {card.expanded ? (
        <div className="pharmacy-support-resume-card__content">{props.children}</div>
      ) : null}
    </section>
  );
}

export function PharmacyWatchWindowReentryBanner(props: {
  banner: PharmacyWatchWindowReentryBannerModel;
  onAction?: () => void;
}) {
  const { banner } = props;
  return (
    <section
      className="pharmacy-watch-window-reentry"
      data-testid="PharmacyWatchWindowReentryBanner"
      data-tone={banner.tone}
      role={banner.tone === "blocked" ? "alert" : "status"}
      aria-live={banner.tone === "blocked" ? "assertive" : "polite"}
    >
      <div className="pharmacy-watch-window-reentry__copy">
        <p className="pharmacy-mission-stack-kicker">Watch window</p>
        <h3>{banner.title}</h3>
        <p>{banner.summary}</p>
      </div>
      <div className="pharmacy-watch-window-reentry__facts">
        <span>{banner.windowLabel}</span>
        <span>{banner.ownerLabel}</span>
      </div>
      <button
        type="button"
        className="pharmacy-mission-stack-button pharmacy-mission-stack-button--secondary"
        data-testid="pharmacy-watch-window-reentry-action"
        onClick={props.onAction}
      >
        {banner.actionLabel}
      </button>
    </section>
  );
}
