import { useEffect, useState } from "react";
import { ArtifactSurfaceFrame } from "@vecells/design-system";
import type {
  AttachmentDigestCardProjection,
  AttachmentDigestGridProjection,
  ArtifactViewerStageProjection,
  PatientResponseThreadPanelProjection,
  ThreadDispositionChipProjection,
  ThreadEventRowProjection,
} from "./workspace-shell.data";

function publicThreadText(value: string): string {
  return value
    .replace(/\bPatientResponseThreadPanel\b/g, "Patient response thread")
    .replace(/\brequest_215_callback\b/g, "callback request")
    .replace(/\bcluster_214_callback\b/g, "callback conversation")
    .replace(/\bposture\b/gi, "status")
    .replace(/\btruth\b/gi, "confirmed information")
    .replace(/\blineage\b/gi, "history")
    .replace(/\bstub\b/gi, "summary")
    .replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/g, (token) =>
      token.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    );
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function digestKindLabel(kind: AttachmentDigestCardProjection["digestKind"]): string {
  switch (kind) {
    case "audio":
      return "AUD";
    case "image":
      return "IMG";
    case "document":
    default:
      return "DOC";
  }
}

function formatThreadTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toISOString().slice(11, 16);
}

export function AttachmentDigestCard({
  card,
  onOpen,
}: {
  card: AttachmentDigestCardProjection;
  onOpen: (artifactId: string) => void;
}) {
  return (
    <article
      className="staff-shell__attachment-card"
      data-testid="AttachmentDigestCard"
      data-artifact-id={card.artifactId}
      data-selected={card.selected ? "true" : "false"}
      data-mode={card.modeTruth.currentMode}
      data-digest-kind={card.digestKind}
    >
      <div className="staff-shell__attachment-card-head">
        <span className="staff-shell__attachment-badge">{digestKindLabel(card.digestKind)}</span>
        <div className="staff-shell__attachment-copy">
          <strong>{card.title}</strong>
          <span>{card.metaLabel}</span>
        </div>
      </div>
      <p>{card.summary}</p>
      <div className="staff-shell__attachment-card-meta">
        <span>{card.provenanceLabel}</span>
        <span>{card.availabilityLabel}</span>
      </div>
      <button type="button" className="staff-shell__inline-action" onClick={() => onOpen(card.artifactId)}>
        {card.openLabel}
      </button>
    </article>
  );
}

export function AudioDigestCard({
  card,
  onOpen,
}: {
  card: AttachmentDigestCardProjection;
  onOpen: (artifactId: string) => void;
}) {
  return (
    <article
      className="staff-shell__attachment-card staff-shell__attachment-card--audio"
      data-testid="AudioDigestCard"
      data-artifact-id={card.artifactId}
      data-selected={card.selected ? "true" : "false"}
      data-mode={card.modeTruth.currentMode}
    >
      <div className="staff-shell__attachment-card-head">
        <span className="staff-shell__attachment-badge">{digestKindLabel(card.digestKind)}</span>
        <div className="staff-shell__attachment-copy">
          <strong>{card.title}</strong>
          <span>{card.metaLabel}</span>
        </div>
      </div>
      <div className="staff-shell__audio-wave" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={`${card.artifactId}-${index}`} style={{ height: `${24 + ((index * 9) % 28)}px` }} />
        ))}
      </div>
      <p>{card.summary}</p>
      <div className="staff-shell__attachment-card-meta">
        <span>{card.provenanceLabel}</span>
        <span>{card.availabilityLabel}</span>
      </div>
      <button type="button" className="staff-shell__inline-action" onClick={() => onOpen(card.artifactId)}>
        {card.openLabel}
      </button>
    </article>
  );
}

