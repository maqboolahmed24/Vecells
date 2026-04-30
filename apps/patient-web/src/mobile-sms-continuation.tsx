import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import {
  MOBILE_SMS_CONTINUATION_TASK_ID,
  MobileContinuationResolver,
  isMobileSmsContinuationPath,
  type CapturedContextRow,
  type MobileContinuationRouteProjection,
  type MobileContinuationStepKey,
} from "./mobile-sms-continuation.model";

const CONTINUATION_STEP_STORAGE_KEY = "mobile-sms-continuation-198::step";
const CONTINUATION_SAVE_STORAGE_KEY = "mobile-sms-continuation-198::save-state";
const CONTINUATION_UPLOAD_STORAGE_KEY = "mobile-sms-continuation-198::uploads";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function readStoredValue(key: string): string | null {
  return safeWindow()?.sessionStorage.getItem(key) ?? null;
}

function writeStoredValue(key: string, value: string): void {
  safeWindow()?.sessionStorage.setItem(key, value);
}

function useMobileContinuationController() {
  const initialPathname = safeWindow()?.location.pathname ?? "/sms-continuation/seeded";
  const restoredStepRef = useRef(readStoredValue(CONTINUATION_STEP_STORAGE_KEY));
  const [route, setRoute] = useState<MobileContinuationRouteProjection>(() =>
    MobileContinuationResolver(initialPathname),
  );
  const [detailText, setDetailText] = useState(
    readStoredValue(CONTINUATION_SAVE_STORAGE_KEY) ?? "Symptoms started after the call.",
  );
  const [uploadNames, setUploadNames] = useState<readonly string[]>(() => {
    const stored = readStoredValue(CONTINUATION_UPLOAD_STORAGE_KEY);
    return stored ? stored.split("|").filter(Boolean) : [];
  });
  const [challengeCode, setChallengeCode] = useState("");
  const [announcement, setAnnouncement] = useState(
    restoredStepRef.current
      ? `Restored ${restoredStepRef.current.replaceAll("_", " ")} mobile step.`
      : "Mobile continuation loaded.",
  );
  const titleRef = useRef<HTMLHeadingElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);

  const persistRoute = useEffectEvent((nextRoute: MobileContinuationRouteProjection) => {
    writeStoredValue(CONTINUATION_STEP_STORAGE_KEY, nextRoute.screen.stepKey);
    writeStoredValue(CONTINUATION_SAVE_STORAGE_KEY, detailText);
    writeStoredValue(CONTINUATION_UPLOAD_STORAGE_KEY, uploadNames.join("|"));
  });

  const resolvePath = useEffectEvent((pathname: string, mode: "soft" | "refresh") => {
    const nextRoute = MobileContinuationResolver(pathname);
    setRoute(nextRoute);
    persistRoute(nextRoute);
    setAnnouncement(
      mode === "refresh"
        ? `${nextRoute.screen.stepKey.replaceAll("_", " ")} restored in the same mobile shell.`
        : `${nextRoute.screen.stepKey.replaceAll("_", " ")} opened in the same mobile shell.`,
    );
  });

  useEffect(() => {
    persistRoute(route);
  }, [persistRoute, route]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const onPopState = () => {
      startTransition(() => resolvePath(ownerWindow.location.pathname, "soft"));
    };
    ownerWindow.addEventListener("popstate", onPopState);
    return () => ownerWindow.removeEventListener("popstate", onPopState);
  }, [resolvePath]);

  useEffect(() => {
    const focusTarget =
      route.screen.screenKey === "SeededContinuationLanding" ? titleRef.current : actionRef.current;
    focusTarget?.focus({ preventScroll: true });
  }, [route.screen.screenKey]);

  function navigate(pathname: string): void {
    const ownerWindow = safeWindow();
    if (!pathname.startsWith("/sms-continuation")) {
      setAnnouncement("Safe external action selected. Continuation shell remains recoverable.");
      return;
    }
    startTransition(() => {
      const nextRoute = MobileContinuationResolver(pathname);
      setRoute(nextRoute);
      persistRoute(nextRoute);
      setAnnouncement(
        `${nextRoute.screen.stepKey.replaceAll("_", " ")} opened in the same mobile shell.`,
      );
      ownerWindow?.history.pushState({}, "", pathname);
    });
  }

  function updateDetailText(nextValue: string): void {
    setDetailText(nextValue);
    writeStoredValue(CONTINUATION_SAVE_STORAGE_KEY, nextValue);
    setAnnouncement("Saved continuation detail in this mobile step.");
  }

  function updateUploadNames(nextNames: readonly string[]): void {
    setUploadNames(nextNames);
    writeStoredValue(CONTINUATION_UPLOAD_STORAGE_KEY, nextNames.join("|"));
    setAnnouncement(
      nextNames.length === 0
        ? "Upload tray is ready."
        : `${nextNames.length} upload${nextNames.length === 1 ? "" : "s"} attached in this mobile step.`,
    );
  }

  function completeChallenge(): void {
    if (challengeCode.trim().length < 4) {
      setAnnouncement("Enter the code before continuing.");
      return;
    }
    navigate("/sms-continuation/challenge-verified");
  }

  return {
    route,
    announcement,
    titleRef,
    actionRef,
    detailText,
    uploadNames,
    challengeCode,
    setChallengeCode,
    navigate,
    updateDetailText,
    updateUploadNames,
    completeChallenge,
    restoreCurrentStep: () =>
      resolvePath(safeWindow()?.location.pathname ?? route.pathname, "refresh"),
  };
}

