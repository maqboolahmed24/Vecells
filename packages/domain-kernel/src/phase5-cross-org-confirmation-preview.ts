export type CrossOrgCommitPosture =
  | "candidate_revalidation"
  | "native_booking_pending"
  | "confirmation_pending"
  | "booked_pending_practice_ack"
  | "booked"
  | "disputed"
  | "supplier_drift";

export type CrossOrgTone = "pending" | "confirmed" | "acknowledgement" | "warning" | "disputed";
export type CrossOrgStepState = "complete" | "current" | "upcoming" | "blocked";
export type CrossOrgManagePosture = "live" | "quiet_pending" | "frozen";
export type PracticeAcknowledgementState =
  | "not_started"
  | "transport_pending"
  | "ack_pending"
  | "acknowledged"
  | "reopened_by_drift";
export type PatientConfirmationState = "pending_copy" | "calm_confirmed" | "blocked";

export interface CrossOrgSummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface CrossOrgTimelineRow {
  readonly rowId: string;
  readonly lane: "candidate" | "commit" | "supplier" | "patient" | "practice";
  readonly label: string;
  readonly detail: string;
  readonly state: CrossOrgStepState;
  readonly evidenceRef: string;
  readonly timeLabel: string;
}

export interface ManualNativeBookingProofProjection {
  readonly proofBundleRef: string;
  readonly reviewHeading: string;
  readonly reviewSummary: string;
  readonly checklist: readonly string[];
  readonly reviewRows: readonly CrossOrgSummaryRow[];
  readonly submitLabel: string;
}

export interface ImportedConfirmationReviewProjection {
  readonly reviewBundleRef: string;
  readonly heading: string;
  readonly summary: string;
  readonly contradictionRows: readonly CrossOrgSummaryRow[];
  readonly resolutionActions: readonly string[];
}

export interface PracticeVisibilityProjection329 {
  readonly projectionRef: string;
  readonly heading: string;
  readonly summary: string;
  readonly acknowledgementState: PracticeAcknowledgementState;
  readonly acknowledgementLabel: string;
  readonly minimumNecessaryRows: readonly CrossOrgSummaryRow[];
  readonly patientFacingRows: readonly CrossOrgSummaryRow[];
}

export interface ContinuityDeliveryEvidenceProjection329 {
  readonly drawerRef: string;
  readonly heading: string;
  readonly summary: string;
  readonly evidenceRows: readonly CrossOrgSummaryRow[];
  readonly notificationPreview: {
    readonly title: string;
    readonly body: string;
    readonly rows: readonly CrossOrgSummaryRow[];
  };
}

export interface SupplierDriftBannerProjection329 {
  readonly bannerRef: string;
  readonly heading: string;
  readonly summary: string;
  readonly blockedActions: readonly string[];
}

export interface PatientNetworkConfirmationProjection329 {
  readonly scenarioId: NetworkConfirmationScenarioId329;
  readonly pathname: string;
  readonly heading: string;
  readonly body: string;
  readonly state: PatientConfirmationState;
  readonly appointmentRows: readonly CrossOrgSummaryRow[];
  readonly nextSteps: readonly string[];
  readonly disclosureRows: readonly {
    readonly label: string;
    readonly value: string;
    readonly emphasis: "primary" | "secondary";
  }[];
  readonly manageStubLabel: string;
  readonly manageStubSummary: string;
  readonly patientFacingReference: string;
}

export interface CrossOrgCommitScenarioProjection {
  readonly caseId: string;
  readonly posture: CrossOrgCommitPosture;
  readonly truthLabel: string;
  readonly summary: string;
  readonly tone: CrossOrgTone;
  readonly evidenceStrengthLabel: string;
  readonly managePosture: CrossOrgManagePosture;
  readonly appointmentRows: readonly CrossOrgSummaryRow[];
  readonly timelineRows: readonly CrossOrgTimelineRow[];
  readonly evidenceRows: readonly CrossOrgSummaryRow[];
  readonly settlementReceiptRows: readonly CrossOrgSummaryRow[];
  readonly patientView: PatientNetworkConfirmationProjection329;
  readonly practiceView: PracticeVisibilityProjection329;
  readonly continuityDrawer: ContinuityDeliveryEvidenceProjection329;
  readonly manualProof: ManualNativeBookingProofProjection | null;
  readonly importedReview: ImportedConfirmationReviewProjection | null;
  readonly supplierDriftBanner: SupplierDriftBannerProjection329 | null;
}

