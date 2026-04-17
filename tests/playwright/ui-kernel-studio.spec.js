import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "104_ui_kernel_studio.html");
const PUBLICATION_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "design_contract_publication_bundle.json",
);
const LINT_PATH = path.join(ROOT, "data", "analysis", "design_contract_lint_verdicts.json");
const AUTOMATION_PATH = path.join(ROOT, "data", "analysis", "automation_anchor_maps.json");
const ACCESSIBILITY_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "accessibility_semantic_coverage_profiles.json",
);

const PUBLICATION = JSON.parse(fs.readFileSync(PUBLICATION_PATH, "utf8"));
const LINT = JSON.parse(fs.readFileSync(LINT_PATH, "utf8"));
const AUTOMATION = JSON.parse(fs.readFileSync(AUTOMATION_PATH, "utf8"));
const ACCESSIBILITY = JSON.parse(fs.readFileSync(ACCESSIBILITY_PATH, "utf8"));

const BUNDLE_BY_ID = new Map(
  PUBLICATION.designContractPublicationBundles.map((row) => [row.designContractPublicationBundleId, row]),
);
const SCENARIO_BY_ROUTE = new Map(PUBLICATION.studio_scenarios.map((row) => [row.routeFamilyRef, row]));
const AUTOMATION_BY_ROUTE = new Map(PUBLICATION.automationAnchorMaps.map((row) => [row.surfaceRef, row]));
const ACCESSIBILITY_BY_ROUTE = new Map(
  PUBLICATION.accessibilitySemanticCoverageProfiles.map((row) => [row.routeFamilyRef, row]),
);
const LINT_BY_BUNDLE = new Map(
  LINT.designContractLintVerdicts.map((row) => [row.designContractPublicationBundleRef, row]),
);

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function slugify(value) {
  return value.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
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
      pathname = "/docs/architecture/104_ui_kernel_studio.html";
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
        reject(new Error("Unable to bind Kernel Studio static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/104_ui_kernel_studio.html`,
      });
    });
  });
}

