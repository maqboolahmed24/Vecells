import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import {
  PATIENT_MORE_INFO_CALLBACK_REPAIR_TASK_ID,
  PATIENT_MORE_INFO_CALLBACK_REPAIR_VISUAL_MODE,
  isMoreInfoCallbackContactRepairPath,
  promptSteps216,
  resolveWorkflowEntry,
  type PatientCallbackStatusProjection,
  type PatientContactRepairProjection,
  type PatientMoreInfoResponseThreadProjection,
  type PatientMoreInfoStatusProjection,
  type PatientReachabilitySummaryProjection,
  type WorkflowEntryProjection,
} from "./patient-more-info-callback-contact-repair.model";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";

export { isMoreInfoCallbackContactRepairPath };

type AnswerState = Record<string, string>;
type ErrorState = Record<string, string>;

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function Icon({ name }: { name: "reply" | "callback" | "repair" | "return" | "success" }) {
  return <span className={`patient-workflow__icon patient-workflow__icon--${name}`} aria-hidden />;
}

function useWorkflowController() {
  const ownerWindow = safeWindow();
  const [entry, setEntry] = useState<WorkflowEntryProjection>(() =>
    resolveWorkflowEntry(ownerWindow?.location.pathname ?? "/requests/request_211_a/more-info"),
  );
  const [answers, setAnswers] = useState<AnswerState>({
    prompt_216_photo_timing: "",
    prompt_216_symptom_change: "",
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [announcement, setAnnouncement] = useState("More-info workflow loaded.");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPopState = () => {
      startTransition(() => {
        const next = resolveWorkflowEntry(ownerWindow?.location.pathname ?? entry.pathname);
        setEntry(next);
        setAnnouncement(`${next.routeKey.replaceAll("_", " ")} restored.`);
      });
    };
    ownerWindow?.addEventListener("popstate", onPopState);
    return () => ownerWindow?.removeEventListener("popstate", onPopState);
  }, [entry.pathname, ownerWindow]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [entry.routeKey]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      errorSummaryRef.current?.focus({ preventScroll: true });
    }
  }, [errors]);

  function navigate(pathname: string, replace = false): void {
    if (!isMoreInfoCallbackContactRepairPath(pathname)) {
      if (replace) {
        ownerWindow?.location.replace(pathname);
      } else {
        ownerWindow?.location.assign(pathname);
      }
      return;
    }
    startTransition(() => {
      const next = resolveWorkflowEntry(pathname);
      setEntry(next);
      setErrors({});
      if (replace) {
        ownerWindow?.history.replaceState({}, "", pathname);
      } else {
        ownerWindow?.history.pushState({}, "", pathname);
      }
      setAnnouncement(`${next.routeKey.replaceAll("_", " ")} opened.`);
    });
  }

  function updateAnswer(promptRef: string, value: string): void {
    setAnswers((current) => ({ ...current, [promptRef]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[promptRef];
      return next;
    });
  }

  function validateActiveStep(): boolean {
    const step = promptSteps216[entry.moreInfoThread.currentStepIndex] ?? promptSteps216[0];
    if (!step) return true;
    if (step.required && !answers[step.promptRef]?.trim()) {
      setErrors({ [step.promptRef]: "Enter an answer before continuing." });
      setAnnouncement("Answer needed before this step can continue.");
      return false;
    }
    return true;
  }

  function continueStep(): void {
    if (!validateActiveStep()) return;
    if (entry.moreInfoThread.currentStepIndex === 0) {
      navigate(`/requests/${entry.requestRef}/more-info/step-2`);
      return;
    }
    navigate(`/requests/${entry.requestRef}/more-info/check`);
  }

  function submitAnswers(): void {
    const nextErrors: ErrorState = {};
    for (const step of promptSteps216) {
      if (step.required && !answers[step.promptRef]?.trim()) {
        nextErrors[step.promptRef] = "Enter an answer before sending.";
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setAnnouncement("Check the answers that need repair.");
      return;
    }
    navigate(`/requests/${entry.requestRef}/more-info/confirmation`, true);
  }

  function applyRepair(): void {
    navigate("/contact-repair/repair_216_sms/applied", true);
  }

  return {
    entry,
    answers,
    errors,
    announcement,
    headingRef,
    errorSummaryRef,
    navigate,
    updateAnswer,
    continueStep,
    submitAnswers,
    applyRepair,
  };
}

function WorkflowShell({
  entry,
  headingRef,
  announcement,
  children,
  onNavigate,
}: {
  entry: WorkflowEntryProjection;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  announcement: string;
  children: ReactNode;
  onNavigate: (pathname: string) => void;
}) {
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: entry.pathname,
  });

  return (
    <div
      className="patient-workflow"
      data-testid="More_Info_Callback_Contact_Repair_Route"
      data-task-id={PATIENT_MORE_INFO_CALLBACK_REPAIR_TASK_ID}
      data-visual-mode={PATIENT_MORE_INFO_CALLBACK_REPAIR_VISUAL_MODE}
      data-route-key={entry.routeKey}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-cause-class={phase2Context.causeClass}
      data-recovery-class={phase2Context.recoveryClass}
      data-canonical-status-label={phase2Context.canonicalStatusLabel}
      data-supported-testids="more-info-thread-frame prompt-step-card reply-window-band check-answers-panel submission-receipt-panel callback-status-rail contact-repair-bridge blocked-action-summary-card continuity-preserved-panel"
    >
      <header className="patient-workflow__top-band" data-testid="workflow-top-band">
        <button
          type="button"
          className="patient-workflow__brand"
          onClick={() => onNavigate("/home")}
        >
          <span>
            <VecellLogoWordmark aria-hidden="true" className="patient-workflow__brand-wordmark" />
            <small>{entry.maskedPatientRef}</small>
          </span>
        </button>
        <nav aria-label="Workflow navigation" className="patient-workflow__nav">
          <button type="button" onClick={() => onNavigate(`/requests/${entry.requestRef}`)}>
            <Icon name="return" />
            <span>Request</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate(`/requests/${entry.requestRef}/more-info`)}
          >
            <Icon name="reply" />
            <span>More info</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate(`/requests/${entry.requestRef}/callback`)}
          >
            <Icon name="callback" />
            <span>Callback</span>
          </button>
        </nav>
      </header>
      <PatientSupportPhase2Bridge context={phase2Context} />
      <main className="patient-workflow__main">
        <h1 ref={headingRef} tabIndex={-1} className="patient-workflow__route-title">
          {entry.routeKey === "callback_status" || entry.routeKey === "callback_at_risk"
            ? "Callback status"
            : entry.routeKey === "contact_repair" || entry.routeKey === "contact_repair_applied"
              ? "Repair contact route"
              : "Reply to more information"}
        </h1>
        {children}
      </main>
      <div className="patient-workflow__live" aria-live="polite" data-testid="workflow-live-region">
        {announcement}
      </div>
    </div>
  );
}

