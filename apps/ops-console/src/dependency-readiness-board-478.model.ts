import matrixArtifact from "../../../data/readiness/478_external_dependency_readiness_matrix.json";
import essentialMapArtifact from "../../../data/readiness/478_essential_function_dependency_map.json";
import runbookBundleArtifact from "../../../data/readiness/478_manual_fallback_runbook_bundle.json";
import contactLedgerArtifact from "../../../data/readiness/478_dependency_contact_and_escalation_ledger.json";
import profilesArtifact from "../../../data/readiness/478_dependency_degradation_profiles.json";
import rehearsalEvidenceArtifact from "../../../data/readiness/478_fallback_rehearsal_evidence.json";

export type DependencyReadiness478ScenarioState =
  | "ready"
  | "ready_with_constraints"
  | "degraded_manual"
  | "blocked"
  | "deferred_channel"
  | "stale_contact";

export type DependencyReadiness478State =
  | "ready"
  | "ready_with_constraints"
  | "observe_only"
  | "blocked"
  | "not_applicable";

export type DependencyContinuity478State = "normal" | "degraded" | "manual" | "blocked";

export interface DependencyReadiness478DependencyCard {
  readonly dependencyRef: string;
  readonly label: string;
  readonly dependencyClass: string;
  readonly launchCritical: boolean;
  readonly readinessState: DependencyReadiness478State;
  readonly selected: boolean;
  readonly owner: string;
  readonly routeFamilies: readonly string[];
  readonly essentialFunctionRefs: readonly string[];
  readonly essentialFunctionLabels: readonly string[];
  readonly fallbackModeRefs: readonly string[];
  readonly fallbackModeLabels: readonly string[];
  readonly serviceLevelBinding: any;
  readonly contacts: readonly any[];
  readonly runbooks: readonly any[];
  readonly rehearsals: readonly any[];
  readonly blockerRefs: readonly string[];
  readonly constraintRefs: readonly string[];
}

export interface DependencyReadiness478ContinuityRow {
  readonly essentialFunctionRef: string;
  readonly label: string;
  readonly continuityState: DependencyContinuity478State;
  readonly dependencyRefs: readonly string[];
  readonly fallbackModeRefs: readonly string[];
}

export interface DependencyReadiness478Projection {
  readonly visualMode: "Dependency_Readiness_Board_478";
  readonly scenarioState: DependencyReadiness478ScenarioState;
  readonly overallReadinessState: DependencyReadiness478State;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly matrixHash: string;
  readonly matrixHashPrefix: string;
  readonly launchCriticalDependencyCount: number;
  readonly launchCriticalReadyCount: number;
  readonly launchCriticalBlockedCount: number;
  readonly selectedDependencyRef: string;
  readonly selectedDependency: DependencyReadiness478DependencyCard;
  readonly dependencies: readonly DependencyReadiness478DependencyCard[];
  readonly essentialFunctions: readonly DependencyReadiness478ContinuityRow[];
  readonly tableRows: readonly {
    readonly essentialFunction: string;
    readonly dependency: string;
    readonly fallback: string;
    readonly readinessState: DependencyReadiness478State;
    readonly launchCritical: boolean;
  }[];
  readonly rail: {
    readonly staleContacts: readonly any[];
    readonly rehearsalGaps: readonly {
      readonly dependencyRef: string;
      readonly gapRef: string;
      readonly rehearsalEvidenceId: string;
      readonly result: string;
    }[];
    readonly supplierCommsPlans: readonly any[];
  };
  readonly commandDialog: {
    readonly title: string;
    readonly confirmButtonDisabled: true;
    readonly reason: string;
    readonly requiredSettlementRefs: readonly string[];
  };
  readonly fallbackActivationReviewDisabled: boolean;
  readonly fallbackActivationActionState:
    | "review_available_settlement_pending"
    | "blocked_by_dependency_readiness"
    | "blocked_by_stale_contact";
  readonly noCompletionClaimBeforeSettlement: true;
  readonly tableFallbackRequired: true;
  readonly noRawContactDetails: true;
}

