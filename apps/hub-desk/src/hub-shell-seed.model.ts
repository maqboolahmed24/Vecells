import {
  createInitialContinuitySnapshot,
  createUiTelemetryEnvelope,
  getPersistentShellRouteClaim,
  navigateWithinShell,
  selectAnchorInSnapshot,
  type ContinuitySnapshot,
  type RuntimeScenario,
  type UiTelemetryEnvelopeExample,
  type UiTelemetryEventClass,
} from "@vecells/persistent-shell";

export const HUB_SHELL_TASK_ID = "par_118";
export const HUB_SHELL_VISUAL_MODE = "Hub_Shell_Seed_Routes";
export const HUB_SOURCE_SURFACE = "shell_gallery";
export const HUB_TELEMETRY_SCENARIO_ID = "SCN_SHELL_GALLERY_PATIENT_HOME";
export const HUB_DEFAULT_PATH = "/hub/queue";
export const HUB_SHELL_SLUG = "hub-desk";

export type HubViewMode = "queue" | "case" | "alternatives" | "exceptions" | "audit";
export type HubRouteFamilyRef = "rf_hub_queue" | "rf_hub_case_management";
export type HubCaseStatus =
  | "alternatives_open"
  | "confirmation_pending"
  | "booked_pending_practice_ack"
  | "callback_transfer_pending";
export type HubOptionTruthMode =
  | "exclusive_hold"
  | "truthful_nonexclusive"
  | "confirmation_pending"
  | "confirmed"
  | "callback_only"
  | "diagnostic_only";
export type HubTimerMode = "hold_expiry" | "response_window" | "none";
export type HubAckState = "not_due" | "awaiting_ack" | "overdue" | "acknowledged";
export type HubOwnershipState =
  | "claimed_active"
  | "transfer_pending"
  | "stale_owner_recovery";
export type HubFallbackDisposition =
  | "none"
  | "callback_available"
  | "callback_transfer_pending"
  | "read_only_review";
export type HubExceptionFilter = "all" | "confirmation_pending" | "ack_debt" | "fallback";

export interface HubLocation {
  pathname: string;
  routeFamilyRef: HubRouteFamilyRef;
  viewMode: HubViewMode;
  hubCoordinationCaseId: string | null;
  offerSessionId: string | null;
}

export interface HubRankedOption {
  optionId: string;
  optionLabel: string;
  siteLabel: string;
  slotLabel: string;
  modality: string;
  scoreLabel: string;
  laneLabel: string;
  truthMode: HubOptionTruthMode;
  timerMode: HubTimerMode;
  timerLabel: string;
  truthSummary: string;
  fallbackSummary: string;
  patientChoiceSummary: string;
  routeActionLabel: string;
  auditRef: string;
  isRecommended: boolean;
}

export interface HubCaseSeed {
  caseId: string;
  offerSessionId: string;
  patientLabel: string;
  queueRank: number;
  priorityBand: string;
  originPractice: string;
  reasonForHubRouting: string;
  status: HubCaseStatus;
  ownershipState: HubOwnershipState;
  claimedBy: string;
  queueSummary: string;
  truthSummary: string;
  blockerSummary: string;
  commsSummary: string;
  auditSummary: string;
  dominantActionLabel: string;
  continuityQuestion: string;
  confirmationState: string;
  ackState: HubAckState;
  ackDueLabel: string;
  fallbackDisposition: HubFallbackDisposition;
  lastProgressLabel: string;
  selectedOptionId: string;
  options: readonly HubRankedOption[];
}

export interface HubReturnToken {
  returnTokenId: string;
  originPath: string;
  selectedCaseId: string;
  selectedOptionId: string;
  issuedAt: string;
}

export interface HubExceptionRow {
  caseId: string;
  patientLabel: string;
  category: "confirmation" | "acknowledgement" | "fallback";
  severity: "watch" | "caution" | "critical";
  summary: string;
  nextAction: string;
  viewPath: string;
}

export interface HubDecisionDock {
  title: string;
  dominantActionLabel: string;
  actionState: "ready" | "watch" | "blocked";
  timerTruth: string;
  fallbackSummary: string;
}

export interface HubShellSnapshot {
  location: HubLocation;
  currentCase: HubCaseSeed;
  currentOption: HubRankedOption;
  queueCases: readonly HubCaseSeed[];
  exceptionRows: readonly HubExceptionRow[];
  decisionDock: HubDecisionDock;
  frameMode: "two_plane" | "mission_stack";
  artifactModeState: "interactive_live" | "table_only" | "summary_only";
  visualizationAuthority: "visual_table_summary" | "table_only" | "summary_only";
  recoveryPosture: "live" | "read_only" | "recovery_only" | "blocked";
  routeShellPosture: "shell_live" | "shell_read_only" | "shell_recovery";
  routeMutationEnabled: boolean;
  summarySentence: string;
}

export interface HubShellState {
  location: HubLocation;
  continuitySnapshot: ContinuitySnapshot;
  selectedCaseId: string;
  selectedOptionId: string;
  exceptionFilter: HubExceptionFilter;
  returnToken: HubReturnToken | null;
  runtimeScenario: RuntimeScenario;
  telemetry: readonly UiTelemetryEnvelopeExample[];
}

export interface HubRouteContractSeedRow {
  path: string;
  routeFamilyRef: HubRouteFamilyRef;
  viewMode: HubViewMode;
  continuityKey: string;
  selectedAnchorPolicy: string;
  summary: string;
}

