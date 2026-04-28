import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type RefObject,
} from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import {
  CLAIM_RESUME_IDENTITY_HOLD_TASK_ID,
  ClaimResumePostureResolver,
  isClaimResumeIdentityHoldPath,
  type ClaimResumePostureProjection,
  type ClaimResumeRouteProjection,
  type PreservedContinuityContext,
} from "./claim-resume-identity-hold.model";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";

const CLAIM_RESUME_STORAGE_KEY = "claim-resume-197::last-posture";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function readLastPosture(): string | null {
  const ownerWindow = safeWindow();
  return ownerWindow?.sessionStorage.getItem(CLAIM_RESUME_STORAGE_KEY) ?? null;
}

function writeLastPosture(postureKey: string): void {
  const ownerWindow = safeWindow();
  ownerWindow?.sessionStorage.setItem(CLAIM_RESUME_STORAGE_KEY, postureKey);
}

function useClaimResumeController() {
  const initialPathname = safeWindow()?.location.pathname ?? "/portal/claim/pending";
  const restoredPostureRef = useRef<string | null>(readLastPosture());
  const [route, setRoute] = useState<ClaimResumeRouteProjection>(() =>
    ClaimResumePostureResolver(initialPathname),
  );
  const [announcement, setAnnouncement] = useState(
    restoredPostureRef.current
      ? `Restored ${restoredPostureRef.current.replaceAll("_", " ")} posture.`
      : "Claim resume posture loaded.",
  );
  const titleRef = useRef<HTMLHeadingElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);

  const resolvePath = useEffectEvent((pathname: string, mode: "soft" | "refresh") => {
    const nextRoute = ClaimResumePostureResolver(pathname);
    setRoute(nextRoute);
    writeLastPosture(nextRoute.posture.postureKey);
    setAnnouncement(
      mode === "refresh"
        ? `${nextRoute.posture.postureKey.replaceAll("_", " ")} posture restored in the same shell.`
        : `${nextRoute.posture.postureKey.replaceAll("_", " ")} posture opened.`,
    );
  });

  useEffect(() => {
    writeLastPosture(route.posture.postureKey);
  }, [route.posture.postureKey]);

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
      route.posture.postureKey === "claim_pending" ? titleRef.current : actionRef.current;
    focusTarget?.focus({ preventScroll: true });
  }, [route.posture.postureKey]);

  function navigate(pathname: string): void {
    const ownerWindow = safeWindow();
    startTransition(() => {
      const nextRoute = ClaimResumePostureResolver(pathname);
      setRoute(nextRoute);
      writeLastPosture(nextRoute.posture.postureKey);
      setAnnouncement(`${nextRoute.posture.postureKey.replaceAll("_", " ")} posture opened.`);
      ownerWindow?.history.pushState({}, "", pathname);
    });
  }

  function restoreCurrentPosture(): void {
    resolvePath(safeWindow()?.location.pathname ?? route.pathname, "refresh");
  }

  return { route, announcement, titleRef, actionRef, navigate, restoreCurrentPosture };
}