export type NetworkConfirmationScenarioId329 =
  | "network_confirmation_329_pending"
  | "network_confirmation_329_practice_informed"
  | "network_confirmation_329_practice_acknowledged"
  | "network_confirmation_329_disputed"
  | "network_confirmation_329_supplier_drift";

const appointmentRowsBase = [
  { label: "Site", value: "North Shore Hub / Room 4" },
  { label: "When", value: "Today at 10:20" },
  { label: "Clinician", value: "Dr M. Iqbal" },
  { label: "Access", value: "Wheelchair route confirmed" },
] as const satisfies readonly CrossOrgSummaryRow[];

const bookedEvidenceRows = [
  { label: "Confirmed booking", value: "Current confirmed details" },
  { label: "Supplier confirmation", value: "CONF-104-2 / authoritative" },
  { label: "Patient wording", value: "Appointment confirmed" },
  { label: "Practice continuity", value: "VIS-104 generation 6" },
] as const satisfies readonly CrossOrgSummaryRow[];

const continuityBase = {
  drawerRef: "continuity-drawer-104",
  heading: "Continuity and delivery evidence",
  summary:
    "One drawer keeps dispatch, delivery, acknowledgement generation, and patient wording together.",
  evidenceRows: [
    { label: "Continuity summary", value: "CNT-104-6 / trusted same-case summary" },
    { label: "Practice dispatch", value: "MESH queued 10:21 / delivered 10:23" },
    { label: "Patient notification", value: "Patient notice published 10:24" },
    { label: "Visibility summary", value: "Practice minimum necessary" },
  ],
  notificationPreview: {
    title: "Practice notification preview",
    body: "Appointment confirmed for today at 10:20 at North Shore Hub. Patient sees: Appointment confirmed. Practice informed is current. Practice acknowledged remains pending until your acknowledgement is received.",
    rows: [
      { label: "Notification channel", value: "MESH / booked network notice" },
      { label: "Ack generation", value: "Generation 6 / overdue after 30m" },
      { label: "Patient-facing wording", value: "Appointment confirmed" },
    ],
  },
} satisfies ContinuityDeliveryEvidenceProjection329;

const manualProof = {
  proofBundleRef: "manual-proof-104-1",
  reviewHeading: "Manual native booking proof",
  reviewSummary: "Structured proof stays review-first. Free text is not accepted as confirmed booking information.",
  checklist: [
    "Patient binding reviewed against the current confirmed details",
    "Site, start time, and clinician checked against the call outcome",
    "Manual reference captured before booked calmness is widened",
  ],
  reviewRows: [
    { label: "Native path", value: "Manual confirmation pending" },
    { label: "Operator", value: "J. Malik / North Shore Hub" },
    { label: "Supplier reference", value: "TEL-104-8813" },
    { label: "Booked time", value: "Today at 10:20" },
    { label: "Booked by", value: "North Shore Hub desk" },
  ],
  submitLabel: "Attach reviewed manual proof",
} satisfies ManualNativeBookingProofProjection;

const importedReview = {
  reviewBundleRef: "import-review-087-1",
  heading: "Imported confirmation review",
  summary:
    "Imported evidence exists, but the current booking details and supplier reference still contradict it, so booked calmness remains blocked.",
  contradictionRows: [
    { label: "Imported file", value: "CSV_IMPORT_087 / line 44" },
    { label: "Imported reference", value: "EXT-44122" },
    { label: "Current booking", value: "Current booking details" },
    { label: "Contradiction", value: "Imported time 11:05 disagrees with current held slot 10:20" },
  ],
  resolutionActions: [
    "Keep patient copy provisional",
    "Request supplier-side re-correlation",
    "Reopen practice continuity only after the current booking details are confirmed",
  ],
} satisfies ImportedConfirmationReviewProjection;

