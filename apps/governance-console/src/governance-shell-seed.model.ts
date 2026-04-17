import {
  acknowledgeSelectedAnchorReplacement,
  createInitialContinuitySnapshot,
  invalidateSelectedAnchor,
  selectAnchorInSnapshot,
  type ContinuitySnapshot,
  type RuntimeScenario,
} from "@vecells/persistent-shell";

export const GOVERNANCE_SHELL_TASK_ID = "par_119";
export const GOVERNANCE_SHELL_VISUAL_MODE = "Governance_Shell_Seed_Routes";
export const GOVERNANCE_DEFAULT_PATH = "/ops/governance";
export const GOVERNANCE_SHELL_SLUG = "governance-console";

export type GovernanceCluster = "governance" | "access" | "config" | "comms" | "release";
export type GovernanceRouteKey =
  | "governance_home"
  | "governance_tenants"
  | "governance_authority_links"
  | "governance_compliance"
  | "governance_records"
  | "access_home"
  | "access_users"
  | "access_roles"
  | "access_reviews"
  | "config_home"
  | "config_bundles"
  | "config_promotions"
  | "comms_home"
  | "comms_templates"
  | "release_home";
export type GovernanceSupportRegion = "impact" | "approval" | "evidence" | "release" | "access";
export type GovernanceCenterPaneMode = "overview" | "matrix" | "detail" | "diff" | "review";
export type GovernanceFreezeDisposition =
  | "writable"
  | "review_only"
  | "scope_drift"
  | "freeze_conflict";
export type GovernanceLayoutMode = "two_plane" | "three_plane" | "mission_stack";
export type GovernanceReviewStage = "scope" | "diff" | "approval";
export type GovernanceRecoveryPosture = "live" | "read_only" | "recovery_only" | "blocked";
export type GovernanceVisualizationAuthority = "visual_table_summary" | "summary_only";
export type GovernanceTelemetryEventClass =
  | "surface_enter"
  | "selected_anchor_changed"
  | "dominant_action_changed"
  | "review_state_changed"
  | "scope_state_changed";

export interface GovernanceLocation {
  pathname: string;
  routeKey: GovernanceRouteKey;
  cluster: GovernanceCluster;
  routeFamilyRef: "rf_governance_shell";
  sectionLabel: string;
  title: string;
  summary: string;
  anchorKey: "governance-scope" | "governance-diff" | "governance-approval";
  supportRegion: GovernanceSupportRegion;
  centerPaneMode: GovernanceCenterPaneMode;
  reviewStage: GovernanceReviewStage;
  primaryActionLabel: string;
  calmNextStep: string;
  defaultObjectId: string;
}

export interface GovernanceObjectRow {
  objectId: string;
  label: string;
  kind: string;
  summary: string;
  statusTone: "info" | "caution" | "critical" | "success";
  baselineLabel: string;
  ownerLabel: string;
  approvalBurden: string;
  evidenceAge: string;
  nextSafeAction: string;
  gapRefs: readonly string[];
}

export interface GovernanceScopeToken {
  scopeTokenId: string;
  tenantLabel: string;
  organisationLabel: string;
  environmentLabel: string;
  purposeLabel: string;
  reviewContextLabel: string;
  changeLabel: string;
  watchLabel: string;
  freezeLabel: string;
  writeStateLabel: string;
  driftSummary: string;
  standardsVersion: string;
  gapRefs: readonly string[];
}

export interface GovernanceImpactItem {
  impactId: string;
  title: string;
  effectLabel: string;
  summary: string;
}

export interface GovernanceApprovalStep {
  stepId: string;
  label: string;
  state: "settled" | "pending" | "blocked";
  evidence: string;
}

export interface GovernanceEvidenceRow {
  controlId: string;
  title: string;
  owner: string;
  evidenceAge: string;
  status: "attested" | "missing" | "expiring" | "exception";
  mitigation: string;
}

export interface GovernanceReleaseTuple {
  releaseTupleId: string;
  freezeLabel: string;
  publicationState: string;
  watchState: string;
  compatibilityState: string;
  continuityImpactLabel: string;
  blastRadiusLabel: string;
}

export interface GovernanceReturnIntentToken {
  tokenId: string;
  originPath: string;
  originObjectId: string;
  issuedAt: string;
  label: string;
}

export interface GovernanceTelemetryEvent {
  eventId: string;
  eventClass: GovernanceTelemetryEventClass;
  eventName: string;
  summary: string;
  payload: Readonly<Record<string, string>>;
}

export interface GovernanceShellState {
  location: GovernanceLocation;
  selectedObjectId: string;
  supportRegion: GovernanceSupportRegion;
  freezeDisposition: GovernanceFreezeDisposition;
  continuitySnapshot: ContinuitySnapshot;
  returnIntent: GovernanceReturnIntentToken | null;
  telemetry: readonly GovernanceTelemetryEvent[];
}

export interface GovernanceShellSnapshot {
  location: GovernanceLocation;
  selectedObject: GovernanceObjectRow;
  objectRows: readonly GovernanceObjectRow[];
  scopeToken: GovernanceScopeToken;
  supportRegion: GovernanceSupportRegion;
  freezeDisposition: GovernanceFreezeDisposition;
  approvalSteps: readonly GovernanceApprovalStep[];
  evidenceRows: readonly GovernanceEvidenceRow[];
  impactItems: readonly GovernanceImpactItem[];
  releaseTuple: GovernanceReleaseTuple;
  layoutMode: GovernanceLayoutMode;
  recoveryPosture: GovernanceRecoveryPosture;
  visualizationAuthority: GovernanceVisualizationAuthority;
  artifactModeState: string;
  reviewHeadline: string;
  supportHeadline: string;
  supportSummary: string;
  hasPendingReplacement: boolean;
}

export interface GovernanceMockProjectionExample {
  exampleId: string;
  path: string;
  freezeDisposition: GovernanceFreezeDisposition;
  supportRegion: GovernanceSupportRegion;
  summary: string;
  selectedObjectId: string;
}

export interface GovernanceRouteContractSeedRow {
  path: string;
  cluster: GovernanceCluster;
  routeKey: GovernanceRouteKey;
  continuityKey: string;
  selectedAnchorPolicy: string;
  summary: string;
}

type GovernanceRouteDefinition = GovernanceLocation;

const configRows = [
  {
    objectId: "bundle-routing-core-v7",
    label: "Routing core bundle v7",
    kind: "Policy bundle",
    summary:
      "Narrows callback fallback and release gating without widening any patient-visible actionability.",
    statusTone: "caution",
    baselineLabel: "Baseline 2026.04.12.2",
    ownerLabel: "Platform governance",
    approvalBurden: "Independent release + continuity bundle",
    evidenceAge: "17m",
    nextSafeAction: "Review the affected routes and confirm the fallback tuple remains exact.",
    gapRefs: ["GAP_APPROVAL_TUPLE_DETAIL_RELEASE_WATCH_V1"],
  },
  {
    objectId: "bundle-access-review-v4",
    label: "Access review cadence v4",
    kind: "Review bundle",
    summary:
      "Extends recertification timing while preserving break-glass follow-up and expiry burden.",
    statusTone: "info",
    baselineLabel: "Baseline 2026.04.11.5",
    ownerLabel: "Identity governance",
    approvalBurden: "Access reviewer + compliance officer",
    evidenceAge: "25m",
    nextSafeAction: "Check the effective access preview before widening any recertification window.",
    gapRefs: ["GAP_SCOPE_TOKEN_DETAIL_ACCESS_PREVIEW_V1"],
  },
  {
    objectId: "bundle-records-disposition-v3",
    label: "Records disposition policy v3",
    kind: "Lifecycle bundle",
    summary:
      "Moves archive-only posture earlier for preserved artifacts while keeping delete-ready posture blocked.",
    statusTone: "critical",
    baselineLabel: "Baseline 2026.04.10.8",
    ownerLabel: "Records governance",
    approvalBurden: "Compliance + no-self-approval signoff",
    evidenceAge: "41m",
    nextSafeAction: "Compare lifecycle evidence before releasing any retention freeze.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_RECORDS_DISPOSITION_V1"],
  },
] as const satisfies readonly GovernanceObjectRow[];