export function ContinuationHeaderBand({ route }: { route: MobileContinuationRouteProjection }) {
  return (
    <header className="mobile-continuation__header-band" data-testid="continuation-header-band">
      <div>
        <VecellLogoWordmark aria-hidden="true" className="mobile-continuation__wordmark" />
        <span>{route.context.telephonyContinuationContext.entryChannel.replaceAll("_", " ")}</span>
      </div>
      <span
        className={`mobile-continuation__mode mobile-continuation__mode--${route.screen.accent}`}
      >
        {route.context.eligibility.replaceAll("_", " ")}
      </span>
    </header>
  );
}

export function MobileProgressStrip({
  stepKey,
  index,
  total,
}: {
  stepKey: MobileContinuationStepKey;
  index: number;
  total: number;
}) {
  const progress = Math.round((index / total) * 100);
  return (
    <div
      className="mobile-continuation__progress"
      data-testid="mobile-continuation-progress"
      role="progressbar"
      aria-label={`Continuation progress, step ${index} of ${total}`}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={index}
      data-selected-step={stepKey}
    >
      <span style={{ inlineSize: `${progress}%` }} />
      <strong>
        Step {index} of {total}
      </strong>
      <em>{stepKey.replaceAll("_", " ")}</em>
    </div>
  );
}

export function ContinuationSaveStateChip({ route }: { route: MobileContinuationRouteProjection }) {
  return (
    <div
      className="mobile-continuation__save-chip"
      data-testid="continuation-save-state-chip"
      role="status"
      aria-label={`Save state ${route.context.patientRequestReturnBundle.saveState}`}
      data-save-state={route.context.patientRequestReturnBundle.saveState}
      data-selected-step={route.context.patientRequestReturnBundle.selectedMobileStep}
    >
      <span />
      {route.context.patientRequestReturnBundle.saveState.replaceAll("_", " ")}
    </div>
  );
}

