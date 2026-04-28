import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

const PREVIEW_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "preview_environment_manifest.json");
const SEED_PACK_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "preview_seed_pack_manifest.json");
const BROWSER_POLICY_PATH = path.join(
  ROOT,
  "infra",
  "preview-environments",
  "local",
  "preview-browser-policy.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

export function loadPreviewData() {
  const previewManifest = readJson(PREVIEW_MANIFEST_PATH);
  const seedPackManifest = readJson(SEED_PACK_MANIFEST_PATH);
  const browserPolicy = readJson(BROWSER_POLICY_PATH);
  return { previewManifest, seedPackManifest, browserPolicy };
}

export function resolvePreviewEnvironment(previewEnvironmentRef) {
  const { previewManifest, seedPackManifest, browserPolicy } = loadPreviewData();
  const previewEnvironment = previewManifest.preview_environments.find(
    (row) => row.previewEnvironmentRef === previewEnvironmentRef,
  );
  if (!previewEnvironment) {
    throw new Error(`Unknown preview environment: ${previewEnvironmentRef}`);
  }
  const seedPack = seedPackManifest.seed_packs.find(
    (row) => row.seedPackRef === previewEnvironment.seedPackRef,
  );
  if (!seedPack) {
    throw new Error(`Missing seed pack for preview environment: ${previewEnvironmentRef}`);
  }
  return { previewEnvironment, seedPack, browserPolicy };
}

function previewRoot(stateDir, previewEnvironmentRef) {
  return path.join(stateDir, previewEnvironmentRef);
}

function bannerPayload(previewEnvironment, seedPack, browserPolicy) {
  return {
    previewEnvironmentRef: previewEnvironment.previewEnvironmentRef,
    seedPackRef: seedPack.seedPackRef,
    bannerText: previewEnvironment.browserBannerText,
    bannerMarker: previewEnvironment.browserBannerMarker,
    domMarkers: browserPolicy.preview_truth_markers,
    diagnosticsClass: "masked",
    tupleHash: previewEnvironment.runtimeTupleHash,
  };
}

function substratePayload(previewEnvironment, seedPack, substrateFixture) {
  return {
    previewEnvironmentRef: previewEnvironment.previewEnvironmentRef,
    environmentRing: previewEnvironment.environmentRing,
    seedPackRef: seedPack.seedPackRef,
    runtimeTupleHash: previewEnvironment.runtimeTupleHash,
    seedTupleHash: seedPack.canonicalSeedTupleHash,
    substrateRef: substrateFixture.substrateRef,
    fixtureSetRef: substrateFixture.fixtureSetRef,
    resetMode: substrateFixture.resetMode,
    recordCount: substrateFixture.recordCount,
    expectedTupleHash: substrateFixture.tupleHash,
  };
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function baselinePayload(previewEnvironment, seedPack) {
  const substrateBaseline = Object.fromEntries(
    seedPack.substrateFixtures.map((fixture) => [fixture.substrateRef, fixture.tupleHash]),
  );
  return {
    previewEnvironmentRef: previewEnvironment.previewEnvironmentRef,
    runtimeTupleHash: previewEnvironment.runtimeTupleHash,
    topologyTupleHash: previewEnvironment.topologyTupleHash,
    seedPackRef: seedPack.seedPackRef,
    seedTupleHash: seedPack.canonicalSeedTupleHash,
    substrateBaseline,
    baselineDigest: stableHash({
      runtimeTupleHash: previewEnvironment.runtimeTupleHash,
      substrateBaseline,
    }),
  };
}

export function createPreviewEnvironment({ previewEnvironmentRef, stateDir }) {
  const { previewEnvironment, seedPack, browserPolicy } = resolvePreviewEnvironment(previewEnvironmentRef);
  const envRoot = previewRoot(stateDir, previewEnvironmentRef);
  fs.rmSync(envRoot, { recursive: true, force: true });
  ensureDirectory(envRoot);

  writeJson(path.join(envRoot, "environment.json"), {
    previewEnvironmentRef: previewEnvironment.previewEnvironmentRef,
    environmentRing: previewEnvironment.environmentRing,
    seedPackRef: previewEnvironment.seedPackRef,
    state: previewEnvironment.state,
    driftState: previewEnvironment.driftState,
    expiryWindow: previewEnvironment.expiryWindow,
    runtimeTupleHash: previewEnvironment.runtimeTupleHash,
    topologyTupleHash: previewEnvironment.topologyTupleHash,
    createdAt: previewEnvironment.createdAt,
    expiresAt: previewEnvironment.expiresAt,
    publicationBindingState: previewEnvironment.publicationBindingState,
  });

  writeJson(
    path.join(envRoot, "browser", "surface-banner.json"),
    bannerPayload(previewEnvironment, seedPack, browserPolicy),
  );

  for (const fixture of seedPack.substrateFixtures) {
    writeJson(
      path.join(envRoot, "substrates", `${fixture.substrateRef}.json`),
      substratePayload(previewEnvironment, seedPack, fixture),
    );
  }

  writeJson(path.join(envRoot, "drift-baseline.json"), baselinePayload(previewEnvironment, seedPack));

  return {
    taskId: "par_092",
    mode: "bootstrap",
    previewEnvironmentRef: previewEnvironment.previewEnvironmentRef,
    environmentRing: previewEnvironment.environmentRing,
    seedPackRef: seedPack.seedPackRef,
    runtimeTupleHash: previewEnvironment.runtimeTupleHash,
    substrateCount: seedPack.substrateFixtures.length,
    expiresAt: previewEnvironment.expiresAt,
    browserBannerMarker: previewEnvironment.browserBannerMarker,
  };
}

export function detectPreviewDrift({ previewEnvironmentRef, stateDir }) {
  const { previewEnvironment, seedPack, browserPolicy } = resolvePreviewEnvironment(previewEnvironmentRef);
  const envRoot = previewRoot(stateDir, previewEnvironmentRef);
  if (!fs.existsSync(envRoot)) {
    return {
      previewEnvironmentRef,
      driftState: "missing_state",
      mismatches: ["preview_environment_root_missing"],
      browserMarkerValid: false,
      expired: previewEnvironment.expiryWindow === "expired",
    };
  }

  const baseline = readJson(path.join(envRoot, "drift-baseline.json"));
  const mismatches = [];

  const environmentState = readJson(path.join(envRoot, "environment.json"));
  if (environmentState.runtimeTupleHash !== previewEnvironment.runtimeTupleHash) {
    mismatches.push("runtime_tuple_hash");
  }

  for (const fixture of seedPack.substrateFixtures) {
    const substratePath = path.join(envRoot, "substrates", `${fixture.substrateRef}.json`);
    if (!fs.existsSync(substratePath)) {
      mismatches.push(fixture.substrateRef);
      continue;
    }
    const substrate = readJson(substratePath);
    if (substrate.expectedTupleHash !== baseline.substrateBaseline[fixture.substrateRef]) {
      mismatches.push(fixture.substrateRef);
    }
  }

  const banner = readJson(path.join(envRoot, "browser", "surface-banner.json"));
  const browserMarkerValid =
    banner.bannerMarker === previewEnvironment.browserBannerMarker &&
    browserPolicy.preview_truth_markers.every((marker) => banner.domMarkers.includes(marker));
  if (!browserMarkerValid) {
    mismatches.push("browser_surface_banner");
  }

  return {
    previewEnvironmentRef,
    driftState: mismatches.length ? "seed_drift" : "clean",
    mismatches,
    browserMarkerValid,
    expired: previewEnvironment.expiryWindow === "expired",
  };
}

export function resetPreviewEnvironment({ previewEnvironmentRef, stateDir }) {
  const report = createPreviewEnvironment({ previewEnvironmentRef, stateDir });
  return {
    ...report,
    mode: "reset",
    visibleReset: true,
  };
}

export function teardownPreviewEnvironment({ previewEnvironmentRef, stateDir }) {
  const envRoot = previewRoot(stateDir, previewEnvironmentRef);
  fs.rmSync(envRoot, { recursive: true, force: true });
  return {
    taskId: "par_092",
    mode: "teardown",
    previewEnvironmentRef,
    removed: !fs.existsSync(envRoot),
  };
}