const tenantRows = [
  {
    objectId: "tenant-north-river",
    label: "North River ICS",
    kind: "Tenant matrix",
    summary:
      "Messaging, access review, and release watch posture are aligned but one comms exemption remains draft-only.",
    statusTone: "caution",
    baselineLabel: "Live config 2026.04.13.1",
    ownerLabel: "Tenant governance lead",
    approvalBurden: "Tenant admin + release manager",
    evidenceAge: "14m",
    nextSafeAction: "Open the draft row and verify the exemption reason code.",
    gapRefs: ["GAP_SCOPE_TOKEN_DETAIL_TENANT_OVERRIDE_REASON_V1"],
  },
  {
    objectId: "tenant-city-east",
    label: "City East Partnership",
    kind: "Tenant matrix",
    summary:
      "Authority links are stable, but release watch remains buffered because a dependency watchlist exception is still active.",
    statusTone: "critical",
    baselineLabel: "Live config 2026.04.12.4",
    ownerLabel: "Regional governance lead",
    approvalBurden: "Independent release review",
    evidenceAge: "7m",
    nextSafeAction: "Inspect the release tuple before promoting the staged tenant diff.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_DEPENDENCY_WATCH_V1"],
  },
  {
    objectId: "tenant-harbour-west",
    label: "Harbour West Network",
    kind: "Tenant matrix",
    summary:
      "Quiet state: inherited policy, live values, and draft values are all aligned for the current review scope.",
    statusTone: "success",
    baselineLabel: "Live config 2026.04.13.0",
    ownerLabel: "Platform governance",
    approvalBurden: "Review-only observe",
    evidenceAge: "11m",
    nextSafeAction: "Inspect a recent promotion or review the calm governance home state.",
    gapRefs: [],
  },
] as const satisfies readonly GovernanceObjectRow[];

const authorityRows = [
  {
    objectId: "authority-london-cover",
    label: "London out-of-area cover",
    kind: "Authority link",
    summary:
      "Delegation overlaps with an expiring support coverage link and requires overlap review before save.",
    statusTone: "critical",
    baselineLabel: "Authority snapshot 2281",
    ownerLabel: "Organisation authority admin",
    approvalBurden: "High-risk link approval",
    evidenceAge: "32m",
    nextSafeAction: "Preview overlap and orphan-risk before retiring the link.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_AUTHORITY_GRAPH_V1"],
  },
  {
    objectId: "authority-north-clinical-bridge",
    label: "North clinical bridge",
    kind: "Authority link",
    summary:
      "Coverage relationship is healthy, but a purpose-of-use drift record would freeze edits immediately.",
    statusTone: "info",
    baselineLabel: "Authority snapshot 2279",
    ownerLabel: "Access reviewer",
    approvalBurden: "Review before widen",
    evidenceAge: "18m",
    nextSafeAction: "Check the purpose-of-use tuple and expiry burden before widening access.",
    gapRefs: ["GAP_SCOPE_TOKEN_DETAIL_PURPOSE_BINDING_V1"],
  },
  {
    objectId: "authority-south-pharmacy-link",
    label: "South pharmacy continuity link",
    kind: "Authority link",
    summary:
      "Read-only until paired pharmacy routing evidence is refreshed from the same baseline snapshot.",
    statusTone: "caution",
    baselineLabel: "Authority snapshot 2273",
    ownerLabel: "Compliance officer",
    approvalBurden: "Read-only preserve",
    evidenceAge: "54m",
    nextSafeAction: "Keep the current link visible and request a refreshed evidence bundle.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_CROSS_SHELL_AUTHORITY_V1"],
  },
] as const satisfies readonly GovernanceObjectRow[];

const complianceRows = [
  {
    objectId: "control-dspt-3-2",
    label: "DSPT 3.2 continuity attestation",
    kind: "Compliance control",
    summary:
      "Patient-home and workspace continuity evidence is present, but the release-watch pack is still one attestation short.",
    statusTone: "critical",
    baselineLabel: "Control pack 2026.04.13.3",
    ownerLabel: "Compliance officer",
    approvalBurden: "Independent attestation required",
    evidenceAge: "9m",
    nextSafeAction: "Open the evidence bundle and confirm the missing attestation owner.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_ATTESTATION_EXPORT_V1"],
  },
  {
    objectId: "control-dcb0129-release",
    label: "DCB0129 release-risk bundle",
    kind: "Compliance control",
    summary:
      "The hazard-control links are current, but promotion remains review-only until the watch tuple settles.",
    statusTone: "caution",
    baselineLabel: "Hazard pack 2026.04.12.9",
    ownerLabel: "Clinical safety officer",
    approvalBurden: "No-self-approval + release manager",
    evidenceAge: "26m",
    nextSafeAction: "Keep the release tuple pinned and wait for the same watch package to settle.",
    gapRefs: ["GAP_APPROVAL_TUPLE_DETAIL_CLINICAL_SAFETY_RELEASE_V1"],
  },
  {
    objectId: "control-retention-immutability",
    label: "Retention immutability witness",
    kind: "Compliance control",
    summary:
      "Archive and delete posture remain exact, but one lifecycle exception is due for mitigation review.",
    statusTone: "info",
    baselineLabel: "WORM witness 2026.04.11.6",
    ownerLabel: "Records governance",
    approvalBurden: "Exception review",
    evidenceAge: "39m",
    nextSafeAction: "Review the linked exception and confirm the mitigation deadline.",
    gapRefs: [],
  },
] as const satisfies readonly GovernanceObjectRow[];

const recordsRows = [
  {
    objectId: "records-hold-09",
    label: "Retention hold H-09",
    kind: "Legal hold",
    summary:
      "Hold release is blocked until the superseding disposition assessment and assurance graph complete the same scope.",
    statusTone: "critical",
    baselineLabel: "Hold scope hash 9A2B",
    ownerLabel: "Records governance",
    approvalBurden: "Compliance + legal release review",
    evidenceAge: "13m",
    nextSafeAction: "Keep the selected hold pinned and refresh the dependency graph first.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_RECORDS_HOLD_EXPORT_V1"],
  },
  {
    objectId: "records-freeze-archive-14",
    label: "Archive freeze AF-14",
    kind: "Retention freeze",
    summary:
      "Archive-only posture is exact; delete-ready controls remain correctly suppressed.",
    statusTone: "success",
    baselineLabel: "Freeze scope hash 14C7",
    ownerLabel: "Compliance officer",
    approvalBurden: "Observe only",
    evidenceAge: "21m",
    nextSafeAction: "Inspect the archive manifest or move to the compliance evidence lane.",
    gapRefs: [],
  },
  {
    objectId: "records-disposition-31",
    label: "Disposition preview D-31",
    kind: "Disposition job",
    summary:
      "Candidate rows are present, but one dependency witness keeps the job in review-only posture.",
    statusTone: "caution",
    baselineLabel: "Disposition batch 31",
    ownerLabel: "Platform governance",
    approvalBurden: "Review-only until dependency graph refresh",
    evidenceAge: "47m",
    nextSafeAction: "Open the dependency witness instead of arming the job.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_DISPOSITION_JOB_EXECUTION_V1"],
  },
] as const satisfies readonly GovernanceObjectRow[];

