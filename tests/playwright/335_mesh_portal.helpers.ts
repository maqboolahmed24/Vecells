import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URLSearchParams } from "node:url";

import {
  bootstrapMeshMailboxes,
  buildMeshMailboxRegistry,
  buildMeshRouteManifest,
  materializeMeshTrackedArtifacts,
  resetMeshMailboxes,
  seedNonProdRouteChecks,
  verifyMeshRoutes,
} from "../../scripts/messaging/335_mesh_mailbox_lib.ts";

export const ROOT = path.resolve(process.cwd());
export const DEFAULT_RUNTIME_DIR = path.join(
  ROOT,
  "output",
  "playwright",
  "335-mesh-portal-state",
);

const SESSION_COOKIE = "mesh_portal_session=active";

interface RuntimeMailboxStateRow {
  mailboxId: string;
  mailboxBindingHash: string;
  environmentId: string;
  mailboxAlias: string;
  adapterIdentity: string;
  configuredAt: string;
  maskedSecretFingerprint: string | null;
  maskedCertificateFingerprint: string | null;
}

interface MeshRuntimeState {
  version: string;
  mailboxes: RuntimeMailboxStateRow[];
}

interface RouteCheckRow {
  routeId: string;
  routePurpose: string;
  environmentId: string;
  verificationMode: string;
  state: string;
  routeCorrelationKey: string;
  dispatchDecisionClasses: string[];
  businessGuardrailVerified: boolean;
}

