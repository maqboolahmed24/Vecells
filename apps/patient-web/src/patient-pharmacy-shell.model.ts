export const PATIENT_PHARMACY_SHELL_TASK_ID = "par_356";
export const PATIENT_PHARMACY_SHELL_VISUAL_MODE = "Pharmacy_Mission_Frame";
export const PATIENT_PHARMACY_DEFAULT_PATH = "/pharmacy/PHC-2048/choose";

export type PatientPharmacyRouteKey = "choose" | "instructions" | "status";
export type PatientPharmacyRecoveryPosture =
  | "live"
  | "read_only"
  | "recovery_only"
  | "blocked";
export type PatientPharmacyLayoutMode = "two_plane" | "mission_stack";

export interface PatientPharmacyLocation {
  pathname: string;
  pharmacyCaseId: string;
  routeKey: PatientPharmacyRouteKey;
}

export interface PatientPharmacyCaseSeed {
  pharmacyCaseId: string;
  requestLineageLabel: string;
  chosenProviderLabel: string;
  chosenProviderSummary: string;
  continuityKey: string;
  providerStateLabel: string;
  shellSummary: string;
  nextStepSummary: string;
  checkpointSummary: string;
  dominantActionLabel: string;
  recoveryPosture: PatientPharmacyRecoveryPosture;
  routeEyebrow: Record<PatientPharmacyRouteKey, string>;
  routeHeading: Record<PatientPharmacyRouteKey, string>;
  routeSummary: Record<PatientPharmacyRouteKey, string>;
}

export interface PatientPharmacyShellState {
  location: PatientPharmacyLocation;
}

export interface PatientPharmacyShellSnapshot {
  location: PatientPharmacyLocation;
  currentCase: PatientPharmacyCaseSeed;
  layoutMode: PatientPharmacyLayoutMode;
  breakpointClass: "wide" | "narrow" | "compact";
  promotedSupportRegion: "provider_anchor" | "timeline_support" | "status_recovery";
  checkpointId: "consent" | "dispatch" | "outcome";
}

