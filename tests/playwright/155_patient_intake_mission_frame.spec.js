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
const GALLERY_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "155_patient_intake_mission_frame_gallery.html",
);
const LAYOUT_JSON_PATH = path.join(ROOT, "data", "analysis", "155_mission_frame_layout_contract.json");
const STATE_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "155_mission_frame_state_and_anchor_matrix.csv",
);

const LAYOUT_CONTRACT = JSON.parse(fs.readFileSync(LAYOUT_JSON_PATH, "utf8"));

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
        reject(new Error("Unable to allocate port."));
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
      pathname = "/docs/frontend/155_patient_intake_mission_frame_gallery.html";
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
            : filePath.endsWith(".mmd")
              ? "text/plain; charset=utf-8"
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
    url: `http://127.0.0.1:${port}/docs/frontend/155_patient_intake_mission_frame_gallery.html`,
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
    env: { ...process.env, BROWSER: "none" },
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
  return await page.locator("[data-testid='patient-intake-mission-frame-root']").getAttribute(name);
}

export async function run() {
  assertCondition(fs.existsSync(GALLERY_PATH), "Mission frame gallery HTML is missing.");
  assertCondition(fs.existsSync(LAYOUT_JSON_PATH), "Mission frame layout contract JSON is missing.");
  assertCondition(fs.existsSync(STATE_MATRIX_PATH), "Mission frame state matrix CSV is missing.");
  assertCondition(
    LAYOUT_CONTRACT.shell_id === "Quiet_Clarity_Mission_Frame",
    "Mission frame shell id drifted.",
  );
  assertCondition(
    LAYOUT_CONTRACT.implemented_entry_alias === "/start-request",
    "Mission frame entry alias drifted.",
  );

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
      "mission-frame-gallery",
      "mission-frame-shell-preview",
      "mission-frame-layout-diagram",
      "mission-frame-layout-parity",
      "mission-frame-journey-diagram",
      "mission-frame-journey-parity",
      "mission-frame-route-matrix",
      "mission-frame-responsive-previews",
    ]) {
      await galleryPage.locator(`[data-testid='${testId}']`).waitFor();
    }
    const matrixText = await galleryPage.locator("[data-testid='mission-frame-route-matrix']").innerText();
    assertCondition(
      matrixText.includes("/start-request") && matrixText.includes("/intake/start"),
      "Gallery route matrix lost the alias or contract route parity.",
    );
    assertCondition(
      galleryExternal.size === 0,
      `Gallery made unexpected external requests: ${Array.from(galleryExternal).join(", ")}`,
    );
    await galleryPage.close();

    for (const scenario of [
      { width: 1480, height: 1100, path: "/start-request", expectedMode: "panel" },
      { width: 960, height: 1000, path: "/start-request/dft_7k49m2v8pq41/files", expectedMode: "drawer" },
      { width: 390, height: 844, path: "/start-request/dft_7k49m2v8pq41/contact", expectedMode: "sheet" },
    ]) {
      const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height } });
      await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "networkidle" });
      await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
      await page.locator("[data-testid='patient-intake-masthead']").waitFor();
      await page.locator("[data-testid='patient-intake-status-strip']").waitFor();
      await page.locator("[data-testid='patient-intake-question-canvas']").waitFor();
      await page.locator("[data-testid='patient-intake-progress-rail']").waitFor();
      await page.locator("[data-testid='patient-intake-summary-panel']").waitFor();
      await page.locator("[data-testid='patient-intake-action-tray']").waitFor();
      const summaryMode = await page
        .locator("[data-testid='patient-intake-summary-panel']")
        .getAttribute("data-summary-mode");
      assertCondition(
        summaryMode === scenario.expectedMode,
        `Expected summary mode ${scenario.expectedMode}, received ${summaryMode}.`,
      );
      await page.close();
    }

    const continuityPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const continuityExternal = new Set();
    trackExternalRequests(continuityPage, baseUrl, continuityExternal);

    await continuityPage.goto(`${baseUrl}/start-request`, { waitUntil: "networkidle" });
    await continuityPage.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
    await continuityPage.evaluate(() => {
      window.__missionFrameRefs = {
        masthead: document.querySelector("[data-testid='patient-intake-masthead']"),
        status: document.querySelector("[data-testid='patient-intake-status-strip']"),
      };
    });
    await continuityPage.locator("[data-testid='patient-intake-primary-action']").click();
    await continuityPage.waitForURL(`${baseUrl}/start-request/dft_7k49m2v8pq41/request-type`);
    const shellStillStable = await continuityPage.evaluate(() => {
      return (
        document.querySelector("[data-testid='patient-intake-masthead']") === window.__missionFrameRefs.masthead &&
        document.querySelector("[data-testid='patient-intake-status-strip']") === window.__missionFrameRefs.status
      );
    });
    assertCondition(shellStillStable, "Same-shell transition rebuilt the masthead or status strip.");
    assertCondition(
      (await rootAttribute(continuityPage, "data-selected-anchor")) === "request-start",
      "Request type route lost the request-start anchor.",
    );

    await continuityPage.locator("[data-testid='request-type-card-Symptoms']").focus();
    await continuityPage.keyboard.press("ArrowRight");
    await continuityPage.keyboard.press("ArrowLeft");
    await continuityPage.locator("[data-testid='patient-intake-primary-action']").click();
    await continuityPage.waitForURL(`${baseUrl}/start-request/dft_7k49m2v8pq41/details`);
    assertCondition(
      (await rootAttribute(continuityPage, "data-selected-anchor")) === "request-proof",
      "Details route lost the request-proof anchor.",
    );

    await continuityPage.locator("[data-testid='patient-intake-detail-textarea']").focus();
    await continuityPage.keyboard.press("End");
    await continuityPage.keyboard.type(" Same-shell keyboard proof.");
    await continuityPage.locator("[data-testid='patient-intake-primary-action']").click();
    await continuityPage.waitForURL(`${baseUrl}/start-request/dft_7k49m2v8pq41/files`);
    assertCondition(
      continuityExternal.size === 0,
      `Mission frame made unexpected external requests: ${Array.from(continuityExternal).join(", ")}`,
    );
    await continuityPage.close();

    const tabletPage = await browser.newPage({ viewport: { width: 960, height: 1000 } });
    await tabletPage.goto(`${baseUrl}/start-request/dft_7k49m2v8pq41/files`, { waitUntil: "networkidle" });
    await tabletPage.locator("[data-testid='patient-intake-summary-toggle']").click();
    await tabletPage.locator("[data-testid='patient-intake-summary-panel'][data-open='true']").waitFor();
    await tabletPage.locator(".patient-intake-mission-frame__summary-close").click();
    await tabletPage.locator("[data-testid='patient-intake-summary-panel'][data-open='false']").waitFor();
    await tabletPage.close();

    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(`${baseUrl}/start-request/dft_7k49m2v8pq41/contact`, { waitUntil: "networkidle" });
    await mobilePage.locator("[data-testid='contact-window-anytime']").focus();
    const overlapState = await mobilePage.evaluate(() => {
      const tray = document.querySelector("[data-testid='patient-intake-action-tray']");
      const target = document.querySelector("[data-testid='contact-window-anytime']");
      if (!(tray instanceof HTMLElement) || !(target instanceof HTMLElement)) {
        return { overlap: true };
      }
      const trayRect = tray.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      return { overlap: targetRect.bottom > trayRect.top - 8 };
    });
    assertCondition(
      overlapState.overlap === false,
      "Sticky mobile tray overlaps a focused contact control.",
    );
    await mobilePage.close();

    const reducedMotionPage = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
    await reducedMotionPage.goto(`${baseUrl}/start-request/dft_7k49m2v8pq41/receipt`, {
      waitUntil: "networkidle",
    });
    assertCondition(
      (await rootAttribute(reducedMotionPage, "data-reduced-motion")) === "true",
      "Reduced motion preference was not reflected on the mission frame root.",
    );
    await reducedMotionPage.locator("[data-testid='patient-intake-summary-toggle']").click();
    await reducedMotionPage.close();
  } finally {
    await browser.close();
    await stopPatientWeb(child);
    await closeServer(server);
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
