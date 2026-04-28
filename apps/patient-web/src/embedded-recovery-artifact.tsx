import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  embeddedRecoveryArtifactJourneyForFixture,
  embeddedRecoveryArtifactPath,
  isEmbeddedRecoveryArtifactPath,
  resolveEmbeddedRecoveryArtifactContext,
  type EmbeddedRecoveryArtifactContext,
  type EmbeddedRecoveryArtifactFixture,
  type EmbeddedRecoveryArtifactRouteKey,
  type EmbeddedRecoveryArtifactSummaryRow,
} from "./embedded-recovery-artifact.model";

export { isEmbeddedRecoveryArtifactPath };

const ROUTE_TABS: ReadonlyArray<{
  readonly routeKey: EmbeddedRecoveryArtifactRouteKey;
  readonly fixture: EmbeddedRecoveryArtifactFixture;
  readonly label: string;
}> = [
  { routeKey: "expired_link", fixture: "expired-link", label: "Expired" },
  { routeKey: "invalid_context", fixture: "invalid-context", label: "Context" },
  { routeKey: "route_freeze", fixture: "route-freeze", label: "Freeze" },
  { routeKey: "degraded_mode", fixture: "degraded-mode", label: "Degraded" },
  { routeKey: "artifact_summary", fixture: "artifact-summary", label: "Summary" },
  { routeKey: "artifact_preview", fixture: "artifact-preview", label: "Preview" },
  { routeKey: "download_progress", fixture: "download-progress", label: "Progress" },
  { routeKey: "artifact_fallback", fixture: "artifact-fallback", label: "Fallback" },
];

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function resolveInitial(): EmbeddedRecoveryArtifactContext {
  const ownerWindow = safeWindow();
  return resolveEmbeddedRecoveryArtifactContext({
    pathname: ownerWindow?.location.pathname ?? "/nhs-app/recovery/REC-393/expired-link",
    search: ownerWindow?.location.search ?? "",
  });
}

function useEmbeddedRecoveryArtifactController() {
  const [context, setContext] = useState<EmbeddedRecoveryArtifactContext>(() => resolveInitial());
  const [announcement, setAnnouncement] = useState(context.announcement);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.motion = ownerWindow.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? "reduced"
      : "full";
  }, []);

  const navigate = useCallback(
    (
      routeKey: EmbeddedRecoveryArtifactRouteKey,
      fixture: EmbeddedRecoveryArtifactFixture,
      replace = false,
    ) => {
      const ownerWindow = safeWindow();
      const journeyRef = embeddedRecoveryArtifactJourneyForFixture(fixture);
      const nextPath = embeddedRecoveryArtifactPath({ journeyRef, routeKey, fixture });
      if (ownerWindow) {
        if (replace) {
          ownerWindow.history.replaceState({ routeKey, journeyRef }, "", nextPath);
        } else {
          ownerWindow.history.pushState({ routeKey, journeyRef }, "", nextPath);
        }
      }
      const [pathname, search = ""] = nextPath.split("?");
      const next = resolveEmbeddedRecoveryArtifactContext({
        pathname: pathname ?? nextPath,
        search: search ? `?${search}` : "",
      });
      setContext(next);
      setAnnouncement(next.announcement);
    },
    [],
  );

  const primaryAction = useCallback(() => {
    if (context.recoveryTruth.actionability === "blocked") {
      setAnnouncement("This NHS App route is blocked. The safe summary remains visible.");
      return;
    }
    if (context.routeKey === "artifact_summary") {
      navigate("artifact_preview", "artifact-preview");
      return;
    }
    if (context.routeKey === "artifact_preview") {
      navigate("download_progress", "download-progress");
      return;
    }
    if (context.routeKey === "unsupported_action") {
      navigate("artifact_fallback", "artifact-fallback");
      return;
    }
    if (context.routeKey === "degraded_mode") {
      navigate("artifact_summary", "artifact-summary");
      return;
    }
    if (context.routeKey === "artifact_fallback" || context.routeKey === "download_progress") {
      navigate("return_safe", "return-safe");
      return;
    }
    if (context.routeKey === "return_safe") {
      setAnnouncement("Safe summary is ready to reopen in the same NHS App shell.");
      return;
    }
    navigate("return_safe", "return-safe");
  }, [context.recoveryTruth.actionability, context.routeKey, navigate]);

  const secondaryAction = useCallback(() => {
    if (
      context.routeKey === "artifact_preview" ||
      context.routeKey === "download_progress" ||
      context.routeKey === "artifact_fallback"
    ) {
      navigate("artifact_summary", "artifact-summary");
      return;
    }
    navigate("return_safe", "return-safe");
  }, [context.routeKey, navigate]);

  return {
    context,
    announcement,
    navigate,
    primaryAction,
    secondaryAction,
  };
}

