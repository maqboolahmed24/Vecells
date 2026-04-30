import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { resolvePortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";
import "./patient-network-alternative-choice.css";
import "./patient-portal-unified-system.css";
import { PatientSupportPhase2Bridge } from "./patient-support-phase2-bridge";
import { PatientPortalTopBar } from "./patient-portal-top-bar";
import {
  BookingResponsiveProvider,
  BookingResponsiveStage,
  BookingStickyActionTray,
  EmbeddedBookingChromeAdapter,
  useBookingResponsive,
} from "./patient-booking-responsive";
import {
  PATIENT_NETWORK_ALTERNATIVE_CHOICE_TASK_ID,
  PATIENT_NETWORK_ALTERNATIVE_CHOICE_VISUAL_MODE,
  isPatientNetworkAlternativeChoicePath,
  resolvePatientNetworkAlternativeChoiceProjectionByScenarioId,
  resolvePatientNetworkAlternativeChoiceScenarioId,
  type AlternativeOfferCardProjection328,
  type AlternativeOfferProvenanceStubProjection328,
  type AlternativeOfferReasonChip,
  type HubOfferProjectionActionabilityState,
  type HubOfferProjectionConfirmationTruthState,
  type HubOfferProjectionFallbackLinkState,
  type HubOfferProjectionOfferState,
  type HubOfferProjectionPatientVisibilityState,
  type NetworkChoiceOriginKey,
  type NetworkChoiceScenarioId,
  type OfferRouteRepairPanelProjection328,
  type PatientNetworkAlternativeChoiceProjection,
} from "./patient-network-alternative-choice.model";

export { isPatientNetworkAlternativeChoicePath };

const NETWORK_CHOICE_RESTORE_STORAGE_KEY = "patient-network-choice-328::restore-bundle";

type NetworkChoiceLocalActionState =
  | "idle"
  | "accept_pending"
  | "declined_all"
  | "callback_pending";

interface NetworkChoiceReturnContract {
  readonly originKey: NetworkChoiceOriginKey;
  readonly returnRouteRef: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorLabel: string;
  readonly shellContinuityKey: string;
}

interface NetworkChoiceRestoreBundle {
  readonly projectionName: "NetworkChoiceRestoreBundle328";
  readonly pathname: string;
  readonly search: string;
  readonly scenarioId: NetworkChoiceScenarioId;
  readonly selectedOfferEntryId: string | null;
  readonly actionState: NetworkChoiceLocalActionState;
  readonly shellContinuityKey: string;
}

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function safeDocument(): Document | undefined {
  return typeof document === "undefined" ? undefined : document;
}

function prefersReducedMotion(): boolean {
  const ownerWindow = safeWindow();
  return ownerWindow?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
}

function normalizeReturnRoute(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/requests";
  }
  return value;
}

function normalizeOriginKey(value: string | null): NetworkChoiceOriginKey {
  if (
    value === "home" ||
    value === "requests" ||
    value === "appointments" ||
    value === "secure_link"
  ) {
    return value;
  }
  return "requests";
}

function buildReturnContract(
  projection: PatientNetworkAlternativeChoiceProjection,
  search: string,
): NetworkChoiceReturnContract {
  const params = new URLSearchParams(search);
  const originKey = normalizeOriginKey(params.get("origin"));
  const returnRouteRef = normalizeReturnRoute(params.get("returnRoute"));
  const selectedAnchorRef = params.get("anchor") ?? projection.session.selectedAnchorRef;
  const selectedAnchorLabel = params.get("anchorLabel") ?? "Network alternative choice";

  return {
    originKey,
    returnRouteRef,
    selectedAnchorRef,
    selectedAnchorLabel,
    shellContinuityKey: [
      "patient-network-choice",
      originKey,
      returnRouteRef,
      projection.sameShellContinuationRef,
    ].join("::"),
  };
}

