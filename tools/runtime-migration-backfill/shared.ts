import fs from "node:fs";
import path from "node:path";
import type {
  GovernedProjectionBackfillPlan,
  MigrationExecutionBinding,
  SchemaMigrationPlan,
} from "../../packages/release-controls/src/migration-backfill.ts";
import { createMigrationBackfillSimulationHarness } from "../../packages/release-controls/src/migration-backfill.ts";
import {
  loadPublicationArtifacts,
  toCurrentBundle,
  toCurrentParity,
} from "../runtime-publication/shared.ts";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

export interface CliArgs {
  [key: string]: string;
}

export interface MigrationBackfillControlCatalog {
  task_id: string;
  records: Array<{
    scenarioId: string;
    environmentRef: string;
    verdictState: string;
    settlementResult: string;
    observedMinutes: number;
    observedSamples: number;
    comparisonMatches: boolean;
    rollbackModeMatches: boolean;
    plan: SchemaMigrationPlan;
    backfillPlan: GovernedProjectionBackfillPlan;
    binding: MigrationExecutionBinding;
  }>;
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

export function loadControlCatalog(): MigrationBackfillControlCatalog {
  return readJson<MigrationBackfillControlCatalog>(
    path.join(ROOT, "data", "analysis", "migration_backfill_control_catalog.json"),
  );
}

export function loadRecord(environmentRef: string) {
  const catalog = loadControlCatalog();
  const exact = catalog.records.find(
    (row) => row.environmentRef === environmentRef && row.verdictState !== "blocked",
  );
  if (exact) {
    return exact;
  }
  const fallback = catalog.records.find((row) => row.environmentRef === environmentRef);
  if (fallback) {
    return fallback;
  }
  throw new Error(`No migration/backfill control record found for ${environmentRef}.`);
}

export function hydrateExecutionContext(environmentRef: string) {
  const record = loadRecord(environmentRef);
  const publicationArtifacts = loadPublicationArtifacts(environmentRef);
  const harness = createMigrationBackfillSimulationHarness();
  return {
    record,
    plan: record.plan,
    backfillPlan: record.backfillPlan,
    binding: {
      ...record.binding,
      environmentRef,
      runtimePublicationBundleRef: publicationArtifacts.bundle.runtimePublicationBundleId,
      releasePublicationParityRef: publicationArtifacts.parity.publicationParityRecordId,
      preCutoverPublicationBundleRef: publicationArtifacts.bundle.runtimePublicationBundleId,
      targetPublicationBundleRef: publicationArtifacts.bundle.runtimePublicationBundleId,
      rollbackPublicationBundleRef: publicationArtifacts.bundle.runtimePublicationBundleId,
    },
    bundle: publicationArtifacts.bundle,
    currentBundle: toCurrentBundle(publicationArtifacts.bundle),
    parityRecord: publicationArtifacts.parity,
    currentParity: toCurrentParity(publicationArtifacts.parity),
    store: harness.store,
    runner: harness.runner,
    projectionWorker: harness.projectionWorker,
    eventStream: harness.eventStream,
  };
}