const matrix = matrixArtifact as any;
const essentialMap = essentialMapArtifact as any;
const runbookBundle = runbookBundleArtifact as any;
const contactLedger = contactLedgerArtifact as any;
const profiles = profilesArtifact as any;
const rehearsalEvidence = rehearsalEvidenceArtifact as any;

const scenarioStates: readonly DependencyReadiness478ScenarioState[] = [
  "ready",
  "ready_with_constraints",
  "degraded_manual",
  "blocked",
  "deferred_channel",
  "stale_contact",
];

const fallbackDependencyRef = "dep_478_core_web_runtime_edge";

export function normalizeDependencyReadiness478ScenarioState(
  value: string | null | undefined,
): DependencyReadiness478ScenarioState {
  return scenarioStates.includes(value as DependencyReadiness478ScenarioState)
    ? (value as DependencyReadiness478ScenarioState)
    : "ready_with_constraints";
}

export function normalizeDependencyReadiness478DependencyId(
  value: string | null | undefined,
): string {
  return (matrix.dependencyVerdicts as any[]).some(
    (dependency) => dependency.dependencyRef === value,
  )
    ? String(value)
    : fallbackDependencyRef;
}

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function stateForScenario(
  dependencyRef: string,
  baseline: DependencyReadiness478State,
  launchCritical: boolean,
  scenarioState: DependencyReadiness478ScenarioState,
): DependencyReadiness478State {
  if (scenarioState === "ready") {
    if (dependencyRef === "dep_478_nhs_app_channel") return "not_applicable";
    if (dependencyRef === "dep_478_pharmacy_eps_provider_directory") return "observe_only";
    return launchCritical ? "ready" : baseline;
  }
  if (scenarioState === "deferred_channel") {
    if (dependencyRef === "dep_478_nhs_app_channel") return "not_applicable";
    if (dependencyRef === "dep_478_pharmacy_eps_provider_directory") return "observe_only";
    return launchCritical ? "ready" : baseline;
  }
  if (scenarioState === "degraded_manual") {
    if (
      dependencyRef === "dep_478_notification_provider" ||
      dependencyRef === "dep_478_booking_provider_adapter"
    ) {
      return "ready_with_constraints";
    }
  }
  if (scenarioState === "blocked") {
    if (
      dependencyRef === "dep_478_monitoring_alerting_destination" ||
      dependencyRef === "dep_478_backup_restore_target" ||
      dependencyRef === "dep_478_notification_provider"
    ) {
      return "blocked";
    }
  }
  if (scenarioState === "stale_contact" && dependencyRef === "dep_478_supplier_support_channel") {
    return "blocked";
  }
  return baseline;
}

function blockersForScenario(
  dependencyRef: string,
  baselineBlockers: readonly string[],
  scenarioState: DependencyReadiness478ScenarioState,
): readonly string[] {
  const blockers = [...baselineBlockers];
  if (scenarioState === "blocked") {
    if (dependencyRef === "dep_478_monitoring_alerting_destination") {
      blockers.push("blocker:478:alert-owner-rota-missing");
    }
    if (dependencyRef === "dep_478_backup_restore_target") {
      blockers.push("blocker:478:restore-report-channel-absent");
    }
    if (dependencyRef === "dep_478_notification_provider") {
      blockers.push("blocker:478:manual-fallback-privacy-retention-violation");
    }
  }
  if (scenarioState === "stale_contact" && dependencyRef === "dep_478_supplier_support_channel") {
    blockers.push("blocker:478:supplier-contact-role-phone-email-unverified");
  }
  return blockers;
}

function constraintsForScenario(
  dependencyRef: string,
  baselineConstraints: readonly string[],
  scenarioState: DependencyReadiness478ScenarioState,
): readonly string[] {
  const constraints = [...baselineConstraints];
  if (scenarioState === "degraded_manual" && dependencyRef === "dep_478_notification_provider") {
    constraints.push("constraint:478:manual-contact-fallback-active");
  }
  if (scenarioState === "degraded_manual" && dependencyRef === "dep_478_booking_provider_adapter") {
    constraints.push("constraint:478:manual-appointment-log-active");
  }
  if (scenarioState === "deferred_channel" && dependencyRef === "dep_478_nhs_app_channel") {
    constraints.push("constraint:478:nhs-app-sample-users-zero");
  }
  return constraints;
}