function SummaryRows({
  rows,
  testIdPrefix,
}: {
  readonly rows: readonly EmbeddedRecoveryArtifactSummaryRow[];
  readonly testIdPrefix: string;
}) {
  return (
    <dl className="embedded-recovery__summary-rows">
      {rows.map((row) => (
        <div key={`${testIdPrefix}-${row.label}`} data-testid={`${testIdPrefix}-${row.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmbeddedLinkRecoveryBanner({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  return (
    <section
      className="embedded-recovery__context-banner"
      aria-labelledby="embedded-recovery-context-title"
      data-testid="EmbeddedLinkRecoveryBanner"
      data-summary-safety={context.preservedContext.summarySafetyState}
      data-selected-anchor={context.preservedContext.selectedAnchorRef}
    >
      <div className="embedded-recovery__context-mark" aria-hidden="true">
        i
      </div>
      <div>
        <span className="embedded-recovery__eyebrow">{context.preservedContext.label}</span>
        <h2 id="embedded-recovery-context-title">{context.preservedContext.currentSectionLabel}</h2>
        <p>{context.preservedContext.summary}</p>
      </div>
    </section>
  );
}

export function EmbeddedExpiredLinkView({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  return (
    <section
      className="embedded-recovery__card"
      aria-labelledby="embedded-recovery-expired-title"
      data-testid="EmbeddedExpiredLinkView"
      data-support-code={context.recoveryTruth.supportCode ?? "none"}
      role={context.recoveryTruth.ariaRole}
    >
      <span className="embedded-recovery__eyebrow">Secure link recovery</span>
      <h2 id="embedded-recovery-expired-title">{context.recoveryTruth.title}</h2>
      <p>{context.recoveryTruth.body}</p>
      <p className="embedded-recovery__support-code">
        Support code: {context.recoveryTruth.supportCode ?? "not required"}
      </p>
    </section>
  );
}

export function EmbeddedInvalidContextView({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  return (
    <section
      className="embedded-recovery__card embedded-recovery__card--warning"
      aria-labelledby="embedded-recovery-invalid-title"
      data-testid="EmbeddedInvalidContextView"
      data-recovery-kind={context.routeKey}
      data-shell-disposition={context.recoveryTruth.shellDisposition}
      role={context.recoveryTruth.ariaRole}
    >
      <span className="embedded-recovery__eyebrow">Context check</span>
      <h2 id="embedded-recovery-invalid-title">{context.recoveryTruth.title}</h2>
      <p>{context.recoveryTruth.body}</p>
      {context.recoveryTruth.supportCode ? (
        <p className="embedded-recovery__support-code">
          Support code: {context.recoveryTruth.supportCode}
        </p>
      ) : null}
    </section>
  );
}

export function EmbeddedUnsupportedActionView({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  return (
    <section
      className="embedded-recovery__card embedded-recovery__card--warning"
      aria-labelledby="embedded-recovery-unsupported-title"
      data-testid="EmbeddedUnsupportedActionView"
      data-actionability={context.recoveryTruth.actionability}
      data-bridge-state={context.continuityEvidence.bridgeCapabilityState}
    >
      <span className="embedded-recovery__eyebrow">In-app action limit</span>
      <h2 id="embedded-recovery-unsupported-title">{context.recoveryTruth.title}</h2>
      <p>{context.recoveryTruth.body}</p>
      <SummaryRows
        rows={[
          { label: "Allowed fallback", value: "Summary-first recovery" },
          { label: "Bridge state", value: context.continuityEvidence.bridgeCapabilityState },
        ]}
        testIdPrefix="unsupported-action"
      />
    </section>
  );
}

export function EmbeddedRouteFreezeNotice({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  if (context.recoveryTruth.routeFreezeState === "live") return null;
  return (
    <section
      className="embedded-recovery__card embedded-recovery__card--freeze"
      aria-labelledby="embedded-recovery-freeze-title"
      data-testid="EmbeddedRouteFreezeNotice"
      data-route-freeze-state={context.recoveryTruth.routeFreezeState}
      role="status"
    >
      <span className="embedded-recovery__eyebrow">Route freeze</span>
      <h2 id="embedded-recovery-freeze-title">{context.recoveryTruth.title}</h2>
      <p>{context.recoveryTruth.body}</p>
      <SummaryRows
        rows={[
          { label: "Freeze disposition", value: context.recoveryTruth.routeFreezeState },
          { label: "Visible posture", value: context.recoveryTruth.shellDisposition },
          { label: "Safe route", value: context.preservedContext.lastSafeRoutePath },
        ]}
        testIdPrefix="route-freeze"
      />
    </section>
  );
}

export function EmbeddedDegradedModePanel({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  if (context.recoveryTruth.degradedModeState === "none") return null;
  return (
    <section
      className="embedded-recovery__card embedded-recovery__card--degraded"
      aria-labelledby="embedded-recovery-degraded-title"
      data-testid="EmbeddedDegradedModePanel"
      data-degraded-mode-state={context.recoveryTruth.degradedModeState}
    >
      <span className="embedded-recovery__eyebrow">Degraded mode</span>
      <h2 id="embedded-recovery-degraded-title">{context.recoveryTruth.title}</h2>
      <p>{context.recoveryTruth.body}</p>
      <SummaryRows
        rows={[
          { label: "Mode", value: context.recoveryTruth.degradedModeState },
          { label: "Eligibility", value: context.continuityEvidence.embeddedEligibilityState },
          { label: "Actionability", value: context.recoveryTruth.actionability },
        ]}
        testIdPrefix="degraded-mode"
      />
    </section>
  );
}

export function EmbeddedArtifactSummarySurface({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  return (
    <section
      className="embedded-recovery__artifact-card"
      aria-labelledby="embedded-recovery-artifact-summary-title"
      data-testid="EmbeddedArtifactSummarySurface"
      data-artifact-mode-truth={context.artifactTruth.modeTruth}
      data-byte-grant-state={context.artifactTruth.byteGrantState}
    >
      <div className="embedded-recovery__card-heading">
        <div>
          <span className="embedded-recovery__eyebrow">Artifact summary</span>
          <h2 id="embedded-recovery-artifact-summary-title">{context.artifactTruth.title}</h2>
        </div>
        <span className="embedded-recovery__state-chip" data-tone={context.recoveryTruth.tone}>
          {context.artifactTruth.modeTruth.replaceAll("_", " ")}
        </span>
      </div>
      <p>{context.artifactTruth.summary}</p>
      <SummaryRows rows={context.artifactTruth.rows} testIdPrefix="artifact-summary" />
    </section>
  );
}

export function EmbeddedArtifactPreviewFrame({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  return (
    <section
      className="embedded-recovery__preview"
      aria-labelledby="embedded-recovery-preview-title"
      data-testid="EmbeddedArtifactPreviewFrame"
      data-preview-state={context.artifactTruth.previewState}
    >
      <div className="embedded-recovery__document-glyph" aria-hidden="true">
        PDF
      </div>
      <div>
        <span className="embedded-recovery__eyebrow">Preview frame</span>
        <h2 id="embedded-recovery-preview-title">
          {context.artifactTruth.previewState === "available"
            ? "Preview available"
            : "Preview summary only"}
        </h2>
        <p>
          {context.artifactTruth.previewState === "available"
            ? "This preview stays inside the app shell. Download remains a separate NHS App bridge action."
            : "The important details remain readable while the preview is unavailable."}
        </p>
      </div>
    </section>
  );
}

export function EmbeddedDownloadProgressCard({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  const progress = context.artifactTruth.transferState === "in_progress" ? 62 : 0;
  return (
    <section
      className="embedded-recovery__card"
      aria-labelledby="embedded-recovery-progress-title"
      data-testid="EmbeddedDownloadProgressCard"
      data-transfer-state={context.artifactTruth.transferState}
      data-byte-grant-state={context.artifactTruth.byteGrantState}
    >
      <span className="embedded-recovery__eyebrow">Transfer</span>
      <h2 id="embedded-recovery-progress-title">Preparing the file transfer</h2>
      <p>
        We are using the NHS App download bridge. This avoids a browser-shaped download and keeps the return route clear.
      </p>
      <div
        className="embedded-recovery__progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Download preparation progress"
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="embedded-recovery__progress-label">{progress}% ready</p>
    </section>
  );
}

export function EmbeddedArtifactFallbackPanel({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  if (context.artifactTruth.fallbackState === "none") return null;
  return (
    <section
      className="embedded-recovery__fallback"
      aria-labelledby="embedded-recovery-fallback-title"
      data-testid="EmbeddedArtifactFallbackPanel"
      data-fallback-state={context.artifactTruth.fallbackState}
      data-safe-browser-handoff={context.artifactTruth.safeBrowserHandoffAllowed ? "true" : "false"}
      data-secure-send-later={context.artifactTruth.secureSendLaterAllowed ? "true" : "false"}
    >
      <span className="embedded-recovery__eyebrow">Fallback</span>
      <h2 id="embedded-recovery-fallback-title">{context.recoveryTruth.title}</h2>
      <p>{context.recoveryTruth.body}</p>
      <SummaryRows
        rows={[
          {
            label: "Fallback state",
            value: context.artifactTruth.fallbackState.replaceAll("_", " "),
          },
          {
            label: "Safe browser handoff",
            value: context.artifactTruth.safeBrowserHandoffAllowed ? "Allowed by grant" : "Not allowed",
          },
          {
            label: "Secure send later",
            value: context.artifactTruth.secureSendLaterAllowed ? "Available" : "Not available",
          },
        ]}
        testIdPrefix="artifact-fallback"
      />
    </section>
  );
}

export function EmbeddedReturnSafeRecoveryFrame({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  return (
    <section
      className="embedded-recovery__return"
      aria-labelledby="embedded-recovery-return-title"
      data-testid="EmbeddedReturnSafeRecoveryFrame"
      data-return-contract-ref={context.preservedContext.returnContractRef}
      data-last-safe-route={context.preservedContext.lastSafeRoutePath}
    >
      <span className="embedded-recovery__eyebrow">Return-safe recovery</span>
      <h2 id="embedded-recovery-return-title">Return stays in this NHS App shell</h2>
      <p>
        We will reopen {context.preservedContext.currentSectionLabel.toLowerCase()} from the last safe summary if richer context cannot be restored.
      </p>
    </section>
  );
}

function EmbeddedRecoveryRouteBody({
  context,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
}) {
  if (context.routeKey === "expired_link") {
    return <EmbeddedExpiredLinkView context={context} />;
  }
  if (
    context.routeKey === "invalid_context" ||
    context.routeKey === "lost_session" ||
    context.routeKey === "channel_unavailable"
  ) {
    return (
      <>
        <EmbeddedInvalidContextView context={context} />
        <EmbeddedDegradedModePanel context={context} />
      </>
    );
  }
  if (context.routeKey === "unsupported_action") {
    return (
      <>
        <EmbeddedUnsupportedActionView context={context} />
        <EmbeddedDegradedModePanel context={context} />
        <EmbeddedArtifactFallbackPanel context={context} />
      </>
    );
  }
  if (context.routeKey === "route_freeze") {
    return <EmbeddedRouteFreezeNotice context={context} />;
  }
  if (context.routeKey === "degraded_mode") {
    return (
      <>
        <EmbeddedDegradedModePanel context={context} />
        <EmbeddedArtifactSummarySurface context={context} />
      </>
    );
  }
  if (context.routeKey === "artifact_summary") {
    return <EmbeddedArtifactSummarySurface context={context} />;
  }
  if (context.routeKey === "artifact_preview") {
    return (
      <>
        <EmbeddedArtifactSummarySurface context={context} />
        <EmbeddedArtifactPreviewFrame context={context} />
      </>
    );
  }
  if (context.routeKey === "download_progress") {
    return (
      <>
        <EmbeddedArtifactSummarySurface context={context} />
        <EmbeddedDownloadProgressCard context={context} />
      </>
    );
  }
  if (context.routeKey === "artifact_fallback") {
    return (
      <>
        <EmbeddedArtifactSummarySurface context={context} />
        <EmbeddedArtifactFallbackPanel context={context} />
      </>
    );
  }
  return <EmbeddedReturnSafeRecoveryFrame context={context} />;
}

export function EmbeddedRecoveryActionCluster({
  context,
  onPrimary,
  onSecondary,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
}) {
  return (
    <aside
      className="embedded-recovery__action-cluster"
      aria-label="Recovery actions"
      data-testid="EmbeddedRecoveryActionCluster"
      data-actionability={context.recoveryTruth.actionability}
    >
      <button
        type="button"
        className="embedded-recovery__primary-action"
        disabled={!context.actionCluster.primaryEnabled}
        onClick={onPrimary}
      >
        {context.actionCluster.primaryLabel}
      </button>
      {context.actionCluster.secondaryLabel ? (
        <button type="button" className="embedded-recovery__secondary-action" onClick={onSecondary}>
          {context.actionCluster.secondaryLabel}
        </button>
      ) : null}
    </aside>
  );
}

export function EmbeddedRecoveryArtifactFrame({
  context,
  children,
}: {
  readonly context: EmbeddedRecoveryArtifactContext;
  readonly children: ReactNode;
}) {
  return (
    <main
      className="token-foundation embedded-recovery"
      data-testid="EmbeddedRecoveryArtifactFrame"
      data-task-id={context.taskId}
      data-visual-mode={context.visualMode}
      data-route-key={context.routeKey}
      data-fixture={context.fixture}
      data-journey-ref={context.journeyRef}
      data-actionability={context.recoveryTruth.actionability}
      data-artifact-mode={context.artifactTruth.modeTruth}
      data-route-freeze-state={context.recoveryTruth.routeFreezeState}
      data-degraded-mode-state={context.recoveryTruth.degradedModeState}
      data-shell-disposition={context.recoveryTruth.shellDisposition}
      data-continuity-state={context.recoveryTruth.continuityState}
    >
      {children}
    </main>
  );
}

export function EmbeddedRecoveryArtifactApp() {
  const controller = useEmbeddedRecoveryArtifactController();
  const { context } = controller;
  return (
    <EmbeddedRecoveryArtifactFrame context={context}>
      <div className="embedded-recovery__shell">
        <header className="embedded-recovery__masthead" role="banner" data-testid="EmbeddedRecoveryMasthead">
          <div>
            <span className="embedded-recovery__eyebrow">NHS App recovery</span>
            <h1>Recovery and documents</h1>
            <p>{context.recoveryTruth.body}</p>
          </div>
          <nav aria-label="Recovery and artifact views" className="embedded-recovery__tabs">
            {ROUTE_TABS.map((tab) => (
              <button
                key={tab.fixture}
                type="button"
                aria-current={context.routeKey === tab.routeKey ? "page" : undefined}
                data-active={context.routeKey === tab.routeKey ? "true" : "false"}
                onClick={() => controller.navigate(tab.routeKey, tab.fixture)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <EmbeddedLinkRecoveryBanner context={context} />
        <EmbeddedRecoveryRouteBody context={context} />
        {context.routeKey !== "return_safe" ? (
          <EmbeddedReturnSafeRecoveryFrame context={context} />
        ) : null}
      </div>

      <EmbeddedRecoveryActionCluster
        context={context}
        onPrimary={controller.primaryAction}
        onSecondary={controller.secondaryAction}
      />
      <div className="embedded-recovery__live" aria-live="polite" data-testid="EmbeddedRecoveryLiveRegion">
        {controller.announcement}
      </div>
    </EmbeddedRecoveryArtifactFrame>
  );
}

export default EmbeddedRecoveryArtifactApp;
