import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "clinical-workspace");
const GALLERY_PATH = path.join(ROOT, "docs", "architecture", "116_staff_shell_gallery.html");
const JSON_PATH = path.join(ROOT, "data", "analysis", "staff_mock_projection_examples.json");

const MOCK_DATA = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

export const staffShellSeedRouteCoverage = [
  "gallery route and runtime selectors",
  "workspace home first load",
  "queue preview hover, pin, and task open",
  "same-shell more-info and decision transitions",
  "active-row continuity through queued re-rank",
  "changed-since-seen and decisive-delta rendering",
  "protected composition buffering and recovery posture",
  "approvals, escalations, and search inside the same shell",
  "mission-stack responsive fold",
  "reduced-motion equivalence and telemetry markers",
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
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
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
      pathname = "/docs/architecture/116_staff_shell_gallery.html";
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
    url: `http://127.0.0.1:${port}/docs/architecture/116_staff_shell_gallery.html`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function startClinicalWorkspace() {
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
    throw new Error(`Clinical workspace failed to start.\n${logs.join("")}`, { cause: error });
  }

  return { child, baseUrl, logs };
}

async function stopClinicalWorkspace(child) {
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
      !requestUrl.startsWith("about:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

export async function run() {
  assertCondition(fs.existsSync(GALLERY_PATH), "Staff shell gallery HTML is missing.");
  assertCondition(MOCK_DATA.task_id === "par_116", "Staff shell mock data task drifted.");
  assertCondition(MOCK_DATA.summary.route_count === 10, "Staff shell route count drifted.");
  assertCondition(MOCK_DATA.summary.mock_projection_count === 5, "Staff shell projection count drifted.");

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url: galleryUrl } = await startStaticServer();
  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const galleryPage = await browser.newPage({ viewport: { width: 1440, height: 1120 } });
    const galleryOrigin = new URL(galleryUrl).origin;
    const galleryExternal = new Set();
    trackExternalRequests(galleryPage, galleryOrigin, galleryExternal);

    await galleryPage.goto(galleryUrl, { waitUntil: "networkidle" });
    for (const testId of [
      "staff-shell-gallery-root",
      "staff-shell-insignia",
      "staff-summary-strip",
      "staff-gallery-stage",
      "staff-route-selector",
      "staff-runtime-selector",
      "staff-seed-route-table",
      "route-adjacency-diagram",
      "queue-continuity-diagram",
      "focus-protection-diagram",
    ]) {
      await galleryPage.locator(`[data-testid='${testId}']`).waitFor();
    }
    await galleryPage.getByRole("button", { name: "decision" }).click();
    assertCondition(
      (await galleryPage.locator("#stage-title").innerText()) === "/workspace/task/task-311/decision",
      "Gallery route selector drifted away from the decision child route.",
    );
    await galleryPage.getByRole("button", { name: "blocked" }).click();
    assertCondition(
      (await galleryPage.locator("[data-testid='staff-gallery-stage']").getAttribute("data-runtime")) ===
        "blocked",
      "Gallery runtime selector failed to switch to blocked.",
    );
    assertCondition(
      galleryExternal.size === 0,
      `Gallery made unexpected external requests: ${Array.from(galleryExternal).join(", ")}`,
    );
    await galleryPage.close();

    const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
    const appExternal = new Set();
    trackExternalRequests(page, baseUrl, appExternal);

    await page.goto(`${baseUrl}/workspace`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='staff-shell-root']").waitFor();
    await page.locator("[data-testid='today-workbench-hero']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='staff-shell-root']").getAttribute("data-route-kind")) === "home",
      "Workspace home did not open on the home route.",
    );

    await page.goto(`${baseUrl}/workspace/queue/recommended`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='queue-workboard']").waitFor();
    const task412Button = page.locator('[data-task-id="task-412"]');
    await task412Button.hover();
    await page.locator("[data-testid='queue-preview-digest']").waitFor();
    await page.waitForTimeout(140);
    assertCondition(
      (await page.locator("[data-testid='queue-preview-digest'] h3").innerText()) === "Elena Morris",
      "Queue preview did not switch after hover dwell.",
    );
    const task412PinButton = task412Button
      .locator("xpath=ancestor::article[contains(@class,'staff-shell__queue-row')][1]")
      .locator(".staff-shell__queue-pin");
    await task412PinButton.click();
    await task412Button.click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-412`);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='staff-shell-root']")
          ?.getAttribute("data-route-kind") === "task",
    );
    assertCondition(
      page.url().endsWith("/workspace/task/task-412"),
      "Queue task open did not stay inside the same shell route family.",
    );
    assertCondition(
      (await page.locator("[data-testid='staff-shell-root']").getAttribute("data-route-kind")) === "task",
      "Task open did not promote the task route kind.",
    );

    await page.getByRole("button", { name: "More-info child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-412/more-info`);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='staff-shell-root']")
          ?.getAttribute("data-route-kind") === "more-info",
    );
    await page.locator("[data-testid='protected-composition-ribbon']").waitFor();
    assertCondition(
      page.url().endsWith("/workspace/task/task-412/more-info"),
      "More-info child route drifted.",
    );
    await page.getByRole("button", { name: "Decision child route" }).click();
    await page.waitForURL(`${baseUrl}/workspace/task/task-412/decision`);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='staff-shell-root']")
          ?.getAttribute("data-route-kind") === "decision",
    );
    await page.locator("[data-testid='protected-composition-ribbon']").waitFor();
    assertCondition(
      page.url().endsWith("/workspace/task/task-412/decision"),
      "Decision child route drifted.",
    );

    await page.selectOption("[data-testid='runtime-scenario-select']", "recovery_only");
    await page.locator("[data-testid='inline-posture']").waitFor();
    const inlinePosture = await page.locator("[data-testid='inline-posture']").innerText();
    assertCondition(
      inlinePosture.includes("Protected work is frozen in place"),
      "Recovery-only posture did not localize to the current task shell.",
    );

    const sectionNav = page.locator('[aria-label="Clinical workspace sections"]');
    await sectionNav.getByRole("button", { name: "Escalations", exact: true }).click();
    await page.waitForURL(`${baseUrl}/workspace/escalations`);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='staff-shell-root']")
          ?.getAttribute("data-route-kind") === "escalations",
    );
    await page.locator("[data-testid='escalations-route']").waitFor();
    await sectionNav.getByRole("button", { name: "Approvals", exact: true }).click();
    await page.waitForURL(`${baseUrl}/workspace/approvals`);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='staff-shell-root']")
          ?.getAttribute("data-route-kind") === "approvals",
    );
    await page.locator("[data-testid='approvals-route']").waitFor();
    await sectionNav.getByRole("button", { name: "Changed", exact: true }).click();
    await page.waitForURL(`${baseUrl}/workspace/changed`);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='staff-shell-root']")
          ?.getAttribute("data-route-kind") === "changed",
    );
    await page.locator("[data-testid='changed-route']").waitFor();
    const changedText = await page.locator("[data-testid='changed-route']").innerText();
    assertCondition(
      changedText.includes("Resumed review remains delta-first") &&
        changedText.includes("reopen"),
      "Changed-since-seen route lost its delta-first rendering.",
    );

    await page.selectOption("[data-testid='runtime-scenario-select']", "live");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='staff-shell-root']")
          ?.getAttribute("data-runtime-scenario") === "live",
    );
    await sectionNav.getByRole("button", { name: "Search", exact: true }).click();
    await page.waitForURL(`${baseUrl}/workspace/search`);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='staff-shell-root']")
          ?.getAttribute("data-route-kind") === "search",
    );
    await page.locator("[data-testid='search-route']").waitFor();
    await page.locator(".staff-shell__search-field input").fill("Ravi");
    await page.locator("[data-testid='search-route']").getByText("Ravi Singh").waitFor();

    await page.goto(`${baseUrl}/workspace/queue/recommended`, { waitUntil: "networkidle" });
    const activeBefore = await page
      .locator('.staff-shell__queue-row[data-active="true"] [data-task-id]')
      .first()
      .getAttribute("data-task-id");
    await page.getByRole("button", { name: "Apply queued changes" }).click();
    const activeAfter = await page
      .locator('.staff-shell__queue-row[data-active="true"] [data-task-id]')
      .first()
      .getAttribute("data-task-id");
    assertCondition(
      Boolean(activeBefore) && activeAfter === activeBefore,
      "Active row drifted during re-rank.",
    );

    await page.goto(`${baseUrl}/workspace/task/task-311`, { waitUntil: "networkidle" });
    const deltaText = await page.locator("[data-testid='delta-stack']").innerText();
    assertCondition(
      deltaText.includes("DECISIVE delta packet") && deltaText.includes("invalidated"),
      "Decisive delta rendering drifted on the active task shell.",
    );
    await page.getByRole("button", { name: "Hold as duplicate review" }).click();
    const telemetryText = await page.locator("[data-testid='telemetry-log']").innerText();
    assertCondition(
      telemetryText.includes("surface_enter") && telemetryText.includes("dominant_action_changed"),
      "Telemetry log did not record the expected route morph and dominant-action events.",
    );
    assertCondition(
      (await page.locator("[data-testid='staff-shell-root']").getAttribute("data-automation-surface")) ===
        "rf_staff_workspace",
      "Root automation surface marker drifted on the task route.",
    );
    assertCondition(
      appExternal.size === 0,
      `Clinical workspace made unexpected external requests: ${Array.from(appExternal).join(", ")}`,
    );

    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(`${baseUrl}/workspace/task/task-311/decision`, { waitUntil: "networkidle" });
    await mobilePage.locator("[data-testid='staff-shell-root']").waitFor();
    assertCondition(
      (await mobilePage.locator("[data-testid='staff-shell-root']").getAttribute("data-layout-mode")) ===
        "mission_stack",
      "Mobile viewport did not fold to mission_stack.",
    );
    await mobilePage.close();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    await motionPage.emulateMedia({ reducedMotion: "reduce" });
    await motionPage.goto(`${baseUrl}/workspace/search?q=Asha%20Patel`, { waitUntil: "networkidle" });
    await motionPage.locator("[data-testid='staff-shell-root']").waitFor();
    assertCondition(
      (await motionPage.locator("[data-testid='staff-shell-root']").getAttribute("data-motion-profile")) ===
        "reduced",
      "Reduced-motion profile did not reach the shell root.",
    );
    assertCondition(
      await motionPage.locator("[data-testid='search-route']").getByText("Asha Patel").isVisible(),
      "Reduced-motion mode changed the search result visibility.",
    );
    await motionPage.close();
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
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
