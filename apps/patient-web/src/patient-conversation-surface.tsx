import { startTransition, useEffect, useRef, useState, type ReactNode } from "react";
import { resolvePhase3PatientWorkspaceConversationBundleByRequestRef } from "@vecells/domain-kernel";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";
import { CasePulsePanel, PatientShellFrame, RequestLineageStrip } from "./patient-home-requests-detail-routes";
import {
  PATIENT_CONVERSATION_CONTINUITY_STORAGE_KEY,
  PATIENT_CONVERSATION_RETURN_STORAGE_KEY,
  PATIENT_CONVERSATION_SURFACE_TASK_ID,
  PATIENT_CONVERSATION_SURFACE_VISUAL_MODE,
  isPatientConversationPath,
  resolvePatientConversationEntry,
  type PatientConversationContinuityRecord,
  type PatientConversationDominantAction,
  type PatientConversationEntryProjection,
  type PatientConversationRouteKey,
  type PatientConversationScenario,
} from "./patient-conversation-surface.model";

export { isPatientConversationPath };

type MoreInfoErrors = Record<string, string>;

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function readContinuity(): PatientConversationContinuityRecord | null {
  const raw = safeWindow()?.sessionStorage.getItem(PATIENT_CONVERSATION_CONTINUITY_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PatientConversationContinuityRecord;
    return parsed.projectionName === "PatientConversationContinuityRecord" ? parsed : null;
  } catch {
    return null;
  }
}

function writeContinuity(continuity: PatientConversationContinuityRecord): void {
  safeWindow()?.sessionStorage.setItem(
    PATIENT_CONVERSATION_CONTINUITY_STORAGE_KEY,
    JSON.stringify(continuity),
  );
}

function writeReturnBundle(entry: PatientConversationEntryProjection): void {
  safeWindow()?.sessionStorage.setItem(
    PATIENT_CONVERSATION_RETURN_STORAGE_KEY,
    JSON.stringify(entry.returnBundle),
  );
}

function pathFor(requestRef: string, routeKey: PatientConversationRouteKey): string {
  switch (routeKey) {
    case "conversation_more_info":
      return `/requests/${requestRef}/conversation/more-info`;
    case "conversation_callback":
      return `/requests/${requestRef}/conversation/callback`;
    case "conversation_messages":
      return `/requests/${requestRef}/conversation/messages`;
    case "conversation_repair":
      return `/requests/${requestRef}/conversation/repair`;
    default:
      return `/requests/${requestRef}/conversation`;
  }
}

function defaultAnchorForRoute(
  requestRef: string,
  routeKey: PatientConversationRouteKey,
): string {
  const bundle = resolvePhase3PatientWorkspaceConversationBundleByRequestRef({
    requestRef: requestRef === "request_215_callback" ? requestRef : "request_211_a",
    routeKey,
  });
  switch (routeKey) {
    case "conversation_callback":
      return bundle.routeDefaults.callbackAnchorRef;
    case "conversation_messages":
      return bundle.routeDefaults.messagesAnchorRef;
    case "conversation_repair":
      return bundle.routeDefaults.repairAnchorRef;
    case "conversation_overview":
      return bundle.routeDefaults.overviewAnchorRef;
    default:
      return bundle.routeDefaults.moreInfoAnchorRef;
  }
}

function buildSearch(
  scenario: PatientConversationScenario,
  origin: PatientConversationEntryProjection["origin"],
  anchorRef: string,
): string {
  const search = new URLSearchParams();
  search.set("state", scenario);
  if (origin === "messages") {
    search.set("origin", origin);
  }
  if (anchorRef) {
    search.set("anchor", anchorRef);
  }
  return `?${search.toString()}`;
}

function Icon({
  name,
}: {
  name: "conversation" | "reply" | "callback" | "message" | "repair" | "return" | "status";
}) {
  return (
    <span
      className={`patient-conversation__icon patient-conversation__icon--${name}`}
      aria-hidden
    />
  );
}

