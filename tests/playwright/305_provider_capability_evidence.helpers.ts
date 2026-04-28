import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URLSearchParams } from "node:url";

import { resetProviderSandboxes } from "../../scripts/providers/304_provider_sandbox_lib.ts";
import {
  buildProviderCapabilityEvidenceRegistry,
  buildProviderPrerequisiteRegistry,
  buildProviderTestCredentialManifest,
  captureProviderCapabilityEvidence,
  materializeProviderCapabilityEvidenceArtifacts,
  type ProviderCapabilityEvidenceRow,
} from "../../scripts/providers/305_provider_capability_evidence_lib.ts";
import {
  assertCondition,
  importPlaywright,
  outputPath,
  trackExternalRequests,
} from "./304_provider_sandbox.helpers.ts";

export const ROOT = path.resolve(process.cwd());
export const DEFAULT_RUNTIME_DIR = path.join(
  ROOT,
  "output",
  "playwright",
  "305-provider-evidence-state",
);

const SESSION_COOKIE = "booking_provider_capability_evidence_session=active";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isAuthenticated(request: http.IncomingMessage): boolean {
  return request.headers.cookie?.includes(SESSION_COOKIE) ?? false;
}

async function readRequestBody(request: http.IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function redirect(
  response: http.ServerResponse,
  location: string,
  cookie?: string,
): void {
  response.writeHead(302, {
    Location: location,
    ...(cookie ? { "Set-Cookie": cookie } : {}),
  });
  response.end();
}

function writeHtml(response: http.ServerResponse, html: string): void {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

function pageShell(
  title: string,
  activePage: "evidence" | "observations" | "login",
  body: string,
): string {
  const navLink = (
    href: string,
    label: string,
    testId: string,
    key: "evidence" | "observations",
  ) => {
    const active = activePage === key ? ' data-active="true"' : "";
    return `<a href="${href}" data-testid="${testId}"${active}>${label}</a>`;
  };
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f3f6fb;
        --panel: #ffffff;
        --ink: #111827;
        --muted: #4b5563;
        --line: #d5dbe4;
        --brand: #0f4c81;
        --success: #087443;
        --warn: #b54708;
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #ecf2fb 0%, var(--bg) 100%);
        color: var(--ink);
      }
      .shell {
        width: min(1500px, calc(100vw - 32px));
        margin: 24px auto 40px;
        display: grid;
        gap: 20px;
      }
      header,
      main {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: 0 18px 48px rgba(16, 24, 40, 0.08);
      }
      header {
        padding: 20px 24px;
        display: grid;
        gap: 16px;
      }
      main {
        padding: 24px;
        display: grid;
        gap: 20px;
      }
      .eyebrow {
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--brand);
      }
      h1, h2, h3 {
        margin: 0;
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.5;
      }
      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      nav a {
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid var(--line);
        text-decoration: none;
        color: var(--ink);
        font-weight: 600;
        background: #fbfcfe;
      }
      nav a[data-active="true"] {
        border-color: rgba(15, 76, 129, 0.35);
        background: rgba(15, 76, 129, 0.08);
        color: var(--brand);
      }
      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .card, .banner {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fbfdff;
        padding: 16px;
        display: grid;
        gap: 10px;
      }
      .banner[data-tone="success"] {
        background: #effaf4;
      }
      .banner[data-tone="warn"] {
        background: #fff8ef;
      }
      .banner[data-tone="danger"] {
        background: #fff1f2;
      }
      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: #fff;
        font-size: 13px;
        font-weight: 600;
      }
      .pill[data-tone="success"] {
        color: var(--success);
        border-color: rgba(8, 116, 67, 0.28);
        background: rgba(8, 116, 67, 0.08);
      }
      .pill[data-tone="warn"] {
        color: var(--warn);
        border-color: rgba(181, 71, 8, 0.28);
        background: rgba(181, 71, 8, 0.08);
      }
      .pill[data-tone="danger"] {
        color: var(--danger);
        border-color: rgba(180, 35, 24, 0.28);
        background: rgba(180, 35, 24, 0.08);
      }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
      }
      button {
        cursor: pointer;
        border: 1px solid var(--line);
        background: #fff;
        color: var(--ink);
        padding: 10px 14px;
        border-radius: 12px;
        font: inherit;
        font-weight: 600;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 12px 10px;
        border-bottom: 1px solid #e8edf3;
        text-align: left;
        vertical-align: top;
      }
      th {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      code {
        font-size: 12px;
        background: #f3f6fb;
        padding: 2px 6px;
        border-radius: 6px;
      }
      .stack {
        display: grid;
        gap: 16px;
      }
      form { margin: 0; }
      label {
        display: grid;
        gap: 6px;
        font-weight: 600;
      }
      input {
        min-height: 42px;
        border-radius: 12px;
        border: 1px solid var(--line);
        padding: 0 12px;
        font: inherit;
      }
      .login-shell {
        width: min(520px, calc(100vw - 32px));
        margin: 80px auto;
      }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <div class="${activePage === "login" ? "login-shell" : "shell"}">
      <header>
        <div class="eyebrow">Phase 4 Booking Evidence</div>
        <h1>${escapeHtml(title)}</h1>
        <p>Provider capability claims, prerequisite posture, and masked credential metadata bound to the active booking adapter identity.</p>
        ${
          activePage === "login"
            ? ""
            : `<nav>
                ${navLink("/portal/evidence", "Capability Ledger", "nav-evidence", "evidence")}
                ${navLink("/portal/observations", "Observation Detail", "nav-observations", "observations")}
              </nav>`
        }
      </header>
      <main>${body}</main>
    </div>
  </body>
</html>`;
}

function renderLoginPage(): string {
  return pageShell(
    "Provider Capability Evidence Login",
    "login",
    `<form method="post" action="/login" data-testid="provider-capability-evidence-login" class="stack">
      <label>Username
        <input name="username" data-testid="provider-evidence-username" autocomplete="username" />
      </label>
      <label>Password
        <input type="password" name="password" data-testid="provider-evidence-password" autocomplete="current-password" />
      </label>
      <button type="submit" data-testid="provider-capability-evidence-login-submit">Open evidence console</button>
      <p>Only masked operator access is exposed here. The harness never renders raw supplier secrets.</p>
    </form>`,
  );
}

function displayStatusTone(status: string): "success" | "warn" | "danger" {
  if (status === "current") {
    return "success";
  }
  if (status === "manual_attested") {
    return "danger";
  }
  return "warn";
}

function pickPrimaryStatus(rows: readonly ProviderCapabilityEvidenceRow[]): string {
  return rows[0]?.evidenceStatus ?? "unknown";
}

function baseCredentialRef(secretRef: string): string {
  return secretRef.split("://")[0] ?? "unknown";
}

async function renderEvidencePage(outputDir: string, sandboxOutputDir: string): Promise<string> {
  const registry = await buildProviderCapabilityEvidenceRegistry();
  const credentials = await buildProviderTestCredentialManifest();
  const prerequisites = await buildProviderPrerequisiteRegistry();
  const captureSummaryPath = path.join(outputDir, "305_capability_evidence_capture_summary.json");
  const captureSummary = fs.existsSync(captureSummaryPath)
    ? JSON.parse(fs.readFileSync(captureSummaryPath, "utf8"))
    : null;
  const sandboxIds = [...new Set(registry.evidenceRows.map((row) => row.sandboxId))].sort();

  const rowsHtml = sandboxIds
    .map((sandboxId) => {
      const evidenceRows = registry.evidenceRows.filter((row) => row.sandboxId === sandboxId);
      const credentialRows = credentials.credentials.filter((row) => row.sandboxId === sandboxId);
      const prerequisiteRows = prerequisites.prerequisites.filter((row) => row.sandboxId === sandboxId);
      const first = evidenceRows[0]!;
      const status = pickPrimaryStatus(evidenceRows);
      const callbackState =
        captureSummary?.callbackVerification?.callbackChecks?.find(
          (row: { sandboxId: string; state: string }) => row.sandboxId === sandboxId,
        )?.state ?? "not_captured";
      return `<tr
        data-testid="evidence-row-${sandboxId}"
        data-evidence-status="${escapeHtml(status)}"
        data-callback-state="${escapeHtml(callbackState)}"
      >
        <td>
          <strong>${escapeHtml(first.supplierLabel)}</strong><br />
          <span class="muted"><code>${escapeHtml(sandboxId)}</code></span>
        </td>
        <td><code>${escapeHtml(first.providerCapabilityMatrixRef)}</code></td>
        <td>${escapeHtml(first.environmentId)}</td>
        <td><span class="pill" data-testid="evidence-status-${sandboxId}" data-tone="${displayStatusTone(status)}">${escapeHtml(status)}</span></td>
        <td><span class="pill" data-testid="callback-state-${sandboxId}" data-tone="${callbackState === "verified" ? "success" : "warn"}">${escapeHtml(callbackState)}</span></td>
        <td>${evidenceRows.length} claims / ${prerequisiteRows.length} prerequisites / ${credentialRows.length} credentials</td>
        <td><code data-testid="binding-hash-${sandboxId}">${escapeHtml(first.providerAdapterBindingHash)}</code></td>
        <td><a href="/portal/observations?sandboxId=${encodeURIComponent(sandboxId)}" data-testid="observation-link-${sandboxId}">Open detail</a></td>
      </tr>`;
    })
    .join("");

  const automated = registry.evidenceRows.filter((row) => row.evidenceStatus === "current").length;
  const reviewRequired = registry.evidenceRows.filter(
    (row) => row.evidenceStatus === "review_required",
  ).length;
  const manualAttested = registry.evidenceRows.filter(
    (row) => row.evidenceStatus === "manual_attested",
  ).length;

  return pageShell(
    "Provider Capability Evidence Ledger",
    "evidence",
    `<div class="toolbar">
      <div class="pill-row">
        <span class="pill" data-testid="coverage-sandboxes">${registry.coverageSummary.sandboxCount} sandboxes</span>
        <span class="pill" data-testid="coverage-providers">${registry.coverageSummary.uniqueProviderRowCount} provider rows</span>
        <span class="pill" data-testid="coverage-claims">${registry.coverageSummary.evidenceRowCount} capability claims</span>
      </div>
      <form method="post" action="/portal/evidence/capture">
        <input type="hidden" name="sandboxOutputDir" value="${escapeHtml(sandboxOutputDir)}" />
        <button type="submit" data-testid="capture-provider-capability-evidence">Capture and refresh evidence</button>
      </form>
    </div>
    <div class="grid">
      <section class="card">
        <h2>Evidence posture</h2>
        <div class="pill-row">
          <span class="pill" data-testid="current-claim-count" data-tone="success">${automated} current</span>
          <span class="pill" data-testid="review-claim-count" data-tone="warn">${reviewRequired} review_required</span>
          <span class="pill" data-testid="manual-claim-count" data-tone="danger">${manualAttested} manual_attested</span>
        </div>
        <p>Automated rows come only from the repo-owned local-gateway twins. Manual-bridge providers stay explicit instead of pretending to be current.</p>
      </section>
      <section class="card">
        <h2>Capture state</h2>
        <p data-testid="capture-summary-path">${
          captureSummaryPath
        }</p>
        <p data-testid="capture-state">${
          captureSummary
            ? `Last captured at ${captureSummary.callbackVerification.verificationAt}`
            : "No browser-mediated capture has run in this harness yet."
        }</p>
      </section>
    </div>
    <section class="card">
      <h2>Capability coverage by sandbox</h2>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Matrix row</th>
            <th>Environment</th>
            <th>Status</th>
            <th>Callback check</th>
            <th>Coverage</th>
            <th>Binding hash</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </section>`,
  );
}

async function renderObservationPage(sandboxId: string | null): Promise<string> {
  const registry = await buildProviderCapabilityEvidenceRegistry();
  const credentials = await buildProviderTestCredentialManifest();
  const prerequisites = await buildProviderPrerequisiteRegistry();
  const targetSandboxId =
    sandboxId ?? [...new Set(registry.evidenceRows.map((row) => row.sandboxId))].sort()[0]!;
  const evidenceRows = registry.evidenceRows.filter((row) => row.sandboxId === targetSandboxId);
  assertCondition(evidenceRows.length > 0, `missing evidence rows for ${targetSandboxId}`);
  const credentialRows = credentials.credentials.filter((row) => row.sandboxId === targetSandboxId);
  const prerequisiteRows = prerequisites.prerequisites.filter((row) => row.sandboxId === targetSandboxId);
  const first = evidenceRows[0]!;
  const primaryStatus = pickPrimaryStatus(evidenceRows);

  const claimTable = evidenceRows
    .map(
      (row) => `<tr
        data-testid="claim-${row.sandboxId}-${row.capabilityClaimRef}"
        data-claim-outcome="${escapeHtml(row.claimOutcome)}"
        data-claim-value="${escapeHtml(String(row.claimValue))}"
      >
        <td><code>${escapeHtml(row.capabilityClaimRef)}</code></td>
        <td>${escapeHtml(String(row.claimValue))}</td>
        <td>${escapeHtml(row.claimOutcome)}</td>
        <td>${escapeHtml(row.selectionAudience)} / ${escapeHtml(row.requestedActionScope)}</td>
        <td><code>${escapeHtml(row.capabilityTupleHash)}</code></td>
      </tr>`,
    )
    .join("");

  const prerequisiteTable = prerequisiteRows
    .map(
      (row) => `<tr data-testid="prerequisite-${row.sandboxId}-${row.prerequisiteRef}">
        <td><code>${escapeHtml(row.prerequisiteRef)}</code></td>
        <td>${escapeHtml(row.requiredState)}</td>
        <td>${escapeHtml(row.observedState)}</td>
        <td>${escapeHtml(row.evidenceStatus)}</td>
      </tr>`,
    )
    .join("");

  const credentialTable = credentialRows
    .map(
      (row) => `<tr data-testid="credential-${row.credentialId}" data-owner-role="${escapeHtml(row.ownerRole)}">
        <td><code>${escapeHtml(row.credentialId)}</code></td>
        <td>${escapeHtml(row.credentialType)}</td>
        <td>${escapeHtml(baseCredentialRef(row.secretRef))}</td>
        <td data-testid="credential-fingerprint-${row.credentialId}"><code>${escapeHtml(row.maskedFingerprint)}</code></td>
        <td>${escapeHtml(row.ownerRole)}</td>
        <td>${escapeHtml(row.expiryState)}</td>
      </tr>`,
    )
    .join("");

  return pageShell(
    `${first.supplierLabel} observation detail`,
    "observations",
    `<section
      class="banner"
      data-testid="observation-banner-${targetSandboxId}"
      data-tone="${displayStatusTone(primaryStatus)}"
      data-evidence-status="${escapeHtml(primaryStatus)}"
    >
      <h2>${escapeHtml(first.supplierLabel)}</h2>
      <p><code>${escapeHtml(targetSandboxId)}</code> is bound to <code>${escapeHtml(first.providerAdapterBindingHash)}</code>.</p>
      <div class="pill-row">
        <span class="pill" data-tone="${displayStatusTone(primaryStatus)}">${escapeHtml(primaryStatus)}</span>
        <span class="pill">${escapeHtml(first.observationMethod)}</span>
        <span class="pill">${escapeHtml(first.environmentId)}</span>
      </div>
      <p data-testid="gap-artifact-${targetSandboxId}">${
        first.gapArtifactRef ? escapeHtml(first.gapArtifactRef) : "No provider-specific automation gap"
      }</p>
    </section>
    <section class="card">
      <h2>Capability claims</h2>
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Value</th>
            <th>Outcome</th>
            <th>Audience / action</th>
            <th>Tuple hash</th>
          </tr>
        </thead>
        <tbody>${claimTable}</tbody>
      </table>
    </section>
    <section class="card">
      <h2>Prerequisite posture</h2>
      <table>
        <thead>
          <tr>
            <th>Prerequisite</th>
            <th>Required</th>
            <th>Observed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${prerequisiteTable}</tbody>
      </table>
    </section>
    <section class="card">
      <h2>Masked credential governance</h2>
      <table>
        <thead>
          <tr>
            <th>Credential</th>
            <th>Type</th>
            <th>Store</th>
            <th>Masked fingerprint</th>
            <th>Owner</th>
            <th>Expiry state</th>
          </tr>
        </thead>
        <tbody>${credentialTable}</tbody>
      </table>
    </section>`,
  );
}

export async function startProviderCapabilityEvidenceHarness(
  outputDir = DEFAULT_RUNTIME_DIR,
): Promise<{
  server: http.Server;
  baseUrl: string;
  outputDir: string;
  sandboxOutputDir: string;
}> {
  fs.mkdirSync(outputDir, { recursive: true });
  const sandboxOutputDir = path.join(outputDir, "304-provider-runtime");
  fs.rmSync(path.join(ROOT, ".artifacts", "provider-evidence", "305"), {
    recursive: true,
    force: true,
  });
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  await materializeProviderCapabilityEvidenceArtifacts(ROOT);
  await resetProviderSandboxes({ outputDir: sandboxOutputDir });

  const server = http.createServer(async (request: http.IncomingMessage, response: http.ServerResponse) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    try {
      if (request.method === "GET" && requestUrl.pathname === "/") {
        redirect(response, isAuthenticated(request) ? "/portal/evidence" : "/login");
        return;
      }
      if (request.method === "GET" && requestUrl.pathname === "/login") {
        writeHtml(response, renderLoginPage());
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/login") {
        const body = await readRequestBody(request);
        const username = body.get("username")?.trim();
        const password = body.get("password")?.trim();
        if (!username || !password) {
          response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          response.end("username and password are required");
          return;
        }
        redirect(response, "/portal/evidence", SESSION_COOKIE);
        return;
      }
      if (!isAuthenticated(request)) {
        redirect(response, "/login");
        return;
      }
      if (request.method === "GET" && requestUrl.pathname === "/portal/evidence") {
        writeHtml(response, await renderEvidencePage(outputDir, sandboxOutputDir));
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/portal/evidence/capture") {
        await captureProviderCapabilityEvidence({ outputDir, sandboxOutputDir });
        redirect(response, "/portal/evidence");
        return;
      }
      if (request.method === "GET" && requestUrl.pathname === "/portal/observations") {
        writeHtml(
          response,
          await renderObservationPage(requestUrl.searchParams.get("sandboxId")),
        );
        return;
      }

      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("not found");
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(error instanceof Error ? error.stack ?? error.message : String(error));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  assertCondition(address && typeof address === "object", "provider capability evidence harness did not bind");

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    outputDir,
    sandboxOutputDir,
  };
}

export async function stopProviderCapabilityEvidenceHarness(
  server: http.Server,
): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error?: Error | undefined) => (error ? reject(error) : resolve())),
  );
}

export async function loginToProviderCapabilityEvidencePortal(
  page: any,
  baseUrl: string,
): Promise<void> {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='provider-capability-evidence-login']").waitFor();
  await page.getByTestId("provider-evidence-username").fill("masked.operator");
  await page.getByTestId("provider-evidence-password").fill("masked-password");
  await Promise.all([
    page.waitForURL(/\/portal\/evidence$/),
    page.getByTestId("provider-capability-evidence-login-submit").click(),
  ]);
}

export {
  assertCondition,
  importPlaywright,
  outputPath,
  trackExternalRequests,
};