export const patientPharmacyCases: readonly PatientPharmacyCaseSeed[] = [
  {
    pharmacyCaseId: "PHC-2048",
    requestLineageLabel: "Minor skin condition referral / lineage 2048",
    chosenProviderLabel: "No pharmacy chosen yet",
    chosenProviderSummary:
      "The chooser keeps the current provider context visible even before a final pharmacy is selected.",
    continuityKey: "pharmacy.patient::PHC-2048::north-quay",
    providerStateLabel: "Choice pending",
    shellSummary:
      "The patient pharmacy shell keeps provider choice, instructions, and status in one calm request frame, with the full visible pharmacy set and the current request anchor held together.",
    nextStepSummary:
      "Select a pharmacy from the current proof, then move to the next checkpoint without losing the request anchor.",
    checkpointSummary:
      "The visible pharmacy set, current filter, and request lineage stay in the same shell continuity key.",
    dominantActionLabel: "Choose one pharmacy from the current list and continue in the same shell",
    recoveryPosture: "live",
    routeEyebrow: {
      choose: "Provider choice",
      instructions: "What happens next",
      status: "Status tracker",
    },
    routeHeading: {
      choose: "Choose a pharmacy that works for you",
      instructions: "Keep the next steps in view",
      status: "Check the current pharmacy status",
    },
    routeSummary: {
      choose:
        "The chooser keeps the full valid set visible, explains warnings in place, and preserves the same request shell while you compare options.",
      instructions:
        "Instructions stay bounded to the same provider and request lineage while later tasks fill richer content into this host region.",
      status:
        "Status remains a shell child route; it does not become a generic booking or appointment page.",
    },
  },
  {
    pharmacyCaseId: "PHC-2057",
    requestLineageLabel: "Acute cough pathway / lineage 2057",
    chosenProviderLabel: "Harbour Pharmacy Group",
    chosenProviderSummary:
      "Proof is still pending, so the shell stays informative and does not overclaim confirmation.",
    continuityKey: "pharmacy.patient::PHC-2057::harbour",
    providerStateLabel: "Dispatch pending",
    shellSummary:
      "The patient shell stays calm while external dispatch or confirmation is still pending, keeping the provider anchor visible instead of falling back to generic holding text.",
    nextStepSummary:
      "The shell preserves the provider choice and next-step wording while confirmation is still converging.",
    checkpointSummary:
      "The current checkpoint is pending confirmation, so the shell reads as guided but not complete.",
    dominantActionLabel: "Keep the chosen pharmacy visible while confirmation is pending",
    recoveryPosture: "read_only",
    routeEyebrow: {
      choose: "Provider review",
      instructions: "Pending confirmation",
      status: "Pending status",
    },
    routeHeading: {
      choose: "Your chosen pharmacy is still current",
      instructions: "What to expect while confirmation is pending",
      status: "Status is still provisional",
    },
    routeSummary: {
      choose:
        "The shell protects the chosen provider anchor even while downstream confirmation is still pending.",
      instructions:
        "This host region stays structurally ready for later dispatch-specific instruction content without changing shells.",
      status:
        "Status remains explicit about pending confirmation and does not collapse into quiet success wording.",
    },
  },
  {
    pharmacyCaseId: "PHC-2090",
    requestLineageLabel: "Pharmacy suitability review / lineage 2090",
    chosenProviderLabel: "Practice review route",
    chosenProviderSummary:
      "The request stays in the same shell even though pharmacy is not the safest next step.",
    continuityKey: "pharmacy.patient::PHC-2090::practice-return",
    providerStateLabel: "Returned to practice review",
    shellSummary:
      "This request stays in the pharmacy shell long enough to explain why pharmacy is not suitable and to keep one clear next step visible without generic rejection copy.",
    nextStepSummary:
      "Review the short next-step state, then continue to the return instructions without losing the current request anchor.",
    checkpointSummary:
      "The same request shell now points to a practice review route instead of a pharmacy route.",
    dominantActionLabel: "Review the next safe step for this request",
    recoveryPosture: "live",
    routeEyebrow: {
      choose: "Eligibility outcome",
      instructions: "Next safe step",
      status: "Return status",
    },
    routeHeading: {
      choose: "Pharmacy is not the safest next step",
      instructions: "What to do next for this request",
      status: "This request is being returned for review",
    },
    routeSummary: {
      choose:
        "The patient stays inside the same request shell while the unsuitable-return state explains the route change in clear, patient-safe wording.",
      instructions:
        "The next-step panel keeps one obvious action visible and avoids internal rule jargon.",
      status:
        "Return posture remains explicit and calm, without turning this request into a dead-end or a generic rejection banner.",
    },
  },
  {
    pharmacyCaseId: "PHC-2148",
    requestLineageLabel: "Same-day sore throat referral / lineage 2148",
    chosenProviderLabel: "Market Square Pharmacy",
    chosenProviderSummary:
      "The selected pharmacy is still valid, but this route must keep the warning visible until the patient acknowledges it in place.",
    continuityKey: "pharmacy.patient::PHC-2148::market-square",
    providerStateLabel: "Warned choice",
    shellSummary:
      "This chooser state keeps the selected pharmacy, the recommended alternative, and the warning acknowledgement in one shell instead of splitting them across detached steps.",
    nextStepSummary:
      "Acknowledge the current warning or change pharmacy without losing the request lineage.",
    checkpointSummary:
      "The chosen pharmacy is still in the visible proof, but the consent checkpoint is paused until the warning is acknowledged.",
    dominantActionLabel: "Acknowledge the selected warning or switch to another valid pharmacy",
    recoveryPosture: "live",
    routeEyebrow: {
      choose: "Warned provider choice",
      instructions: "Next step",
      status: "Status tracker",
    },
    routeHeading: {
      choose: "Review this warned pharmacy choice",
      instructions: "Keep the next steps in view",
      status: "Check the current pharmacy status",
    },
    routeSummary: {
      choose:
        "This choose route keeps the full ranked set visible while the selected pharmacy still needs an explicit acknowledgement before consent can advance.",
      instructions:
        "Instructions remain a later child route of the same pharmacy shell.",
      status:
        "Status remains route-bound to the same request lineage and chosen provider anchor.",
    },
  },
  {
    pharmacyCaseId: "PHC-2156",
    requestLineageLabel: "Provider refresh review / lineage 2156",
    chosenProviderLabel: "Hilltop Pharmacy (previous)",
    chosenProviderSummary:
      "The earlier selection is preserved as read-only provenance while the refreshed choice set asks for a current selection.",
    continuityKey: "pharmacy.patient::PHC-2156::proof-refresh",
    providerStateLabel: "Proof refreshed",
    shellSummary:
      "The pharmacy chooser recovers in place when the visible proof changes, preserving the previous selection as provenance instead of silently replacing it.",
    nextStepSummary:
      "Review the updated choice set, keep the old selection visible as provenance, and choose a current pharmacy from the refreshed proof.",
    checkpointSummary:
      "The previous pharmacy is preserved for provenance only. A current choice is still required before the next checkpoint.",
    dominantActionLabel: "Review the updated list and choose a current pharmacy",
    recoveryPosture: "read_only",
    routeEyebrow: {
      choose: "Proof refresh",
      instructions: "Next step",
      status: "Status tracker",
    },
    routeHeading: {
      choose: "The pharmacy list changed",
      instructions: "Keep the next steps in view",
      status: "Check the current pharmacy status",
    },
    routeSummary: {
      choose:
        "This choose route keeps the refreshed choice proof and the previous selection visible together so the patient can recover without losing context.",
      instructions:
        "Instructions stay in the same shell once a current provider is selected from the refreshed proof.",
      status:
        "Status stays explicit about the refreshed choice posture and does not imply completion.",
    },
  },
  {
    pharmacyCaseId: "PHC-2103",
    requestLineageLabel: "Chest infection urgent pathway / lineage 2103",
    chosenProviderLabel: "Riverside Pharmacy",
    chosenProviderSummary:
      "Urgent return has reopened the case for safety, so the shell stays visibly non-calm.",
    continuityKey: "pharmacy.patient::PHC-2103::riverside",
    providerStateLabel: "Urgent return",
    shellSummary:
      "Reopen and return posture remain inside the patient shell so safety recovery does not strand the person on a detached page.",
    nextStepSummary:
      "The shell keeps the same provider anchor and request lineage visible while the return path is reviewed.",
    checkpointSummary:
      "Current status has reopened for safety and must not look completed.",
    dominantActionLabel: "Review the recovery message and next safe step",
    recoveryPosture: "recovery_only",
    routeEyebrow: {
      choose: "Provider anchor",
      instructions: "Recovery instructions",
      status: "Recovery status",
    },
    routeHeading: {
      choose: "Your provider anchor is preserved",
      instructions: "Why the next step has changed",
      status: "This pharmacy request is being reviewed",
    },
    routeSummary: {
      choose:
        "Even in recovery posture the shell preserves the same provider and request anchor instead of dropping the patient into a blank recovery page.",
      instructions:
        "Recovery instructions are explicit, bounded, and ready for later task-specific content.",
      status:
        "The recovery strip is dominant because the current posture is non-calm and still under review.",
    },
  },
  {
    pharmacyCaseId: "PHC-2184",
    requestLineageLabel: "Same-day sore throat referral / lineage 2184",
    chosenProviderLabel: "Cedar Pharmacy",
    chosenProviderSummary:
      "The referral has been sent to the chosen pharmacy, and the same shell now keeps the next step, contact details, and reference together.",
    continuityKey: "pharmacy.patient::PHC-2184::cedar",
    providerStateLabel: "Referral sent",
    shellSummary:
      "This patient shell keeps referral confirmation, next-step guidance, contact details, and status in one pharmacy request frame without turning into generic appointment copy.",
    nextStepSummary:
      "Check what happens next, keep the reference available, and return here for status updates from the pharmacy route.",
    checkpointSummary:
      "The referral has reached the chosen pharmacy. Status now tracks progress without implying the clinical outcome is finished.",
    dominantActionLabel: "Keep the next step and referral status in view",
    recoveryPosture: "live",
    routeEyebrow: {
      choose: "Provider anchor",
      instructions: "Referral confirmation",
      status: "Status tracker",
    },
    routeHeading: {
      choose: "Your chosen pharmacy is kept in view",
      instructions: "What happens next with Cedar Pharmacy",
      status: "Track the current pharmacy status",
    },
    routeSummary: {
      choose:
        "The chosen pharmacy stays visible while instructions and status remain child routes of the same shell.",
      instructions:
        "The referral confirmation, next step, contact details, and reference stay together on this route.",
      status:
        "Status shows where the referral is now without reading like a booked appointment or a final outcome.",
    },
  },
  {
    pharmacyCaseId: "PHC-2188",
    requestLineageLabel: "Sinusitis referral / lineage 2188",
    chosenProviderLabel: "Harbour Pharmacy Group",
    chosenProviderSummary:
      "The chosen pharmacy stays visible while the contact route is repaired inside the same request shell.",
    continuityKey: "pharmacy.patient::PHC-2188::contact-repair",
    providerStateLabel: "Contact route repair",
    shellSummary:
      "This route keeps pharmacy context visible while a broken contact route is repaired, instead of sending the patient into a detached recovery flow.",
    nextStepSummary:
      "Complete the contact repair step, keep the chosen pharmacy in view, and then return to the status route for the next update.",
    checkpointSummary:
      "The pharmacy route is paused for contact-route repair, so routine progress wording stays blocked.",
    dominantActionLabel: "Repair the contact route and return to the pharmacy status",
    recoveryPosture: "read_only",
    routeEyebrow: {
      choose: "Provider anchor",
      instructions: "Contact route repair",
      status: "Repair status",
    },
    routeHeading: {
      choose: "The chosen pharmacy stays visible",
      instructions: "Update or confirm how we can contact you",
      status: "Track the contact repair state",
    },
    routeSummary: {
      choose:
        "The chosen pharmacy remains visible while the contact route is repaired inside the same shell.",
      instructions:
        "The repair state explains what to do next without hiding the current provider or referral reference.",
      status:
        "Status keeps the repair step explicit so the route does not read like normal pharmacy progress.",
    },
  },
  {
    pharmacyCaseId: "PHC-2196",
    requestLineageLabel: "UTI pathway referral / lineage 2196",
    chosenProviderLabel: "North Bank Pharmacy",
    chosenProviderSummary:
      "The completed referral stays visible here as a patient-safe record of the outcome and the pharmacy that handled it.",
    continuityKey: "pharmacy.patient::PHC-2196::north-bank",
    providerStateLabel: "Outcome recorded",
    shellSummary:
      "This shell keeps the completed pharmacy outcome inside the same request family, with the provider anchor and status history still visible.",
    nextStepSummary:
      "Review the completed status and keep the referral reference in case you need it later.",
    checkpointSummary:
      "The referral outcome is recorded, so calm completion wording is lawful on this route.",
    dominantActionLabel: "Review the completed referral outcome",
    recoveryPosture: "live",
    routeEyebrow: {
      choose: "Provider anchor",
      instructions: "Completed referral",
      status: "Outcome recorded",
    },
    routeHeading: {
      choose: "The chosen pharmacy remains on the record",
      instructions: "The referral outcome is recorded",
      status: "Review the completed referral status",
    },
    routeSummary: {
      choose:
        "The provider anchor remains visible as part of the completed referral record.",
      instructions:
        "Instructions now act as a calm record of the completed outcome instead of a pending task page.",
      status:
        "Status shows the completed referral history without turning into generic booking language.",
    },
  },
] as const;