export interface HubMockProjectionExample {
  exampleId: string;
  path: string;
  viewMode: HubViewMode;
  caseId: string;
  status: HubCaseStatus;
  optionTruthMode: HubOptionTruthMode;
  timerMode: HubTimerMode;
  summary: string;
}

export interface HubOptionTimerMatrixRow {
  caseId: string;
  caseStatus: HubCaseStatus;
  optionId: string;
  optionTruthMode: HubOptionTruthMode;
  timerMode: HubTimerMode;
  countdownAuthority: "exclusive_held" | "none";
  reservedCopyAllowed: "yes" | "no";
  timerLabel: string;
  dominantFallback: string;
  selectedByDefault: "yes" | "no";
}

const queueClaim = getPersistentShellRouteClaim("rf_hub_queue");
const caseClaim = getPersistentShellRouteClaim("rf_hub_case_management");

export const hubCases: readonly HubCaseSeed[] = [
  {
    caseId: "hub-case-104",
    offerSessionId: "ofs_104",
    patientLabel: "Case 104 / child fever follow-up",
    queueRank: 1,
    priorityBand: "Same day",
    originPractice: "Riverside Medical",
    reasonForHubRouting:
      "Local booking exhausted same-day supply, but the network still has safe GP capacity inside the current window.",
    status: "alternatives_open",
    ownershipState: "claimed_active",
    claimedBy: "A. Khan",
    queueSummary:
      "Three governed continuations are ready: one held slot, one truthful nonexclusive option, and one callback fallback held in reserve.",
    truthSummary:
      "Patient choice is genuinely open. Only the Oak Lane offer has reserved language authority; the River Street alternative stays explicitly subject to live confirmation.",
    blockerSummary:
      "If the held slot expires, the case must pivot to the next truthful option or publish callback fallback without losing the pinned decision basis.",
    commsSummary:
      "Patient choice link is drafted. Practice visibility is present but no new acknowledgement is due until a material booking outcome lands.",
    auditSummary:
      "Rank proof `RANK-104`, variance tuple `VAR-2`, and policy hash `hub-pol-17` are attached to the current choice set.",
    dominantActionLabel: "Advance the selected coordination option",
    continuityQuestion:
      "Which ranked option remains safest if the held slot drops before the patient responds?",
    confirmationState: "Options ready",
    ackState: "not_due",
    ackDueLabel: "No active acknowledgement debt",
    fallbackDisposition: "callback_available",
    lastProgressLabel: "Updated 4m ago",
    selectedOptionId: "hub-opt-104-oak",
    options: [
      {
        optionId: "hub-opt-104-oak",
        optionLabel: "Oak Lane GP follow-up",
        siteLabel: "Oak Lane Hub",
        slotLabel: "Today, 11:35",
        modality: "In person",
        scoreLabel: "Best fit / travel 12m / same clinician grade",
        laneLabel: "Held option",
        truthMode: "exclusive_hold",
        timerMode: "hold_expiry",
        timerLabel: "Hold expires in 11m",
        truthSummary:
          "Reserved wording is legal here because the option is backed by an active hold and current fence.",
        fallbackSummary:
          "If this hold drops, the shell must preserve the same case and pivot to the next truthful alternative or callback fallback.",
        patientChoiceSummary:
          "Strongest same-day fit with no extra travel burden and the cleanest handoff summary.",
        routeActionLabel: "Pin Oak Lane hold",
        auditRef: "AUD-104-OAK",
        isRecommended: true,
      },
      {
        optionId: "hub-opt-104-river",
        optionLabel: "River Street GP follow-up",
        siteLabel: "River Street Clinic",
        slotLabel: "Today, 14:20",
        modality: "Video",
        scoreLabel: "Second fit / travel neutral / remote-friendly",
        laneLabel: "Truthful nonexclusive",
        truthMode: "truthful_nonexclusive",
        timerMode: "response_window",
        timerLabel: "Reply window 40m, still subject to live confirmation",
        truthSummary:
          "This option stays truthful by naming the response window without implying exclusivity or a fake hold countdown.",
        fallbackSummary:
          "If live confirmation fails, the case stays in the same shell and falls through to the callback path already armed.",
        patientChoiceSummary:
          "Good remote option when the held slot is not viable, but it must keep live-confirmation wording.",
        routeActionLabel: "Open River Street alternative",
        auditRef: "AUD-104-RIVER",
        isRecommended: false,
      },
      {
        optionId: "hub-opt-104-callback",
        optionLabel: "Callback fallback",
        siteLabel: "Network coordination",
        slotLabel: "No slot promised yet",
        modality: "Callback",
        scoreLabel: "Fallback continuity / governed",
        laneLabel: "Fallback",
        truthMode: "callback_only",
        timerMode: "none",
        timerLabel: "Timer suppressed until callback expectation is durably published",
        truthSummary:
          "This is not a live slot. It exists to keep the case honest once ranked offers stop being safe.",
        fallbackSummary:
          "Selecting callback fallback must create the callback expectation before the case can calm or leave active oversight.",
        patientChoiceSummary:
          "Honest fallback when patient needs a hub-led call rather than another unstable slot promise.",
        routeActionLabel: "Publish callback fallback",
        auditRef: "AUD-104-CALLBACK",
        isRecommended: false,
      },
    ],
  },
  {
    caseId: "hub-case-087",
    offerSessionId: "ofs_087",
    patientLabel: "Case 087 / urgent COPD review",
    queueRank: 2,
    priorityBand: "Urgent today",
    originPractice: "Kingsgate Surgery",
    reasonForHubRouting:
      "Local sites could not guarantee the timeframe, so the hub committed a native booking and is waiting for external confirmation.",
    status: "confirmation_pending",
    ownershipState: "claimed_active",
    claimedBy: "J. Malik",
    queueSummary:
      "Commit attempt is in flight. The shell must keep the selected candidate visible without emitting calm booked posture.",
    truthSummary:
      "The patient has not been told the booking is final. Confirmation pending remains the governing truth until stronger supplier evidence lands.",
    blockerSummary:
      "Practice continuity and patient reassurance must stay provisional while confirmation evidence is incomplete.",
    commsSummary:
      "Outbound confirmation copy is paused behind the external confirmation gate.",
    auditSummary:
      "Commit attempt `BTX-087-3`, provider reference placeholder, and receipt checkpoint `RCPT-087-2` are linked to this case.",
    dominantActionLabel: "Review pending commit evidence",
    continuityQuestion:
      "Which proof is still missing before this can upgrade from provisional commit to confirmed booking truth?",
    confirmationState: "Confirmation pending",
    ackState: "not_due",
    ackDueLabel: "Practice acknowledgement waits for booked truth",
    fallbackDisposition: "none",
    lastProgressLabel: "Updated 2m ago",
    selectedOptionId: "hub-opt-087-west",
    options: [
      {
        optionId: "hub-opt-087-west",
        optionLabel: "West End same-day GP",
        siteLabel: "West End Access Hub",
        slotLabel: "Today, 15:05",
        modality: "In person",
        scoreLabel: "Committed / awaiting provider confirmation",
        laneLabel: "Pending confirmation",
        truthMode: "confirmation_pending",
        timerMode: "none",
        timerLabel: "No countdown shown while confirmation is pending",
        truthSummary:
          "This candidate stays selected, but it cannot use booked wording until external confirmation is durably observed.",
        fallbackSummary:
          "If confirmation fails, the shell must keep the case live and reopen the next truthful continuation instead of quietly dropping the slot.",
        patientChoiceSummary:
          "Operationally preferred, but the current truth is still provisional rather than booked.",
        routeActionLabel: "Inspect pending confirmation",
        auditRef: "AUD-087-WEST",
        isRecommended: true,
      },
      {
        optionId: "hub-opt-087-callback",
        optionLabel: "Escalate to callback reserve",
        siteLabel: "Network coordination",
        slotLabel: "Fallback only",
        modality: "Callback",
        scoreLabel: "Fallback reserve",
        laneLabel: "Fallback",
        truthMode: "callback_only",
        timerMode: "none",
        timerLabel: "Hidden until the pending commit settles or fails",
        truthSummary:
          "This remains a fallback reserve. It is visible to the coordinator but not positioned as a live alternative while confirmation is unresolved.",
        fallbackSummary:
          "If supplier truth degrades, callback continuity must be published before the case can leave active watch.",
        patientChoiceSummary:
          "Keeps a truthful next step ready if the supplier does not confirm in time.",
        routeActionLabel: "Prepare callback reserve",
        auditRef: "AUD-087-CALLBACK",
        isRecommended: false,
      },
    ],
  },
  {
    caseId: "hub-case-066",
    offerSessionId: "ofs_066",
    patientLabel: "Case 066 / medication review booking",
    queueRank: 3,
    priorityBand: "Routine",
    originPractice: "Canal Street Practice",
    reasonForHubRouting:
      "The network booked successfully, but the origin practice still owes acknowledgement on the latest visibility generation.",
    status: "booked_pending_practice_ack",
    ownershipState: "transfer_pending",
    claimedBy: "L. Shore",
    queueSummary:
      "Booked truth is durable, yet the case remains open because practice acknowledgement generation 4 has not landed.",
    truthSummary:
      "Patient reassurance can stay calm here, but closure and downstream quieting remain blocked by explicit acknowledgement debt.",
    blockerSummary:
      "Do not close or hide this case until the origin practice acknowledges generation 4 or an audited no-ack exception exists.",
    commsSummary:
      "Patient booking summary has been sent. Practice visibility panel shows generation 4 overdue by 19m.",
    auditSummary:
      "Practice delta `PVD-066-4`, acknowledgement record `ACK-066-4`, and confirmation proof `CONF-066-2` are the current governing tuple.",
    dominantActionLabel: "Chase practice acknowledgement",
    continuityQuestion:
      "What materially changed after booking, and which acknowledgement generation is still outstanding?",
    confirmationState: "Confirmed",
    ackState: "overdue",
    ackDueLabel: "Generation 4 overdue by 19m",
    fallbackDisposition: "read_only_review",
    lastProgressLabel: "Updated 19m ago",
    selectedOptionId: "hub-opt-066-confirmed",
    options: [
      {
        optionId: "hub-opt-066-confirmed",
        optionLabel: "Confirmed network appointment",
        siteLabel: "North Quay Access Hub",
        slotLabel: "Tomorrow, 09:40",
        modality: "Video",
        scoreLabel: "Confirmed / acknowledgement debt open",
        laneLabel: "Booked truth",
        truthMode: "confirmed",
        timerMode: "none",
        timerLabel: "No timer: booked truth is strong, acknowledgement debt is the active blocker",
        truthSummary:
          "This is a real confirmed booking, but the case cannot leave oversight until the latest practice acknowledgement settles.",
        fallbackSummary:
          "If a later cancellation or reschedule occurs, the next acknowledgement generation must reopen immediately.",
        patientChoiceSummary:
          "Patient-facing calmness is safe; operational calmness is not.",
        routeActionLabel: "Review acknowledgement debt",
        auditRef: "AUD-066-CONFIRMED",
        isRecommended: true,
      },
    ],
  },
  {
    caseId: "hub-case-052",
    offerSessionId: "ofs_052",
    patientLabel: "Case 052 / no safe slot left",
    queueRank: 4,
    priorityBand: "Soon",
    originPractice: "Harbour Family Practice",
    reasonForHubRouting:
      "Network capacity aged out of the safe timeframe. The hub now owes a truthful callback continuation instead of more speculative offers.",
    status: "callback_transfer_pending",
    ownershipState: "stale_owner_recovery",
    claimedBy: "Supervisor recovery",
    queueSummary:
      "No safe ranked option remains. Callback transfer is required but the expectation record is not durably published yet.",
    truthSummary:
      "The shell must stop implying that another slot is likely. Callback transfer pending is the governing continuation truth.",
    blockerSummary:
      "A stale-owner recovery and missing callback publication both block any calm or read-through closure posture.",
    commsSummary:
      "Patient-facing copy is pinned to fallback wording; no new alternative offer may go live from this state.",
    auditSummary:
      "Recovery event `HUB-REC-052`, stale lease `LEASE-052-9`, and callback expectation gap `CB-052-PENDING` are open blockers.",
    dominantActionLabel: "Publish callback expectation",
    continuityQuestion:
      "Which blocker must clear before this can move from fallback pending to callback expected?",
    confirmationState: "Fallback required",
    ackState: "awaiting_ack",
    ackDueLabel: "Practice visibility refreshed 8m ago",
    fallbackDisposition: "callback_transfer_pending",
    lastProgressLabel: "Updated 8m ago",
    selectedOptionId: "hub-opt-052-callback",
    options: [
      {
        optionId: "hub-opt-052-callback",
        optionLabel: "Callback expectation",
        siteLabel: "Network coordination",
        slotLabel: "Awaiting publication",
        modality: "Callback",
        scoreLabel: "Required fallback",
        laneLabel: "Fallback",
        truthMode: "callback_only",
        timerMode: "none",
        timerLabel: "No countdown: callback truth activates only after expectation publication",
        truthSummary:
          "This is the only honest next step. It cannot masquerade as a bookable slot or soft alternative.",
        fallbackSummary:
          "Once the callback expectation is created, the shell may calm to callback expected and keep the case visible for follow-through.",
        patientChoiceSummary:
          "Patient explanation must shift from slot choice to coordinated callback without leaving the same shell.",
        routeActionLabel: "Publish callback expectation",
        auditRef: "AUD-052-CALLBACK",
        isRecommended: true,
      },
      {
        optionId: "hub-opt-052-diagnostic",
        optionLabel: "Expired ranked option evidence",
        siteLabel: "Historic proof only",
        slotLabel: "Read-only",
        modality: "Audit",
        scoreLabel: "Diagnostic only",
        laneLabel: "Provenance",
        truthMode: "diagnostic_only",
        timerMode: "none",
        timerLabel: "Historical timer suppressed after slot expiry",
        truthSummary:
          "This remains as provenance so the coordinator can explain why slot choice stopped being safe.",
        fallbackSummary:
          "Diagnostic rows never reopen writable slot posture on their own.",
        patientChoiceSummary:
          "Visible only to explain the fallback, not to invite another unsafe selection.",
        routeActionLabel: "Inspect provenance",
        auditRef: "AUD-052-DIAGNOSTIC",
        isRecommended: false,
      },
    ],
  },
] as const;