function RequestSummaryCapsule({ entry }: { entry: WorkflowEntryProjection }) {
  return (
    <section className="patient-workflow__capsule" data-testid="workflow-request-summary-capsule">
      <div>
        <span>Request</span>
        <strong>{entry.requestTitle}</strong>
      </div>
      <div>
        <span>Anchor</span>
        <strong>{entry.returnBundle.selectedAnchorRef}</strong>
      </div>
      <div>
        <span>Return bundle</span>
        <strong>{entry.returnBundle.requestReturnBundleRef}</strong>
      </div>
    </section>
  );
}

export function ReplyWindowBand({ status }: { status: PatientMoreInfoStatusProjection }) {
  return (
    <section
      className={`patient-workflow__window patient-workflow__window--${status.surfaceState}`}
      data-testid="reply-window-band"
      data-projection-name={status.projectionName}
      role="status"
    >
      <span>{status.surfaceState.replaceAll("_", " ")}</span>
      <strong>Reply window closes 17 Apr, 18:00</strong>
      <small>Late review stays open until 18 Apr, 12:00 when policy allows it.</small>
    </section>
  );
}

export function ContinuityPreservedPanel({ entry }: { entry: WorkflowEntryProjection }) {
  return (
    <aside
      className="patient-workflow__continuity"
      data-testid="continuity-preserved-panel"
      data-projection-name="PatientRequestReturnBundle"
      aria-labelledby="continuity-title"
    >
      <h2 id="continuity-title">What stays in place</h2>
      <dl>
        <div>
          <dt>Selected request</dt>
          <dd>{entry.returnBundle.requestRef}</dd>
        </div>
        <div>
          <dt>History</dt>
          <dd>{entry.returnBundle.lineageTupleHash}</dd>
        </div>
        <div>
          <dt>Return</dt>
          <dd>{entry.returnBundle.detailRouteRef}</dd>
        </div>
      </dl>
    </aside>
  );
}

