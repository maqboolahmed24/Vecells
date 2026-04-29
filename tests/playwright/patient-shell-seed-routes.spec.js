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

const RETIRED_UI_PATHS = [
  path.join(APP_DIR, "src", "patient-shell-seed.tsx"),
  path.join(APP_DIR, "src", "patient-shell-seed.css"),
  path.join(APP_DIR, "src", "patient-shell-seed.test.tsx"),
];

export const patientShellSeedRouteCoverage = [
  "legacy patient shell files are absent",
  "patient-shell-seed-routes localStorage flag is ignored",
  "canonical Patient Web home owns the authenticated patient home route",
  "Start new request exits to the signed-in intake entry",
  "signed-in intake entry launches /start-request/dft_auth_199/request-type",
  "retired embedded patient shell path normalizes to the canonical home",
  "appointments route stays available through the standalone appointment family workspace",
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

async function assertNoRetiredShell(page) {
  assertCondition(
    (await page.locator("[data-testid='patient-shell-root']").count()) === 0,
    "Retired patient shell root rendered.",
  );
  assertCondition(
    (await page.locator("[data-testid='patient-primary-nav']").count()) === 0,
    "Retired patient shell primary nav rendered.",
  );
  assertCondition(
    (await page.locator("[data-testid='patient-telemetry-panel']").count()) === 0,
    "Retired patient shell telemetry panel rendered.",
  );
}

async function assertCanonicalHome(page) {
  const root = page.locator("[data-testid='Patient_Home_Requests_Detail_Route']");
  await root.waitFor();
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Quiet_Casework_Premium",
    "Canonical patient home visual mode drifted.",
  );
  assertCondition(
    (await root.getAttribute("data-route-key")) === "home",
    "Canonical patient home route key drifted.",
  );
  await page.locator("[data-testid='patient-home-route']").waitFor();
  await page.locator("[data-testid='home-start-new-request']").waitFor();
  await assertNoRetiredShell(page);
}

export async function run() {
  for (const retiredPath of RETIRED_UI_PATHS) {
    assertCondition(!fs.existsSync(retiredPath), `Retired shell file still exists: ${retiredPath}`);
  }

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    await page.addInitScript(() => {
      localStorage.setItem("patient-shell-seed-routes", "true");
    });
    const externalRequests = new Set();
    trackExternalRequests(page, baseUrl, externalRequests);

    await page.goto(`${baseUrl}/home`, { waitUntil: "networkidle" });
    await assertCanonicalHome(page);

    await page.locator("[data-testid='home-start-new-request']").click();
    await page.waitForURL(`${baseUrl}/portal/start-request`);
    await page.locator("[data-testid='Signed_In_Request_Start_Restore_Route']").waitFor();
    await assertNoRetiredShell(page);

    await page.locator("[data-testid='signed-in-start-request-action']").click();
    await page.waitForURL(`${baseUrl}/start-request/dft_auth_199/request-type`);
    await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();

    await page.goto(`${baseUrl}/home/embedded`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.location.pathname === "/home");
    await assertCanonicalHome(page);

    await page.goto(`${baseUrl}/appointments`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='PatientAppointmentFamilyWorkspace']").waitFor();
    await assertNoRetiredShell(page);

    assertCondition(
      externalRequests.size === 0,
      `Patient replacement flow made unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.close();
  } finally {
    await browser.close();
    await stopPatientWeb(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