const hubCaseById = new Map(hubCases.map((hubCase) => [hubCase.caseId, hubCase]));
const hubOfferSessionToCaseId = new Map(
  hubCases.map((hubCase) => [hubCase.offerSessionId, hubCase.caseId]),
);

export const hubRouteContractSeedRows: readonly HubRouteContractSeedRow[] = [
  {
    path: "/hub/queue",
    routeFamilyRef: "rf_hub_queue",
    viewMode: "queue",
    continuityKey: queueClaim.continuityKey,
    selectedAnchorPolicy: "hub-ranked-option stays pinned while queue order changes",
    summary: "Queue-first coordination surface with ranked options and explicit hold truth.",
  },
  {
    path: "/hub/exceptions",
    routeFamilyRef: "rf_hub_queue",
    viewMode: "exceptions",
    continuityKey: queueClaim.continuityKey,
    selectedAnchorPolicy: "hub-comms keeps blocker and acknowledgement review in the same shell",
    summary: "Exception board for confirmation debt, acknowledgement debt, and callback-transfer blockers.",
  },
  {
    path: "/hub/case/:hubCoordinationCaseId",
    routeFamilyRef: "rf_hub_case_management",
    viewMode: "case",
    continuityKey: caseClaim.continuityKey,
    selectedAnchorPolicy: "hub-candidate preserves the selected case and current option through same-shell detail moves",
    summary: "Case detail surface with selected option continuity and live fallback law.",
  },
  {
    path: "/hub/alternatives/:offerSessionId",
    routeFamilyRef: "rf_hub_case_management",
    viewMode: "alternatives",
    continuityKey: caseClaim.continuityKey,
    selectedAnchorPolicy: "hub-candidate keeps the selected choice set honest across alternative review",
    summary: "Patient-choice review within the same shell; only held options may claim reserved language.",
  },
  {
    path: "/hub/audit/:hubCoordinationCaseId",
    routeFamilyRef: "rf_hub_case_management",
    viewMode: "audit",
    continuityKey: caseClaim.continuityKey,
    selectedAnchorPolicy: "hub-comms preserves proof review without detaching audit from the active case",
    summary: "Read-only audit rail with proof tuples, acknowledgement generations, and fallback evidence.",
  },
] as const;

