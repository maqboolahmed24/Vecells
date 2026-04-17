import { startTransition, useEffect, useRef, useState } from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import {
  RECEIPT_STATUS_PARITY_ENTRY,
  RECEIPT_STATUS_PARITY_TASK_ID,
  ReceiptParityResolver,
  isCrossChannelReceiptStatusParityPath,
  type ProvenanceContextNote,
  type ReceiptParityRouteProjection,
  type ReceiptStatusSurfaceProjection,
} from "./cross-channel-receipt-status-parity.model";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

export function ProvenanceContextChipRow({ notes }: { notes: readonly ProvenanceContextNote[] }) {
  if (notes.length === 0) {
    return null;
  }
  return (
    <ul
      className="parity-status__chips"
      data-testid="provenance-context-chip-row"
      aria-label="Channel context notes"
    >
      {notes.map((note) => (
        <li
          key={note.noteId}
          data-testid={`provenance-chip-${note.noteId}`}
          data-additive-only={String(note.additiveOnly)}
          data-primary-status-forbidden={String(note.primaryStatusForbidden)}
        >
          <strong>{note.label}</strong>
          <span>{note.body}</span>
        </li>
      ))}
    </ul>
  );
}

export function RequestStatusStrip({
  surface,
  compact = false,
}: {
  surface: ReceiptStatusSurfaceProjection;
  compact?: boolean;
}) {
  return (
    <div
      className={`parity-status__strip ${compact ? "parity-status__strip--compact" : ""}`}
      data-testid="request-status-strip"
      data-surface-kind={surface.surfaceKind}
      data-channel-context={surface.channelContext}
      data-status-state={surface.grammar.statusState}
      data-status-headline={surface.grammar.statusHeadline}
      data-eta-bucket={surface.grammar.etaBucket}
      data-promise-state={surface.grammar.promiseState}
      data-semantic-status-key={surface.semanticStatusKey}
      data-same-status-meaning={String(surface.sameStatusMeaningAcrossChannels)}
      role="status"
    >
      <span data-tone={surface.grammar.tone}>{surface.grammar.statusHeadline}</span>
      <strong>{surface.grammar.etaLabel}</strong>
      <em>{surface.grammar.promiseLabel}</em>
    </div>
  );
}

export function ReceiptHero({ surface }: { surface: ReceiptStatusSurfaceProjection }) {
  return (
    <section
      className="parity-status__hero"
      data-testid="receipt-hero"
      data-channel-context={surface.channelContext}
      data-status-state={surface.grammar.statusState}
      data-status-headline={surface.grammar.statusHeadline}
      data-eta-bucket={surface.grammar.etaBucket}
      data-promise-state={surface.grammar.promiseState}
      data-recovery-posture={surface.grammar.recoveryPosture}
      data-audience-coverage={surface.audienceCoverage.mode}
      aria-labelledby="receipt-parity-title"
    >
      <p className="parity-status__eyebrow">Canonical receipt</p>
      <h1 id="receipt-parity-title">{surface.grammar.statusHeadline}</h1>
      <ProvenanceContextChipRow notes={surface.provenanceNotes} />
      <p>{surface.grammar.explanation}</p>
      <RequestStatusStrip surface={surface} />
      <div className="parity-status__hero-footer">
        <div>
          <span>Next safe action</span>
          <strong>{surface.grammar.nextSafeAction}</strong>
        </div>
        <div>
          <span>Reference</span>
          <strong>{surface.requestSummary.requestId}</strong>
        </div>
      </div>
    </section>
  );
}

