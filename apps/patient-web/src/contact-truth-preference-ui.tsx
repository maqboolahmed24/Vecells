import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type RefObject,
} from "react";
import { VecellLogoWordmark } from "@vecells/design-system";
import {
  CONTACT_TRUTH_TASK_ID,
  ContactTruthWorkspaceResolver,
  isContactTruthPreferencePath,
  type ContactSourceProvenanceDescriptor,
  type ContactTruthWorkspaceRouteProjection,
  type DemographicSourceProjection,
  type PatientPreferenceStateProjection,
  type SourceTruthDescriptor,
} from "./contact-truth-preference-ui.model";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function provenanceTestId(sourceLabel: string): string {
  return `provenance-badge-row-${sourceLabel.toLowerCase().replaceAll(" ", "-")}`;
}

export function AccountDetailsHeader({
  projection,
  titleRef,
}: {
  projection: ContactTruthWorkspaceRouteProjection;
  titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <header className="contact-truth__header" data-testid="account-details-header">
      <div>
        <p className="contact-truth__eyebrow">Account details</p>
        <h1 ref={titleRef} tabIndex={-1}>
          {projection.accountHeader.title}
        </h1>
      </div>
      <p>{projection.accountHeader.summary}</p>
      <dl aria-label="Signed-in account summary">
        <div>
          <dt>Patient</dt>
          <dd>{projection.accountHeader.patientLabel}</dd>
        </div>
        <div>
          <dt>Account reference</dt>
          <dd>{projection.accountHeader.maskedAccountRef}</dd>
        </div>
      </dl>
    </header>
  );
}

export function ProvenanceBadgeRow({
  provenance,
}: {
  provenance: ContactSourceProvenanceDescriptor;
}) {
  return (
    <ul
      className="contact-truth__provenance"
      data-testid={provenanceTestId(provenance.sourceLabel)}
      aria-label={`${provenance.sourceLabel} provenance`}
    >
      {provenance.badges.map((badge) => (
        <li key={`${badge.label}-${badge.text}`} data-tone={badge.tone}>
          <span>{badge.label}</span>
          <strong>{badge.text}</strong>
        </li>
      ))}
      <li data-tone="neutral">
        <span>Authority</span>
        <strong>{provenance.editAuthorityLabel}</strong>
      </li>
    </ul>
  );
}