export function CapturedSoFarPanel({
  rows,
  verified,
}: {
  rows: readonly CapturedContextRow[];
  verified: boolean;
}) {
  if (!verified) {
    return null;
  }
  return (
    <aside
      className="mobile-continuation__captured"
      data-testid="captured-so-far-panel"
      aria-labelledby="captured-so-far-title"
    >
      <p className="mobile-continuation__eyebrow">We have already captured some details</p>
      <h2 id="captured-so-far-title">Safe context from the call</h2>
      <dl>
        {rows.map((row) => (
          <div key={`${row.label}-${row.value}`} data-visibility={row.visibility}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export function ChallengeStepFrame({
  code,
  onCodeChange,
  onContinue,
}: {
  code: string;
  onCodeChange: (nextValue: string) => void;
  onContinue: () => void;
}) {
  return (
    <section
      className="mobile-continuation__challenge-frame"
      data-testid="challenge-step-frame"
      aria-labelledby="challenge-step-title"
    >
      <h2 id="challenge-step-title">Phone check</h2>
      <p>No pre-existing patient or request detail is shown before this challenge succeeds.</p>
      <label htmlFor="continuation-challenge-code">Code from the call</label>
      <input
        id="continuation-challenge-code"
        data-testid="challenge-code-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        aria-describedby="challenge-code-help"
      />
      <p id="challenge-code-help">
        Use the code you heard or received during the continuation step.
      </p>
      <button
        type="button"
        className="mobile-continuation__primary-button"
        data-testid="challenge-continue-action"
        onClick={onContinue}
      >
        Continue safely
      </button>
    </section>
  );
}

export function UploadTrayMobile({
  uploadNames,
  onUploadNamesChange,
}: {
  uploadNames: readonly string[];
  onUploadNamesChange: (nextNames: readonly string[]) => void;
}) {
  function onInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const names = event.target.files ? Array.from(event.target.files).map((file) => file.name) : [];
    onUploadNamesChange(names);
    event.target.value = "";
  }

  return (
    <section
      className="mobile-continuation__upload-tray"
      data-testid="upload-tray-mobile"
      aria-labelledby="upload-tray-title"
    >
      <div>
        <p className="mobile-continuation__eyebrow">Canonical evidence lane</p>
        <h2 id="upload-tray-title">Upload stays part of the same request</h2>
        <p>Photos and documents follow the same Current programme evidence semantics as the web route.</p>
      </div>
      <label className="mobile-continuation__upload-label" htmlFor="continuation-file-input">
        Choose photo or document
      </label>
      <input
        id="continuation-file-input"
        data-testid="upload-file-input"
        type="file"
        multiple
        accept="image/*,.pdf,.heic,.heif"
        onChange={onInputChange}
      />
      <ul data-testid="upload-name-list" aria-label="Uploaded evidence">
        {uploadNames.length === 0 ? <li>No files attached yet.</li> : null}
        {uploadNames.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  );
}

export function ContinuationRecoveryBridge({
  route,
  onNavigate,
}: {
  route: MobileContinuationRouteProjection;
  onNavigate: (pathname: string) => void;
}) {
  return (
    <section
      className="mobile-continuation__recovery-bridge"
      data-testid="continuation-recovery-bridge"
      aria-labelledby="recovery-bridge-title"
    >
      <p className="mobile-continuation__eyebrow">
        {route.context.recoveryContinuationToken.recoveryState.replaceAll("_", " ")}
      </p>
      <h2 id="recovery-bridge-title">Same-shell recovery bridge</h2>
      <p>
        Selected mobile step, request summary, save state, and return target stay inside this SMS
        continuation shell.
      </p>
      <button
        type="button"
        className="mobile-continuation__secondary-button"
        data-testid="recover-same-shell-action"
        onClick={() => onNavigate(route.context.recoveryContinuationToken.safeReturnPath)}
      >
        Restore safe continuation
      </button>
    </section>
  );
}

function RequestDetailEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <section className="mobile-continuation__detail-editor" data-testid="add-more-detail-step">
      <label htmlFor="continuation-detail">More detail for the request</label>
      <textarea
        id="continuation-detail"
        data-testid="continuation-detail-input"
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p>
        Canonical Phase 1 question semantics are preserved: request type, structured answers,
        upload, review, submit, receipt, and status.
      </p>
    </section>
  );
}

function ReviewSummary({
  route,
  detailText,
  uploadNames,
}: {
  route: MobileContinuationRouteProjection;
  detailText: string;
  uploadNames: readonly string[];
}) {
  return (
    <section className="mobile-continuation__review" data-testid="review-before-submit-step">
      <h2>Review before submitting</h2>
      <dl>
        <div>
          <dt>Request summary</dt>
          <dd>{route.context.patientRequestReturnBundle.requestSummary}</dd>
        </div>
        <div>
          <dt>Added detail</dt>
          <dd>{detailText}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>
            {uploadNames.length === 0
              ? "No evidence attached"
              : `${uploadNames.length} file attached`}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function BottomActionDock({
  route,
  actionRef,
  onNavigate,
}: {
  route: MobileContinuationRouteProjection;
  actionRef: RefObject<HTMLButtonElement | null>;
  onNavigate: (pathname: string) => void;
}) {
  return (
    <div className="mobile-continuation__action-dock" data-testid="mobile-action-dock">
      <button
        type="button"
        ref={actionRef}
        className="mobile-continuation__primary-button"
        data-testid="dominant-next-safe-action"
        onClick={() => onNavigate(route.screen.dominantActionPath)}
      >
        {route.screen.dominantActionLabel}
      </button>
      {route.screen.secondaryActionLabel && route.screen.secondaryActionPath ? (
        <button
          type="button"
          className="mobile-continuation__secondary-button"
          data-testid="secondary-safe-action"
          onClick={() => onNavigate(route.screen.secondaryActionPath ?? "/sms-continuation/seeded")}
        >
          {route.screen.secondaryActionLabel}
        </button>
      ) : null}
    </div>
  );
}

function renderScreenSpecificContent({
  route,
  detailText,
  uploadNames,
  challengeCode,
  onDetailChange,
  onUploadNamesChange,
  onChallengeCodeChange,
  onChallengeContinue,
  onNavigate,
}: {
  route: MobileContinuationRouteProjection;
  detailText: string;
  uploadNames: readonly string[];
  challengeCode: string;
  onDetailChange: (nextValue: string) => void;
  onUploadNamesChange: (nextNames: readonly string[]) => void;
  onChallengeCodeChange: (nextValue: string) => void;
  onChallengeContinue: () => void;
  onNavigate: (pathname: string) => void;
}) {
  switch (route.screen.screenKey) {
    case "ChallengeQuestionStep":
      return (
        <ChallengeStepFrame
          code={challengeCode}
          onCodeChange={onChallengeCodeChange}
          onContinue={onChallengeContinue}
        />
      );
    case "AddMoreDetailStep":
      return (
        <>
          <RequestDetailEditor value={detailText} onChange={onDetailChange} />
          <ContinuationRecoveryBridge route={route} onNavigate={onNavigate} />
        </>
      );
    case "UploadEvidenceStep":
      return (
        <UploadTrayMobile uploadNames={uploadNames} onUploadNamesChange={onUploadNamesChange} />
      );
    case "ReviewBeforeSubmitStep":
      return <ReviewSummary route={route} detailText={detailText} uploadNames={uploadNames} />;
    case "ReplayMappedOutcome":
    case "StaleLinkRecoveryBridge":
      return <ContinuationRecoveryBridge route={route} onNavigate={onNavigate} />;
    case "ManualOnlyOutcome":
      return (
        <section className="mobile-continuation__manual" data-testid="manual-only-outcome">
          <h2>Manual-only route</h2>
          <p>
            This is a safe outcome, not a redeemable continuation. No captured patient detail is
            available on this screen.
          </p>
        </section>
      );
    default:
      return null;
  }
}

export { isMobileSmsContinuationPath };

export default function MobileSmsContinuationApp() {
  const {
    route,
    announcement,
    titleRef,
    actionRef,
    detailText,
    uploadNames,
    challengeCode,
    setChallengeCode,
    navigate,
    updateDetailText,
    updateUploadNames,
    completeChallenge,
    restoreCurrentStep,
  } = useMobileContinuationController();
  const showCapturedContext =
    route.screen.revealsSeededContext &&
    route.context.patientSecureLinkSessionProjection.handsetVerified;

  return (
    <div
      className="mobile-continuation"
      data-testid="Mobile_SMS_Continuation_Route"
      data-task-id={MOBILE_SMS_CONTINUATION_TASK_ID}
      data-visual-mode={route.visualMode}
      data-screen-key={route.screen.screenKey}
      data-eligibility={route.context.eligibility}
      data-selected-step={route.context.patientRequestReturnBundle.selectedMobileStep}
      data-reveals-seeded-context={String(route.screen.revealsSeededContext)}
    >
      <ContinuationHeaderBand route={route} />
      <main className="mobile-continuation__phone-shell" data-testid="mobile-continuation-main">
        <div className="mobile-continuation__top-row">
          <MobileProgressStrip
            stepKey={route.screen.stepKey}
            index={route.screen.progressIndex}
            total={route.screen.progressTotal}
          />
          <ContinuationSaveStateChip route={route} />
        </div>
        <section
          className={`mobile-continuation__screen mobile-continuation__screen--${route.screen.accent}`}
          data-testid={`screen-${route.screen.screenKey}`}
          data-route-intent={route.context.routeIntentBinding.routeIntent}
          data-redemption-state={route.context.accessGrantRedemptionRecord.redemptionState}
          aria-labelledby="mobile-continuation-title"
        >
          <p className="mobile-continuation__eyebrow">{route.screen.eyebrow}</p>
          <h1 id="mobile-continuation-title" ref={titleRef} tabIndex={-1}>
            {route.screen.title}
          </h1>
          <p>{route.screen.body}</p>
          <CapturedSoFarPanel
            rows={route.context.safeCapturedContext}
            verified={showCapturedContext}
          />
          {renderScreenSpecificContent({
            route,
            detailText,
            uploadNames,
            challengeCode,
            onDetailChange: updateDetailText,
            onUploadNamesChange: updateUploadNames,
            onChallengeCodeChange: setChallengeCode,
            onChallengeContinue: completeChallenge,
            onNavigate: navigate,
          })}
        </section>
        <section
          className="mobile-continuation__return-contract"
          data-testid="return-contract-panel"
        >
          <h2>Return rules</h2>
          <p>
            {route.context.patientRequestReturnBundle.canonicalPhase1Semantics.replaceAll("_", " ")}
          </p>
          <button
            type="button"
            className="mobile-continuation__text-button"
            data-testid="restore-current-step-action"
            onClick={restoreCurrentStep}
          >
            Restore current mobile step
          </button>
        </section>
      </main>
      <BottomActionDock route={route} actionRef={actionRef} onNavigate={navigate} />
      <div
        className="mobile-continuation__live-region"
        data-testid="continuation-live-region"
        aria-live="polite"
      >
        {announcement}
      </div>
    </div>
  );
}
