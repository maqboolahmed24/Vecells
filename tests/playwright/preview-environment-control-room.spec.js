import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "92_preview_environment_control_room.html",
);
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "preview_environment_manifest.json");
const SEED_PACK_PATH = path.join(ROOT, "data", "analysis", "preview_seed_pack_manifest.json");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const SEED_MANIFEST = JSON.parse(fs.readFileSync(SEED_PACK_PATH, "utf8"));

export const previewEnvironmentControlRoomCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that expired or drifted environments are visibly and semantically distinct from ready ones",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function filteredEnvironments({
  ownerRef = "all",
  envState = "all",
  seedPackRef = "all",
  driftState = "all",
  expiryWindow = "all",
} = {}) {
  return MANIFEST.preview_environments.filter((row) => {
    if (ownerRef !== "all" && row.ownerRef !== ownerRef) return false;
    if (envState !== "all" && row.state !== envState) return false;
    if (seedPackRef !== "all" && row.seedPackRef !== seedPackRef) return false;
    if (driftState !== "all" && row.driftState !== driftState) return false;
    if (expiryWindow !== "all" && row.expiryWindow !== expiryWindow) return false;
    return true;
  });
}

function filteredResetEvents(environmentRows) {
  const visible = new Set(environmentRows.map((row) => row.previewEnvironmentRef));
  return MANIFEST.reset_events.filter((row) => visible.has(row.previewEnvironmentRef));
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/92_preview_environment_control_room.html"
          : rawUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(ROOT, safePath);
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4392, "127.0.0.1", () => resolve(server));
  });
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing preview control room HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.PREVIEW_ENVIRONMENT_CONTROL_ROOM_URL ??
    "http://127.0.0.1:4392/docs/architecture/92_preview_environment_control_room.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='environment-grid']").waitFor();
    await page.locator("[data-testid='seed-matrix']").waitFor();
    await page.locator("[data-testid='ttl-timeline']").waitFor();
    await page.locator("[data-testid='manifest-table']").waitFor();
    await page.locator("[data-testid='reset-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialEnvironmentCount = await page
      .locator("[data-testid^='environment-card-']")
      .count();
    assertCondition(
      initialEnvironmentCount === MANIFEST.preview_environments.length,
      `Initial environment count drifted: expected ${MANIFEST.preview_environments.length}, found ${initialEnvironmentCount}`,
    );

    await page.locator("[data-testid='filter-owner']").selectOption("team_support_workspace");
    const supportRows = filteredEnvironments({ ownerRef: "team_support_workspace" });
    const supportCount = await page.locator("[data-testid^='environment-card-']").count();
    assertCondition(
      supportCount === supportRows.length,
      `Owner filter drifted: expected ${supportRows.length}, found ${supportCount}`,
    );
    await page.locator("[data-testid='environment-card-pev_branch_support_replay']").click();
    const supportInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      supportInspector.includes("pev_branch_support_replay") &&
        supportInspector.includes("support replay branch"),
      "Support environment selection lost inspector parity.",
    );
    await page.locator("[data-testid='seed-row-psp_support_replay_suite']").click();
    const seedInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      seedInspector.includes("psp_support_replay_suite") &&
        seedInspector.includes("Support Replay Recovery Suite"),
      "Seed pack selection no longer synchronizes the inspector.",
    );

    await page.locator("[data-testid='filter-owner']").selectOption("all");
    await page.locator("[data-testid='filter-env-state']").selectOption("drifted");
    const driftedRows = filteredEnvironments({ envState: "drifted" });
    const driftedCount = await page.locator("[data-testid^='environment-card-']").count();
    const driftedResetCount = await page.locator("[data-testid^='reset-row-']").count();
    assertCondition(
      driftedCount === driftedRows.length,
      `Drifted filter drifted: expected ${driftedRows.length}, found ${driftedCount}`,
    );
    assertCondition(
      driftedResetCount === filteredResetEvents(driftedRows).length,
      "Drifted filter no longer keeps reset table in sync.",
    );
    await page.locator("[data-testid='environment-card-pev_rc_pharmacy_dispatch']").click();
    const driftedInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      driftedInspector.includes("publication_drift") &&
        driftedInspector.includes("FOLLOW_ON_DEPENDENCY_091_NONPROD_PROMOTION_ATTESTATION_PENDING"),
      "Drifted environment lost its follow-on dependency or drift posture.",
    );

    await page.locator("[data-testid='filter-env-state']").selectOption("all");
    await page.locator("[data-testid='filter-expiry-window']").selectOption("expired");
    const expiredRows = filteredEnvironments({ expiryWindow: "expired" });
    const expiredCount = await page.locator("[data-testid^='environment-card-']").count();
    assertCondition(
      expiredCount === expiredRows.length,
      `Expired filter drifted: expected ${expiredRows.length}, found ${expiredCount}`,
    );
    await page.locator("[data-testid='environment-card-pev_rc_governance_audit']").click();
    const expiredInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      expiredInspector.includes("expired") && expiredInspector.includes("reset_required"),
      "Expired environment is no longer semantically distinct from ready ones.",
    );

    await page.locator("[data-testid='filter-expiry-window']").selectOption("all");
    const firstEnv = MANIFEST.preview_environments[0].previewEnvironmentRef;
    const secondEnv = MANIFEST.preview_environments[1].previewEnvironmentRef;
    await page.locator(`[data-testid='environment-card-${firstEnv}']`).focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator(`[data-testid='environment-card-${secondEnv}']`)
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-key navigation no longer advances preview environment selection.",
    );

    await page.setViewportSize({ width: 900, height: 1100 });
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarkCount = await page.locator("header, main, aside").count();
    assertCondition(
      landmarkCount >= 3,
      `Accessibility smoke failed: expected multiple landmarks, found ${landmarkCount}.`,
    );

    assertCondition(
      SEED_MANIFEST.seed_packs.some((row) => row.parallelInterfaceGapRefs.length > 0),
      "Seed pack manifest lost its bounded gap coverage.",
    );
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
