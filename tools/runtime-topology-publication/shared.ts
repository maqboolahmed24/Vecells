import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stableDigest } from "../../packages/release-controls/src/build-provenance.ts";
import {
  createRuntimeTopologyPublicationSimulationHarness,
  createRuntimeTopologyPublicationVerdictDigest,
  selectRuntimeTopologyPublicationScenario,
  type RuntimeTopologyPublicationMetricsSnapshot,
  type RuntimeTopologyPublicationScenario,
  type RuntimeTopologyPublicationVerdict,
} from "../../packages/release-controls/src/runtime-topology-publication.ts";

const __filename = fileURLToPath(import.meta.url);

export const ROOT = path.resolve(path.dirname(__filename), "..", "..");

export interface CliArgs {
  [key: string]: string;
}

export interface RuntimeTopologyPublicationVerdictShape {
  publishable: boolean;
  publicationEligibilityState: "publishable" | "blocked";
  bindingCompleteness: number;
  driftFindingCount: number;
  blockedReasonRefs: string[];
}

export interface RuntimeTopologyPublicationRehearsalVerdict {
  scenarioId: string;
  environmentRing: string;
  expected: {
    publishable: boolean;
    publicationEligibilityState: "publishable" | "blocked";
    bindingCompleteness: number;
    driftFindingCount: number;
    blockedReasonRefs: readonly string[];
  };
  actual: RuntimeTopologyPublicationVerdictShape;
  digests: {
    verdict: string;
    metrics: string;
  };
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 2; index < argv.length; index += 2) {
    const key = argv[index];
    if (!key) {
      continue;
    }
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
): RuntimeTopologyPublicationScenario {
  return selectRuntimeTopologyPublicationScenario({
    scenarioId,
    environmentRing,
    publishable: scenarioId ? undefined : true,
  });
}

export function buildActualVerdict(
  verdict: RuntimeTopologyPublicationVerdict,
): RuntimeTopologyPublicationVerdictShape {
  return {
    publishable: verdict.publishable,
    publicationEligibilityState: verdict.publicationEligibilityState,
    bindingCompleteness: verdict.bindingCompleteness,
    driftFindingCount: verdict.driftFindingCount,
    blockedReasonRefs: [...verdict.blockedReasonRefs].sort(),
  };
}

export function buildMetricsDigest(metrics: RuntimeTopologyPublicationMetricsSnapshot): string {
  return stableDigest({
    scenarioCount: metrics.scenarioCount,
    publishableScenarioCount: metrics.publishableScenarioCount,
    blockedScenarioCount: metrics.blockedScenarioCount,
    currentDriftFindingCount: metrics.currentDriftFindingCount,
    gatewaySurfaceCount: metrics.gatewaySurfaceCount,
    currentBlockedReasonRefs: [...metrics.currentBlockedReasonRefs].sort(),
  });
}

export function buildRehearsalVerdict(
  scenario: RuntimeTopologyPublicationScenario,
  verdict: RuntimeTopologyPublicationVerdict,
  metrics: RuntimeTopologyPublicationMetricsSnapshot,
): RuntimeTopologyPublicationRehearsalVerdict {
  return {
    scenarioId: scenario.scenarioId,
    environmentRing: scenario.environmentRing,
    expected: {
      publishable: scenario.expected.publishable,
      publicationEligibilityState: scenario.expected.publicationEligibilityState,
      bindingCompleteness: scenario.expected.bindingCompleteness,
      driftFindingCount: scenario.expected.driftFindingCount,
      blockedReasonRefs: [...scenario.expected.blockedReasonRefs].sort(),
    },
    actual: buildActualVerdict(verdict),
    digests: {
      verdict: createRuntimeTopologyPublicationVerdictDigest(verdict),
      metrics: buildMetricsDigest(metrics),
    },
  };
}

export function hydrateScenario(environmentRing: string, scenarioId?: string) {
  const scenario = loadScenario(environmentRing, scenarioId);
  const simulationHarness = createRuntimeTopologyPublicationSimulationHarness({
    scenarioId: scenario.scenarioId,
  });
  const verdict = buildRehearsalVerdict(
    simulationHarness.scenario,
    simulationHarness.verdict,
    simulationHarness.metrics,
  );

  return {
    scenario,
    verdict,
    simulationHarness,
    driftCatalog: readJson<Record<string, unknown>>(
      path.join(ROOT, "data", "analysis", "runtime_topology_drift_catalog.json"),
    ),
    gatewaySurfaceMatrix: readJson<Record<string, unknown>>(
      path.join(ROOT, "data", "analysis", "gateway_surface_publication_matrix.json"),
    ),
  };
}
