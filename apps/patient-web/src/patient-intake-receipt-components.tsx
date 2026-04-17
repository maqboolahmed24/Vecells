import type { ReceiptSurfaceView } from "./patient-intake-receipt-surface";

const RECEIPT_FACT_CONTRACT_IDS = new Set<string>([
  "receipt-reference-fact",
  "receipt-state-fact",
  "receipt-eta-fact",
]);

export function ReferenceAndEtaFacts({ receipt }: { receipt: ReceiptSurfaceView }) {
  return (
    <section className="patient-intake-mission-frame__receipt-facts-band">
      {receipt.facts.map((fact) => (
        <article
          key={fact.dataTestId}
          className="patient-intake-mission-frame__receipt-fact-card"
          data-testid={fact.dataTestId}
          data-fact-contract-id={
            RECEIPT_FACT_CONTRACT_IDS.has(fact.dataTestId) ? fact.dataTestId : undefined
          }
        >
          <span>{fact.label}</span>
          <strong>{fact.value}</strong>
          <p>{fact.caption}</p>
        </article>
      ))}
    </section>
  );
}

export function PromiseStateNote({ receipt }: { receipt: ReceiptSurfaceView }) {
  return (
    <section
      className="patient-intake-mission-frame__receipt-promise-note"
      data-testid="receipt-promise-note"
      data-tone={receipt.promiseTone}
      data-promise-state={receipt.promiseState}
    >
      <strong>{receipt.promiseNoteTitle}</strong>
      <p>{receipt.promiseNoteBody}</p>
    </section>
  );
}

export function NextStepsTimeline({
  receipt,
  onPatchState,
}: {
  receipt: ReceiptSurfaceView;
  onPatchState: () => void;
}) {
  return (
    <section
      className="patient-intake-mission-frame__receipt-timeline-card"
      data-testid="receipt-timeline"
    >
      <div className="patient-intake-mission-frame__receipt-section-head">
        <div>
          <span>Next steps</span>
          <h4>{receipt.timelineHeading}</h4>
        </div>
        {receipt.patchActionLabel ? (
          <button
            type="button"
            className="patient-intake-mission-frame__receipt-inline-action"
            data-testid="receipt-patch-action"
            onClick={onPatchState}
          >
            {receipt.patchActionLabel}
          </button>
        ) : null}
      </div>
      <ol className="patient-intake-mission-frame__receipt-timeline-list">
        {receipt.timeline.map((step) => (
          <li
            key={step.key}
            className="patient-intake-mission-frame__receipt-timeline-step"
            data-state={step.state}
          >
            <span className="patient-intake-mission-frame__receipt-timeline-dot" />
            <div>
              <strong>{step.label}</strong>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div
        className="patient-intake-mission-frame__receipt-communication-note"
        data-testid="receipt-communication-note"
        data-communication-posture={receipt.communicationPosture}
      >
        <strong>Confirmation path</strong>
        <p>{receipt.communicationBridgeNote}</p>
      </div>
    </section>
  );
}

export function ContactSummaryCard({ receipt }: { receipt: ReceiptSurfaceView }) {
  return (
    <section
      className="patient-intake-mission-frame__receipt-contact-card"
      data-testid="receipt-contact-summary"
    >
      <div className="patient-intake-mission-frame__receipt-section-head">
        <div>
          <span>Contact summary</span>
          <h4>How we plan to contact you</h4>
        </div>
      </div>
      <p>{receipt.contactPlanNote}</p>
    </section>
  );
}

export function TrackRequestAnchorCard({
  receipt,
  onOpenTrackRequest,
}: {
  receipt: ReceiptSurfaceView;
  onOpenTrackRequest: () => void;
}) {
  return (
    <section
      className="patient-intake-mission-frame__receipt-track-card"
      data-testid="receipt-track-request-anchor-card"
    >
      <div className="patient-intake-mission-frame__receipt-section-head">
        <div>
          <span>Next place to look</span>
          <h4>Track this request in the same shell</h4>
        </div>
      </div>
      <p>
        The tracking view keeps the same request lineage and shows the same ETA and promise state
        contract without turning into a dashboard.
      </p>
      <button
        type="button"
        className="patient-intake-mission-frame__receipt-track-action"
        data-testid={receipt.trackRequestAction.dataTestId}
        data-navigation-contract-ref={receipt.trackRequestAction.navigationContractRef}
        data-navigation-destination-type={receipt.trackRequestAction.destinationType}
        data-target-pathname={receipt.trackRequestAction.targetPathname}
        onClick={onOpenTrackRequest}
      >
        {receipt.trackRequestAction.label}
      </button>
    </section>
  );
}

export function ReceiptOutcomeCanvas({
  receipt,
  onPatchState,
  onOpenTrackRequest,
}: {
  receipt: ReceiptSurfaceView;
  onPatchState: () => void;
  onOpenTrackRequest: () => void;
}) {
  return (
    <div
      className="patient-intake-mission-frame__receipt-outcome-canvas"
      data-testid="receipt-outcome-canvas"
      data-copy-variant-ref={receipt.copyVariantRef}
      data-consistency-envelope-id={receipt.consistencyEnvelopeId}
      data-macro-state={receipt.macroState}
      data-receipt-bucket={receipt.receiptBucket}
      data-promise-state={receipt.promiseState}
      data-receipt-consistency-key={receipt.receiptConsistencyKey}
      data-status-consistency-key={receipt.statusConsistencyKey}
    >
      <header className="patient-intake-mission-frame__receipt-hero">
        <span className="patient-intake-mission-frame__receipt-eyebrow">Routine receipt</span>
        <h3
          className="patient-intake-mission-frame__receipt-title"
          data-testid="receipt-outcome-title"
          data-outcome-autofocus="true"
          tabIndex={-1}
        >
          {receipt.title}
        </h3>
        <p>{receipt.summary}</p>
      </header>

      <ReferenceAndEtaFacts receipt={receipt} />
      <PromiseStateNote receipt={receipt} />

      <section
        className="patient-intake-mission-frame__receipt-current-state-card"
        data-testid="receipt-current-state-panel"
      >
        <div className="patient-intake-mission-frame__receipt-section-head">
          <div>
            <span>Current state</span>
            <h4>{receipt.currentStateHeading}</h4>
          </div>
        </div>
        <p>{receipt.currentStateBody}</p>
        <p className="patient-intake-mission-frame__receipt-next-step">{receipt.nextStepMessage}</p>
      </section>

      <div className="patient-intake-mission-frame__receipt-grid">
        <NextStepsTimeline receipt={receipt} onPatchState={onPatchState} />
        <div className="patient-intake-mission-frame__receipt-side">
          <ContactSummaryCard receipt={receipt} />
          <TrackRequestAnchorCard
            receipt={receipt}
            onOpenTrackRequest={onOpenTrackRequest}
          />
        </div>
      </div>

      <p
        className="patient-intake-mission-frame__visually-hidden"
        data-testid="receipt-live-region"
        aria-live="polite"
      >
        {receipt.liveRegionMessage}
      </p>
    </div>
  );
}
