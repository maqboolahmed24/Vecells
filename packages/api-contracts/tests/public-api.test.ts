import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  apiContractRegistryCatalog,
  apiContractRegistrySchemas,
  adapterContractProfileCatalog,
  adapterContractProfileSchemas,
  bootstrapSharedPackage,
  frontendContractManifestCatalog,
  frontendContractManifestSchemas,
  frontendManifestRuntimeCatalog,
  frontendManifestRuntimeSchemas,
  ownedContractFamilies,
  ownedObjectFamilies,
  packageContract,
  recoveryTupleBaselineCatalog,
  recoveryTupleBaselineSchemas,
  releaseVerificationLadderCatalog,
  releaseVerificationLadderSchemas,
  scopedMutationGateCatalog,
  scopedMutationGateSchemas,
  commandSettlementEnvelopeCatalog,
  commandSettlementEnvelopeSchemas,
  queueRankingContractCatalog,
  queueRankingSchemas,
} from "../src/index.ts";
import { foundationKernelFamilies } from "@vecells/domain-kernel";
import { publishedEventFamilies } from "@vecells/event-contracts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

describe("public package surface", () => {
  it("boots through documented public contracts", () => {
    expect(packageContract.packageName).toBe("@vecells/api-contracts");
    expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
    expect(Array.isArray(ownedObjectFamilies)).toBe(true);
    expect(Array.isArray(ownedContractFamilies)).toBe(true);
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
    expect(Array.isArray(publishedEventFamilies)).toBe(true);
  });

  it("publishes the seq_050 frontend manifest schema surface", () => {
    expect(frontendContractManifestCatalog.taskId).toBe("seq_050");
    expect(frontendContractManifestCatalog.manifestCount).toBe(9);
    expect(frontendContractManifestSchemas).toHaveLength(1);

    const schemaPath = path.join(ROOT, frontendContractManifestSchemas[0].artifactPath);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("publishes the par_113 manifest runtime surface", () => {
    expect(frontendManifestRuntimeCatalog.taskId).toBe("par_113");
    expect(frontendManifestRuntimeCatalog.manifestExampleCount).toBe(4);
    expect(frontendManifestRuntimeCatalog.validationScenarioCount).toBe(6);
    expect(frontendManifestRuntimeSchemas).toHaveLength(3);

    for (const schema of frontendManifestRuntimeSchemas) {
      const schemaPath = path.join(ROOT, schema.artifactPath);
      expect(fs.existsSync(schemaPath)).toBe(true);
    }
  });

  it("publishes the par_096 browser recovery schema surface", () => {
    const schemaPath = path.join(
      ROOT,
      "packages",
      "api-contracts",
      "schemas",
      "browser-recovery-posture.schema.json",
    );
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("publishes the par_065 api contract registry schema surface", () => {
    expect(apiContractRegistryCatalog.taskId).toBe("par_065");
    expect(apiContractRegistryCatalog.routeFamilyBundleCount).toBe(19);
    expect(apiContractRegistryCatalog.clientCachePolicyCount).toBe(21);
    expect(apiContractRegistrySchemas).toHaveLength(4);

    for (const schema of apiContractRegistrySchemas) {
      const schemaPath = path.join(ROOT, schema.artifactPath);
      expect(fs.existsSync(schemaPath)).toBe(true);
    }
  });

  it("publishes the seq_056 scoped mutation schema surface", () => {
    expect(scopedMutationGateCatalog.taskId).toBe("seq_056");
    expect(scopedMutationGateCatalog.routeIntentRowCount).toBe(16);
    expect(scopedMutationGateSchemas).toHaveLength(2);

    for (const schema of scopedMutationGateSchemas) {
      const schemaPath = path.join(ROOT, schema.artifactPath);
      expect(fs.existsSync(schemaPath)).toBe(true);
    }
  });

  it("publishes the seq_057 adapter contract schema surface", () => {
    expect(adapterContractProfileCatalog.taskId).toBe("seq_057");
    expect(adapterContractProfileCatalog.adapterProfileCount).toBe(20);
    expect(adapterContractProfileCatalog.degradationProfileCount).toBe(20);
    expect(adapterContractProfileSchemas).toHaveLength(2);

    for (const schema of adapterContractProfileSchemas) {
      const schemaPath = path.join(ROOT, schema.artifactPath);
      expect(fs.existsSync(schemaPath)).toBe(true);
    }
  });

  it("publishes the seq_058 verification ladder schema surface", () => {
    expect(releaseVerificationLadderCatalog.taskId).toBe("seq_058");
    expect(releaseVerificationLadderCatalog.verificationScenarioCount).toBe(5);
    expect(releaseVerificationLadderCatalog.syntheticRecoveryCoverageCount).toBeGreaterThan(0);
    expect(releaseVerificationLadderSchemas).toHaveLength(1);

    const schemaPath = path.join(ROOT, releaseVerificationLadderSchemas[0].artifactPath);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("publishes the par_072 settlement and envelope schema surface", () => {
    expect(commandSettlementEnvelopeCatalog.taskId).toBe("par_072");
    expect(commandSettlementEnvelopeCatalog.scenarioCount).toBe(7);
    expect(commandSettlementEnvelopeCatalog.settlementRevisionCount).toBe(10);
    expect(commandSettlementEnvelopeSchemas).toHaveLength(2);

    for (const schema of commandSettlementEnvelopeSchemas) {
      const schemaPath = path.join(ROOT, schema.artifactPath);
      expect(fs.existsSync(schemaPath)).toBe(true);
    }
  });

  it("publishes the par_073 queue-ranking schema surface", () => {
    expect(queueRankingContractCatalog.taskId).toBe("par_073");
    expect(queueRankingContractCatalog.scenarioCount).toBe(6);
    expect(queueRankingSchemas).toHaveLength(4);

    for (const schema of queueRankingSchemas) {
      const schemaPath = path.join(ROOT, schema.artifactPath);
      expect(fs.existsSync(schemaPath)).toBe(true);
    }
  });
  it("publishes the seq_060 recovery posture schema surface", () => {
    expect(recoveryTupleBaselineCatalog.taskId).toBe("seq_060");
    expect(recoveryTupleBaselineCatalog.essentialFunctionCount).toBe(9);
    expect(recoveryTupleBaselineCatalog.backupManifestCount).toBeGreaterThan(0);
    expect(recoveryTupleBaselineSchemas).toHaveLength(1);

    const schemaPath = path.join(ROOT, recoveryTupleBaselineSchemas[0].artifactPath);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });
});