function contactForScenario(contact: any, scenarioState: DependencyReadiness478ScenarioState) {
  if (
    scenarioState === "stale_contact" &&
    contact.dependencyRef === "dep_478_supplier_support_channel" &&
    contact.tier === "out_of_hours"
  ) {
    return {
      ...contact,
      verifiedAt: "2026-02-01T12:05:00.000Z",
      expiresAt: "2026-03-01T12:05:00.000Z",
      verificationState: "expired_role_phone_email_unverified",
      routeRefs: ["service-desk:supplier-ooh-expired"],
      emailRef: "email-ref:expired-supplier-ooh",
      phoneRef: "phone-ref:unverified-supplier-ooh",
    };
  }
  return contact;
}

function serviceLevelForDependency(dependencyRef: string): any {
  const bindingRef = (matrix.dependencyVerdicts as any[]).find(
    (dependency) => dependency.dependencyRef === dependencyRef,
  )?.serviceLevelBindingRef;
  return (matrix.serviceLevelBindings as any[]).find(
    (binding) => binding.serviceLevelBindingId === bindingRef,
  );
}

function serviceLevelRecordForDependency(dependencyRef: string): any {
  const profile = (profiles.degradationProfiles as any[]).find(
    (entry) => entry.dependencyRef === dependencyRef,
  );
  const verdict = (matrix.dependencyVerdicts as any[]).find(
    (entry) => entry.dependencyRef === dependencyRef,
  );
  const serviceLevel = serviceLevelForDependency(dependencyRef);
  return {
    serviceLevelBindingRef: serviceLevel?.serviceLevelBindingId ?? verdict?.serviceLevelBindingRef,
    supportWindow: serviceLevel?.supportWindow ?? "Service-level assumptions current.",
    businessHours: serviceLevel?.businessHours ?? "current",
    outOfHours: serviceLevel?.outOfHours ?? "current",
    rto: serviceLevel?.rto ?? "not specified",
    rpo: serviceLevel?.rpo ?? "not specified",
    alertThresholds: serviceLevel?.alertThresholds ?? [],
    assumption:
      serviceLevel?.assumption ??
      profile?.states?.find((entry: any) => entry.state === "degraded")?.condition ??
      "Service-level assumptions current.",
    owner: verdict?.owner ?? "service-owner",
    incidentSeverityMapping: verdict?.incidentSeverityMapping ?? "mapped by source record",
  };
}

function createDependencyCards(
  scenarioState: DependencyReadiness478ScenarioState,
  selectedDependencyRef: string,
): DependencyReadiness478DependencyCard[] {
  return (matrix.dependencyVerdicts as any[]).map((dependency) => {
    const readinessState = stateForScenario(
      dependency.dependencyRef,
      dependency.readinessState,
      dependency.launchCritical,
      scenarioState,
    );
    const blockerRefs = blockersForScenario(
      dependency.dependencyRef,
      dependency.blockerRefs ?? [],
      scenarioState,
    );
    const constraintRefs = constraintsForScenario(
      dependency.dependencyRef,
      dependency.constraintRefs ?? [],
      scenarioState,
    );
    const fallbackModeLabels = (dependency.fallbackModeRefs as string[]).map((modeRef) => {
      const mode = (profiles.fallbackModes as any[]).find(
        (entry) => entry.fallbackModeId === modeRef,
      );
      return mode?.label ?? titleCase(modeRef);
    });
    const essentialFunctionLabels = (dependency.essentialFunctionRefs as string[]).map(
      (essentialFunctionRef) =>
        (essentialMap.essentialFunctions as any[]).find(
          (entry) => entry.essentialFunctionRef === essentialFunctionRef,
        )?.label ?? titleCase(essentialFunctionRef),
    );
    const contacts = (dependency.escalationContactRefs as string[])
      .map((contactRef) =>
        (contactLedger.contacts as any[]).find((contact) => contact.contactId === contactRef),
      )
      .filter(Boolean)
      .map((contact) => contactForScenario(contact, scenarioState));
    const runbooks = (dependency.runbookRefs as string[])
      .map((runbookRef) =>
        (runbookBundle.runbooks as any[]).find((runbook) => runbook.runbookId === runbookRef),
      )
      .filter(Boolean);
    const rehearsals = (dependency.rehearsalEvidenceRefs as string[])
      .map((rehearsalRef) =>
        (rehearsalEvidence.rehearsals as any[]).find(
          (rehearsal) => rehearsal.rehearsalEvidenceId === rehearsalRef,
        ),
      )
      .filter(Boolean);

    return {
      dependencyRef: dependency.dependencyRef,
      label: dependency.label,
      dependencyClass: dependency.dependencyClass,
      launchCritical: dependency.launchCritical,
      readinessState,
      selected: dependency.dependencyRef === selectedDependencyRef,
      owner: dependency.owner,
      routeFamilies: dependency.routeFamilies,
      essentialFunctionRefs: dependency.essentialFunctionRefs,
      essentialFunctionLabels,
      fallbackModeRefs: dependency.fallbackModeRefs,
      fallbackModeLabels,
      serviceLevelBinding: serviceLevelRecordForDependency(dependency.dependencyRef),
      contacts,
      runbooks,
      rehearsals,
      blockerRefs,
      constraintRefs,
    };
  });
}