const accessUserRows = [
  {
    objectId: "user-asha-patel",
    label: "Asha Patel",
    kind: "User access package",
    summary:
      "Inherited grants and temporary elevation remain visible together; one expiry boundary is inside the next 18 hours.",
    statusTone: "caution",
    baselineLabel: "Grant bundle A-14",
    ownerLabel: "Access reviewer",
    approvalBurden: "Two-person expiry review",
    evidenceAge: "16m",
    nextSafeAction: "Inspect the preview lane before narrowing or extending the grant.",
    gapRefs: ["GAP_SCOPE_TOKEN_DETAIL_ELEVATION_PREVIEW_V1"],
  },
  {
    objectId: "user-omar-ellis",
    label: "Omar Ellis",
    kind: "User access package",
    summary:
      "Break-glass history is quiet, but the current review still requires the same scope tuple to stay pinned.",
    statusTone: "info",
    baselineLabel: "Grant bundle A-09",
    ownerLabel: "Security responder",
    approvalBurden: "Access review only",
    evidenceAge: "24m",
    nextSafeAction: "Confirm the subject, capability, scope, condition, and expiry grammar.",
    gapRefs: [],
  },
  {
    objectId: "user-miriam-cross",
    label: "Miriam Cross",
    kind: "User access package",
    summary:
      "Role and tenant bindings are aligned, but a comms governance role remains pending publication parity.",
    statusTone: "critical",
    baselineLabel: "Grant bundle A-21",
    ownerLabel: "Tenant governance admin",
    approvalBurden: "Publication parity review",
    evidenceAge: "33m",
    nextSafeAction: "Freeze edits and revalidate runtime publication state first.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_PUBLICATION_PARITY_REBIND_V1"],
  },
] as const satisfies readonly GovernanceObjectRow[];

const accessRoleRows = [
  {
    objectId: "role-clinical-reviewer",
    label: "Clinical reviewer",
    kind: "Role scope studio",
    summary:
      "Capability, scope, condition, and expiry remain operationally legible, with one temporary widening under review.",
    statusTone: "info",
    baselineLabel: "Role package R-31",
    ownerLabel: "Identity governance",
    approvalBurden: "Role review + effective preview",
    evidenceAge: "12m",
    nextSafeAction: "Keep EffectiveAccessPreview visible before editing the temporary widening.",
    gapRefs: [],
  },
  {
    objectId: "role-network-coordinator",
    label: "Network coordinator",
    kind: "Role scope studio",
    summary:
      "Cross-organisation visibility is draft-only until the authority-link overlap review is acknowledged.",
    statusTone: "caution",
    baselineLabel: "Role package R-28",
    ownerLabel: "Organisation authority admin",
    approvalBurden: "Authority overlap review",
    evidenceAge: "19m",
    nextSafeAction: "Open the authority map and confirm the dependent grants.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_ROLE_AUTHORITY_DEPENDENCY_V1"],
  },
  {
    objectId: "role-release-manager",
    label: "Release manager",
    kind: "Role scope studio",
    summary:
      "Promotion and rollback visibility remain exact; one dual-read route posture keeps the role in read-only preserve.",
    statusTone: "critical",
    baselineLabel: "Role package R-11",
    ownerLabel: "Platform governance",
    approvalBurden: "Release tuple review",
    evidenceAge: "29m",
    nextSafeAction: "Inspect the release lane before widening publication authority.",
    gapRefs: ["GAP_APPROVAL_TUPLE_DETAIL_RELEASE_ROLE_SCOPE_V1"],
  },
] as const satisfies readonly GovernanceObjectRow[];

const accessReviewRows = [
  {
    objectId: "review-breakglass-021",
    label: "Break-glass review BG-021",
    kind: "Access review",
    summary:
      "Visibility widening is explicit, but settlement remains pending until the same investigation scope and timeline hash revalidate.",
    statusTone: "critical",
    baselineLabel: "Review package BG-021",
    ownerLabel: "Security responder",
    approvalBurden: "Independent reviewer required",
    evidenceAge: "5m",
    nextSafeAction: "Acknowledge the promoted review before narrowing or denying the request.",
    gapRefs: ["GAP_APPROVAL_TUPLE_DETAIL_BREAK_GLASS_REVIEW_V1"],
  },
  {
    objectId: "review-recertification-118",
    label: "Quarterly recertification RC-118",
    kind: "Access review",
    summary:
      "The affected scope and expiry boundary remain stable; only one fallback role is still awaiting evidence.",
    statusTone: "caution",
    baselineLabel: "Review package RC-118",
    ownerLabel: "Access reviewer",
    approvalBurden: "Review-only until evidence bundle settles",
    evidenceAge: "18m",
    nextSafeAction: "Keep the impact preview and approval rail visible together.",
    gapRefs: [],
  },
  {
    objectId: "review-elevation-045",
    label: "JIT elevation JIT-045",
    kind: "Access review",
    summary:
      "The same shell preserves the requesting context, but the watch tuple now forces recovery-only review.",
    statusTone: "critical",
    baselineLabel: "Review package JIT-045",
    ownerLabel: "Tenant governance admin",
    approvalBurden: "Recovery-only release watch",
    evidenceAge: "42m",
    nextSafeAction: "Revalidate the scope and watch tuple before approving anything else.",
    gapRefs: ["GAP_SCOPE_TOKEN_DETAIL_ELEVATION_RECOVERY_V1"],
  },
] as const satisfies readonly GovernanceObjectRow[];

const commsRows = [
  {
    objectId: "template-reminders-v12",
    label: "Reminder template set v12",
    kind: "Template set",
    summary:
      "Draft and live copy are aligned, but the fallback branch remains pending quiet-hours review.",
    statusTone: "caution",
    baselineLabel: "Template pack T-12",
    ownerLabel: "Communications governance",
    approvalBurden: "Template review + channel freeze check",
    evidenceAge: "10m",
    nextSafeAction: "Inspect the fallback branch before promoting the draft.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_TEMPLATE_FALLBACK_MATRIX_V1"],
  },
  {
    objectId: "template-callback-escalation-v6",
    label: "Callback escalation template v6",
    kind: "Template set",
    summary:
      "Localization coverage is exact, but one tenant exemption remains review-only until approval settles.",
    statusTone: "info",
    baselineLabel: "Template pack T-09",
    ownerLabel: "Tenant governance admin",
    approvalBurden: "Approval stepper required",
    evidenceAge: "27m",
    nextSafeAction: "Keep live, draft, and scheduled posture visible together.",
    gapRefs: [],
  },
  {
    objectId: "template-release-watch-v3",
    label: "Release watch comms bundle v3",
    kind: "Template set",
    summary:
      "The runtime publication state drifted after the draft opened, so promotion is now frozen in place.",
    statusTone: "critical",
    baselineLabel: "Template pack T-03",
    ownerLabel: "Release manager",
    approvalBurden: "Publication parity revalidation",
    evidenceAge: "35m",
    nextSafeAction: "Keep the draft visible and revalidate the same publication tuple.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_TEMPLATE_PUBLICATION_REBIND_V1"],
  },
] as const satisfies readonly GovernanceObjectRow[];

