import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import {
  AUTOSAVE_RECORD_PREFIX,
  formatClockLabel,
} from "./patient-intake-save-truth";
import {
  answerProgressiveQuestion,
  buildAnswerOptions,
  type ProgressiveQuestionFieldView,
  type ProgressiveRequestType,
  type ProgressiveValidationIssue,
} from "./patient-intake-progressive-flow";
import {
  createEmbeddedStartRequestMemory,
  embeddedStartRequestPath,
  embeddedStartRequestSteps,
  isEmbeddedStartRequestPath,
  moveEmbeddedDetailsForward,
  nextStepAfter,
  parseEmbeddedStartRequestLocation,
  previousStepBefore,
  resolveEmbeddedStartRequestContext,
  selectEmbeddedRequestType,
  type EmbeddedStartRequestContext,
  type EmbeddedStartRequestStep,
} from "./embedded-start-request.model";
import type { IntakeMissionFrameMemory } from "./patient-intake-mission-frame.model";

export { isEmbeddedStartRequestPath };

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function storageKey(draftPublicId: string): string {
  return `${AUTOSAVE_RECORD_PREFIX}embedded::${draftPublicId}`;
}

function readStoredMemory(draftPublicId: string): IntakeMissionFrameMemory | null {
  const ownerWindow = safeWindow();
  if (!ownerWindow) return null;
  const raw = ownerWindow.localStorage.getItem(storageKey(draftPublicId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IntakeMissionFrameMemory;
  } catch {
    return null;
  }
}

function writeStoredMemory(memory: IntakeMissionFrameMemory): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) return;
  ownerWindow.localStorage.setItem(storageKey(memory.draftPublicId), JSON.stringify(memory));
}

function resolveInitial(): EmbeddedStartRequestContext {
  const ownerWindow = safeWindow();
  const parsed = parseEmbeddedStartRequestLocation({
    pathname: ownerWindow?.location.pathname ?? "/nhs-app/start-request",
    search: ownerWindow?.location.search ?? "",
  });
  const stored = parsed.fixture ? null : readStoredMemory(parsed.draftPublicId);
  return resolveEmbeddedStartRequestContext({
    pathname: ownerWindow?.location.pathname ?? "/nhs-app/start-request",
    search: ownerWindow?.location.search ?? "",
    memory:
      stored ??
      createEmbeddedStartRequestMemory({
        draftPublicId: parsed.draftPublicId,
        fixture: parsed.fixture,
      }),
  });
}