function continuityForEssential(
  essentialFunction: any,
  dependencies: readonly DependencyReadiness478DependencyCard[],
  scenarioState: DependencyReadiness478ScenarioState,
): DependencyContinuity478State {
  if (
    scenarioState === "degraded_manual" &&
    ["ef_478_outbound_comms", "ef_478_local_booking", "ef_478_hub_coordination"].includes(
      String(essentialFunction.essentialFunctionRef),
    )
  ) {
    return "manual";
  }
  const linkedDependencies = dependencies.filter((dependency) =>
    (essentialFunction.dependencyRefs as string[]).includes(dependency.dependencyRef),
  );
  if (linkedDependencies.some((dependency) => dependency.readinessState === "blocked")) {
    return "blocked";
  }
  if (
    linkedDependencies.some((dependency) =>
      ["ready_with_constraints", "observe_only", "not_applicable"].includes(
        dependency.readinessState,
      ),
    )
  ) {
    return "degraded";
  }
  return "normal";
}

function tableRowsFor(
  dependencies: readonly DependencyReadiness478DependencyCard[],
): DependencyReadiness478Projection["tableRows"] {
  return dependencies.flatMap((dependency) =>
    dependency.essentialFunctionLabels.map((essentialFunction) => ({
      essentialFunction,
      dependency: dependency.label,
      fallback: dependency.fallbackModeLabels.join(", "),
      readinessState: dependency.readinessState,
      launchCritical: dependency.launchCritical,
    })),
  );
}

function overallStateFor(
  dependencies: readonly DependencyReadiness478DependencyCard[],
  scenarioState: DependencyReadiness478ScenarioState,
): DependencyReadiness478State {
  if (
    dependencies.some(
      (dependency) => dependency.launchCritical && dependency.readinessState === "blocked",
    )
  ) {
    return "blocked";
  }
  if (scenarioState === "ready") return "ready";
  return dependencies.some(
    (dependency) =>
      dependency.launchCritical && dependency.readinessState === "ready_with_constraints",
  )
    ? "ready_with_constraints"
    : "ready";
}

function fallbackActivationActionState(
  dependencies: readonly DependencyReadiness478DependencyCard[],
  selectedDependency: DependencyReadiness478DependencyCard,
  scenarioState: DependencyReadiness478ScenarioState,
): DependencyReadiness478Projection["fallbackActivationActionState"] {
  if (scenarioState === "stale_contact") return "blocked_by_stale_contact";
  if (
    selectedDependency.blockerRefs.length > 0 ||
    dependencies.some(
      (dependency) => dependency.launchCritical && dependency.readinessState === "blocked",
    )
  ) {
    return "blocked_by_dependency_readiness";
  }
  return "review_available_settlement_pending";
}