const releaseRows = [
  {
    objectId: "release-wave-blue-42",
    label: "Blue wave 42",
    kind: "Release tuple",
    summary:
      "Compile, compatibility, and continuity bundles agree, but the watch cockpit still shows one buffered rollback question.",
    statusTone: "caution",
    baselineLabel: "Release package W42",
    ownerLabel: "Release manager",
    approvalBurden: "Independent promotion + watch review",
    evidenceAge: "8m",
    nextSafeAction: "Keep the ReleaseFreezeTupleCard pinned until watch posture settles.",
    gapRefs: ["GAP_APPROVAL_TUPLE_DETAIL_ROLLBACK_WATCH_V1"],
  },
  {
    objectId: "release-wave-amber-12",
    label: "Amber wave 12",
    kind: "Release tuple",
    summary:
      "One recovery disposition is active and correctly suppresses widen and stabilize controls in place.",
    statusTone: "critical",
    baselineLabel: "Release package A12",
    ownerLabel: "Platform governance",
    approvalBurden: "Recovery-only observe",
    evidenceAge: "3m",
    nextSafeAction: "Stay in the same shell and review the recovery tuple, not a generic rollout board.",
    gapRefs: ["GAP_FUTURE_GOVERNANCE_DEPTH_RELEASE_RECOVERY_EVIDENCE_V1"],
  },
  {
    objectId: "release-wave-green-05",
    label: "Green wave 05",
    kind: "Release tuple",
    summary:
      "Quiet state with attested completion, current standards watchlist, and no active freeze conflicts.",
    statusTone: "success",
    baselineLabel: "Release package G05",
    ownerLabel: "Compliance officer",
    approvalBurden: "Observe only",
    evidenceAge: "22m",
    nextSafeAction: "Review recent promotions or inspect a calm governance home state.",
    gapRefs: [],
  },
] as const satisfies readonly GovernanceObjectRow[];

const governanceRouteDefinitions = [
  {
    pathname: "/ops/governance",
    routeKey: "governance_home",
    cluster: "governance",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "Governance foyer",
    title: "Quiet governance studio",
    summary:
      "Pending approvals, expiring grants, stale evidence, and release-watch posture stay in one governed command foyer.",
    anchorKey: "governance-scope",
    supportRegion: "release",
    centerPaneMode: "overview",
    reviewStage: "scope",
    primaryActionLabel: "Inspect the highest-risk governance review",
    calmNextStep: "Review recent promotions or inspect tenant posture without widening scope.",
    defaultObjectId: "release-wave-blue-42",
  },
  {
    pathname: "/ops/governance/tenants",
    routeKey: "governance_tenants",
    cluster: "governance",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "TenantConfigMatrix",
    title: "Tenant configuration matrix",
    summary:
      "Inherited, live, and draft values stay visible together while simulation blockers land the reviewer on the failing cells first.",
    anchorKey: "governance-diff",
    supportRegion: "impact",
    centerPaneMode: "matrix",
    reviewStage: "diff",
    primaryActionLabel: "Review the selected tenant override safely",
    calmNextStep: "Inspect the inherited, live, and draft tuple before promoting anything.",
    defaultObjectId: "tenant-north-river",
  },
  {
    pathname: "/ops/governance/authority-links",
    routeKey: "governance_authority_links",
    cluster: "governance",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "AuthorityMap",
    title: "Authority-link management",
    summary:
      "Delegation precedence, overlap, and orphan-risk preview stay attached to the same authority link context.",
    anchorKey: "governance-diff",
    supportRegion: "impact",
    centerPaneMode: "detail",
    reviewStage: "diff",
    primaryActionLabel: "Review the selected authority link",
    calmNextStep: "Confirm overlap and orphan risk before widening or retiring a link.",
    defaultObjectId: "authority-london-cover",
  },
  {
    pathname: "/ops/governance/compliance",
    routeKey: "governance_compliance",
    cluster: "governance",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "ComplianceLedgerPanel",
    title: "Compliance and evidence",
    summary:
      "Controls, evidence age, exceptions, and continuity bundles remain summary-first and provenance-aware.",
    anchorKey: "governance-diff",
    supportRegion: "evidence",
    centerPaneMode: "detail",
    reviewStage: "diff",
    primaryActionLabel: "Inspect the selected evidence bundle in place",
    calmNextStep: "Keep the current control row pinned while checking the evidence bundle.",
    defaultObjectId: "control-dspt-3-2",
  },
  {
    pathname: "/ops/governance/records",
    routeKey: "governance_records",
    cluster: "governance",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "Records lifecycle",
    title: "Records lifecycle governance",
    summary:
      "Retention class, legal hold, freeze lineage, and delete eligibility stay on one restricted governance surface.",
    anchorKey: "governance-diff",
    supportRegion: "evidence",
    centerPaneMode: "detail",
    reviewStage: "diff",
    primaryActionLabel: "Review the selected lifecycle decision safely",
    calmNextStep: "Keep the selected hold or disposition row pinned while verifying the dependency graph.",
    defaultObjectId: "records-hold-09",
  },
  {
    pathname: "/ops/access",
    routeKey: "access_home",
    cluster: "access",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "Access governance",
    title: "Access overview",
    summary:
      "Subjects, capability, scope, condition, expiry, and evidence grammar stays operationally understandable.",
    anchorKey: "governance-scope",
    supportRegion: "access",
    centerPaneMode: "overview",
    reviewStage: "scope",
    primaryActionLabel: "Review the highest-risk access package",
    calmNextStep: "Inspect effective access preview before narrowing or widening scope.",
    defaultObjectId: "user-asha-patel",
  },
  {
    pathname: "/ops/access/users",
    routeKey: "access_users",
    cluster: "access",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "EffectiveAccessPreview",
    title: "User access packages",
    summary:
      "Inherited grants, temporary grants, and break-glass posture remain visible together with one preview lane.",
    anchorKey: "governance-diff",
    supportRegion: "access",
    centerPaneMode: "detail",
    reviewStage: "diff",
    primaryActionLabel: "Inspect the selected user access package",
    calmNextStep: "Keep EffectiveAccessPreview visible before editing any grant package.",
    defaultObjectId: "user-asha-patel",
  },
  {
    pathname: "/ops/access/roles",
    routeKey: "access_roles",
    cluster: "access",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "RoleScopeStudio",
    title: "Role scope studio",
    summary:
      "Role editing remains tied to one effective access preview and one impact digest in the same shell.",
    anchorKey: "governance-diff",
    supportRegion: "access",
    centerPaneMode: "diff",
    reviewStage: "diff",
    primaryActionLabel: "Inspect the selected role package",
    calmNextStep: "Review capability, scope, condition, expiry, and preview before editing a role.",
    defaultObjectId: "role-clinical-reviewer",
  },
  {
    pathname: "/ops/access/reviews",
    routeKey: "access_reviews",
    cluster: "access",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "ApprovalStepper",
    title: "Elevation and access review",
    summary:
      "Exceptional-access decisions stay in the same shell with the requesting context, affected scope, and expiry boundary pinned.",
    anchorKey: "governance-approval",
    supportRegion: "approval",
    centerPaneMode: "review",
    reviewStage: "approval",
    primaryActionLabel: "Advance the current access review in place",
    calmNextStep: "Acknowledge the promoted review before narrowing or denying the access package.",
    defaultObjectId: "review-breakglass-021",
  },
  {
    pathname: "/ops/config",
    routeKey: "config_home",
    cluster: "config",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "ChangeEnvelope",
    title: "Configuration overview",
    summary:
      "Config diff, simulation burden, and release tuple posture stay visible together without leaving the shell.",
    anchorKey: "governance-scope",
    supportRegion: "impact",
    centerPaneMode: "overview",
    reviewStage: "scope",
    primaryActionLabel: "Inspect the current config package",
    calmNextStep: "Move from overview to bundle diff without losing the current baseline.",
    defaultObjectId: "bundle-routing-core-v7",
  },
  {
    pathname: "/ops/config/bundles",
    routeKey: "config_bundles",
    cluster: "config",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "ChangeEnvelope",
    title: "Policy bundles",
    summary:
      "The selected bundle keeps baseline, diff, and impact context together with one governed action plane.",
    anchorKey: "governance-diff",
    supportRegion: "impact",
    centerPaneMode: "diff",
    reviewStage: "diff",
    primaryActionLabel: "Review the selected policy bundle safely",
    calmNextStep: "Keep the selected bundle and its baseline pinned while comparing changes.",
    defaultObjectId: "bundle-routing-core-v7",
  },
  {
    pathname: "/ops/config/promotions",
    routeKey: "config_promotions",
    cluster: "config",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "ReleaseFreezeTupleCard",
    title: "Policy promotions",
    summary:
      "Compile, simulation, approvals, continuity bundles, and watch posture remain on one continuous promotion surface.",
    anchorKey: "governance-approval",
    supportRegion: "approval",
    centerPaneMode: "review",
    reviewStage: "approval",
    primaryActionLabel: "Advance the promotion review in place",
    calmNextStep: "Acknowledge the promoted review and keep the release tuple visible.",
    defaultObjectId: "bundle-routing-core-v7",
  },
  {
    pathname: "/ops/comms",
    routeKey: "comms_home",
    cluster: "comms",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "Communications governance",
    title: "Communications governance",
    summary:
      "Channel, audience, fallback, suppression, and tenant scope remain on one policy-aware control surface.",
    anchorKey: "governance-scope",
    supportRegion: "impact",
    centerPaneMode: "overview",
    reviewStage: "scope",
    primaryActionLabel: "Inspect the selected communications package",
    calmNextStep: "Keep live, draft, and scheduled posture visible together before editing.",
    defaultObjectId: "template-reminders-v12",
  },
  {
    pathname: "/ops/comms/templates",
    routeKey: "comms_templates",
    cluster: "comms",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "ChangeEnvelope",
    title: "Template reviews",
    summary:
      "Template diff, preview matrix, fallback branches, and channel-freeze posture remain same-shell and tuple-bound.",
    anchorKey: "governance-diff",
    supportRegion: "impact",
    centerPaneMode: "diff",
    reviewStage: "diff",
    primaryActionLabel: "Review the selected template package safely",
    calmNextStep: "Inspect fallback, suppression, and tenant scope before promoting the template set.",
    defaultObjectId: "template-reminders-v12",
  },
  {
    pathname: "/ops/release",
    routeKey: "release_home",
    cluster: "release",
    routeFamilyRef: "rf_governance_shell",
    sectionLabel: "ReleaseFreezeTupleCard",
    title: "Release and watch posture",
    summary:
      "Promotion, watch, rollback-readiness, channel freezes, and recovery disposition stay on one governed release surface.",
    anchorKey: "governance-approval",
    supportRegion: "release",
    centerPaneMode: "review",
    reviewStage: "approval",
    primaryActionLabel: "Review the current release tuple safely",
    calmNextStep: "Keep the release tuple and watch cockpit pinned while evaluating rollout posture.",
    defaultObjectId: "release-wave-blue-42",
  },
] as const satisfies readonly GovernanceRouteDefinition[];