interface RouteVerificationSummary {
  taskId: string;
  verificationAt: string;
  routeChecks: RouteCheckRow[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pageShell(
  title: string,
  body: string,
  activePage: "login" | "mailboxes" | "routes",
): string {
  const navLink = (
    href: string,
    label: string,
    testId: string,
    key: "mailboxes" | "routes",
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
        --bg: #eef4f7;
        --panel: #ffffff;
        --ink: #0f1720;
        --muted: #4b5563;
        --line: #d0d7e2;
        --soft: #e9eef5;
        --brand: #005a8d;
        --success: #0d8b57;
        --warn: #a85f00;
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background: radial-gradient(circle at top, #f5fbff 0%, var(--bg) 52%, #e7eff4 100%);
        color: var(--ink);
      }
      .shell {
        width: min(1500px, calc(100vw - 28px));
        margin: 20px auto 36px;
        display: grid;
        gap: 18px;
      }
      header, main {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: 0 22px 48px rgba(15, 23, 32, 0.08);
      }
      header {
        padding: 22px 24px;
        display: grid;
        gap: 14px;
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
        max-width: 920px;
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
        border: 1px solid var(--line);
        border-radius: 999px;
        background: #fbfdff;
        text-decoration: none;
        color: var(--ink);
        font-weight: 600;
      }
      nav a[data-active="true"] {
        color: var(--brand);
        border-color: rgba(0, 90, 141, 0.3);
        background: rgba(0, 90, 141, 0.08);
      }
      main {
        padding: 22px 24px;
        display: grid;
        gap: 18px;
      }
      .stack {
        display: grid;
        gap: 16px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }
      .card, .banner {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fcfdff;
        padding: 16px;
      }
      .banner {
        background: #fff8ee;
      }
      .banner[data-tone="success"] {
        background: #eefaf4;
      }
      .banner[data-tone="danger"] {
        background: #fef1f0;
      }
      .card h2, .card h3, .banner h2, .banner h3 {
        margin: 0 0 8px;
      }
      .meta {
        font-size: 13px;
        color: var(--muted);
        line-height: 1.5;
      }
      .pill-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: white;
        font-size: 13px;
        font-weight: 600;
      }
      .pill[data-tone="success"] {
        color: var(--success);
        border-color: rgba(13, 139, 87, 0.28);
        background: rgba(13, 139, 87, 0.08);
      }
      .pill[data-tone="warn"] {
        color: var(--warn);
        border-color: rgba(168, 95, 0, 0.28);
        background: rgba(168, 95, 0, 0.08);
      }
      .pill[data-tone="danger"] {
        color: var(--danger);
        border-color: rgba(180, 35, 24, 0.28);
        background: rgba(180, 35, 24, 0.08);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }
      .stat {
        border: 1px solid var(--soft);
        border-radius: 16px;
        padding: 14px;
        background: linear-gradient(180deg, #ffffff 0%, #f6fbff 100%);
      }
      .stat strong {
        display: block;
        font-size: 24px;
        margin-top: 4px;
      }
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      form {
        margin: 0;
      }
      button {
        cursor: pointer;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: white;
        color: var(--ink);
        font: inherit;
        font-weight: 600;
      }
      button[data-variant="primary"] {
        background: var(--brand);
        border-color: var(--brand);
        color: white;
      }
      button[disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
      }
      .table th,
      .table td {
        padding: 12px 10px;
        border-bottom: 1px solid var(--soft);
        vertical-align: top;
        text-align: left;
      }
      .table th {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      code {
        font-size: 12px;
        background: #f3f7fb;
        padding: 2px 6px;
        border-radius: 6px;
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
      @media (max-width: 880px) {
        .shell {
          width: min(100vw - 16px, 1500px);
          margin: 12px auto 24px;
        }
        header, main {
          padding-left: 16px;
          padding-right: 16px;
        }
        .table,
        .table thead,
        .table tbody,
        .table tr,
        .table th,
        .table td {
          display: block;
        }
        .table tr {
          border-bottom: 1px solid var(--soft);
          padding: 8px 0;
        }
        .table th {
          padding-bottom: 4px;
        }
        .table td {
          padding-top: 4px;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="eyebrow">Phase 5 MESH Control Plane</div>
        <h1>${escapeHtml(title)}</h1>
        <p class="subhead">Deterministic non-production mailbox and route setup for 335. Automated rows run only against the local masked twin; NHS-managed Path to Live rows stay explicit and manual-bridge bound.</p>
        <nav>
          ${navLink("/portal/mailboxes", "Mailbox Registry", "portal-nav-mailboxes", "mailboxes")}
          ${navLink("/portal/routes", "Route Verification", "portal-nav-routes", "routes")}
        </nav>
      </header>
      <main>${body}</main>
    </div>
  </body>
</html>`;
}

function toneForState(state: string): "success" | "warn" | "danger" {
  if (["current", "verified", "manifest_ready"].includes(state)) {
    return "success";
  }
  if (
    ["manual_bridge_required", "not_required", "pre_mailbox_rehearsal_only"].includes(
      state,
    )
  ) {
    return "warn";
  }
  return "danger";
}

function readRuntimeState(outputDir: string): MeshRuntimeState {
  const statePath = path.join(outputDir, "335_mesh_mailbox_runtime_state.json");
  if (!fs.existsSync(statePath)) {
    return { version: "empty", mailboxes: [] };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8")) as MeshRuntimeState;
}

function readRouteSummary(outputDir: string): RouteVerificationSummary | null {
  const summaryPath = path.join(outputDir, "335_mesh_route_verification_summary.json");
  if (!fs.existsSync(summaryPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(summaryPath, "utf8")) as RouteVerificationSummary;
}

function readRouteSeedSummary(outputDir: string): { seeds: { routeId: string }[] } | null {
  const seedPath = path.join(outputDir, "335_mesh_nonprod_route_check_seed.json");
  if (!fs.existsSync(seedPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(seedPath, "utf8")) as { seeds: { routeId: string }[] };
}

async function renderMailboxPage(outputDir: string): Promise<string> {
  const registry = await buildMeshMailboxRegistry();
  const state = readRuntimeState(outputDir);
  const manualBridgeCount = registry.mailboxes.filter(
    (mailbox) => mailbox.portalAutomationState === "manual_bridge_required",
  ).length;
  const configuredCount = registry.mailboxes.filter((mailbox) =>
    state.mailboxes.some(
      (row) =>
        row.mailboxId === mailbox.mailboxId &&
        row.mailboxBindingHash === mailbox.mailboxBindingHash,
    ),
  ).length;

  const cards = registry.mailboxes
    .map((mailbox) => {
      const current = state.mailboxes.find(
        (row) =>
          row.mailboxId === mailbox.mailboxId &&
          row.mailboxBindingHash === mailbox.mailboxBindingHash,
      );
      const configuredState = current
        ? "current"
        : mailbox.portalAutomationState === "fully_automated"
          ? "unconfigured"
          : mailbox.portalAutomationState;
      const actionBlock =
        mailbox.portalAutomationState === "fully_automated"
          ? `<div class="actions">
              <form method="post" action="/portal/mailboxes/bootstrap">
                <input type="hidden" name="mailboxId" value="${mailbox.mailboxId}" />
                <button data-testid="mailbox-bootstrap-${mailbox.mailboxId}" data-variant="primary">Converge mailbox binding</button>
              </form>
            </div>`
          : `<div class="actions"><button data-testid="mailbox-bootstrap-${mailbox.mailboxId}" disabled>Automation blocked</button></div>`;
      const manualBanner =
        mailbox.portalAutomationState === "manual_bridge_required"
          ? `<div class="banner" data-tone="danger" data-testid="manual-bridge-${mailbox.mailboxId}">
              <h3>Manual bridge required</h3>
              <p class="meta">This row is source-controlled, but lawful execution still depends on mailbox-admin approval, current workflow mapping, and in some cases smartcard or HSCN-gated access.</p>
            </div>`
          : "";
      return `<section
          class="card stack"
          data-testid="mailbox-row-${mailbox.mailboxId}"
          data-mailbox-id="${mailbox.mailboxId}"
          data-configured-state="${configuredState}"
          data-binding-hash="${mailbox.mailboxBindingHash}"
        >
          <div class="grid">
            <div>
              <h2>${escapeHtml(mailbox.mailboxAlias)}</h2>
              <div class="meta">${escapeHtml(mailbox.organisationLabel)} · ${escapeHtml(mailbox.environmentLabel)} · ${escapeHtml(mailbox.mailboxDirection)}</div>
            </div>
            <div class="pill-row">
              <span class="pill" data-testid="mailbox-state-${mailbox.mailboxId}" data-tone="${toneForState(configuredState)}">${escapeHtml(configuredState)}</span>
              <span class="pill">${escapeHtml(mailbox.workflowGroup)}</span>
              <span class="pill">${escapeHtml(mailbox.endpointLookupMode)}</span>
            </div>
          </div>
          <div class="meta">Route purpose: <code>${escapeHtml(mailbox.routePurpose)}</code></div>
          <div class="meta">Adapter identity: <code>${escapeHtml(mailbox.adapterIdentity)}</code></div>
          <div class="meta">Binding hash: <code>${escapeHtml(mailbox.mailboxBindingHash.slice(0, 16))}</code></div>
          <div class="pill-row">
            ${mailbox.workflowIds
              .map((workflowId) => `<span class="pill">${escapeHtml(workflowId)}</span>`)
              .join("")}
          </div>
          <div class="grid">
            <div>
              <h3>Masked secret evidence</h3>
              <div class="meta" data-testid="mailbox-secret-fingerprint-${mailbox.mailboxId}">${escapeHtml(
                Object.values(mailbox.maskedSecretFingerprints).join(" · "),
              )}</div>
            </div>
            <div>
              <h3>Masked certificate evidence</h3>
              <div class="meta" data-testid="mailbox-certificate-fingerprint-${mailbox.mailboxId}">${escapeHtml(
                Object.values(mailbox.maskedCertificateFingerprints).join(" · "),
              )}</div>
            </div>
          </div>
          ${manualBanner}
          ${actionBlock}
        </section>`;
    })
    .join("");

  const stats = `<section class="stats">
      <div class="stat"><div class="meta">Manifest mailboxes</div><strong>${registry.mailboxes.length}</strong></div>
      <div class="stat"><div class="meta">Configured automated rows</div><strong>${configuredCount}</strong></div>
      <div class="stat"><div class="meta">Manual bridge rows</div><strong>${manualBridgeCount}</strong></div>
    </section>`;

  return pageShell(
    "MESH mailbox registry",
    `<section class="banner" data-tone="warn">
        <h2>Control-plane law</h2>
        <p class="meta">Only the local twin is auto-converged. Path to Live deployment remains explicit and manual because the NHS-managed mailbox-admin surfaces are outside lawful unattended mutation.</p>
      </section>
      ${stats}
      <section class="grid">${cards}</section>`,
    "mailboxes",
  );
}

async function renderRoutePage(outputDir: string): Promise<string> {
  const manifest = await buildMeshRouteManifest();
  const summary = readRouteSummary(outputDir);
  const seeds = readRouteSeedSummary(outputDir);
  const checkByRouteId = new Map(
    (summary?.routeChecks ?? []).map((check) => [check.routeId, check]),
  );
  const seededRoutes = new Set((seeds?.seeds ?? []).map((seed) => seed.routeId));

  const rows = manifest.routes
    .map((route) => {
      const check = checkByRouteId.get(route.routeId);
      const state = check?.state ?? route.verificationState;
      const decisions = check?.dispatchDecisionClasses ?? [];
      const correlation = check?.routeCorrelationKey ?? "corr:not_verified";
      const seeded = seededRoutes.has(route.routeId);
      const banner =
        route.verificationMode === "manual_bridge_required"
          ? `<div class="banner" data-tone="danger" data-testid="manual-bridge-${route.routeId}">
              <h3>Manual bridge route</h3>
              <p class="meta">This route exists in the manifest and contract now, but NHS-managed portal proof still requires a manual bridge.</p>
            </div>`
          : seeded
            ? `<div class="banner" data-tone="success"><h3>Seeded non-production checks ready</h3><p class="meta">Safe route fixtures are present for send, receive, retry, and duplicate verification.</p></div>`
            : "";
      return `<section
          class="card stack"
          data-testid="route-row-${route.routeId}"
          data-route-id="${route.routeId}"
          data-verification-state="${state}"
        >
          <div class="grid">
            <div>
              <h2>${escapeHtml(route.routePurpose)}</h2>
              <div class="meta">${escapeHtml(route.environmentLabel)} · ${escapeHtml(route.workflowGroup)} / ${escapeHtml(route.workflowId)}</div>
            </div>
            <div class="pill-row">
              <span class="pill" data-testid="route-state-${route.routeId}" data-tone="${toneForState(state)}">${escapeHtml(state)}</span>
              <span class="pill">${escapeHtml(route.routeFamilyRef)}</span>
              <span class="pill">${escapeHtml(route.verificationMode)}</span>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Destination</th>
                <th>Correlation</th>
                <th>Guardrail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>${escapeHtml(route.sourceMailboxAlias)}</code></td>
                <td><code>${escapeHtml(route.destinationMailboxAlias)}</code></td>
                <td data-testid="route-correlation-${route.routeId}"><code>${escapeHtml(correlation)}</code></td>
                <td class="meta">${escapeHtml(route.businessGuardrail)}</td>
              </tr>
            </tbody>
          </table>
          <div class="meta">Authoritative proof: ${escapeHtml(route.authoritativeBusinessProof)}</div>
          <div class="pill-row" data-testid="route-decisions-${route.routeId}">
            ${decisions.length === 0
              ? `<span class="meta">No automated decision classes recorded</span>`
              : decisions
                  .map((decision) => `<span class="pill">${escapeHtml(decision)}</span>`)
                  .join("")}
          </div>
          ${banner}
        </section>`;
    })
    .join("");

  return pageShell(
    "MESH route verification",
    `<section class="banner" data-tone="warn">
        <h2>Route verification discipline</h2>
        <p class="meta">Transport acceptance, duplicate suppression, and stale checkpoint rejection are verified separately from generation-bound practice acknowledgement. Automated proof is limited to the local twin.</p>
      </section>
      <section class="actions">
        <form method="post" action="/portal/routes/seed">
          <button data-testid="route-seed-all">Seed non-production route checks</button>
        </form>
        <form method="post" action="/portal/routes/verify">
          <button data-testid="route-verify-all" data-variant="primary">Verify all routes</button>
        </form>
      </section>
      <section class="grid">${rows}</section>`,
    "routes",
  );
}

function renderLoginPage(): string {
  return pageShell(
    "MESH portal login",
    `<section class="login-shell" data-testid="mesh-portal-login">
        <div class="banner" data-tone="warn">
          <h2>Masked test account only</h2>
          <p class="meta">This local control-plane twin never stores or displays live NHS credentials, mailbox IDs, certificate bodies, or raw secret references.</p>
        </div>
        <form method="post" action="/login" class="stack">
          <label>Username<input data-testid="portal-username" type="text" name="username" autocomplete="off" /></label>
          <label>Password<input data-testid="portal-password" type="password" name="password" autocomplete="off" /></label>
          <button data-testid="mesh-login-submit" data-variant="primary" type="submit">Open portal twin</button>
        </form>
      </section>`,
    "login",
  );
}

async function readRequestBody(request: http.IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function redirect(response: http.ServerResponse, location: string, cookie?: string): void {
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

function isAuthenticated(request: http.IncomingMessage): boolean {
  return (request.headers.cookie ?? "").includes(SESSION_COOKIE);
}

export function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function importPlaywright() {
  return import("playwright");
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

export async function startMeshPortalHarness(outputDir = DEFAULT_RUNTIME_DIR): Promise<{
  server: http.Server;
  baseUrl: string;
  outputDir: string;
}> {
  fs.mkdirSync(outputDir, { recursive: true });
  const verificationPath = path.join(outputDir, "335_mesh_route_verification_summary.json");
  const seedPath = path.join(outputDir, "335_mesh_nonprod_route_check_seed.json");
  for (const filePath of [verificationPath, seedPath]) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath);
    }
  }
  await materializeMeshTrackedArtifacts(ROOT);
  await resetMeshMailboxes({ outputDir });

  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    try {
      if (request.method === "GET" && requestUrl.pathname === "/") {
        redirect(response, isAuthenticated(request) ? "/portal/mailboxes" : "/login");
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
        redirect(response, "/portal/mailboxes", SESSION_COOKIE);
        return;
      }
      if (!isAuthenticated(request)) {
        redirect(response, "/login");
        return;
      }
      if (request.method === "GET" && requestUrl.pathname === "/portal/mailboxes") {
        writeHtml(response, await renderMailboxPage(outputDir));
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/portal/mailboxes/bootstrap") {
        const body = await readRequestBody(request);
        const mailboxId = body.get("mailboxId");
        await bootstrapMeshMailboxes({
          outputDir,
          mailboxIds: mailboxId ? [mailboxId] : undefined,
        });
        redirect(response, "/portal/mailboxes");
        return;
      }
      if (request.method === "GET" && requestUrl.pathname === "/portal/routes") {
        writeHtml(response, await renderRoutePage(outputDir));
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/portal/routes/seed") {
        await seedNonProdRouteChecks(outputDir);
        redirect(response, "/portal/routes");
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/portal/routes/verify") {
        await verifyMeshRoutes({ outputDir });
        redirect(response, "/portal/routes");
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
  assertCondition(address && typeof address === "object", "mesh portal harness did not bind");

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    outputDir,
  };
}

export async function stopMeshPortalHarness(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function loginToMeshPortal(page: any, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='mesh-portal-login']").waitFor();
  await page.getByTestId("portal-username").fill("masked.mesh.operator");
  await page.getByTestId("portal-password").fill("masked-password");
  await Promise.all([
    page.waitForURL(/\/portal\/mailboxes$/),
    page.getByTestId("mesh-login-submit").click(),
  ]);
}