const supplierDriftBanner = {
  bannerRef: "supplier-drift-041",
  heading: "Supplier change freezes stale manage actions",
  summary:
    "A later supplier observation changed the current booking details. Manage stays frozen and practice acknowledgement debt reopens until review settles.",
  blockedActions: [
    "No live manage CTA",
    "No calm booked receipt",
    "No acknowledgement clearance from stale generation",
  ],
} satisfies SupplierDriftBannerProjection329;

function buildTimelineRows(posture: CrossOrgCommitPosture): readonly CrossOrgTimelineRow[] {
  const practiceLaneState: CrossOrgStepState =
    posture === "booked"
      ? "complete"
      : posture === "booked_pending_practice_ack"
        ? "current"
        : posture === "supplier_drift"
          ? "blocked"
          : "upcoming";

  return [
    {
      rowId: "candidate",
      lane: "candidate",
      label: "Candidate revalidation",
      detail:
        posture === "candidate_revalidation"
          ? "Current held slot is still being revalidated against the live capacity snapshot."
          : "Candidate snapshot stayed inside the permitted window before commit began.",
      state: posture === "candidate_revalidation" ? "current" : "complete",
      evidenceRef: "CAND-104-6",
      timeLabel: "10:12",
    },
    {
      rowId: "commit",
      lane: "commit",
      label: "Commit attempt",
      detail:
        posture === "native_booking_pending"
          ? "Native commit is in progress and structured manual proof can be reviewed."
          : posture === "disputed"
            ? "Imported evidence exists but does not correlate to the current booking."
            : "Commit attempt BTX-104-2 remains the active booking attempt record.",
      state:
        posture === "candidate_revalidation"
          ? "upcoming"
          : posture === "disputed"
            ? "blocked"
            : posture === "native_booking_pending"
              ? "current"
              : "complete",
      evidenceRef: posture === "disputed" ? "BTX-087-3" : "BTX-104-2",
      timeLabel: posture === "disputed" ? "10:18" : "10:16",
    },
    {
      rowId: "supplier",
      lane: "supplier",
      label: "Supplier confirmation",
      detail:
        posture === "confirmation_pending"
          ? "Supplier confirmation is still pending; patient calmness remains provisional."
          : posture === "disputed"
            ? "Imported supplier file contradicts the current booking."
            : posture === "supplier_drift"
              ? "Later supplier observation drifted away from the last safe booking."
            : posture === "candidate_revalidation" || posture === "native_booking_pending"
                ? "No authoritative supplier confirmation is attached yet."
                : "Supplier confirmation cleared the current booking and confirmed the appointment.",
      state:
        posture === "confirmation_pending"
          ? "current"
          : posture === "disputed" || posture === "supplier_drift"
            ? "blocked"
            : posture === "candidate_revalidation" || posture === "native_booking_pending"
              ? "upcoming"
              : "complete",
      evidenceRef:
        posture === "supplier_drift"
          ? "MIR-041-5"
          : posture === "disputed"
            ? "IMPORT-087-1"
            : "CONF-104-2",
      timeLabel: posture === "supplier_drift" ? "10:27" : "10:19",
    },
    {
      rowId: "patient",
      lane: "patient",
      label: "Patient confirmation copy",
      detail:
        posture === "booked" || posture === "booked_pending_practice_ack"
          ? "Appointment confirmed is now lawful patient reassurance."
        : posture === "supplier_drift" || posture === "disputed"
            ? "Patient view stays in review status while the contradiction is open."
            : "Patient copy remains provisional while confirmation is pending.",
      state:
        posture === "booked" || posture === "booked_pending_practice_ack"
          ? "complete"
          : posture === "supplier_drift" || posture === "disputed"
            ? "blocked"
            : posture === "confirmation_pending"
              ? "current"
              : "upcoming",
      evidenceRef: "PATIENT-COPY-104",
      timeLabel:
        posture === "booked" || posture === "booked_pending_practice_ack" ? "10:24" : "Pending",
    },
    {
      rowId: "practice",
      lane: "practice",
      label: "Origin-practice visibility",
      detail:
        posture === "booked"
          ? "Practice acknowledged the live generation."
          : posture === "booked_pending_practice_ack"
            ? "Practice was informed, but the current acknowledgement generation is still open."
            : posture === "supplier_drift"
              ? "Drift reopened acknowledgement debt on a newer generation."
              : "Practice visibility remains secondary until confirmed booking information is current.",
      state: practiceLaneState,
      evidenceRef: posture === "supplier_drift" ? "VIS-041-7" : "VIS-104-6",
      timeLabel:
        posture === "booked"
          ? "10:31"
          : posture === "booked_pending_practice_ack"
            ? "10:23"
            : posture === "supplier_drift"
              ? "10:27"
              : "Pending",
    },
  ];
}