export const hubMockProjectionExamples: readonly HubMockProjectionExample[] = [
  {
    exampleId: "hub-queue-held-option",
    path: "/hub/queue",
    viewMode: "queue",
    caseId: "hub-case-104",
    status: "alternatives_open",
    optionTruthMode: "exclusive_hold",
    timerMode: "hold_expiry",
    summary:
      "Queue view with one held option, one truthful nonexclusive alternative, and callback fallback held in reserve.",
  },
  {
    exampleId: "hub-case-confirmation-pending",
    path: "/hub/case/hub-case-087",
    viewMode: "case",
    caseId: "hub-case-087",
    status: "confirmation_pending",
    optionTruthMode: "confirmation_pending",
    timerMode: "none",
    summary:
      "Case detail keeps the selected candidate visible while commit evidence is still weaker than booked truth.",
  },
  {
    exampleId: "hub-alternatives-open-choice",
    path: "/hub/alternatives/ofs_104",
    viewMode: "alternatives",
    caseId: "hub-case-104",
    status: "alternatives_open",
    optionTruthMode: "truthful_nonexclusive",
    timerMode: "response_window",
    summary:
      "Alternative review keeps response-window wording explicit and avoids fake exclusivity countdowns.",
  },
  {
    exampleId: "hub-exceptions-callback-transfer",
    path: "/hub/exceptions",
    viewMode: "exceptions",
    caseId: "hub-case-052",
    status: "callback_transfer_pending",
    optionTruthMode: "callback_only",
    timerMode: "none",
    summary:
      "Exception board shows callback publication debt and stale-owner recovery without pretending a slot is still viable.",
  },
  {
    exampleId: "hub-audit-acknowledgement-debt",
    path: "/hub/audit/hub-case-066",
    viewMode: "audit",
    caseId: "hub-case-066",
    status: "booked_pending_practice_ack",
    optionTruthMode: "confirmed",
    timerMode: "none",
    summary:
      "Audit rail keeps confirmed booking proof and generation-bound acknowledgement debt in one same-shell review surface.",
  },
  {
    exampleId: "hub-case-fallback-only",
    path: "/hub/case/hub-case-052",
    viewMode: "case",
    caseId: "hub-case-052",
    status: "callback_transfer_pending",
    optionTruthMode: "callback_only",
    timerMode: "none",
    summary:
      "Case detail truthfully pivots from slot ranking to callback-only continuation when safe supply disappears.",
  },
] as const;

