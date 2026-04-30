import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "mock-nhs-login");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "nhs_login_capture_pack.json"), "utf8"),
);

export const mockOnboardingEvidenceCoverage = [
  "sign-in entry from the shell",
  "callback handling returns governed route data",
  "auth_read_only local session outcome",
  "writable candidate remains locally governed",
  "consent denial stays bounded",
  "local logout resets only the local session",
  "session expiry returns re-auth recovery",
  "reduced motion and accessibility smoke",
];

export const onboardingEvidenceManifest = {
  task: "par_124",
  onboardingStage: "mock_local_bridge",
  evidenceRefs: [
    "EVID_124_MOCK_PLAYWRIGHT_JOURNEYS",
    "EVID_124_MOCK_ACCESSIBILITY_PROOF",
  ],
  journeyScenarios: [
    "happy_path",
    "consent_denied",
    "expired_session",
  ],
  verifiedPostures: [
    "auth_read_only",
    "writable_candidate",
    "consent_denied",
    "logged_out",
    "re_auth_required",
  ],
};

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
    throw new Error("This spec needs the `playwright` package when run with --run.", { cause: error });
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

async function startMockNhsLogin() {
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
    await waitForHttp(`${baseUrl}/?view=signin`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Mock NHS login app failed to start.\n${logs.join("")}`, { cause: error });
  }

  return { child, baseUrl };
}

async function stopMockNhsLogin(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function continueToConsent(page) {
  await page.locator("[data-testid='continue-sign-in']").click();
  await page.locator("[data-testid='field-otp']").waitFor();
  await page.locator("[data-testid='continue-sign-in']").click();
  await page.locator("[data-testid='consent-button-allow']").waitFor();
}

async function expectText(locator, expected) {
  const actual = (await locator.innerText()).trim();
  assertCondition(actual === expected, `Expected "${expected}" but found "${actual}".`);
}

async function run() {
  assertCondition(PACK.task_id === "seq_025", "Mock NHS login capture pack task drifted.");
  assertCondition(
    PACK.route_bindings.some((row) => row.route_binding_id === "rb_patient_appointments"),
    "Expected appointments route binding to exist.",
  );
  assertCondition(
    PACK.auth_scenarios.some((row) => row.scenario_id === "expired_session"),
    "Expected expired_session scenario to exist.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startMockNhsLogin();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    await page.goto(`${baseUrl}/?view=signin`, { waitUntil: "networkidle" });

    const shell = page.locator("[data-testid='bluewoven-shell']");
    await shell.waitFor();
    await page.locator("[data-testid='summary-banner']").waitFor();
    await page.locator("[data-testid='route-binding-select']").waitFor();
    await page.locator("[data-testid='user-sign-in']").waitFor();

    await page.locator("[data-testid='route-binding-select']").selectOption("rb_patient_home");
    await page.locator("[data-testid='user-select']").selectOption("usr_repeat_p5");
    await page.locator("[data-testid='scenario-chip-happy_path']").click();
    await continueToConsent(page);
    await page.locator("[data-testid='consent-button-allow']").click();
    await page.locator("[data-testid='auth-return-state']").waitFor();
    await expectText(page.locator("[data-testid='return-card-state']"), "callback_received");
    await expectText(page.locator("[data-testid='return-card-local-session-decision']"), "auth_read_only");
    assertCondition(
      (await page.locator("[data-testid='return-card-callback-uri']").innerText()).includes("/auth/callback/home"),
      "Expected home callback URI on auth_read_only flow.",
    );
    assertCondition(
      (await shell.getAttribute("data-writable-state")) === "auth_read_only",
      "Shell writable state should remain auth_read_only after patient home sign-in.",
    );
    assertCondition(
      (await page.locator("[data-testid='event-log']").innerText()).includes("Local session decision: auth_read_only."),
      "Expected auth_read_only event log entry.",
    );

    await page.locator("[data-testid='local-logout-button']").click();
    await page.locator("[data-testid='user-sign-in']").waitFor();
    assertCondition(
      (await shell.getAttribute("data-writable-state")) === "pending",
      "Shell writable state should reset to pending after local logout.",
    );
    assertCondition(
      (await page.locator("[data-testid='event-log']").innerText()).includes(
        "Local session terminated inside the simulator.",
      ),
      "Expected explicit local logout evidence in the event log.",
    );

    await page.locator("[data-testid='route-binding-select']").selectOption("rb_patient_appointments");
    await page.locator("[data-testid='user-select']").selectOption("usr_verified_p9");
    await page.locator("[data-testid='scenario-chip-happy_path']").click();
    await continueToConsent(page);
    await page.locator("[data-testid='consent-button-allow']").click();
    await expectText(page.locator("[data-testid='return-card-local-session-decision']"), "writable_candidate");
    assertCondition(
      (await page.locator("[data-testid='auth-return-state']").innerText()).includes(
        "local session ceiling rather than pretending the route is automatically writable",
      ),
      "Writable candidate flow should still explain the local authority boundary.",
    );
    await page.locator("[data-testid='local-logout-button']").click();
    await page.locator("[data-testid='user-sign-in']").waitFor();

    await page.locator("[data-testid='route-binding-select']").selectOption("rb_patient_home");
    await page.locator("[data-testid='user-select']").selectOption("usr_repeat_p5");
    await page.locator("[data-testid='scenario-chip-consent_denied']").click();
    await continueToConsent(page);
    await page.locator("[data-testid='consent-button-deny']").click();
    await expectText(page.locator("[data-testid='return-card-state']"), "denied");
    await expectText(page.locator("[data-testid='return-card-local-session-decision']"), "consent_denied");
    assertCondition(
      (await page.locator("[data-testid='event-log']").innerText()).includes("Consent stage resolved as denied."),
      "Expected consent denial event log entry.",
    );
    await page.locator("[data-testid='restart-auth-button']").click();
    await page.locator("[data-testid='user-sign-in']").waitFor();

    await page.locator("[data-testid='route-binding-select']").selectOption("rb_patient_health_record");
    await page.locator("[data-testid='user-select']").selectOption("usr_verified_p9");
    await page.locator("[data-testid='scenario-chip-expired_session']").click();
    await continueToConsent(page);
    await page.locator("[data-testid='consent-button-allow']").click();
    await expectText(page.locator("[data-testid='return-card-state']"), "re_auth_required");
    await expectText(page.locator("[data-testid='return-card-local-session-decision']"), "re_auth_required");
    await page.locator("[data-testid='restart-auth-button']").click();
    await page.locator("[data-testid='user-sign-in']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='event-log']").innerText()).includes("Recovery requested."),
      "Expected explicit recovery event log entry after session expiry.",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("[data-testid='reduced-motion-indicator']").waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='summary-banner']").waitFor();
    await page.locator("[data-testid='credential-intake-drawer']").waitFor();

    const headings = await page.locator("h1, h2, h3").count();
    assertCondition(headings >= 5, `Expected at least five headings, found ${headings}.`);

    await page.close();
  } finally {
    await browser.close();
    await stopMockNhsLogin(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