function useEmbeddedStartRequestController() {
  const [context, setContext] = useState<EmbeddedStartRequestContext>(() => resolveInitial());
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const validationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.motion = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "reduced"
      : "full";
  }, []);

  useEffect(() => {
    writeStoredMemory(context.memory);
  }, [context.memory]);

  const replaceContext = useCallback(
    (step: EmbeddedStartRequestStep, memory: IntakeMissionFrameMemory, replace = false) => {
      const ownerWindow = safeWindow();
      const nextPath = embeddedStartRequestPath({ draftPublicId: memory.draftPublicId, step });
      if (ownerWindow) {
        if (replace) {
          ownerWindow.history.replaceState({ step, draftPublicId: memory.draftPublicId }, "", nextPath);
        } else {
          ownerWindow.history.pushState({ step, draftPublicId: memory.draftPublicId }, "", nextPath);
        }
      }
      setContext(resolveEmbeddedStartRequestContext({ pathname: nextPath, memory }));
      setShowValidation(false);
    },
    [],
  );

  const settleSave = useCallback((nextMemory: IntakeMissionFrameMemory) => {
    if (saveTimerRef.current !== null) {
      safeWindow()?.clearTimeout(saveTimerRef.current);
    }
    const savingMemory: IntakeMissionFrameMemory = {
      ...nextMemory,
      savePresentation: "saving_local",
      draftVersion: nextMemory.draftVersion + 1,
      lastSavedAt: new Date().toISOString(),
    };
    setContext((current) =>
      resolveEmbeddedStartRequestContext({
        pathname: embeddedStartRequestPath({
          draftPublicId: savingMemory.draftPublicId,
          step: current.step,
        }),
        memory: savingMemory,
      }),
    );
    saveTimerRef.current =
      safeWindow()?.setTimeout(() => {
        const savedMemory: IntakeMissionFrameMemory = {
          ...savingMemory,
          savePresentation: "saved_authoritative",
          lastSavedAt: new Date().toISOString(),
        };
        writeStoredMemory(savedMemory);
        setContext((current) =>
          resolveEmbeddedStartRequestContext({
            pathname: embeddedStartRequestPath({
              draftPublicId: savedMemory.draftPublicId,
              step: current.step,
            }),
            memory: savedMemory,
          }),
        );
      }, 180) ?? null;
  }, []);

  const answerField = useCallback(
    (questionKey: string, value: unknown) => {
      const nextMemory = answerProgressiveQuestion(context.memory, questionKey, value);
      settleSave(nextMemory);
      setShowValidation(false);
    },
    [context.memory, settleSave],
  );

  const selectRequestType = useCallback(
    (requestType: ProgressiveRequestType) => {
      settleSave(selectEmbeddedRequestType(context.memory, requestType));
    },
    [context.memory, settleSave],
  );

  const continueForward = useCallback(() => {
    if (context.step === "details") {
      const result = moveEmbeddedDetailsForward(context.memory);
      if (result.validationIssues.length > 0) {
        setShowValidation(true);
        window.setTimeout(() => validationRef.current?.focus({ preventScroll: false }), 0);
        return;
      }
      if (!result.complete) {
        settleSave(result.nextMemory);
        return;
      }
      replaceContext("contact_preferences", result.nextMemory);
      return;
    }

    if (context.step === "review_submit") {
      setIsSubmitting(true);
      const submittedMemory: IntakeMissionFrameMemory = {
        ...context.memory,
        completedStepKeys: [
          ...new Set([...context.memory.completedStepKeys, "review_submit" as const]),
        ],
        savePresentation: "saved_authoritative",
      };
      safeWindow()?.setTimeout(() => {
        setIsSubmitting(false);
        replaceContext("receipt_outcome", submittedMemory);
      }, 180);
      return;
    }

    if (context.step === "receipt_outcome") {
      const ownerWindow = safeWindow();
      ownerWindow?.location.assign(
        `/nhs-app/requests/REQ-2049/status?phase7=embedded_shell&shell=embedded&channel=nhs_app&context=signed`,
      );
      return;
    }

    replaceContext(nextStepAfter(context.step), context.memory);
  }, [context.memory, context.step, replaceContext, settleSave]);

  const goBack = useCallback(() => {
    replaceContext(previousStepBefore(context.step), context.memory);
  }, [context.memory, context.step, replaceContext]);

  const resumeSafely = useCallback(() => {
    replaceContext(
      context.submissionEnvelope.state === "promoted_recovery" ? "receipt_outcome" : "review_submit",
      context.memory,
      true,
    );
  }, [context.memory, context.submissionEnvelope.state, replaceContext]);

  return {
    context,
    showValidation,
    isSubmitting,
    validationRef,
    answerField,
    selectRequestType,
    continueForward,
    goBack,
    resumeSafely,
  };
}

export function EmbeddedDraftSaveChip({
  context,
}: {
  readonly context: EmbeddedStartRequestContext;
}) {
  const stateLabel =
    context.autosaveState === "saving"
      ? "Saving"
      : context.autosaveState === "saved_authoritative"
        ? "Saved"
        : context.autosaveState === "submitted"
          ? "Sent"
          : context.autosaveState === "recovery_required"
            ? "Check needed"
            : "Not saved yet";
  return (
    <div
      className="embedded-intake__save-chip"
      role="status"
      aria-live="polite"
      data-testid="EmbeddedDraftSaveChip"
      data-save-state={context.autosaveState}
    >
      <span aria-hidden="true" />
      <strong>{stateLabel}</strong>
      <small>{formatClockLabel(context.memory.lastSavedAt)}</small>
    </div>
  );
}

export function EmbeddedResumeDraftBanner({
  context,
  onResume,
}: {
  readonly context: EmbeddedStartRequestContext;
  readonly onResume: () => void;
}) {
  if (!context.resumeBanner.visible) return null;
  return (
    <section
      className="embedded-intake__resume-banner"
      aria-labelledby="embedded-resume-title"
      data-testid="EmbeddedResumeDraftBanner"
      data-continuity-state={context.draftContinuityEvidence.validationState}
    >
      <div>
        <span className="embedded-intake__eyebrow">Draft recovery</span>
        <h2 id="embedded-resume-title">{context.resumeBanner.title}</h2>
        <p>{context.resumeBanner.body}</p>
      </div>
      <button type="button" onClick={onResume}>
        {context.resumeBanner.actionLabel}
      </button>
    </section>
  );
}

