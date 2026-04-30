import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type RefObject,
} from "react";
import { PatientPortalTopBar } from "./patient-portal-top-bar";
import {
  SIGNED_IN_REQUEST_START_TASK_ID,
  SignedInRequestEntryResolver,
  isSignedInRequestStartPath,
  type SignedInRequestEntryProjection,
} from "./signed-in-request-start-restore.model";

const SIGNED_IN_RESTORE_STORAGE_KEY = "signed-in-request-199::return-bundle";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function writeReturnBundle(projection: SignedInRequestEntryProjection): void {
  safeWindow()?.sessionStorage.setItem(
    SIGNED_IN_RESTORE_STORAGE_KEY,
    JSON.stringify({
      ...projection.patientRequestReturnBundle,
      restoredBy: "refresh_replay",
    }),
  );
}

function readStoredRestoreSummary(): string | null {
  const raw = safeWindow()?.sessionStorage.getItem(SIGNED_IN_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as { lastSafeSummary?: string; selectedStepKey?: string };
    return parsed.lastSafeSummary && parsed.selectedStepKey
      ? `${parsed.selectedStepKey.replaceAll("_", " ")} restored after refresh`
      : null;
  } catch {
    return null;
  }
}

function displaySavedKey(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function useSignedInRequestController() {
  const initialPathname = safeWindow()?.location.pathname ?? "/portal/start-request";
  const restoredSummaryRef = useRef(readStoredRestoreSummary());
  const [projection, setProjection] = useState<SignedInRequestEntryProjection>(() =>
    SignedInRequestEntryResolver(initialPathname),
  );
  const [accountOpen, setAccountOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(
    restoredSummaryRef.current ?? "Signed-in request entry loaded.",
  );
  const titleRef = useRef<HTMLHeadingElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);

  const resolvePath = useEffectEvent((pathname: string, mode: "soft" | "refresh") => {
    const nextProjection = SignedInRequestEntryResolver(pathname);
    setProjection(nextProjection);
    writeReturnBundle(nextProjection);
    setAnnouncement(
      mode === "refresh"
        ? `${nextProjection.patientRequestReturnBundle.selectedStepKey.replaceAll(
            "_",
            " ",
          )} restored with the same anchor.`
        : `${nextProjection.screen.mode.replaceAll("_", " ")} opened in the signed-in shell.`,
    );
  });

  useEffect(() => {
    writeReturnBundle(projection);
  }, [projection]);

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
    if (
      projection.screen.screenKey === "SavedContextRestoreEntry" ||
      projection.screen.screenKey === "PromotedDraftMappedOutcome"
    ) {
      actionRef.current?.focus({ preventScroll: true });
      return;
    }
    titleRef.current?.focus({ preventScroll: true });
  }, [projection.screen.screenKey]);

  function navigate(pathname: string): void {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    if (!pathname.startsWith("/portal/start-request")) {
      writeReturnBundle(projection);
      ownerWindow.location.assign(pathname);
      return;
    }
    startTransition(() => {
      const nextProjection = SignedInRequestEntryResolver(pathname);
      setProjection(nextProjection);
      writeReturnBundle(nextProjection);
      setAnnouncement(`${nextProjection.screen.mode.replaceAll("_", " ")} opened.`);
      ownerWindow.history.pushState({}, "", pathname);
    });
  }

  function restoreCurrentPath(): void {
    resolvePath(safeWindow()?.location.pathname ?? projection.pathname, "refresh");
  }

  return {
    projection,
    accountOpen,
    announcement,
    titleRef,
    actionRef,
    navigate,
    restoreCurrentPath,
    setAccountOpen,
  };
}