export function RequestStatusSummaryCard({
  surface,
  label,
}: {
  surface: ReceiptStatusSurfaceProjection;
  label: string;
}) {
  return (
    <article
      className="parity-status__summary"
      data-testid="request-status-summary-card"
      data-surface-kind={surface.surfaceKind}
      data-channel-context={surface.channelContext}
      data-status-state={surface.grammar.statusState}
      data-semantic-status-key={surface.semanticStatusKey}
      aria-labelledby={`summary-${surface.surfaceKind}`}
    >
      <div>
        <p className="parity-status__eyebrow">{label}</p>
        <h2 id={`summary-${surface.surfaceKind}`}>{surface.requestSummary.title}</h2>
      </div>
      <RequestStatusStrip surface={surface} compact />
      <p>{surface.requestDetail.patientSafeDetail}</p>
      <p className="parity-status__next">{surface.grammar.nextSafeAction}</p>
    </article>
  );
}

export function ReceiptOutcomeBridge({ projection }: { projection: ReceiptParityRouteProjection }) {
  return (
    <section
      className="parity-status__bridge"
      data-testid="receipt-outcome-bridge"
      data-receipt-key={projection.outcomeBridge.sourceReceiptKey}
      data-status-key={projection.outcomeBridge.sourceStatusKey}
      data-list-row-agrees={String(projection.outcomeBridge.listRowAgreesWithReceipt)}
      data-detail-header-agrees={String(projection.outcomeBridge.detailHeaderAgreesWithReceipt)}
      data-public-safe-core-meaning-changed={String(
        projection.outcomeBridge.publicSafeNarrowingChangesCoreMeaning,
      )}
      data-mapped-recovery-outcome={projection.outcomeBridge.mappedRecoveryOutcome}
      aria-labelledby="receipt-outcome-bridge-title"
    >
      <p className="parity-status__eyebrow">Receipt outcome bridge</p>
      <h2 id="receipt-outcome-bridge-title">One receipt key, one status key</h2>
      <p>
        Receipt, list row, request detail, and public-safe status derive from the same consistency
        envelope. Public-safe narrowing changes detail visibility, not the core status meaning.
      </p>
      <dl>
        <div>
          <dt>Receipt key</dt>
          <dd>{projection.outcomeBridge.sourceReceiptKey}</dd>
        </div>
        <div>
          <dt>Status key</dt>
          <dd>{projection.outcomeBridge.sourceStatusKey}</dd>
        </div>
        <div>
          <dt>Recovery posture</dt>
          <dd>{projection.outcomeBridge.mappedRecoveryOutcome.replaceAll("_", " ")}</dd>
        </div>
      </dl>
    </section>
  );
}

function ChannelComparisonBoard({
  surfaces,
}: {
  surfaces: readonly ReceiptStatusSurfaceProjection[];
}) {
  return (
    <section
      className="parity-status__channel-board"
      data-testid="channel-parity-board"
      aria-labelledby="channel-parity-title"
    >
      <div className="parity-status__section-heading">
        <p className="parity-status__eyebrow">Channel comparison</p>
        <h2 id="channel-parity-title">Same request truth across entry points</h2>
      </div>
      <div className="parity-status__channel-grid">
        {surfaces.map((surface) => (
          <article
            key={surface.channelContext}
            data-testid={`channel-parity-card-${surface.channelContext}`}
            data-channel-context={surface.channelContext}
            data-semantic-status-key={surface.semanticStatusKey}
          >
            <h3>{surface.channelContext.replaceAll("_", " ")}</h3>
            <RequestStatusStrip surface={surface} compact />
            <ProvenanceContextChipRow notes={surface.provenanceNotes} />
          </article>
        ))}
      </div>
    </section>
  );
}