function usePatientConversationController() {
  const ownerWindow = safeWindow();
  const initialContinuity = readContinuity();
  const [entry, setEntry] = useState<PatientConversationEntryProjection>(() =>
    resolvePatientConversationEntry({
      pathname: ownerWindow?.location.pathname ?? "/requests/request_211_a/conversation",
      search: ownerWindow?.location.search,
      continuity: initialContinuity,
    }),
  );
  const [announcement, setAnnouncement] = useState("Patient conversation route loaded.");
  const [moreInfoErrors, setMoreInfoErrors] = useState<MoreInfoErrors>({});
  const routeHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    writeContinuity(entry.continuity);
    writeReturnBundle(entry);
  }, [entry]);

  useEffect(() => {
    const onPopState = () => {
      const continuity = readContinuity();
      if (!isPatientConversationPath(ownerWindow?.location.pathname ?? "")) {
        ownerWindow?.location.reload();
        return;
      }
      startTransition(() => {
        const next = resolvePatientConversationEntry({
          pathname: ownerWindow?.location.pathname ?? "/requests/request_211_a/conversation",
          search: ownerWindow?.location.search,
          continuity,
        });
        setEntry(next);
        setAnnouncement(`${next.routeTitle} restored.`);
      });
    };
    ownerWindow?.addEventListener("popstate", onPopState);
    return () => ownerWindow?.removeEventListener("popstate", onPopState);
  }, [ownerWindow]);

  useEffect(() => {
    const anchor = safeDocument()?.querySelector<HTMLElement>(
      `[data-anchor-ref='${entry.continuity.anchorRef}']`,
    );
    if (anchor) {
      anchor.focus({ preventScroll: true });
      return;
    }
    const field = safeDocument()?.getElementById(entry.continuity.anchorRef) as HTMLElement | null;
    if (field) {
      field.focus({ preventScroll: true });
      return;
    }
    routeHeadingRef.current?.focus({ preventScroll: true });
  }, [entry.pathname, entry.continuity.anchorRef, entry.continuity.moreInfoStage]);

  function commit(next: PatientConversationEntryProjection, replace = false): void {
    setEntry(next);
    if (replace) {
      ownerWindow?.history.replaceState({}, "", `${next.pathname}${buildSearch(next.scenario, next.origin, next.continuity.anchorRef)}`);
    } else {
      ownerWindow?.history.pushState({}, "", `${next.pathname}${buildSearch(next.scenario, next.origin, next.continuity.anchorRef)}`);
    }
  }

  function navigateConversation(
    routeKey: PatientConversationRouteKey,
    options?: {
      readonly anchorRef?: string;
      readonly scenario?: PatientConversationScenario;
      readonly repairApplied?: boolean;
    },
    replace = false,
  ): void {
    const anchorRef = options?.anchorRef ?? entry.continuity.anchorRef;
    const scenario = options?.scenario ?? entry.scenario;
    const continuity: PatientConversationContinuityRecord = {
      ...entry.continuity,
      routeKey,
      scenario,
      anchorRef,
      repairApplied: options?.repairApplied ?? entry.continuity.repairApplied,
    };
    const pathname = pathFor(entry.requestRef, routeKey);
    startTransition(() => {
      const next = resolvePatientConversationEntry({
        pathname,
        search: buildSearch(scenario, entry.origin, anchorRef),
        continuity,
      });
      commit(next, replace);
      setAnnouncement(`${next.routeTitle} opened.`);
    });
  }

  function leaveConversation(pathname: string): void {
    writeReturnBundle(entry);
    ownerWindow?.location.assign(pathname);
  }

  function navigateShellPath(pathname: string): void {
    writeReturnBundle(entry);
    if (pathname.startsWith("#")) {
      returnToOrigin();
      return;
    }
    ownerWindow?.location.assign(pathname);
  }

  function updateMoreInfoAnswer(promptRef: string, value: string): void {
    const next: PatientConversationContinuityRecord = {
      ...entry.continuity,
      anchorRef: promptRef,
      moreInfoAnswers: {
        ...entry.continuity.moreInfoAnswers,
        [promptRef]: value,
      },
    };
    const nextEntry = resolvePatientConversationEntry({
      pathname: entry.pathname,
      search: buildSearch(entry.scenario, entry.origin, promptRef),
      continuity: next,
    });
    commit(nextEntry, true);
  }

  function continueMoreInfo(): void {
    const errors: MoreInfoErrors = {};
    for (const step of entry.moreInfoThread.promptSteps) {
      if (!entry.continuity.moreInfoAnswers[step.promptRef]?.trim()) {
        errors[step.promptRef] = `Enter ${step.label.toLowerCase()}.`;
      }
    }
    setMoreInfoErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstPromptRef = Object.keys(errors)[0];
      if (firstPromptRef) {
        navigateConversation("conversation_more_info", { anchorRef: firstPromptRef }, true);
      }
      setAnnouncement("Check the missing answer before you continue.");
      return;
    }
    const next: PatientConversationContinuityRecord = {
      ...entry.continuity,
      moreInfoStage: "check",
      anchorRef: "more_info_check_summary",
    };
    const nextEntry = resolvePatientConversationEntry({
      pathname: entry.pathname,
      search: buildSearch(entry.scenario, entry.origin, "more_info_check_summary"),
      continuity: next,
    });
    setMoreInfoErrors({});
    commit(nextEntry, true);
    setAnnouncement("Check your reply before you send it.");
  }

  function sendMoreInfo(): void {
    const next: PatientConversationContinuityRecord = {
      ...entry.continuity,
      moreInfoStage: "sent",
      anchorRef: "more_info_receipt_panel",
    };
    const nextEntry = resolvePatientConversationEntry({
      pathname: entry.pathname,
      search: buildSearch(entry.scenario, entry.origin, "more_info_receipt_panel"),
      continuity: next,
    });
    commit(nextEntry, true);
    setAnnouncement("Your reply is saved in the conversation.");
  }

  function editMoreInfo(): void {
    const anchorRef = defaultAnchorForRoute(entry.requestRef, "conversation_more_info");
    const next: PatientConversationContinuityRecord = {
      ...entry.continuity,
      moreInfoStage: "draft",
      anchorRef,
    };
    const nextEntry = resolvePatientConversationEntry({
      pathname: entry.pathname,
      search: buildSearch(entry.scenario, entry.origin, anchorRef),
      continuity: next,
    });
    commit(nextEntry, true);
    setAnnouncement("You can edit your reply.");
  }

  function updateMessageDraft(value: string): void {
    const next: PatientConversationContinuityRecord = {
      ...entry.continuity,
      anchorRef: "message_reply_field",
      messageDraft: value,
    };
    const nextEntry = resolvePatientConversationEntry({
      pathname: entry.pathname,
      search: buildSearch(entry.scenario, entry.origin, "message_reply_field"),
      continuity: next,
    });
    commit(nextEntry, true);
  }

  function sendMessageReply(): void {
    if (!entry.continuity.messageDraft.trim()) {
      setAnnouncement("Enter your update before you send it.");
      return;
    }
    const next: PatientConversationContinuityRecord = {
      ...entry.continuity,
      anchorRef: "subthread_266_local_pending",
      messageLocalAckState: "pending",
    };
    const nextEntry = resolvePatientConversationEntry({
      pathname: entry.pathname,
      search: buildSearch(entry.scenario, entry.origin, "subthread_266_local_pending"),
      continuity: next,
    });
    commit(nextEntry, true);
    setAnnouncement("Your message reply is saved and waiting for review.");
  }

  function applyRepair(): void {
    const anchorRef = defaultAnchorForRoute(entry.requestRef, "conversation_repair");
    const next: PatientConversationContinuityRecord = {
      ...entry.continuity,
      repairApplied: true,
      anchorRef,
    };
    const nextEntry = resolvePatientConversationEntry({
      pathname: pathFor(entry.requestRef, "conversation_repair"),
      search: buildSearch("repair", entry.origin, anchorRef),
      continuity: next,
    });
    commit(nextEntry, true);
    setAnnouncement("We are checking the updated contact route.");
  }

  function returnToOrigin(): void {
    leaveConversation(entry.returnRouteRef);
  }

  function performDominantAction(action: PatientConversationDominantAction): void {
    switch (action) {
      case "open_more_info_reply":
        navigateConversation("conversation_more_info", {
          anchorRef: defaultAnchorForRoute(entry.requestRef, "conversation_more_info"),
        });
        return;
      case "send_more_info_reply":
        sendMoreInfo();
        return;
      case "check_callback_status":
        navigateConversation("conversation_callback", {
          anchorRef: defaultAnchorForRoute(entry.requestRef, "conversation_callback"),
        });
        return;
      case "read_message_update":
        navigateConversation("conversation_messages", {
          anchorRef: defaultAnchorForRoute(entry.requestRef, "conversation_messages"),
        });
        return;
      case "repair_contact_route":
        navigateConversation("conversation_repair", {
          anchorRef: defaultAnchorForRoute(entry.requestRef, "conversation_repair"),
          scenario: "repair",
        });
        return;
      case "complete_step_up":
        navigateConversation("conversation_messages", {
          anchorRef: defaultAnchorForRoute(entry.requestRef, "conversation_messages"),
          scenario: "live",
        });
        return;
      case "recover_in_same_shell":
        navigateConversation(entry.routeKey, {
          anchorRef: entry.continuity.anchorRef,
          scenario: "live",
        });
        return;
      case "return_to_messages":
      case "return_to_request":
        returnToOrigin();
        return;
      default:
        return;
    }
  }

  return {
    entry,
    announcement,
    routeHeadingRef,
    moreInfoErrors,
    navigateConversation,
    returnToOrigin,
    updateMoreInfoAnswer,
    continueMoreInfo,
    sendMoreInfo,
    editMoreInfo,
    updateMessageDraft,
    sendMessageReply,
    applyRepair,
    performDominantAction,
    navigateShellPath,
  };
}