export function createDependencyReadiness478Projection(
  scenarioState: DependencyReadiness478ScenarioState = "ready_with_constraints",
  selectedDependencyRef: string | null = fallbackDependencyRef,
): DependencyReadiness478Projection {
  const normalizedScenario = normalizeDependencyReadiness478ScenarioState(scenarioState);
  const normalizedDependencyRef =
    normalizeDependencyReadiness478DependencyId(selectedDependencyRef);
  const dependencies = createDependencyCards(normalizedScenario, normalizedDependencyRef);
  const selectedDependency =
    dependencies.find((dependency) => dependency.dependencyRef === normalizedDependencyRef) ??
    dependencies[0]!;
  const essentialFunctions = (essentialMap.essentialFunctions as any[]).map(
    (essentialFunction) => ({
      essentialFunctionRef: essentialFunction.essentialFunctionRef,
      label: essentialFunction.label,
      dependencyRefs: essentialFunction.dependencyRefs,
      fallbackModeRefs: essentialFunction.fallbackModeRefs,
      continuityState: continuityForEssential(essentialFunction, dependencies, normalizedScenario),
    }),
  );
  const overallReadiness = overallStateFor(dependencies, normalizedScenario);
  const launchCriticalDependencies = dependencies.filter((dependency) => dependency.launchCritical);
  const launchCriticalReady = launchCriticalDependencies.filter((dependency) =>
    ["ready", "ready_with_constraints"].includes(dependency.readinessState),
  );
  const staleContacts = (contactLedger.contacts as any[])
    .map((contact) => contactForScenario(contact, normalizedScenario))
    .filter((contact) => String(contact.verificationState).includes("expired"));
  const rehearsalGaps = (rehearsalEvidence.rehearsals as any[]).flatMap((rehearsal) =>
    (rehearsal.openGapRefs as string[]).map((gapRef) => ({
      dependencyRef: rehearsal.dependencyRef,
      gapRef,
      rehearsalEvidenceId: rehearsal.rehearsalEvidenceId,
      result: rehearsal.result,
    })),
  );
  const actionState = fallbackActivationActionState(
    dependencies,
    selectedDependency,
    normalizedScenario,
  );

  return {
    visualMode: "Dependency_Readiness_Board_478",
    scenarioState: normalizedScenario,
    overallReadinessState: overallReadiness,
    releaseCandidateRef: matrix.releaseBinding.releaseCandidateRef,
    runtimePublicationBundleRef: matrix.releaseBinding.runtimePublicationBundleRef,
    matrixHash: matrix.recordHash,
    matrixHashPrefix: String(matrix.recordHash).slice(0, 12),
    launchCriticalDependencyCount: launchCriticalDependencies.length,
    launchCriticalReadyCount: launchCriticalReady.length,
    launchCriticalBlockedCount: launchCriticalDependencies.length - launchCriticalReady.length,
    selectedDependencyRef: selectedDependency.dependencyRef,
    selectedDependency,
    dependencies,
    essentialFunctions,
    tableRows: tableRowsFor(dependencies),
    rail: {
      staleContacts,
      rehearsalGaps,
      supplierCommsPlans: (contactLedger.supplierCommsPlans as any[]).slice(0, 5),
    },
    commandDialog: {
      title: `Fallback activation review for ${selectedDependency.label}`,
      confirmButtonDisabled: true,
      reason:
        actionState === "review_available_settlement_pending"
          ? "The command can be reviewed, but confirmation remains disabled until backend command settlement publishes WORM audit evidence."
          : "Fallback activation review is blocked by readiness evidence. Resolve blockers before creating the command.",
      requiredSettlementRefs: selectedDependency.fallbackModeRefs.map(
        (fallbackModeRef) => `settlement-required:${fallbackModeRef}`,
      ),
    },
    fallbackActivationReviewDisabled: actionState !== "review_available_settlement_pending",
    fallbackActivationActionState: actionState,
    noCompletionClaimBeforeSettlement: true,
    tableFallbackRequired: true,
    noRawContactDetails: true,
  };
}