const patientPharmacyCaseMap = new Map(
  patientPharmacyCases.map((caseSeed) => [caseSeed.pharmacyCaseId, caseSeed] as const),
);

export function resolvePatientPharmacyPath(
  pharmacyCaseId: string,
  routeKey: PatientPharmacyRouteKey,
): string {
  return `/pharmacy/${pharmacyCaseId}/${routeKey}`;
}

export function parsePatientPharmacyPath(pathname: string): PatientPharmacyLocation | null {
  const match = pathname.match(/^\/pharmacy\/([^/]+)\/(choose|instructions|status)$/);
  if (!match) {
    return null;
  }
  return {
    pathname: resolvePatientPharmacyPath(
      match[1]!,
      match[2]! as PatientPharmacyRouteKey,
    ),
    pharmacyCaseId: match[1]!,
    routeKey: match[2]! as PatientPharmacyRouteKey,
  };
}

export function isPatientPharmacyShellPath(pathname: string): boolean {
  return parsePatientPharmacyPath(pathname) !== null;
}

export function caseForPatientPharmacyId(
  pharmacyCaseId: string | null | undefined,
): PatientPharmacyCaseSeed {
  return patientPharmacyCaseMap.get(pharmacyCaseId ?? "") ?? patientPharmacyCases[0]!;
}