function buildPatientView(
  scenarioId: NetworkConfirmationScenarioId329,
  posture: CrossOrgCommitPosture,
): PatientNetworkConfirmationProjection329 {
  const confirmed = posture === "booked" || posture === "booked_pending_practice_ack";
  const acknowledged = posture === "booked";
  const blocked = posture === "supplier_drift" || posture === "disputed";

  return {
    scenarioId,
    pathname: `/bookings/network/confirmation/${scenarioId}`,
    heading: blocked
      ? "We’re reviewing this appointment"
      : confirmed
        ? "Appointment confirmed"
        : "We’re confirming your appointment",
    body: blocked
      ? "Keep the appointment summary in view, but do not rely on previous calm wording while the latest confirmation is under review."
      : confirmed
        ? "Your appointment is confirmed. Practice follow-on stays visible as a separate operational disclosure."
        : "Your chosen appointment is still being confirmed. We’ll keep this page updated without pretending it is final yet.",
    state: blocked ? "blocked" : confirmed ? "calm_confirmed" : "pending_copy",
    appointmentRows: appointmentRowsBase,
    nextSteps: blocked
      ? [
          "We’ll review the contradiction and update this page.",
          "If anything changes, your latest safe summary will remain visible here.",
          "Use the contact option below if the time no longer works.",
        ]
      : confirmed
        ? [
            "Arrive 10 minutes early and bring any current medication list.",
            "If the time no longer works, use the managed follow-on route below.",
            "You do not need to contact the practice separately unless we ask you to.",
          ]
        : [
            "We’re checking supplier confirmation now.",
            "We’ll only widen final reassurance after authoritative confirmation arrives.",
            "If you need help before then, use the support route below.",
          ],
    disclosureRows: [
      {
        label: "Appointment confirmed",
        value: confirmed ? "Confirmed" : blocked ? "Under review" : "Pending confirmation",
        emphasis: "primary",
      },
      {
        label: "Practice informed",
        value: confirmed
          ? "Sent to Riverside Medical at 10:23"
          : blocked
            ? "Previous notice reopened for review"
            : "Not yet",
        emphasis: "secondary",
      },
      {
        label: "Practice acknowledged",
        value: acknowledged
          ? "Acknowledged at 10:31"
          : blocked
            ? "Reopened by supplier drift"
            : "Waiting for acknowledgement",
        emphasis: "secondary",
      },
    ],
    manageStubLabel: blocked ? "Manage is temporarily frozen" : "Manage or contact follow-on",
    manageStubSummary: blocked
      ? "Manage controls stay frozen while continuity and supplier confirmation are under review."
      : confirmed
        ? "Manage stays available only while the current confirmation and continuity bundle remain live."
        : "Manage opens after confirmation and continuity both settle.",
    patientFacingReference: confirmed ? "Appointment confirmed" : "Confirmation pending",
  };
}