export const hubOptionTimerMatrixRows: readonly HubOptionTimerMatrixRow[] = hubCases.flatMap((hubCase) =>
  hubCase.options.map((option) => ({
    caseId: hubCase.caseId,
    caseStatus: hubCase.status,
    optionId: option.optionId,
    optionTruthMode: option.truthMode,
    timerMode: option.timerMode,
    countdownAuthority: option.timerMode === "hold_expiry" ? "exclusive_held" : "none",
    reservedCopyAllowed: option.truthMode === "exclusive_hold" ? "yes" : "no",
    timerLabel: option.timerLabel,
    dominantFallback: option.fallbackSummary,
    selectedByDefault: option.optionId === hubCase.selectedOptionId ? "yes" : "no",
  })),
);

function normalizeHubPath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed.startsWith("/hub")) {
    return HUB_DEFAULT_PATH;
  }
  return trimmed.length > 1 ? trimmed.replace(/\/+$/, "") || "/" : trimmed;
}

export function parseHubPath(pathname: string): HubLocation {
  const normalized = normalizeHubPath(pathname);
  if (normalized === "/hub/queue") {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_queue",
      viewMode: "queue",
      hubCoordinationCaseId: null,
      offerSessionId: null,
    };
  }
  if (normalized === "/hub/exceptions") {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_queue",
      viewMode: "exceptions",
      hubCoordinationCaseId: null,
      offerSessionId: null,
    };
  }
  const caseMatch = normalized.match(/^\/hub\/case\/([^/]+)$/);
  if (caseMatch?.[1]) {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_case_management",
      viewMode: "case",
      hubCoordinationCaseId: caseMatch[1],
      offerSessionId: null,
    };
  }
  const alternativesMatch = normalized.match(/^\/hub\/alternatives\/([^/]+)$/);
  if (alternativesMatch?.[1]) {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_case_management",
      viewMode: "alternatives",
      hubCoordinationCaseId: hubOfferSessionToCaseId.get(alternativesMatch[1]) ?? null,
      offerSessionId: alternativesMatch[1],
    };
  }
  const auditMatch = normalized.match(/^\/hub\/audit\/([^/]+)$/);
  if (auditMatch?.[1]) {
    return {
      pathname: normalized,
      routeFamilyRef: "rf_hub_case_management",
      viewMode: "audit",
      hubCoordinationCaseId: auditMatch[1],
      offerSessionId: null,
    };
  }
  return parseHubPath(HUB_DEFAULT_PATH);
}

function caseForId(caseId: string | null | undefined): HubCaseSeed | undefined {
  return caseId ? hubCaseById.get(caseId) : undefined;
}

