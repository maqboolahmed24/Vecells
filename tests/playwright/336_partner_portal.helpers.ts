import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URLSearchParams } from "node:url";

import {
  bootstrapPartnerFeeds,
  buildPartnerCredentialManifest,
  buildPartnerFeedRegistry,
  readVerificationSummary,
  resetPartnerFeeds,
} from "../../scripts/capacity/336_partner_feed_lib.ts";
import { runPartnerFeedVerification } from "../../scripts/capacity/336_verify_partner_feed_bindings.ts";

export const ROOT = path.resolve(process.cwd());
export const DEFAULT_RUNTIME_DIR = path.join(
  ROOT,
  "output",
  "playwright",
  "336-partner-feed-portal-state",
);

const SESSION_COOKIE = "partner_capacity_portal_session=active";

interface PartnerFeedRuntimeState {
  version: string;
  feeds: {
    feedId: string;
    adapterBindingHash: string;
    endpointIdentity: string;
    adapterIdentity: string;
    sourceMode: string;
    trustAdmissionState: string;
    configuredAt: string;
  }[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pageShell(title: string, body: string, activePage: "login" | "feeds" | "verification"): string {
  const navLink = (
    href: string,
    label: string,
    testId: string,
    key: "feeds" | "verification",
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
        --bg: #eef6fb;
        --panel: #ffffff;
        --ink: #102233;
        --muted: #516170;
        --line: #d6e2ec;
        --soft: #edf3f8;
        --brand: #0f5b8d;
        --success: #0a7a45;
        --warn: #a75d00;
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #f7fbfe 0%, var(--bg) 100%);
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
        box-shadow: 0 24px 52px rgba(16, 34, 51, 0.08);
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
        border-color: rgba(15, 91, 141, 0.3);
        background: rgba(15, 91, 141, 0.08);
      }
      main {
        padding: 22px 24px;
        display: grid;
        gap: 18px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }
      .card, .banner, .stat {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fcfdff;
        padding: 16px;
      }
      .banner {
        background: #fff8ef;
      }
      .banner[data-tone="success"] { background: #eefaf3; }
      .banner[data-tone="danger"] { background: #fef1f0; }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }
      .stat strong {
        display: block;
        margin-top: 4px;
        font-size: 24px;
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
        background: #fff;
        font-size: 13px;
        font-weight: 600;
      }
      .pill[data-tone="success"] {
        color: var(--success);
        border-color: rgba(10, 122, 69, 0.28);
        background: rgba(10, 122, 69, 0.08);
      }
      .pill[data-tone="warn"] {
        color: var(--warn);
        border-color: rgba(167, 93, 0, 0.28);
        background: rgba(167, 93, 0, 0.08);
      }
      .pill[data-tone="danger"] {
        color: var(--danger);
        border-color: rgba(180, 35, 24, 0.28);
        background: rgba(180, 35, 24, 0.08);
      }
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      form { margin: 0; }
      button {
        cursor: pointer;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: #fff;
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
      .table th, .table td {
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
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="eyebrow">Phase 5 Capacity Control Plane</div>
        <h1>${escapeHtml(title)}</h1>
        <p class="subhead">Deterministic partner-feed and credential setup for 336. The local masked supplier twins are fully convergent; supported-test supplier-admin routes stay explicit as manual bridges.</p>
        <nav>
          ${navLink("/portal/feeds", "Feed Registry", "portal-nav-feeds", "feeds")}
          ${navLink("/portal/verification", "Verification", "portal-nav-verification", "verification")}
        </nav>
      </header>
      <main>${body}</main>
    </div>
  </body>
</html>`;
}

function toneForState(state: string): "success" | "warn" | "danger" {
  if (["verified", "current", "trusted"].includes(state)) {
    return "success";
  }
  if (["manual_bridge_required", "preflight_only", "degraded", "unsupported"].includes(state)) {
    return "warn";
  }
  return "danger";
}

function runtimeStatePath(outputDir: string): string {
  return path.join(outputDir, "336_partner_feed_runtime_state.json");
}

function readRuntimeState(outputDir: string): PartnerFeedRuntimeState {
  const filePath = runtimeStatePath(outputDir);
  if (!fs.existsSync(filePath)) {
    return { version: "empty", feeds: [] };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as PartnerFeedRuntimeState;
}

async function renderFeedPage(outputDir: string): Promise<string> {
  const registry = await buildPartnerFeedRegistry();
  const credentials = await buildPartnerCredentialManifest();
  const runtimeState = readRuntimeState(outputDir);

  const cards = registry.feeds
    .map((feed) => {
      const current = runtimeState.feeds.find(
        (row) =>
          row.feedId === feed.feedId && row.adapterBindingHash === feed.adapterBindingHash,
      );
      const configuredState = current
        ? "current"
        : feed.portalAutomationState === "fully_automated"
          ? "unconfigured"
          : feed.verificationState;
      const fingerprints = credentials.credentials
        .filter((entry) => entry.feedId === feed.feedId)
        .map((entry) => entry.maskedFingerprint)
        .join(" · ");
      const banner =
        feed.portalAutomationState === "manual_bridge_required"
          ? `<div class="banner" data-tone="danger" data-testid="manual-bridge-${feed.feedId}">
              <h3>Manual bridge required</h3>
              <p class="meta">Real supplier-admin enablement remains outside unattended mutation. This row stays manifest-driven until named supported-test evidence is refreshed.</p>
            </div>`
          : feed.trustAdmissionState === "unsupported"
            ? `<div class="banner" data-tone="danger" data-testid="unsupported-${feed.feedId}">
                <h3>Unsupported feed</h3>
                <p class="meta">This row is explicit so unsupported partner supply cannot appear as a surprise runtime path.</p>
              </div>`
            : "";
      const actionBlock =
        feed.portalAutomationState === "fully_automated"
          ? `<div class="actions">
              <form method="post" action="/portal/feeds/bootstrap">
                <input type="hidden" name="feedId" value="${feed.feedId}" />
                <button data-testid="feed-bootstrap-${feed.feedId}" data-variant="primary">Converge local twin</button>
              </form>
            </div>`
          : `<div class="actions"><button data-testid="feed-bootstrap-${feed.feedId}" disabled>Automation blocked</button></div>`;
      return `<section
          class="card"
          data-testid="feed-row-${feed.feedId}"
          data-feed-id="${feed.feedId}"
          data-configured-state="${configuredState}"
        >
          <div class="pill-row">
            <span class="pill" data-tone="${toneForState(configuredState)}">${escapeHtml(configuredState)}</span>
            <span class="pill">${escapeHtml(feed.sourceMode)}</span>
            <span class="pill">${escapeHtml(feed.trustAdmissionState)}</span>
          </div>
          <h2>${escapeHtml(feed.partnerLabel)}</h2>
          <div class="meta">${escapeHtml(feed.environmentLabel)} · ${escapeHtml(feed.siteLabel)} · ${escapeHtml(feed.serviceLabel)}</div>
          <div class="meta">Endpoint: <code>${escapeHtml(feed.endpointIdentity)}</code></div>
          <div class="meta">Adapter: <code>${escapeHtml(feed.adapterIdentity)}</code></div>
          <div class="meta">Binding hash: <code>${escapeHtml(feed.adapterBindingHash.slice(0, 16))}</code></div>
          <div class="meta">Masked credentials: <span data-testid="feed-secret-fingerprint-${feed.feedId}">${escapeHtml(fingerprints)}</span></div>
          ${banner}
          ${actionBlock}
        </section>`;
    })
    .join("");

  const stats = `<section class="stats">
      <div class="stat"><div class="meta">Declared feeds</div><strong>${registry.feeds.length}</strong></div>
      <div class="stat"><div class="meta">Current local bindings</div><strong>${runtimeState.feeds.length}</strong></div>
      <div class="stat"><div class="meta">Manual bridge feeds</div><strong>${registry.feeds.filter((feed) => feed.portalAutomationState === "manual_bridge_required").length}</strong></div>
    </section>`;

  return pageShell(
    "Partner feed registry",
    `<section class="banner">
        <h2>Manifest first</h2>
        <p class="meta">Portal state never becomes the source of truth. The registry, credential manifest, and site/service map remain authoritative for every partner row.</p>
      </section>
      ${stats}
      <section class="grid">${cards}</section>`,
    "feeds",
  );
}

async function renderVerificationPage(outputDir: string): Promise<string> {
  const registry = await buildPartnerFeedRegistry();
  const summary = await readVerificationSummary(outputDir);

  const rows = registry.feeds
    .map((feed) => {
      const check = summary?.feedChecks.find((entry) => entry.feedId === feed.feedId);
      const state = check?.verificationState ?? feed.verificationState;
      const decisions = check?.decisionClasses.join(" · ") ?? "not_run";
      return `<tr data-testid="verification-row-${feed.feedId}" data-verification-state="${state}">
          <td>${escapeHtml(feed.partnerLabel)}</td>
          <td><span class="pill" data-tone="${toneForState(state)}">${escapeHtml(state)}</span></td>
          <td>${escapeHtml(feed.trustAdmissionState)}</td>
          <td data-testid="verification-decisions-${feed.feedId}">${escapeHtml(decisions)}</td>
        </tr>`;
    })
    .join("");

  return pageShell(
    "Partner feed verification",
    `<section class="banner" data-tone="success">
        <h2>Smoke verification</h2>
        <p class="meta">The run button rebuilds the 318 candidate snapshot from the manifest-driven bindings and preserves manual bridge and unsupported posture as explicit rows.</p>
      </section>
      <div class="actions">
        <form method="post" action="/portal/verification/run">
          <button data-testid="verification-run-all" data-variant="primary">Run verification</button>
        </form>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Feed</th>
            <th>State</th>
            <th>Trust</th>
            <th>Decision classes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`,
    "verification",
  );
}

function renderLoginPage(errorMessage?: string): string {
  const error = errorMessage
    ? `<div class="banner" data-tone="danger"><h2>Sign in blocked</h2><p class="meta">${escapeHtml(errorMessage)}</p></div>`
    : "";
  return pageShell(
    "Partner capacity admin",
    `<div class="login-shell">
        ${error}
        <section class="card">
          <h2>Masked operator sign-in</h2>
          <p class="meta">The local twin uses a fixture-only sign-in so no supplier credentials are written into screenshots or traces.</p>
          <form method="post" action="/login" class="login-shell">
            <label>Email
              <input name="email" type="email" autocomplete="off" />
            </label>
            <label>Password
              <input name="password" type="password" autocomplete="off" />
            </label>
            <button type="submit" data-testid="partner-portal-login-submit" data-variant="primary">Sign in</button>
          </form>
        </section>
      </div>`,
    "login",
  );
}

function isAuthenticated(req: http.IncomingMessage): boolean {
  return req.headers.cookie?.includes(SESSION_COOKIE) ?? false;
}

function collectBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function routeRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  outputDir: string,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const pathname = url.pathname;

  if (pathname === "/" || pathname === "/login") {
    if (req.method === "POST") {
      const body = new URLSearchParams(await collectBody(req));
      if (
        body.get("email")?.includes("@") &&
        body.get("password")?.trim() === "masked-fixture"
      ) {
        res.statusCode = 302;
        res.setHeader("Set-Cookie", `${SESSION_COOKIE}; Path=/; HttpOnly`);
        res.setHeader("Location", "/portal/feeds");
        res.end();
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(renderLoginPage("Use any email address with the password masked-fixture."));
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(renderLoginPage());
    return;
  }

  if (!isAuthenticated(req)) {
    res.statusCode = 302;
    res.setHeader("Location", "/login");
    res.end();
    return;
  }

  if (pathname === "/portal/feeds") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(await renderFeedPage(outputDir));
    return;
  }

  if (pathname === "/portal/feeds/bootstrap" && req.method === "POST") {
    const body = new URLSearchParams(await collectBody(req));
    const feedId = body.get("feedId");
    await bootstrapPartnerFeeds({
      outputDir,
      feedIds: feedId ? [feedId] : undefined,
    });
    res.statusCode = 302;
    res.setHeader("Location", "/portal/feeds");
    res.end();
    return;
  }

  if (pathname === "/portal/verification") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(await renderVerificationPage(outputDir));
    return;
  }

  if (pathname === "/portal/verification/run" && req.method === "POST") {
    await runPartnerFeedVerification(outputDir);
    res.statusCode = 302;
    res.setHeader("Location", "/portal/verification");
    res.end();
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("not found");
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
  const filePath = path.join(ROOT, "output", "playwright", name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return filePath;
}

export function trackExternalRequests(page: any, baseUrl: string, target: Set<string>): void {
  page.on("request", (request: any) => {
    const requestUrl = request.url();
    if (!requestUrl.startsWith(baseUrl)) {
      target.add(requestUrl);
    }
  });
}

export async function startPartnerPortalHarness(
  outputDir = DEFAULT_RUNTIME_DIR,
): Promise<{
  server: http.Server;
  baseUrl: string;
}> {
  await resetPartnerFeeds({ outputDir });
  const server = http.createServer((req, res) => {
    routeRequest(req, res, outputDir).catch((error) => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(String(error));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  assertCondition(address && typeof address === "object", "partner portal harness did not bind");
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

export async function stopPartnerPortalHarness(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export async function loginToPartnerPortal(page: any, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email").fill("ops@example.test");
  await page.getByLabel("Password").fill("masked-fixture");
  await page.getByTestId("partner-portal-login-submit").click();
  await page.waitForURL(/\/portal\/feeds$/);
}
