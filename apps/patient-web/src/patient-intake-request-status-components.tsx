import type { RequestStatusSurfaceView } from "./patient-intake-request-status-surface";

const TRACK_STATUS_MARKERS = new Set<string>([
  "track-request-pulse-header",
  "track-current-state-panel",
  "track-next-steps-timeline",
  "track-eta-promise-note",
  "track-action-needed-card",
  "track-return-link",
]);

export function RequestPulseHeader({
  status,
  onRefreshStatus,
}: {
  status: RequestStatusSurfaceView;
  onRefreshStatus: () => void;
}) {
  return (
    <header
      className="patient-intake-mission-frame__track-pulse-header"
      data-testid="track-request-pulse-header"
      data-surface-posture={status.surfacePosture}
      data-macro-state={status.macroState}
    >
      <div className="patient-intake-mission-frame__track-pulse-copy">
        <span className="patient-intake-mission-frame__track-pulse-eyebrow">Request pulse</span>
        <h3
          className="patient-intake-mission-frame__track-pulse-title"
          data-testid="track-request-title"
          data-outcome-autofocus="true"
          data-status-autofocus="true"
          tabIndex={-1}
        >
          {status.title}
        </h3>
        <p>{status.summary}</p>
        <div className="patient-intake-mission-frame__track-pulse-meta">
          <strong data-testid="track-request-reference">{status.referenceCode}</strong>
          <span
            className="patient-intake-mission-frame__track-state-badge"
            data-testid="track-request-state-badge"
            data-tone={status.macroStateTone}
          >
            {status.macroStateLabel}
          </span>
          <span
            className="patient-intake-mission-frame__track-posture-chip"
            data-testid="track-surface-posture-note"
            data-tone={status.surfacePostureTone}
          >
            {status.surfacePostureLabel}
          </span>
        </div>
        <p data-testid="track-request-last-update">{status.lastMeaningfulUpdateLine}</p>
      </div>
      {status.refreshActionLabel ? (
        <button
          type="button"
          className="patient-intake-mission-frame__track-refresh-action"
          data-testid="track-refresh-action"
          onClick={onRefreshStatus}
        >
          {status.refreshActionLabel}
        </button>
      ) : null}
    </header>
  );
}

export function EtaPromiseNote({ status }: { status: RequestStatusSurfaceView }) {
  return (
    <section
      className="patient-intake-mission-frame__track-eta-note"
      data-testid="track-eta-promise-note"
      data-eta-visible={status.etaVisible ? "true" : "false"}
      data-promise-tone={status.promiseTone}
    >
      <strong>{status.etaNoteTitle}</strong>
      {status.etaVisible ? (
        <p>
          <span className="patient-intake-mission-frame__track-eta-bucket">
            {status.receiptBucketLabel}
          </span>
          <span className="patient-intake-mission-frame__track-eta-separator"> · </span>
          <span className="patient-intake-mission-frame__track-promise-chip" data-tone={status.promiseTone}>
            {status.promiseStateLabel}
          </span>
        </p>
      ) : null}
      <p>{status.etaNoteBody}</p>
    </section>
  );
}

export function CurrentStatePanel({ status }: { status: RequestStatusSurfaceView }) {
  return (
    <section
      className="patient-intake-mission-frame__track-current-state"
      data-testid="track-current-state-panel"
    >
      <div className="patient-intake-mission-frame__track-section-head">
        <div>
          <span>Current state</span>
          <h4>{status.currentStateHeading}</h4>
        </div>
      </div>
      <p>{status.currentStateBody}</p>
      <p className="patient-intake-mission-frame__track-next-step">{status.nextStepMessage}</p>
    </section>
  );
}

export function NextStepsTimeline({ status }: { status: RequestStatusSurfaceView }) {
  return (
    <section
      className="patient-intake-mission-frame__track-timeline"
      data-testid="track-next-steps-timeline"
    >
      <div className="patient-intake-mission-frame__track-section-head">
        <div>
          <span>Timeline</span>
          <h4>{status.timelineHeading}</h4>
        </div>
      </div>
      <ol className="patient-intake-mission-frame__track-timeline-list">
        {status.timeline.map((step) => (
          <li
            key={step.key}
            className="patient-intake-mission-frame__track-timeline-step"
            data-state={step.state}
          >
            <span className="patient-intake-mission-frame__track-timeline-dot" />
            <div>
              <strong>{step.label}</strong>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ActionNeededCard({
  status,
  onOpenPath,
}: {
  status: RequestStatusSurfaceView;
  onOpenPath: (targetPathname: string) => void;
}) {
  if (!status.actionNeededCard) {
    return null;
  }
  return (
    <section
      className="patient-intake-mission-frame__track-action-card"
      data-testid="track-action-needed-card"
      data-tone={status.actionNeededCard.tone}
    >
      <div className="patient-intake-mission-frame__track-section-head">
        <div>
          <span>Action needed</span>
          <h4>{status.actionNeededCard.title}</h4>
        </div>
      </div>
      <p>{status.actionNeededCard.body}</p>
      <button
        type="button"
        className="patient-intake-mission-frame__track-action-button"
        data-testid={status.actionNeededCard.dataTestId}
        data-navigation-contract-ref={status.actionNeededCard.navigationContractRef}
        data-navigation-destination-type={status.actionNeededCard.destinationType}
        data-target-pathname={status.actionNeededCard.targetPathname}
        onClick={() => onOpenPath(status.actionNeededCard?.targetPathname ?? "")}
      >
        {status.actionNeededCard.label}
      </button>
    </section>
  );
}

export function ReturnAnchorLink({
  status,
  onOpenPath,
}: {
  status: RequestStatusSurfaceView;
  onOpenPath: (targetPathname: string) => void;
}) {
  if (!status.returnLink) {
    return null;
  }
  return (
    <button
      type="button"
      className="patient-intake-mission-frame__track-return-link"
      data-testid="track-return-link"
      data-navigation-contract-ref={status.returnLink.navigationContractRef}
      data-navigation-destination-type={status.returnLink.destinationType}
      data-target-pathname={status.returnLink.targetPathname}
      data-marker-contract={
        TRACK_STATUS_MARKERS.has("track-return-link") ? "track-return-link" : undefined
      }
      onClick={() => onOpenPath(status.returnLink?.targetPathname ?? "")}
    >
      {status.returnLink.label}
    </button>
  );
}

export function RequestStatusCanvas({
  status,
  onRefreshStatus,
  onOpenPath,
}: {
  status: RequestStatusSurfaceView;
  onRefreshStatus: () => void;
  onOpenPath: (targetPathname: string) => void;
}) {
  return (
    <div
      className="patient-intake-mission-frame__track-status-canvas"
      data-testid="track-request-surface"
      data-contract-id={status.contractId}
      data-surface-posture={status.surfacePosture}
      data-macro-state={status.macroState}
      data-promise-state={status.promiseState}
    >
      <RequestPulseHeader status={status} onRefreshStatus={onRefreshStatus} />
      <div className="patient-intake-mission-frame__track-status-grid">
        <div className="patient-intake-mission-frame__track-status-main">
          <EtaPromiseNote status={status} />
          <CurrentStatePanel status={status} />
          <NextStepsTimeline status={status} />
          <ActionNeededCard status={status} onOpenPath={onOpenPath} />
          <ReturnAnchorLink status={status} onOpenPath={onOpenPath} />
        </div>
      </div>
      <p
        className="patient-intake-mission-frame__visually-hidden"
        data-testid="track-status-live-region"
        aria-live="polite"
      >
        {status.liveRegionMessage}
      </p>
    </div>
  );
}