const governanceRowsByRouteKey: Record<GovernanceRouteKey, readonly GovernanceObjectRow[]> = {
  governance_home: releaseRows,
  governance_tenants: tenantRows,
  governance_authority_links: authorityRows,
  governance_compliance: complianceRows,
  governance_records: recordsRows,
  access_home: accessUserRows,
  access_users: accessUserRows,
  access_roles: accessRoleRows,
  access_reviews: accessReviewRows,
  config_home: configRows,
  config_bundles: configRows,
  config_promotions: configRows,
  comms_home: commsRows,
  comms_templates: commsRows,
  release_home: releaseRows,
};

const governanceRoutesByPath: ReadonlyMap<string, GovernanceRouteDefinition> = new Map(
  governanceRouteDefinitions.map((definition) => [definition.pathname, definition]),
);

export const governanceRouteContractSeedRows = governanceRouteDefinitions.map(
  (definition) =>
    ({
      path: definition.pathname,
      cluster: definition.cluster,
      routeKey: definition.routeKey,
      continuityKey: "governance.review",
      selectedAnchorPolicy: "acknowledgement_required with diff-anchor stub and review notice",
      summary: definition.summary,
    }) satisfies GovernanceRouteContractSeedRow,
);

export const governanceMockProjectionExamples = [
  {
    exampleId: "gov-live-config-bundle",
    path: "/ops/config/bundles",
    freezeDisposition: "writable",
    supportRegion: "impact",
    summary:
      "Live writable governance review with change envelope, impact preview, and preserved baseline tuple.",
    selectedObjectId: "bundle-routing-core-v7",
  },
  {
    exampleId: "gov-review-only-compliance",
    path: "/ops/governance/compliance",
    freezeDisposition: "review_only",
    supportRegion: "evidence",
    summary:
      "Evidence remains visible in the same shell while export or signoff stays read-only preserve.",
    selectedObjectId: "control-dcb0129-release",
  },
  {
    exampleId: "gov-scope-drift-access-review",
    path: "/ops/access/reviews",
    freezeDisposition: "scope_drift",
    supportRegion: "approval",
    summary:
      "Scope drift blocks access approval in place and keeps the promoted review anchor visible until revalidated.",
    selectedObjectId: "review-breakglass-021",
  },
  {
    exampleId: "gov-freeze-conflict-release",
    path: "/ops/release",
    freezeDisposition: "freeze_conflict",
    supportRegion: "release",
    summary:
      "A release-freeze conflict degrades the shell to recovery-only posture while preserving watch and rollback context.",
    selectedObjectId: "release-wave-amber-12",
  },
  {
    exampleId: "gov-tenant-matrix-calm",
    path: "/ops/governance/tenants",
    freezeDisposition: "writable",
    supportRegion: "impact",
    summary:
      "Tenant matrix stays calm and exact when inherited, live, and draft values remain aligned under one scope ribbon.",
    selectedObjectId: "tenant-harbour-west",
  },
  {
    exampleId: "gov-template-publication-drift",
    path: "/ops/comms/templates",
    freezeDisposition: "freeze_conflict",
    supportRegion: "impact",
    summary:
      "Template review remains same-shell while publication drift suppresses live promotion posture in place.",
    selectedObjectId: "template-release-watch-v3",
  },
] as const satisfies readonly GovernanceMockProjectionExample[];

