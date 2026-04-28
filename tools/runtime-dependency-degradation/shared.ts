import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stableDigest } from "../../packages/release-controls/src/build-provenance.ts";
import {
  createDependencyDegradationSimulationHarness,
  DependencyDegradationExecutionEngine,
  type DependencyDegradationDecision,
} from "../../packages/release-controls/src/dependency-degradation.ts";
import {
  dependencyDegradationCatalog,
  type DependencyDegradationSimulationScenario,
} from "../../packages/release-controls/src/dependency-degradation.catalog.ts";

const __filename = fileURLToPath(import.meta.url);

export const ROOT = path.resolve(path.dirname(__filename), "..", "..");

export interface CliArgs {
  [key: string]: string;
}

export interface DependencyDegradationVerdictShape {
  decisionState: string;
  outcomeState: string;
  gatewayReadMode: string;
  browserMutationMode: string;
  projectionPublicationMode: string;
  integrationDispatchMode: string;
  assurancePublicationState: string;
  primaryAudienceFallbackMode: string;
  recoveryReadyToClear: boolean;
  blockedEscalationFamilyRefs: string[];
}

export interface DependencyDegradationRehearsalVerdict {
  scenarioId: string;
  environmentRing: string;
  dependencyCode: string;
  expected: {
    decisionState: string;
    gatewayReadMode: string;
    browserMutationMode: string;
    projectionPublicationMode: string;
    integrationDispatchMode: string;
  };
  actual: DependencyDegradationVerdictShape;
  digests: {
    verdict: string;
    catalogMetrics: string;
  };
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    if (!key) continue;
    args[key] = argv[index + 1] ?? "true";
  }
  return args;
}

export function readJson<TValue>(filePath: string): TValue {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TValue;
}