export function AttachmentDigestGrid({
  projection,
  onOpenArtifact,
}: {
  projection: AttachmentDigestGridProjection;
  onOpenArtifact: (artifactId: string) => void;
}) {
  return (
    <section className="staff-shell__attachment-grid-frame" data-testid="AttachmentDigestGrid">
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">AttachmentDigestGrid</span>
        <h3>{publicThreadText(projection.title)}</h3>
        <p>{projection.summary}</p>
      </header>
      <div className="staff-shell__attachment-grid">
        {projection.cards.map((card) =>
          card.digestKind === "audio" ? (
            <AudioDigestCard key={card.cardId} card={card} onOpen={onOpenArtifact} />
          ) : (
            <AttachmentDigestCard key={card.cardId} card={card} onOpen={onOpenArtifact} />
          ),
        )}
      </div>
    </section>
  );
}

export function ThreadDispositionChip({ chip }: { chip: ThreadDispositionChipProjection }) {
  return (
    <span
      className="staff-shell__thread-chip"
      data-testid="ThreadDispositionChip"
      data-tone={chip.tone}
    >
      {chip.label}
    </span>
  );
}

export function ThreadEventRow({
  row,
  onSelect,
  onOpenArtifact,
}: {
  row: ThreadEventRowProjection;
  onSelect: (eventId: string) => void;
  onOpenArtifact: (artifactId: string) => void;
}) {
  return (
    <article
      className="staff-shell__thread-row"
      data-testid="ThreadEventRow"
      data-row-id={row.rowId}
      data-selected={row.selected ? "true" : "false"}
      data-visibility-mode={row.visibilityMode}
      data-authoritative-outcome={row.authoritativeOutcomeState}
    >
      <div className="staff-shell__thread-row-head">
        <div>
          <strong>{row.headline}</strong>
          <span>
            {formatThreadTimestamp(row.occurredAt)} · {row.actorLabel}
          </span>
        </div>
        <button type="button" className="staff-shell__thread-row-action" onClick={() => onSelect(row.rowId)}>
          Focus anchor
        </button>
      </div>
      <div className="staff-shell__thread-chip-row">
        {row.chips.map((chip) => (
          <ThreadDispositionChip key={chip.chipId} chip={chip} />
        ))}
      </div>
      <p>{row.summary}</p>
      <dl className="staff-shell__thread-meta-grid">
        <div>
          <dt>Transport</dt>
          <dd>{row.transportState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Observation</dt>
          <dd>{row.externalObservationState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Outcome</dt>
          <dd>{row.authoritativeOutcomeState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Delivery risk</dt>
          <dd>{row.deliveryRiskState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      {row.attachmentRefs.length > 0 && (
        <div className="staff-shell__thread-artifact-links">
          {row.attachmentRefs.map((artifactId) => (
            <button
              key={artifactId}
              type="button"
              className="staff-shell__thread-artifact-link"
              onClick={() => onOpenArtifact(artifactId)}
            >
              Open related attachment
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

export function ThreadAnchorStub({
  stub,
  onReset,
}: {
  stub: NonNullable<PatientResponseThreadPanelProjection["anchorStub"]>;
  onReset: () => void;
}) {
  return (
    <div className="staff-shell__thread-anchor-stub" data-testid="ThreadAnchorStub">
      <div>
        <strong>{stub.title.replace("ThreadAnchorStub", "Thread anchor")}</strong>
        <p>{publicThreadText(stub.summary)}</p>
      </div>
      <button type="button" className="staff-shell__inline-action" onClick={onReset}>
        {stub.actionLabel}
      </button>
    </div>
  );
}

export function PatientResponseThreadPanel({
  projection,
  onSelectEvent,
  onResetSelection,
  onOpenArtifact,
}: {
  projection: PatientResponseThreadPanelProjection;
  onSelectEvent: (eventId: string) => void;
  onResetSelection: () => void;
  onOpenArtifact: (artifactId: string) => void;
}) {
  return (
    <aside
      className="staff-shell__thread-panel"
      data-testid="PatientResponseThreadPanel"
      data-request-ref={projection.requestRef}
      data-request-lineage-ref={projection.requestLineageRef}
      data-cluster-ref={projection.clusterRef}
      data-thread-id={projection.threadId}
      data-patient-conversation-route={projection.patientConversationRouteRef}
      data-phase3-bundle-ref={projection.phase3ConversationBundleRef}
      data-evidence-delta-packet-ref={projection.evidenceDeltaPacketRef}
      data-more-info-response-disposition-ref={projection.moreInfoResponseDispositionRef}
      data-delivery-posture={projection.deliveryPosture}
      data-repair-posture={projection.repairPosture}
      data-dominant-next-action={projection.dominantNextActionRef}
      data-preview-mode={projection.previewMode}
      data-authoritative-outcome={projection.authoritativeOutcomeState}
      data-repair-required-state={projection.repairRequiredState}
    >
      <header className="staff-shell__task-stack-header">
        <span className="staff-shell__eyebrow">Patient response thread</span>
        <h3>{publicThreadText(projection.title)}</h3>
        <p>{publicThreadText(projection.summary)}</p>
      </header>
      <div className="staff-shell__thread-panel-meta">
        <span data-request-ref={projection.requestRef}>Request in review</span>
        <span data-cluster-ref={projection.clusterRef}>Conversation thread</span>
        <span>{publicThreadText(projection.authoritativeOutcomeState.replaceAll("_", " "))}</span>
        <span>{publicThreadText(projection.dominantNextActionRef)}</span>
      </div>
      {projection.anchorStub && <ThreadAnchorStub stub={projection.anchorStub} onReset={onResetSelection} />}
      <div className="staff-shell__thread-list">
        {projection.rows.map((row) => (
          <ThreadEventRow
            key={row.rowId}
            row={row}
            onSelect={onSelectEvent}
            onOpenArtifact={onOpenArtifact}
          />
        ))}
      </div>
    </aside>
  );
}

export function ArtifactViewerStage({
  projection,
  onClose,
}: {
  projection: ArtifactViewerStageProjection;
  onClose: () => void;
}) {
  const [hydrationState, setHydrationState] = useState<"chunking" | "ready">(
    projection.hydrationMode === "chunked" ? "chunking" : "ready",
  );

  useEffect(() => {
    if (projection.hydrationMode !== "chunked") {
      setHydrationState("ready");
      return;
    }
    setHydrationState("chunking");
    const timer = window.setTimeout(() => setHydrationState("ready"), 260);
    return () => window.clearTimeout(timer);
  }, [projection.artifactId, projection.hydrationMode]);

  const viewerState =
    projection.modeTruth.currentMode === "recovery_only" ||
    projection.modeTruth.currentMode === "placeholder_only"
      ? projection.modeTruth.currentMode
      : hydrationState === "chunking"
        ? "chunking"
        : "ready";

  return (
    <section
      className="staff-shell__artifact-viewer-stage"
      data-testid="ArtifactViewerStage"
      data-artifact-id={projection.artifactId}
      data-viewer-state={viewerState}
      data-selected-anchor-ref={projection.selectedAnchorRef}
      data-quiet-return-target={projection.quietReturnTargetRef}
    >
      <div className="staff-shell__artifact-viewer-head">
        <div>
          <span className="staff-shell__eyebrow">ArtifactViewerStage</span>
          <h3>{projection.title}</h3>
          <p>{projection.summary}</p>
        </div>
        <button type="button" className="staff-shell__inline-action" onClick={onClose}>
          Return to attachment digest
        </button>
      </div>
      {viewerState === "chunking" ? (
        <div className="staff-shell__artifact-loading-state">
          <strong>Chunked loading keeps the task shell responsive</strong>
          <p>
            The attachment summary and provenance stay visible while the heavier preview is hydrated
            on demand.
          </p>
          <div className="staff-shell__artifact-loading-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : (
        <ArtifactSurfaceFrame specimen={projection.specimen} />
      )}
    </section>
  );
}
