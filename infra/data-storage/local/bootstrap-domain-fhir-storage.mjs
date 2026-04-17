import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

const domainManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "domain_store_manifest.json"), "utf8"),
);
const fhirManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "fhir_store_manifest.json"), "utf8"),
);

const plan = {
  taskId: "par_085",
  mode: "Data_Storage_Topology_Atlas",
  stores: [
    {
      storeRef: domainManifest.store_descriptor.store_ref,
      bootstrapSqlRefs: domainManifest.store_descriptor.bootstrap_sql_refs,
      defaultDsnEnv: "VECELLS_DOMAIN_STORE_DSN",
    },
    {
      storeRef: fhirManifest.store_descriptor.store_ref,
      bootstrapSqlRefs: fhirManifest.store_descriptor.bootstrap_sql_refs,
      defaultDsnEnv: "VECELLS_FHIR_STORE_DSN",
    },
  ],
};

function resolveSql(ref) {
  return path.join(ROOT, ref);
}

function emitPlan() {
  process.stdout.write(JSON.stringify(plan, null, 2));
  process.stdout.write("\n");
}

if (process.argv.includes("--emit-plan")) {
  const index = process.argv.indexOf("--emit-plan");
  const outputPath = process.argv[index + 1];
  if (!outputPath) {
    throw new Error("Missing path after --emit-plan");
  }
  fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2) + "\n", "utf8");
}

if (process.argv.includes("--dry-run") || !process.argv.includes("--apply")) {
  emitPlan();
  process.exit(0);
}

for (const store of plan.stores) {
  const dsn = process.env[store.defaultDsnEnv];
  if (!dsn) {
    throw new Error(`Missing ${store.defaultDsnEnv} for --apply`);
  }
  for (const sqlRef of store.bootstrapSqlRefs) {
    const sqlPath = resolveSql(sqlRef);
    const result = spawnSync("psql", [dsn, "-f", sqlPath], { stdio: "inherit" });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}
