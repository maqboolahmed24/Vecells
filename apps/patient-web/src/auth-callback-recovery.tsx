import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import {
  AUTH_CALLBACK_RECOVERY_MODE,
  AUTH_RECOVERY_STATES,
  resolveAuthRecoveryRoute,
  resolveAuthRecoveryScreenKey,
  type AuthRecoveryStateProjection,
} from "./auth-callback-recovery.model";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";

interface AuthCallbackRecoveryAppProps {
  initialPathname?: string;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function useReducedMotionPreference(): boolean {
  const ownerWindow = safeWindow();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    ownerWindow?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    if (!ownerWindow) {
      return;
    }
    const mediaQuery = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [ownerWindow]);

  return prefersReducedMotion;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function contractValue(value: string | number | null): string {
  return value === null ? "none" : String(value);
}

function currentPathname(initialPathname?: string): string {
  return initialPathname ?? safeWindow()?.location.pathname ?? "/auth/sign-in";
}

function ScreenPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="auth-callback-recovery__pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

function ContractRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number | null;
  tone?: "good" | "warn" | "blocked";
}) {
  return (
    <div className="auth-callback-recovery__contract-row" data-tone={tone ?? "neutral"}>
      <span>{label}</span>
      <strong>{contractValue(value)}</strong>
    </div>
  );
}

function InfoPanel({
  title,
  children,
  testId,
}: {
  title: string;
  children: ReactNode;
  testId: string;
}) {
  return (
    <section className="auth-callback-recovery__panel" data-testid={testId}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function CallbackLadder({ state }: { state: AuthRecoveryStateProjection }) {
  const steps = [
    { id: "opened", label: "Opened" },
    { id: "callback_received", label: "Callback" },
    { id: "verified", label: "Verified" },
    { id: "consumed", label: "Consumed" },
  ] as const;
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === state.transaction.transactionState),
  );

  return (
    <ol className="auth-callback-recovery__ladder" data-testid="auth-callback-ladder">
      {steps.map((step, index) => (
        <li
          key={step.id}
          data-active={index <= activeIndex}
          data-current={step.id === state.transaction.transactionState}
        >
          <span aria-hidden="true" />
          <strong>{step.label}</strong>
        </li>
      ))}
    </ol>
  );
}

function SessionOrbit({ state }: { state: AuthRecoveryStateProjection }) {
  const tone =
    state.capabilityDecision.decisionState === "allow"
      ? "good"
      : state.capabilityDecision.decisionState === "deny"
        ? "blocked"
        : "warn";

  return (
    <figure className="auth-callback-recovery__orbit" data-testid="auth-session-state-ring">
      <div aria-hidden="true">
        <span data-orbit="transaction" />
        <span data-orbit="session" />
        <span data-orbit="capability" data-tone={tone} />
      </div>
      <figcaption>
        Session ring: transaction {humanize(state.transaction.transactionState)}, capability{" "}
        {humanize(state.capabilityDecision.decisionState)}.
      </figcaption>
    </figure>
  );
}

function ErrorSummary({ state }: { state: AuthRecoveryStateProjection }) {
  const hasRecoveryNotice =
    state.content.severity === "blocked" ||
    state.content.severity === "caution" ||
    state.content.severity === "recovery";
  if (!hasRecoveryNotice) {
    return null;
  }
  return (
    <div
      className="auth-callback-recovery__error-summary"
      data-testid="auth-error-summary"
      role="alert"
    >
      <strong>{state.content.eyebrow}</strong>
      <p>{state.content.trustCue}</p>
    </div>
  );
}

function ContextCard({ state }: { state: AuthRecoveryStateProjection }) {
  return (
    <aside className="auth-callback-recovery__context" data-testid="auth-context-card">
      <span className="auth-callback-recovery__eyebrow">Same-shell continuity</span>
      <h2>Return context held</h2>
      <p>
        The page keeps the patient in the current shell while the callback and route fence settle.
      </p>
      <div className="auth-callback-recovery__context-grid">
        <ContractRow label="Return authority" value={state.returnIntent.returnAuthority} />
        <ContractRow label="Intent state" value={state.returnIntent.intentState} />
        <ContractRow label="Route fence" value={state.routeContinuity.routeFenceState} />
        <ContractRow label="Binding validity" value={state.routeIntentBinding.validity} />
      </div>
    </aside>
  );
}

