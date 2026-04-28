export const ROLE_SCOPE_STUDIO_TASK_ID = "par_458";
export const ROLE_SCOPE_STUDIO_SCHEMA_VERSION = "458.phase9.governance-role-scope-studio.v1";
export const ROLE_SCOPE_STUDIO_VISUAL_MODE = "Role_Scope_Proof_Studio";
export const ROLE_SCOPE_STUDIO_ROUTE = "/ops/access/role-scope-studio";
export const ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF =
  "PHASE9_BATCH_458_472_INTERFACE_GAP_458_ACCESS_PREVIEW_READ_MODEL.json";

export type RoleScopeStudioScenarioState =
  | "normal"
  | "empty"
  | "stale"
  | "degraded"
  | "blocked"
  | "permission_denied"
  | "settlement_pending"
  | "frozen"
  | "masked";
export type RoleScopeRouteMode =
  | "role_scope_studio"
  | "access_roles"
  | "access_reviews"
  | "access_users";
export type RoleScopeBindingState =
  | "live"
  | "stale_review"
  | "degraded_read_only"
  | "blocked"
  | "permission_denied"
  | "settlement_pending"
  | "release_frozen";
export type RoleScopeActionControlState =
  | "preview_only"
  | "diagnostic_only"
  | "recovery_only"
  | "blocked"
  | "metadata_only"
  | "settlement_pending"
  | "frozen";
export type RoleScopeCapabilityColumnRef =
  | "ordinary"
  | "elevated"
  | "break_glass"
  | "recovery_only"
  | "export"
  | "approval"
  | "admin";
export type RoleScopeCapabilityState =
  | "live"
  | "diagnostic"
  | "recovery"
  | "denied"
  | "frozen"
  | "masked";
export type AccessPreviewDecision = "allow" | "deny" | "conditional";
export type AccessPreviewState =
  | "live"
  | "empty"
  | "stale"
  | "degraded"
  | "blocked"
  | "denied"
  | "pending_settlement"
  | "frozen"
  | "masked";
export type ReleaseFreezeCardStatus =
  | "live"
  | "diagnostic_only"
  | "recovery_only"
  | "blocked"
  | "frozen";
export type MaskExposureState = "visible" | "masked" | "hidden" | "export_blocked";

export interface GovernanceScopeRibbonProjection {
  readonly tenantRef: string;
  readonly tenantLabel: string;
  readonly organisationRef: string;
  readonly organisationLabel: string;
  readonly environmentRef: string;
  readonly purposeOfUseRef: string;
  readonly purposeLabel: string;
  readonly actingRoleRef: string;
  readonly actingRoleLabel: string;
  readonly elevationState: "none" | "just_in_time" | "break_glass" | "expired";
  readonly governanceScopeTokenRef: string;
  readonly actingScopeTupleRef: string;
  readonly scopeTupleHash: string;
  readonly policyPlaneRef: string;
  readonly runtimePublicationState: "published_exact" | "buffered" | "degraded" | "blocked";
  readonly releaseFreezeVerdict:
    | "no_active_freeze"
    | "diagnostic_only"
    | "recovery_only"
    | "approval_blocked"
    | "stale_review";
  readonly staleState: "current" | "stale" | "superseded" | "metadata_only";
  readonly writeState: RoleScopeActionControlState;
  readonly sourceObjectRefs: readonly string[];
  readonly gapArtifactRef: string;
}

export interface RoleGrantMatrixCellProjection {
  readonly columnRef: RoleScopeCapabilityColumnRef;
  readonly state: RoleScopeCapabilityState;
  readonly stateLabel: "Live" | "Diagnostic" | "Recovery" | "Denied" | "Frozen" | "Masked";
  readonly iconShape: "circle" | "square" | "diamond" | "bar" | "lock" | "slash";
  readonly explanation: string;
  readonly sourceObjectRef: string;
  readonly authorityRef: string;
  readonly deniedActionRef: string | null;
  readonly mutableControlState: "not_mutable_in_preview";
}

export interface RoleGrantMatrixRowProjection {
  readonly routeFamilyRef: string;
  readonly routePath: string;
  readonly artifactClass: string;
  readonly label: string;
  readonly consequence: string;
  readonly audienceTierRef: string;
  readonly selected: boolean;
  readonly cells: readonly RoleGrantMatrixCellProjection[];
}

export interface RoleGrantMatrixProjection {
  readonly roleRef: string;
  readonly roleLabel: string;
  readonly rolePackageRef: string;
  readonly capabilityColumns: readonly {
    readonly columnRef: RoleScopeCapabilityColumnRef;
    readonly label: string;
  }[];
  readonly rows: readonly RoleGrantMatrixRowProjection[];
  readonly selectedRouteFamilyRef: string;
  readonly selectedRoutePath: string;
  readonly matrixSourceRef: string;
  readonly emptyStateReason: string | null;
}

export interface EffectiveAccessPreviewProjection {
  readonly subjectRef: string;
  readonly personaRef: string;
  readonly personaLabel: string;
  readonly tenantRef: string;
  readonly organisationRef: string;
  readonly staffIdentityContextRef: string;
  readonly actingContextRef: string;
  readonly actingScopeTupleRef: string;
  readonly scopeTupleHash: string;
  readonly policyPlaneRef: string;
  readonly objectTypeRef: string;
  readonly purposeOfUseRef: string;
  readonly elevationState: GovernanceScopeRibbonProjection["elevationState"];
  readonly decision: AccessPreviewDecision;
  readonly previewState: AccessPreviewState;
  readonly decisionReasonRefs: readonly string[];
  readonly expiringGrantRefs: readonly string[];
  readonly visibilityImpactSummary: string;
  readonly visiblePanels: readonly string[];
  readonly maskedFields: readonly string[];
  readonly hiddenFields: readonly string[];
  readonly exportBlockedDestinationControls: readonly string[];
  readonly artifactMode: "live_preview" | "synthetic_preview" | "metadata_only";
  readonly breakGlassPolicyRef: string;
  readonly reviewBurdenState: "none" | "follow_up_required" | "independent_review_required";
  readonly activeExceptionalAccessRef: string | null;
  readonly relatedAuditRefs: readonly string[];
  readonly telemetryPreview: readonly {
    readonly eventName: string;
    readonly safeDescriptorHash: string;
    readonly payload: Readonly<Record<string, string>>;
  }[];
}