const routeClusterLabels: Record<GovernanceCluster, string> = {
  governance: "Governance",
  access: "Access",
  config: "Config",
  comms: "Comms",
  release: "Release",
};

function runtimeScenarioForDisposition(
  disposition: GovernanceFreezeDisposition,
): RuntimeScenario {
  switch (disposition) {
    case "writable":
      return "live";
    case "review_only":
      return "read_only";
    case "freeze_conflict":
      return "recovery_only";
    case "scope_drift":
      return "blocked";
  }
}

export function deriveGovernanceRecoveryPosture(
  disposition: GovernanceFreezeDisposition,
): GovernanceRecoveryPosture {
  switch (disposition) {
    case "writable":
      return "live";
    case "review_only":
      return "read_only";
    case "freeze_conflict":
      return "recovery_only";
    case "scope_drift":
      return "blocked";
  }
}

export function deriveGovernanceVisualizationAuthority(
  disposition: GovernanceFreezeDisposition,
): GovernanceVisualizationAuthority {
  return disposition === "freeze_conflict" || disposition === "scope_drift"
    ? "summary_only"
    : "visual_table_summary";
}

function routeDefinitionForPath(pathname: string): GovernanceRouteDefinition {
  return governanceRoutesByPath.get(pathname) ?? governanceRoutesByPath.get(GOVERNANCE_DEFAULT_PATH)!;
}

function objectRowsForRoute(routeKey: GovernanceRouteKey): readonly GovernanceObjectRow[] {
  return governanceRowsByRouteKey[routeKey];
}

function requiredObjectForRoute(
  routeKey: GovernanceRouteKey,
  objectId?: string,
): GovernanceObjectRow {
  const rows = objectRowsForRoute(routeKey);
  const fallback = rows[0];
  if (!fallback) {
    throw new Error(`Missing governance object rows for ${routeKey}.`);
  }
  return rows.find((row) => row.objectId === objectId) ?? fallback;
}

function selectInitialObjectId(
  location: GovernanceLocation,
  preferredObjectId?: string,
): string {
  const rows = objectRowsForRoute(location.routeKey);
  return rows.find((row) => row.objectId === preferredObjectId)?.objectId ?? location.defaultObjectId;
}

function scopeTokenForState(
  location: GovernanceLocation,
  selectedObject: GovernanceObjectRow,
  disposition: GovernanceFreezeDisposition,
): GovernanceScopeToken {
  const freezeLabel =
    disposition === "writable"
      ? "Tuple current"
      : disposition === "review_only"
        ? "Read-only preserve"
        : disposition === "scope_drift"
          ? "Scope revalidation required"
          : "Release freeze conflict";
  const writeStateLabel =
    disposition === "writable"
      ? "Review and promotion enabled"
      : disposition === "review_only"
        ? "Visible, but not writable"
        : disposition === "scope_drift"
          ? "Blocked until tuple revalidation"
          : "Recovery-only watch posture";
  const driftSummary =
    disposition === "writable"
      ? "Tenant, organisation, environment, and purpose-of-use still agree with the active review package."
      : disposition === "review_only"
        ? "The review package is still exact, but the visible tuple is currently read-only."
        : disposition === "scope_drift"
          ? "Organisation or purpose-of-use drift froze the shell in place instead of silently refreshing it."
          : "Release, publication, or compatibility drift suppressed writable posture while preserving the same shell.";
  const watchLabel =
    location.cluster === "release" || location.cluster === "config"
      ? "Release watch tuple pinned to the same package"
      : "Dependency watchlist and continuity bundle remain visible";
  return {
    scopeTokenId: `scope::${location.routeKey}::${selectedObject.objectId}::${disposition}`,
    tenantLabel: "North River ICS / Tenant 04",
    organisationLabel:
      location.cluster === "access" ? "Organisation authority review" : "Platform governance scope",
    environmentLabel: location.cluster === "release" ? "Integration watch window" : "Pre-release review",
    purposeLabel:
      location.cluster === "access"
        ? "Administrative review under bounded operational purpose"
        : "Governed change and assurance review",
    reviewContextLabel: `${routeClusterLabels[location.cluster]} / ${selectedObject.kind}`,
    changeLabel: selectedObject.label,
    watchLabel,
    freezeLabel,
    writeStateLabel,
    driftSummary,
    standardsVersion: "Standards watch reviewed 2026-04-14 / v2026.04",
    gapRefs: selectedObject.gapRefs,
  };
}

function releaseTupleForState(
  location: GovernanceLocation,
  selectedObject: GovernanceObjectRow,
  disposition: GovernanceFreezeDisposition,
): GovernanceReleaseTuple {
  return {
    releaseTupleId: `release::${location.routeKey}::${selectedObject.objectId}`,
    freezeLabel:
      disposition === "writable"
        ? "No active freeze conflict"
        : disposition === "review_only"
          ? "Read-only freeze preserve"
          : disposition === "scope_drift"
            ? "Scope drift freeze"
            : "Recovery-only freeze conflict",
    publicationState:
      disposition === "freeze_conflict" ? "Published tuple drifted" : "Published tuple matches the visible package",
    watchState:
      location.cluster === "release"
        ? "Watch cockpit attached to the same rollout tuple"
        : "Watch cockpit available as a promoted support region",
    compatibilityState:
      disposition === "freeze_conflict"
        ? "Compatibility evidence needs revalidation"
        : "Compatibility evidence current for the visible package",
    continuityImpactLabel:
      location.cluster === "release"
        ? "Patient-home, workspace, and pharmacy continuity controls remain in scope"
        : "Continuity controls remain exact for the active governance package",
    blastRadiusLabel:
      location.cluster === "release"
        ? "Affected route families: patient, workspace, governance"
        : `Affected route cluster: ${routeClusterLabels[location.cluster]}`,
  };
}

function impactItemsForState(
  location: GovernanceLocation,
  selectedObject: GovernanceObjectRow,
): readonly GovernanceImpactItem[] {
  return [
    {
      impactId: `${selectedObject.objectId}-blast-radius`,
      title: "Blast radius",
      effectLabel: routeClusterLabels[location.cluster],
      summary: `The selected ${selectedObject.kind.toLowerCase()} touches one bounded governance route cluster and keeps cross-shell pivots read-only.`,
    },
    {
      impactId: `${selectedObject.objectId}-continuity`,
      title: "Continuity burden",
      effectLabel: "Same-shell preserve",
      summary: "Scope ribbon, selected anchor, and support region stay bound to the same review package.",
    },
    {
      impactId: `${selectedObject.objectId}-evidence`,
      title: "Evidence burden",
      effectLabel: selectedObject.approvalBurden,
      summary: "The same evidence bundle must justify diff, preview, approval, and watch posture.",
    },
  ];
}