function AuthStateRail({
  state,
  onNavigate,
}: {
  state: AuthRecoveryStateProjection;
  onNavigate: (path: string) => void;
}) {
  return (
    <nav
      className="auth-callback-recovery__rail"
      aria-label="Auth recovery states"
      data-testid="auth-state-rail"
    >
      {AUTH_RECOVERY_STATES.map((entry) => (
        <button
          key={entry.screenKey}
          type="button"
          data-testid={`auth-state-${entry.screenKey}`}
          data-active={entry.screenKey === state.screenKey}
          aria-current={entry.screenKey === state.screenKey ? "page" : undefined}
          onClick={() => onNavigate(entry.routePath)}
        >
          <span>{entry.content.eyebrow}</span>
          <strong>{entry.content.title}</strong>
        </button>
      ))}
    </nav>
  );
}

function PrimaryAction({
  state,
  onNavigate,
}: {
  state: AuthRecoveryStateProjection;
  onNavigate: (path: string) => void;
}) {
  const isNhsLogin = state.screenKey === "sign_in_entry";
  return (
    <div className="auth-callback-recovery__actions" data-testid="auth-primary-action">
      <button
        type="button"
        className={
          isNhsLogin
            ? "auth-callback-recovery__nhs-login"
            : "auth-callback-recovery__primary-button"
        }
        data-testid={isNhsLogin ? "nhs-login-button-standard" : "auth-primary-action-button"}
        data-auth-action="primary"
        onClick={() => onNavigate(state.content.nextPath)}
      >
        {state.content.primaryAction}
      </button>
      <button
        type="button"
        className="auth-callback-recovery__secondary-button"
        data-testid="auth-secondary-action"
        onClick={() => onNavigate("/auth/recovery/safe-re-entry")}
      >
        {state.content.secondaryAction}
      </button>
    </div>
  );
}

function MainScreen({
  state,
  headingRef,
  onNavigate,
}: {
  state: AuthRecoveryStateProjection;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onNavigate: (path: string) => void;
}) {
  return (
    <main
      id="auth-callback-recovery-main"
      className="auth-callback-recovery__main"
      data-testid={`auth-screen-${state.screenKey}`}
      tabIndex={-1}
    >
      <div className="auth-callback-recovery__hero">
        <div>
          <span className="auth-callback-recovery__eyebrow">{state.content.eyebrow}</span>
          <h1 ref={headingRef} tabIndex={-1}>
            {state.content.title}
          </h1>
          <p>{state.content.summary}</p>
        </div>
        <ScreenPill label="Screen" value={humanize(state.screenKey)} />
      </div>

      <ErrorSummary state={state} />
      <CallbackLadder state={state} />
      <SessionOrbit state={state} />

      <div className="auth-callback-recovery__body-grid">
        <InfoPanel title="Authoritative state" testId="auth-authoritative-state">
          <div className="auth-callback-recovery__context-grid">
            <ContractRow
              label="AuthTransaction.transactionState"
              value={state.transaction.transactionState}
            />
            <ContractRow label="Callback outcome" value={state.callbackOutcomeClass} />
            <ContractRow
              label="SessionEstablishmentDecision.decision"
              value={state.sessionDecision.decision}
            />
            <ContractRow
              label="writableAuthorityState"
              value={state.sessionDecision.writableAuthorityState}
            />
            <ContractRow
              label="CapabilityDecision.decisionState"
              value={state.capabilityDecision.decisionState}
              tone={
                state.capabilityDecision.decisionState === "allow"
                  ? "good"
                  : state.capabilityDecision.decisionState === "deny"
                    ? "blocked"
                    : "warn"
              }
            />
            <ContractRow
              label="SessionTerminationSettlement.trigger"
              value={state.terminationSettlement.trigger}
            />
          </div>
        </InfoPanel>

        <InfoPanel title="Reason-code proof" testId="auth-reason-code-proof">
          <ul className="auth-callback-recovery__reason-list">
            {[
              ...state.sessionDecision.reasonCodes,
              ...state.capabilityDecision.reasonCodes,
              ...state.terminationSettlement.reasonCodes,
            ].map((reasonCode) => (
              <li key={reasonCode}>{reasonCode}</li>
            ))}
          </ul>
        </InfoPanel>
      </div>

      <p className="auth-callback-recovery__trust-cue" data-testid="auth-trust-cue">
        {state.content.trustCue}
      </p>

      <PrimaryAction state={state} onNavigate={onNavigate} />
    </main>
  );
}

