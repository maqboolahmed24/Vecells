import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import {
  embeddedRequestStatusPath,
  isEmbeddedRequestStatusPath,
  resolveEmbeddedRequestStatusContext,
  type EmbeddedRequestStatusContext,
  type EmbeddedRequestStatusRouteKey,
} from "./embedded-request-status.model";

export { isEmbeddedRequestStatusPath };

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function resolveInitial(): EmbeddedRequestStatusContext {
  const ownerWindow = safeWindow();
  return resolveEmbeddedRequestStatusContext({
    pathname: ownerWindow?.location.pathname ?? "/nhs-app/requests/request_211_a/status",
    search: ownerWindow?.location.search ?? "",
  });
}

function useEmbeddedRequestStatusController() {
  const [context, setContext] = useState<EmbeddedRequestStatusContext>(() => resolveInitial());
  const [replyText, setReplyText] = useState("");
  const [replySubmitted, setReplySubmitted] = useState(false);
  const [validationVisible, setValidationVisible] = useState(false);
  const [announcement, setAnnouncement] = useState(context.announcement);
  const validationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.motion = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "reduced"
      : "full";
  }, []);

  const replaceContext = useCallback(
    (routeKey: EmbeddedRequestStatusRouteKey, replace = false) => {
      const ownerWindow = safeWindow();
      const nextPath = embeddedRequestStatusPath({
        requestRef: context.requestRef,
        routeKey,
        fixture:
          context.fixture === "callback-drifted" || context.fixture === "recovery" || context.fixture === "read-only"
            ? context.fixture
            : null,
      });
      if (ownerWindow) {
        if (replace) {
          ownerWindow.history.replaceState({ routeKey, requestRef: context.requestRef }, "", nextPath);
        } else {
          ownerWindow.history.pushState({ routeKey, requestRef: context.requestRef }, "", nextPath);
        }
      }
      const next = resolveEmbeddedRequestStatusContext({
        pathname: nextPath,
        search: nextPath.includes("?") ? `?${nextPath.split("?")[1]}` : "",
      });
      setContext(next);
      setAnnouncement(next.announcement);
      setValidationVisible(false);
    },
    [context.fixture, context.requestRef],
  );

  const submitReply = useCallback(() => {
    if (context.currentState.actionability !== "live" || context.moreInfoThread.answerabilityState !== "answerable") {
      setAnnouncement("Reply is paused because the current projection is not answerable.");
      return;
    }
    if (replyText.trim().length < 8) {
      setValidationVisible(true);
      safeWindow()?.setTimeout(() => validationRef.current?.focus({ preventScroll: false }), 0);
      setAnnouncement("Reply needs a short answer before it can be reviewed.");
      return;
    }
    setReplySubmitted(true);
    setValidationVisible(false);
    setAnnouncement("Reply has been kept inside this request and is awaiting authoritative review.");
  }, [context.currentState.actionability, context.moreInfoThread.answerabilityState, replyText]);

  const primaryAction = useCallback(() => {
    if (context.routeKey === "status") {
      replaceContext(context.currentState.actionability === "live" ? "more_info" : "messages");
      return;
    }
    if (context.routeKey === "more_info") {
      submitReply();
      return;
    }
    if (context.routeKey === "callback") {
      replaceContext(context.currentState.actionability === "recovery_required" ? "recovery" : "messages");
      return;
    }
    if (context.routeKey === "messages") {
      replaceContext(context.currentState.actionability === "live" ? "more_info" : "status");
      return;
    }
    replaceContext("status");
  }, [context.currentState.actionability, context.routeKey, replaceContext, submitReply]);

  const secondaryAction = useCallback(() => {
    replaceContext("status");
  }, [replaceContext]);

  return {
    context,
    replyText,
    replySubmitted,
    validationVisible,
    validationRef,
    announcement,
    setReplyText,
    navigate: replaceContext,
    primaryAction,
    secondaryAction,
  };
}

function statusToneClass(tone: string): string {
  return `embedded-request-status--${tone}`;
}

export function EmbeddedRequestStateRibbon({ context }: { readonly context: EmbeddedRequestStatusContext }) {
  return (
    <div
      className={`embedded-request-status__ribbon ${statusToneClass(context.requestDetail.statusRibbon.tone)}`}
      role="status"
      data-testid="EmbeddedRequestStateRibbon"
      data-actionability={context.currentState.actionability}
    >
      <span>{context.currentState.stateLabel}</span>
      <small>{context.requestDetail.statusRibbon.freshnessLabel}</small>
    </div>
  );
}