function evidenceRowsForState(
  location: GovernanceLocation,
  selectedObject: GovernanceObjectRow,
  disposition: GovernanceFreezeDisposition,
): readonly GovernanceEvidenceRow[] {
  return [
    {
      controlId: `${selectedObject.objectId}-continuity`,
      title: "Experience continuity bundle",
      owner: "Platform governance",
      evidenceAge: selectedObject.evidenceAge,
      status: disposition === "scope_drift" ? "missing" : "attested",
      mitigation:
        disposition === "scope_drift"
          ? "Revalidate the acting scope tuple before reopening the package."
          : "Current bundle matches the same visible scope and baseline snapshot.",
    },
    {
      controlId: `${selectedObject.objectId}-release`,
      title: "Release and publication parity",
      owner: "Release manager",
      evidenceAge: disposition === "freeze_conflict" ? "2m" : "12m",
      status: disposition === "freeze_conflict" ? "exception" : "attested",
      mitigation:
        disposition === "freeze_conflict"
          ? "Freeze promotion and watch actions until publication parity rebinds."
          : "Publication tuple and watch posture agree with the current package.",
    },
    {
      controlId: `${selectedObject.objectId}-standards`,
      title: "Standards dependency watchlist",
      owner: "Compliance officer",
      evidenceAge: "29m",
      status: location.cluster === "release" ? "expiring" : "attested",
      mitigation:
        location.cluster === "release"
          ? "Review the exception owner and remediation deadline before promotion."
          : "No current standards drift inside the selected governance scope.",
    },
  ];
}

function approvalStepsForState(
  location: GovernanceLocation,
  selectedObject: GovernanceObjectRow,
  disposition: GovernanceFreezeDisposition,
  hasPendingReplacement: boolean,
): readonly GovernanceApprovalStep[] {
  return [
    {
      stepId: "scope",
      label: "Scope tuple pinned",
      state: disposition === "scope_drift" ? "blocked" : "settled",
      evidence:
        disposition === "scope_drift"
          ? "The acting scope tuple drifted and must be revalidated before review continues."
          : "Tenant, organisation, environment, and purpose-of-use still match the visible package.",
    },
    {
      stepId: "baseline",
      label: "Baseline snapshot preserved",
      state: disposition === "scope_drift" ? "blocked" : "settled",
      evidence: `${selectedObject.baselineLabel} remains bound to the same change envelope and return intent.`,
    },
    {
      stepId: "review",
      label: "Independent review promotion",
      state:
        disposition === "writable" && !hasPendingReplacement
          ? location.reviewStage === "approval"
            ? "pending"
            : "settled"
          : "blocked",
      evidence:
        hasPendingReplacement
          ? "The diff anchor must be acknowledged before the promoted review becomes dominant."
          : selectedObject.approvalBurden,
    },
    {
      stepId: "watch",
      label: "Watch tuple and publication parity",
      state: disposition === "freeze_conflict" ? "blocked" : location.cluster === "release" ? "pending" : "settled",
      evidence:
        disposition === "freeze_conflict"
          ? "Runtime publication or compatibility drift suppresses live watch actions."
          : "The same watch tuple remains visible beside the review surface.",
    },
  ];
}

function objectRowsMatch(
  nextLocation: GovernanceLocation,
  selectedObjectId: string,
): boolean {
  return objectRowsForRoute(nextLocation.routeKey).some((row) => row.objectId === selectedObjectId);
}

function continuitySnapshotForLocation(
  location: GovernanceLocation,
  disposition: GovernanceFreezeDisposition,
): ContinuitySnapshot {
  return createInitialContinuitySnapshot({
    shellSlug: GOVERNANCE_SHELL_SLUG,
    routeFamilyRef: location.routeFamilyRef,
    anchorKey: location.anchorKey,
    runtimeScenario: runtimeScenarioForDisposition(disposition),
  });
}

function nextContinuitySnapshot(
  snapshot: ContinuitySnapshot,
  nextLocation: GovernanceLocation,
  disposition: GovernanceFreezeDisposition,
): ContinuitySnapshot {
  const nextRuntime = runtimeScenarioForDisposition(disposition);
  if (
    snapshot.selectedAnchor.anchorKey === nextLocation.anchorKey &&
    snapshot.runtimeScenario === nextRuntime
  ) {
    return snapshot;
  }
  if (
    nextLocation.anchorKey === "governance-approval" &&
    snapshot.selectedAnchor.anchorKey === "governance-diff"
  ) {
    return invalidateSelectedAnchor(snapshot, {
      reasonRefs: ["reason.diff_scope_superseded"],
      replacementAnchorKey: "governance-approval",
      runtimeScenario: nextRuntime,
      timestamp: "2026-04-14T09:44:00Z",
    });
  }
  const selected = selectAnchorInSnapshot(snapshot, nextLocation.anchorKey, "2026-04-14T09:44:00Z");
  return {
    ...selected,
    runtimeScenario: nextRuntime,
  };
}

function createTelemetryEvent(
  index: number,
  eventClass: GovernanceTelemetryEventClass,
  summary: string,
  payload: Record<string, string>,
): GovernanceTelemetryEvent {
  const eventName =
    eventClass === "surface_enter"
      ? "surface.entered"
      : eventClass === "selected_anchor_changed"
        ? "selected_anchor.changed"
        : eventClass === "dominant_action_changed"
          ? "support_region.changed"
          : eventClass === "review_state_changed"
            ? "review_state.changed"
            : "scope_state.changed";
  return {
    eventId: `gvt-${String(index + 1).padStart(3, "0")}`,
    eventClass,
    eventName,
    summary,
    payload,
  };
}

function appendTelemetry(
  state: GovernanceShellState,
  eventClass: GovernanceTelemetryEventClass,
  summary: string,
  payload: Record<string, string>,
): readonly GovernanceTelemetryEvent[] {
  const next = createTelemetryEvent(state.telemetry.length, eventClass, summary, payload);
  return [...state.telemetry, next];
}

export function parseGovernancePath(pathname: string): GovernanceLocation {
  return routeDefinitionForPath(pathname);
}

export function listGovernanceRoutes(): readonly GovernanceLocation[] {
  return governanceRouteDefinitions;
}

export function createInitialGovernanceShellState(
  pathname: string = GOVERNANCE_DEFAULT_PATH,
  options: {
    freezeDisposition?: GovernanceFreezeDisposition;
    supportRegion?: GovernanceSupportRegion;
    selectedObjectId?: string;
  } = {},
): GovernanceShellState {
  const location = parseGovernancePath(pathname);
  const freezeDisposition = options.freezeDisposition ?? "writable";
  const selectedObjectId = selectInitialObjectId(location, options.selectedObjectId);
  const continuitySnapshot = continuitySnapshotForLocation(location, freezeDisposition);
  const supportRegion = options.supportRegion ?? location.supportRegion;
  const initialState: GovernanceShellState = {
    location,
    selectedObjectId,
    supportRegion,
    freezeDisposition,
    continuitySnapshot,
    returnIntent: null,
    telemetry: [],
  };
  return {
    ...initialState,
    telemetry: appendTelemetry(initialState, "surface_enter", "Governance shell entered.", {
      pathname: location.pathname,
      cluster: location.cluster,
      selectedObjectId,
      freezeDisposition,
    }),
  };
}