export default function AuthCallbackRecoveryApp({ initialPathname }: AuthCallbackRecoveryAppProps) {
  const [state, setState] = useState(() =>
    resolveAuthRecoveryRoute(currentPathname(initialPathname)),
  );
  const prefersReducedMotion = useReducedMotionPreference();
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow || initialPathname) {
      return;
    }
    const handlePopState = () => {
      setState(resolveAuthRecoveryRoute(ownerWindow.location.pathname));
    };
    ownerWindow.addEventListener("popstate", handlePopState);
    return () => ownerWindow.removeEventListener("popstate", handlePopState);
  }, [initialPathname]);

  useEffect(() => {
    safeWindow()?.document.body.setAttribute(
      "data-auth-callback-reduced-motion",
      String(prefersReducedMotion),
    );
  }, [prefersReducedMotion]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [state.screenKey]);

  const navigateToPath = (path: string) => {
    const nextState = resolveAuthRecoveryRoute(path);
    setState(nextState);
    const ownerWindow = safeWindow();
    if (ownerWindow && !initialPathname && ownerWindow.location.pathname !== nextState.routePath) {
      ownerWindow.history.pushState({}, "", nextState.routePath);
    }
  };

  const resolvedScreenKey = resolveAuthRecoveryScreenKey(state);
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: state.routePath,
  });

  return (
    <div
      className="auth-callback-recovery"
      data-testid="Auth_Callback_Recovery_Route"
      data-mode={AUTH_CALLBACK_RECOVERY_MODE}
      data-screen-key={state.screenKey}
      data-resolved-screen-key={resolvedScreenKey}
      data-reduced-motion={prefersReducedMotion}
      data-route-binding-validity={state.routeIntentBinding.validity}
      data-route-fence={state.routeContinuity.routeFenceState}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-cause-class={phase2Context.causeClass}
      data-recovery-class={phase2Context.recoveryClass}
      data-canonical-status-label={phase2Context.canonicalStatusLabel}
    >
      <div
        className="auth-callback-recovery__live"
        data-testid="auth-live-region"
        role="status"
        aria-live="polite"
      >
        {state.content.eyebrow}: {state.content.title}
      </div>

      <header className="auth-callback-recovery__masthead" data-testid="auth-shell-masthead">
        <div>
          <span className="auth-callback-recovery__eyebrow">Patient portal</span>
          <p>Auth callback and signed-out recovery</p>
        </div>
        <div className="auth-callback-recovery__identity-chip" data-testid="header-identity-chip">
          <span>{state.screenKey === "signed_out_clean" ? "Signed out" : "Samira Ahmed"}</span>
          <strong>
            {state.screenKey === "signed_out_clean"
              ? "Same-shell recovery retained"
              : "NHS no. 943 *** 7812"}
          </strong>
        </div>
      </header>

      <PatientSupportPhase2Bridge context={phase2Context} />

      <section className="auth-callback-recovery__layout">
        <AuthStateRail state={state} onNavigate={navigateToPath} />
        <MainScreen state={state} headingRef={headingRef} onNavigate={navigateToPath} />
        <ContextCard state={state} />
      </section>
    </div>
  );
}