export function SourceTruthCard({ source }: { source: SourceTruthDescriptor }) {
  return (
    <article
      className="contact-truth__card contact-truth__card--nhs"
      data-testid="source-truth-card-nhs-login"
      data-source-family={source.family}
      data-editable-here={String(source.editableHere)}
      aria-labelledby="nhs-login-claim-title"
    >
      <ProvenanceBadgeRow provenance={source.provenance} />
      <div>
        <p className="contact-truth__eyebrow">View-only source</p>
        <h2 id="nhs-login-claim-title">{source.title}</h2>
        <p>{source.authorityBoundaryCopy}</p>
      </div>
      <dl>
        {source.maskedClaims.map((claim) => (
          <div key={claim.label}>
            <dt>{claim.label}</dt>
            <dd>
              <strong>{claim.value}</strong>
              <span>{claim.claimUse}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="contact-truth__boundary">{source.prohibitedSideEffectCopy}</p>
    </article>
  );
}

export function PreferenceLedgerCard({
  preference,
  reviewOpen,
  onReview,
}: {
  preference: PatientPreferenceStateProjection;
  reviewOpen: boolean;
  onReview: () => void;
}) {
  return (
    <article
      className="contact-truth__card contact-truth__card--preference"
      data-testid="preference-ledger-card"
      data-source-family={preference.family}
      data-editable-here={String(preference.editableHere)}
      data-no-external-write-side-effects={String(preference.noExternalWriteSideEffects)}
      aria-labelledby="preference-ledger-title"
    >
      <ProvenanceBadgeRow provenance={preference.provenance} />
      <div>
        <p className="contact-truth__eyebrow">Editable preference</p>
        <h2 id="preference-ledger-title">{preference.title}</h2>
        <p>{preference.preferenceBoundaryCopy}</p>
      </div>
      <dl>
        <div>
          <dt>Preferred route</dt>
          <dd>SMS updates on</dd>
        </div>
        <div>
          <dt>Email reminders</dt>
          <dd>Email receipts paused</dd>
        </div>
        <div>
          <dt>Reply windows</dt>
          <dd>SMS first, email as a fallback only when reviewed</dd>
        </div>
      </dl>
      <button type="button" data-testid="preference-review-action" onClick={onReview}>
        Review Vecells preference
      </button>
      {reviewOpen ? (
        <section
          className="contact-truth__review"
          data-testid="preference-review-panel"
          role="status"
        >
          <strong>Vecells communication behavior only</strong>
          <p>
            This review does not update NHS login claims, PDS demographic rows, or GP demographic
            rows.
          </p>
        </section>
      ) : null}
    </article>
  );
}

export function DemographicSourceCard({ source }: { source: DemographicSourceProjection }) {
  return (
    <article
      className="contact-truth__card contact-truth__card--external"
      data-testid={`demographic-source-card-${source.sourceLabel === "PDS" ? "pds" : "gp"}`}
      data-source-family={source.family}
      data-feature-gate={source.featureGate}
      data-row-available={String(source.rowAvailable)}
      data-editable-here={String(source.editableHere)}
      aria-labelledby={`${source.sourceId}-title`}
    >
      <ProvenanceBadgeRow provenance={source.provenance} />
      <div>
        <p className="contact-truth__eyebrow">External demographic row</p>
        <h2 id={`${source.sourceId}-title`}>{source.title}</h2>
        <p>{source.absenceExplanation}</p>
      </div>
      {source.rowAvailable ? (
        <dl>
          {source.maskedRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                <strong>{row.value}</strong>
                <span>{row.purpose}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="contact-truth__empty">Unavailable here. No value is inferred.</p>
      )}
      <p className="contact-truth__boundary">
        Vecells preference edits do not update this external demographic source.
      </p>
    </article>
  );
}

export function ReachabilityRiskPanel({
  projection,
}: {
  projection: ContactTruthWorkspaceRouteProjection;
}) {
  const risk = projection.reachabilitySummary;
  return (
    <aside
      className={`contact-truth__risk ${
        risk.blocksActivePath ? "contact-truth__risk--blocked" : ""
      }`}
      data-testid="reachability-risk-panel"
      data-blocks-active-path={String(risk.blocksActivePath)}
      data-promoted-to-visible-panel={String(risk.promotedToVisiblePanel)}
      role={risk.blocksActivePath ? "alert" : "status"}
      aria-labelledby="reachability-risk-title"
    >
      <p className="contact-truth__eyebrow">Reachability</p>
      <h2 id="reachability-risk-title">
        {risk.blocksActivePath ? "Repair needed before continuing" : "No active blocker"}
      </h2>
      <p>{risk.blockerReason}</p>
      {risk.blocksActivePath ? (
        <dl>
          <div>
            <dt>Blocked action</dt>
            <dd>{risk.blockedActionLabel}</dd>
          </div>
          <div>
            <dt>Affected paths</dt>
            <dd>{risk.affectedChannels.join(", ")}</dd>
          </div>
        </dl>
      ) : null}
    </aside>
  );
}

export function ContactRepairEntryCard({
  projection,
  repairStarted,
  returned,
  onRepair,
  onReturn,
  returnActionRef,
}: {
  projection: ContactTruthWorkspaceRouteProjection;
  repairStarted: boolean;
  returned: boolean;
  onRepair: () => void;
  onReturn: () => void;
  returnActionRef: RefObject<HTMLButtonElement | null>;
}) {
  const repair = projection.contactRepairProjection;
  return (
    <section
      className="contact-truth__repair"
      data-testid="contact-repair-entry-card"
      data-same-shell-required={String(repair.sameShellRequired)}
      data-context-preserved={String(repair.blockedActionContextPreserved)}
      data-repair-started={String(repairStarted)}
      data-returned-to-blocked-action={String(returned)}
      aria-labelledby="contact-repair-title"
    >
      <p className="contact-truth__eyebrow">Repair entry</p>
      <h2 id="contact-repair-title">{repair.repairEntryLabel}</h2>
      <p>{repair.repairCopy}</p>
      <div className="contact-truth__repair-actions">
        <button
          type="button"
          data-testid="contact-repair-action"
          disabled={projection.reachabilitySummary.blocksActivePath === false}
          onClick={onRepair}
        >
          Start contact repair
        </button>
        <button
          type="button"
          className="contact-truth__secondary-button"
          data-testid="contact-return-action"
          data-return-target={repair.returnTarget}
          ref={returnActionRef}
          onClick={onReturn}
        >
          Return to blocked action
        </button>
      </div>
      {repairStarted || returned ? (
        <p className="contact-truth__return-proof" data-testid="same-shell-return-proof">
          Same-shell context retained for {repair.returnTarget}.
        </p>
      ) : null}
    </section>
  );
}

function useContactTruthController() {
  const initialPathname = safeWindow()?.location.pathname ?? "/portal/account/contact";
  const [projection, setProjection] = useState<ContactTruthWorkspaceRouteProjection>(() =>
    ContactTruthWorkspaceResolver(initialPathname),
  );
  const [reviewOpen, setReviewOpen] = useState(false);
  const [repairStarted, setRepairStarted] = useState(false);
  const [returned, setReturned] = useState(false);
  const [announcement, setAnnouncement] = useState("Contact truth ledger loaded.");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnRef = useRef<HTMLButtonElement>(null);

  const resolvePath = useEffectEvent((pathname: string) => {
    const nextProjection = ContactTruthWorkspaceResolver(pathname);
    setProjection(nextProjection);
    setRepairStarted(false);
    setReturned(false);
    setAnnouncement(`${nextProjection.screenKey.replaceAll("_", " ")} opened.`);
  });

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const onPopState = () => startTransition(() => resolvePath(ownerWindow.location.pathname));
    ownerWindow.addEventListener("popstate", onPopState);
    return () => ownerWindow.removeEventListener("popstate", onPopState);
  }, [resolvePath]);

  useEffect(() => {
    if (projection.reachabilitySummary.blocksActivePath) {
      returnRef.current?.focus({ preventScroll: true });
      return;
    }
    titleRef.current?.focus({ preventScroll: true });
  }, [projection.screenKey, projection.reachabilitySummary.blocksActivePath]);

  function navigate(pathname: string): void {
    const ownerWindow = safeWindow();
    startTransition(() => {
      const nextProjection = ContactTruthWorkspaceResolver(pathname);
      setProjection(nextProjection);
      setRepairStarted(false);
      setReturned(false);
      ownerWindow?.history.pushState({}, "", pathname);
      setAnnouncement(`${nextProjection.screenKey.replaceAll("_", " ")} opened.`);
    });
  }

  function reviewPreference(): void {
    setReviewOpen(true);
    setAnnouncement(
      "Vecells preference review opened. This does not update NHS login, PDS, or GP rows.",
    );
  }

  function startRepair(): void {
    setRepairStarted(true);
    setAnnouncement("Contact repair started in the same account shell.");
  }

  function returnToBlockedAction(): void {
    setReturned(true);
    setAnnouncement(
      `Returned to blocked action context ${projection.patientNavReturnContract.returnTarget} in the same shell.`,
    );
    returnRef.current?.focus({ preventScroll: true });
  }

  return {
    projection,
    reviewOpen,
    repairStarted,
    returned,
    announcement,
    titleRef,
    returnRef,
    navigate,
    reviewPreference,
    startRepair,
    returnToBlockedAction,
  };
}

export { isContactTruthPreferencePath };

export default function ContactTruthPreferenceApp() {
  const {
    projection,
    reviewOpen,
    repairStarted,
    returned,
    announcement,
    titleRef,
    returnRef,
    navigate,
    reviewPreference,
    startRepair,
    returnToBlockedAction,
  } = useContactTruthController();

  return (
    <div
      className="contact-truth"
      data-testid="Contact_Truth_Preference_Route"
      data-task-id={CONTACT_TRUTH_TASK_ID}
      data-visual-mode={projection.visualMode}
      data-route-family={projection.routeFamily}
      data-source-families="nhs_login_claim vecells_preference external_demographic"
      data-screen-key={projection.screenKey}
      data-workspace-mode={projection.mode}
      data-blocks-active-path={String(projection.reachabilitySummary.blocksActivePath)}
      data-same-shell-return={String(returned)}
      data-supported-testids="account-details-header provenance-badge-row-nhs-login provenance-badge-row-vecells-preferences provenance-badge-row-pds provenance-badge-row-gp-system source-truth-card-nhs-login preference-ledger-card demographic-source-card-pds demographic-source-card-gp reachability-risk-panel contact-repair-entry-card contact-repair-action contact-return-action preference-review-action"
    >
      <header className="contact-truth__top-band" data-testid="contact-truth-top-band">
        <div>
          <VecellLogoWordmark aria-hidden="true" className="contact-truth__wordmark" />
          <span>Contact truth and communication preferences</span>
        </div>
        <nav aria-label="Contact truth modes">
          <button type="button" onClick={() => navigate("/portal/account/contact")}>
            Ledger
          </button>
          <button type="button" onClick={() => navigate("/portal/account/contact/repair")}>
            Repair path
          </button>
          <button type="button" onClick={() => navigate("/portal/account/contact/external-off")}>
            External-off view
          </button>
        </nav>
      </header>
      <main className="contact-truth__shell" aria-labelledby="contact-truth-title">
        <section className="contact-truth__workspace">
          <div className="contact-truth__main-column">
            <AccountDetailsHeader projection={projection} titleRef={titleRef} />
            <h1 id="contact-truth-title" hidden>
              Contact truth ledger
            </h1>
            <div className="contact-truth__source-grid" data-testid="contact-source-card-grid">
              <SourceTruthCard source={projection.nhsLoginClaim} />
              <PreferenceLedgerCard
                preference={projection.vecellsPreference}
                reviewOpen={reviewOpen}
                onReview={reviewPreference}
              />
              {projection.demographicSources.map((source) => (
                <DemographicSourceCard key={source.sourceId} source={source} />
              ))}
            </div>
          </div>
          <aside
            className={`contact-truth__repair-column ${
              projection.reachabilitySummary.blocksActivePath
                ? "contact-truth__repair-column--active"
                : ""
            }`}
            aria-label="Reachability and repair"
          >
            <ReachabilityRiskPanel projection={projection} />
            <ContactRepairEntryCard
              projection={projection}
              repairStarted={repairStarted}
              returned={returned}
              onRepair={startRepair}
              onReturn={returnToBlockedAction}
              returnActionRef={returnRef}
            />
          </aside>
        </section>
      </main>
      <div
        className="contact-truth__live-region"
        data-testid="contact-truth-live-region"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </div>
    </div>
  );
}