function optionForCase(hubCase: HubCaseSeed, optionId: string | null | undefined): HubRankedOption {
  return hubCase.options.find((option) => option.optionId === optionId) ?? hubCase.options[0]!;
}

function activeExceptionRows(): readonly HubExceptionRow[] {
  return hubCases
    .filter(
      (hubCase) =>
        hubCase.status === "confirmation_pending" ||
        hubCase.ackState === "overdue" ||
        hubCase.fallbackDisposition === "callback_transfer_pending",
    )
    .map((hubCase) => ({
      caseId: hubCase.caseId,
      patientLabel: hubCase.patientLabel,
      category:
        hubCase.status === "confirmation_pending"
          ? "confirmation"
          : hubCase.ackState === "overdue"
            ? "acknowledgement"
            : "fallback",
      severity:
        hubCase.status === "confirmation_pending"
          ? "critical"
          : hubCase.ackState === "overdue"
            ? "caution"
            : "critical",
      summary:
        hubCase.status === "confirmation_pending"
          ? "Commit evidence is incomplete; the case cannot upgrade to booked truth."
          : hubCase.ackState === "overdue"
            ? `Practice acknowledgement debt is still open (${hubCase.ackDueLabel}).`
            : "Callback transfer is required but not yet durably published.",
      nextAction: hubCase.dominantActionLabel,
      viewPath: `/hub/case/${hubCase.caseId}`,
    }));
}

function matchesExceptionFilter(
  row: HubExceptionRow,
  filter: HubExceptionFilter,
): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "confirmation_pending") {
    return row.category === "confirmation";
  }
  if (filter === "ack_debt") {
    return row.category === "acknowledgement";
  }
  return row.category === "fallback";
}

function defaultCaseForLocation(
  location: HubLocation,
  preferredCaseId?: string,
  filter: HubExceptionFilter = "all",
): HubCaseSeed {
  const fromLocation =
    caseForId(location.hubCoordinationCaseId) ??
    caseForId(location.offerSessionId ? hubOfferSessionToCaseId.get(location.offerSessionId) : null);
  if (fromLocation) {
    return fromLocation;
  }
  const preferred = caseForId(preferredCaseId);
  if (preferred) {
    return preferred;
  }
  if (location.viewMode === "exceptions") {
    const row = activeExceptionRows().find((candidate) => matchesExceptionFilter(candidate, filter));
    if (row) {
      return caseForId(row.caseId) ?? hubCases[0]!;
    }
  }
  return hubCases[0]!;
}

function runtimeScenarioForLocation(location: HubLocation): RuntimeScenario {
  switch (location.viewMode) {
    case "exceptions":
    case "audit":
      return "read_only";
    default:
      return "live";
  }
}

function anchorKeyForLocation(location: HubLocation): string {
  switch (location.viewMode) {
    case "queue":
      return "hub-ranked-option";
    case "case":
    case "alternatives":
      return "hub-candidate";
    case "exceptions":
    case "audit":
      return "hub-comms";
  }
}

export function createHubTelemetryEnvelope(
  routeFamilyRef: HubRouteFamilyRef,
  eventClass: UiTelemetryEventClass,
  payload: Record<string, string | number | boolean | null>,
  surfaceState?: {
    selectedAnchorRef?: string;
    dominantActionRef?: string;
    focusRestoreRef?: string;
    artifactModeState?: string;
    recoveryPosture?: "live" | "read_only" | "recovery_only" | "blocked";
    visualizationAuthority?: "visual_table_summary" | "table_only" | "summary_only";
    routeShellPosture?: string;
  },
): UiTelemetryEnvelopeExample {
  const normalizedPayload = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, String(value ?? "")]),
  );
  return createUiTelemetryEnvelope({
    scenarioId: HUB_TELEMETRY_SCENARIO_ID,
    routeFamilyRef,
    sourceSurface: HUB_SOURCE_SURFACE,
    eventClass,
    payload: normalizedPayload,
    surfaceState,
  });
}

function continuitySnapshotForLocation(location: HubLocation): ContinuitySnapshot {
  return createInitialContinuitySnapshot({
    shellSlug: HUB_SHELL_SLUG,
    routeFamilyRef: location.routeFamilyRef,
    anchorKey: anchorKeyForLocation(location),
    runtimeScenario: runtimeScenarioForLocation(location),
  });
}

function nextContinuitySnapshot(
  snapshot: ContinuitySnapshot,
  location: HubLocation,
): ContinuitySnapshot {
  const anchorKey = anchorKeyForLocation(location);
  let nextSnapshot = snapshot;
  if (snapshot.activeRouteFamilyRef !== location.routeFamilyRef) {
    nextSnapshot = navigateWithinShell(snapshot, location.routeFamilyRef, {
      runtimeScenario: runtimeScenarioForLocation(location),
    }).snapshot;
  }
  if (nextSnapshot.selectedAnchor.anchorKey !== anchorKey) {
    nextSnapshot = selectAnchorInSnapshot(nextSnapshot, anchorKey);
  }
  return {
    ...nextSnapshot,
    runtimeScenario: runtimeScenarioForLocation(location),
  };
}