export interface AccessPreviewArtifactMaskRegionProjection {
  readonly regionRef: string;
  readonly fieldLabel: string;
  readonly exposureState: MaskExposureState;
  readonly semanticText: string;
  readonly domText: string;
  readonly ariaName: string;
  readonly telemetryValue: string;
  readonly screenshotToken: string;
}

export interface AccessPreviewArtifactMaskProjection {
  readonly artifactClass: string;
  readonly artifactLabel: string;
  readonly beforeRegions: readonly AccessPreviewArtifactMaskRegionProjection[];
  readonly afterRegions: readonly AccessPreviewArtifactMaskRegionProjection[];
  readonly maskPolicyRef: string;
  readonly hiddenFieldsNotRendered: boolean;
  readonly telemetryRedacted: boolean;
  readonly syntheticFixtureOnly: boolean;
}

export interface BreakGlassElevationSummaryProjection {
  readonly eligibilityState: "eligible" | "not_eligible" | "expired" | "review_only";
  readonly reasonAdequacyState: "adequate" | "missing_reason" | "insufficient" | "not_applicable";
  readonly scopeWideningSummary: string;
  readonly expiresAt: string | null;
  readonly followUpBurden: string;
  readonly reviewState: "not_invoked" | "active" | "follow_up_due" | "blocked";
  readonly breakGlassPolicyRef: string;
  readonly elevationRequestRef: string | null;
  readonly sourceObjectRefs: readonly string[];
}

export interface ReleaseFreezeCardProjection {
  readonly releaseFreezeCardRef: string;
  readonly freezeKind:
    | "channel_freeze"
    | "config_freeze"
    | "standards_watchlist"
    | "recovery_only"
    | "assurance_graph"
    | "incident_command";
  readonly title: string;
  readonly status: ReleaseFreezeCardStatus;
  readonly beganAt: string;
  readonly affects: readonly string[];
  readonly releaseCondition: string;
  readonly downgradedActions: readonly string[];
  readonly sourceObjectRef: string;
  readonly tupleHash: string;
}

export interface DeniedActionExplainerProjection {
  readonly actionRef: string;
  readonly actionLabel: string;
  readonly sourceObjectRef: string;
  readonly failedPredicate: string;
  readonly consequence: string;
  readonly nextSafeAction: string;
  readonly controlState: RoleScopeActionControlState;
}

export interface ScopeTupleInspectorProjection {
  readonly actingScopeTupleRef: string;
  readonly scopeTupleHash: string;
  readonly governanceScopeTokenRef: string;
  readonly routeIntentBindingRef: string;
  readonly audienceVisibilityCoverageRef: string;
  readonly minimumNecessaryContractRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly changeBaselineSnapshotRef: string;
  readonly sourceKernelRef: string;
}

export interface GovernanceReturnContextStripProjection {
  readonly returnTokenRef: string;
  readonly originRouteRef: string;
  readonly originLabel: string;
  readonly originScopeHash: string;
  readonly safeReturnState: "safe" | "denied" | "diagnostic_only" | "pending_settlement";
  readonly deniedReasonRef: string | null;
  readonly returnLabel: string;
}

export interface RoleScopeStudioActionProjection {
  readonly actionType:
    | "open_change_envelope"
    | "request_revalidation"
    | "export_preview"
    | "approve_role"
    | "return_to_origin";
  readonly label: string;
  readonly allowed: boolean;
  readonly controlState: RoleScopeActionControlState;
  readonly disabledReason: string;
  readonly settlementRef: string;
}

export interface GovernanceRoleScopeStudioProjection {
  readonly taskId: string;
  readonly schemaVersion: string;
  readonly visualMode: string;
  readonly route: string;
  readonly routeMode: RoleScopeRouteMode;
  readonly scenarioState: RoleScopeStudioScenarioState;
  readonly bindingState: RoleScopeBindingState;
  readonly actionControlState: RoleScopeActionControlState;
  readonly surfaceSummary: string;
  readonly noLiveMutationControls: boolean;
  readonly gapArtifactRef: string;
  readonly governanceScopeRibbon: GovernanceScopeRibbonProjection;
  readonly roleGrantMatrix: RoleGrantMatrixProjection;
  readonly effectiveAccessPreview: EffectiveAccessPreviewProjection;
  readonly accessPreviewArtifactMask: AccessPreviewArtifactMaskProjection;
  readonly breakGlassElevationSummary: BreakGlassElevationSummaryProjection;
  readonly releaseFreezeCards: readonly ReleaseFreezeCardProjection[];
  readonly deniedActionExplainers: readonly DeniedActionExplainerProjection[];
  readonly selectedDeniedAction: DeniedActionExplainerProjection;
  readonly scopeTupleInspector: ScopeTupleInspectorProjection;
  readonly governanceReturnContextStrip: GovernanceReturnContextStripProjection;
  readonly telemetryDisclosureFence: {
    readonly fenceRef: string;
    readonly policyRef: string;
    readonly allowedPayloadKeys: readonly string[];
    readonly blockedPayloadKeys: readonly string[];
    readonly rawSensitiveTextAbsent: boolean;
    readonly screenshotFixtureClass: "synthetic_only";
  };
  readonly actionRail: readonly RoleScopeStudioActionProjection[];
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Readonly<Record<string, string>>;
  readonly automationAnchors: readonly string[];
}

export const roleScopeStudioAutomationAnchors = [
  "role-scope-studio",
  "governance-scope-ribbon-458",
  "role-scope-matrix",
  "effective-access-preview-pane",
  "access-mask-diff-card",
  "break-glass-elevation-summary",
  "release-freeze-card-rail",
  "denied-action-explainer",
  "scope-tuple-inspector",
  "governance-return-context-strip",
  "ui-telemetry-disclosure-fence",
] as const;

const capabilityColumns = [
  { columnRef: "ordinary", label: "Ordinary" },
  { columnRef: "elevated", label: "Elevated" },
  { columnRef: "break_glass", label: "Break-glass" },
  { columnRef: "recovery_only", label: "Recovery-only" },
  { columnRef: "export", label: "Export" },
  { columnRef: "approval", label: "Approval" },
  { columnRef: "admin", label: "Admin" },
] as const satisfies readonly {
  readonly columnRef: RoleScopeCapabilityColumnRef;
  readonly label: string;
}[];