function ErrorSummary({
  errors,
  errorSummaryRef,
}: {
  errors: ErrorState;
  errorSummaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <div
      className="patient-workflow__error-summary"
      data-testid="more-info-error-summary"
      role="alert"
      tabIndex={-1}
      ref={errorSummaryRef}
      aria-labelledby="more-info-error-title"
    >
      <h2 id="more-info-error-title">There is a problem</h2>
      <ul>
        {entries.map(([promptRef, message]) => (
          <li key={promptRef}>
            <a href={`#${promptRef}`}>{message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PromptStepCard({
  thread,
  answers,
  errors,
  onAnswer,
  onContinue,
}: {
  thread: PatientMoreInfoResponseThreadProjection;
  answers: AnswerState;
  errors: ErrorState;
  onAnswer: (promptRef: string, value: string) => void;
  onContinue: () => void;
}) {
  const step = thread.promptSteps[thread.currentStepIndex] ?? thread.promptSteps[0];
  if (!step) return null;
  const fieldError = errors[step.promptRef];
  return (
    <section
      className="patient-workflow__step"
      data-testid="prompt-step-card"
      data-projection-name={thread.projectionName}
      aria-labelledby="prompt-step-title"
    >
      <span className="patient-workflow__kicker">
        Step {thread.currentStepIndex + 1} of {thread.totalSteps}
      </span>
      <h2 id="prompt-step-title">{step.question}</h2>
      <p>{step.hint}</p>
      <fieldset
        aria-describedby={`${step.promptRef}-hint ${fieldError ? `${step.promptRef}-error` : ""}`}
      >
        <legend>{step.label}</legend>
        <span id={`${step.promptRef}-hint`} className="patient-workflow__hint">
          This answer is saved in the current request shell.
        </span>
        {fieldError ? (
          <span id={`${step.promptRef}-error`} className="patient-workflow__field-error">
            {fieldError}
          </span>
        ) : null}
        {step.answerKind === "short_text" ? (
          <input
            id={step.promptRef}
            data-testid={`more-info-field-${step.promptRef}`}
            value={answers[step.promptRef] ?? ""}
            aria-invalid={Boolean(fieldError)}
            aria-errormessage={fieldError ? `${step.promptRef}-error` : undefined}
            onChange={(event) => onAnswer(step.promptRef, event.currentTarget.value)}
          />
        ) : (
          <div className="patient-workflow__choice-list" id={step.promptRef}>
            {step.options?.map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={step.promptRef}
                  value={option}
                  checked={answers[step.promptRef] === option}
                  aria-invalid={Boolean(fieldError)}
                  onChange={(event) => onAnswer(step.promptRef, event.currentTarget.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <button
        type="button"
        className="patient-workflow__primary"
        data-testid="more-info-continue-action"
        onClick={onContinue}
      >
        Continue
      </button>
    </section>
  );
}

export function CheckAnswersPanel({
  thread,
  answers,
  errors,
  errorSummaryRef,
  onAnswer,
  onSubmit,
}: {
  thread: PatientMoreInfoResponseThreadProjection;
  answers: AnswerState;
  errors: ErrorState;
  errorSummaryRef: React.RefObject<HTMLDivElement | null>;
  onAnswer: (promptRef: string, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section
      className="patient-workflow__check"
      data-testid="check-answers-panel"
      aria-labelledby="check-answers-title"
    >
      <ErrorSummary errors={errors} errorSummaryRef={errorSummaryRef} />
      <span className="patient-workflow__kicker">Check answers</span>
      <h2 id="check-answers-title">Check before sending</h2>
      <dl>
        {thread.promptSteps.map((step) => (
          <div key={step.promptRef}>
            <dt>{step.question}</dt>
            <dd>{answers[step.promptRef] || "No answer entered"}</dd>
            <dd>
              <button type="button" onClick={() => onAnswer(step.promptRef, "")}>
                Edit
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="patient-workflow__primary"
        data-testid="send-more-info-action"
        onClick={onSubmit}
      >
        Send reply
      </button>
    </section>
  );
}

export function SubmissionReceiptPanel({ entry }: { entry: WorkflowEntryProjection }) {
  return (
    <section
      className="patient-workflow__receipt"
      data-testid="submission-receipt-panel"
      data-projection-name={entry.moreInfoStatus.projectionName}
      aria-labelledby="submission-receipt-title"
    >
      <Icon name="success" />
      <span className="patient-workflow__kicker">Reply received</span>
      <h2 id="submission-receipt-title">Your reply is awaiting review</h2>
      <p>
        The practice has received the update. It is tied to {entry.moreInfoStatus.cycleRef} and the
        request will stay in review until the authoritative outcome settles.
      </p>
      <a className="patient-workflow__secondary-link" href={`/requests/${entry.requestRef}`}>
        Return to request
      </a>
    </section>
  );
}

export function MoreInfoThreadFrame({
  entry,
  answers,
  errors,
  errorSummaryRef,
  onAnswer,
  onContinue,
  onSubmit,
}: {
  entry: WorkflowEntryProjection;
  answers: AnswerState;
  errors: ErrorState;
  errorSummaryRef: React.RefObject<HTMLDivElement | null>;
  onAnswer: (promptRef: string, value: string) => void;
  onContinue: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="patient-workflow__layout" data-testid="more-info-thread-frame">
      <div className="patient-workflow__primary-column">
        <RequestSummaryCapsule entry={entry} />
        <ReplyWindowBand status={entry.moreInfoStatus} />
        {entry.routeKey === "more_info_confirmation" ? (
          <SubmissionReceiptPanel entry={entry} />
        ) : entry.routeKey === "more_info_check" ? (
          <CheckAnswersPanel
            thread={entry.moreInfoThread}
            answers={answers}
            errors={errors}
            errorSummaryRef={errorSummaryRef}
            onAnswer={onAnswer}
            onSubmit={onSubmit}
          />
        ) : entry.routeKey === "more_info_expired" || entry.routeKey === "more_info_read_only" ? (
          <ReadOnlyOrRecoveryPanel entry={entry} />
        ) : (
          <>
            <ErrorSummary errors={errors} errorSummaryRef={errorSummaryRef} />
            <PromptStepCard
              thread={entry.moreInfoThread}
              answers={answers}
              errors={errors}
              onAnswer={onAnswer}
              onContinue={onContinue}
            />
          </>
        )}
      </div>
      <ContinuityPreservedPanel entry={entry} />
    </div>
  );
}

function ReadOnlyOrRecoveryPanel({ entry }: { entry: WorkflowEntryProjection }) {
  return (
    <section
      className="patient-workflow__blocked-panel"
      data-testid="more-info-read-only-recovery-panel"
      aria-labelledby="read-only-recovery-title"
    >
      <span className="patient-workflow__kicker">
        {entry.moreInfoStatus.surfaceState.replaceAll("_", " ")}
      </span>
      <h2 id="read-only-recovery-title">
        {entry.routeKey === "more_info_expired"
          ? "This reply window has closed"
          : "A safe summary is visible"}
      </h2>
      <p>
        The request summary remains available with the current anchor. Live reply controls are
        suppressed until the owning projection permits action again.
      </p>
      <a className="patient-workflow__secondary-link" href={`/requests/${entry.requestRef}`}>
        Return to request
      </a>
    </section>
  );
}

export function CallbackStatusRail({
  callback,
  reachability,
}: {
  callback: PatientCallbackStatusProjection;
  reachability: PatientReachabilitySummaryProjection;
}) {
  const phases = ["queued", "scheduled", "attempting_now", "retry_planned", "closed"];
  return (
    <section
      className="patient-workflow__callback"
      data-testid="callback-status-rail"
      data-projection-name={callback.projectionName}
      aria-labelledby="callback-status-title"
    >
      <span className="patient-workflow__kicker">Callback status</span>
      <h2 id="callback-status-title">
        {callback.patientVisibleState === "route_repair_required"
          ? "Repair contact details before callback can continue"
          : "Your callback is scheduled"}
      </h2>
      <ol>
        {phases.map((phase) => (
          <li key={phase} data-current={String(phase === callback.patientVisibleState)}>
            <strong>{phase.replaceAll("_", " ")}</strong>
            <span>
              {phase === callback.patientVisibleState
                ? callback.windowRiskState.replaceAll("_", " ")
                : "not current"}
            </span>
          </li>
        ))}
      </ol>
      <p>
        Reachability is {reachability.summaryState.replaceAll("_", " ")} from{" "}
        {callback.callbackExpectationEnvelopeRef}.
      </p>
    </section>
  );
}

export function BlockedActionSummaryCard({ repair }: { repair: PatientContactRepairProjection }) {
  return (
    <section
      className="patient-workflow__blocked-summary"
      data-testid="blocked-action-summary-card"
      data-projection-name={repair.projectionName}
      aria-labelledby="blocked-action-summary-title"
    >
      <span className="patient-workflow__kicker">Blocked action</span>
      <h2 id="blocked-action-summary-title">Reply and callback are paused</h2>
      <p>
        {repair.dominantBlockedActionRef.replaceAll("_", " ")} remains visible, but the contact
        route must be repaired before it can safely continue.
      </p>
    </section>
  );
}

export function ContactRepairBridge({
  entry,
  onApplyRepair,
}: {
  entry: WorkflowEntryProjection;
  onApplyRepair: () => void;
}) {
  const repair = entry.contactRepair;
  const applied = repair.repairState === "applied";
  return (
    <div className="patient-workflow__layout" data-testid="contact-repair-bridge">
      <div className="patient-workflow__primary-column">
        <RequestSummaryCapsule entry={entry} />
        <BlockedActionSummaryCard repair={repair} />
        <section className="patient-workflow__repair-panel" aria-labelledby="contact-repair-title">
          <span className="patient-workflow__kicker">
            {repair.repairState.replaceAll("_", " ")}
          </span>
          <h2 id="contact-repair-title">
            {applied ? "Contact route repair is being checked" : "Check the contact route"}
          </h2>
          <p>
            {applied
              ? "The repair is applied to the same continuation. Reply controls stay paused while reachability is rebound pending."
              : "The current mobile route may not receive replies or callback updates. Verify it or choose a fallback route."}
          </p>
          {applied ? (
            <a
              className="patient-workflow__secondary-link"
              href={`/requests/${entry.requestRef}/more-info`}
            >
              Return to more-info
            </a>
          ) : (
            <button
              className="patient-workflow__primary"
              type="button"
              data-testid="apply-contact-repair-action"
              onClick={onApplyRepair}
            >
              Apply repair
            </button>
          )}
        </section>
      </div>
      <ContinuityPreservedPanel entry={entry} />
    </div>
  );
}

function ConsentCheckpointView({ entry }: { entry: WorkflowEntryProjection }) {
  return (
    <div className="patient-workflow__layout" data-testid="consent-checkpoint-bridge">
      <div className="patient-workflow__primary-column">
        <RequestSummaryCapsule entry={entry} />
        <section className="patient-workflow__blocked-panel" aria-labelledby="consent-title">
          <span className="patient-workflow__kicker">Consent checkpoint</span>
          <h2 id="consent-title">Renew permission before this callback can continue</h2>
          <p>
            The dependent callback and reply controls stay paused until{" "}
            {entry.consentCheckpoint.consentCheckpointProjectionId} settles under the current
            request return bundle.
          </p>
          <button className="patient-workflow__primary" type="button">
            Renew permission
          </button>
        </section>
      </div>
      <ContinuityPreservedPanel entry={entry} />
    </div>
  );
}

function CallbackView({ entry }: { entry: WorkflowEntryProjection }) {
  return (
    <div className="patient-workflow__layout" data-testid="callback-status-view">
      <div className="patient-workflow__primary-column">
        <RequestSummaryCapsule entry={entry} />
        <CallbackStatusRail
          callback={entry.callbackStatus}
          reachability={entry.reachabilitySummary}
        />
        {entry.callbackStatus.surfaceState === "repair_required" ? (
          <BlockedActionSummaryCard repair={entry.contactRepair} />
        ) : null}
      </div>
      <ContinuityPreservedPanel entry={entry} />
    </div>
  );
}

export default function MoreInfoCallbackContactRepairApp() {
  const {
    entry,
    answers,
    errors,
    announcement,
    headingRef,
    errorSummaryRef,
    navigate,
    updateAnswer,
    continueStep,
    submitAnswers,
    applyRepair,
  } = useWorkflowController();

  return (
    <WorkflowShell
      entry={entry}
      headingRef={headingRef}
      announcement={announcement}
      onNavigate={navigate}
    >
      {entry.routeKey === "callback_status" || entry.routeKey === "callback_at_risk" ? (
        <CallbackView entry={entry} />
      ) : entry.routeKey === "contact_repair" || entry.routeKey === "contact_repair_applied" ? (
        <ContactRepairBridge entry={entry} onApplyRepair={applyRepair} />
      ) : entry.routeKey === "consent_checkpoint" ? (
        <ConsentCheckpointView entry={entry} />
      ) : (
        <MoreInfoThreadFrame
          entry={entry}
          answers={answers}
          errors={errors}
          errorSummaryRef={errorSummaryRef}
          onAnswer={updateAnswer}
          onContinue={continueStep}
          onSubmit={submitAnswers}
        />
      )}
    </WorkflowShell>
  );
}