function summarySentenceForCase(
  hubCase: HubCaseSeed,
  option: HubRankedOption,
  viewMode: HubViewMode,
): string {
  if (viewMode === "exceptions") {
    return "Hub exceptions stay in the same shell so acknowledgement, confirmation, and callback blockers stay causally honest.";
  }
  if (viewMode === "audit") {
    return "Proof review stays beside the active case; audit never becomes a detached destination.";
  }
  switch (hubCase.status) {
    case "alternatives_open":
      return `${option.optionLabel} is the current lead, but only held capacity can use reserved language.`;
    case "confirmation_pending":
      return "The native booking commit is in flight. Confirmation pending remains the active truth.";
    case "booked_pending_practice_ack":
      return "Booked truth is durable, but the case stays open until the latest practice acknowledgement lands.";
    case "callback_transfer_pending":
      return "No safe offer remains. Callback publication is now the dominant next step.";
  }
}

function decisionDockForCase(
  hubCase: HubCaseSeed,
  option: HubRankedOption,
): HubDecisionDock {
  if (hubCase.status === "alternatives_open") {
    return {
      title: "DecisionDock",
      dominantActionLabel: option.routeActionLabel,
      actionState: option.truthMode === "exclusive_hold" ? "ready" : "watch",
      timerTruth: option.timerLabel,
      fallbackSummary: option.fallbackSummary,
    };
  }
  if (hubCase.status === "confirmation_pending") {
    return {
      title: "DecisionDock",
      dominantActionLabel: hubCase.dominantActionLabel,
      actionState: "watch",
      timerTruth: option.timerLabel,
      fallbackSummary: option.fallbackSummary,
    };
  }
  if (hubCase.status === "booked_pending_practice_ack") {
    return {
      title: "DecisionDock",
      dominantActionLabel: hubCase.dominantActionLabel,
      actionState: "watch",
      timerTruth: hubCase.ackDueLabel,
      fallbackSummary: "Acknowledgement debt blocks closure even though booked truth is strong.",
    };
  }
  return {
    title: "DecisionDock",
    dominantActionLabel: hubCase.dominantActionLabel,
    actionState: "blocked",
    timerTruth: option.timerLabel,
    fallbackSummary: "Fallback publication is the only honest continuation until callback expectation is durable.",
  };
}

export function resolveHubShellSnapshot(
  state: HubShellState,
  viewportWidth: number,
): HubShellSnapshot {
  const currentCase = defaultCaseForLocation(state.location, state.selectedCaseId, state.exceptionFilter);
  const currentOption = optionForCase(currentCase, state.selectedOptionId);
  const exceptionRows = activeExceptionRows().filter((row) =>
    matchesExceptionFilter(row, state.exceptionFilter),
  );

  const artifactModeState =
    state.location.viewMode === "exceptions"
      ? "table_only"
      : state.location.viewMode === "audit"
        ? "summary_only"
        : "interactive_live";
  const visualizationAuthority =
    artifactModeState === "table_only"
      ? "table_only"
      : artifactModeState === "summary_only"
        ? "summary_only"
        : "visual_table_summary";
  const recoveryPosture =
    state.location.viewMode === "exceptions" || state.location.viewMode === "audit"
      ? "read_only"
      : "live";
  const routeShellPosture =
    recoveryPosture === "live"
      ? "shell_live"
      : recoveryPosture === "read_only"
        ? "shell_read_only"
        : "shell_recovery";

  return {
    location: state.location,
    currentCase,
    currentOption,
    queueCases: [...hubCases].sort((left, right) => left.queueRank - right.queueRank),
    exceptionRows,
    decisionDock: decisionDockForCase(currentCase, currentOption),
    frameMode: viewportWidth < 980 ? "mission_stack" : "two_plane",
    artifactModeState,
    visualizationAuthority,
    recoveryPosture,
    routeShellPosture,
    routeMutationEnabled:
      state.location.routeFamilyRef === "rf_hub_case_management" && state.location.viewMode !== "audit",
    summarySentence: summarySentenceForCase(currentCase, currentOption, state.location.viewMode),
  };
}

function createHubReturnToken(
  location: HubLocation,
  hubCase: HubCaseSeed,
  selectedOptionId: string,
): HubReturnToken | null {
  if (location.viewMode !== "alternatives" && location.viewMode !== "audit") {
    return null;
  }
  return {
    returnTokenId: `HRT_${hubCase.caseId.toUpperCase()}`,
    originPath: `/hub/case/${hubCase.caseId}`,
    selectedCaseId: hubCase.caseId,
    selectedOptionId,
    issuedAt: "2026-04-14T09:40:00Z",
  };
}

export function createInitialHubShellState(
  pathname: string = HUB_DEFAULT_PATH,
  options: {
    selectedCaseId?: string;
    selectedOptionId?: string;
    exceptionFilter?: HubExceptionFilter;
  } = {},
): HubShellState {
  const location = parseHubPath(pathname);
  const exceptionFilter = options.exceptionFilter ?? "all";
  const currentCase = defaultCaseForLocation(location, options.selectedCaseId, exceptionFilter);
  const currentOption = optionForCase(currentCase, options.selectedOptionId ?? currentCase.selectedOptionId);
  const continuitySnapshot = continuitySnapshotForLocation(location);
  return {
    location,
    continuitySnapshot,
    selectedCaseId: currentCase.caseId,
    selectedOptionId: currentOption.optionId,
    exceptionFilter,
    returnToken: createHubReturnToken(location, currentCase, currentOption.optionId),
    runtimeScenario: runtimeScenarioForLocation(location),
    telemetry: [
      createHubTelemetryEnvelope(location.routeFamilyRef, "surface_enter", {
        pathname: location.pathname,
        caseId: currentCase.caseId,
        optionId: currentOption.optionId,
        viewMode: location.viewMode,
      }),
    ],
  };
}

