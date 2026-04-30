#!/usr/bin/env node
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const APP_ROUTES = [
  {
    name: "patient-web",
    cwd: "apps/patient-web",
    routes: ["/", "/requests/request_211_a", "/embedded/request-status"],
  },
  {
    name: "clinical-workspace",
    cwd: "apps/clinical-workspace",
    routes: ["/workspace", "/workspace/queue/recommended", "/workspace/task/task-311"],
  },
  {
    name: "ops-console",
    cwd: "apps/ops-console",
    routes: ["/ops/overview", "/ops/dependencies"],
  },
  {
    name: "hub-desk",
    cwd: "apps/hub-desk",
    routes: ["/hub/queue", "/hub/case/hub-case-104"],
  },
  {
    name: "pharmacy-console",
    cwd: "apps/pharmacy-console",
    routes: [
      "/workspace/pharmacy",
      "/workspace/pharmacy/PHC-2103",
      "/workspace/pharmacy/PHC-2103/assurance",
    ],
  },
  {
    name: "governance-console",
    cwd: "apps/governance-console",
    routes: ["/governance", "/governance/bundles", "/governance/access", "/governance/records"],
  },
  {
    name: "mock-telephony-lab",
    cwd: "apps/mock-telephony-lab",
    routes: ["/"],
  },
];

const BLOCKED_PATTERNS = [
  ["diagnostic control", /\bdiagnostics?\b/i],
  ["internal lifecycle term", /\bphase\s*\d+\b/i],
  [
    "implementation wording",
    /\b(contract|lineage|provenance|telemetry|fixture|stub|manifest|posture|tuple|hash)\b/i,
  ],
  ["internal route wording", /\b(route family|continuity key|anchor policy|route guard|shell family)\b/i],
  [
    "internal component name",
    /\b(DecisionDock|NorthStarBand|RouteContinuityLedger|SameShellContinuityLedger|ServiceHealthGrid|CohortImpactMatrix|ScopeTupleInspector|ReleaseFreezeTupleCard|ProvenanceStub|SelectedAnchorStub|OpsDeltaGate)\b/,
  ],
  ["raw reference", /\b(?:rf_|par_|seq_|PHASE\d|COPYVAR|APC_|ASPR_|PNRC_|OGC_|ISRC_|ASRB_)[A-Za-z0-9_:-]*\b/],
  ["snake-case reference", /\b[a-z][a-z0-9]+_[a-z0-9_]+\b/],
  ["long digest", /\b(?:sha256:)?[a-f0-9]{12,}\b/i],
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function waitForHttp(url, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
          response.resume();
          if ((response.statusCode ?? 0) < 500) {
            resolve();
          } else {
            reject(new Error(`HTTP ${response.statusCode}`));
          }
        });
        request.once("error", reject);
        request.setTimeout(2_000, () => {
          request.destroy(new Error("Timed out"));
        });
      });
      return;
    } catch {
      await wait(150);
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startApp(app) {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: path.join(ROOT, app.cwd),
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
    throw new Error(`${app.name} failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { baseUrl, child };
}

async function stopApp(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", resolve);
    setTimeout(resolve, 2_000);
  });
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function snippetAround(copy, index, length) {
  const start = Math.max(0, index - 80);
  const end = Math.min(copy.length, index + length + 120);
  return copy.slice(start, end).replace(/\s+/g, " ").trim();
}

async function collectRenderedCopy(page) {
  return await page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none") {
        return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const text = [document.body.innerText ?? ""];
    const selectors = ["[aria-label]", "[title]", "[placeholder]"];
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        if (!(element instanceof HTMLElement) || !visible(element)) {
          continue;
        }
        for (const attr of ["aria-label", "title", "placeholder"]) {
          const value = element.getAttribute(attr);
          if (value) {
            text.push(value);
          }
        }
      }
    }
    return text.join("\n");
  });
}

async function auditRoute(browser, app, baseUrl, route) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.locator("body").waitFor();
    const copy = normalize(await collectRenderedCopy(page));
    const findings = [];
    for (const [label, pattern] of BLOCKED_PATTERNS) {
      const match = pattern.exec(copy);
      if (match) {
        findings.push(
          `${app.name}${route}: ${label}: ${match[0]} :: ${snippetAround(copy, match.index, match[0].length)}`,
        );
      }
    }
    return findings;
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const findings = [];
  try {
    for (const app of APP_ROUTES) {
      const { baseUrl, child } = await startApp(app);
      try {
        for (const route of app.routes) {
          findings.push(...(await auditRoute(browser, app, baseUrl, route)));
        }
      } finally {
        await stopApp(child);
      }
    }
  } finally {
    await browser.close();
  }

  if (findings.length > 0) {
    console.error("Rendered public UI copy exposes internal implementation wording:");
    for (const finding of findings.slice(0, 100)) {
      console.error(` - ${finding}`);
    }
    if (findings.length > 100) {
      console.error(` - ... ${findings.length - 100} more`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`Rendered public UI copy scan passed for ${APP_ROUTES.reduce((sum, app) => sum + app.routes.length, 0)} routes.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