const routeFamilies = [
  {
    routeFamilyRef: "route-family:access-governance",
    routePath: ROLE_SCOPE_STUDIO_ROUTE,
    artifactClass: "access_policy",
    label: "Access governance studio",
    consequence: "Role policy can be inspected, but edits require an authorized change envelope.",
    audienceTierRef: "audience-tier:governance-leader",
    baseStates: {
      ordinary: "live",
      elevated: "diagnostic",
      break_glass: "denied",
      recovery_only: "recovery",
      export: "denied",
      approval: "frozen",
      admin: "denied",
    },
  },
  {
    routeFamilyRef: "route-family:config-promotions",
    routePath: "/ops/config/promotions",
    artifactClass: "config_bundle",
    label: "Config promotion review",
    consequence: "Promotion controls are suppressed while the release freeze tuple is unresolved.",
    audienceTierRef: "audience-tier:release-governance",
    baseStates: {
      ordinary: "diagnostic",
      elevated: "diagnostic",
      break_glass: "denied",
      recovery_only: "recovery",
      export: "frozen",
      approval: "frozen",
      admin: "denied",
    },
  },
  {
    routeFamilyRef: "route-family:assurance-export",
    routePath: "/ops/assurance/export",
    artifactClass: "assurance_pack",
    label: "Assurance pack export",
    consequence:
      "Pack signoff remains blocked until graph completeness and release approval agree.",
    audienceTierRef: "audience-tier:assurance-owner",
    baseStates: {
      ordinary: "live",
      elevated: "diagnostic",
      break_glass: "denied",
      recovery_only: "recovery",
      export: "frozen",
      approval: "frozen",
      admin: "denied",
    },
  },
  {
    routeFamilyRef: "route-family:incident-command",
    routePath: "/ops/incidents/review",
    artifactClass: "incident_review",
    label: "Incident command review",
    consequence:
      "Incident action is recovery-only unless the investigation scope and commander tuple match.",
    audienceTierRef: "audience-tier:incident-commander",
    baseStates: {
      ordinary: "diagnostic",
      elevated: "live",
      break_glass: "diagnostic",
      recovery_only: "recovery",
      export: "masked",
      approval: "frozen",
      admin: "denied",
    },
  },
  {
    routeFamilyRef: "route-family:resilience-restore",
    routePath: "/ops/resilience/restore",
    artifactClass: "backup_report",
    label: "Restore and backup report",
    consequence: "Restore action is recovery-only and cannot widen tenant or environment scope.",
    audienceTierRef: "audience-tier:resilience-lead",
    baseStates: {
      ordinary: "diagnostic",
      elevated: "denied",
      break_glass: "denied",
      recovery_only: "recovery",
      export: "masked",
      approval: "frozen",
      admin: "denied",
    },
  },
  {
    routeFamilyRef: "route-family:records-disposition",
    routePath: "/ops/governance/records/disposition",
    artifactClass: "records_disposition",
    label: "Records disposition",
    consequence: "Disposition visibility is metadata-first; delete or export remains out of scope.",
    audienceTierRef: "audience-tier:records-governance",
    baseStates: {
      ordinary: "diagnostic",
      elevated: "denied",
      break_glass: "denied",
      recovery_only: "recovery",
      export: "denied",
      approval: "frozen",
      admin: "denied",
    },
  },
  {
    routeFamilyRef: "route-family:conformance-signoff",
    routePath: "/ops/governance/conformance",
    artifactClass: "conformance_scorecard",
    label: "Cross-phase conformance signoff",
    consequence: "BAU signoff is diagnostic-only until every referenced scorecard row is exact.",
    audienceTierRef: "audience-tier:service-owner",
    baseStates: {
      ordinary: "diagnostic",
      elevated: "diagnostic",
      break_glass: "denied",
      recovery_only: "recovery",
      export: "frozen",
      approval: "frozen",
      admin: "denied",
    },
  },
] as const;

const personas = [
  {
    personaRef: "persona:governance-leader",
    personaLabel: "Governance leader",
    subjectRef: "staff:synthetic-governance-leader",
    decision: "conditional",
  },
  {
    personaRef: "persona:incident-commander",
    personaLabel: "Incident commander",
    subjectRef: "staff:synthetic-incident-commander",
    decision: "conditional",
  },
  {
    personaRef: "persona:assurance-auditor",
    personaLabel: "Assurance auditor",
    subjectRef: "staff:synthetic-assurance-auditor",
    decision: "conditional",
  },
  {
    personaRef: "persona:service-owner-denied",
    personaLabel: "Service owner outside scope",
    subjectRef: "staff:synthetic-service-owner-outside-scope",
    decision: "deny",
  },
] as const satisfies readonly {
  readonly personaRef: string;
  readonly personaLabel: string;
  readonly subjectRef: string;
  readonly decision: AccessPreviewDecision;
}[];