function appendTelemetry(
  state: HubShellState,
  eventClass: UiTelemetryEventClass,
  payload: Record<string, string | number | boolean | null>,
): readonly UiTelemetryEnvelopeExample[] {
  return [
    ...state.telemetry,
    createHubTelemetryEnvelope(state.location.routeFamilyRef, eventClass, payload),
  ];
}

export function selectHubCase(
  state: HubShellState,
  caseId: string,
): HubShellState {
  const currentCase = caseForId(caseId) ?? caseForId(state.selectedCaseId) ?? hubCases[0]!;
  const currentOption = optionForCase(currentCase, currentCase.selectedOptionId);
  const nextLocation =
    state.location.viewMode === "case" ||
    state.location.viewMode === "alternatives" ||
    state.location.viewMode === "audit"
      ? {
          ...state.location,
          hubCoordinationCaseId: currentCase.caseId,
          offerSessionId:
            state.location.viewMode === "alternatives" ? currentCase.offerSessionId : state.location.offerSessionId,
        }
      : state.location;
  const continuitySnapshot = nextContinuitySnapshot(state.continuitySnapshot, nextLocation);
  return {
    ...state,
    location: nextLocation,
    continuitySnapshot,
    selectedCaseId: currentCase.caseId,
    selectedOptionId: currentOption.optionId,
    returnToken: createHubReturnToken(nextLocation, currentCase, currentOption.optionId),
    telemetry: appendTelemetry(state, "selected_anchor_changed", {
      caseId: currentCase.caseId,
      optionId: currentOption.optionId,
      viewMode: nextLocation.viewMode,
    }),
  };
}

export function selectHubOption(
  state: HubShellState,
  optionId: string,
): HubShellState {
  const currentCase = caseForId(state.selectedCaseId) ?? hubCases[0]!;
  const currentOption = optionForCase(currentCase, optionId);
  return {
    ...state,
    selectedOptionId: currentOption.optionId,
    returnToken: createHubReturnToken(state.location, currentCase, currentOption.optionId),
    telemetry: appendTelemetry(state, "selected_anchor_changed", {
      caseId: currentCase.caseId,
      optionId: currentOption.optionId,
      truthMode: currentOption.truthMode,
    }),
  };
}

export function setHubExceptionFilter(
  state: HubShellState,
  exceptionFilter: HubExceptionFilter,
): HubShellState {
  const currentCase = defaultCaseForLocation(state.location, state.selectedCaseId, exceptionFilter);
  const currentOption = optionForCase(currentCase, state.selectedOptionId);
  return {
    ...state,
    selectedCaseId: currentCase.caseId,
    selectedOptionId: currentOption.optionId,
    exceptionFilter,
    telemetry: appendTelemetry(state, "state_summary_changed", {
      filter: exceptionFilter,
      caseId: currentCase.caseId,
    }),
  };
}

export function navigateHubShell(
  state: HubShellState,
  pathname: string,
): HubShellState {
  const location = parseHubPath(pathname);
  const currentCase = defaultCaseForLocation(location, state.selectedCaseId, state.exceptionFilter);
  const currentOption = optionForCase(currentCase, state.selectedOptionId ?? currentCase.selectedOptionId);
  const continuitySnapshot = nextContinuitySnapshot(state.continuitySnapshot, location);
  return {
    ...state,
    location,
    continuitySnapshot,
    selectedCaseId: currentCase.caseId,
    selectedOptionId: currentOption.optionId,
    returnToken: createHubReturnToken(location, currentCase, currentOption.optionId),
    runtimeScenario: runtimeScenarioForLocation(location),
    telemetry: appendTelemetry(state, "state_summary_changed", {
      pathname: location.pathname,
      viewMode: location.viewMode,
      caseId: currentCase.caseId,
      optionId: currentOption.optionId,
    }),
  };
}

export function returnFromHubChildRoute(state: HubShellState): HubShellState {
  const originPath = state.returnToken?.originPath ?? `/hub/case/${state.selectedCaseId}`;
  return navigateHubShell(state, originPath);
}

export function createHubGallerySeed() {
  return hubMockProjectionExamples.map((example) => {
    const state = createInitialHubShellState(example.path);
    const snapshot = resolveHubShellSnapshot(state, 1440);
    return {
      exampleId: example.exampleId,
      location: snapshot.location,
      currentCase: {
        caseId: snapshot.currentCase.caseId,
        status: snapshot.currentCase.status,
        ackState: snapshot.currentCase.ackState,
      },
      currentOption: {
        optionId: snapshot.currentOption.optionId,
        truthMode: snapshot.currentOption.truthMode,
        timerMode: snapshot.currentOption.timerMode,
      },
      decisionDock: snapshot.decisionDock,
      artifactModeState: snapshot.artifactModeState,
      summarySentence: snapshot.summarySentence,
    };
  });
}

export function createHubRouteMapMermaid(): string {
  return `flowchart LR
  Q["/hub/queue"] --> C["/hub/case/:hubCoordinationCaseId"]
  Q --> E["/hub/exceptions"]
  C --> A["/hub/alternatives/:offerSessionId"]
  C --> U["/hub/audit/:hubCoordinationCaseId"]
  E --> C
  A --> C
  U --> C
  classDef shell fill:#f4eee3,stroke:#1f4b57,color:#10232a,stroke-width:1.4px
  class Q,C,A,E,U shell`;
}