function buildPracticeView(posture: CrossOrgCommitPosture): PracticeVisibilityProjection329 {
  const acknowledgementState: PracticeAcknowledgementState =
    posture === "booked"
      ? "acknowledged"
      : posture === "booked_pending_practice_ack"
        ? "ack_pending"
        : posture === "supplier_drift"
          ? "reopened_by_drift"
          : posture === "confirmation_pending"
            ? "transport_pending"
            : "not_started";

  const acknowledgementLabel =
    acknowledgementState === "acknowledged"
      ? "Practice acknowledged"
      : acknowledgementState === "ack_pending"
        ? "Acknowledgement overdue"
        : acknowledgementState === "reopened_by_drift"
          ? "Acknowledgement reopened"
          : acknowledgementState === "transport_pending"
            ? "Practice informed pending"
            : "Not yet informed";

  return {
    projectionRef: `practice-visibility-${posture}`,
    heading: "Origin practice visibility",
    summary:
      "This panel stays minimum-necessary. Hub-only rank proof and booking internals do not widen into the practice view.",
    acknowledgementState,
    acknowledgementLabel,
    minimumNecessaryRows: [
      { label: "Patient", value: "A. Malik / NHS no. ending 4821" },
      { label: "Booked slot", value: "Today at 10:20 / North Shore Hub" },
      { label: "Operational ask", value: "Acknowledge current generation if received" },
      {
        label: "Current generation",
        value:
          acknowledgementState === "reopened_by_drift"
            ? "Generation 7 / reopened"
            : acknowledgementState === "acknowledged"
              ? "Generation 6 / cleared"
              : "Generation 6 / live",
      },
    ],
    patientFacingRows: [
      {
        label: "Patient-facing headline",
        value:
          posture === "booked" || posture === "booked_pending_practice_ack"
            ? "Appointment confirmed"
            : "Confirmation pending",
      },
      {
        label: "Secondary disclosure",
        value:
          posture === "booked"
            ? "Practice informed and practice acknowledged"
            : posture === "booked_pending_practice_ack"
              ? "Practice informed; practice acknowledged pending"
              : posture === "supplier_drift"
                ? "Previous practice notice reopened for review"
                : "No practice disclosure shown yet",
      },
    ],
  };
}

function buildScenario(
  caseId: string,
  posture: CrossOrgCommitPosture,
  patientScenarioId: NetworkConfirmationScenarioId329,
): CrossOrgCommitScenarioProjection {
  const truthLabel =
    posture === "candidate_revalidation"
      ? "Candidate revalidation"
      : posture === "native_booking_pending"
        ? "Native booking pending"
        : posture === "confirmation_pending"
          ? "Confirmation pending"
          : posture === "booked_pending_practice_ack"
            ? "Booked pending practice acknowledgement"
            : posture === "booked"
              ? "Booked"
              : posture === "disputed"
                ? "Imported confirmation disputed"
                : "Supplier drift review";

  return {
    caseId,
    posture,
    truthLabel,
    summary:
      posture === "candidate_revalidation"
        ? "The candidate is still live, but commit has not started and calm booked wording is illegal."
        : posture === "native_booking_pending"
          ? "A native commit is in progress with structured manual proof under review."
          : posture === "confirmation_pending"
            ? "Structured proof exists, but supplier confirmation is still the governing blocker."
            : posture === "booked_pending_practice_ack"
              ? "Booked details are durable. Practice informed is current. Practice acknowledgement is still open."
              : posture === "booked"
                ? "Booked details, patient reassurance, and practice acknowledgement are aligned on the live generation."
                : posture === "disputed"
                  ? "Imported evidence contradicts the current booking. The workspace stays in review status."
                  : "A later supplier observation drifted the current booking and froze stale manage actions.",
    tone:
      posture === "booked"
        ? "confirmed"
        : posture === "booked_pending_practice_ack"
          ? "acknowledgement"
          : posture === "candidate_revalidation" ||
              posture === "native_booking_pending" ||
              posture === "confirmation_pending"
            ? "pending"
            : posture === "supplier_drift"
              ? "warning"
              : "disputed",
    evidenceStrengthLabel:
      posture === "booked"
        ? "Authoritative supplier confirmation"
        : posture === "booked_pending_practice_ack"
          ? "Confirmed, awaiting practice acknowledgement"
          : posture === "confirmation_pending"
            ? "Structured proof only"
            : posture === "native_booking_pending"
              ? "Commit attempt in flight"
              : posture === "candidate_revalidation"
                ? "Revalidation only"
                : posture === "disputed"
                  ? "Imported evidence disputed"
                  : "Drift blocks stale booking reuse",
    managePosture:
      posture === "booked"
        ? "live"
        : posture === "supplier_drift" || posture === "disputed"
          ? "frozen"
          : "quiet_pending",
    appointmentRows: appointmentRowsBase,
    timelineRows: buildTimelineRows(posture),
    evidenceRows:
      posture === "disputed"
        ? [
            { label: "Current status", value: "Pending review / imported contradiction open" },
            { label: "Imported file", value: "CSV_IMPORT_087 / awaiting re-correlation" },
            { label: "Patient wording", value: "Reviewing your appointment" },
            { label: "Practice wording", value: "No new booked notice issued" },
          ]
        : posture === "supplier_drift"
          ? [
              { label: "Current status", value: "Blocked by drift" },
              { label: "Mirror observation", value: "MIR-041-5 / changed at 10:27" },
              { label: "Patient wording", value: "We’re reviewing this appointment" },
              { label: "Practice wording", value: "Generation 7 reopened" },
            ]
          : bookedEvidenceRows,
    settlementReceiptRows: [
      { label: "Confirmation status", value: truthLabel },
      {
        label: "Manage status",
        value:
          posture === "booked"
            ? "Live"
            : posture === "supplier_drift" || posture === "disputed"
              ? "Frozen"
              : "Quiet pending",
      },
      {
        label: "Practice visibility",
        value:
          posture === "booked"
            ? "Acknowledged"
            : posture === "booked_pending_practice_ack"
              ? "Informed, awaiting acknowledgement"
              : posture === "supplier_drift"
                ? "Reopened by drift"
                : "Not yet widened",
      },
      { label: "Patient headline", value: buildPatientView(patientScenarioId, posture).heading },
    ],
    patientView: buildPatientView(patientScenarioId, posture),
    practiceView: buildPracticeView(posture),
    continuityDrawer: continuityBase,
    manualProof:
      posture === "native_booking_pending" || posture === "confirmation_pending"
        ? manualProof
        : null,
    importedReview: posture === "disputed" ? importedReview : null,
    supplierDriftBanner: posture === "supplier_drift" ? supplierDriftBanner : null,
  };
}