function ContinuityContextPanel({ contexts }: { contexts: readonly PreservedContinuityContext[] }) {
  return (
    <aside
      className="claim-resume__context-panel"
      data-testid="continuity-context-panel"
      aria-labelledby="continuity-context-title"
    >
      <h2 id="continuity-context-title">What we kept in place</h2>
      <dl>
        {contexts.map((context) => (
          <div key={`${context.label}-${context.value}`} data-visibility={context.visibility}>
            <dt>{context.label}</dt>
            <dd>{context.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function ProgressRail() {
  return (
    <div className="claim-resume__progress" data-testid="claim-pending-progress" role="status">
      <span />
      <span />
      <span />
      Attaching safely
    </div>
  );
}

function PostureShell({
  posture,
  titleRef,
  actionRef,
  onNavigate,
}: {
  posture: ClaimResumePostureProjection;
  titleRef: RefObject<HTMLHeadingElement | null>;
  actionRef: RefObject<HTMLButtonElement | null>;
  onNavigate: (pathname: string) => void;
}) {
  return (
    <section
      className={`claim-resume__posture claim-resume__posture--${posture.accent}`}
      data-testid={`posture-${posture.postureKey}`}
      data-posture-key={posture.postureKey}
      data-reason-code={posture.reasonCode}
      data-writable-allowed={String(posture.writableAllowed)}
      data-coverage={posture.patientAudienceCoverageProjection.maxVisibleDetail}
      aria-labelledby="claim-resume-title"
    >
      <div className="claim-resume__eyebrow">{posture.reasonCode.replaceAll("_", " ")}</div>
      <h1 id="claim-resume-title" ref={titleRef} tabIndex={-1}>
        {posture.title}
      </h1>
      <p>{posture.explanation}</p>
      {posture.showProgress ? <ProgressRail /> : null}
      <div className="claim-resume__action-row">
        <button
          type="button"
          ref={actionRef}
          data-testid="dominant-next-safe-action"
          onClick={() => onNavigate(posture.dominantActionPath)}
        >
          {posture.dominantActionLabel}
        </button>
        {posture.secondaryActionLabel && posture.secondaryActionPath ? (
          <button
            type="button"
            className="claim-resume__secondary-action"
            data-testid="secondary-safe-action"
            onClick={() => onNavigate(posture.secondaryActionPath ?? "/portal/claim/pending")}
          >
            {posture.secondaryActionLabel}
          </button>
        ) : null}
      </div>
      <div className="claim-resume__policy-strip" data-testid="privacy-boundary-strip">
        <strong>{posture.patientIdentityHoldProjection.releaseActionLabel}</strong>
        <span>{posture.patientIdentityHoldProjection.patientSafeReason}</span>
      </div>
    </section>
  );
}

function ClaimPendingFrame(props: Parameters<typeof PostureShell>[0]) {
  return <PostureShell {...props} />;
}

function ReadOnlyReturnFrame(props: Parameters<typeof PostureShell>[0]) {
  return <PostureShell {...props} />;
}

function IdentityHoldBridge(props: Parameters<typeof PostureShell>[0]) {
  return <PostureShell {...props} />;
}

function RebindRequiredBridge(props: Parameters<typeof PostureShell>[0]) {
  return <PostureShell {...props} />;
}

function StaleGrantMappedOutcomeCard(props: Parameters<typeof PostureShell>[0]) {
  return <PostureShell {...props} />;
}

function RecoverOnlyFrame(props: Parameters<typeof PostureShell>[0]) {
  return <PostureShell {...props} />;
}

function renderPostureFrame(
  posture: ClaimResumePostureProjection,
  commonProps: Omit<Parameters<typeof PostureShell>[0], "posture">,
) {
  const props = { ...commonProps, posture };
  switch (posture.postureKey) {
    case "claim_pending":
      return <ClaimPendingFrame {...props} />;
    case "read_only":
      return <ReadOnlyReturnFrame {...props} />;
    case "identity_hold":
    case "wrong_patient_freeze":
      return <IdentityHoldBridge {...props} />;
    case "rebind_required":
      return <RebindRequiredBridge {...props} />;
    case "stale_link_mapped":
    case "stale_grant_mapped":
    case "promoted_draft_mapped":
      return <StaleGrantMappedOutcomeCard {...props} />;
    case "recover_only":
    case "support_recovery_required":
      return <RecoverOnlyFrame {...props} />;
    default:
      return <PostureShell {...props} />;
  }
}

export { isClaimResumeIdentityHoldPath };

export default function ClaimResumeIdentityHoldApp() {
  const { route, announcement, titleRef, actionRef, navigate, restoreCurrentPosture } =
    useClaimResumeController();
  const posture = route.posture;
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: route.pathname,
  });
  const navItems = [
    { label: "Pending", path: "/portal/claim/pending", key: "claim_pending" },
    { label: "Read-only", path: "/portal/claim/read-only", key: "read_only" },
    { label: "Hold", path: "/portal/claim/identity-hold", key: "identity_hold" },
    { label: "Rebind", path: "/portal/claim/rebind-required", key: "rebind_required" },
  ] as const;

  return (
    <div
      className="claim-resume"
      data-testid="Claim_Resume_Identity_Hold_Route"
      data-task-id={CLAIM_RESUME_IDENTITY_HOLD_TASK_ID}
      data-visual-mode={route.visualMode}
      data-posture-key={posture.postureKey}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-cause-class={phase2Context.causeClass}
      data-recovery-class={phase2Context.recoveryClass}
      data-canonical-status-label={phase2Context.canonicalStatusLabel}
    >
      <header className="claim-resume__shell-band" data-testid="claim-resume-shell-band">
        <div>
          <VecellLogoWordmark aria-hidden="true" className="claim-resume__wordmark" />
          <span>Continuity bridge</span>
        </div>
        <button type="button" data-testid="restore-current-posture" onClick={restoreCurrentPosture}>
          Restore this posture
        </button>
      </header>
      <PatientSupportPhase2Bridge context={phase2Context} />
      <div className="claim-resume__layout">
        <nav
          className="claim-resume__nav"
          data-testid="claim-resume-left-rail"
          aria-label="Claim and recovery postures"
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={posture.postureKey === item.key ? "page" : undefined}
              data-testid={`claim-nav-${item.key}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <main className="claim-resume__main" data-testid="claim-resume-main">
          <div className="claim-resume__content-zone">
            {renderPostureFrame(posture, { titleRef, actionRef, onNavigate: navigate })}
            <ContinuityContextPanel contexts={posture.preservedContext} />
          </div>
        </main>
      </div>
      <div
        className="claim-resume__live-region"
        data-testid="claim-resume-live-region"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </div>
    </div>
  );
}