function readRestoreBundle(): NetworkChoiceRestoreBundle | null {
  const ownerWindow = safeWindow();
  const historyState = ownerWindow?.history.state as
    | { networkChoice?: NetworkChoiceRestoreBundle }
    | undefined;
  if (historyState?.networkChoice?.projectionName === "NetworkChoiceRestoreBundle328") {
    return historyState.networkChoice;
  }

  const raw = ownerWindow?.sessionStorage.getItem(NETWORK_CHOICE_RESTORE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as NetworkChoiceRestoreBundle;
    return parsed.projectionName === "NetworkChoiceRestoreBundle328" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRestoreBundle(bundle: NetworkChoiceRestoreBundle, replace = true): void {
  const ownerWindow = safeWindow();
  ownerWindow?.sessionStorage.setItem(NETWORK_CHOICE_RESTORE_STORAGE_KEY, JSON.stringify(bundle));
  const nextState = {
    ...(ownerWindow?.history.state ?? {}),
    networkChoice: bundle,
  };
  if (replace) {
    ownerWindow?.history.replaceState(nextState, "", `${bundle.pathname}${bundle.search}`);
    return;
  }
  ownerWindow?.history.pushState(nextState, "", `${bundle.pathname}${bundle.search}`);
}

function focusStageHeading(): void {
  safeDocument()
    ?.querySelector<HTMLElement>("[data-testid='patient-network-choice-heading']")
    ?.focus({ preventScroll: true });
}

function focusOfferCard(offerEntryId: string | null): void {
  if (!offerEntryId) {
    return;
  }
  safeDocument()
    ?.querySelector<HTMLElement>(
      `[data-offer-card='${offerEntryId}'] .patient-network-choice__card-button`,
    )
    ?.focus({ preventScroll: true });
}

function resolveRuntimeTruth(
  projection: PatientNetworkAlternativeChoiceProjection,
  actionState: NetworkChoiceLocalActionState,
) {
  const truth = projection.truthProjection;
  let offerState: HubOfferProjectionOfferState = truth.offerState;
  let offerActionabilityState: HubOfferProjectionActionabilityState = truth.offerActionabilityState;
  let fallbackLinkState: HubOfferProjectionFallbackLinkState = truth.fallbackLinkState;
  let confirmationTruthState: HubOfferProjectionConfirmationTruthState =
    truth.confirmationTruthState;
  let patientVisibilityState: HubOfferProjectionPatientVisibilityState =
    truth.patientVisibilityState;

  if (actionState === "accept_pending") {
    offerState = "selected";
    offerActionabilityState = "blocked";
    confirmationTruthState = "confirmation_pending";
    patientVisibilityState = "provisional_receipt";
  }
  if (actionState === "declined_all") {
    offerState = "declined";
    offerActionabilityState = "fallback_only";
    patientVisibilityState = "fallback_visible";
  }
  if (actionState === "callback_pending") {
    offerState = "selected";
    offerActionabilityState = "fallback_only";
    fallbackLinkState = "callback_pending_link";
    patientVisibilityState = "fallback_visible";
  }

  return {
    offerState,
    offerActionabilityState,
    fallbackLinkState,
    confirmationTruthState,
    patientVisibilityState,
  };
}

function groupedOfferCards(projection: PatientNetworkAlternativeChoiceProjection) {
  const groups = new Map<string, AlternativeOfferCardProjection328[]>();
  for (const card of projection.offerCards) {
    const group = groups.get(card.windowLabel);
    if (group) {
      group.push(card);
    } else {
      groups.set(card.windowLabel, [card]);
    }
  }
  return Array.from(groups.entries()).map(([label, cards]) => ({ label, cards }));
}

function useNetworkChoiceController() {
  const ownerWindow = safeWindow();
  const initialPathname =
    ownerWindow?.location.pathname ?? "/bookings/network/offer_session_328_live";
  const initialSearch = ownerWindow?.location.search ?? "";
  const initialScenarioId =
    resolvePatientNetworkAlternativeChoiceScenarioId(initialPathname) ?? "offer_session_328_live";
  const initialProjection =
    resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(initialScenarioId);
  if (!initialProjection) {
    throw new Error(`Missing patient network choice scenario ${initialScenarioId}`);
  }

  const initialReturnContract = buildReturnContract(initialProjection, initialSearch);
  const initialRestoreBundle = readRestoreBundle();
  const currentScenario =
    initialRestoreBundle?.shellContinuityKey === initialReturnContract.shellContinuityKey
      ? (resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(
          initialRestoreBundle.scenarioId,
        ) ?? initialProjection)
      : initialProjection;

  const [projection, setProjection] = useState(currentScenario);
  const [returnContract, setReturnContract] = useState(
    buildReturnContract(currentScenario, initialSearch),
  );
  const [selectedOfferEntryId, setSelectedOfferEntryId] = useState<string | null>(
    initialRestoreBundle?.shellContinuityKey === initialReturnContract.shellContinuityKey
      ? initialRestoreBundle.selectedOfferEntryId
      : currentScenario.selectedOfferEntryId,
  );
  const [actionState, setActionState] = useState<NetworkChoiceLocalActionState>(
    initialRestoreBundle?.shellContinuityKey === initialReturnContract.shellContinuityKey
      ? initialRestoreBundle.actionState
      : "idle",
  );
  const [announcement, setAnnouncement] = useState("Patient network choice route loaded.");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const runtimeTruth = useMemo(
    () => resolveRuntimeTruth(projection, actionState),
    [actionState, projection],
  );

  useEffect(() => {
    const bundle: NetworkChoiceRestoreBundle = {
      projectionName: "NetworkChoiceRestoreBundle328",
      pathname: ownerWindow?.location.pathname ?? `/bookings/network/${projection.scenarioId}`,
      search: ownerWindow?.location.search ?? "",
      scenarioId: projection.scenarioId,
      selectedOfferEntryId,
      actionState,
      shellContinuityKey: returnContract.shellContinuityKey,
    };
    writeRestoreBundle(bundle);
  }, [
    actionState,
    ownerWindow,
    projection.scenarioId,
    returnContract.shellContinuityKey,
    selectedOfferEntryId,
  ]);

  useEffect(() => {
    const onPopState = () => {
      const pathname =
        ownerWindow?.location.pathname ?? `/bookings/network/${projection.scenarioId}`;
      const scenarioId =
        resolvePatientNetworkAlternativeChoiceScenarioId(pathname) ?? projection.scenarioId;
      const nextProjection =
        resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(scenarioId) ?? projection;
      const nextReturnContract = buildReturnContract(
        nextProjection,
        ownerWindow?.location.search ?? "",
      );
      const restore = readRestoreBundle();
      startTransition(() => {
        setProjection(nextProjection);
        setReturnContract(nextReturnContract);
        setSelectedOfferEntryId(
          restore?.shellContinuityKey === nextReturnContract.shellContinuityKey
            ? restore.selectedOfferEntryId
            : nextProjection.selectedOfferEntryId,
        );
        setActionState(
          restore?.shellContinuityKey === nextReturnContract.shellContinuityKey
            ? restore.actionState
            : "idle",
        );
        setAnnouncement(`${nextProjection.heroTitle} restored.`);
      });
    };

    ownerWindow?.addEventListener("popstate", onPopState);
    return () => ownerWindow?.removeEventListener("popstate", onPopState);
  }, [ownerWindow, projection]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [projection.scenarioId]);

  function selectOffer(offerEntryId: string): void {
    if (runtimeTruth.offerActionabilityState !== "live_open_choice") {
      return;
    }
    setSelectedOfferEntryId(offerEntryId);
    setActionState("idle");
    const card = projection.offerCards.find(
      (entry) => entry.alternativeOfferEntryId === offerEntryId,
    );
    setAnnouncement(`${card?.siteLabel ?? "Option"} selected. Nothing is accepted yet.`);
  }

  function moveSelection(
    currentOfferEntryId: string,
    direction: "next" | "previous" | "first" | "last",
  ): void {
    if (runtimeTruth.offerActionabilityState !== "live_open_choice") {
      return;
    }
    const order = projection.offerCards.map((card) => card.alternativeOfferEntryId);
    const currentIndex = order.indexOf(currentOfferEntryId);
    if (currentIndex === -1 || order.length === 0) {
      return;
    }
    const nextIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? order.length - 1
          : direction === "next"
            ? (currentIndex + 1) % order.length
            : (currentIndex - 1 + order.length) % order.length;
    const nextOfferEntryId = order[nextIndex];
    if (!nextOfferEntryId) {
      return;
    }
    selectOffer(nextOfferEntryId);
    ownerWindow?.requestAnimationFrame(() => focusOfferCard(nextOfferEntryId));
  }

  function clearSelection(): void {
    setSelectedOfferEntryId(null);
    setActionState("idle");
    setAnnouncement("Selection cleared. The full open-choice set remains visible.");
    focusStageHeading();
  }

  function acceptSelectedOffer(): void {
    if (!selectedOfferEntryId || runtimeTruth.offerActionabilityState !== "live_open_choice") {
      return;
    }
    setActionState("accept_pending");
    setAnnouncement("Choice recorded. Confirmation is now pending.");
  }

  function declineAll(): void {
    if (
      !projection.declineAllAllowed ||
      runtimeTruth.offerActionabilityState !== "live_open_choice"
    ) {
      return;
    }
    setActionState("declined_all");
    setAnnouncement("Ranked options declined. Callback remains the separate next safe path.");
  }

  function requestCallback(): void {
    if (
      projection.callbackFallbackCard.eligibilityState !== "visible" &&
      projection.callbackFallbackCard.eligibilityState !== "selected"
    ) {
      return;
    }
    if (
      runtimeTruth.offerActionabilityState !== "live_open_choice" &&
      runtimeTruth.offerActionabilityState !== "fallback_only"
    ) {
      return;
    }
    setActionState("callback_pending");
    setAnnouncement("Callback requested. Ranked options stay visible as history.");
  }

  function supportAction(): void {
    safeDocument()
      ?.querySelector<HTMLElement>("[data-testid='network-choice-help-card']")
      ?.focus({ preventScroll: true });
    setAnnouncement("Support card focused.");
  }

  function returnToOrigin(): void {
    ownerWindow?.location.assign(returnContract.returnRouteRef);
  }

  function navigateToScenario(scenarioId: NetworkChoiceScenarioId, replace = false): void {
    const nextProjection = resolvePatientNetworkAlternativeChoiceProjectionByScenarioId(scenarioId);
    if (!nextProjection) {
      return;
    }
    const nextSearch = ownerWindow?.location.search ?? "";
    const nextReturnContract = buildReturnContract(nextProjection, nextSearch);
    const nextSelectedOfferEntryId = nextProjection.offerCards.some(
      (card) => card.alternativeOfferEntryId === selectedOfferEntryId,
    )
      ? selectedOfferEntryId
      : nextProjection.selectedOfferEntryId;
    const nextBundle: NetworkChoiceRestoreBundle = {
      projectionName: "NetworkChoiceRestoreBundle328",
      pathname: `/bookings/network/${scenarioId}`,
      search: nextSearch,
      scenarioId,
      selectedOfferEntryId: nextSelectedOfferEntryId,
      actionState: "idle",
      shellContinuityKey: nextReturnContract.shellContinuityKey,
    };

    startTransition(() => {
      setProjection(nextProjection);
      setReturnContract(nextReturnContract);
      setSelectedOfferEntryId(nextSelectedOfferEntryId);
      setActionState("idle");
      writeRestoreBundle(nextBundle, replace);
      setAnnouncement(`${nextProjection.heroTitle} opened.`);
      ownerWindow?.requestAnimationFrame(() => focusOfferCard(nextSelectedOfferEntryId));
    });
  }

  return {
    projection,
    returnContract,
    selectedOfferEntryId,
    actionState,
    announcement,
    headingRef,
    runtimeTruth,
    selectOffer,
    moveSelection,
    clearSelection,
    acceptSelectedOffer,
    declineAll,
    requestCallback,
    supportAction,
    returnToOrigin,
    navigateToScenario,
  };
}

function AlternativeOfferHero({
  projection,
  runtimeTruth,
}: {
  projection: PatientNetworkAlternativeChoiceProjection;
  runtimeTruth: ReturnType<typeof resolveRuntimeTruth>;
}) {
  return (
    <section
      className="patient-booking__pulse patient-network-choice__hero"
      data-testid="alternative-offer-hero"
      data-offer-state={runtimeTruth.offerState}
      data-patient-visibility={runtimeTruth.patientVisibilityState}
      tabIndex={-1}
    >
      <div
        className="patient-booking__pulse-mark patient-network-choice__hero-mark"
        aria-hidden="true"
      >
        <svg viewBox="0 0 48 48" role="presentation">
          <path
            d="M6 24h8l4-8 6 18 4-8h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="patient-network-choice__hero-copy">
        <span className="patient-booking__eyebrow">Appointment options</span>
        <h2>{projection.heroTitle}</h2>
        <p>{projection.heroBody}</p>
        {projection.secureLinkNote ? (
          <p className="patient-network-choice__hero-note">{projection.secureLinkNote}</p>
        ) : null}
      </div>
      <div className="patient-booking__pulse-meta patient-network-choice__hero-meta">
        <span className="patient-network-choice__hero-pill">
          {projection.entryMode === "secure_link" ? "Secure link route" : "Signed-in route"}
        </span>
        <span className="patient-network-choice__hero-pill">
          {runtimeTruth.offerActionabilityState.replaceAll("_", " ")}
        </span>
        {projection.heroRows.map((row) => (
          <div key={row.label}>
            <strong>{row.value}</strong>
            <span>{row.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AlternativeOfferExpiryStrip({
  expiryStrip,
}: {
  expiryStrip: PatientNetworkAlternativeChoiceProjection["expiryStrip"];
}) {
  return (
    <section
      className="patient-network-choice__expiry-strip"
      data-testid="alternative-offer-expiry-strip"
      data-offer-expiry-mode={expiryStrip.mode}
      data-tone={expiryStrip.tone}
    >
      <div>
        <span className="patient-booking__eyebrow">Offer timing</span>
        <strong>{expiryStrip.heading}</strong>
      </div>
      <p>{expiryStrip.body}</p>
    </section>
  );
}

function AlternativeOfferReasonChipRow({
  chips,
}: {
  chips: readonly AlternativeOfferReasonChip[];
}) {
  return (
    <div className="patient-network-choice__reason-chip-row">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="patient-network-choice__reason-chip"
          data-tone={chip.tone}
          data-advisory-only={chip.advisoryOnly ? "true" : "false"}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

function AlternativeOfferCard({
  card,
  checked,
  tabIndex,
  actionabilityState,
  onSelect,
  onMoveSelection,
}: {
  card: AlternativeOfferCardProjection328;
  checked: boolean;
  tabIndex: number;
  actionabilityState: HubOfferProjectionActionabilityState;
  onSelect: (offerEntryId: string) => void;
  onMoveSelection: (
    offerEntryId: string,
    direction: "next" | "previous" | "first" | "last",
  ) => void;
}) {
  const disabled = actionabilityState !== "live_open_choice";
  return (
    <article
      className="patient-network-choice__card"
      data-offer-card={card.alternativeOfferEntryId}
      data-window-class={String(card.windowClass)}
      data-selection-state={card.selectionState}
      data-recommendation-state={card.recommendationState}
      data-selected={checked ? "true" : "false"}
      data-choice-actionability={actionabilityState}
    >
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : tabIndex}
        disabled={disabled}
        className="patient-network-choice__card-button"
        onClick={() => onSelect(card.alternativeOfferEntryId)}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            event.preventDefault();
            onMoveSelection(card.alternativeOfferEntryId, "next");
          } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            event.preventDefault();
            onMoveSelection(card.alternativeOfferEntryId, "previous");
          } else if (event.key === "Home") {
            event.preventDefault();
            onMoveSelection(card.alternativeOfferEntryId, "first");
          } else if (event.key === "End") {
            event.preventDefault();
            onMoveSelection(card.alternativeOfferEntryId, "last");
          }
        }}
      >
        <div className="patient-network-choice__card-head">
          <div className="patient-network-choice__card-copy">
            <span className="patient-network-choice__card-time">
              {card.dateLabel} <strong>{card.timeLabel}</strong>
            </span>
            <h3>{card.siteLabel}</h3>
            <p className="patient-network-choice__card-label">{card.patientFacingLabel}</p>
            <p className="patient-network-choice__card-meta">
              {card.modalityLabel} · {card.travelLabel} · {card.waitLabel}
            </p>
          </div>
          <span className="patient-network-choice__card-rank">#{card.rankOrdinal}</span>
        </div>
        <AlternativeOfferReasonChipRow chips={card.reasonChips} />
        <p className="patient-network-choice__card-summary">{card.recommendationSummary}</p>
        <dl className="patient-network-choice__card-facts">
          <div>
            <dt>Orientation</dt>
            <dd>{card.localityLabel}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{card.accessibilityLabel}</dd>
          </div>
          <div>
            <dt>Choice grammar</dt>
            <dd>{card.guidanceLabel}</dd>
          </div>
        </dl>
      </button>
    </article>
  );
}

function CallbackFallbackCard({
  projection,
  runtimeTruth,
  onRequestCallback,
}: {
  projection: PatientNetworkAlternativeChoiceProjection["callbackFallbackCard"];
  runtimeTruth: ReturnType<typeof resolveRuntimeTruth>;
  onRequestCallback: () => void;
}) {
  const actionable =
    projection.eligibilityState === "visible" &&
    (runtimeTruth.offerActionabilityState === "live_open_choice" ||
      runtimeTruth.offerActionabilityState === "fallback_only");
  const selected =
    runtimeTruth.fallbackLinkState === "callback_pending_link" ||
    projection.eligibilityState === "selected";

  return (
    <section
      className="patient-network-choice__callback-card"
      data-testid="callback-fallback-card"
      data-callback-fallback={projection.alternativeOfferFallbackCardId}
      data-choice-actionability={runtimeTruth.offerActionabilityState}
      data-selection-state={selected ? "selected" : projection.eligibilityState}
    >
      <span className="patient-booking__eyebrow">Callback option</span>
      <div className="patient-network-choice__callback-head">
        <h3>{projection.title}</h3>
        <span className="patient-network-choice__callback-chip">Callback available</span>
      </div>
      <p>{projection.body}</p>
      <div className="patient-network-choice__callback-meta">
        {projection.reasonCodeRefs.map((reason) => (
          <span key={reason}>{reason.replaceAll("_", " ")}</span>
        ))}
      </div>
      {projection.actionLabel ? (
        <button
          type="button"
          className="patient-booking__secondary-action"
          data-action-ref="request_callback"
          onClick={onRequestCallback}
          disabled={!actionable}
          aria-disabled={!actionable}
        >
          {selected ? "Callback requested" : projection.actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function AlternativeOfferSelectionPanel({
  selectedCard,
  runtimeTruth,
  actionState,
  onAccept,
  onClearSelection,
}: {
  selectedCard: AlternativeOfferCardProjection328 | null;
  runtimeTruth: ReturnType<typeof resolveRuntimeTruth>;
  actionState: NetworkChoiceLocalActionState;
  onAccept: () => void;
  onClearSelection: () => void;
}) {
  const headline =
    actionState === "accept_pending"
      ? "Choice recorded"
      : actionState === "callback_pending"
        ? "Callback requested"
        : actionState === "declined_all"
          ? "Ranked options declined"
          : selectedCard
            ? "Selected option"
            : "Select one option to continue";

  const body =
    actionState === "accept_pending"
      ? "The selected option stays visible while confirmation status moves to the next child route."
      : actionState === "callback_pending"
        ? "The ranked set stays visible as history while callback linkage completes."
        : actionState === "declined_all"
          ? "The ranked options are now reference only. Callback remains the approved next step."
          : selectedCard
            ? "Selection is still advisory until you explicitly accept it."
            : "Recommendation chips do not preselect anything. The full live set remains open until you choose one option.";

  const acceptEnabled =
    Boolean(selectedCard) && runtimeTruth.offerActionabilityState === "live_open_choice";

  return (
    <section
      className="patient-network-choice__selection-panel"
      data-testid="alternative-offer-selection-panel"
      data-choice-actionability={runtimeTruth.offerActionabilityState}
      data-confirmation-truth={runtimeTruth.confirmationTruthState}
      data-selected-offer-entry={selectedCard?.alternativeOfferEntryId ?? ""}
      tabIndex={-1}
    >
      <span className="patient-booking__eyebrow">Selected appointment</span>
      <h3>{headline}</h3>
      <p>{body}</p>
      {selectedCard ? (
        <div className="patient-network-choice__selection-summary">
          <strong>{selectedCard.siteLabel}</strong>
          <span>
            {selectedCard.patientFacingLabel} · {selectedCard.modalityLabel}
          </span>
        </div>
      ) : null}
      <dl className="patient-network-choice__selection-facts">
        <div>
          <dt>Offer status</dt>
          <dd>{runtimeTruth.offerActionabilityState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Confirmation</dt>
          <dd>{runtimeTruth.confirmationTruthState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>{runtimeTruth.patientVisibilityState.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      <div className="patient-network-choice__selection-actions">
        {actionState === "idle" ? (
          <>
            <button
              type="button"
              className="patient-booking__primary-action"
              data-action-ref="accept_alternative_offer"
              onClick={onAccept}
              disabled={!acceptEnabled}
              aria-disabled={!acceptEnabled}
            >
              Accept this option
            </button>
            {selectedCard ? (
              <button
                type="button"
                className="patient-booking__secondary-action"
                data-action-ref="clear_offer_selection"
                onClick={onClearSelection}
              >
                Clear selection
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

function AlternativeOfferProvenanceStub({
  projection,
  onAction,
}: {
  projection: AlternativeOfferProvenanceStubProjection328;
  onAction: () => void;
}) {
  return (
    <section
      className="patient-network-choice__provenance"
      data-testid="alternative-offer-provenance-stub"
      data-offer-provenance="true"
      tabIndex={-1}
    >
      <span className="patient-booking__eyebrow">Offer history</span>
      <h3>{projection.heading}</h3>
      <p>{projection.body}</p>
      <dl className="patient-network-choice__provenance-facts">
        {projection.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {projection.actionLabel ? (
        <button
          type="button"
          className="patient-booking__secondary-action"
          data-action-ref="open_current_choice_set"
          onClick={onAction}
        >
          {projection.actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function OfferRouteRepairPanel({
  projection,
  onAction,
}: {
  projection: OfferRouteRepairPanelProjection328;
  onAction: () => void;
}) {
  return (
    <section
      className="patient-network-choice__repair-panel"
      data-testid="offer-route-repair-panel"
      data-repair-state={projection.repairState}
      tabIndex={-1}
    >
      <span className="patient-booking__eyebrow">Help with this offer</span>
      <h3>{projection.heading}</h3>
      <p>{projection.body}</p>
      <dl className="patient-network-choice__provenance-facts">
        {projection.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="patient-booking__primary-action"
        data-action-ref="repair_contact_route"
        onClick={onAction}
      >
        {projection.actionLabel}
      </button>
    </section>
  );
}

function NetworkChoiceSummaryRail({
  projection,
  returnContract,
  runtimeTruth,
  selectedCard,
  actionState,
  onAccept,
  onClearSelection,
  onReturn,
  onSupport,
}: {
  projection: PatientNetworkAlternativeChoiceProjection;
  returnContract: NetworkChoiceReturnContract;
  runtimeTruth: ReturnType<typeof resolveRuntimeTruth>;
  selectedCard: AlternativeOfferCardProjection328 | null;
  actionState: NetworkChoiceLocalActionState;
  onAccept: () => void;
  onClearSelection: () => void;
  onReturn: () => void;
  onSupport: () => void;
}) {
  return (
    <>
      <AlternativeOfferSelectionPanel
        selectedCard={selectedCard}
        runtimeTruth={runtimeTruth}
        actionState={actionState}
        onAccept={onAccept}
        onClearSelection={onClearSelection}
      />
      <section className="patient-network-choice__summary-card">
        <span className="patient-booking__eyebrow">Service details</span>
        <h3>Need and preferences</h3>
        <dl className="patient-network-choice__summary-facts">
          {projection.serviceRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
          {projection.preferenceRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section
        className="patient-network-choice__summary-card"
        data-testid="network-choice-help-card"
        tabIndex={-1}
      >
        <span className="patient-booking__eyebrow">Support</span>
        <h3>{projection.supportStub.heading}</h3>
        <p>{projection.supportStub.body}</p>
        <div className="patient-network-choice__selection-actions">
          <button type="button" className="patient-booking__secondary-action" onClick={onReturn}>
            {returnContract.originKey === "requests"
              ? "Return to request"
              : projection.supportStub.returnLabel}
          </button>
          <button type="button" className="patient-booking__secondary-action" onClick={onSupport}>
            {projection.supportStub.supportLabel}
          </button>
        </div>
      </section>
    </>
  );
}

function NetworkChoiceReturnBinder({
  returnContract,
}: {
  returnContract: NetworkChoiceReturnContract;
}) {
  return (
    <div
      hidden
      aria-hidden="true"
      data-testid="network-choice-return-contract-binder"
      data-return-route-ref={returnContract.returnRouteRef}
      data-selected-anchor-ref={returnContract.selectedAnchorRef}
      data-selected-anchor-label={returnContract.selectedAnchorLabel}
      data-shell-continuity-key={returnContract.shellContinuityKey}
      data-restore-storage-key={NETWORK_CHOICE_RESTORE_STORAGE_KEY}
    />
  );
}

function PatientNetworkAlternativeChoiceAppInner() {
  const controller = useNetworkChoiceController();
  const {
    projection,
    returnContract,
    selectedOfferEntryId,
    actionState,
    announcement,
    headingRef,
    runtimeTruth,
  } = controller;
  const phase2Context = resolvePortalSupportPhase2Context({
    pathname: safeWindow()?.location.pathname ?? `/bookings/network/${projection.scenarioId}`,
    search: safeWindow()?.location.search,
  });
  const responsive = useBookingResponsive();
  const stickyVisible =
    responsive.missionStackState === "folded" &&
    runtimeTruth.offerActionabilityState === "live_open_choice" &&
    Boolean(selectedOfferEntryId);
  const responsiveProfile = responsive.resolveProfile(stickyVisible);
  const offerGroups = groupedOfferCards(projection);
  const selectedCard =
    projection.offerCards.find((card) => card.alternativeOfferEntryId === selectedOfferEntryId) ??
    null;

  return (
    <div
      className="patient-booking patient-network-choice"
      data-testid="Patient_Network_Alternative_Choice_Route"
      data-task-id={PATIENT_NETWORK_ALTERNATIVE_CHOICE_TASK_ID}
      data-visual-mode={PATIENT_NETWORK_ALTERNATIVE_CHOICE_VISUAL_MODE}
      data-shell="patient-booking"
      data-route-family={projection.routeFamilyRef}
      data-offer-session={projection.session.alternativeOfferSessionId}
      data-network-choice="true"
      data-choice-actionability={runtimeTruth.offerActionabilityState}
      data-offer-state={runtimeTruth.offerState}
      data-fallback-link-state={runtimeTruth.fallbackLinkState}
      data-confirmation-truth={runtimeTruth.confirmationTruthState}
      data-patient-visibility={runtimeTruth.patientVisibilityState}
      data-practice-visibility={projection.truthProjection.practiceVisibilityState}
      data-closure-state={projection.truthProjection.closureState}
      data-selected-offer-entry={selectedOfferEntryId ?? ""}
      data-selected-anchor-ref={projection.session.selectedAnchorRef}
      data-selected-anchor-tuple-hash={projection.session.selectedAnchorTupleHashRef}
      data-return-route-ref={returnContract.returnRouteRef}
      data-origin-key={returnContract.originKey}
      data-same-shell-continuation-ref={projection.sameShellContinuationRef}
      data-entry-mode={projection.entryMode}
      data-recovery-reason={projection.recoveryReason}
      data-offer-set-hash={projection.session.visibleOfferSetHash}
      data-visible-offer-count={String(projection.offerCards.length)}
      data-route-publication-ref={projection.session.surfacePublicationRef}
      data-runtime-bundle-ref={projection.session.runtimePublicationBundleRef}
      data-breakpoint-class={responsiveProfile.breakpointClass}
      data-mission-stack-state={responsiveProfile.missionStackState}
      data-safe-area-class={responsiveProfile.safeAreaClass}
      data-sticky-action-posture={responsiveProfile.stickyActionPosture}
      data-embedded-mode={responsiveProfile.embeddedMode}
      data-motion-profile={prefersReducedMotion() ? "reduced" : "default"}
      data-truth-kernel={phase2Context.truthKernel}
      data-shared-request-ref={phase2Context.fixture.requestRef}
      data-shared-lineage-ref={phase2Context.fixture.requestLineageRef}
      data-support-ticket-id={phase2Context.fixture.supportTicketId}
      data-cause-class={phase2Context.causeClass}
      data-recovery-class={phase2Context.recoveryClass}
      data-canonical-status-label={phase2Context.canonicalStatusLabel}
    >
      <EmbeddedBookingChromeAdapter
        topBand={
          <PatientPortalTopBar
            current="appointments"
            testId="patient-booking-top-band"
            ariaLabel="Patient booking navigation"
          />
        }
      >
        <PatientSupportPhase2Bridge context={phase2Context} />
        <NetworkChoiceReturnBinder returnContract={returnContract} />
        <main className="patient-booking__main">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="patient-booking__route-title"
            data-testid="patient-network-choice-heading"
          >
            Patient network choice
          </h1>
          <BookingResponsiveStage
            stageName="Patient network choice"
            testId="patient-network-choice-stage"
            foldedPinned={
              selectedCard ? (
                <section className="patient-network-choice__folded-selection">
                  <span className="patient-booking__eyebrow">Selected option</span>
                  <strong>{selectedCard.siteLabel}</strong>
                  <span>{selectedCard.patientFacingLabel}</span>
                </section>
              ) : undefined
            }
            stickyTray={
              stickyVisible && selectedCard ? (
                <BookingStickyActionTray
                  testId="network-choice-sticky-tray"
                  primaryTestId="network-choice-sticky-primary-action"
                  title={selectedCard.siteLabel}
                  detail={`${selectedCard.patientFacingLabel} · ${selectedCard.modalityLabel}`}
                  primaryActionLabel="Accept this option"
                  primaryActionRef="accept_alternative_offer"
                  onPrimaryAction={controller.acceptSelectedOffer}
                  secondaryActionLabel="Need help"
                  onSecondaryAction={controller.supportAction}
                />
              ) : undefined
            }
            rail={
              <NetworkChoiceSummaryRail
                projection={projection}
                returnContract={returnContract}
                runtimeTruth={runtimeTruth}
                selectedCard={selectedCard}
                actionState={actionState}
                onAccept={controller.acceptSelectedOffer}
                onClearSelection={controller.clearSelection}
                onReturn={controller.returnToOrigin}
                onSupport={controller.supportAction}
              />
            }
            railTitle="Choice summary"
            railToggleLabel="Open choice summary"
            main={
              <div className="patient-network-choice__main-column">
                <AlternativeOfferHero projection={projection} runtimeTruth={runtimeTruth} />
                <AlternativeOfferExpiryStrip expiryStrip={projection.expiryStrip} />
                <section
                  className="patient-network-choice__stack"
                  aria-labelledby="patient-network-choice-stack-title"
                >
                  <div className="patient-network-choice__stack-head">
                    <div>
                      <span className="patient-booking__eyebrow">Appointment options</span>
                      <h2 id="patient-network-choice-stack-title">The full current choice set</h2>
                    </div>
                    <p>{projection.guidanceLabel}</p>
                  </div>
                  <div
                    className="patient-network-choice__radio-group"
                    role="radiogroup"
                    aria-label="Network appointment options"
                  >
                    {offerGroups.map((group) => (
                      <section
                        key={group.label}
                        className="patient-network-choice__group"
                        data-window-label={group.label}
                      >
                        <h3>{group.label}</h3>
                        <ol className="patient-network-choice__group-list">
                          {group.cards.map((card) => (
                            <li key={card.alternativeOfferEntryId}>
                              <AlternativeOfferCard
                                card={card}
                                checked={selectedOfferEntryId === card.alternativeOfferEntryId}
                                tabIndex={
                                  selectedOfferEntryId
                                    ? selectedOfferEntryId === card.alternativeOfferEntryId
                                      ? 0
                                      : -1
                                    : card.rankOrdinal === 1
                                      ? 0
                                      : -1
                                }
                                actionabilityState={runtimeTruth.offerActionabilityState}
                                onSelect={controller.selectOffer}
                                onMoveSelection={controller.moveSelection}
                              />
                            </li>
                          ))}
                        </ol>
                      </section>
                    ))}
                  </div>
                </section>
                <CallbackFallbackCard
                  projection={projection.callbackFallbackCard}
                  runtimeTruth={runtimeTruth}
                  onRequestCallback={controller.requestCallback}
                />
                {projection.declineAllAllowed &&
                runtimeTruth.offerActionabilityState === "live_open_choice" ? (
                  <section
                    className="patient-network-choice__decline-disclosure"
                    data-testid="decline-all-disclosure"
                  >
                    <span className="patient-booking__eyebrow">Need another option</span>
                    <h3>None of these times can work?</h3>
                    <p>
                      Declining the ranked options does not hide them or silently pick callback. It
                      keeps the stack visible and makes the next safe fallback explicit.
                    </p>
                    <button
                      type="button"
                      className="patient-booking__secondary-action"
                      data-action-ref="decline_all_offers"
                      onClick={controller.declineAll}
                    >
                      Decline these times
                    </button>
                  </section>
                ) : null}
                {projection.provenanceStub ? (
                  <AlternativeOfferProvenanceStub
                    projection={projection.provenanceStub}
                    onAction={() =>
                      projection.provenanceStub?.transitionScenarioId
                        ? controller.navigateToScenario(
                            projection.provenanceStub.transitionScenarioId,
                          )
                        : undefined
                    }
                  />
                ) : null}
                {projection.routeRepairPanel ? (
                  <OfferRouteRepairPanel
                    projection={projection.routeRepairPanel}
                    onAction={() =>
                      controller.navigateToScenario(
                        projection.routeRepairPanel!.transitionScenarioId,
                      )
                    }
                  />
                ) : null}
              </div>
            }
          />
        </main>
        <div
          className="patient-booking__live"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="patient-network-choice-live-region"
        >
          {announcement}
        </div>
      </EmbeddedBookingChromeAdapter>
    </div>
  );
}

export default function PatientNetworkAlternativeChoiceApp() {
  return (
    <BookingResponsiveProvider>
      <PatientNetworkAlternativeChoiceAppInner />
    </BookingResponsiveProvider>
  );
}
