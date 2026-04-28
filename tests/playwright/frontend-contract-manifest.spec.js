import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "113_manifest_observatory.html");
const EXAMPLES_PATH = path.join(ROOT, "data", "analysis", "frontend_contract_manifest_examples.json");
const VALIDATION_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "manifest_runtime_validation_examples.json",
);

const EXAMPLES = JSON.parse(fs.readFileSync(EXAMPLES_PATH, "utf8"));
const VALIDATION = JSON.parse(fs.readFileSync(VALIDATION_PATH, "utf8"));

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
      pathname = "/docs/architecture/113_manifest_observatory.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".json"
          ? "application/json; charset=utf-8"
          : extension === ".csv"
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind frontend-contract-manifest server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/113_manifest_observatory.html`,
      });
    });
  });
}

export const frontendContractManifestCoverage = [
  "manifest observatory rendering",
  "drift surfacing with last-safe manifest preservation",
  "runtime validation rejecting invalid manifests",
  "seed-route specimen consuming validated manifests only",
  "DOM posture and drift markers",
  "reduced motion and responsive layout",
];

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Manifest observatory HTML is missing.");
  assertCondition(EXAMPLES.task_id === "par_113", "Manifest examples task drifted.");
  assertCondition(VALIDATION.task_id === "par_113", "Manifest validation examples task drifted.");
  assertCondition(EXAMPLES.summary.manifest_count === 4, "Manifest example count drifted.");
  assertCondition(VALIDATION.summary.scenario_count === 6, "Manifest validation count drifted.");

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1120 } });
    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "manifest-observatory-root",
      "audience-route-rail",
      "manifest-summary",
      "digest-graph",
      "verdict-rail",
      "drift-timeline",
      "seed-route-specimen",
      "contract-join-graph",
      "authority-tuple-diagram",
      "fail-closed-path-diagram",
      "coverage-table",
      "digest-join-table",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const specimen = page.locator("[data-testid='seed-route-specimen'] .seed-route-stage");
    assertCondition(
      (await specimen.getAttribute("data-browser-posture")) === "publishable_live",
      "Observatory should open on the live manifest.",
    );
    assertCondition(
      (await specimen.getAttribute("data-seed-route-validity")) === "valid",
      "Live manifest specimen should open in valid state.",
    );
    assertCondition(
      (await specimen.getAttribute("data-manifest-consumption")) === "validated_only",
      "Seed route specimen lost its validated-only marker.",
    );

    await page.locator("[data-testid='scenario-option-MVC_113_DIGEST_MISMATCH']").click();
    assertCondition(
      (await specimen.getAttribute("data-browser-posture")) === "blocked",
      "Digest mismatch must fail closed to blocked posture.",
    );
    assertCondition(
      (await specimen.getAttribute("data-seed-route-validity")) === "rejected",
      "Digest mismatch scenario must be rejected.",
    );
    assertCondition(
      (await specimen.getAttribute("data-last-safe-manifest")) === "FCM_113_PATIENT_PORTAL_LIVE",
      "Last safe manifest should remain pinned to the last validated live specimen.",
    );

    await page.locator("[data-testid='scenario-option-MVC_113_SUPPORT_RECOVERY_ONLY']").click();
    assertCondition(
      (await specimen.getAttribute("data-browser-posture")) === "recovery_only",
      "Runtime binding drift should demote to recovery_only.",
    );
    assertCondition(
      (await specimen.getAttribute("data-seed-route-validity")) === "degraded",
      "Recovery scenario should remain consumable but degraded.",
    );
    assertCondition(
      (await specimen.getAttribute("data-last-safe-manifest")) === "FCM_113_SUPPORT_RECOVERY_ONLY",
      "Safe degraded scenarios should update the last safe manifest pin.",
    );

    await page.locator("[data-testid='scenario-option-MVC_113_GOVERNANCE_BLOCKED']").click();
    const issueText = await page.locator("[data-testid='issue-card']").innerText();
    assertCondition(
      issueText.includes("runtime_publication_withdrawn") &&
        issueText.includes("manifest_state_rejected"),
      "Blocked scenario lost the expected validation issues.",
    );
    assertCondition(
      (await specimen.getAttribute("data-last-safe-manifest")) === "FCM_113_SUPPORT_RECOVERY_ONLY",
      "Blocked scenario should preserve the last safe manifest instead of replacing it.",
    );

    await page.locator("[data-testid='manifest-option-FCM_113_PATIENT_APPOINTMENTS_READ_ONLY']").click();
    assertCondition(
      (await specimen.getAttribute("data-browser-posture")) === "read_only",
      "Direct manifest selection should render the read_only specimen.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body").getAttribute("data-reduced-motion")) === "true",
        "Reduced-motion marker did not activate.",
      );
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    assertCondition(
      await page.locator("[data-testid='verdict-rail']").isVisible(),
      "Verdict rail disappeared on mobile.",
    );
    assertCondition(
      await page.locator("[data-testid='manifest-summary']").isVisible(),
      "Manifest summary disappeared on mobile.",
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