export const hubCommitDefaultPostureByCaseId: Readonly<Record<string, CrossOrgCommitPosture>> = {
  "hub-case-104": "candidate_revalidation",
  "hub-case-087": "confirmation_pending",
  "hub-case-066": "booked_pending_practice_ack",
  "hub-case-041": "supplier_drift",
};

export function resolveCrossOrgCommitScenario(
  caseId: string,
  postureOverride?: CrossOrgCommitPosture,
): CrossOrgCommitScenarioProjection | null {
  const posture = postureOverride ?? hubCommitDefaultPostureByCaseId[caseId];
  if (!posture) {
    return null;
  }

  const patientScenarioId: NetworkConfirmationScenarioId329 =
    posture === "booked"
      ? "network_confirmation_329_practice_acknowledged"
      : posture === "booked_pending_practice_ack"
        ? "network_confirmation_329_practice_informed"
        : posture === "supplier_drift"
          ? "network_confirmation_329_supplier_drift"
          : posture === "disputed"
            ? "network_confirmation_329_disputed"
            : "network_confirmation_329_pending";

  return buildScenario(caseId, posture, patientScenarioId);
}

export function resolvePatientNetworkConfirmationProjection329(
  scenarioId: NetworkConfirmationScenarioId329,
): PatientNetworkConfirmationProjection329 {
  switch (scenarioId) {
    case "network_confirmation_329_practice_informed":
      return buildPatientView(scenarioId, "booked_pending_practice_ack");
    case "network_confirmation_329_practice_acknowledged":
      return buildPatientView(scenarioId, "booked");
    case "network_confirmation_329_disputed":
      return buildPatientView(scenarioId, "disputed");
    case "network_confirmation_329_supplier_drift":
      return buildPatientView(scenarioId, "supplier_drift");
    case "network_confirmation_329_pending":
    default:
      return buildPatientView("network_confirmation_329_pending", "confirmation_pending");
  }
}

export function resolvePatientNetworkConfirmationScenarioId329(
  pathname: string,
): NetworkConfirmationScenarioId329 | null {
  const match = pathname.match(
    /^\/bookings\/network\/confirmation\/(network_confirmation_329_[a-z_]+)\/?$/u,
  );
  if (!match?.[1]) {
    return null;
  }
  switch (match[1] as NetworkConfirmationScenarioId329) {
    case "network_confirmation_329_pending":
    case "network_confirmation_329_practice_informed":
    case "network_confirmation_329_practice_acknowledged":
    case "network_confirmation_329_disputed":
    case "network_confirmation_329_supplier_drift":
      return match[1] as NetworkConfirmationScenarioId329;
    default:
      return null;
  }
}