export function writeJson(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function loadScenario(
  environmentRing: string,
  scenarioId?: string,
): DependencyDegradationSimulationScenario {
  if (scenarioId) {
    const exact = dependencyDegradationCatalog.simulationScenarios.find(
      (scenario) => scenario.scenarioId === scenarioId,
    );
    if (!exact) {
      throw new Error(`No dependency degradation scenario found for ${scenarioId}.`);
    }
    return exact;
  }

  const preferred = dependencyDegradationCatalog.simulationScenarios.find(
    (scenario) =>
      scenario.environmentRing === environmentRing && scenario.expectedDecisionState !== "clear",
  );
  if (preferred) {
    return preferred;
  }

  const fallback = dependencyDegradationCatalog.simulationScenarios.find(
    (scenario) => scenario.environmentRing === environmentRing,
  );
  if (fallback) {
    return fallback;
  }

  throw new Error(`No dependency degradation scenario found for ${environmentRing}.`);
}

export function evaluateScenario(
  scenario: DependencyDegradationSimulationScenario,
): { decision: DependencyDegradationDecision; timeline: readonly unknown[] } {
  const engine = new DependencyDegradationExecutionEngine();
  const decision = engine.evaluate({
    dependencyCode: scenario.dependencyCode,
    environmentRing: scenario.environmentRing,
    routeFamilyRef: scenario.routeFamilyRef,
    observedFailureModeClass: scenario.observedFailureModeClass,
    healthState: scenario.healthState,
    requestedWorkloadFamilyRefs: scenario.requestedWorkloadFamilyRefs,
    runtimePublicationState:
      ("runtimePublicationState" in scenario ? scenario.runtimePublicationState : undefined) ??
      "published",
    parityState: ("parityState" in scenario ? scenario.parityState : undefined) ?? "exact",
    routeExposureState:
      ("routeExposureState" in scenario ? scenario.routeExposureState : undefined) ??
      "publishable",
    trustFreezeLive: ("trustFreezeLive" in scenario ? scenario.trustFreezeLive : undefined) ?? true,
    assuranceHardBlock:
      ("assuranceHardBlock" in scenario ? scenario.assuranceHardBlock : undefined) ?? false,
    observedAt: "2026-04-13T12:00:00.000Z",
  });

  return {
    decision,
    timeline: engine.getTimeline(),
  };
}

export function buildActualVerdict(
  decision: DependencyDegradationDecision,
): DependencyDegradationVerdictShape {
  return {
    decisionState: decision.decisionState,
    outcomeState: decision.outcomeState,
    gatewayReadMode: decision.gatewayReadResolution.mode,
    browserMutationMode: decision.browserMutationResolution.mode,
    projectionPublicationMode: decision.projectionPublicationResolution.mode,
    integrationDispatchMode: decision.integrationDispatchResolution.mode,
    assurancePublicationState: decision.assurancePublicationState,
    primaryAudienceFallbackMode: decision.primaryAudienceFallback.fallbackMode,
    recoveryReadyToClear: decision.recoveryGate.readyToClear,
    blockedEscalationFamilyRefs: [...decision.blockedEscalationFamilyRefs].sort(),
  };
}

export function buildVerdictDigest(payload: DependencyDegradationVerdictShape): string {
  return stableDigest({
    decisionState: payload.decisionState,
    outcomeState: payload.outcomeState,
    gatewayReadMode: payload.gatewayReadMode,
    browserMutationMode: payload.browserMutationMode,
    projectionPublicationMode: payload.projectionPublicationMode,
    integrationDispatchMode: payload.integrationDispatchMode,
    assurancePublicationState: payload.assurancePublicationState,
    primaryAudienceFallbackMode: payload.primaryAudienceFallbackMode,
    recoveryReadyToClear: payload.recoveryReadyToClear,
    blockedEscalationFamilyRefs: [...payload.blockedEscalationFamilyRefs].sort(),
  });
}

export function buildMetricsDigest(metrics: {
  degradedEntryCount: number;
  recoveryHeldCount: number;
  clearCount: number;
  boundedOutcomeCount: number;
  blockedOutcomeCount: number;
  fallbackModeFrequency: Record<string, number>;
}): string {
  return stableDigest({
    degradedEntryCount: metrics.degradedEntryCount,
    recoveryHeldCount: metrics.recoveryHeldCount,
    clearCount: metrics.clearCount,
    boundedOutcomeCount: metrics.boundedOutcomeCount,
    blockedOutcomeCount: metrics.blockedOutcomeCount,
    fallbackModeFrequency: Object.entries(metrics.fallbackModeFrequency).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  });
}

export function buildRehearsalVerdict(
  scenario: DependencyDegradationSimulationScenario,
  decision: DependencyDegradationDecision,
  metricsDigest: string,
): DependencyDegradationRehearsalVerdict {
  const actual = buildActualVerdict(decision);
  return {
    scenarioId: scenario.scenarioId,
    environmentRing: scenario.environmentRing,
    dependencyCode: scenario.dependencyCode,
    expected: {
      decisionState: scenario.expectedDecisionState,
      gatewayReadMode: scenario.expectedGatewayReadMode,
      browserMutationMode: scenario.expectedBrowserMutationMode,
      projectionPublicationMode: scenario.expectedProjectionPublicationMode,
      integrationDispatchMode: scenario.expectedIntegrationDispatchMode,
    },
    actual,
    digests: {
      verdict: buildVerdictDigest(actual),
      catalogMetrics: metricsDigest,
    },
  };
}

export function hydrateScenario(environmentRing: string, scenarioId?: string) {
  const scenario = loadScenario(environmentRing, scenarioId);
  const simulationHarness = createDependencyDegradationSimulationHarness();
  const { decision, timeline } = evaluateScenario(scenario);
  const verdict = buildRehearsalVerdict(
    scenario,
    decision,
    buildMetricsDigest(simulationHarness.metrics),
  );

  return {
    scenario,
    decision,
    verdict,
    timeline,
    simulationHarness,
  };
}