export function SavedContextCard({
  projection,
  onNavigate,
}: {
  projection: SignedInRequestEntryProjection;
  onNavigate: (pathname: string) => void;
}) {
  const card = projection.savedContextCard;
  return (
    <section
      className="signed-in-start__saved-card"
      data-testid="saved-context-card"
      aria-labelledby="saved-context-title"
    >
      <div>
        <p className="signed-in-start__eyebrow">Saved context</p>
        <h2 id="saved-context-title">{card.requestType} request</h2>
      </div>
      <dl>
        <div>
          <dt>Saved update</dt>
          <dd>{card.lastMeaningfulUpdate}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>{card.dominantActionLabel}</dd>
        </div>
        <div>
          <dt>Current section</dt>
          <dd>{displaySavedKey(card.selectedAnchorKey)}</dd>
        </div>
      </dl>
      <button
        type="button"
        data-testid="saved-context-card-action"
        onClick={() => onNavigate(card.dominantActionPath)}
      >
        {card.dominantActionLabel}
      </button>
    </section>
  );
}

export function DraftContinuitySummary({
  projection,
}: {
  projection: SignedInRequestEntryProjection;
}) {
  const bundle = projection.patientRequestReturnBundle;
  return (
    <aside
      className="signed-in-start__continuity"
      data-testid="draft-continuity-summary"
      aria-labelledby="draft-continuity-title"
    >
      <h2 id="draft-continuity-title">Saved request details</h2>
      <dl>
        <div>
          <dt>Reference</dt>
          <dd>Saved request</dd>
        </div>
        <div>
          <dt>Step</dt>
          <dd>{displaySavedKey(bundle.selectedStepKey)}</dd>
        </div>
        <div>
          <dt>Place</dt>
          <dd>{displaySavedKey(bundle.selectedAnchorKey)}</dd>
        </div>
        <div>
          <dt>Summary</dt>
          <dd>{bundle.lastSafeSummary}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function RestoreDecisionNotice({
  projection,
}: {
  projection: SignedInRequestEntryProjection;
}) {
  const resolution = projection.savedContextResolution;
  return (
    <section
      className={`signed-in-start__decision signed-in-start__decision--${projection.screen.accent}`}
      data-testid="restore-decision-notice"
      data-decision={resolution.decision}
      data-reason-code={resolution.reasonCode}
      aria-labelledby="restore-decision-title"
    >
      <p className="signed-in-start__eyebrow">Saved request</p>
      <h2 id="restore-decision-title">
        {resolution.opensDraftForEditing ? "Ready to continue" : "View current status"}
      </h2>
      <p>Your saved request details are checked before we send you to the next safe step.</p>
    </section>
  );
}

export function AuthenticatedAccountDisclosure({
  projection,
  open,
  onToggle,
}: {
  projection: SignedInRequestEntryProjection;
  open: boolean;
  onToggle: () => void;
}) {
  const disclosure = projection.accountDisclosure;
  return (
    <aside
      className="signed-in-start__account"
      data-testid="authenticated-account-disclosure"
      data-dominance={disclosure.dominance}
      aria-labelledby="account-disclosure-title"
    >
      <button type="button" data-testid="account-disclosure-toggle" onClick={onToggle}>
        {disclosure.label}
      </button>
      <div hidden={!open}>
        <h2 id="account-disclosure-title">Quiet account disclosure</h2>
        <p>{disclosure.summary}</p>
        <p>{disclosure.maskedPatientRef}</p>
      </div>
    </aside>
  );
}

export function SignedInMissionFrame({
  projection,
  titleRef,
  actionRef,
  accountOpen,
  onToggleAccount,
  onNavigate,
  onRestore,
}: {
  projection: SignedInRequestEntryProjection;
  titleRef: RefObject<HTMLHeadingElement | null>;
  actionRef: RefObject<HTMLButtonElement | null>;
  accountOpen: boolean;
  onToggleAccount: () => void;
  onNavigate: (pathname: string) => void;
  onRestore: () => void;
}) {
  const screen = projection.screen;
  return (
    <div className="signed-in-start__layout">
      <main className="signed-in-start__main" data-testid="signed-in-request-main">
        <section
          className={`signed-in-start__hero signed-in-start__hero--${screen.accent}`}
          data-testid={`screen-${screen.screenKey}`}
          aria-labelledby="signed-in-start-title"
        >
          <p className="signed-in-start__eyebrow">{screen.eyebrow}</p>
          <h1 id="signed-in-start-title" ref={titleRef} tabIndex={-1}>
            {screen.title}
          </h1>
          <p>{screen.body}</p>
          <div className="signed-in-start__actions">
            <button
              type="button"
              ref={actionRef}
              data-testid={screen.focusTestId}
              onClick={() => onNavigate(screen.dominantActionPath)}
            >
              {screen.dominantActionLabel}
            </button>
            {screen.secondaryActionLabel && screen.secondaryActionPath ? (
              <button
                type="button"
                className="signed-in-start__secondary-button"
                data-testid="signed-in-secondary-action"
                onClick={() => onNavigate(screen.secondaryActionPath ?? "/portal/start-request")}
              >
                {screen.secondaryActionLabel}
              </button>
            ) : null}
          </div>
        </section>
        {screen.screenKey === "PromotedDraftMappedOutcome" ? (
          <section className="signed-in-start__mapped" data-testid="promoted-draft-mapped-outcome">
            <h2>Request already sent</h2>
            <p>This saved draft is now a live request, so changes are closed here.</p>
          </section>
        ) : null}
        {screen.screenKey === "NarrowedWritePostureEntry" ? (
          <section className="signed-in-start__mapped" data-testid="narrowed-write-posture-entry">
            <h2>Access check needed</h2>
            <p>Complete the safety check before editing this request again.</p>
          </section>
        ) : null}
        <RestoreDecisionNotice projection={projection} />
        <SavedContextCard projection={projection} onNavigate={onNavigate} />
        <button
          type="button"
          className="signed-in-start__restore-button"
          data-testid="restore-current-context-action"
          onClick={onRestore}
        >
          Restore current signed-in context
        </button>
      </main>
      <aside className="signed-in-start__side" aria-label="Saved request context">
        <DraftContinuitySummary projection={projection} />
        <AuthenticatedAccountDisclosure
          projection={projection}
          open={accountOpen}
          onToggle={onToggleAccount}
        />
      </aside>
    </div>
  );
}

export { isSignedInRequestStartPath };

export default function SignedInRequestStartRestoreApp() {
  const {
    projection,
    accountOpen,
    announcement,
    titleRef,
    actionRef,
    navigate,
    restoreCurrentPath,
    setAccountOpen,
  } = useSignedInRequestController();

  return (
    <div
      className="signed-in-start"
      data-testid="Signed_In_Request_Start_Restore_Route"
      data-task-id={SIGNED_IN_REQUEST_START_TASK_ID}
      data-visual-mode={projection.visualMode}
      data-screen-key={projection.screen.screenKey}
      data-entry-mode={projection.screen.mode}
      data-route-family={projection.routeIntentBinding.routeFamily}
      data-canonical-target={projection.savedContextResolution.canonicalTargetPath}
      data-selected-anchor={projection.patientRequestReturnBundle.selectedAnchorKey}
      data-selected-step={projection.patientRequestReturnBundle.selectedStepKey}
      data-local-cache-only={String(projection.savedContextResolution.usesLocalCacheOnly)}
      data-maps-to-request-truth={String(projection.savedContextResolution.mapsToRequestTruth)}
      data-supported-testids="signed-in-start-request-action continue-draft-entry-action restore-saved-context-action promoted-draft-mapped-action narrowed-write-posture-action"
    >
      <PatientPortalTopBar
        current="requests"
        patientRef={projection.patientPortalEntryProjection.maskedPatientRef}
        testId="signed-in-mission-top-band"
        onNavigate={navigate}
      />
      <SignedInMissionFrame
        projection={projection}
        titleRef={titleRef}
        actionRef={actionRef}
        accountOpen={accountOpen}
        onToggleAccount={() => setAccountOpen((value) => !value)}
        onNavigate={navigate}
        onRestore={restoreCurrentPath}
      />
      <div
        className="signed-in-start__live-region"
        data-testid="signed-in-start-live-region"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </div>
    </div>
  );
}