export function EmbeddedRequestHeaderSummary({ context }: { readonly context: EmbeddedRequestStatusContext }) {
  return (
    <section
      className="embedded-request-status__summary"
      aria-labelledby="embedded-request-summary-title"
      data-testid="EmbeddedRequestHeaderSummary"
      data-request-ref={context.requestRef}
    >
      <div className="embedded-request-status__summary-top">
        <div>
          <span className="embedded-request-status__eyebrow">Request status</span>
          <h1 id="embedded-request-summary-title">{context.currentState.title}</h1>
        </div>
        <EmbeddedRequestStateRibbon context={context} />
      </div>
      <p>{context.currentState.body}</p>
      <dl className="embedded-request-status__summary-facts">
        <div>
          <dt>Request</dt>
          <dd>{context.requestDetail.summary.displayLabel}</dd>
        </div>
        <div>
          <dt>Next safe action</dt>
          <dd>{context.currentState.nextActionLabel}</dd>
        </div>
        <div>
          <dt>Truth</dt>
          <dd>{context.requestDetail.statusRibbon.canonicalTruthRef}</dd>
        </div>
      </dl>
    </section>
  );
}

export function EmbeddedRequestStatusTimeline({ context }: { readonly context: EmbeddedRequestStatusContext }) {
  return (
    <section
      className="embedded-request-status__timeline"
      aria-labelledby="embedded-request-timeline-title"
      data-testid="EmbeddedRequestStatusTimeline"
      data-selected-anchor={context.continuityEvidence.selectedAnchorRef}
    >
      <div className="embedded-request-status__section-heading">
        <span className="embedded-request-status__eyebrow">Timeline</span>
        <h2 id="embedded-request-timeline-title">What is happening</h2>
      </div>
      <ol>
        {context.timeline.map((item) => (
          <li key={item.key} data-tone={item.tone}>
            <span aria-hidden="true" />
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <small>
                {item.stateLabel} · {item.projectionRef}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function EmbeddedMoreInfoDueCard({ context }: { readonly context: EmbeddedRequestStatusContext }) {
  return (
    <aside
      className="embedded-request-status__due"
      aria-label="More information due window"
      data-testid="EmbeddedMoreInfoDueCard"
      data-surface-state={context.moreInfoStatus.surfaceState}
    >
      <strong>Reply window</strong>
      <span>{new Date(context.moreInfoStatus.dueAt).toLocaleString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}</span>
      <p>{context.conversationBundle.parity.cycleDispositionLabel.replaceAll("_", " ")}</p>
    </aside>
  );
}

export function EmbeddedRequestRecoveryBanner({ context }: { readonly context: EmbeddedRequestStatusContext }) {
  if (!context.recoveryBanner.visible) return null;
  return (
    <section
      className="embedded-request-status__recovery"
      aria-labelledby="embedded-request-recovery-title"
      data-testid="EmbeddedRequestRecoveryBanner"
      data-continuity-state={context.continuityEvidence.sameShellState}
    >
      <div>
        <span className="embedded-request-status__eyebrow">Recovery</span>
        <h2 id="embedded-request-recovery-title">{context.recoveryBanner.title}</h2>
        <p>{context.recoveryBanner.body}</p>
      </div>
    </section>
  );
}

export function EmbeddedMoreInfoResponseFlow({
  context,
  replyText,
  replySubmitted,
  validationVisible,
  validationRef,
  onReplyChange,
}: {
  readonly context: EmbeddedRequestStatusContext;
  readonly replyText: string;
  readonly replySubmitted: boolean;
  readonly validationVisible: boolean;
  readonly validationRef: React.RefObject<HTMLDivElement | null>;
  readonly onReplyChange: (value: string) => void;
}) {
  const answerable =
    context.currentState.actionability === "live" && context.moreInfoThread.answerabilityState === "answerable";
  return (
    <section
      className="embedded-request-status__panel"
      aria-labelledby="embedded-more-info-title"
      data-testid="EmbeddedMoreInfoResponseFlow"
      data-answerability={context.moreInfoThread.answerabilityState}
    >
      <div className="embedded-request-status__section-heading">
        <span className="embedded-request-status__eyebrow">More information</span>
        <h2 id="embedded-more-info-title">{context.moreInfoThread.threadTitle}</h2>
      </div>
      <EmbeddedMoreInfoDueCard context={context} />
      <div
        className="embedded-request-status__validation"
        role="alert"
        aria-atomic="true"
        tabIndex={-1}
        ref={validationRef}
        data-testid="EmbeddedMoreInfoValidation"
        hidden={!validationVisible}
      >
        <strong>There is a problem</strong>
        <a href="#embedded-more-info-reply">Enter a short reply before continuing.</a>
      </div>
      {replySubmitted ? (
        <div className="embedded-request-status__submitted" role="status" data-testid="EmbeddedMoreInfoSubmitted">
          <strong>Reply held for review</strong>
          <p>It remains inside this request while authoritative settlement catches up.</p>
        </div>
      ) : (
        <label className="embedded-request-status__reply-field" htmlFor="embedded-more-info-reply">
          <span>{context.moreInfoThread.promptSteps[0]?.question ?? "Add your reply"}</span>
          <small>{context.moreInfoThread.promptSteps[0]?.hint ?? "Keep it short and specific."}</small>
          <textarea
            id="embedded-more-info-reply"
            value={replyText}
            rows={4}
            disabled={!answerable}
            aria-describedby="embedded-more-info-reply-hint"
            onChange={(event) => onReplyChange(event.currentTarget.value)}
          />
          <em id="embedded-more-info-reply-hint">
            {answerable
              ? "The reply control is live because PatientMoreInfoStatusProjection is answerable."
              : "Reply is paused by the current projection."}
          </em>
        </label>
      )}
    </section>
  );
}

export function EmbeddedCallbackStatusCard({ context }: { readonly context: EmbeddedRequestStatusContext }) {
  return (
    <section
      className="embedded-request-status__panel"
      aria-labelledby="embedded-callback-title"
      data-testid="EmbeddedCallbackStatusCard"
      data-callback-state={context.callbackStatus.patientVisibleState}
      data-window-risk={context.callbackStatus.windowRiskState}
    >
      <div className="embedded-request-status__section-heading">
        <span className="embedded-request-status__eyebrow">Callback</span>
        <h2 id="embedded-callback-title">
          {context.callbackStatus.windowRiskState === "repair_required"
            ? "Check contact route before callback"
            : "Callback is expected"}
        </h2>
      </div>
      <p>
        {context.callbackStatus.windowRiskState === "repair_required"
          ? "Contact route repair pauses reply and callback controls without hiding the request summary."
          : "The callback promise is kept in the same request timeline."}
      </p>
      <dl className="embedded-request-status__compact-list">
        <div>
          <dt>Visible state</dt>
          <dd>{context.callbackStatus.patientVisibleState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Window risk</dt>
          <dd>{context.callbackStatus.windowRiskState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Envelope</dt>
          <dd>{context.callbackStatus.callbackExpectationEnvelopeRef}</dd>
        </div>
      </dl>
    </section>
  );
}

export function EmbeddedConversationPreviewRow({
  cluster,
}: {
  readonly cluster: EmbeddedRequestStatusContext["conversationCluster"];
}) {
  return (
    <article
      className="embedded-request-status__message-row"
      data-testid="EmbeddedConversationPreviewRow"
      data-preview-state={cluster.previewDigest.state}
    >
      <div>
        <strong>{cluster.previewDigest.title}</strong>
        <p>{cluster.previewDigest.preview}</p>
      </div>
      <span>{cluster.previewDigest.updatedLabel}</span>
    </article>
  );
}

export function EmbeddedConversationCluster({ context }: { readonly context: EmbeddedRequestStatusContext }) {
  return (
    <section
      className="embedded-request-status__panel"
      aria-labelledby="embedded-conversation-title"
      data-testid="EmbeddedConversationCluster"
      data-cluster-ref={context.conversationCluster.clusterRef}
      data-reply-needed={context.conversationPreview.replyNeededState}
    >
      <div className="embedded-request-status__section-heading">
        <span className="embedded-request-status__eyebrow">Messages</span>
        <h2 id="embedded-conversation-title">Request conversation</h2>
      </div>
      <EmbeddedConversationPreviewRow cluster={context.conversationCluster} />
      <dl className="embedded-request-status__compact-list">
        <div>
          <dt>Receipt</dt>
          <dd>{context.receiptEnvelope.receiptLabel}</dd>
        </div>
        <div>
          <dt>Settlement</dt>
          <dd>{context.commandSettlement.authoritativeOutcomeState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
    </section>
  );
}

export function EmbeddedRequestAnchorPreserver({ context }: { readonly context: EmbeddedRequestStatusContext }) {
  return (
    <aside
      className="embedded-request-status__anchor"
      aria-label="Request continuity"
      data-testid="EmbeddedRequestAnchorPreserver"
      data-selected-anchor={context.continuityEvidence.selectedAnchorRef}
      data-shell-continuity-key={context.continuityEvidence.shellContinuityKey}
    >
      <span className="embedded-request-status__eyebrow">Same shell</span>
      <strong>{context.continuityEvidence.selectedAnchorRef}</strong>
      <p>{context.continuityEvidence.evidenceRef}</p>
    </aside>
  );
}

export function EmbeddedRequestActionReserve({
  context,
  onPrimary,
  onSecondary,
}: {
  readonly context: EmbeddedRequestStatusContext;
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
}) {
  const disabled = context.currentState.actionability === "frozen";
  return (
    <aside
      className="embedded-request-status__action-reserve"
      aria-label="Request actions"
      data-testid="EmbeddedRequestActionReserve"
      data-actionability={context.currentState.actionability}
    >
      <button type="button" className="embedded-request-status__primary-action" onClick={onPrimary} disabled={disabled}>
        {context.primaryActionLabel}
      </button>
      {context.secondaryActionLabel ? (
        <button type="button" className="embedded-request-status__secondary-action" onClick={onSecondary}>
          {context.secondaryActionLabel}
        </button>
      ) : null}
    </aside>
  );
}

function EmbeddedRequestRouteBody({
  controller,
}: {
  readonly controller: ReturnType<typeof useEmbeddedRequestStatusController>;
}) {
  const { context } = controller;
  if (context.routeKey === "more_info") {
    return (
      <EmbeddedMoreInfoResponseFlow
        context={context}
        replyText={controller.replyText}
        replySubmitted={controller.replySubmitted}
        validationVisible={controller.validationVisible}
        validationRef={controller.validationRef}
        onReplyChange={controller.setReplyText}
      />
    );
  }
  if (context.routeKey === "callback" || context.routeKey === "recovery") {
    return (
      <>
        <EmbeddedCallbackStatusCard context={context} />
        <EmbeddedConversationCluster context={context} />
      </>
    );
  }
  if (context.routeKey === "messages") {
    return <EmbeddedConversationCluster context={context} />;
  }
  return (
    <>
      <EmbeddedMoreInfoDueCard context={context} />
      <EmbeddedConversationCluster context={context} />
      <EmbeddedCallbackStatusCard context={context} />
    </>
  );
}

export function EmbeddedRequestStatusFrame({
  context,
  children,
}: {
  readonly context: EmbeddedRequestStatusContext;
  readonly children: ReactNode;
}) {
  return (
    <main
      className="token-foundation embedded-request-status"
      data-testid="EmbeddedRequestStatusFrame"
      data-task-id={context.taskId}
      data-visual-mode={context.visualMode}
      data-route-key={context.routeKey}
      data-request-ref={context.requestRef}
      data-selected-anchor={context.continuityEvidence.selectedAnchorRef}
      data-continuity-state={context.continuityEvidence.sameShellState}
    >
      {children}
    </main>
  );
}

export function EmbeddedRequestStatusApp() {
  const controller = useEmbeddedRequestStatusController();
  const { context } = controller;
  return (
    <EmbeddedRequestStatusFrame context={context}>
      <div className="embedded-request-status__shell">
        <header className="embedded-request-status__masthead" role="banner" data-testid="EmbeddedRequestMasthead">
          <div>
            <span className="embedded-request-status__eyebrow">NHS App request</span>
            <h1>{context.requestDetail.summary.displayLabel}</h1>
            <p>{context.requestDetail.summary.updatedLabel}</p>
          </div>
          <nav aria-label="Request views" className="embedded-request-status__tabs">
            {(["status", "more_info", "callback", "messages"] as const).map((routeKey) => (
              <button
                key={routeKey}
                type="button"
                aria-current={context.routeKey === routeKey ? "page" : undefined}
                data-active={context.routeKey === routeKey ? "true" : "false"}
                onClick={() => controller.navigate(routeKey)}
              >
                {routeKey.replace("_", " ")}
              </button>
            ))}
          </nav>
        </header>
        <EmbeddedRequestHeaderSummary context={context} />
        <EmbeddedRequestRecoveryBanner context={context} />
        <EmbeddedRequestAnchorPreserver context={context} />
        <EmbeddedRequestStatusTimeline context={context} />
        <EmbeddedRequestRouteBody controller={controller} />
      </div>
      <EmbeddedRequestActionReserve
        context={context}
        onPrimary={controller.primaryAction}
        onSecondary={controller.secondaryAction}
      />
      <div className="embedded-request-status__live" aria-live="polite" data-testid="EmbeddedRequestLiveRegion">
        {controller.announcement}
      </div>
    </EmbeddedRequestStatusFrame>
  );
}

export default EmbeddedRequestStatusApp;