export function createInitialPatientPharmacyShellState(
  pathname = PATIENT_PHARMACY_DEFAULT_PATH,
): PatientPharmacyShellState {
  return {
    location: parsePatientPharmacyPath(pathname) ??
      parsePatientPharmacyPath(PATIENT_PHARMACY_DEFAULT_PATH)!,
  };
}

export function navigatePatientPharmacyShell(
  state: PatientPharmacyShellState,
  pathname: string,
): PatientPharmacyShellState {
  const location = parsePatientPharmacyPath(pathname);
  if (!location) {
    return state;
  }
  return { location };
}

export function resolvePatientPharmacyShellSnapshot(
  state: PatientPharmacyShellState,
  viewportWidth: number,
): PatientPharmacyShellSnapshot {
  const currentCase = caseForPatientPharmacyId(state.location.pharmacyCaseId);
  const layoutMode: PatientPharmacyLayoutMode = viewportWidth < 960 ? "mission_stack" : "two_plane";
  const breakpointClass = viewportWidth < 720 ? "compact" : layoutMode === "mission_stack" ? "narrow" : "wide";
  const checkpointId =
    state.location.routeKey === "choose"
      ? "consent"
      : state.location.routeKey === "instructions"
        ? "dispatch"
        : "outcome";
  const promotedSupportRegion =
    state.location.routeKey === "choose"
      ? "provider_anchor"
      : state.location.routeKey === "instructions"
        ? "timeline_support"
        : "status_recovery";
  return {
    location: state.location,
    currentCase,
    layoutMode,
    breakpointClass,
    promotedSupportRegion,
    checkpointId,
  };
}
