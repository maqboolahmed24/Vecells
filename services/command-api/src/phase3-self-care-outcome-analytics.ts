import { createDeterministicBackboneIdGenerator, type BackboneIdGenerator } from "@vecells/domain-kernel";
import {
  createPhase3SelfCareOutcomeAnalyticsKernelService,
  createPhase3SelfCareOutcomeAnalyticsKernelStore,
  type AdviceFollowUpWatchWindowSnapshot,
  type AdviceOutcomeAnalyticsEventClass,
  type PatientExpectationTemplateConsequenceClass,
  type PatientExpectationTemplateDeliveryMode,
  type PatientExpectationTemplateExpectationClass,
  type Phase3SelfCareOutcomeAnalyticsBundle,
  type Phase3SelfCareOutcomeAnalyticsKernelService,
  type Phase3SelfCareOutcomeAnalyticsRepositories,
  type PublishPatientExpectationTemplateVersionInput,
  type RecordOutcomeAnalyticsInput,
  type ResolvePatientExpectationTemplateInput,
  type ResolvedPatientExpectationTemplate,
  type UpsertAdviceFollowUpWatchWindowInput,
} from "@vecells/domain-triage-workspace";
import {
  createPhase3AdviceAdminDependencyApplication,
  phase3AdviceAdminDependencyMigrationPlanRefs,
  phase3AdviceAdminDependencyPersistenceTables,
  type Phase3AdviceAdminDependencyApplication,
  type Phase3AdviceAdminDependencyApplicationBundle,
} from "./phase3-advice-admin-dependency";
import {
  createPhase3AdviceRenderApplication,
  phase3AdviceRenderMigrationPlanRefs,
  phase3AdviceRenderPersistenceTables,
  type Phase3AdviceRenderApplication,
  type Phase3AdviceRenderApplicationBundle,
} from "./phase3-advice-render-settlement";
import {
  createPhase3AdminResolutionPolicyApplication,
  phase3AdminResolutionPolicyMigrationPlanRefs,
  phase3AdminResolutionPolicyPersistenceTables,
  type Phase3AdminResolutionPolicyApplication,
  type Phase3AdminResolutionPolicyApplicationBundle,
} from "./phase3-admin-resolution-policy";
import {
  createPhase3SelfCareBoundaryApplication,
  phase3SelfCareBoundaryMigrationPlanRefs,
  phase3SelfCareBoundaryPersistenceTables,
  type Phase3SelfCareBoundaryApplication,
  type Phase3SelfCareBoundaryApplicationBundle,
} from "./phase3-self-care-boundary-grants";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Error(`${code}: ${message}`);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function toTitleCase(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const defaultTemplateChannels = [
  "patient_portal",
  "email",
  "sms",
  "clinical_workspace",
] as const;

export const PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SERVICE_NAME =
  "Phase3SelfCareOutcomeAnalyticsApplication";
export const PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SCHEMA_VERSION =
  "253.phase3.self-care-outcome-analytics-and-expectation-templates.v1";
export const PHASE3_SELF_CARE_OUTCOME_ANALYTICS_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/self-care-outcome-analytics",
  "GET /v1/workspace/tasks/{taskId}/follow-up-watch-analytics",
] as const;