function titleCase(value: string): string {
  return value
    .split(/[_:-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function stateLabel(state: RoleScopeCapabilityState): RoleGrantMatrixCellProjection["stateLabel"] {
  switch (state) {
    case "live":
      return "Live";
    case "diagnostic":
      return "Diagnostic";
    case "recovery":
      return "Recovery";
    case "denied":
      return "Denied";
    case "frozen":
      return "Frozen";
    case "masked":
      return "Masked";
  }
}

function shapeForState(
  state: RoleScopeCapabilityState,
): RoleGrantMatrixCellProjection["iconShape"] {
  switch (state) {
    case "live":
      return "circle";
    case "diagnostic":
      return "square";
    case "recovery":
      return "diamond";
    case "denied":
      return "slash";
    case "frozen":
      return "lock";
    case "masked":
      return "bar";
  }
}

function normalizeColumnState(
  baseState: RoleScopeCapabilityState,
  columnRef: RoleScopeCapabilityColumnRef,
  scenarioState: RoleScopeStudioScenarioState,
): RoleScopeCapabilityState {
  if (scenarioState === "permission_denied") {
    return baseState === "recovery" ? "recovery" : "denied";
  }
  if (scenarioState === "blocked") {
    return baseState === "masked" ? "masked" : "denied";
  }
  if (scenarioState === "frozen") {
    return ["export", "approval", "admin"].includes(columnRef) ? "frozen" : baseState;
  }
  if (scenarioState === "stale") {
    return baseState === "live" ? "diagnostic" : baseState;
  }
  if (scenarioState === "degraded") {
    return baseState === "live" ? "diagnostic" : baseState;
  }
  if (scenarioState === "settlement_pending") {
    return baseState === "live" ? "diagnostic" : baseState;
  }
  if (scenarioState === "masked" && baseState === "live") {
    return "masked";
  }
  return baseState;
}

function bindingStateForScenario(
  scenarioState: RoleScopeStudioScenarioState,
): RoleScopeBindingState {
  switch (scenarioState) {
    case "stale":
      return "stale_review";
    case "degraded":
      return "degraded_read_only";
    case "blocked":
      return "blocked";
    case "permission_denied":
      return "permission_denied";
    case "settlement_pending":
      return "settlement_pending";
    case "frozen":
      return "release_frozen";
    default:
      return "live";
  }
}

function actionStateForScenario(
  scenarioState: RoleScopeStudioScenarioState,
): RoleScopeActionControlState {
  switch (scenarioState) {
    case "stale":
      return "diagnostic_only";
    case "degraded":
      return "diagnostic_only";
    case "blocked":
      return "blocked";
    case "permission_denied":
      return "metadata_only";
    case "settlement_pending":
      return "settlement_pending";
    case "frozen":
      return "frozen";
    default:
      return "preview_only";
  }
}

function previewStateForScenario(scenarioState: RoleScopeStudioScenarioState): AccessPreviewState {
  switch (scenarioState) {
    case "permission_denied":
      return "denied";
    case "settlement_pending":
      return "pending_settlement";
    case "normal":
      return "live";
    default:
      return scenarioState;
  }
}

function routeModeForPath(routePath: string): RoleScopeRouteMode {
  if (routePath === "/ops/access/roles") return "access_roles";
  if (routePath === "/ops/access/reviews") return "access_reviews";
  if (routePath === "/ops/access/users") return "access_users";
  return "role_scope_studio";
}

export function normalizeRoleScopeStudioScenarioState(
  value: string | null | undefined,
): RoleScopeStudioScenarioState {
  const normalized = (value ?? "normal").toLowerCase().replace(/-/g, "_");
  if (
    [
      "normal",
      "empty",
      "stale",
      "degraded",
      "blocked",
      "permission_denied",
      "settlement_pending",
      "frozen",
      "masked",
    ].includes(normalized)
  ) {
    return normalized as RoleScopeStudioScenarioState;
  }
  return "normal";
}

function selectRouteFamily(selectedRouteFamilyRef?: string) {
  return (
    routeFamilies.find((row) => row.routeFamilyRef === selectedRouteFamilyRef) ?? routeFamilies[0]
  );
}

function selectPersona(selectedPersonaRef?: string, scenarioState?: RoleScopeStudioScenarioState) {
  if (scenarioState === "permission_denied") {
    return personas[3];
  }
  return personas.find((persona) => persona.personaRef === selectedPersonaRef) ?? personas[0];
}

function createMatrix(
  scenarioState: RoleScopeStudioScenarioState,
  selectedRouteFamilyRef: string,
): RoleGrantMatrixProjection {
  const selectedRoute = selectRouteFamily(selectedRouteFamilyRef);
  const rows =
    scenarioState === "empty"
      ? []
      : routeFamilies.map((route) => ({
          routeFamilyRef: route.routeFamilyRef,
          routePath: route.routePath,
          artifactClass: route.artifactClass,
          label: route.label,
          consequence: route.consequence,
          audienceTierRef: route.audienceTierRef,
          selected: route.routeFamilyRef === selectedRoute.routeFamilyRef,
          cells: capabilityColumns.map((column) => {
            const baseState = route.baseStates[column.columnRef];
            const state = normalizeColumnState(baseState, column.columnRef, scenarioState);
            const deniedActionRef =
              state === "denied" || state === "frozen"
                ? `denied:${route.routeFamilyRef}:${column.columnRef}`
                : null;
            return {
              columnRef: column.columnRef,
              state,
              stateLabel: stateLabel(state),
              iconShape: shapeForState(state),
              explanation:
                state === "live"
                  ? "Canonical authorization allows this previewed action in the current tuple."
                  : state === "diagnostic"
                    ? "Visible for analysis only; no mutation or outbound artifact may start here."
                    : state === "recovery"
                      ? "Recovery authority is bounded to continuity or restore posture."
                      : state === "masked"
                        ? "Visible surface is redacted through the visibility envelope."
                        : state === "frozen"
                          ? "Release or graph freeze suppresses the live control."
                          : "The current acting scope tuple does not satisfy this predicate.",
              sourceObjectRef: `authority:${route.routeFamilyRef}:${column.columnRef}`,
              authorityRef: "phase5-acting-context-visibility-kernel",
              deniedActionRef,
              mutableControlState: "not_mutable_in_preview",
            } satisfies RoleGrantMatrixCellProjection;
          }),
        }));

  return {
    roleRef: "role:governance-scope-reviewer",
    roleLabel: "Governance scope reviewer",
    rolePackageRef: "role-package:458:R-31",
    capabilityColumns,
    rows,
    selectedRouteFamilyRef: selectedRoute.routeFamilyRef,
    selectedRoutePath: selectedRoute.routePath,
    matrixSourceRef: "AccessAdministrationWorkspace:phase9:458",
    emptyStateReason:
      scenarioState === "empty"
        ? "No role-scope rows are admitted for the current tenant, organisation, purpose, and policy plane."
        : null,
  };
}

function createScopeRibbon(
  scenarioState: RoleScopeStudioScenarioState,
): GovernanceScopeRibbonProjection {
  const actionState = actionStateForScenario(scenarioState);
  return {
    tenantRef: "tenant:north-river-ics",
    tenantLabel: "North River ICS",
    organisationRef: "organisation:north-river-governance",
    organisationLabel: "North River governance office",
    environmentRef: "environment:pre-release",
    purposeOfUseRef: "purpose:direct-care-network-coordination",
    purposeLabel: "Direct care network coordination",
    actingRoleRef: "role:governance-scope-reviewer",
    actingRoleLabel: "Governance scope reviewer",
    elevationState:
      scenarioState === "blocked"
        ? "expired"
        : scenarioState === "permission_denied"
          ? "none"
          : "just_in_time",
    governanceScopeTokenRef: "GovernanceScopeToken:gst_458_role_scope",
    actingScopeTupleRef: "ActingScopeTuple:ast_458_north_river_current",
    scopeTupleHash:
      scenarioState === "stale"
        ? "sha256:458-stale-scope-tuple-4fd903"
        : "sha256:458-current-scope-tuple-91c7a2",
    policyPlaneRef: "policy-plane:phase9:access-governance",
    runtimePublicationState:
      scenarioState === "blocked" || scenarioState === "permission_denied"
        ? "blocked"
        : scenarioState === "degraded"
          ? "degraded"
          : scenarioState === "settlement_pending" || scenarioState === "frozen"
            ? "buffered"
            : "published_exact",
    releaseFreezeVerdict:
      scenarioState === "stale"
        ? "stale_review"
        : scenarioState === "frozen"
          ? "approval_blocked"
          : scenarioState === "degraded"
            ? "diagnostic_only"
            : scenarioState === "blocked" || scenarioState === "permission_denied"
              ? "approval_blocked"
              : scenarioState === "settlement_pending"
                ? "recovery_only"
                : "no_active_freeze",
    staleState:
      scenarioState === "stale"
        ? "stale"
        : scenarioState === "permission_denied"
          ? "metadata_only"
          : "current",
    writeState: actionState,
    sourceObjectRefs: [
      "phase0:ActingScopeTuple",
      "phase0:GovernanceScopeToken",
      "platform-admin:AccessAdministrationWorkspace",
      "phase9:ReleaseApprovalFreeze",
    ],
    gapArtifactRef: ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF,
  };
}

function createAccessPreview(
  scenarioState: RoleScopeStudioScenarioState,
  selectedRouteFamilyRef: string,
  selectedPersonaRef?: string,
): EffectiveAccessPreviewProjection {
  const route = selectRouteFamily(selectedRouteFamilyRef);
  const persona = selectPersona(selectedPersonaRef, scenarioState);
  const previewState = previewStateForScenario(scenarioState);
  const decision =
    scenarioState === "permission_denied" || scenarioState === "blocked"
      ? "deny"
      : persona.decision;

  return {
    subjectRef: persona.subjectRef,
    personaRef: persona.personaRef,
    personaLabel: persona.personaLabel,
    tenantRef: "tenant:north-river-ics",
    organisationRef: "organisation:north-river-governance",
    staffIdentityContextRef: `StaffIdentityContext:${persona.subjectRef}:synthetic`,
    actingContextRef: "ActingContext:ctx_458_governance_review",
    actingScopeTupleRef: "ActingScopeTuple:ast_458_north_river_current",
    scopeTupleHash:
      scenarioState === "stale"
        ? "sha256:458-stale-scope-tuple-4fd903"
        : "sha256:458-current-scope-tuple-91c7a2",
    policyPlaneRef: "policy-plane:phase9:access-governance",
    objectTypeRef: route.artifactClass,
    purposeOfUseRef: "purpose:direct-care-network-coordination",
    elevationState:
      persona.personaRef === "persona:incident-commander" ? "break_glass" : "just_in_time",
    decision,
    previewState,
    decisionReasonRefs:
      decision === "deny"
        ? [
            "decision-reason:scope-tuple-mismatch",
            "decision-reason:minimum-necessary-not-satisfied",
          ]
        : [
            "decision-reason:governance-scope-token-current",
            "decision-reason:visibility-envelope-applied",
          ],
    expiringGrantRefs:
      scenarioState === "permission_denied" ? [] : ["grant:jit:expires-2026-04-28T17:00Z"],
    visibilityImpactSummary:
      decision === "deny"
        ? "Only metadata labels and denial predicates are visible for this persona."
        : previewState === "masked"
          ? "Sensitive example fields are semantically masked and telemetry-safe."
          : "Visible panels are bounded by audience tier and minimum necessary policy.",
    visiblePanels:
      decision === "deny"
        ? ["denied-action-explainer", "scope-tuple-inspector"]
        : ["route posture", "safe metadata", "freeze cards", "return context"],
    maskedFields:
      decision === "deny"
        ? ["Synthetic patient identifier", "Synthetic incident synopsis"]
        : ["Synthetic patient identifier", "Synthetic backup scope"],
    hiddenFields:
      decision === "deny"
        ? ["Artifact fragment", "Route parameter", "Investigation key"]
        : ["Raw incident note", "Raw record title"],
    exportBlockedDestinationControls: [
      "Assurance pack export",
      "Conformance signoff download",
      "Backup report external handoff",
    ],
    artifactMode: decision === "deny" ? "metadata_only" : "synthetic_preview",
    breakGlassPolicyRef: "BreakGlassPolicy:bgp_458_scope_review",
    reviewBurdenState:
      persona.personaRef === "persona:incident-commander"
        ? "independent_review_required"
        : "follow_up_required",
    activeExceptionalAccessRef:
      persona.personaRef === "persona:incident-commander"
        ? "ExceptionalAccess:synthetic-incident-review"
        : null,
    relatedAuditRefs: ["WORMAuditEvent:458-preview-entered", "WORMAuditEvent:458-fence-applied"],
    telemetryPreview: [
      {
        eventName: "role_scope_preview.changed",
        safeDescriptorHash: "sha256:458-preview-safe-descriptor-9ab31d",
        payload: {
          routeFamilyRef: route.routeFamilyRef,
          personaRef: persona.personaRef,
          scopeTupleHash: "sha256:458-current-scope-tuple-91c7a2",
          redactionClass: decision === "deny" ? "metadata_only" : "synthetic_masked",
        },
      },
    ],
  };
}

function createMaskProjection(
  scenarioState: RoleScopeStudioScenarioState,
): AccessPreviewArtifactMaskProjection {
  const masked = scenarioState === "masked" || scenarioState === "permission_denied";
  return {
    artifactClass: "synthetic_patient_incident_artifact",
    artifactLabel: "Synthetic governed artifact preview",
    beforeRegions: [
      {
        regionRef: "region:patient-identifier",
        fieldLabel: "Synthetic patient identifier",
        exposureState: "visible",
        semanticText: "Synthetic patient identifier visible before applying persona mask.",
        domText: "Synthetic patient identifier",
        ariaName: "Synthetic patient identifier visibility before mask",
        telemetryValue: "field:synthetic-patient-identifier",
        screenshotToken: "visible-field",
      },
      {
        regionRef: "region:incident-synopsis",
        fieldLabel: "Synthetic incident synopsis",
        exposureState: "visible",
        semanticText: "Synthetic incident synopsis visible before applying persona mask.",
        domText: "Synthetic incident synopsis",
        ariaName: "Synthetic incident synopsis visibility before mask",
        telemetryValue: "field:synthetic-incident-synopsis",
        screenshotToken: "visible-field",
      },
      {
        regionRef: "region:external-export-control",
        fieldLabel: "External artifact destination",
        exposureState: "export_blocked",
        semanticText: "Export destination remains blocked before and after the preview.",
        domText: "Export blocked",
        ariaName: "External destination export blocked",
        telemetryValue: "export:blocked",
        screenshotToken: "export-blocked",
      },
    ],
    afterRegions: [
      {
        regionRef: "region:patient-identifier",
        fieldLabel: "Synthetic patient identifier",
        exposureState: masked ? "masked" : "masked",
        semanticText: "Masked by audience tier and minimum necessary policy.",
        domText: "Masked synthetic patient identifier",
        ariaName: "Masked synthetic patient identifier",
        telemetryValue: "masked:field-hash-458-01",
        screenshotToken: "masked-field",
      },
      {
        regionRef: "region:incident-synopsis",
        fieldLabel: "Synthetic incident synopsis",
        exposureState: "masked",
        semanticText: "Masked by incident visibility envelope.",
        domText: "Masked synthetic incident synopsis",
        ariaName: "Masked synthetic incident synopsis",
        telemetryValue: "masked:field-hash-458-02",
        screenshotToken: "masked-field",
      },
      {
        regionRef: "region:raw-artifact-fragment",
        fieldLabel: "Raw artifact fragment",
        exposureState: "hidden",
        semanticText: "Hidden field is absent from preview DOM and telemetry.",
        domText: "",
        ariaName: "",
        telemetryValue: "omitted",
        screenshotToken: "not-rendered",
      },
      {
        regionRef: "region:external-export-control",
        fieldLabel: "External artifact destination",
        exposureState: "export_blocked",
        semanticText: "External export requires OutboundNavigationGrant and is unavailable here.",
        domText: "Export blocked by OutboundNavigationGrant",
        ariaName: "External destination export blocked by outbound grant",
        telemetryValue: "export:blocked",
        screenshotToken: "export-blocked",
      },
    ],
    maskPolicyRef: "VisibilityEnvelope:ve_458_minimum_necessary",
    hiddenFieldsNotRendered: true,
    telemetryRedacted: true,
    syntheticFixtureOnly: true,
  };
}

function createBreakGlassSummary(
  scenarioState: RoleScopeStudioScenarioState,
  selectedPersonaRef?: string,
): BreakGlassElevationSummaryProjection {
  const persona = selectPersona(selectedPersonaRef, scenarioState);
  const active = persona.personaRef === "persona:incident-commander";
  return {
    eligibilityState:
      scenarioState === "blocked" || scenarioState === "permission_denied"
        ? "not_eligible"
        : active
          ? "eligible"
          : "review_only",
    reasonAdequacyState: active ? "adequate" : "not_applicable",
    scopeWideningSummary: active
      ? "Incident route widens to recovery metadata only; patient-bearing examples stay masked."
      : "No break-glass widening is active for the selected persona.",
    expiresAt: active ? "2026-04-28T17:00:00Z" : null,
    followUpBurden: active
      ? "Independent follow-up review and audit trace required before BAU signoff."
      : "No exceptional-access follow-up is due unless elevation is requested in the authorized flow.",
    reviewState: active ? "active" : scenarioState === "blocked" ? "blocked" : "not_invoked",
    breakGlassPolicyRef: "BreakGlassPolicy:bgp_458_scope_review",
    elevationRequestRef: active ? "ScopedElevationRequest:ser_458_incident" : null,
    sourceObjectRefs: [
      "phase0:BreakGlassEligibilityRecord",
      "phase0:ScopedElevationRequest",
      "phase9:AccessReviewDecision",
    ],
  };
}

function createReleaseFreezeCards(
  scenarioState: RoleScopeStudioScenarioState,
): readonly ReleaseFreezeCardProjection[] {
  const freezeStatus: ReleaseFreezeCardStatus =
    scenarioState === "frozen" || scenarioState === "blocked"
      ? "frozen"
      : scenarioState === "settlement_pending"
        ? "recovery_only"
        : scenarioState === "degraded" || scenarioState === "stale"
          ? "diagnostic_only"
          : "live";
  return [
    {
      releaseFreezeCardRef: "freeze-card:channel:458",
      freezeKind: "channel_freeze",
      title: "Channel release freeze",
      status: scenarioState === "normal" || scenarioState === "masked" ? "live" : freezeStatus,
      beganAt: "2026-04-28T08:10:00Z",
      affects: ["NHS App channel", "workspace channel", "governance shell"],
      releaseCondition: "ChannelReleaseFreezeRecord settles against the same wave tuple.",
      downgradedActions: ["approve_role", "export_preview"],
      sourceObjectRef: "ChannelReleaseFreezeRecord:crf_458_channel",
      tupleHash: "sha256:458-channel-freeze-21aa",
    },
    {
      releaseFreezeCardRef: "freeze-card:config:458",
      freezeKind: "config_freeze",
      title: "Config freeze",
      status: freezeStatus,
      beganAt: "2026-04-28T08:12:00Z",
      affects: ["policy bundle", "role package", "promotion approval"],
      releaseCondition: "ConfigCompilationRecord and ConfigSimulationEnvelope both settle.",
      downgradedActions: ["approve_role", "open_change_envelope"],
      sourceObjectRef: "ReleaseApprovalFreeze:raf_458_config",
      tupleHash: "sha256:458-config-freeze-11bc",
    },
    {
      releaseFreezeCardRef: "freeze-card:standards:458",
      freezeKind: "standards_watchlist",
      title: "Standards watchlist block",
      status:
        scenarioState === "normal" || scenarioState === "masked" ? "diagnostic_only" : "blocked",
      beganAt: "2026-04-28T08:16:00Z",
      affects: ["assurance pack export", "BAU signoff"],
      releaseCondition: "StandardsDependencyWatchlist has no blocking findings.",
      downgradedActions: ["export_preview"],
      sourceObjectRef: "StandardsDependencyWatchlist:sdw_448_access",
      tupleHash: "sha256:458-standards-watch-41ab",
    },
    {
      releaseFreezeCardRef: "freeze-card:recovery:458",
      freezeKind: "recovery_only",
      title: "Recovery-only posture",
      status: scenarioState === "settlement_pending" ? "recovery_only" : "diagnostic_only",
      beganAt: "2026-04-28T08:20:00Z",
      affects: ["restore action", "backup report", "incident command"],
      releaseCondition: "RecoveryDispositionRecord returns to live with current tuple hash.",
      downgradedActions: ["approve_role", "admin"],
      sourceObjectRef: "RecoveryDispositionRecord:rdr_458_restore",
      tupleHash: "sha256:458-recovery-only-09da",
    },
    {
      releaseFreezeCardRef: "freeze-card:assurance-graph:458",
      freezeKind: "assurance_graph",
      title: "Assurance graph block",
      status:
        scenarioState === "normal" || scenarioState === "masked" ? "diagnostic_only" : "blocked",
      beganAt: "2026-04-28T08:23:00Z",
      affects: ["approval", "export", "conformance signoff"],
      releaseCondition: "Assurance graph completeness verdict is exact.",
      downgradedActions: ["approve_role", "export_preview"],
      sourceObjectRef: "AssuranceGraphCompletenessVerdict:agv_458",
      tupleHash: "sha256:458-assurance-graph-74ca",
    },
    {
      releaseFreezeCardRef: "freeze-card:incident-command:458",
      freezeKind: "incident_command",
      title: "Active incident command freeze",
      status: scenarioState === "blocked" ? "blocked" : "diagnostic_only",
      beganAt: "2026-04-28T08:27:00Z",
      affects: ["incident action", "break-glass follow-up"],
      releaseCondition: "Incident command freeze releases after post-incident review settlement.",
      downgradedActions: ["break_glass", "approval"],
      sourceObjectRef: "IncidentCommandFreeze:icf_458",
      tupleHash: "sha256:458-incident-command-88cd",
    },
  ];
}

function createDeniedExplainers(
  actionControlState: RoleScopeActionControlState,
): readonly DeniedActionExplainerProjection[] {
  return [
    {
      actionRef: "approve_role",
      actionLabel: "Approve role package",
      sourceObjectRef: "ReleaseApprovalFreeze:raf_458_config",
      failedPredicate: "releaseFreezeVerdict must be no_active_freeze and graph verdict exact",
      consequence: "Approval remains unavailable; the studio is preview-only.",
      nextSafeAction: "Open the authorized change-envelope flow after freeze settlement.",
      controlState: actionControlState,
    },
    {
      actionRef: "export_preview",
      actionLabel: "Export preview artifact",
      sourceObjectRef: "OutboundNavigationGrant:ong_458_missing",
      failedPredicate: "outboundArtifactGrant must bind the same scope tuple and destination",
      consequence: "No external destination control is rendered from this preview.",
      nextSafeAction: "Request an outbound navigation grant in the existing assurance export flow.",
      controlState: actionControlState,
    },
    {
      actionRef: "break_glass",
      actionLabel: "Invoke break-glass",
      sourceObjectRef: "BreakGlassEligibilityRecord:bge_458",
      failedPredicate: "reasonAdequacy, expiry, and follow-up burden must be settled",
      consequence: "Break-glass is not presented as a role toggle.",
      nextSafeAction: "Use the authorized elevation request route with independent review.",
      controlState: actionControlState,
    },
  ];
}

function createActions(
  actionControlState: RoleScopeActionControlState,
): RoleScopeStudioActionProjection[] {
  return [
    {
      actionType: "open_change_envelope",
      label: "Open change envelope",
      allowed: actionControlState === "preview_only",
      controlState: actionControlState,
      disabledReason:
        actionControlState === "preview_only"
          ? ""
          : "Change envelopes are unavailable until the current tuple, freeze, and settlement state are exact.",
      settlementRef: "AdminActionSettlement:aas_458_change_envelope",
    },
    {
      actionType: "request_revalidation",
      label: "Request revalidation",
      allowed:
        actionControlState === "diagnostic_only" ||
        actionControlState === "settlement_pending" ||
        actionControlState === "frozen",
      controlState: actionControlState,
      disabledReason:
        actionControlState === "preview_only"
          ? "The current tuple is already exact."
          : "Revalidation is the only admitted action in this state.",
      settlementRef: "AdminActionSettlement:aas_458_revalidate",
    },
    {
      actionType: "export_preview",
      label: "Export preview",
      allowed: false,
      controlState: actionControlState,
      disabledReason:
        "Preview export is blocked; an OutboundNavigationGrant is required in the assurance export flow.",
      settlementRef: "AdminActionSettlement:aas_458_export_blocked",
    },
    {
      actionType: "approve_role",
      label: "Approve role",
      allowed: false,
      controlState: actionControlState,
      disabledReason:
        "Role approval cannot start from the preview studio; use the existing authorized change-envelope flow.",
      settlementRef: "AdminActionSettlement:aas_458_approve_blocked",
    },
    {
      actionType: "return_to_origin",
      label: "Return to origin",
      allowed: actionControlState !== "blocked",
      controlState: actionControlState,
      disabledReason:
        actionControlState === "blocked"
          ? "Return context is metadata-only until the scope mismatch is resolved."
          : "",
      settlementRef: "OpsGovernanceHandoff:ogh_458_return",
    },
  ];
}

export function createRoleScopeStudioProjection(
  options: {
    routePath?: string;
    scenarioState?: RoleScopeStudioScenarioState | string | null;
    selectedRouteFamilyRef?: string;
    selectedPersonaRef?: string;
    selectedDeniedActionRef?: string;
  } = {},
): GovernanceRoleScopeStudioProjection {
  const scenarioState = normalizeRoleScopeStudioScenarioState(options.scenarioState);
  const selectedRoute = selectRouteFamily(options.selectedRouteFamilyRef);
  const actionControlState = actionStateForScenario(scenarioState);
  const roleGrantMatrix = createMatrix(scenarioState, selectedRoute.routeFamilyRef);
  const deniedActionExplainers = createDeniedExplainers(actionControlState);
  const selectedDeniedAction =
    deniedActionExplainers.find((item) => item.actionRef === options.selectedDeniedActionRef) ??
    deniedActionExplainers[0]!;

  return {
    taskId: ROLE_SCOPE_STUDIO_TASK_ID,
    schemaVersion: ROLE_SCOPE_STUDIO_SCHEMA_VERSION,
    visualMode: ROLE_SCOPE_STUDIO_VISUAL_MODE,
    route: options.routePath ?? ROLE_SCOPE_STUDIO_ROUTE,
    routeMode: routeModeForPath(options.routePath ?? ROLE_SCOPE_STUDIO_ROUTE),
    scenarioState,
    bindingState: bindingStateForScenario(scenarioState),
    actionControlState,
    surfaceSummary:
      scenarioState === "empty"
        ? "No role-scope entries are admitted for the current governed tuple."
        : `${titleCase(previewStateForScenario(scenarioState))} preview for ${selectedRoute.label}; all mutation claims remain fail-closed.`,
    noLiveMutationControls: true,
    gapArtifactRef: ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF,
    governanceScopeRibbon: createScopeRibbon(scenarioState),
    roleGrantMatrix,
    effectiveAccessPreview: createAccessPreview(
      scenarioState,
      selectedRoute.routeFamilyRef,
      options.selectedPersonaRef,
    ),
    accessPreviewArtifactMask: createMaskProjection(scenarioState),
    breakGlassElevationSummary: createBreakGlassSummary(scenarioState, options.selectedPersonaRef),
    releaseFreezeCards: createReleaseFreezeCards(scenarioState),
    deniedActionExplainers,
    selectedDeniedAction,
    scopeTupleInspector: {
      actingScopeTupleRef: "ActingScopeTuple:ast_458_north_river_current",
      scopeTupleHash:
        scenarioState === "stale"
          ? "sha256:458-stale-scope-tuple-4fd903"
          : "sha256:458-current-scope-tuple-91c7a2",
      governanceScopeTokenRef: "GovernanceScopeToken:gst_458_role_scope",
      routeIntentBindingRef: "RouteIntentBinding:rib_458_access_studio",
      audienceVisibilityCoverageRef: "AudienceVisibilityCoverage:avc_458_governance",
      minimumNecessaryContractRef: "MinimumNecessaryContract:mnc_458_access_preview",
      releaseApprovalFreezeRef: "ReleaseApprovalFreeze:raf_458_config",
      changeBaselineSnapshotRef: "ChangeBaselineSnapshot:cbs_457_tenant_governance",
      sourceKernelRef: "phase5-acting-context-visibility-kernel",
    },
    governanceReturnContextStrip: {
      returnTokenRef: "OpsGovernanceHandoff:ogh_458_role_scope:return-token",
      originRouteRef: "origin:operations-assurance-incident-resilience-records-tenant",
      originLabel:
        "Operations, audit, assurance, incident, resilience, records, and tenant governance handoff",
      originScopeHash: "sha256:458-return-origin-scope-0de39a",
      safeReturnState:
        scenarioState === "permission_denied"
          ? "denied"
          : scenarioState === "settlement_pending"
            ? "pending_settlement"
            : scenarioState === "degraded"
              ? "diagnostic_only"
              : "safe",
      deniedReasonRef:
        scenarioState === "permission_denied" ? "return-denied:scope-token-mismatch" : null,
      returnLabel: "Return to governed origin",
    },
    telemetryDisclosureFence: {
      fenceRef: "UITelemetryDisclosureFence:458:role_scope_preview",
      policyRef: "policy:ui-telemetry-disclosure-fence:phi-recovery",
      allowedPayloadKeys: ["routeFamilyRef", "personaRef", "scopeTupleHash", "redactionClass"],
      blockedPayloadKeys: [
        "sensitiveIdentifierKey",
        "incidentNarrativeKey",
        "routeParameterKey",
        "artifactFragmentKey",
        "backupScopeKey",
      ],
      rawSensitiveTextAbsent: true,
      screenshotFixtureClass: "synthetic_only",
    },
    actionRail: createActions(actionControlState),
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9H",
      "blueprint/phase-0-the-foundation-protocol.md#acting-context",
      "blueprint/platform-admin-and-config-blueprint.md#/ops/access",
      "blueprint/governance-admin-console-frontend-blueprint.md#RoleScopeStudio",
      "blueprint/operations-console-frontend-blueprint.md#OpsGovernanceHandoff",
    ],
    upstreamSchemaVersions: {
      "448": "448.phase9.tenant-config-governance.v1",
      "449": "449.phase9.cross-phase-conformance.v1",
      "457": "457.phase9.tenant-governance-route.v1",
      phase5ActingContextKernel: "phase5-acting-context-visibility-kernel",
    },
    automationAnchors: roleScopeStudioAutomationAnchors,
  };
}

export function createRoleScopeStudioFixture() {
  const scenarioStates = [
    "normal",
    "empty",
    "stale",
    "degraded",
    "blocked",
    "permission_denied",
    "settlement_pending",
    "frozen",
    "masked",
  ] as const satisfies readonly RoleScopeStudioScenarioState[];
  return {
    taskId: ROLE_SCOPE_STUDIO_TASK_ID,
    schemaVersion: ROLE_SCOPE_STUDIO_SCHEMA_VERSION,
    visualMode: ROLE_SCOPE_STUDIO_VISUAL_MODE,
    routes: [ROLE_SCOPE_STUDIO_ROUTE, "/ops/access/roles", "/ops/access/reviews"],
    sourceAlgorithmRefs: createRoleScopeStudioProjection().sourceAlgorithmRefs,
    upstreamSchemaVersions: createRoleScopeStudioProjection().upstreamSchemaVersions,
    automationAnchors: roleScopeStudioAutomationAnchors,
    gapArtifactRef: ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF,
    scenarioProjections: Object.fromEntries(
      scenarioStates.map((scenarioState) => [
        scenarioState,
        createRoleScopeStudioProjection({ scenarioState }),
      ]),
    ) as Record<RoleScopeStudioScenarioState, GovernanceRoleScopeStudioProjection>,
    routeFamilyRefs: routeFamilies.map((route) => route.routeFamilyRef),
    personaRefs: personas.map((persona) => persona.personaRef),
  };
}
