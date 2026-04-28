import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URLSearchParams } from "node:url";

import {
  bootstrapProviderSandboxes,
  buildProviderCallbackManifest,
  buildProviderSandboxRegistry,
  materializeProviderSandboxArtifacts,
  resetProviderSandboxes,
  verifyProviderCallbacks,
} from "../../scripts/providers/304_provider_sandbox_lib.ts";

export const ROOT = path.resolve(process.cwd());
export const DEFAULT_RUNTIME_DIR = path.join(
  ROOT,
  "output",
  "playwright",
  "304-provider-portal-state",
);

const SESSION_COOKIE = "booking_provider_portal_session=active";

interface RuntimeStateRow {
  sandboxId: string;
  callbackId: string;
  callbackUrlPath: string;
  providerAdapterBindingHash: string;
  verificationMode: string;
  maskedSecretFingerprint: string | null;
  configuredAt: string;
}

interface RuntimeState {
  version: string;
  registrations: RuntimeStateRow[];
}

interface VerificationRow {
  callbackId: string;
  sandboxId: string;
  callbackMode: string;
  state: string;
  receiptDecisionClasses: string[];
  verificationMode: string;
}

interface VerificationSummary {
  taskId: string;
  verificationAt: string;
  callbackChecks: VerificationRow[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pageShell(title: string, body: string, activePage: "sandboxes" | "callbacks" | "login"): string {
  const navLink = (href: string, label: string, testId: string, key: "sandboxes" | "callbacks") => {
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
        --bg: #f4f7fb;
        --panel: #ffffff;
        --ink: #101828;
        --muted: #475467;
        --line: #d0d5dd;
        --soft: #eaecf0;
        --brand: #0f4c81;
        --success: #087443;
        --warn: #b54708;
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #eef4fb 0%, var(--bg) 100%);
        color: var(--ink);
      }
      .shell {
        width: min(1480px, calc(100vw - 32px));
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
      .eyebrow {
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--brand);
      }
      h1 {
        margin: 0;
        font-size: clamp(28px, 3vw, 40px);
        line-height: 1.05;
      }
      .subhead {
        margin: 0;
        max-width: 880px;
        color: var(--muted);
        line-height: 1.55;
      }
      nav {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      nav a {
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid var(--line);
        text-decoration: none;
        color: var(--ink);
        background: #fbfcfe;
        font-weight: 600;
      }
      nav a[data-active="true"] {
        border-color: rgba(15, 76, 129, 0.35);
        background: rgba(15, 76, 129, 0.08);
        color: var(--brand);
      }
      main {
        padding: 24px;
        display: grid;
        gap: 20px;
      }
      .stack {
        display: grid;
        gap: 16px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }
      .card,
      .banner {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fbfdff;
        padding: 16px;
      }
      .banner {
        background: #fff9f2;
      }
      .banner[data-tone="success"] {
        background: #effaf4;
      }
      .banner[data-tone="danger"] {
        background: #fef3f2;
      }
      .card h2,
      .card h3,
      .banner h2,
      .banner h3 {
        margin: 0 0 8px;
      }
      .meta {
        font-size: 13px;
        color: var(--muted);
        line-height: 1.5;
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
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 12px 10px;
        border-bottom: 1px solid var(--soft);
        vertical-align: top;
        text-align: left;
      }
      th {
        font-size: 12px;
        color: var(--muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      td code {
        font-size: 12px;
        background: #f4f6f9;
        padding: 2px 6px;
        border-radius: 6px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      form {
        margin: 0;
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
      button[data-variant="primary"] {
        background: var(--brand);
        color: white;
        border-color: var(--brand);
      }
      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .login-shell {
        display: grid;
        gap: 14px;
        max-width: 420px;
      }
      label {
        display: grid;
        gap: 6px;
        font-weight: 600;
      }
      input {
        width: 100%;
        min-height: 44px;
        border-radius: 12px;
        border: 1px solid var(--line);
        padding: 0 12px;
        font: inherit;
      }
      @media (max-width: 800px) {
        .shell {
          width: min(100vw - 16px, 1480px);
          margin: 12px auto 24px;
        }
        header,
        main {
          padding-left: 16px;
          padding-right: 16px;
        }
        table,
        thead,
        tbody,
        tr,
        th,
        td {
          display: block;
        }
        th {
          padding-bottom: 4px;
        }
        td {
          padding-top: 4px;
        }
        tr {
          border-bottom: 1px solid var(--soft);
          padding: 10px 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="eyebrow">Phase 4 booking provider control plane</div>
        <h1>${escapeHtml(title)}</h1>
        <p class="subhead">Deterministic provider sandbox setup, callback registration, and replay-safe verification for task 304. All portal evidence is masked and bound to the current adapter-binding identity.</p>
        <nav>
          ${navLink("/portal/sandboxes", "Sandbox Registry", "portal-nav-sandboxes", "sandboxes")}
          ${navLink("/portal/callbacks", "Callback Registry", "portal-nav-callbacks", "callbacks")}
        </nav>
      </header>
      <main>${body}</main>
    </div>
  </body>
</html>`;
}

function readRuntimeState(outputDir: string): RuntimeState {
  const statePath = path.join(outputDir, "304_provider_sandbox_runtime_state.json");
  if (!fs.existsSync(statePath)) {
    return { version: "empty", registrations: [] };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8")) as RuntimeState;
}

function readVerificationSummary(outputDir: string): VerificationSummary | null {
  const summaryPath = path.join(outputDir, "304_provider_callback_verification_summary.json");
  if (!fs.existsSync(summaryPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(summaryPath, "utf8")) as VerificationSummary;
}

function toneForState(state: string): "success" | "warn" | "danger" {
  if (state === "current" || state === "verified" || state === "manifest_ready") {
    return "success";
  }
  if (state === "manual_bridge_required" || state === "not_applicable") {
    return "warn";
  }
  return "danger";
}

async function renderSandboxPage(outputDir: string): Promise<string> {
  const registry = await buildProviderSandboxRegistry();
  const callbacks = await buildProviderCallbackManifest();
  const state = readRuntimeState(outputDir);
  const callbackBySandboxId = new Map(callbacks.callbacks.map((callback) => [callback.sandboxId, callback]));

  const cards = registry.sandboxes
    .map((sandbox) => {
      const callback = callbackBySandboxId.get(sandbox.sandboxId);
      const registration = state.registrations.find(
        (entry) =>
          entry.sandboxId === sandbox.sandboxId &&
          entry.providerAdapterBindingHash === sandbox.providerAdapterBindingHash,
      );
      const configuredState = registration
        ? "current"
        : sandbox.portalAutomationState === "fully_automated"
          ? "unconfigured"
          : sandbox.portalAutomationState;
      const automationTone = toneForState(configuredState);
      const portalBanner =
        sandbox.portalAutomationState === "manual_bridge_required"
          ? `<div class="banner" data-testid="manual-bridge-${sandbox.sandboxId}" data-tone="danger"><h3>Manual bridge required</h3><p class="meta">This row is source-controlled and explicit, but real supplier mutation remains outside lawful unattended automation.</p></div>`
          : sandbox.portalAutomationState === "not_applicable"
            ? `<div class="banner" data-testid="manual-bridge-${sandbox.sandboxId}" data-tone="warn"><h3>No supplier portal mutation</h3><p class="meta">This row exists to preserve manual assist routing truth. There is no callback registration form to automate.</p></div>`
            : "";
      const callbackPath = callback?.callbackUrlPath
        ? `<code data-testid="sandbox-callback-path-${sandbox.sandboxId}">${escapeHtml(callback.callbackUrlPath)}</code>`
        : `<span class="meta" data-testid="sandbox-callback-path-${sandbox.sandboxId}">No callback URL</span>`;
      const actions =
        sandbox.portalAutomationState === "fully_automated"
          ? `<div class="actions">
              <form method="post" action="/portal/sandboxes/bootstrap">
                <input type="hidden" name="sandboxId" value="${sandbox.sandboxId}" />
                <button data-testid="sandbox-bootstrap-${sandbox.sandboxId}" data-variant="primary">Converge callback target</button>
              </form>
              <form method="post" action="/portal/sandboxes/reset">
                <input type="hidden" name="sandboxId" value="${sandbox.sandboxId}" />
                <button data-testid="sandbox-reset-${sandbox.sandboxId}">Reset twin state</button>
              </form>
            </div>`
          : `<div class="actions"><button data-testid="sandbox-bootstrap-${sandbox.sandboxId}" disabled>Automation blocked</button></div>`;
      return `<section
          class="card stack"
          data-testid="sandbox-row-${sandbox.sandboxId}"
          data-sandbox-id="${sandbox.sandboxId}"
          data-automation-state="${sandbox.portalAutomationState}"
          data-callback-mode="${sandbox.callbackMode}"
          data-configured-state="${configuredState}"
          data-binding-hash="${sandbox.providerAdapterBindingHash}"
        >
          <div class="grid">
            <div>
              <h2>${escapeHtml(sandbox.supplierLabel)}</h2>
              <div class="meta">${escapeHtml(sandbox.environmentLabel)} · ${escapeHtml(sandbox.integrationMode)} · ${escapeHtml(sandbox.deploymentType)}</div>
            </div>
            <div class="pill-row">
              <span class="pill" data-testid="sandbox-state-${sandbox.sandboxId}" data-tone="${automationTone}">${escapeHtml(configuredState)}</span>
              <span class="pill">${escapeHtml(sandbox.callbackMode)}</span>
              <span class="pill">${escapeHtml(sandbox.smokeMethod)}</span>
            </div>
          </div>
          <table>
            <tbody>
              <tr><th>Binding ref</th><td data-testid="sandbox-binding-ref-${sandbox.sandboxId}"><code>${escapeHtml(sandbox.providerAdapterBindingRef)}</code></td></tr>
              <tr><th>Binding hash</th><td data-testid="sandbox-binding-hash-${sandbox.sandboxId}"><code>${escapeHtml(sandbox.providerAdapterBindingHash)}</code></td></tr>
              <tr><th>Adapter profile</th><td><code>${escapeHtml(sandbox.adapterContractProfileRef)}</code></td></tr>
              <tr><th>Tenant tuple</th><td><code>${escapeHtml(sandbox.tenantId)}</code> · <code>${escapeHtml(sandbox.practiceRef)}</code> · <code>${escapeHtml(sandbox.organisationRef)}</code></td></tr>
              <tr><th>Callback target</th><td>${callbackPath}</td></tr>
              <tr><th>Masked secret proof</th><td data-testid="sandbox-secret-fingerprint-${sandbox.sandboxId}"><code>${escapeHtml(Object.values(sandbox.maskedSecretFingerprints).join(" · "))}</code></td></tr>
            </tbody>
          </table>
          ${portalBanner}
          ${actions}
        </section>`;
    })
    .join("");

  return pageShell(
    "Provider Sandbox Registry",
    `<div class="banner" data-testid="provider-sandbox-portal" data-tone="success">
        <h2>Environment labels are safety rails</h2>
        <p class="meta">Automated mutation is confined to the repo-owned twins. Supported-test and integration candidates remain explicit manual-bridge rows until supplier-approved automation exists.</p>
      </div>
      <div class="stack">${cards}</div>`,
    "sandboxes",
  );
}

async function renderCallbackPage(outputDir: string): Promise<string> {
  const registry = await buildProviderSandboxRegistry();
  const manifest = await buildProviderCallbackManifest();
  const verification = readVerificationSummary(outputDir);
  const sandboxById = new Map(registry.sandboxes.map((sandbox) => [sandbox.sandboxId, sandbox]));
  const verificationByCallbackId = new Map(
    verification?.callbackChecks.map((row) => [row.callbackId, row]) ?? [],
  );

  const rows = manifest.callbacks
    .map((callback) => {
      const sandbox = sandboxById.get(callback.sandboxId)!;
      const summary =
        verificationByCallbackId.get(callback.callbackId) ??
        ({
          callbackId: callback.callbackId,
          sandboxId: callback.sandboxId,
          callbackMode: callback.callbackMode,
          state:
            callback.callbackMode === "authoritative_read_after_write"
              ? "manifest_ready"
              : sandbox.portalAutomationState === "manual_bridge_required"
                ? "manual_bridge_required"
                : callback.callbackMode === "not_supported"
                  ? "not_applicable"
                  : "awaiting_verification",
          receiptDecisionClasses: [],
          verificationMode: callback.verificationMode,
        } satisfies VerificationRow);
      const tone = toneForState(summary.state);
      const decisionMarkup =
        summary.receiptDecisionClasses.length > 0
          ? `<div class="pill-row">${summary.receiptDecisionClasses
              .map(
                (decision) =>
                  `<span class="pill" data-testid="decision-${callback.callbackId}-${decision}" data-tone="success">${escapeHtml(decision)}</span>`,
              )
              .join("")}</div>`
          : `<span class="meta">No replay smoke emitted for this posture.</span>`;
      const note =
        callback.callbackMode === "supplier_callback"
          ? "Edge callback only; never target internal workers directly."
          : callback.callbackMode === "authoritative_read_after_write"
            ? "No supplier callback is claimed; verification is binding and policy alignment."
            : callback.callbackMode === "manual_attestation"
              ? "Manual settlement queue only."
              : "Direct response or later read only.";
      return `<section
          class="card stack"
          data-testid="callback-row-${callback.callbackId}"
          data-callback-id="${callback.callbackId}"
          data-callback-mode="${callback.callbackMode}"
          data-verification-state="${summary.state}"
          data-binding-hash="${callback.providerAdapterBindingHash}"
        >
          <div class="grid">
            <div>
              <h2>${escapeHtml(callback.callbackId)}</h2>
              <div class="meta">${escapeHtml(sandbox.supplierLabel)} · ${escapeHtml(sandbox.environmentLabel)}</div>
            </div>
            <div class="pill-row">
              <span class="pill" data-testid="callback-state-${callback.callbackId}" data-tone="${tone}">${escapeHtml(summary.state)}</span>
              <span class="pill">${escapeHtml(callback.verificationMode)}</span>
              <span class="pill">${escapeHtml(callback.callbackMode)}</span>
            </div>
          </div>
          <table>
            <tbody>
              <tr><th>Callback path</th><td data-testid="callback-path-${callback.callbackId}">${callback.callbackUrlPath ? `<code>${escapeHtml(callback.callbackUrlPath)}</code>` : `<span class="meta">No callback URL</span>`}</td></tr>
              <tr><th>Binding ref</th><td><code>${escapeHtml(callback.providerAdapterBindingRef)}</code></td></tr>
              <tr><th>Binding hash</th><td><code>${escapeHtml(callback.providerAdapterBindingHash)}</code></td></tr>
              <tr><th>Masked fingerprint</th><td>${callback.maskedSecretFingerprint ? `<code>${escapeHtml(callback.maskedSecretFingerprint)}</code>` : `<span class="meta">None</span>`}</td></tr>
              <tr><th>Decision classes</th><td data-testid="callback-decisions-${callback.callbackId}">${decisionMarkup}</td></tr>
            </tbody>
          </table>
          <div class="banner" data-testid="callback-note-${callback.callbackId}">
            <h3>Registration note</h3>
            <p class="meta">${escapeHtml(note)}</p>
          </div>
          <div class="actions">
            <form method="post" action="/portal/callbacks/verify">
              <input type="hidden" name="sandboxId" value="${callback.sandboxId}" />
              <button data-testid="callback-verify-${callback.callbackId}" data-variant="primary">Verify row</button>
            </form>
          </div>
        </section>`;
    })
    .join("");

  return pageShell(
    "Callback Registry",
    `<div class="banner" data-testid="provider-callback-portal" data-tone="success">
        <h2>Replay-safe verification</h2>
        <p class="meta" data-testid="callback-edge-only-note">Callback proof is accepted only when it stays edge-scoped, bound to the current adapter binding, and produces the expected receipt-checkpoint decisions.</p>
      </div>
      <div class="actions">
        <form method="post" action="/portal/callbacks/verify">
          <button data-testid="callback-verify-all" data-variant="primary">Verify all callback rows</button>
        </form>
      </div>
      <div class="stack">${rows}</div>`,
    "callbacks",
  );
}

function renderLoginPage(): string {
  return pageShell(
    "Provider Portal Login",
    `<section class="card login-shell" data-testid="provider-portal-login">
        <h2>Masked operator login</h2>
        <p class="meta">This local portal twin proves the browser-mediated setup flow without exposing raw supplier credentials.</p>
        <form method="post" action="/login" class="stack">
          <label>
            Portal username
            <input data-testid="portal-username" name="username" autocomplete="username" />
          </label>
          <label>
            Portal password
            <input data-testid="portal-password" name="password" type="password" autocomplete="current-password" />
          </label>
          <button data-testid="provider-login-submit" data-variant="primary">Sign in to sandbox control plane</button>
        </form>
      </section>`,
    "login",
  );
}

function parseCookies(cookieHeader: string | undefined): Set<string> {
  return new Set((cookieHeader ?? "").split(";").map((part) => part.trim()).filter(Boolean));
}

function isAuthenticated(request: http.IncomingMessage): boolean {
  return parseCookies(request.headers.cookie).has(SESSION_COOKIE);
}

async function readRequestBody(request: http.IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function redirect(response: http.ServerResponse, location: string, cookie?: string): void {
  response.writeHead(303, {
    Location: location,
    ...(cookie ? { "Set-Cookie": cookie } : {}),
  });
  response.end();
}

function writeHtml(response: http.ServerResponse, html: string): void {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

export function outputPath(name: string): string {
  const outputDir = path.join(ROOT, "output", "playwright");
  fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, name);
}

export function trackExternalRequests(page: any, baseUrl: string, target: Set<string>): void {
  page.on("request", (request: any) => {
    const url = request.url();
    if (!url.startsWith(baseUrl)) {
      target.add(url);
    }
  });
}

export async function startProviderPortalHarness(outputDir = DEFAULT_RUNTIME_DIR): Promise<{
  server: http.Server;
  baseUrl: string;
  outputDir: string;
}> {
  fs.mkdirSync(outputDir, { recursive: true });
  const verificationPath = path.join(outputDir, "304_provider_callback_verification_summary.json");
  if (fs.existsSync(verificationPath)) {
    fs.rmSync(verificationPath);
  }
  await materializeProviderSandboxArtifacts(ROOT);
  await resetProviderSandboxes({ outputDir });

  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    try {
      if (request.method === "GET" && requestUrl.pathname === "/") {
        redirect(response, isAuthenticated(request) ? "/portal/sandboxes" : "/login");
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
        redirect(response, "/portal/sandboxes", SESSION_COOKIE);
        return;
      }
      if (!isAuthenticated(request)) {
        redirect(response, "/login");
        return;
      }
      if (request.method === "GET" && requestUrl.pathname === "/portal/sandboxes") {
        writeHtml(response, await renderSandboxPage(outputDir));
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/portal/sandboxes/bootstrap") {
        const body = await readRequestBody(request);
        const sandboxId = body.get("sandboxId");
        await bootstrapProviderSandboxes({
          outputDir,
          sandboxIds: sandboxId ? [sandboxId] : undefined,
        });
        redirect(response, "/portal/sandboxes");
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/portal/sandboxes/reset") {
        const body = await readRequestBody(request);
        const sandboxId = body.get("sandboxId");
        await resetProviderSandboxes({
          outputDir,
          sandboxIds: sandboxId ? [sandboxId] : undefined,
        });
        const summaryPath = path.join(outputDir, "304_provider_callback_verification_summary.json");
        if (fs.existsSync(summaryPath)) {
          fs.rmSync(summaryPath);
        }
        redirect(response, "/portal/sandboxes");
        return;
      }
      if (request.method === "GET" && requestUrl.pathname === "/portal/callbacks") {
        writeHtml(response, await renderCallbackPage(outputDir));
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/portal/callbacks/verify") {
        const body = await readRequestBody(request);
        const sandboxId = body.get("sandboxId");
        await verifyProviderCallbacks({
          outputDir,
          sandboxIds: sandboxId ? [sandboxId] : undefined,
        });
        redirect(response, "/portal/callbacks");
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
  assertCondition(address && typeof address === "object", "provider portal harness did not bind");

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    outputDir,
  };
}

export async function stopProviderPortalHarness(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function loginToProviderPortal(page: any, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='provider-portal-login']").waitFor();
  await page.getByTestId("portal-username").fill("masked.operator");
  await page.getByTestId("portal-password").fill("masked-password");
  await Promise.all([
    page.waitForURL(/\/portal\/sandboxes$/),
    page.getByTestId("provider-login-submit").click(),
  ]);
}

export {
  assertCondition,
  buildProviderCallbackManifest,
  buildProviderSandboxRegistry,
};