export const phase3SelfCareOutcomeAnalyticsRoutes = [
  {
    routeId: "workspace_task_self_care_outcome_analytics_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/self-care-outcome-analytics",
    contractFamily: "SelfCareOutcomeAnalyticsBundleContract",
    purpose:
      "Expose the current expectation-template resolution, typed outcome analytics records, and watch-window analytics linkage for one Phase 3 self-care or bounded-admin task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_follow_up_watch_analytics_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/follow-up-watch-analytics",
    contractFamily: "AdviceFollowUpWatchAnalyticsContract",
    purpose:
      "Expose AdviceFollowUpWatchWindow rows and the typed AdviceUsageAnalyticsRecord chain linked to those windows for the current task.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_publish_patient_expectation_template_version",
    method: "POST",
    path: "/internal/v1/workspace/patient-expectation-templates:publish-version",
    contractFamily: "PublishPatientExpectationTemplateVersionCommandContract",
    purpose:
      "Publish one governed patient expectation template version with explicit channel, locale, readability, accessibility, release, and delivery-mode coverage.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_resolve_patient_expectation_template",
    method: "POST",
    path: "/v1/workspace/tasks/{taskId}:resolve-patient-expectation-template",
    contractFamily: "ResolvePatientExpectationTemplateCommandContract",
    purpose:
      "Resolve the current patient expectation wording against the live self-care or bounded-admin tuple without letting free text drift outside the canonical registry.",
    bodyRequired: true,
    idempotencyRequired: false,
  },
  {
    routeId: "workspace_task_record_advice_outcome_analytics",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:record-advice-outcome-analytics",
    contractFamily: "RecordAdviceOutcomeAnalyticsCommandContract",
    purpose:
      "Record typed self-care outcome analytics and link them to the active AdviceFollowUpWatchWindow without changing operational authority.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
  {
    routeId: "workspace_task_record_admin_outcome_analytics",
    method: "POST",
    path: "/internal/v1/workspace/tasks/{taskId}:record-admin-outcome-analytics",
    contractFamily: "RecordAdminOutcomeAnalyticsCommandContract",
    purpose:
      "Record typed bounded-admin outcome analytics against the current subtype, completion artifact, and expectation-template chain without implying settlement truth.",
    bodyRequired: true,
    idempotencyRequired: true,
  },
] as const;

export const phase3SelfCareOutcomeAnalyticsPersistenceTables = [
  ...new Set([
    ...phase3SelfCareBoundaryPersistenceTables,
    ...phase3AdviceRenderPersistenceTables,
    ...phase3AdminResolutionPolicyPersistenceTables,
    ...phase3AdviceAdminDependencyPersistenceTables,
    "phase3_patient_expectation_templates",
    "phase3_patient_expectation_template_versions",
    "phase3_patient_expectation_template_variants",
    "phase3_advice_follow_up_watch_windows",
    "phase3_advice_usage_analytics_records",
  ]),
] as const;

export const phase3SelfCareOutcomeAnalyticsMigrationPlanRefs = [
  ...new Set([
    ...phase3SelfCareBoundaryMigrationPlanRefs,
    ...phase3AdviceRenderMigrationPlanRefs,
    ...phase3AdminResolutionPolicyMigrationPlanRefs,
    ...phase3AdviceAdminDependencyMigrationPlanRefs,
    "services/command-api/migrations/129_phase3_self_care_outcome_analytics_and_expectation_templates.sql",
  ]),
] as const;

export interface Phase3SelfCareOutcomeAnalyticsApplicationBundle {
  analyticsBundle: Phase3SelfCareOutcomeAnalyticsBundle;
  selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle;
  adviceRenderBundle: Phase3AdviceRenderApplicationBundle | null;
  adminResolutionBundle: Phase3AdminResolutionPolicyApplicationBundle | null;
  dependencyBundle: Phase3AdviceAdminDependencyApplicationBundle | null;
  currentExpectationResolution: ResolvedPatientExpectationTemplate | null;
  currentFollowUpWatchWindow: AdviceFollowUpWatchWindowSnapshot | null;
}

export interface ResolvePatientExpectationTemplateCommandInput {
  taskId: string;
  desiredDeliveryMode?: PatientExpectationTemplateDeliveryMode | null;
  channelRef?: string | null;
  localeRef?: string | null;
  readingLevelRef?: string | null;
  accessibilityVariantRefs?: readonly string[];
}

export interface RecordAdviceOutcomeAnalyticsCommandInput {
  taskId: string;
  eventClass: AdviceOutcomeAnalyticsEventClass;
  eventOccurredAt: string;
  recordedAt: string;
  reasonCodeRefs?: readonly string[];
  watchStartAt?: string | null;
  watchUntil?: string | null;
  recontactThresholdRef?: string | null;
  escalationThresholdRef?: string | null;
  rollbackReviewState?: "none" | "pending" | "recommended" | "completed";
  watchRevision?: number | null;
  assuranceSliceTrustRefs?: readonly string[];
  watchState?: "monitoring" | "review_required" | "rollback_recommended" | "closed";
  latestReviewOutcomeRef?: string | null;
}

export interface RecordAdminOutcomeAnalyticsCommandInput {
  taskId: string;
  eventClass: AdviceOutcomeAnalyticsEventClass;
  eventOccurredAt: string;
  recordedAt: string;
  reasonCodeRefs?: readonly string[];
}

interface ExpectationTargetContext {
  taskId: string;
  requestRef: string;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  decisionEpochRef: string;
  consequenceClass: PatientExpectationTemplateConsequenceClass;
  expectationClass: PatientExpectationTemplateExpectationClass;
  patientExpectationTemplateRef: string;
  advicePathwayRef: string | null;
  adminResolutionSubtypeRef: string | null;
  adviceBundleVersionRef: string | null;
  adviceVariantSetRef: string | null;
  adminResolutionCaseRef: string | null;
  completionArtifactRef: string | null;
  bindingRuleRef: string;
  policyBundleRef: string;
  channelRef: string;
  localeRef: string;
  readingLevelRef: string | null;
  accessibilityVariantRefs: readonly string[];
  audienceTierRef: string;
  desiredDeliveryMode: PatientExpectationTemplateDeliveryMode;
  releaseState: string;
  visibilityTier: string;
  summarySafetyTier: string;
  reasonCodeRefs: readonly string[];
}

function deriveBlockedTemplateRef(
  consequenceClass: PatientExpectationTemplateConsequenceClass,
): string {
  return `patient_expectation_template.blocked_recovery.${consequenceClass}`;
}

function deriveSelfCareTemplateRef(pathwayRef: string | null): string {
  return `patient_expectation_template.self_care.${pathwayRef ?? "default"}`;
}

function deriveWaitingTemplateRef(input: {
  currentCase:
    | Phase3AdminResolutionPolicyApplicationBundle["adminResolutionBundle"]["currentAdminResolutionCase"]
    | null;
  currentProfile:
    | Phase3AdminResolutionPolicyApplicationBundle["adminResolutionBundle"]["currentSubtypeProfile"]
    | null;
}): string {
  const currentCase = input.currentCase;
  const currentProfile = input.currentProfile;
  if (!currentCase || !currentProfile) {
    return "patient_expectation_template.admin.default";
  }
  if (currentCase.waitingState !== "none") {
    const matchingWaitingPolicy = currentProfile.waitingPolicies.find(
      (policy) =>
        policy.waitingState === currentCase.waitingState &&
        (currentCase.waitingReasonCodeRef === null ||
          policy.allowedReasonCodeRefs.includes(currentCase.waitingReasonCodeRef)),
    );
    if (matchingWaitingPolicy) {
      return matchingWaitingPolicy.patientExpectationTemplateRef;
    }
  }
  return currentProfile.patientExpectationTemplateRef;
}

function deriveExpectationClass(
  templateRef: string,
  consequenceClass: PatientExpectationTemplateConsequenceClass,
): PatientExpectationTemplateExpectationClass {
  if (templateRef.includes("blocked_recovery")) {
    return "blocked_recovery";
  }
  if (consequenceClass === "self_care") {
    return templateRef.includes("safety") ? "self_care_safety_net" : "self_care_guidance";
  }
  if (consequenceClass === "admin_resolution_completion") {
    return "admin_completion";
  }
  return "admin_waiting";
}

function createCanonicalTemplateCopy(target: ExpectationTargetContext): {
  headlineText: string;
  bodyText: string;
  nextStepText: string;
  safetyNetText: string;
  placeholderText: string;
} {
  const pathwayLabel =
    target.advicePathwayRef !== null ? toTitleCase(target.advicePathwayRef) : "this request";
  const subtypeLabel =
    target.adminResolutionSubtypeRef !== null
      ? toTitleCase(target.adminResolutionSubtypeRef)
      : "this update";
  if (target.expectationClass === "blocked_recovery") {
    return {
      headlineText: "We are holding the next-step detail",
      bodyText:
        "The current follow-up needs a fresh review before we can show the full next-step wording.",
      nextStepText: "Use the recovery path in the same shell to refresh the current decision.",
      safetyNetText:
        "If the situation worsens or new symptoms appear, seek urgent help through the usual route.",
      placeholderText: "A short recovery summary is available while the full wording stays protected.",
    };
  }
  if (target.consequenceClass === "self_care") {
    return {
      headlineText: `Next steps for ${pathwayLabel}`,
      bodyText: `The current review keeps this in guided self-care for ${pathwayLabel}.`,
      nextStepText: "Follow the steps in this plan and come back through the same request if it changes.",
      safetyNetText:
        "Seek help again sooner if symptoms worsen, the problem spreads, or you feel unsafe waiting.",
      placeholderText: "A short self-care summary is available while full guidance stays protected.",
    };
  }
  if (target.consequenceClass === "admin_resolution_completion") {
    return {
      headlineText: `${subtypeLabel} is complete`,
      bodyText: `The latest ${subtypeLabel.toLowerCase()} step has been completed and recorded.`,
      nextStepText: "Keep this summary for reference. We will contact you again only if a follow-up is needed.",
      safetyNetText:
        "If the outcome is wrong or circumstances change, reopen the same request instead of starting a detached follow-up.",
      placeholderText: "A short completion summary is available while the full detail stays protected.",
    };
  }
  return {
    headlineText: `${subtypeLabel} is in progress`,
    bodyText: `The current ${subtypeLabel.toLowerCase()} work is still active and being tracked.`,
    nextStepText: "You do not need to repeat the request right now. We will update this summary when the next step changes.",
    safetyNetText:
      "If your contact route changes or you need to add new information, use the same request rather than sending a detached update.",
    placeholderText: "A short waiting summary is available while the full detail stays protected.",
  };
}

function buildCanonicalTemplateVersionInput(
  target: ExpectationTargetContext,
): PublishPatientExpectationTemplateVersionInput {
  const copy = createCanonicalTemplateCopy(target);
  const channels = uniqueSorted([target.channelRef, ...defaultTemplateChannels]);
  const locales = uniqueSorted([target.localeRef, "en-GB"]);
  const variants = channels.flatMap((channelRef) =>
    locales.flatMap((localeRef) => [
      {
        deliveryMode: "full" as const,
        channelRef,
        localeRef,
        readingLevelRef: target.readingLevelRef,
        accessibilityVariantRefs: target.accessibilityVariantRefs,
        audienceTierRefs: [target.audienceTierRef],
        releaseStateRefs: ["current"],
        visibilityTier: target.visibilityTier,
        summarySafetyTier: target.summarySafetyTier,
        renderInputRef: `${target.patientExpectationTemplateRef}.full.${channelRef}.${localeRef}`,
        headlineText: copy.headlineText,
        bodyText: copy.bodyText,
        nextStepText: copy.nextStepText,
        safetyNetText: copy.safetyNetText,
        placeholderText: copy.placeholderText,
      },
      {
        deliveryMode: "summary_safe" as const,
        channelRef,
        localeRef,
        readingLevelRef: target.readingLevelRef,
        accessibilityVariantRefs: target.accessibilityVariantRefs,
        audienceTierRefs: [target.audienceTierRef],
        releaseStateRefs: ["current", "degraded"],
        visibilityTier: target.visibilityTier,
        summarySafetyTier: target.summarySafetyTier,
        renderInputRef: `${target.patientExpectationTemplateRef}.summary.${channelRef}.${localeRef}`,
        headlineText: copy.headlineText,
        bodyText: copy.placeholderText,
        nextStepText: copy.nextStepText,
        safetyNetText: copy.safetyNetText,
        placeholderText: copy.placeholderText,
      },
      {
        deliveryMode: "placeholder_safe" as const,
        channelRef,
        localeRef,
        readingLevelRef: target.readingLevelRef,
        accessibilityVariantRefs: target.accessibilityVariantRefs,
        audienceTierRefs: [target.audienceTierRef],
        releaseStateRefs: ["current", "degraded", "quarantined"],
        visibilityTier: target.visibilityTier,
        summarySafetyTier: target.summarySafetyTier,
        renderInputRef: `${target.patientExpectationTemplateRef}.placeholder.${channelRef}.${localeRef}`,
        headlineText: copy.headlineText,
        bodyText: copy.placeholderText,
        nextStepText: "Use the same shell if the status changes.",
        safetyNetText: copy.safetyNetText,
        placeholderText: copy.placeholderText,
      },
    ]),
  );
  return {
    patientExpectationTemplateRef: target.patientExpectationTemplateRef,
    expectationClass: target.expectationClass,
    allowedConsequenceClasses: [target.consequenceClass],
    advicePathwayRef: target.advicePathwayRef,
    adminResolutionSubtypeRef: target.adminResolutionSubtypeRef,
    bindingRuleRef: target.bindingRuleRef,
    authoringProvenanceRef: `canonical_template_seed/${target.patientExpectationTemplateRef}`,
    approvalProvenanceRef: "policy_approved_seed/253",
    policyBundleRef: target.policyBundleRef,
    variants,
    publishedAt: "2026-04-17T12:00:00.000Z",
  };
}

export interface Phase3SelfCareOutcomeAnalyticsApplication {
  readonly serviceName: typeof PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_SELF_CARE_OUTCOME_ANALYTICS_QUERY_SURFACES;
  readonly routes: typeof phase3SelfCareOutcomeAnalyticsRoutes;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly adviceRenderApplication: Pick<
    Phase3AdviceRenderApplication,
    "queryTaskAdviceRender"
  >;
  readonly adminResolutionApplication: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  readonly dependencyApplication: Pick<
    Phase3AdviceAdminDependencyApplication,
    "queryTaskAdviceAdminDependency"
  >;
  readonly repositories: Phase3SelfCareOutcomeAnalyticsRepositories;
  readonly service: Phase3SelfCareOutcomeAnalyticsKernelService;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRef: string;
  readonly migrationPlanRefs: readonly string[];
  queryTaskSelfCareOutcomeAnalytics(
    taskId: string,
  ): Promise<Phase3SelfCareOutcomeAnalyticsApplicationBundle | null>;
  publishPatientExpectationTemplateVersion(
    input: PublishPatientExpectationTemplateVersionInput,
  ): Promise<Awaited<ReturnType<Phase3SelfCareOutcomeAnalyticsKernelService["publishPatientExpectationTemplateVersion"]>>>;
  resolvePatientExpectationTemplate(
    input: ResolvePatientExpectationTemplateCommandInput,
  ): Promise<ResolvedPatientExpectationTemplate | null>;
  fetchAdviceFollowUpWatchAnalytics(
    taskId: string,
  ): Promise<Awaited<ReturnType<Phase3SelfCareOutcomeAnalyticsKernelService["fetchAdviceFollowUpWatchAnalytics"]>>>;
  recordAdviceOutcomeAnalytics(
    input: RecordAdviceOutcomeAnalyticsCommandInput,
  ): Promise<Awaited<ReturnType<Phase3SelfCareOutcomeAnalyticsKernelService["recordAdviceOutcomeAnalytics"]>>>;
  recordAdminOutcomeAnalytics(
    input: RecordAdminOutcomeAnalyticsCommandInput,
  ): Promise<Awaited<ReturnType<Phase3SelfCareOutcomeAnalyticsKernelService["recordAdminOutcomeAnalytics"]>>>;
}

class Phase3SelfCareOutcomeAnalyticsApplicationImpl
  implements Phase3SelfCareOutcomeAnalyticsApplication
{
  readonly serviceName = PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SERVICE_NAME;
  readonly schemaVersion = PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SCHEMA_VERSION;
  readonly querySurfaces = PHASE3_SELF_CARE_OUTCOME_ANALYTICS_QUERY_SURFACES;
  readonly routes = phase3SelfCareOutcomeAnalyticsRoutes;
  readonly selfCareBoundaryApplication: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  readonly adviceRenderApplication: Pick<
    Phase3AdviceRenderApplication,
    "queryTaskAdviceRender"
  >;
  readonly adminResolutionApplication: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  readonly dependencyApplication: Pick<
    Phase3AdviceAdminDependencyApplication,
    "queryTaskAdviceAdminDependency"
  >;
  readonly repositories: Phase3SelfCareOutcomeAnalyticsRepositories;
  readonly service: Phase3SelfCareOutcomeAnalyticsKernelService;
  readonly persistenceTables = phase3SelfCareOutcomeAnalyticsPersistenceTables;
  readonly migrationPlanRef = phase3SelfCareOutcomeAnalyticsMigrationPlanRefs.at(-1)!;
  readonly migrationPlanRefs = phase3SelfCareOutcomeAnalyticsMigrationPlanRefs;

  private readonly idGenerator: BackboneIdGenerator;

  constructor(options?: {
    selfCareBoundaryApplication?: Pick<
      Phase3SelfCareBoundaryApplication,
      "queryTaskSelfCareBoundary"
    >;
    adviceRenderApplication?: Pick<
      Phase3AdviceRenderApplication,
      "queryTaskAdviceRender"
    >;
    adminResolutionApplication?: Pick<
      Phase3AdminResolutionPolicyApplication,
      "queryTaskAdminResolution"
    >;
    dependencyApplication?: Pick<
      Phase3AdviceAdminDependencyApplication,
      "queryTaskAdviceAdminDependency"
    >;
    repositories?: Phase3SelfCareOutcomeAnalyticsRepositories;
    idGenerator?: BackboneIdGenerator;
  }) {
    this.idGenerator =
      options?.idGenerator ??
      createDeterministicBackboneIdGenerator(
        "command_api_phase3_self_care_outcome_analytics",
      );
    this.selfCareBoundaryApplication =
      options?.selfCareBoundaryApplication ??
      createPhase3SelfCareBoundaryApplication({
        idGenerator: this.idGenerator,
      });
    this.adviceRenderApplication =
      options?.adviceRenderApplication ??
      createPhase3AdviceRenderApplication({
        idGenerator: this.idGenerator,
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
      });
    this.adminResolutionApplication =
      options?.adminResolutionApplication ??
      createPhase3AdminResolutionPolicyApplication({
        idGenerator: this.idGenerator,
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
      });
    this.dependencyApplication =
      options?.dependencyApplication ??
      createPhase3AdviceAdminDependencyApplication({
        idGenerator: this.idGenerator,
        selfCareBoundaryApplication: this.selfCareBoundaryApplication,
        adviceRenderApplication: this.adviceRenderApplication,
        adminResolutionApplication: this.adminResolutionApplication,
      });
    this.repositories =
      options?.repositories ?? createPhase3SelfCareOutcomeAnalyticsKernelStore();
    this.service = createPhase3SelfCareOutcomeAnalyticsKernelService(this.repositories, {
      idGenerator: this.idGenerator,
    });
  }

  async queryTaskSelfCareOutcomeAnalytics(
    taskId: string,
  ): Promise<Phase3SelfCareOutcomeAnalyticsApplicationBundle | null> {
    const context = await this.resolveTaskContext(taskId);
    if (!context) {
      return null;
    }
    const target = await this.ensureExpectationTargetPublished(context.target);
    const resolution = await this.service.resolvePatientExpectationTemplate({
      patientExpectationTemplateRef: target.patientExpectationTemplateRef,
      consequenceClass: target.consequenceClass,
      channelRef: target.channelRef,
      localeRef: target.localeRef,
      readingLevelRef: target.readingLevelRef,
      accessibilityVariantRefs: target.accessibilityVariantRefs,
      audienceTierRef: target.audienceTierRef,
      desiredDeliveryMode: target.desiredDeliveryMode,
      releaseState: target.releaseState,
    });
    const analyticsBundle = await this.service.queryTaskBundle(taskId);
    const currentFollowUpWatchWindow = analyticsBundle.adviceFollowUpWatchWindows
      .filter(
        (watchWindow) =>
          watchWindow.consequenceClass === target.consequenceClass &&
          watchWindow.boundaryTupleHash === target.boundaryTupleHash &&
          watchWindow.decisionEpochRef === target.decisionEpochRef &&
          (target.adviceBundleVersionRef === null ||
            watchWindow.adviceBundleVersionRef === target.adviceBundleVersionRef),
      )
      .at(-1) ?? null;

    return {
      analyticsBundle,
      selfCareBoundaryBundle: context.selfCareBoundaryBundle,
      adviceRenderBundle: context.adviceRenderBundle,
      adminResolutionBundle: context.adminResolutionBundle,
      dependencyBundle: context.dependencyBundle,
      currentExpectationResolution: resolution,
      currentFollowUpWatchWindow,
    };
  }

  async publishPatientExpectationTemplateVersion(
    input: PublishPatientExpectationTemplateVersionInput,
  ) {
    return this.service.publishPatientExpectationTemplateVersion(input);
  }

  async resolvePatientExpectationTemplate(
    input: ResolvePatientExpectationTemplateCommandInput,
  ): Promise<ResolvedPatientExpectationTemplate | null> {
    const context = await this.resolveTaskContext(input.taskId);
    if (!context) {
      return null;
    }
    const target = await this.ensureExpectationTargetPublished({
      ...context.target,
      desiredDeliveryMode:
        input.desiredDeliveryMode ?? context.target.desiredDeliveryMode,
      channelRef: optionalRef(input.channelRef) ?? context.target.channelRef,
      localeRef: optionalRef(input.localeRef) ?? context.target.localeRef,
      readingLevelRef: optionalRef(input.readingLevelRef) ?? context.target.readingLevelRef,
      accessibilityVariantRefs:
        uniqueSorted(input.accessibilityVariantRefs ?? context.target.accessibilityVariantRefs),
    });
    return this.service.resolvePatientExpectationTemplate({
      patientExpectationTemplateRef: target.patientExpectationTemplateRef,
      consequenceClass: target.consequenceClass,
      channelRef: target.channelRef,
      localeRef: target.localeRef,
      readingLevelRef: target.readingLevelRef,
      accessibilityVariantRefs: target.accessibilityVariantRefs,
      audienceTierRef: target.audienceTierRef,
      desiredDeliveryMode: target.desiredDeliveryMode,
      releaseState: target.releaseState,
    });
  }

  async fetchAdviceFollowUpWatchAnalytics(taskId: string) {
    return this.service.fetchAdviceFollowUpWatchAnalytics(taskId);
  }

  async recordAdviceOutcomeAnalytics(input: RecordAdviceOutcomeAnalyticsCommandInput) {
    const context = await this.resolveTaskContext(input.taskId);
    invariant(context, "TASK_SELF_CARE_OUTCOME_CONTEXT_NOT_FOUND", `No 253 context exists for ${input.taskId}.`);
    invariant(
      context.target.consequenceClass === "self_care",
      "TASK_SELF_CARE_OUTCOME_NOT_SELF_CARE",
      `Task ${input.taskId} is not in self-care consequence.`,
    );
    const target = await this.ensureExpectationTargetPublished(context.target);
    const resolution = await this.service.resolvePatientExpectationTemplate({
      patientExpectationTemplateRef: target.patientExpectationTemplateRef,
      consequenceClass: target.consequenceClass,
      channelRef: target.channelRef,
      localeRef: target.localeRef,
      readingLevelRef: target.readingLevelRef,
      accessibilityVariantRefs: target.accessibilityVariantRefs,
      audienceTierRef: target.audienceTierRef,
      desiredDeliveryMode: target.desiredDeliveryMode,
      releaseState: target.releaseState,
    });
    invariant(resolution, "TASK_SELF_CARE_EXPECTATION_UNRESOLVED", `No expectation template resolved for ${input.taskId}.`);

    const watchWindow = this.buildAdviceWatchWindow(target, input);
    const analyticsInput = this.buildRecordInput(target, resolution, input, watchWindow);
    return this.service.recordAdviceOutcomeAnalytics(analyticsInput);
  }

  async recordAdminOutcomeAnalytics(input: RecordAdminOutcomeAnalyticsCommandInput) {
    const context = await this.resolveTaskContext(input.taskId);
    invariant(context, "TASK_ADMIN_OUTCOME_CONTEXT_NOT_FOUND", `No 253 context exists for ${input.taskId}.`);
    invariant(
      context.target.consequenceClass !== "self_care",
      "TASK_ADMIN_OUTCOME_NOT_ADMIN",
      `Task ${input.taskId} is not in bounded admin consequence.`,
    );
    const target = await this.ensureExpectationTargetPublished(context.target);
    const resolution = await this.service.resolvePatientExpectationTemplate({
      patientExpectationTemplateRef: target.patientExpectationTemplateRef,
      consequenceClass: target.consequenceClass,
      channelRef: target.channelRef,
      localeRef: target.localeRef,
      readingLevelRef: target.readingLevelRef,
      accessibilityVariantRefs: target.accessibilityVariantRefs,
      audienceTierRef: target.audienceTierRef,
      desiredDeliveryMode: target.desiredDeliveryMode,
      releaseState: target.releaseState,
    });
    invariant(resolution, "TASK_ADMIN_EXPECTATION_UNRESOLVED", `No expectation template resolved for ${input.taskId}.`);
    const analyticsInput = this.buildRecordInput(target, resolution, input, null);
    return this.service.recordAdminOutcomeAnalytics(analyticsInput);
  }

  private async ensureExpectationTargetPublished(
    target: ExpectationTargetContext,
  ): Promise<ExpectationTargetContext> {
    const currentVersion =
      await this.service.fetchCurrentPatientExpectationTemplateVersion(
        target.patientExpectationTemplateRef,
      );
    if (!currentVersion) {
      await this.service.publishPatientExpectationTemplateVersion(
        buildCanonicalTemplateVersionInput(target),
      );
    }
    return target;
  }

  private buildAdviceWatchWindow(
    target: ExpectationTargetContext,
    input: RecordAdviceOutcomeAnalyticsCommandInput,
  ): UpsertAdviceFollowUpWatchWindowInput | null {
    if (!input.watchStartAt || !input.watchUntil || !target.adviceBundleVersionRef) {
      return null;
    }
    return {
      taskId: target.taskId,
      requestRef: target.requestRef,
      boundaryDecisionRef: target.boundaryDecisionRef,
      boundaryTupleHash: target.boundaryTupleHash,
      decisionEpochRef: target.decisionEpochRef,
      consequenceClass: target.consequenceClass,
      adminResolutionSubtypeRef: target.adminResolutionSubtypeRef,
      adviceBundleVersionRef: target.adviceBundleVersionRef,
      watchStartAt: ensureIsoTimestamp(input.watchStartAt, "watchStartAt"),
      watchUntil: ensureIsoTimestamp(input.watchUntil, "watchUntil"),
      recontactThresholdRef:
        optionalRef(input.recontactThresholdRef) ?? "recontact_threshold.48h",
      escalationThresholdRef:
        optionalRef(input.escalationThresholdRef) ?? "escalation_threshold.24h",
      rollbackReviewState: input.rollbackReviewState ?? "none",
      watchRevision: input.watchRevision ?? 1,
      assuranceSliceTrustRefs:
        uniqueSorted(input.assuranceSliceTrustRefs ?? ["assurance_slice_trust.self_care"]),
      watchState: input.watchState ?? "monitoring",
      latestReviewOutcomeRef: optionalRef(input.latestReviewOutcomeRef),
    };
  }

  private buildRecordInput(
    target: ExpectationTargetContext,
    resolution: ResolvedPatientExpectationTemplate,
    input:
      | RecordAdviceOutcomeAnalyticsCommandInput
      | RecordAdminOutcomeAnalyticsCommandInput,
    watchWindow: UpsertAdviceFollowUpWatchWindowInput | null,
  ): RecordOutcomeAnalyticsInput {
    return {
      taskId: target.taskId,
      requestRef: target.requestRef,
      boundaryDecisionRef: target.boundaryDecisionRef,
      boundaryTupleHash: target.boundaryTupleHash,
      decisionEpochRef: target.decisionEpochRef,
      consequenceClass: target.consequenceClass,
      eventClass: input.eventClass,
      adviceBundleVersionRef: target.adviceBundleVersionRef,
      adviceVariantSetRef: target.adviceVariantSetRef,
      patientExpectationTemplateRef: resolution.patientExpectationTemplateRef,
      patientExpectationTemplateVersionRef:
        resolution.patientExpectationTemplateVersionRef,
      patientExpectationTemplateVariantRef:
        resolution.patientExpectationTemplateVariantRef,
      adminResolutionSubtypeRef: target.adminResolutionSubtypeRef,
      adminResolutionCaseRef: target.adminResolutionCaseRef,
      completionArtifactRef: target.completionArtifactRef,
      channelRef: target.channelRef,
      localeRef: target.localeRef,
      readingLevelRef: target.readingLevelRef,
      accessibilityVariantRefs: target.accessibilityVariantRefs,
      audienceTierRef: target.audienceTierRef,
      releaseState: target.releaseState,
      visibilityTier: target.visibilityTier,
      summarySafetyTier: target.summarySafetyTier,
      eventOccurredAt: ensureIsoTimestamp(input.eventOccurredAt, "eventOccurredAt"),
      recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
      watchWindow,
      reasonCodeRefs: uniqueSorted([
        ...target.reasonCodeRefs,
        ...resolution.reasonCodeRefs,
        ...(input.reasonCodeRefs ?? []),
      ]),
    };
  }

  private async resolveTaskContext(taskId: string): Promise<{
    selfCareBoundaryBundle: Phase3SelfCareBoundaryApplicationBundle;
    adviceRenderBundle: Phase3AdviceRenderApplicationBundle | null;
    adminResolutionBundle: Phase3AdminResolutionPolicyApplicationBundle | null;
    dependencyBundle: Phase3AdviceAdminDependencyApplicationBundle | null;
    target: ExpectationTargetContext;
  } | null> {
    const [
      selfCareBoundaryBundle,
      adviceRenderBundle,
      adminResolutionBundle,
      dependencyBundle,
    ] = await Promise.all([
      this.selfCareBoundaryApplication.queryTaskSelfCareBoundary(taskId),
      this.adviceRenderApplication.queryTaskAdviceRender(taskId),
      this.adminResolutionApplication.queryTaskAdminResolution(taskId),
      this.dependencyApplication.queryTaskAdviceAdminDependency(taskId),
    ]);

    const boundaryDecision = selfCareBoundaryBundle.boundaryBundle.currentBoundaryDecision;
    if (!boundaryDecision) {
      return null;
    }

    const currentAdviceGrant =
      selfCareBoundaryBundle.boundaryBundle.currentAdviceEligibilityGrant;
    const blockedForRecovery =
      boundaryDecision.reopenState !== "stable" ||
      boundaryDecision.boundaryState !== "live" ||
      dependencyBundle?.projection.canContinueCurrentConsequence === false ||
      adviceRenderBundle?.effectiveRenderState === "invalidated" ||
      adviceRenderBundle?.effectiveRenderState === "quarantined";

    const adviceBundleVersionRef =
      adviceRenderBundle?.selectedAdviceBundleVersion?.adviceBundleVersionId ?? null;
    const adviceVariantSetRef =
      adviceRenderBundle?.selectedAdviceVariantSet?.adviceVariantSetId ?? null;
    const advicePathwayRef =
      adviceRenderBundle?.selectedAdviceBundleVersion?.pathwayRef ?? null;
    const currentCase =
      adminResolutionBundle?.adminResolutionBundle.currentAdminResolutionCase ?? null;
    const currentCompletionArtifact =
      adminResolutionBundle?.adminResolutionBundle.currentCompletionArtifact ?? null;
    const currentSubtypeProfile =
      adminResolutionBundle?.adminResolutionBundle.currentSubtypeProfile ?? null;

    let consequenceClass: PatientExpectationTemplateConsequenceClass;
    let patientExpectationTemplateRef: string;
    let desiredDeliveryMode: PatientExpectationTemplateDeliveryMode;
    let releaseState = "current";
    let visibilityTier =
      currentCompletionArtifact?.visibilityTier ??
      adviceRenderBundle?.renderBundle.currentRenderSettlement?.visibilityTier ??
      "patient_authenticated";
    let summarySafetyTier =
      currentCompletionArtifact?.summarySafetyTier ??
      adviceRenderBundle?.renderBundle.currentRenderSettlement?.summarySafetyTier ??
      "clinical_safe_summary";
    const reasonCodeRefs = uniqueSorted([
      ...(boundaryDecision.reasonCodeRefs ?? []),
      ...(dependencyBundle?.projection.currentAdviceAdminDependencySet?.reasonCodeRefs ?? []),
      ...(adminResolutionBundle?.effectiveReasonCodeRefs ?? []),
      ...(adviceRenderBundle?.effectiveReasonCodeRefs ?? []),
    ]);

    if (boundaryDecision.decisionState === "self_care") {
      consequenceClass = "self_care";
      patientExpectationTemplateRef = blockedForRecovery
        ? deriveBlockedTemplateRef(consequenceClass)
        : deriveSelfCareTemplateRef(advicePathwayRef);
      desiredDeliveryMode = blockedForRecovery
        ? "placeholder_safe"
        : adviceRenderBundle?.effectiveRenderState === "renderable"
          ? "full"
          : "summary_safe";
      releaseState =
        adviceRenderBundle?.renderBundle.currentRenderSettlement?.trustState === "quarantined"
          ? "quarantined"
          : adviceRenderBundle?.renderBundle.currentRenderSettlement?.trustState === "degraded"
            ? "degraded"
            : "current";
    } else {
      const waitingOrQueued =
        !currentCompletionArtifact &&
        currentCase &&
        currentCase.caseState !== "completion_artifact_recorded" &&
        currentCase.caseState !== "closed";
      consequenceClass = waitingOrQueued
        ? "admin_resolution_waiting"
        : "admin_resolution_completion";
      if (blockedForRecovery) {
        patientExpectationTemplateRef = deriveBlockedTemplateRef(consequenceClass);
        desiredDeliveryMode = "placeholder_safe";
      } else if (consequenceClass === "admin_resolution_completion") {
        patientExpectationTemplateRef =
          currentCompletionArtifact?.patientExpectationTemplateRef ??
          currentSubtypeProfile?.patientExpectationTemplateRef ??
          "patient_expectation_template.admin.default.completed";
        desiredDeliveryMode = currentCompletionArtifact?.artifactState === "delivered" ? "full" : "summary_safe";
        releaseState = currentCompletionArtifact?.releaseState ?? "current";
      } else {
        patientExpectationTemplateRef = deriveWaitingTemplateRef({
          currentCase,
          currentProfile: currentSubtypeProfile,
        });
        desiredDeliveryMode =
          currentCase?.waitingState === "awaiting_external_dependency" ||
          currentCase?.waitingState === "patient_document_return"
            ? "summary_safe"
            : "full";
      }
    }

    return {
      selfCareBoundaryBundle,
      adviceRenderBundle,
      adminResolutionBundle,
      dependencyBundle,
      target: {
        taskId,
        requestRef: boundaryDecision.requestRef,
        boundaryDecisionRef: boundaryDecision.selfCareBoundaryDecisionId,
        boundaryTupleHash: boundaryDecision.boundaryTupleHash,
        decisionEpochRef: boundaryDecision.decisionEpochRef,
        consequenceClass,
        expectationClass: deriveExpectationClass(
          patientExpectationTemplateRef,
          consequenceClass,
        ),
        patientExpectationTemplateRef,
        advicePathwayRef,
        adminResolutionSubtypeRef:
          boundaryDecision.adminResolutionSubtypeRef ?? currentCase?.adminResolutionSubtypeRef ?? null,
        adviceBundleVersionRef,
        adviceVariantSetRef,
        adminResolutionCaseRef: currentCase?.adminResolutionCaseId ?? null,
        completionArtifactRef:
          currentCompletionArtifact?.adminResolutionCompletionArtifactId ?? null,
        bindingRuleRef: `binding_rule.${patientExpectationTemplateRef}`,
        policyBundleRef: boundaryDecision.compiledPolicyBundleRef,
        channelRef: currentAdviceGrant?.channelRef ?? "patient_portal",
        localeRef: currentAdviceGrant?.localeRef ?? "en-GB",
        readingLevelRef:
          adviceRenderBundle?.selectedAdviceVariantSet?.readingLevelRef ?? null,
        accessibilityVariantRefs:
          adviceRenderBundle?.selectedAdviceVariantSet?.accessibilityVariantRefs ?? [],
        audienceTierRef: currentAdviceGrant?.audienceTier ?? "patient_authenticated",
        desiredDeliveryMode,
        releaseState,
        visibilityTier,
        summarySafetyTier,
        reasonCodeRefs,
      },
    };
  }
}

export function createPhase3SelfCareOutcomeAnalyticsApplication(options?: {
  selfCareBoundaryApplication?: Pick<
    Phase3SelfCareBoundaryApplication,
    "queryTaskSelfCareBoundary"
  >;
  adviceRenderApplication?: Pick<
    Phase3AdviceRenderApplication,
    "queryTaskAdviceRender"
  >;
  adminResolutionApplication?: Pick<
    Phase3AdminResolutionPolicyApplication,
    "queryTaskAdminResolution"
  >;
  dependencyApplication?: Pick<
    Phase3AdviceAdminDependencyApplication,
    "queryTaskAdviceAdminDependency"
  >;
  repositories?: Phase3SelfCareOutcomeAnalyticsRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase3SelfCareOutcomeAnalyticsApplication {
  return new Phase3SelfCareOutcomeAnalyticsApplicationImpl(options);
}
