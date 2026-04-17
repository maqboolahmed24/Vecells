import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "106_shell_specimen_gallery.html");
const CONTRACTS_PATH = path.join(ROOT, "data", "analysis", "persistent_shell_contracts.json");
const ROUTE_MAP_PATH = path.join(ROOT, "data", "analysis", "shell_route_residency_map.json");
const SCREENSHOT_DIR = path.join(ROOT, ".artifacts", "persistent-shell-framework");

const CONTRACTS = JSON.parse(fs.readFileSync(CONTRACTS_PATH, "utf8"));
const ROUTE_MAP = JSON.parse(fs.readFileSync(ROUTE_MAP_PATH, "utf8"));
const CLINICAL_SHELL = CONTRACTS.shells.find((shell) => shell.shellSlug === "clinical-workspace");
const OPERATIONS_SHELL = CONTRACTS.shells.find((shell) => shell.shellSlug === "ops-console");

export const persistentShellFrameworkCoverage = [
  "gallery load and specimen shell rail parity",
  "shell reuse under same shellContinuityKey",
  "same-shell morph under adjacent route families",
  "selected-anchor preservation across route changes",
  "fold and route memory preservation under mission_stack",
  "read-only preserve and recovery fallback under drift",
  "keyboard navigation and landmark integrity",
  "reduced-motion equivalence",
  "screenshot regression across xs, sm, md, lg, and xl",
  "offline local-only asset posture",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function screenshotHash(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw error;
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/106_shell_specimen_gallery.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html; charset=utf-8"
          : extension === ".json"
            ? "application/json; charset=utf-8"
            : extension === ".csv"
              ? "text/csv; charset=utf-8"
              : extension === ".css"
                ? "text/css; charset=utf-8"
                : extension === ".svg"
                  ? "image/svg+xml"
                  : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind persistent-shell gallery static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/106_shell_specimen_gallery.html`,
      });
    });
  });
}

function trackExternalRequests(page, baseOrigin, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(baseOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

async function waitForGallery(page) {
  for (const testId of [
    "shell-gallery",
    "gallery-shell-list",
    "gallery-live-shell",
    "gallery-runtime-scenario",
    "shell-gallery-inspector",
    "shell-gallery-timeline",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
}

async function shellRoot(page) {
  const root = page.locator("[data-testid='gallery-shell-root']");
  await root.waitFor();
  return root;
}

async function selectShell(page, shellSlug) {
  await page.locator(`[data-testid='gallery-shell-card-${shellSlug}']`).click();
  await shellRoot(page);
}

async function selectRuntime(page, runtimeScenario) {
  await page.locator("[data-testid='gallery-runtime-scenario']").selectOption(runtimeScenario);
  await shellRoot(page);
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Persistent shell gallery HTML is missing.");
  assertCondition(CONTRACTS.task_id === "par_106", "Persistent shell contract task drifted.");
  assertCondition(
    CONTRACTS.visual_mode === "Persistent_Shell_Framework",
    "Persistent shell visual mode drifted.",
  );
  assertCondition(CONTRACTS.summary.shell_count === 7, "Persistent shell count drifted from 7.");
  assertCondition(
    CONTRACTS.summary.primary_audience_shell_count === 6,
    "Primary audience shell count drifted from 6.",
  );
  assertCondition(
    CONTRACTS.summary.route_residency_count === 19 && Object.keys(ROUTE_MAP.routes).length === 19,
    "Route residency coverage drifted from 19.",
  );
  assertCondition(Boolean(CLINICAL_SHELL), "Missing clinical-workspace shell contract.");
  assertCondition(Boolean(OPERATIONS_SHELL), "Missing ops-console shell contract.");

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 1180 } });
    const page = await context.newPage();
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await waitForGallery(page);

    const shellCardCount = await page.locator("[data-testid^='gallery-shell-card-']").count();
    assertCondition(
      shellCardCount === CONTRACTS.summary.shell_count,
      `Shell card count drifted: expected ${CONTRACTS.summary.shell_count}, found ${shellCardCount}.`,
    );

    await page.locator("[data-testid='gallery-shell-card-patient-web']").focus();
    await page.keyboard.press("ArrowDown");
    const keyboardSelected = await page
      .locator("[data-testid='gallery-shell-card-clinical-workspace']")
      .getAttribute("data-selected");
    assertCondition(
      keyboardSelected === "true",
      "ArrowDown did not move shell-card selection to the next shell.",
    );

    await selectShell(page, "clinical-workspace");
    let liveRoot = await shellRoot(page);
    const shellFamily = await liveRoot.getAttribute("data-shell-family");
    assertCondition(shellFamily === "staff", "Clinical workspace lost its staff shell family marker.");
    const traceChipCount = await page.locator("[data-testid='gallery-trace-ribbon'] .shell-gallery__chip").count();
    assertCondition(traceChipCount === 5, `Trace ribbon drifted: expected 5 chips, found ${traceChipCount}.`);
    const residencyCount = await page.locator("[data-testid='gallery-route-residency'] li").count();
    assertCondition(
      residencyCount === CLINICAL_SHELL.routeClaims.length,
      `Clinical route residency inspector drifted: expected ${CLINICAL_SHELL.routeClaims.length}, found ${residencyCount}.`,
    );

    await page.locator("[data-testid='gallery-anchor-queue-decision']").click();
    const continuityBefore = await liveRoot.getAttribute("data-shell-continuity-key");
    assertCondition(
      continuityBefore === CLINICAL_SHELL.ownership.continuityKey,
      "Clinical workspace lost its continuity key marker.",
    );

    await page.locator("[data-testid='gallery-route-rf_staff_workspace_child']").click();
    liveRoot = await shellRoot(page);
    const continuityAfter = await liveRoot.getAttribute("data-shell-continuity-key");
    const selectedAnchorAfterMorph = await liveRoot.getAttribute("data-selected-anchor");
    const sameShellBoundary = await page.locator("[data-testid='gallery-boundary-state']").innerText();
    assertCondition(
      continuityAfter === continuityBefore,
      "Same-shell route morph should preserve the shellContinuityKey.",
    );
    assertCondition(
      selectedAnchorAfterMorph === "queue-decision",
      "Selected anchor should survive the clinical same-shell object switch.",
    );
    assertCondition(
      sameShellBoundary === "Same-shell morph",
      `Expected Same-shell morph boundary, found ${sameShellBoundary}.`,
    );
    const childActive = await page
      .locator("[data-testid='gallery-route-rf_staff_workspace_child']")
      .getAttribute("data-active");
    assertCondition(childActive === "true", "Clinical child route did not become active.");

    await page.locator("[data-testid='gallery-breakpoint-xs']").click();
    liveRoot = await shellRoot(page);
    assertCondition(
      (await liveRoot.getAttribute("data-layout-topology")) === "mission_stack",
      "XS breakpoint should resolve clinical-workspace to mission_stack.",
    );
    await page.locator("[data-testid='gallery-fold-toggle']").click();
    liveRoot = await shellRoot(page);
    assertCondition(
      (await liveRoot.getAttribute("data-fold-state")) === "folded",
      "Fold toggle did not persist folded state.",
    );
    await page.locator("[data-testid='gallery-route-rf_staff_workspace']").click();
    liveRoot = await shellRoot(page);
    assertCondition(
      (await liveRoot.getAttribute("data-fold-state")) === "folded",
      "Mission stack fold state should survive route changes.",
    );
    assertCondition(
      (await liveRoot.getAttribute("data-selected-anchor")) === "queue-decision",
      "Mission stack route change should preserve the selected anchor.",
    );
    await page.locator("[data-testid='gallery-route-rf_staff_workspace_child']").click();

    await selectShell(page, "ops-console");
    const replaceShellBoundary = await page.locator("[data-testid='gallery-boundary-state']").innerText();
    assertCondition(
      replaceShellBoundary === "Replace shell",
      `Cross-family shell switch should replace the shell, found ${replaceShellBoundary}.`,
    );

    await selectShell(page, "clinical-workspace");
    liveRoot = await shellRoot(page);
    assertCondition(
      (await liveRoot.getAttribute("data-fold-state")) === "folded",
      "Clinical shell did not restore its persisted fold state after a shell switch.",
    );
    const restoredChildActive = await page
      .locator("[data-testid='gallery-route-rf_staff_workspace_child']")
      .getAttribute("data-active");
    assertCondition(
      restoredChildActive === "true",
      "Clinical shell did not restore its persisted child route.",
    );

    await selectRuntime(page, "read_only");
    liveRoot = await shellRoot(page);
    assertCondition(
      (await liveRoot.getAttribute("data-runtime-posture")) === "read_only",
      "Runtime posture did not update to read_only.",
    );
    await page.locator("[data-testid='gallery-route-rf_staff_workspace']").click();
    await page.locator("[data-testid='gallery-route-rf_staff_workspace_child']").click();
    liveRoot = await shellRoot(page);
    const readOnlyBoundary = await page.locator("[data-testid='gallery-boundary-state']").innerText();
    assertCondition(
      readOnlyBoundary === "Preserve read-only",
      `Expected Preserve read-only boundary, found ${readOnlyBoundary}.`,
    );
    assertCondition(
      (await liveRoot.getAttribute("data-selected-anchor")) === "queue-decision",
      "Read-only preserve should freeze the selected anchor inside the same shell.",
    );

    await selectShell(page, "ops-console");
    await page.locator("[data-testid='gallery-anchor-board-health']").click();
    await selectRuntime(page, "recovery_only");
    await page.locator("[data-testid='gallery-route-rf_operations_drilldown']").click();
    liveRoot = await shellRoot(page);
    const recoveryBoundary = await page.locator("[data-testid='gallery-boundary-state']").innerText();
    assertCondition(
      recoveryBoundary === "Recover in place",
      `Expected Recover in place boundary, found ${recoveryBoundary}.`,
    );
    assertCondition(
      (await liveRoot.getAttribute("data-runtime-posture")) === "recovery_only",
      "Operations shell lost its recovery_only runtime marker.",
    );
    assertCondition(
      (await liveRoot.getAttribute("data-selected-anchor")) === "board-intervention",
      "Recovery fallback should reset to the route default anchor when the prior anchor is invalid.",
    );

    await selectShell(page, "clinical-workspace");
    await selectRuntime(page, "live");
    await page.locator("[data-testid='gallery-route-rf_staff_workspace']").click();
    await page.locator("[data-testid='gallery-anchor-queue-active-case']").click();

    const breakpointShots = [
      { breakpoint: "xs", width: 390, height: 844, expectedTopology: "mission_stack" },
      { breakpoint: "sm", width: 640, height: 900, expectedTopology: "mission_stack" },
      { breakpoint: "md", width: 900, height: 1024, expectedTopology: "two_plane" },
      { breakpoint: "lg", width: 1280, height: 1120, expectedTopology: "two_plane" },
      { breakpoint: "xl", width: 1600, height: 1180, expectedTopology: "two_plane" },
    ];
    const screenshotHashes = [];

    for (const shot of breakpointShots) {
      await page.setViewportSize({ width: shot.width, height: shot.height });
      await page.locator(`[data-testid='gallery-breakpoint-${shot.breakpoint}']`).scrollIntoViewIfNeeded();
      await page.locator(`[data-testid='gallery-breakpoint-${shot.breakpoint}']`).click();
      liveRoot = await shellRoot(page);
      assertCondition(
        (await liveRoot.getAttribute("data-layout-topology")) === shot.expectedTopology,
        `Topology drifted for ${shot.breakpoint}.`,
      );
      const buffer = await page.locator("[data-testid='gallery-live-shell']").screenshot({
        animations: "disabled",
        path: path.join(SCREENSHOT_DIR, `clinical-workspace-${shot.breakpoint}.png`),
      });
      assertCondition(
        buffer.byteLength > 1000,
        `Screenshot capture failed for ${shot.breakpoint}.`,
      );
      screenshotHashes.push(screenshotHash(buffer));
    }

    assertCondition(
      new Set(screenshotHashes).size === breakpointShots.length,
      "Breakpoint screenshot set collapsed to duplicate renders.",
    );

    const landmarks = await page.locator("header, main, aside, section, footer, nav").count();
    assertCondition(
      landmarks >= 10,
      `Accessibility smoke failed: expected multiple landmarks, found ${landmarks}.`,
    );

    const reducedContext = await browser.newContext({
      viewport: { width: 1320, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    trackExternalRequests(reducedPage, baseOrigin, externalRequests);
    try {
      await reducedPage.goto(url, { waitUntil: "networkidle" });
      await reducedPage.evaluate(() => window.localStorage.clear());
      await reducedPage.reload({ waitUntil: "networkidle" });
      await waitForGallery(reducedPage);
      await selectShell(reducedPage, "clinical-workspace");
      await reducedPage
        .locator("[data-testid='gallery-anchor-queue-decision']")
        .click({ force: true });
      await reducedPage
        .locator("[data-testid='gallery-route-rf_staff_workspace_child']")
        .click({ force: true });
      const reducedRoot = await shellRoot(reducedPage);
      const reducedBoundary = await reducedPage
        .locator("[data-testid='gallery-boundary-state']")
        .innerText();
      assertCondition(
        (await reducedPage.locator("body").getAttribute("data-reduced-motion")) === "true",
        "Reduced-motion browser preference did not activate gallery reduced-motion posture.",
      );
      assertCondition(
        reducedBoundary === "Same-shell morph",
        "Reduced-motion mode changed the shell boundary meaning.",
      );
      assertCondition(
        (await reducedRoot.getAttribute("data-selected-anchor")) === "queue-decision",
        "Reduced-motion mode changed selected-anchor preservation.",
      );
    } finally {
      await reducedContext.close();
    }

    assertCondition(
      externalRequests.size === 0,
      `Persistent shell gallery should be offline-complete, found external requests: ${[
        ...externalRequests,
      ].join(", ")}`,
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
