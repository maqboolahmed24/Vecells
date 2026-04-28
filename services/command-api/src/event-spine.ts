import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEventSpineSimulationScenarios,
  runEventSpineSimulationScenarios,
} from "@vecells/domain-kernel";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

const EVENT_SPINE_MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "event_broker_topology_manifest.json",
);
const EVENT_SPINE_MAPPING_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "canonical_event_to_transport_mapping.json",
);
const EVENT_SPINE_POLICY_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "outbox_inbox_policy_matrix.csv",
);

export const eventSpinePersistenceTables = [
  "event_outbox_entries",
  "event_outbox_dispatch_attempts",
  "event_outbox_checkpoints",
  "event_inbox_receipts",
  "event_inbox_checkpoints",
  "event_replay_reviews",
] as const;

export const eventSpineMigrationPlanRefs = [
  "services/command-api/migrations/087_event_spine_outbox_inbox.sql",
] as const;

interface EventBrokerTopologyManifest {
  task_id: string;
  summary: {
    namespace_count: number;
    stream_count: number;
    transport_mapping_count: number;
    queue_group_count: number;
    policy_count: number;
  };
  queueGroups: Array<{
    queueRef: string;
    consumerGroupRef: string;
    retryPosture: string;
    dlqRef: string;
  }>;
}

interface EventTransportMappingPayload {
  task_id: string;
  transportMappings: Array<{
    canonicalEventContractRef: string;
    eventName: string;
    queueRefs: string[];
    consumerGroupRefs: string[];
    streamRef: string;
  }>;
}

export interface EventSpineScenarioView {
  scenarioId: string;
  eventName: string;
  queueRefs: readonly string[];
  consumerGroupRefs: readonly string[];
  publishedQueueRefs: readonly string[];
  duplicateReceiptCount: number;
  gapBlockedReceiptCount: number;
  quarantineQueueRefs: readonly string[];
  replayReviewRefs: readonly string[];
}

function readJson<TValue>(filePath: string): TValue {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TValue;
}

function readCsv(filePath: string): Array<Record<string, string>> {
  const source = fs.readFileSync(filePath, "utf8").trim();
  if (!source) {
    return [];
  }
  const [headerLine, ...lines] = source.split(/\r?\n/);
  if (!headerLine) {
    return [];
  }
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

export function createEventSpineApplication() {
  const manifest = readJson<EventBrokerTopologyManifest>(EVENT_SPINE_MANIFEST_PATH);
  const mapping = readJson<EventTransportMappingPayload>(EVENT_SPINE_MAPPING_PATH);
  const policyRows = readCsv(EVENT_SPINE_POLICY_PATH);
  const scenarioDefinitions = createEventSpineSimulationScenarios();

  return {
    migrationPlanRef: eventSpineMigrationPlanRefs[0],
    migrationPlanRefs: eventSpineMigrationPlanRefs,
    persistenceTables: eventSpinePersistenceTables,
    manifest,
    mapping,
    policyRows,
    scenarioDefinitions,
    simulation: {
      runAllScenarios(): readonly EventSpineScenarioView[] {
        const results = runEventSpineSimulationScenarios();
        return results.map((result) => {
          const transport = mapping.transportMappings.find(
            (row) => row.eventName === result.eventName,
          );
          return {
            scenarioId: result.scenarioId,
            eventName: result.eventName,
            queueRefs: transport?.queueRefs ?? [],
            consumerGroupRefs: transport?.consumerGroupRefs ?? [],
            publishedQueueRefs: result.publishedQueueRefs,
            duplicateReceiptCount: result.duplicateReceiptCount,
            gapBlockedReceiptCount: result.gapBlockedReceiptCount,
            quarantineQueueRefs: result.quarantineQueueRefs,
            replayReviewRefs: result.replayReviewRefs,
          };
        });
      },
    },
  };
}
