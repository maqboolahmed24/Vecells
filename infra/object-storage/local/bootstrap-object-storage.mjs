import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const catalog = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "infra", "object-storage", "bootstrap", "object-storage-seed-catalog.json"),
    "utf8",
  ),
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "object_storage_class_manifest.json"), "utf8"),
);

const plan = {
  taskId: "par_086",
  mode: "Object_Storage_Retention_Atlas",
  storageClasses: manifest.storage_classes.map((row) => ({
    storageClassRef: row.storage_class_ref,
    manifestRuleRef: row.manifest_rule_ref,
    browserDeliveryPosture: row.browser_delivery_posture,
  })),
  fixtures: catalog,
};

function emitPlan() {
  process.stdout.write(JSON.stringify(plan, null, 2));
  process.stdout.write("\n");
}

function ensureEmptyDirectory(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(targetPath, { recursive: true });
}

function writeFixture(seedDir, fixture) {
  const objectPath = path.join(seedDir, fixture.storage_class_ref, fixture.object_key);
  fs.mkdirSync(path.dirname(objectPath), { recursive: true });
  const bytes = Buffer.from(`${fixture.fixture_ref}:${fixture.payload_sha256}`, "utf8");
  fs.writeFileSync(objectPath, bytes);
  fs.writeFileSync(
    `${objectPath}.manifest.json`,
    JSON.stringify(
      {
        fixtureRef: fixture.fixture_ref,
        storageClassRef: fixture.storage_class_ref,
        governingObjectRef: fixture.governing_object_ref,
        artifactRef: fixture.artifact_ref,
        tenantScopeDigest: fixture.tenant_scope_digest,
        lineageScopeDigest: fixture.lineage_scope_digest,
        payloadSha256: fixture.payload_sha256,
        sampleManifestRef: fixture.sample_manifest_ref,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

if (process.argv.includes("--emit-plan")) {
  const index = process.argv.indexOf("--emit-plan");
  const outputPath = process.argv[index + 1];
  if (!outputPath) {
    throw new Error("Missing path after --emit-plan");
  }
  fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2) + "\n", "utf8");
}

if (process.argv.includes("--seed-dir")) {
  const index = process.argv.indexOf("--seed-dir");
  const seedDir = process.argv[index + 1];
  if (!seedDir) {
    throw new Error("Missing path after --seed-dir");
  }
  ensureEmptyDirectory(seedDir);
  for (const fixture of catalog) {
    writeFixture(seedDir, fixture);
  }
}

if (process.argv.includes("--dry-run") || !process.argv.includes("--seed-dir")) {
  emitPlan();
}
