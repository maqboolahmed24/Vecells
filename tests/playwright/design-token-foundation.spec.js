import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "103_design_token_specimen.html");
const ARTIFACT_PATH = path.join(ROOT, "data", "analysis", "design_token_export_artifact.json");
const PROFILE_PATH = path.join(ROOT, "data", "analysis", "profile_selection_resolutions.json");
const MODE_PATH = path.join(ROOT, "data", "analysis", "token_mode_coverage_matrix.csv");

const ARTIFACT = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
const PROFILE_PAYLOAD = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
const MODE_ROWS = fs
  .readFileSync(MODE_PATH, "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [
      mode_tuple_id,
      theme,
      contrast,
      density,
      motion,
      breakpoint_coverage,
      profile_coverage,
      status,
      digest_ref,
    ] = line.split(",");
    return {
      mode_tuple_id,
      theme,
      contrast,
      density,
      motion,
      breakpoint_coverage,
      profile_coverage,
      status,
      digest_ref,
    };
  });

export const designTokenFoundationCoverage = [
  "masthead digest rendering",
  "token lattice parity",
  "shell profile selection",
  "keyboard navigation",
  "mode tuple coverage",
  "breakpoint explorer coverage",
  "reduced motion equivalence",
  "semantic state wall parity",
  "chart and table parity",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
      pathname = "/docs/architecture/103_design_token_specimen.html";
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
        reject(new Error("Unable to bind specimen static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/103_design_token_specimen.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Design token specimen HTML is missing.");
  assertCondition(ARTIFACT.task_id === "par_103", "Artifact task drifted from par_103.");
  assertCondition(
    ARTIFACT.summary.profile_selection_resolution_count === 8,
    "Profile selection resolution count drifted from 8.",
  );
  assertCondition(
    ARTIFACT.summary.supported_mode_tuple_count === 36 && MODE_ROWS.length === 36,
    "Mode tuple coverage drifted from 36 tuples.",
  );
  assertCondition(
    PROFILE_PAYLOAD.profileSelectionResolutions.length === 8,
    "Profile payload drifted from 8 published rows.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1180 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='specimen-masthead']").waitFor();
    await page.locator("[data-testid='token-lattice']").waitFor();
    await page.locator("[data-testid='shell-profile-gallery']").waitFor();
    await page.locator("[data-testid='profile-inspector']").waitFor();
    await page.locator("[data-testid='semantic-state-wall']").waitFor();
    await page.locator("[data-testid='responsive-lattice']").waitFor();
    await page.locator("[data-testid='motion-lane']").waitFor();
    await page.locator("[data-testid='parity-sample']").waitFor();

    const shellCards = await page.locator("[data-testid^='shell-card-']").count();
    assertCondition(
      shellCards === ARTIFACT.specimen.shellProfiles.length,
      `Shell profile parity drifted: expected ${ARTIFACT.specimen.shellProfiles.length}, found ${shellCards}.`,
    );

    const digestText = await page.locator("[data-testid='digest-chip-row']").innerText();
    assertCondition(
      digestText.includes(ARTIFACT.designTokenExportArtifact.tokenValueDigestRef),
      "Digest chip row lost the export digest marker.",
    );

    await page.locator("[data-testid='shell-card-governance']").click();
    const inspectorText = await page.locator("[data-testid='profile-inspector']").innerText();
    assertCondition(
      inspectorText.includes("Governance admin") &&
        inspectorText.includes("shell.governance.admin") &&
        inspectorText.includes("SCP_103_GOVERNANCE_SCOPE_V1"),
      "Inspector lost governance profile detail.",
    );

    await page.locator("[data-testid='shell-card-patient']").focus();
    await page.keyboard.press("ArrowRight");
    const staffSelected = await page
      .locator("[data-testid='shell-card-staff']")
      .getAttribute("data-selected");
    assertCondition(staffSelected === "true", "ArrowRight did not advance shell selection.");

    await page.locator("[data-testid='shell-card-staff']").focus();
    await page.keyboard.press("End");
    const embeddedSelected = await page
      .locator("[data-testid='shell-card-embedded']")
      .getAttribute("data-selected");
    assertCondition(embeddedSelected === "true", "End key did not advance to the last shell card.");

    const themes = ["light", "dark"];
    const contrasts = ["standard", "high"];
    const densities = ["relaxed", "balanced", "compact"];
    const motions = ["full", "reduced", "essential_only"];

    for (const theme of themes) {
      await page.locator(`[data-testid='mode-theme-${theme}']`).click();
      for (const contrast of contrasts) {
        await page.locator(`[data-testid='mode-contrast-${contrast}']`).click();
        for (const density of densities) {
          await page.locator(`[data-testid='mode-density-${density}']`).click();
          for (const motion of motions) {
            await page.locator(`[data-testid='mode-motion-${motion}']`).click();
            const bodyState = await page.evaluate(() => ({
              theme: document.body.dataset.theme,
              contrast: document.body.dataset.contrast,
              density: document.body.dataset.density,
              motion: document.body.dataset.motion,
            }));
            assertCondition(
              bodyState.theme === theme &&
                bodyState.contrast === contrast &&
                bodyState.density === density &&
                bodyState.motion === motion,
              `Body mode tuple drifted for ${theme}/${contrast}/${density}/${motion}.`,
            );
            const tupleSummary = await page
              .locator("[data-testid='mode-tuple-summary']")
              .innerText();
            assertCondition(
              tupleSummary.includes(theme) &&
                tupleSummary.includes(contrast) &&
                tupleSummary.includes(density) &&
                tupleSummary.includes(motion),
              `Mode tuple summary drifted for ${theme}/${contrast}/${density}/${motion}.`,
            );
            const screenshotBuffer = await page
              .locator("[data-testid='specimen-masthead']")
              .screenshot({ animations: "disabled" });
            assertCondition(
              screenshotBuffer.byteLength > 1000,
              `Tuple screenshot capture failed for ${theme}/${contrast}/${density}/${motion}.`,
            );
          }
        }
      }
    }

    await page.locator("[data-testid='mode-motion-essential_only']").click();
    const essentialReducedMotion = await page.evaluate(() => document.body.dataset.reducedMotion);
    assertCondition(
      essentialReducedMotion === "true",
      "essential_only motion did not activate reduced-motion posture.",
    );

    await page.locator("[data-testid='frame-card-xs']").click();
    const breakpointTitle = await page.locator("[data-testid='breakpoint-inspector']").innerText();
    assertCondition(
      breakpointTitle.includes("Mission stack / xs"),
      "Breakpoint inspector did not sync to the xs frame.",
    );

    for (const width of [390, 820, 1120, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      await page.locator("[data-testid='responsive-lattice']").waitFor();
      const frameCards = await page.locator("[data-testid^='frame-card-']").count();
      assertCondition(frameCards === 4, `Breakpoint explorer drifted at width ${width}.`);
      const screenshotBuffer = await page
        .locator("[data-testid='responsive-lattice']")
        .screenshot({ animations: "disabled" });
      assertCondition(
        screenshotBuffer.byteLength > 1000,
        `Responsive screenshot capture failed at width ${width}.`,
      );
    }

    const parityRows = await page.locator("[data-testid^='parity-table-row-']").count();
    assertCondition(
      parityRows === 4,
      `Parity table drifted: expected 4 rows, found ${parityRows}.`,
    );

    const stateCards = await page.locator("[data-testid^='state-card-']").count();
    assertCondition(
      stateCards === 6,
      `Semantic state wall drifted: expected 6 cards, found ${stateCards}.`,
    );

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarks >= 10,
      `Accessibility smoke failed: expected many landmarks, found ${landmarks}.`,
    );

    const reducedContext = await browser.newContext({
      viewport: { width: 1320, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    try {
      await reducedPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await reducedPage.evaluate(() => document.body.dataset.reducedMotion);
      assertCondition(
        reducedMotion === "true",
        "Reduced-motion browser preference did not activate specimen reduced-motion posture.",
      );
    } finally {
      await reducedContext.close();
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

export const designTokenFoundationManifest = {
  task: ARTIFACT.task_id,
  profiles: ARTIFACT.summary.profile_selection_resolution_count,
  modes: ARTIFACT.summary.supported_mode_tuple_count,
  contrastRows: ARTIFACT.summary.contrast_matrix_row_count,
};