export function selectGovernanceObject(
  state: GovernanceShellState,
  objectId: string,
): GovernanceShellState {
  if (!objectRowsMatch(state.location, objectId) || state.selectedObjectId === objectId) {
    return state;
  }
  const nextSnapshot = selectAnchorInSnapshot(
    {
      ...state.continuitySnapshot,
      runtimeScenario: runtimeScenarioForDisposition(state.freezeDisposition),
    },
    state.location.reviewStage === "approval" ? "governance-approval" : "governance-diff",
    "2026-04-14T09:46:00Z",
  );
  const nextState = {
    ...state,
    selectedObjectId: objectId,
    continuitySnapshot: nextSnapshot,
  };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "selected_anchor_changed", "Selected governance object updated.", {
      pathname: state.location.pathname,
      selectedObjectId: objectId,
    }),
  };
}

export function setGovernanceSupportRegion(
  state: GovernanceShellState,
  supportRegion: GovernanceSupportRegion,
): GovernanceShellState {
  if (state.supportRegion === supportRegion) {
    return state;
  }
  const nextState = { ...state, supportRegion };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "dominant_action_changed", "Promoted support region changed.", {
      pathname: state.location.pathname,
      supportRegion,
    }),
  };
}

export function setGovernanceFreezeDisposition(
  state: GovernanceShellState,
  freezeDisposition: GovernanceFreezeDisposition,
): GovernanceShellState {
  if (state.freezeDisposition === freezeDisposition) {
    return state;
  }
  const nextState = {
    ...state,
    freezeDisposition,
    continuitySnapshot: {
      ...state.continuitySnapshot,
      runtimeScenario: runtimeScenarioForDisposition(freezeDisposition),
    },
  };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "scope_state_changed", "Governance freeze disposition changed.", {
      pathname: state.location.pathname,
      freezeDisposition,
    }),
  };
}

export function navigateGovernanceShell(
  state: GovernanceShellState,
  pathname: string,
): GovernanceShellState {
  const nextLocation = parseGovernancePath(pathname);
  const selectedObjectId = objectRowsMatch(nextLocation, state.selectedObjectId)
    ? state.selectedObjectId
    : nextLocation.defaultObjectId;
  const returnIntent =
    state.location.reviewStage !== "approval" && nextLocation.reviewStage === "approval"
      ? {
          tokenId: `gov-return-${state.location.routeKey}`,
          originPath: state.location.pathname,
          originObjectId: state.selectedObjectId,
          issuedAt: "2026-04-14T09:48:00Z",
          label: `Return to ${state.location.title}`,
        }
      : pathname === state.returnIntent?.originPath
        ? null
        : state.returnIntent;
  const nextSnapshot = nextContinuitySnapshot(
    state.continuitySnapshot,
    nextLocation,
    state.freezeDisposition,
  );
  const nextState: GovernanceShellState = {
    ...state,
    location: nextLocation,
    selectedObjectId,
    supportRegion: nextLocation.supportRegion,
    continuitySnapshot: nextSnapshot,
    returnIntent,
  };
  const eventClass =
    nextLocation.reviewStage === "approval" || state.location.reviewStage === "approval"
      ? "review_state_changed"
      : "surface_enter";
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, eventClass, "Governance route changed inside the same shell.", {
      pathname: nextLocation.pathname,
      selectedObjectId,
      reviewStage: nextLocation.reviewStage,
    }),
  };
}

export function returnFromGovernanceReview(
  state: GovernanceShellState,
): GovernanceShellState {
  if (!state.returnIntent) {
    return state;
  }
  const returned = navigateGovernanceShell(state, state.returnIntent.originPath);
  return {
    ...returned,
    selectedObjectId: state.returnIntent.originObjectId,
    returnIntent: null,
  };
}

export function acknowledgeGovernanceReview(
  state: GovernanceShellState,
): GovernanceShellState {
  if (!state.continuitySnapshot.currentStub?.replacementAnchorRef) {
    return state;
  }
  const nextState = {
    ...state,
    continuitySnapshot: acknowledgeSelectedAnchorReplacement(
      state.continuitySnapshot,
      "2026-04-14T09:50:00Z",
    ),
  };
  return {
    ...nextState,
    telemetry: appendTelemetry(nextState, "review_state_changed", "Governance review replacement acknowledged.", {
      pathname: state.location.pathname,
      selectedObjectId: state.selectedObjectId,
      anchorKey: "governance-approval",
    }),
  };
}

export function reviewRouteForLocation(
  location: GovernanceLocation,
): string | null {
  switch (location.routeKey) {
    case "config_bundles":
      return "/ops/config/promotions";
    case "access_roles":
      return "/ops/access/reviews";
    case "governance_home":
      return "/ops/release";
    default:
      return null;
  }
}

export function resolveGovernanceShellSnapshot(
  state: GovernanceShellState,
  viewportWidth: number,
): GovernanceShellSnapshot {
  const objectRows = objectRowsForRoute(state.location.routeKey);
  const selectedObject = requiredObjectForRoute(
    state.location.routeKey,
    state.selectedObjectId,
  );
  const layoutMode: GovernanceLayoutMode =
    viewportWidth < 920
      ? "mission_stack"
      : viewportWidth >= 1320 &&
          (state.location.centerPaneMode === "matrix" ||
            state.location.centerPaneMode === "diff" ||
            state.location.reviewStage === "approval")
        ? "three_plane"
        : "two_plane";
  const hasPendingReplacement = Boolean(
    state.continuitySnapshot.currentStub?.replacementAnchorRef,
  );
  const scopeToken = scopeTokenForState(state.location, selectedObject, state.freezeDisposition);
  const supportHeadline =
    state.supportRegion === "impact"
      ? "Impact preview"
      : state.supportRegion === "approval"
        ? "Approval stepper"
        : state.supportRegion === "evidence"
          ? "Evidence bundle"
          : state.supportRegion === "release"
            ? "Release tuple"
            : "Effective access preview";
  const supportSummary =
    state.supportRegion === "impact"
      ? "Blast radius, continuity burden, and approval burden stay concise and package-bound."
      : state.supportRegion === "approval"
        ? "Independent review, acknowledgement burden, and watch posture stay on one ordered rail."
        : state.supportRegion === "evidence"
          ? "Continuity evidence, publication parity, and standards posture remain summary-first."
          : state.supportRegion === "release"
            ? "Freeze, publication, compatibility, and watch posture stay visible beside the review."
            : "Operational access meaning stays visible beside the governed role or review package.";
  return {
    location: state.location,
    selectedObject,
    objectRows,
    scopeToken,
    supportRegion: state.supportRegion,
    freezeDisposition: state.freezeDisposition,
    approvalSteps: approvalStepsForState(
      state.location,
      selectedObject,
      state.freezeDisposition,
      hasPendingReplacement,
    ),
    evidenceRows: evidenceRowsForState(state.location, selectedObject, state.freezeDisposition),
    impactItems: impactItemsForState(state.location, selectedObject),
    releaseTuple: releaseTupleForState(state.location, selectedObject, state.freezeDisposition),
    layoutMode,
    recoveryPosture: deriveGovernanceRecoveryPosture(state.freezeDisposition),
    visualizationAuthority: deriveGovernanceVisualizationAuthority(state.freezeDisposition),
    artifactModeState:
      state.supportRegion === "evidence" || state.supportRegion === "release"
        ? "governed_preview"
        : "summary_only",
    reviewHeadline: `${state.location.sectionLabel} / ${selectedObject.label}`,
    supportHeadline,
    supportSummary,
    hasPendingReplacement,
  };
}