function ConversationHero({
  entry,
  onReturn,
}: {
  entry: PatientConversationEntryProjection;
  onReturn: () => void;
}) {
  return (
    <section className="patient-conversation__hero" data-testid="PatientConversationHero">
      <div className="patient-conversation__hero-topline">
        <button
          type="button"
          className="patient-conversation__return-button"
          data-testid="PatientConversationReturnButton"
          onClick={onReturn}
        >
          <Icon name="return" />
          <span>{entry.returnLabel}</span>
        </button>
        <span className={`patient-conversation__state patient-conversation__state--${entry.patientConversationState}`}>
          {entry.patientConversationState.replaceAll("_", " ")}
        </span>
      </div>
      <div className="patient-conversation__hero-copy">
        <div>
          <span className="patient-conversation__kicker">Conversation</span>
          <h2>{entry.routeTitle}</h2>
          <p>{entry.routeSummary}</p>
        </div>
        <div className="patient-conversation__summary-card">
          <span>What this page is doing</span>
          <strong>{entry.routeExplanation}</strong>
          <small>{entry.returnBundle.requestReturnBundleRef}</small>
        </div>
      </div>
    </section>
  );
}

function ConversationTabs({
  entry,
  onNavigate,
}: {
  entry: PatientConversationEntryProjection;
  onNavigate: (routeKey: PatientConversationRouteKey, anchorRef?: string) => void;
}) {
  const tabs: readonly {
    readonly key: PatientConversationRouteKey;
    readonly label: string;
    readonly icon: "conversation" | "reply" | "callback" | "message" | "repair";
  }[] = [
    { key: "conversation_overview", label: "Overview", icon: "conversation" },
    { key: "conversation_more_info", label: "More info", icon: "reply" },
    { key: "conversation_callback", label: "Callback", icon: "callback" },
    { key: "conversation_messages", label: "Messages", icon: "message" },
    { key: "conversation_repair", label: "Contact details", icon: "repair" },
  ];
  return (
    <nav
      className="patient-conversation__tabs"
      aria-label="Conversation sections"
      data-testid="PatientConversationSectionTabs"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          data-current={String(tab.key === entry.routeKey)}
          onClick={() => onNavigate(tab.key, defaultAnchorForRoute(entry.requestRef, tab.key))}
        >
          <Icon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ConversationOverview({
  entry,
  onNavigate,
}: {
  entry: PatientConversationEntryProjection;
  onNavigate: (routeKey: PatientConversationRouteKey, anchorRef?: string) => void;
}) {
  const cards = [
    {
      testId: "PatientConversationOverviewMoreInfo",
      heading: "Reply to the practice",
      body:
        entry.moreInfoStatus.surfaceState === "repair_required"
          ? "Your reply is paused until the contact route is checked."
          : entry.moreInfoStatus.surfaceState === "reply_submitted"
            ? "Your reply is saved and waiting for review."
            : "The practice needs one short update before review can continue.",
      action: "Open more info",
      onOpen: () => onNavigate("conversation_more_info", defaultAnchorForRoute(entry.requestRef, "conversation_more_info")),
    },
    {
      testId: "PatientConversationOverviewCallback",
      heading: "Callback status",
      body:
        entry.callbackStatus.surfaceState === "repair_required"
          ? "The callback is waiting for safer contact details."
          : "The callback plan is visible here without overpromising the outcome.",
      action: "Open callback",
      onOpen: () => onNavigate("conversation_callback", defaultAnchorForRoute(entry.requestRef, "conversation_callback")),
    },
    {
      testId: "PatientConversationOverviewMessages",
      heading: "Message updates",
      body:
        entry.composerLease.leaseState === "blocked"
          ? "The latest update is visible, but sending a reply is paused."
          : "The thread shows what changed and whether your reply is still pending review.",
      action: "Open messages",
      onOpen: () => onNavigate("conversation_messages", defaultAnchorForRoute(entry.requestRef, "conversation_messages")),
    },
  ];

  return (
    <section
      className="patient-conversation__overview"
      data-testid="PatientConversationOverview"
      data-anchor-ref="conversation_overview"
    >
      <div className="patient-conversation__overview-grid">
        {cards.map((card) => (
          <article key={card.testId} className="patient-conversation__overview-card" data-testid={card.testId}>
            <h3>{card.heading}</h3>
            <p>{card.body}</p>
            <button type="button" onClick={card.onOpen}>
              {card.action}
            </button>
          </article>
        ))}
      </div>
      {entry.blockedActionSummary ? (
        <section className="patient-conversation__notice" data-testid="PatientConversationBlockedSummary">
          <strong>Blocked action</strong>
          <p>{entry.blockedActionSummary}</p>
        </section>
      ) : null}
    </section>
  );
}

export function PatientMoreInfoReplySurface({
  entry,
  errors,
  onAnswer,
  onContinue,
  onEdit,
  onSend,
}: {
  entry: PatientConversationEntryProjection;
  errors: MoreInfoErrors;
  onAnswer: (promptRef: string, value: string) => void;
  onContinue: () => void;
  onEdit: () => void;
  onSend: () => void;
}) {
  const blocked =
    entry.moreInfoThread.answerabilityState !== "answerable" ||
    entry.patientConversationState === "stale_recoverable";
  return (
    <section
      className="patient-conversation__panel patient-conversation__panel--reply"
      data-testid="PatientMoreInfoReplySurface"
      data-anchor-ref="prompt_216_photo_timing"
    >
      <div className="patient-conversation__panel-header">
        <span className="patient-conversation__kicker">More information</span>
        <h3>Answer the question the practice still needs</h3>
        <p>
          {blocked
            ? "The question stays visible, but this reply is paused until the page says it is safe to continue."
            : "Keep your answer brief and factual. The practice uses it to continue this same request."}
        </p>
      </div>
      <div className="patient-conversation__window-band">
        <strong>{entry.moreInfoStatus.surfaceState.replaceAll("_", " ")}</strong>
        <span>Reply window checkpoint: {entry.moreInfoStatus.replyWindowCheckpointRef}</span>
      </div>
      {entry.continuity.moreInfoStage === "sent" ? (
        <div
          className="patient-conversation__receipt-card"
          data-testid="PatientMoreInfoReceiptPanel"
          data-anchor-ref="more_info_receipt_panel"
        >
          <h4>Your reply is waiting for review</h4>
          <p>
            We have kept your reply in this conversation. The practice still needs to review it before anything is confirmed.
          </p>
          <button type="button" onClick={onEdit}>
            Review your reply
          </button>
        </div>
      ) : entry.continuity.moreInfoStage === "check" ? (
        <div
          className="patient-conversation__check-panel"
          data-testid="PatientMoreInfoCheckPanel"
          data-anchor-ref="more_info_check_summary"
        >
          <h4>Check your reply</h4>
          <dl>
            {entry.moreInfoThread.promptSteps.map((step) => (
              <div key={step.promptRef}>
                <dt>{step.question}</dt>
                <dd>{entry.continuity.moreInfoAnswers[step.promptRef] || "No answer entered"}</dd>
              </div>
            ))}
          </dl>
          <div className="patient-conversation__button-row">
            <button type="button" className="patient-conversation__secondary" onClick={onEdit}>
              Edit reply
            </button>
            <button
              type="button"
              className="patient-conversation__primary"
              disabled={blocked}
              onClick={onSend}
            >
              Send reply
            </button>
          </div>
        </div>
      ) : (
        <div className="patient-conversation__question-stack">
          {entry.moreInfoThread.promptSteps.map((step, index) => (
            <label key={step.promptRef} className="patient-conversation__question-field">
              <span className="patient-conversation__question-index">Question {index + 1}</span>
              <strong>{step.question}</strong>
              <small>{step.hint}</small>
              {step.answerKind === "short_text" ? (
                <input
                  id={step.promptRef}
                  value={entry.continuity.moreInfoAnswers[step.promptRef] ?? ""}
                  disabled={blocked}
                  aria-invalid={Boolean(errors[step.promptRef])}
                  onChange={(event) => onAnswer(step.promptRef, event.currentTarget.value)}
                />
              ) : (
                <div className="patient-conversation__choice-list">
                  {step.options?.map((option) => (
                    <label key={option}>
                      <input
                        type="radio"
                        name={step.promptRef}
                        value={option}
                        disabled={blocked}
                        checked={entry.continuity.moreInfoAnswers[step.promptRef] === option}
                        onChange={(event) => onAnswer(step.promptRef, event.currentTarget.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors[step.promptRef] ? (
                <span className="patient-conversation__field-error">{errors[step.promptRef]}</span>
              ) : null}
            </label>
          ))}
          <div className="patient-conversation__button-row">
            <button
              type="button"
              className="patient-conversation__primary"
              disabled={blocked}
              onClick={onContinue}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function PatientCallbackStatusCard({
  entry,
  onRepair,
}: {
  entry: PatientConversationEntryProjection;
  onRepair: () => void;
}) {
  const needsRepair = entry.callbackStatus.surfaceState === "repair_required";
  return (
    <section
      className="patient-conversation__panel patient-conversation__panel--callback"
      data-testid="PatientCallbackStatusCard"
      data-anchor-ref="callback_status_rail"
    >
      <div className="patient-conversation__panel-header">
        <span className="patient-conversation__kicker">Callback</span>
        <h3>{needsRepair ? "We need to check your contact details first" : "Your callback plan"}</h3>
        <p>
          {needsRepair
            ? "The callback stays visible, but we will not promise it can continue until the route is safe."
            : "This card shows the current callback expectation and the latest safe status."}
        </p>
      </div>
      <dl className="patient-conversation__summary-grid">
        <div>
          <dt>Status</dt>
          <dd>{entry.callbackStatus.patientVisibleState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{entry.callbackStatus.windowRiskState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Route</dt>
          <dd>{entry.reachabilitySummary.summaryState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Expectation</dt>
          <dd>{entry.moreInfoStatus.requestRef}</dd>
        </div>
      </dl>
      {needsRepair ? (
        <button type="button" className="patient-conversation__primary" onClick={onRepair}>
          Check contact details
        </button>
      ) : null}
    </section>
  );
}

function ReceiptChip({ label }: { label: string }) {
  return <span className="patient-conversation__receipt-chip">{label}</span>;
}

export function PatientMessageThread({
  entry,
  onReplyChange,
  onReplySend,
  onSelectAnchor,
}: {
  entry: PatientConversationEntryProjection;
  onReplyChange: (value: string) => void;
  onReplySend: () => void;
  onSelectAnchor: (anchorRef: string) => void;
}) {
  const replyBlocked = entry.composerLease.leaseState !== "available";
  return (
    <section
      className="patient-conversation__panel patient-conversation__panel--thread"
      data-testid="PatientMessageThread"
    >
      <div className="patient-conversation__panel-header">
        <span className="patient-conversation__kicker">Message thread</span>
        <h3>{entry.activeCluster.previewDigest.title}</h3>
        <p>
          {replyBlocked
            ? "You can still read the update. Sending a reply is paused until the page says it is safe."
            : "This thread keeps local acknowledgement, delivery evidence, and final review separate."}
        </p>
      </div>
      <ol className="patient-conversation__timeline">
        {entry.subthreads.map((subthread) => (
          <li
            key={subthread.subthreadRef}
            id={subthread.subthreadRef}
            className="patient-conversation__timeline-event"
            data-testid={`PatientMessageEvent-${subthread.subthreadRef}`}
            data-anchor-ref={subthread.subthreadRef}
            tabIndex={-1}
          >
            <button type="button" className="patient-conversation__timeline-button" onClick={() => onSelectAnchor(subthread.subthreadRef)}>
              <time>{subthread.timestampLabel}</time>
              <div>
                <strong>{subthread.title}</strong>
                <p>{subthread.body}</p>
                <ReceiptChip label={entry.receiptEnvelope.receiptLabel} />
              </div>
            </button>
          </li>
        ))}
      </ol>
      <div className="patient-conversation__reply-box">
        <label htmlFor="message_reply_field">
          <strong>Reply in this thread</strong>
          <small>Keep it brief. This reply is not treated as finally delivered or reviewed yet.</small>
        </label>
        <textarea
          id="message_reply_field"
          data-anchor-ref="message_reply_field"
          value={entry.continuity.messageDraft}
          disabled={replyBlocked}
          onChange={(event) => onReplyChange(event.currentTarget.value)}
        />
        <div className="patient-conversation__button-row">
          <button
            type="button"
            className="patient-conversation__primary"
            disabled={replyBlocked}
            onClick={onReplySend}
          >
            Send reply
          </button>
        </div>
      </div>
    </section>
  );
}

export function PatientContactRepairPrompt({
  entry,
  onApplyRepair,
}: {
  entry: PatientConversationEntryProjection;
  onApplyRepair: () => void;
}) {
  const applied = entry.contactRepair.repairState === "applied";
  return (
    <section
      className="patient-conversation__panel patient-conversation__panel--repair"
      data-testid="PatientContactRepairPrompt"
      data-anchor-ref="contact_repair_prompt"
    >
      <div className="patient-conversation__panel-header">
        <span className="patient-conversation__kicker">Contact details</span>
        <h3>{applied ? "We are checking the updated route" : "Check the route we should use"}</h3>
        <p>
          {applied
            ? "Your blocked action stays visible while we confirm the updated route."
            : "Reply and callback are both tied to this route, so we need to check it before anything continues."}
        </p>
      </div>
      <dl className="patient-conversation__summary-grid">
        <div>
          <dt>Current route</dt>
          <dd>{entry.contactRepair.currentRouteRef.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Verification</dt>
          <dd>{entry.reachabilitySummary.verificationState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{entry.reachabilitySummary.deliveryRiskState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Blocked action</dt>
          <dd>{entry.contactRepair.dominantBlockedActionRef.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      <div className="patient-conversation__button-row">
        <button
          type="button"
          className="patient-conversation__primary"
          disabled={applied}
          onClick={onApplyRepair}
        >
          {applied ? "Checking route" : "Confirm contact details"}
        </button>
      </div>
    </section>
  );
}

export function PatientConversationReturnBridge({
  entry,
  onReturn,
}: {
  entry: PatientConversationEntryProjection;
  onReturn: () => void;
}) {
  return (
    <aside className="patient-conversation__panel patient-conversation__panel--return" data-testid="PatientConversationReturnBridge">
      <div className="patient-conversation__panel-header">
        <span className="patient-conversation__kicker">Return context</span>
        <h3>{entry.returnLabel}</h3>
        <p>The request anchor, selected route section, and same-shell continuity stay explicit.</p>
      </div>
      <dl className="patient-conversation__summary-grid">
        <div>
          <dt>Request</dt>
          <dd>{entry.returnBundle.requestRef}</dd>
        </div>
        <div>
          <dt>Anchor</dt>
          <dd>{entry.continuity.anchorRef}</dd>
        </div>
        <div>
          <dt>Bundle</dt>
          <dd>{entry.returnBundle.requestReturnBundleRef}</dd>
        </div>
        <div>
          <dt>Route</dt>
          <dd>{entry.returnRouteRef}</dd>
        </div>
      </dl>
      <button type="button" className="patient-conversation__secondary" onClick={onReturn}>
        {entry.returnLabel}
      </button>
    </aside>
  );
}

function WhatHappensNext({ steps }: { steps: readonly string[] }) {
  return (
    <aside className="patient-conversation__panel patient-conversation__panel--next" data-testid="PatientConversationNextSteps">
      <div className="patient-conversation__panel-header">
        <span className="patient-conversation__kicker">What happens next</span>
        <h3>Stay oriented</h3>
      </div>
      <ol className="patient-conversation__step-list">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </aside>
  );
}

function ConversationRouteLayout({
  entry,
  routeHeadingRef,
  announcement,
  onNavigate,
  onReturn,
  onAnswer,
  onContinue,
  onEdit,
  onSend,
  onReplyChange,
  onReplySend,
  onApplyRepair,
  onSelectAnchor,
  onDominantAction,
  onShellNavigate,
  errors,
}: {
  entry: PatientConversationEntryProjection;
  routeHeadingRef: React.RefObject<HTMLHeadingElement | null>;
  announcement: string;
  onNavigate: (routeKey: PatientConversationRouteKey, anchorRef?: string) => void;
  onReturn: () => void;
  onAnswer: (promptRef: string, value: string) => void;
  onContinue: () => void;
  onEdit: () => void;
  onSend: () => void;
  onReplyChange: (value: string) => void;
  onReplySend: () => void;
  onApplyRepair: () => void;
  onSelectAnchor: (anchorRef: string) => void;
  onDominantAction: (action: PatientConversationDominantAction) => void;
  onShellNavigate: (pathname: string) => void;
  errors: MoreInfoErrors;
}) {
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: entry.pathname,
  });
  const primaryStage: ReactNode =
    entry.routeKey === "conversation_more_info" ? (
      <PatientMoreInfoReplySurface
        entry={entry}
        errors={errors}
        onAnswer={onAnswer}
        onContinue={onContinue}
        onEdit={onEdit}
        onSend={onSend}
      />
    ) : entry.routeKey === "conversation_callback" ? (
      <PatientCallbackStatusCard entry={entry} onRepair={onApplyRepair} />
    ) : entry.routeKey === "conversation_messages" ? (
      <PatientMessageThread
        entry={entry}
        onReplyChange={onReplyChange}
        onReplySend={onReplySend}
        onSelectAnchor={onSelectAnchor}
      />
    ) : entry.routeKey === "conversation_repair" ? (
      <PatientContactRepairPrompt entry={entry} onApplyRepair={onApplyRepair} />
    ) : (
      <ConversationOverview entry={entry} onNavigate={onNavigate} />
    );

  return (
    <PatientShellFrame
      entry={entry.shellEntry}
      announcement={announcement}
      mainHeadingRef={routeHeadingRef}
      onNavigate={onShellNavigate}
    >
      <div
        className="patient-conversation"
        data-testid="PatientConversationRoute"
        data-task-id={PATIENT_CONVERSATION_SURFACE_TASK_ID}
        data-visual-mode={PATIENT_CONVERSATION_SURFACE_VISUAL_MODE}
        data-route-key={entry.routeKey}
        data-patient-conversation-state={entry.patientConversationState}
        data-request-return-bundle={entry.returnBundle.requestReturnBundleRef}
        data-callback-state={entry.callbackStatus.surfaceState}
        data-contact-repair-state={entry.contactRepair.repairState}
        data-dominant-patient-action={entry.dominantActionRef}
        data-shell-type="patient_request_shell"
        data-route-family="patient_conversation"
        data-continuity-key={entry.continuity.continuityEvidenceRef}
        data-route-anchor={entry.continuity.anchorRef}
        data-phase3-bundle-ref={entry.phase3ConversationBundleRef}
        data-staff-task-id={entry.phase3StaffTaskId}
        data-request-lineage-ref={entry.requestLineageRef}
        data-cluster-ref={entry.phase3ConversationClusterRef}
        data-thread-id={entry.phase3ConversationThreadId}
        data-reply-window-checkpoint={entry.phase3ReplyWindowCheckpointRef}
        data-more-info-cycle-ref={entry.phase3MoreInfoCycleRef}
        data-reminder-schedule-ref={entry.phase3ReminderScheduleRef}
        data-evidence-delta-packet-ref={entry.phase3EvidenceDeltaPacketRef}
        data-more-info-response-disposition-ref={entry.phase3MoreInfoResponseDispositionRef}
        data-conversation-settlement-ref={entry.phase3ConversationSettlementRef}
        data-secure-link-access-state={entry.phase3SecureLinkAccessState}
        data-due-state={entry.phase3DueState}
        data-reply-eligibility-state={entry.phase3ReplyEligibilityState}
        data-delivery-posture={entry.phase3DeliveryPosture}
        data-repair-posture={entry.phase3RepairPosture}
        data-phase3-parity-tuple={entry.phase3ParityTupleHash}
      >
        <PatientSupportPhase2Bridge context={phase2Context} />
        <ConversationHero entry={entry} onReturn={onReturn} />
        <ConversationTabs entry={entry} onNavigate={onNavigate} />
        <div className="patient-conversation__layout">
          <div className="patient-conversation__main-column">
            <RequestLineageStrip detail={entry.detail} />
            {primaryStage}
          </div>
          <aside className="patient-conversation__side-column">
            {entry.routeKey !== "conversation_callback" ? (
              <PatientCallbackStatusCard entry={entry} onRepair={onApplyRepair} />
            ) : null}
            {entry.routeKey !== "conversation_repair" || entry.patientConversationState !== "contact_repair" ? (
              <WhatHappensNext steps={entry.whatHappensNext} />
            ) : null}
            {entry.routeKey !== "conversation_repair" && entry.patientConversationState === "contact_repair" ? (
              <PatientContactRepairPrompt entry={entry} onApplyRepair={onApplyRepair} />
            ) : null}
            <PatientConversationReturnBridge entry={entry} onReturn={onReturn} />
            <CasePulsePanel detail={entry.detail} />
          </aside>
        </div>
        <div className="patient-conversation__dominant-bar" data-testid="PatientConversationDominantActionBar">
          <div>
            <strong>{entry.dominantActionLabel}</strong>
            <small>{entry.routeExplanation}</small>
          </div>
          <button
            type="button"
            className="patient-conversation__primary"
            onClick={() => onDominantAction(entry.dominantActionRef)}
          >
            {entry.dominantActionLabel}
          </button>
        </div>
      </div>
    </PatientShellFrame>
  );
}

export default function PatientConversationSurfaceApp() {
  const {
    entry,
    announcement,
    routeHeadingRef,
    moreInfoErrors,
    navigateConversation,
    returnToOrigin,
    updateMoreInfoAnswer,
    continueMoreInfo,
    sendMoreInfo,
    editMoreInfo,
    updateMessageDraft,
    sendMessageReply,
    applyRepair,
    performDominantAction,
    navigateShellPath,
  } = usePatientConversationController();

  return (
    <ConversationRouteLayout
      entry={entry}
      routeHeadingRef={routeHeadingRef}
      announcement={announcement}
      onNavigate={(routeKey, anchorRef) =>
        navigateConversation(routeKey, anchorRef ? { anchorRef } : undefined)
      }
      onReturn={returnToOrigin}
      onAnswer={updateMoreInfoAnswer}
      onContinue={continueMoreInfo}
      onEdit={editMoreInfo}
      onSend={sendMoreInfo}
      onReplyChange={updateMessageDraft}
      onReplySend={sendMessageReply}
      onApplyRepair={applyRepair}
      onSelectAnchor={(anchorRef) =>
        navigateConversation("conversation_messages", { anchorRef }, true)
      }
      onDominantAction={performDominantAction}
      onShellNavigate={navigateShellPath}
      errors={moreInfoErrors}
    />
  );
}