function useReceiptParityController() {
  const initialPathname = safeWindow()?.location.pathname ?? RECEIPT_STATUS_PARITY_ENTRY;
  const [projection, setProjection] = useState<ReceiptParityRouteProjection>(() =>
    ReceiptParityResolver(initialPathname),
  );
  const [announcement, setAnnouncement] = useState("Receipt and status parity loaded.");
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const onPopState = () => {
      const nextProjection = ReceiptParityResolver(ownerWindow.location.pathname);
      setProjection(nextProjection);
      setAnnouncement(`${nextProjection.selectedChannel.replaceAll("_", " ")} parity opened.`);
    };
    ownerWindow.addEventListener("popstate", onPopState);
    return () => ownerWindow.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    heroRef.current?.focus({ preventScroll: true });
  }, [projection.selectedChannel, projection.selectedSurface.grammar.statusState]);

  function navigate(pathname: string): void {
    const ownerWindow = safeWindow();
    startTransition(() => {
      const nextProjection = ReceiptParityResolver(pathname);
      setProjection(nextProjection);
      ownerWindow?.history.pushState({}, "", pathname);
      setAnnouncement(`${nextProjection.selectedChannel.replaceAll("_", " ")} parity opened.`);
    });
  }

  return { projection, announcement, heroRef, navigate };
}

export { isCrossChannelReceiptStatusParityPath };

export default function CrossChannelReceiptStatusParityApp() {
  const { projection, announcement, heroRef, navigate } = useReceiptParityController();
  return (
    <div
      className="parity-status"
      data-testid="Cross_Channel_Receipt_Status_Parity_Route"
      data-task-id={RECEIPT_STATUS_PARITY_TASK_ID}
      data-visual-mode={projection.visualMode}
      data-route-family={projection.routeFamily}
      data-selected-channel={projection.selectedChannel}
      data-selected-status-state={projection.selectedSurface.grammar.statusState}
      data-semantic-status-key={projection.selectedSurface.semanticStatusKey}
      data-supported-testids="receipt-hero request-status-strip request-status-summary-card provenance-context-chip-row receipt-outcome-bridge channel-parity-board parity-list-row-surface parity-detail-header-surface signed-out-minimal-status-surface"
    >
      <header className="parity-status__top-band" data-testid="parity-status-top-band">
        <div>
          <VecellLogoWordmark aria-hidden="true" className="parity-status__wordmark" />
          <span>Receipt and status parity</span>
        </div>
        <nav aria-label="Receipt parity routes">
          <button type="button" onClick={() => navigate(RECEIPT_STATUS_PARITY_ENTRY)}>
            Authenticated
          </button>
          <button type="button" onClick={() => navigate("/status/REQ-4219")}>
            Public
          </button>
          <button type="button" onClick={() => navigate("/phone/receipt/REQ-4219")}>
            Phone
          </button>
          <button type="button" onClick={() => navigate("/continue/receipt/REQ-4219")}>
            Continuation
          </button>
          <button type="button" onClick={() => navigate(`${RECEIPT_STATUS_PARITY_ENTRY}/blocked`)}>
            Blocked
          </button>
        </nav>
      </header>
      <main className="parity-status__main">
        <section ref={heroRef} tabIndex={-1} className="parity-status__focus-anchor">
          <ReceiptHero surface={projection.selectedSurface} />
        </section>
        <ChannelComparisonBoard surfaces={projection.channelSurfaces} />
        <section
          className="parity-status__surface-stack"
          data-testid="source-surface-parity-stack"
          aria-label="Source to surface parity"
        >
          <RequestStatusSummaryCard surface={projection.listSurface} label="Request list row" />
          <div data-testid="parity-list-row-surface">
            <RequestStatusStrip surface={projection.listSurface} />
          </div>
          <RequestStatusSummaryCard
            surface={projection.detailSurface}
            label="Request detail header"
          />
          <div data-testid="parity-detail-header-surface">
            <RequestStatusStrip surface={projection.detailSurface} />
          </div>
          <RequestStatusSummaryCard
            surface={projection.signedOutSurface}
            label="Signed-out minimal status"
          />
          <div data-testid="signed-out-minimal-status-surface">
            <RequestStatusStrip surface={projection.signedOutSurface} />
          </div>
        </section>
        <ReceiptOutcomeBridge projection={projection} />
      </main>
      <div
        className="parity-status__live-region"
        data-testid="receipt-status-live-region"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </div>
    </div>
  );
}