async function previewDataset(page) {
  return page.locator("[data-testid='preview-root']").evaluate((node) => ({ ...node.dataset }));
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "UI Kernel Studio HTML is missing.");
  assertCondition(PUBLICATION.task_id === "par_104", "Publication task drifted from par_104.");
  assertCondition(PUBLICATION.visual_mode === "Kernel_Atlas", "Kernel Atlas mode drifted.");
  assertCondition(
    JSON.stringify(PUBLICATION.summary) ===
      JSON.stringify({
        bundle_count: 9,
        route_family_count: 19,
        exact_binding_count: 14,
        stale_binding_count: 1,
        blocked_binding_count: 4,
        accessibility_complete_count: 15,
        accessibility_degraded_count: 4,
        lint_pass_count: 5,
        lint_blocked_count: 4,
      }),
    "Publication summary drifted.",
  );
  assertCondition(
    JSON.stringify(LINT.summary) ===
      JSON.stringify({
        lint_verdict_count: 9,
        pass_count: 5,
        blocked_count: 4,
      }),
    "Lint summary drifted.",
  );
  assertCondition(
    AUTOMATION.summary.automation_anchor_map_count === 19,
    "Automation anchor map count drifted.",
  );
  assertCondition(
    ACCESSIBILITY.summary.complete_count === 15 &&
      ACCESSIBILITY.summary.degraded_count === 4 &&
      ACCESSIBILITY.summary.blocked_count === 0,
    "Accessibility coverage summary drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 1180 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "kernel-shell",
      "kernel-masthead",
      "bundle-switcher",
      "route-family-selector",
      "mode-strip",
      "preview-plane",
      "preview-root",
      "inspector-panel",
      "precedence-visualizer",
      "automation-panel",
      "accessibility-panel",
      "artifact-panel",
      "telemetry-panel",
      "reduced-motion-equivalence",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const bundleCardCount = await page.locator(".bundle-card").count();
    assertCondition(
      bundleCardCount === PUBLICATION.designContractPublicationBundles.length,
      `Expected ${PUBLICATION.designContractPublicationBundles.length} bundle cards, found ${bundleCardCount}.`,
    );

    const defaultBundle = PUBLICATION.designContractPublicationBundles[0];
    const defaultDigestRow = await page.locator("[data-testid='masthead-digest-row']").innerText();
    assertCondition(
      defaultDigestRow.includes(defaultBundle.designContractDigestRef) &&
        defaultDigestRow.includes("light / standard / balanced / reduced"),
      "Default digest row lost the bundle digest or default mode tuple.",
    );
    assertCondition(
      (await page.locator("[data-testid='route-family-selector'] option").count()) ===
        defaultBundle.routeFamilyRefs.length,
      "Default route selector options drifted from the first bundle route list.",
    );

    const operationsBundleId = "dcpb::operations_console::planned";
    const operationsBundle = BUNDLE_BY_ID.get(operationsBundleId);
    const operationsVerdict = LINT_BY_BUNDLE.get(operationsBundleId);
    await page.locator(`[data-testid='bundle-card-${slugify(operationsBundleId)}']`).click();

    let preview = await previewDataset(page);
    assertCondition(
      preview.routeFamily === operationsBundle.routeFamilyRefs[0] &&
        preview.shellType === "operations" &&
        preview.designContractState === operationsBundle.publicationState &&
        preview.designContractLintState === operationsVerdict.result &&
        preview.layoutTopology === "three_plane",
      "Operations bundle selection did not sync the preview root dataset.",
    );

    const operationsBoardRoute = "rf_operations_board";
    const operationsBoardScenario = SCENARIO_BY_ROUTE.get(operationsBoardRoute);
    const operationsBoardAccessibility = ACCESSIBILITY_BY_ROUTE.get(operationsBoardRoute);
    assertCondition(
      preview.anchorState === operationsBoardScenario.bindingState &&
        preview.accessibilityCoverageState === operationsBoardAccessibility.coverageState &&
        preview.liveAnnounceState === operationsBoardScenario.ariaLiveMode,
      "Operations board preview lost blocked or degraded kernel markers.",
    );

    await page.locator("[data-testid='route-family-selector']").selectOption("rf_operations_drilldown");
    preview = await previewDataset(page);
    const drilldownRoute = "rf_operations_drilldown";
    const drilldownScenario = SCENARIO_BY_ROUTE.get(drilldownRoute);
    const drilldownAutomation = AUTOMATION_BY_ROUTE.get(drilldownRoute);
    const drilldownAccessibility = ACCESSIBILITY_BY_ROUTE.get(drilldownRoute);

    assertCondition(
      preview.routeFamily === drilldownRoute &&
        preview.anchorId === drilldownAutomation.selectedAnchorMarkerRef &&
        preview.anchorState === drilldownScenario.bindingState &&
        preview.artifactMode === drilldownScenario.artifactModeState &&
        preview.transferState === drilldownScenario.artifactPosture &&
        preview.accessibilityCoverageState === drilldownAccessibility.coverageState,
      "Route selector did not sync the blocked drilldown route.",
    );

    const inspectorText = await page.locator("[data-testid='inspector-panel']").innerText();
    assertCondition(
      inspectorText.includes(operationsBundleId) &&
        inspectorText.includes("blocked") &&
        inspectorText.includes(drilldownAccessibility.coverageTupleHash),
      "Inspector lost blocked operations drilldown detail.",
    );

    await page.locator("[data-testid='precedence-postureState']").selectOption("read_only");
    await page.locator("[data-testid='precedence-stateClass']").selectOption("settled");
    await page.locator("[data-testid='precedence-freshnessState']").selectOption("fresh");
    await page.locator("[data-testid='precedence-trustState']").selectOption("trusted");
    await page.locator("[data-testid='precedence-settlementState']").selectOption("settled");
    await page.locator("[data-testid='precedence-writableState']").selectOption("read_only");
    await page
      .locator("[data-testid='precedence-artifactModeState']")
      .selectOption("preview_verified");

    let precedenceText = await page.locator("[data-testid='precedence-visualizer']").innerText();
    assertCondition(
      precedenceText.includes("State: read_only") &&
        precedenceText.includes("Tone: neutral") &&
        precedenceText.includes("Motion: motion.degrade"),
      "Read-only precedence gap resolution is not reflected in the browser visualizer.",
    );

    await page.locator("[data-testid='precedence-postureState']").selectOption("blocked_recovery");
    await page.locator("[data-testid='precedence-stateClass']").selectOption("blocked");
    await page.locator("[data-testid='precedence-freshnessState']").selectOption("stale");
    await page.locator("[data-testid='precedence-trustState']").selectOption("degraded");
    await page.locator("[data-testid='precedence-settlementState']").selectOption("failed");
    await page.locator("[data-testid='precedence-writableState']").selectOption("blocked");
    await page.locator("[data-testid='precedence-artifactModeState']").selectOption("blocked");

    precedenceText = await page.locator("[data-testid='precedence-visualizer']").innerText();
    assertCondition(
      precedenceText.includes("State: blocked") &&
        precedenceText.includes("aria-live: assertive") &&
        precedenceText.includes("Motion: motion.escalate"),
      "Blocked precedence state did not dominate the browser visualizer.",
    );

    const supportBundleId = "dcpb::support_workspace::planned";
    await page.locator(`[data-testid='bundle-card-${slugify(supportBundleId)}']`).focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-testid='route-family-selector']").selectOption("rf_support_replay_observe");
    preview = await previewDataset(page);

    const supportRoute = "rf_support_replay_observe";
    const supportScenario = SCENARIO_BY_ROUTE.get(supportRoute);
    const supportAutomation = AUTOMATION_BY_ROUTE.get(supportRoute);
    const supportAccessibility = ACCESSIBILITY_BY_ROUTE.get(supportRoute);

    assertCondition(
      preview.routeFamily === supportRoute &&
        preview.anchorId === supportAutomation.selectedAnchorMarkerRef &&
        preview.dominantAction === supportAutomation.dominantActionMarkerRef &&
        preview.semanticSurface === supportAccessibility.semanticSurfaceRefs[0] &&
        preview.keyboardModel === supportAccessibility.keyboardInteractionContractRefs[0] &&
        preview.focusTransitionScope === supportAccessibility.focusTransitionContractRefs[0] &&
        preview.liveAnnounceState === supportScenario.ariaLiveMode,
      "Support replay route lost canonical automation or accessibility markers.",
    );

    const supportAnchorBeforeModeSwitch = preview.anchorId;
    await page.locator("[data-testid='mode-motion-essential_only']").focus();
    await page.keyboard.press(" ");

    const bodyMode = await page.evaluate(() => ({
      theme: document.body.dataset.theme,
      contrast: document.body.dataset.contrast,
      density: document.body.dataset.density,
      motion: document.body.dataset.motion,
      reducedMotion: document.body.dataset.reducedMotion,
    }));
    assertCondition(
      bodyMode.motion === "essential_only" && bodyMode.reducedMotion === "true",
      "Essential-only mode did not activate reduced motion posture.",
    );

    preview = await previewDataset(page);
    assertCondition(
      preview.anchorId === supportAnchorBeforeModeSwitch &&
        preview.anchorState === supportScenario.bindingState &&
        preview.designContractLintState === "blocked",
      "Automation anchor stability drifted across reduced-motion rerender.",
    );

    const equivalenceText = await page.locator("[data-testid='reduced-motion-equivalence']").innerText();
    assertCondition(
      equivalenceText.includes(supportScenario.effectiveDisplayState) &&
        equivalenceText.includes("focus -> announcement -> action") &&
        equivalenceText.includes("true") &&
        equivalenceText.includes(supportAnchorBeforeModeSwitch),
      "Reduced-motion equivalence panel lost parity or anchor preservation details.",
    );

    const accessibilityText = await page.locator("[data-testid='accessibility-panel']").innerText();
    assertCondition(
      accessibilityText.includes(supportAccessibility.coverageState) &&
        accessibilityText.includes(supportAccessibility.reducedMotionEquivalenceRef) &&
        accessibilityText.includes(supportAccessibility.missionStackCoverageRef),
      "Accessibility panel lost degraded coverage detail for support replay.",
    );

    const telemetryText = await page.locator("[data-testid='telemetry-panel']").innerText();
    assertCondition(
      telemetryText.includes("ui.surface.support_replay_observe.viewed") &&
        telemetryText.includes("DMS_104_CANONICAL_UI_KERNEL_V1") &&
        telemetryText.includes("RDP_104_SUPPORT_SAFE_V1"),
      "Telemetry panel lost the support replay vocabulary tuple.",
    );

    const artifactText = await page.locator("[data-testid='artifact-panel']").innerText();
    assertCondition(
      artifactText.includes("artifact.preview.summary_only") &&
        artifactText.includes("artifact.print.unavailable") &&
        artifactText.includes("artifact.handoff.optional"),
      "Artifact panel lost the fail-closed support replay posture.",
    );

    await page.locator(`[data-testid='bundle-card-${slugify("dcpb::patient_transaction_recovery::planned")}']`).click();
    await page.locator("[data-testid='route-family-selector']").selectOption("rf_patient_embedded_channel");
    preview = await previewDataset(page);

    const embeddedRoute = "rf_patient_embedded_channel";
    const embeddedScenario = SCENARIO_BY_ROUTE.get(embeddedRoute);
    const embeddedAutomation = AUTOMATION_BY_ROUTE.get(embeddedRoute);
    const embeddedAccessibility = ACCESSIBILITY_BY_ROUTE.get(embeddedRoute);

    assertCondition(
      preview.routeFamily === embeddedRoute &&
        preview.anchorState === embeddedScenario.bindingState &&
        preview.artifactMode === embeddedScenario.artifactModeState &&
        preview.transferState === embeddedScenario.artifactPosture &&
        preview.anchorId === embeddedAutomation.selectedAnchorMarkerRef &&
        preview.accessibilityCoverageState === embeddedAccessibility.coverageState,
      "Patient embedded channel lost stale binding or handoff-only posture.",
    );

    const previewBuffer = await page
      .locator("[data-testid='preview-root']")
      .screenshot({ animations: "disabled" });
    assertCondition(
      previewBuffer.byteLength > 1000,
      "Preview root screenshot capture failed for the stale embedded-channel state.",
    );

    await page.locator("[data-testid='rail-toggle']").focus();
    await page.keyboard.press("Enter");
    const railCollapsed = await page
      .locator("[data-testid='kernel-shell']")
      .getAttribute("data-rail-collapsed");
    assertCondition(railCollapsed === "true", "Keyboard activation did not collapse the rail.");

    assertCondition(
      (await page.locator("header").count()) === 1 &&
        (await page.locator("main").count()) === 1 &&
        (await page.locator("aside").count()) >= 2 &&
        (await page.locator("[data-testid='route-family-selector']").count()) === 1,
      "Kernel Studio landmarks are incomplete.",
    );

    const mobilePage = await context.newPage();
    try {
      await mobilePage.setViewportSize({ width: 430, height: 932 });
      await mobilePage.goto(url, { waitUntil: "networkidle" });
      await mobilePage.locator("[data-testid='preview-root']").waitFor();
      assertCondition(
        await mobilePage.locator("[data-testid='preview-root']").isVisible(),
        "Preview root disappeared on mobile width.",
      );
      assertCondition(
        await mobilePage.locator("[data-testid='precedence-visualizer']").isVisible(),
        "Precedence visualizer disappeared on mobile width.",
      );
    } finally {
      await mobilePage.close();
    }
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

export const uiKernelStudioCoverage = {
  task: "par_104",
  coverage: [
    "bundle and route-family switching",
    "surface-state precedence interaction",
    "blocked and stale kernel bindings",
    "automation-anchor stability across rerender",
    "accessibility semantics and reduced-motion parity",
    "telemetry and artifact tuple publication",
    "keyboard-only interaction",
    "responsive studio visibility",
  ],
};