export function EmbeddedIntakeProgressStepper({
  context,
}: {
  readonly context: EmbeddedStartRequestContext;
}) {
  return (
    <nav
      className="embedded-intake__stepper"
      aria-label="Start request progress"
      data-testid="EmbeddedIntakeProgressStepper"
      data-current-step={String(context.stepIndex + 1)}
    >
      <ol>
        {embeddedStartRequestSteps.map((step, index) => {
          const active = step.routeKey === context.location.routeKey;
          const complete = index < context.stepIndex || context.step === "receipt_outcome";
          return (
            <li
              key={step.routeKey}
              data-step-state={active ? "current" : complete ? "complete" : "next"}
              aria-current={active ? "step" : undefined}
            >
              <span aria-hidden="true">{index + 1}</span>
              <strong>{step.railLabel}</strong>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function EmbeddedIntakeAnchorRail({
  context,
}: {
  readonly context: EmbeddedStartRequestContext;
}) {
  const stepLabel =
    embeddedStartRequestSteps.find((step) => step.routeKey === context.location.routeKey)?.title ??
    context.location.routeKey;
  return (
    <aside
      className="embedded-intake__anchor-rail"
      aria-label="Current draft anchor"
      data-testid="EmbeddedIntakeAnchorRail"
      data-selected-anchor={context.draftContinuityEvidence.selectedAnchorRef}
    >
      <span className="embedded-intake__eyebrow">Same shell</span>
      <strong>{stepLabel}</strong>
      <p>{context.draftContinuityEvidence.selectedAnchorRef}</p>
    </aside>
  );
}

function fieldError(
  issues: readonly ProgressiveValidationIssue[],
  questionKey: string,
): ProgressiveValidationIssue | null {
  return issues.find((issue) => issue.questionKey === questionKey) ?? null;
}

function coerceInputValue(field: ProgressiveQuestionFieldView, rawValue: string): unknown {
  if (field.answerType === "boolean") return rawValue === "true";
  return rawValue;
}

export function EmbeddedIntakeFieldsetAdapter({
  field,
  issues,
  onAnswer,
}: {
  readonly field: ProgressiveQuestionFieldView;
  readonly issues: readonly ProgressiveValidationIssue[];
  readonly onAnswer: (questionKey: string, value: unknown) => void;
}) {
  const options = buildAnswerOptions(field.questionKey);
  const error = fieldError(issues, field.questionKey);
  const hintId = `${field.questionKey.replaceAll(".", "-")}-hint`;
  const errorId = `${field.questionKey.replaceAll(".", "-")}-error`;
  const describedBy = [hintId, error ? errorId : null].filter(Boolean).join(" ");
  const value = field.value;

  if (field.answerType === "single_select" || field.answerType === "boolean") {
    const renderedOptions =
      field.answerType === "boolean"
        ? [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]
        : options;
    return (
      <fieldset
        className="embedded-intake__fieldset"
        data-error={error ? "true" : "false"}
        data-testid={`EmbeddedIntakeField-${field.questionKey}`}
        aria-describedby={describedBy}
      >
        <legend>{field.promptLabel}</legend>
        <p id={hintId}>{field.whyWeAsk ?? "Choose the answer that best matches today."}</p>
        {error ? (
          <span className="embedded-intake__field-error" id={errorId}>
            <span className="embedded-intake__visually-hidden">Error: </span>
            {error.message}
          </span>
        ) : null}
        <div className="embedded-intake__option-list">
          {renderedOptions.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name={field.questionKey}
                value={option.value}
                checked={String(value) === option.value}
                onChange={(event) => onAnswer(field.questionKey, coerceInputValue(field, event.currentTarget.value))}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.answerType === "multi_select") {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <fieldset
        className="embedded-intake__fieldset"
        data-error={error ? "true" : "false"}
        data-testid={`EmbeddedIntakeField-${field.questionKey}`}
        aria-describedby={describedBy}
      >
        <legend>{field.promptLabel}</legend>
        <p id={hintId}>{field.whyWeAsk ?? "Choose all that apply."}</p>
        {error ? (
          <span className="embedded-intake__field-error" id={errorId}>
            <span className="embedded-intake__visually-hidden">Error: </span>
            {error.message}
          </span>
        ) : null}
        <div className="embedded-intake__option-list">
          {options.map((option) => (
            <label key={option.value}>
              <input
                type="checkbox"
                value={option.value}
                checked={selected.includes(option.value)}
                onChange={(event) => {
                  const next = event.currentTarget.checked
                    ? [...selected, option.value]
                    : selected.filter((entry) => entry !== option.value);
                  onAnswer(field.questionKey, next);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const multiline = field.answerType === "long_text";
  return (
    <div
      className="embedded-intake__fieldset"
      data-error={error ? "true" : "false"}
      data-testid={`EmbeddedIntakeField-${field.questionKey}`}
    >
      <label htmlFor={field.questionKey}>{field.promptLabel}</label>
      <p id={hintId}>{field.whyWeAsk ?? "Keep this short and specific."}</p>
      {error ? (
        <span className="embedded-intake__field-error" id={errorId}>
          <span className="embedded-intake__visually-hidden">Error: </span>
          {error.message}
        </span>
      ) : null}
      {multiline ? (
        <textarea
          id={field.questionKey}
          value={typeof value === "string" ? value : ""}
          rows={4}
          aria-describedby={describedBy}
          onChange={(event) => onAnswer(field.questionKey, event.currentTarget.value)}
        />
      ) : (
        <input
          id={field.questionKey}
          type={field.answerType === "date" ? "date" : "text"}
          value={typeof value === "string" ? value : ""}
          aria-describedby={describedBy}
          onChange={(event) => onAnswer(field.questionKey, event.currentTarget.value)}
        />
      )}
    </div>
  );
}

export function EmbeddedValidationSummaryBar({
  issues,
  visible,
  summaryRef,
}: {
  readonly issues: readonly ProgressiveValidationIssue[];
  readonly visible: boolean;
  readonly summaryRef: RefObject<HTMLDivElement | null>;
}) {
  if (!visible || issues.length === 0) return null;
  return (
    <section
      className="embedded-intake__validation"
      role="alert"
      aria-labelledby="embedded-validation-title"
      tabIndex={-1}
      ref={summaryRef}
      data-testid="EmbeddedValidationSummaryBar"
    >
      <h2 id="embedded-validation-title">There is a problem</h2>
      <ul>
        {issues.map((issue) => (
          <li key={`${issue.questionKey}-${issue.code}`}>
            <a href={`#${issue.questionKey}`}>{issue.message}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RequestTypeChooser({
  context,
  onSelect,
}: {
  readonly context: EmbeddedStartRequestContext;
  readonly onSelect: (requestType: ProgressiveRequestType) => void;
}) {
  return (
    <section className="embedded-intake__request-types" aria-label="Request type choices">
      {context.progressiveView.requestTypeCards.map((card) => (
        <button
          key={card.requestType}
          type="button"
          data-active={context.memory.requestType === card.requestType ? "true" : "false"}
          onClick={() => onSelect(card.requestType)}
        >
          <span>{card.cue}</span>
          <strong>{card.title}</strong>
          <small>{card.bestFor}</small>
        </button>
      ))}
    </section>
  );
}

export function EmbeddedIntakeQuestionCard({
  context,
  showValidation,
  validationRef,
  onAnswer,
  onSelectRequestType,
}: {
  readonly context: EmbeddedStartRequestContext;
  readonly showValidation: boolean;
  readonly validationRef: RefObject<HTMLDivElement | null>;
  readonly onAnswer: (questionKey: string, value: unknown) => void;
  readonly onSelectRequestType: (requestType: ProgressiveRequestType) => void;
}) {
  const questionFrame = context.progressiveView.activeQuestionFrame;
  return (
    <section
      className="embedded-intake__question-card"
      aria-labelledby="embedded-intake-question-title"
      data-testid="EmbeddedIntakeQuestionCard"
      data-step={context.step}
      data-draft-public-id={context.draftView.draftPublicId}
    >
      <div className="embedded-intake__question-heading">
        <span className="embedded-intake__eyebrow">
          {context.step === "request_type" ? "Question one" : `Question ${questionFrame.currentIndex + 2}`}
        </span>
        <h1 id="embedded-intake-question-title">
          {context.step === "request_type" ? "What kind of help do you need today?" : questionFrame.title}
        </h1>
        <p>
          {context.step === "request_type"
            ? "Choose one request type. The same intake model is used in the NHS App and browser."
            : questionFrame.helper}
        </p>
      </div>
      <EmbeddedValidationSummaryBar
        issues={context.validationIssues}
        visible={showValidation}
        summaryRef={validationRef}
      />
      {context.step === "request_type" ? (
        <RequestTypeChooser context={context} onSelect={onSelectRequestType} />
      ) : (
        <div className="embedded-intake__field-stack">
          {questionFrame.contextChips.length > 0 ? (
            <div className="embedded-intake__context-chips" aria-label="Previous answers">
              {questionFrame.contextChips.map((chip) => (
                <span key={chip.questionKey}>
                  {chip.label}: {chip.value}
                </span>
              ))}
            </div>
          ) : null}
          {questionFrame.fields.map((field) => (
            <EmbeddedIntakeFieldsetAdapter
              key={field.questionKey}
              field={field}
              issues={showValidation ? context.validationIssues : []}
              onAnswer={onAnswer}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function EmbeddedReviewWorkspace({
  context,
}: {
  readonly context: EmbeddedStartRequestContext;
}) {
  return (
    <section
      className="embedded-intake__review"
      aria-labelledby="embedded-review-title"
      data-testid="EmbeddedReviewWorkspace"
    >
      <div className="embedded-intake__question-heading">
        <span className="embedded-intake__eyebrow">Review</span>
        <h1 id="embedded-review-title">Check and send your request</h1>
        <p>The review uses the same answers and contact route that will travel in the submission envelope.</p>
      </div>
      <dl>
        {context.progressiveView.activeSummaryChips.slice(0, 5).map((chip) => (
          <div key={chip.questionKey}>
            <dt>{chip.label}</dt>
            <dd>{chip.value}</dd>
          </div>
        ))}
        <div>
          <dt>Contact</dt>
          <dd>
            {context.contactSummary.preferredRouteLabel} {context.contactSummary.preferredDestinationMasked}
          </dd>
        </div>
      </dl>
      <section className="embedded-intake__submission-envelope" aria-label="Submission boundary">
        <strong>{context.submissionEnvelope.envelopeRef}</strong>
        <p>Promotion can only happen once and the receipt keeps this same lineage.</p>
      </section>
    </section>
  );
}

export function EmbeddedReceiptMorphFrame({
  context,
}: {
  readonly context: EmbeddedStartRequestContext;
}) {
  return (
    <section
      className="embedded-intake__receipt"
      aria-labelledby="embedded-receipt-title"
      data-testid="EmbeddedReceiptMorphFrame"
      data-request-public-id={context.receiptSurface.requestPublicId}
    >
      <div className="embedded-intake__question-heading">
        <span className="embedded-intake__eyebrow">Receipt</span>
        <h1 id="embedded-receipt-title">{context.receiptSurface.title}</h1>
        <p>{context.receiptSurface.summary}</p>
      </div>
      <div className="embedded-intake__receipt-facts" aria-label="Receipt facts">
        {context.receiptSurface.facts.map((fact) => (
          <div key={fact.dataTestId} data-testid={fact.dataTestId}>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
            <small>{fact.caption}</small>
          </div>
        ))}
      </div>
      <ol className="embedded-intake__receipt-timeline" aria-label={context.receiptSurface.timelineHeading}>
        {context.receiptSurface.timeline.map((item) => (
          <li key={item.key} data-state={item.state}>
            <strong>{item.label}</strong>
            <p>{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ContactPreferencePanel({ context }: { readonly context: EmbeddedStartRequestContext }) {
  return (
    <section
      className="embedded-intake__review"
      aria-labelledby="embedded-contact-title"
      data-testid="EmbeddedContactPreferencePanel"
    >
      <div className="embedded-intake__question-heading">
        <span className="embedded-intake__eyebrow">Contact route</span>
        <h1 id="embedded-contact-title">How should we contact you?</h1>
        <p>We keep contact preference separate from delivery proof and verified route truth.</p>
      </div>
      <dl>
        <div>
          <dt>Preferred route</dt>
          <dd>{context.contactSummary.preferredRouteLabel}</dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>{context.contactSummary.preferredDestinationMasked}</dd>
        </div>
        <div>
          <dt>Follow-up</dt>
          <dd>{formatFollowUpPermission(context.contactSummary.followUpPermissionState)}</dd>
        </div>
      </dl>
    </section>
  );
}

function formatFollowUpPermission(state: EmbeddedStartRequestContext["contactSummary"]["followUpPermissionState"]) {
  if (state === "granted") {
    return "Allowed";
  }
  if (state === "declined") {
    return "Do not use";
  }
  return "Still deciding";
}

export function EmbeddedSubmitActionBar({
  context,
  isSubmitting,
  onPrimary,
  onSecondary,
}: {
  readonly context: EmbeddedStartRequestContext;
  readonly isSubmitting: boolean;
  readonly onPrimary: () => void;
  readonly onSecondary: () => void;
}) {
  return (
    <aside
      className="embedded-intake__action-bar"
      aria-label="Start request actions"
      data-testid="EmbeddedSubmitActionBar"
      data-step={context.step}
      data-submit-state={isSubmitting ? "submitting" : context.submissionEnvelope.state}
    >
      <button type="button" className="embedded-intake__primary-action" onClick={onPrimary} disabled={isSubmitting}>
        {isSubmitting ? "Sending" : context.primaryActionLabel}
      </button>
      {context.secondaryActionLabel ? (
        <button type="button" className="embedded-intake__secondary-action" onClick={onSecondary}>
          {context.secondaryActionLabel}
        </button>
      ) : null}
    </aside>
  );
}

function EmbeddedIntakeBody({
  context,
  showValidation,
  validationRef,
  answerField,
  selectRequestType,
}: {
  readonly context: EmbeddedStartRequestContext;
  readonly showValidation: boolean;
  readonly validationRef: RefObject<HTMLDivElement | null>;
  readonly answerField: (questionKey: string, value: unknown) => void;
  readonly selectRequestType: (requestType: ProgressiveRequestType) => void;
}) {
  if (context.step === "review_submit") return <EmbeddedReviewWorkspace context={context} />;
  if (context.step === "receipt_outcome") return <EmbeddedReceiptMorphFrame context={context} />;
  if (context.step === "contact_preferences") return <ContactPreferencePanel context={context} />;
  if (context.step === "resume_recovery") {
    return (
      <EmbeddedReviewWorkspace
        context={{
          ...context,
          submissionEnvelope: {
            ...context.submissionEnvelope,
            state: "promoted_recovery",
          },
        }}
      />
    );
  }
  return (
    <EmbeddedIntakeQuestionCard
      context={context}
      showValidation={showValidation}
      validationRef={validationRef}
      onAnswer={answerField}
      onSelectRequestType={selectRequestType}
    />
  );
}

export function EmbeddedIntakeFrame({
  children,
  context,
}: {
  readonly children: ReactNode;
  readonly context: EmbeddedStartRequestContext;
}) {
  return (
    <main
      className="token-foundation embedded-intake"
      data-testid="EmbeddedIntakeFrame"
      data-task-id={context.taskId}
      data-visual-mode={context.visualMode}
      data-route-family={context.draftContinuityEvidence.routeFamilyRef}
      data-selected-anchor={context.draftContinuityEvidence.selectedAnchorRef}
      data-continuity-state={context.draftContinuityEvidence.validationState}
      data-envelope-state={context.submissionEnvelope.state}
    >
      {children}
    </main>
  );
}

export function EmbeddedStartRequestApp() {
  const controller = useEmbeddedStartRequestController();
  const { context } = controller;
  return (
    <EmbeddedIntakeFrame context={context}>
      <div className="embedded-intake__shell">
        <header className="embedded-intake__masthead" role="banner" data-testid="EmbeddedIntakeMasthead">
          <div>
            <span className="embedded-intake__eyebrow">NHS App start request</span>
            <h1>{context.step === "receipt_outcome" ? "Request receipt" : "Start a request"}</h1>
            <p>{context.memory.requestType} request</p>
          </div>
          <EmbeddedDraftSaveChip context={context} />
        </header>
        <EmbeddedIntakeProgressStepper context={context} />
        <EmbeddedResumeDraftBanner context={context} onResume={controller.resumeSafely} />
        <EmbeddedIntakeAnchorRail context={context} />
        <EmbeddedIntakeBody
          context={context}
          showValidation={controller.showValidation}
          validationRef={controller.validationRef}
          answerField={controller.answerField}
          selectRequestType={controller.selectRequestType}
        />
      </div>
      <EmbeddedSubmitActionBar
        context={context}
        isSubmitting={controller.isSubmitting}
        onPrimary={controller.continueForward}
        onSecondary={controller.goBack}
      />
    </EmbeddedIntakeFrame>
  );
}

export default EmbeddedStartRequestApp;
