import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "patient-web");
const GALLERY_PATH = path.join(ROOT, "docs", "architecture", "115_patient_shell_gallery.html");
const JSON_PATH = path.join(ROOT, "data", "analysis", "patient_mock_projection_examples.json");

const MOCK_DATA = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

export const patientShellSeedRouteCoverage = [
  "gallery artifact presence",
  "home attention and quiet-home variants",
  "record-origin follow-up and return-safe parity",
  "request detail continuity through refresh",
  "appointments read-only posture and fenced action",
  "bounded recovery and embedded failure floor",
  "message thread continuity and blocked-contact posture",
  "telemetry panel visibility without external requests",
  "mission-stack responsive fold",
  "reduced-motion equivalence markers",
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

async function allocatePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate a free port."));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/115_patient_shell_gallery.html";
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }

    const contentType =
      filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : filePath.endsWith(".css")
              ? "text/css; charset=utf-8"
              : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });

  return {
    server,
    url: `http://127.0.0.1:${port}/docs/architecture/115_patient_shell_gallery.html`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function startPatientWeb() {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      BROWSER: "none",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(baseUrl);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Patient web failed to start.\n${logs.join("")}`, { cause: error });
  }

  return { child, baseUrl };
}

async function stopPatientWeb(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

function trackExternalRequests(page, baseOrigin, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(baseOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:") &&
      !requestUrl.startsWith("ws:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

async function rootAttribute(page, name) {
  return await page.locator("[data-testid='patient-shell-root']").getAttribute(name);
}

export async function run() {
  assertCondition(fs.existsSync(GALLERY_PATH), "Patient shell gallery HTML is missing.");
  assertCondition(MOCK_DATA.task_id === "par_115", "Patient shell mock data task drifted.");
  assertCondition(MOCK_DATA.summary.route_example_count === 9, "Patient shell route count drifted.");
  assertCondition(MOCK_DATA.summary.section_count === 5, "Patient shell section count drifted.");

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url: galleryUrl } = await startStaticServer();
  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const galleryPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const galleryOrigin = new URL(galleryUrl).origin;
    const galleryExternal = new Set();
    trackExternalRequests(galleryPage, galleryOrigin, galleryExternal);

    await galleryPage.goto(galleryUrl, { waitUntil: "networkidle" });
    for (const testId of [
      "patient-shell-gallery",
      "patient-gallery-masthead",
      "patient-gallery-shell-preview",
      "patient-gallery-route-grid",
      "patient-gallery-route-matrix",
      "patient-gallery-nav-diagram",
      "patient-gallery-adjacency-diagram",
      "patient-gallery-degraded-diagram",
      "patient-gallery-record-parity",
      "patient-gallery-gap-resolutions",
    ]) {
      await galleryPage.locator(`[data-testid='${testId}']`).waitFor();
    }
    const matrixText = await galleryPage.locator("[data-testid='patient-gallery-route-matrix']").innerText();
    assertCondition(
      matrixText.includes("/records/:recordId/follow-up") &&
        matrixText.includes("/recovery/secure-link"),
      "Gallery route matrix drifted away from record follow-up or recovery coverage.",
    );
    assertCondition(
      galleryExternal.size === 0,
      `Gallery made unexpected external requests: ${Array.from(galleryExternal).join(", ")}`,
    );
    await galleryPage.close();

    const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
    const appExternal = new Set();
    trackExternalRequests(page, baseUrl, appExternal);

    await page.goto(`${baseUrl}/home`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='patient-shell-root']").waitFor();
    await page.locator("[data-testid='patient-primary-nav']").waitFor();
    assertCondition(
      (await rootAttribute(page, "data-route-key")) === "home",
      "Patient shell did not boot on the home route.",
    );
    assertCondition(
      (await rootAttribute(page, "data-browser-posture")) === "live",
      "Home route did not boot with live posture.",
    );

    const initialAnchor = await rootAttribute(page, "data-selected-anchor");
    await page.locator("[data-testid='home-mode-quiet']").click();
    await page.locator("[data-testid='patient-home-quiet']").waitFor();
    await page.locator("[data-testid='quiet-home-next-step']").waitFor();
    const quietAnchor = await rootAttribute(page, "data-selected-anchor");
    assertCondition(
      Boolean(initialAnchor) && Boolean(quietAnchor) && quietAnchor !== initialAnchor,
      "Quiet-home mode did not update the selected anchor contract.",
    );

    await page.locator("[data-testid='quiet-home-next-step']").click();
    await page.waitForURL(`${baseUrl}/records/REC-HEM-8/follow-up`);
    await page.locator("[data-testid='patient-record-follow-up']").waitFor();
    assertCondition(
      (await rootAttribute(page, "data-route-key")) === "record_follow_up",
      "Quiet-home next step did not open the record follow-up child route.",
    );
    const followUpText = await page.locator("[data-testid='patient-record-follow-up']").innerText();
    assertCondition(
      followUpText.includes("What changed") && followUpText.includes("Bounded follow-up"),
      "Record follow-up lost its summary-first artifact shell framing.",
    );
    await page.locator("[data-testid='record-follow-up-return']").click();
    await page.waitForURL(`${baseUrl}/records`);
    await page.locator("[data-testid='patient-record-trend']").waitFor();
    await page.locator("[data-testid='patient-record-table']").waitFor();

    await page.locator("[data-testid='nav-requests']").click();
    await page.waitForURL(`${baseUrl}/requests`);
    await page.locator("[data-testid='patient-requests-route']").waitFor();
    await page.locator("[data-testid='request-row-REQ-2049']").click();
    await page.waitForURL(`${baseUrl}/requests/REQ-2049`);
    await page.locator("[data-testid='patient-request-detail']").waitFor();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='patient-shell-root']")
          ?.getAttribute("data-route-key") === "request_detail",
    );
    const continuityKeyBeforeRefresh = await rootAttribute(page, "data-shell-continuity-key");
    const requestAnchorBeforeRefresh = await rootAttribute(page, "data-selected-anchor");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='patient-request-detail']").waitFor();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='patient-shell-root']")
          ?.getAttribute("data-route-key") === "request_detail",
    );
    assertCondition(
      page.url().endsWith("/requests/REQ-2049"),
      "Request detail route did not survive refresh.",
    );
    assertCondition(
      (await rootAttribute(page, "data-shell-continuity-key")) === continuityKeyBeforeRefresh,
      "Shell continuity key drifted across request detail refresh.",
    );
    assertCondition(
      (await rootAttribute(page, "data-selected-anchor")) === requestAnchorBeforeRefresh,
      "Selected anchor drifted across request detail refresh.",
    );
    const requestDetailText = await page.locator("[data-testid='patient-request-detail']").innerText();
    assertCondition(
      requestDetailText.includes("Travel support for the dermatology review"),
      "Request detail did not restore the selected request after refresh.",
    );
    await page.locator("[data-testid='nav-requests']").click();
    await page.waitForURL(`${baseUrl}/requests`);
    assertCondition(
      (await page.locator("[data-testid='request-row-REQ-2049']").getAttribute("data-active")) === "true",
      "Returning to the request list lost the selected request row.",
    );

    await page.locator("[data-testid='nav-appointments']").click();
    await page.waitForURL(`${baseUrl}/appointments`);
    await page.locator("[data-testid='patient-appointments-route']").waitFor();
    await page.locator("[data-testid='patient-inline-guard']").waitFor();
    assertCondition(
      (await rootAttribute(page, "data-browser-posture")) === "read_only",
      "Appointments route did not degrade to read_only posture.",
    );
    assertCondition(
      (await page.locator("[data-testid='patient-decision-dock'] button").isDisabled()) === true,
      "Appointments dominant action was not fenced in read-only posture.",
    );

    await page.locator("[data-testid='utility-open-recovery']").click();
    await page.waitForURL(`${baseUrl}/recovery/secure-link`);
    await page.locator("[data-testid='patient-recovery-stage']").waitFor();
    assertCondition(
      (await rootAttribute(page, "data-browser-posture")) === "recovery_only",
      "Recovery route did not normalize to recovery_only posture.",
    );

    await page.locator("[data-testid='utility-open-embedded']").click();
    await page.waitForURL(`${baseUrl}/home/embedded`);
    await page.locator("[data-testid='patient-embedded-stage']").waitFor();
    assertCondition(
      (await rootAttribute(page, "data-route-key")) === "embedded",
      "Embedded route did not open inside the patient shell.",
    );
    assertCondition(
      (await rootAttribute(page, "data-browser-posture")) === "recovery_only",
      "Embedded route did not fail closed in recovery_only posture.",
    );

    await page.locator("[data-testid='nav-messages']").click();
    await page.waitForURL(`${baseUrl}/messages`);
    await page.locator("[data-testid='patient-messages-route']").waitFor();
    await page.locator("[data-testid='thread-row-THR-399']").click();
    await page.waitForURL(`${baseUrl}/messages/thread/THR-399`);
    await page.locator("[data-testid='patient-message-thread']").waitFor();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='patient-shell-root']")
          ?.getAttribute("data-route-key") === "message_thread" &&
        document
          .querySelector("[data-testid='patient-message-thread']")
          ?.textContent?.includes("reply posture is bounded"),
    );
    const messageThreadText = await page.locator("[data-testid='patient-message-thread']").innerText();
    assertCondition(
      messageThreadText.includes("reply posture is bounded") &&
        !messageThreadText.toLowerCase().includes("typing"),
      "Blocked-contact thread drifted into chat framing or false reply reassurance.",
    );

    await page.locator("[data-testid='utility-toggle-diagnostics']").click();
    await page.locator("[data-testid='patient-telemetry-panel']").waitFor();
    await page.waitForFunction(() => {
      const panel = document.querySelector("[data-testid='patient-telemetry-panel']");
      return panel?.textContent?.includes("ui.surface.enter") &&
        panel?.textContent?.includes("ui.selected_anchor.changed");
    });
    assertCondition(
      appExternal.size === 0,
      `Patient shell made unexpected external requests: ${Array.from(appExternal).join(", ")}`,
    );
    await page.close();

    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(`${baseUrl}/messages/thread/THR-399`, { waitUntil: "networkidle" });
    await mobilePage.locator("[data-testid='patient-shell-root']").waitFor();
    assertCondition(
      (await rootAttribute(mobilePage, "data-layout-topology")) === "mission_stack",
      "Narrow viewport did not fold the patient shell to mission_stack.",
    );
    await mobilePage.close();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    await motionPage.emulateMedia({ reducedMotion: "reduce" });
    await motionPage.goto(`${baseUrl}/home`, { waitUntil: "networkidle" });
    await motionPage.locator("[data-testid='patient-shell-root']").waitFor();
    assertCondition(
      (await rootAttribute(motionPage, "data-reduced-motion")) === "true",
      "Reduced-motion preference did not reach the patient shell root.",
    );
    await motionPage.locator("[data-testid='home-mode-quiet']").click();
    await motionPage.locator("[data-testid='quiet-home-next-step']").waitFor();
    assertCondition(
      await motionPage.locator("[data-testid='quiet-home-next-step']").isVisible(),
      "Reduced-motion mode changed the quiet-home next-step visibility.",
    );
    await motionPage.close();
  } finally {
    await browser.close();
    await stopPatientWeb(child);
    await closeServer(server);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
