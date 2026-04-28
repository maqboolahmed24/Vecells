import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URL, URLSearchParams } from "node:url";

import {
  bootstrapDirectoryAndDispatchCredentials,
  buildDirectorySourceManifest,
  buildDispatchProviderBindingManifest,
  buildSecretReferenceManifest,
  buildMaskedFingerprint,
  readAndValidateDirectoryDispatchControlPlane,
  resetDirectoryAndDispatchRuntime,
  verifyDirectoryAndDispatchReadiness,
  type DirectoryDispatchEnvironmentId,
  type DirectoryDispatchReadinessSummary,
  type DirectorySourceEntry,
  type DispatchProviderBindingEntry,
  type NonProdEnvironmentProfile,
} from "../../scripts/pharmacy/366_directory_dispatch_credentials_lib.ts";
import { assertSecretSafeText } from "./366_redaction_helpers.ts";

export const ROOT = path.resolve(process.cwd());
export const DEFAULT_RUNTIME_DIR = path.join(
  ROOT,
  "output",
  "playwright",
  "366-credential-portal-state",
);

const SESSION_COOKIE = "pharmacy_directory_dispatch_portal=active";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function assertCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This harness needs the `playwright` package when run with --run.");
  }
}

export function outputPath(fileName: string): string {
  const resolved = path.join(ROOT, "output", "playwright", fileName);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}

export function trackExternalRequests(
  page: { on: (event: "request", listener: (request: { url(): string }) => void) => void },
  baseUrl: string,
  bucket: Set<string>,
): void {
  page.on("request", (request) => {
    if (!request.url().startsWith(baseUrl)) {
      bucket.add(request.url());
    }
  });
}

function pageShell(
  title: string,
  body: string,
  activePage: "login" | "directory" | "dispatch" | "verification",
): string {
  const navLink = (
    href: string,
    label: string,
    testId: string,
    key: "directory" | "dispatch" | "verification",
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
        --bg: #eef5f8;
        --panel: #ffffff;
        --ink: #0f2133;
        --muted: #4d6275;
        --line: #d7e2ec;
        --brand: #0b5d8c;
        --success: #0a7d4c;
        --warn: #9a5d00;
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        color: var(--ink);
        background: linear-gradient(180deg, #f8fbfe 0%, var(--bg) 100%);
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
        box-shadow: 0 24px 52px rgba(15, 33, 51, 0.08);
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
        max-width: 940px;
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
        border-color: rgba(11, 93, 140, 0.3);
        background: rgba(11, 93, 140, 0.08);
      }
      main {
        padding: 22px 24px;
        display: grid;
        gap: 18px;
      }
      .banner {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fff8ef;
        padding: 16px;
      }
      .banner[data-tone="success"] { background: #eefaf3; }
      .banner[data-tone="danger"] { background: #fef1f0; }
      .banner[data-tone="info"] { background: #f4f9fc; }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }
      .stat {
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #fcfdff;
        padding: 14px;
      }
      .stat strong {
        display: block;
        margin-top: 4px;
        font-size: 24px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
      }
      .table th, .table td {
        padding: 12px 10px;
        border-bottom: 1px solid #edf2f6;
        vertical-align: top;
        text-align: left;
      }
      .table th {
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
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
        border-color: rgba(10, 125, 76, 0.28);
        background: rgba(10, 125, 76, 0.08);
      }
      .pill[data-tone="warn"] {
        color: var(--warn);
        border-color: rgba(154, 93, 0, 0.28);
        background: rgba(154, 93, 0, 0.08);
      }
      .pill[data-tone="danger"] {
        color: var(--danger);
        border-color: rgba(180, 35, 24, 0.28);
        background: rgba(180, 35, 24, 0.08);
      }
      code {
        font-size: 12px;
        background: #f1f6fa;
        padding: 2px 6px;
        border-radius: 6px;
      }
      .meta {
        font-size: 13px;
        color: var(--muted);
        line-height: 1.5;
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
      .login-shell {
        max-width: 420px;
        display: grid;
        gap: 14px;
      }
      label {
        display: grid;
        gap: 6px;
        font-weight: 600;
      }
      input {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px 14px;
        font: inherit;
      }
      @media (max-width: 820px) {
        .shell {
          width: min(100vw - 20px, 100%);
          margin: 12px auto 24px;
        }
        header, main {
          border-radius: 18px;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div>
          <p class="eyebrow">Pharmacy control plane</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="subhead">
            Non-production directory and dispatch-provider credential setup stays manifest-owned,
            secret-safe, and environment-specific. Browser automation can rehearse approved setup
            flows without letting secret locators become the real source of truth.
          </p>
        </div>
        <nav>
          ${navLink("/portal/directory", "Directory sources", "nav-directory", "directory")}
          ${navLink("/portal/dispatch", "Dispatch bindings", "nav-dispatch", "dispatch")}
          ${navLink("/portal/verification", "Verification", "nav-verification", "verification")}
        </nav>
      </header>
      <main>${body}</main>
    </div>
  </body>
</html>`;
}

function cookieAuthorized(request: http.IncomingMessage): boolean {
  return request.headers.cookie?.includes(SESSION_COOKIE) ?? false;
}

function redirect(res: http.ServerResponse, location: string): void {
  res.writeHead(302, { Location: location });
  res.end();
}

function renderModePills(profile: NonProdEnvironmentProfile): string {
  return `<div class="pill-row">
    <span class="pill" data-tone="${profile.automationState === "fully_automated" ? "success" : "warn"}">${profile.environmentId}</span>
    <span class="pill">${profile.loginStrategy}</span>
    <span class="pill">${profile.evidenceCaptureMode}</span>
  </div>`;
}

function rowStateTone(state: string): "success" | "warn" | "danger" {
  if (state === "current" || state === "verified") {
    return "success";
  }
  if (state === "manual_bridge_required" || state === "preflight_only") {
    return "warn";
  }
  return "danger";
}

async function renderDirectoryPage(outputDir: string): Promise<string> {
  const { directoryManifest, secretManifest } =
    await readAndValidateDirectoryDispatchControlPlane();
  const runtimePath = path.join(outputDir, "366_directory_dispatch_runtime_state.json");
  const runtime = fs.existsSync(runtimePath)
    ? JSON.parse(fs.readFileSync(runtimePath, "utf8")) as {
        directorySources: { sourceId: string; capabilityTupleHash: string }[];
      }
    : { directorySources: [] };

  const rows = directoryManifest.sources
    .map((source) => {
      const configured =
        runtime.directorySources.find((row) => row.sourceId === source.sourceId)
          ?.capabilityTupleHash === source.capabilityTupleHash;
      const configuredState =
        source.portalAutomationState === "manual_bridge_required"
          ? "manual_bridge_required"
          : source.verificationState === "preflight_only"
            ? "preflight_only"
            : configured
              ? "current"
              : "manifest_ready";
      const secretPreview = source.secretRefIds
        .map((secretRefId) => {
          const secret = secretManifest.secrets.find(
            (entry) => entry.secretRefId === secretRefId,
          );
          return secret?.maskedFingerprint ?? buildMaskedFingerprint(secretRefId);
        })
        .join(" | ");
      return `<tr data-testid="directory-row-${source.sourceId}" data-configured-state="${configuredState}">
        <td>
          <strong>${escapeHtml(source.providerLabel)}</strong><br />
          <span class="meta">${escapeHtml(source.odsCode)} · ${escapeHtml(source.serviceCode)}</span>
        </td>
        <td>
          ${renderModePills(directoryManifest.environmentProfiles.find((profile) => profile.environmentId === source.environmentId)!)}
          <div class="pill-row" style="margin-top:8px">
            <span class="pill">${escapeHtml(source.directorySourceMode)}</span>
            <span class="pill">${escapeHtml(source.strategicRouteClass)}</span>
            <span class="pill" data-tone="${rowStateTone(configuredState)}">${escapeHtml(configuredState)}</span>
          </div>
        </td>
        <td>
          <div class="meta">Capability tuple</div>
          <code>${escapeHtml(source.capabilityTupleHash)}</code>
          <div class="meta" data-testid="directory-fingerprint-${source.sourceId}" style="margin-top:8px">${escapeHtml(secretPreview)}</div>
        </td>
        <td>
          <div class="meta">${escapeHtml(source.capabilityEvidenceRefs.join(" · "))}</div>
          <div class="actions" style="margin-top:10px">
            <form method="POST" action="/action/configure-directory">
              <input type="hidden" name="sourceId" value="${escapeHtml(source.sourceId)}" />
              <button
                type="submit"
                data-testid="configure-directory-${source.sourceId}"
                data-variant="primary"
                ${source.portalAutomationState === "fully_automated" ? "" : "disabled"}
              >
                ${source.portalAutomationState === "fully_automated" ? "Configure local twin" : "Manual bridge required"}
              </button>
            </form>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  const body = `
    <section class="banner" data-tone="info">
      <h2>Directory source posture</h2>
      <p class="meta">
        Strategic discovery stays on DoHS or local override. Legacy EPS DoS rows remain explicit
        bounded compatibility and never become the unattended default.
      </p>
    </section>
    <table class="table" data-testid="directory-table">
      <thead>
        <tr>
          <th>Provider</th>
          <th>Environment and posture</th>
          <th>Tuple and masked secret evidence</th>
          <th>Evidence and setup</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  await assertSecretSafeText(body, "Directory page render");
  return pageShell("Directory source configuration", body, "directory");
}

async function renderDispatchPage(outputDir: string): Promise<string> {
  const { dispatchManifest, secretManifest } =
    await readAndValidateDirectoryDispatchControlPlane();
  const runtimePath = path.join(outputDir, "366_directory_dispatch_runtime_state.json");
  const runtime = fs.existsSync(runtimePath)
    ? JSON.parse(fs.readFileSync(runtimePath, "utf8")) as {
        dispatchBindings: { bindingId: string; dispatchBindingHash: string }[];
      }
    : { dispatchBindings: [] };

  const rows = dispatchManifest.bindings
    .map((binding) => {
      const configured =
        runtime.dispatchBindings.find((row) => row.bindingId === binding.bindingId)
          ?.dispatchBindingHash === binding.dispatchBindingHash;
      const configuredState =
        binding.portalAutomationState === "manual_bridge_required"
          ? "manual_bridge_required"
          : binding.verificationState === "preflight_only"
            ? "preflight_only"
            : configured
              ? "current"
              : "manifest_ready";
      const secretPreview =
        binding.secretRefIds.length === 0
          ? "no application secret required"
          : binding.secretRefIds
              .map((secretRefId) => {
                const secret = secretManifest.secrets.find(
                  (entry) => entry.secretRefId === secretRefId,
                );
                return secret?.maskedFingerprint ?? buildMaskedFingerprint(secretRefId);
              })
              .join(" | ");
      return `<tr data-testid="dispatch-row-${binding.bindingId}" data-configured-state="${configuredState}">
        <td>
          <strong>${escapeHtml(binding.providerLabel)}</strong><br />
          <span class="meta">${escapeHtml(binding.odsCode)} · ${escapeHtml(binding.transportMode)}</span>
        </td>
        <td>
          <div class="pill-row">
            <span class="pill">${escapeHtml(binding.environmentId)}</span>
            <span class="pill">${escapeHtml(binding.transportAssuranceProfileId)}</span>
            <span class="pill" data-tone="${rowStateTone(configuredState)}">${escapeHtml(configuredState)}</span>
          </div>
          <div class="meta" style="margin-top:8px">${escapeHtml(binding.expectedAdapterVersion)}</div>
        </td>
        <td>
          <code>${escapeHtml(binding.dispatchBindingHash)}</code>
          <div class="meta" data-testid="dispatch-fingerprint-${binding.bindingId}" style="margin-top:8px">${escapeHtml(secretPreview)}</div>
        </td>
        <td>
          <div class="meta">${escapeHtml(binding.evidenceRefs.join(" · "))}</div>
          <div class="actions" style="margin-top:10px">
            <form method="POST" action="/action/configure-dispatch">
              <input type="hidden" name="bindingId" value="${escapeHtml(binding.bindingId)}" />
              <button
                type="submit"
                data-testid="configure-dispatch-${binding.bindingId}"
                data-variant="primary"
                ${binding.portalAutomationState === "fully_automated" ? "" : "disabled"}
              >
                ${binding.portalAutomationState === "fully_automated" ? "Configure local twin" : "Manual bridge required"}
              </button>
            </form>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  const body = `
    <section class="banner" data-tone="info">
      <h2>Dispatch binding posture</h2>
      <p class="meta">
        Dispatch-provider bindings stay environment-specific, capability-tuple-bound, and aligned to
        the Phase 6 dispatch adapter wave before any non-production credential setup can pass verification.
      </p>
    </section>
    <table class="table" data-testid="dispatch-table">
      <thead>
        <tr>
          <th>Provider</th>
          <th>Transport and environment</th>
          <th>Binding hash and masked secret evidence</th>
          <th>Evidence and setup</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  await assertSecretSafeText(body, "Dispatch page render");
  return pageShell("Dispatch provider binding configuration", body, "dispatch");
}

function readinessTone(
  state: DirectoryDispatchReadinessSummary["byEnvironment"][number]["readinessState"],
): "success" | "warn" | "danger" {
  if (state === "verified") {
    return "success";
  }
  if (state === "manual_bridge_required" || state === "preflight_only") {
    return "warn";
  }
  return "danger";
}

async function renderVerificationPage(outputDir: string): Promise<string> {
  const summary = await verifyDirectoryAndDispatchReadiness(outputDir);
  const envCards = summary.byEnvironment
    .map(
      (entry) => `<div class="stat" data-testid="verification-env-${entry.environmentId}">
        <span class="meta">${escapeHtml(entry.environmentLabel)}</span>
        <strong>${escapeHtml(entry.readinessState)}</strong>
        <div class="pill-row" style="margin-top:8px">
          <span class="pill" data-tone="${readinessTone(entry.readinessState)}">${escapeHtml(entry.readinessState)}</span>
          <span class="pill">configured ${entry.automatedRowsConfigured}</span>
          <span class="pill">manual bridge ${entry.manualBridgeRows}</span>
        </div>
      </div>`,
    )
    .join("");

  const sourceRows = summary.sourceChecks
    .map(
      (entry) => `<tr data-testid="verification-source-${entry.sourceId}">
        <td><code>${escapeHtml(entry.sourceId)}</code></td>
        <td>${escapeHtml(entry.environmentId)}</td>
        <td>${escapeHtml(entry.providerRef)}</td>
        <td>${escapeHtml(entry.verificationState)}</td>
        <td>${escapeHtml(entry.decisionClasses.join(" | "))}</td>
      </tr>`,
    )
    .join("");
  const dispatchRows = summary.dispatchChecks
    .map(
      (entry) => `<tr data-testid="verification-dispatch-${entry.bindingId}">
        <td><code>${escapeHtml(entry.bindingId)}</code></td>
        <td>${escapeHtml(entry.environmentId)}</td>
        <td>${escapeHtml(entry.providerRef)}</td>
        <td>${escapeHtml(entry.verificationState)}</td>
        <td>${escapeHtml(entry.decisionClasses.join(" | "))}</td>
      </tr>`,
    )
    .join("");

  const body = `
    <section class="banner" data-tone="success">
      <h2>Machine-readable readiness evidence</h2>
      <p class="meta">
        Verification proves environment readiness and tuple alignment only. It does not imply live provider approval
        or clinical completion.
      </p>
    </section>
    <div class="stats">${envCards}</div>
    <section>
      <h2>Directory source checks</h2>
      <table class="table" data-testid="verification-source-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Environment</th>
            <th>Provider</th>
            <th>State</th>
            <th>Decision classes</th>
          </tr>
        </thead>
        <tbody>${sourceRows}</tbody>
      </table>
    </section>
    <section>
      <h2>Dispatch binding checks</h2>
      <table class="table" data-testid="verification-dispatch-table">
        <thead>
          <tr>
            <th>Binding</th>
            <th>Environment</th>
            <th>Provider</th>
            <th>State</th>
            <th>Decision classes</th>
          </tr>
        </thead>
        <tbody>${dispatchRows}</tbody>
      </table>
    </section>
  `;
  await assertSecretSafeText(body, "Verification page render");
  return pageShell("Directory and dispatch readiness verification", body, "verification");
}

function parseBody(req: http.IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const params = new URLSearchParams(body);
      resolve(Object.fromEntries(params.entries()));
    });
    req.on("error", reject);
  });
}

async function router(
  outputDir: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname === "/" || url.pathname === "/login") {
    if (req.method === "POST") {
      res.writeHead(302, {
        Location: "/portal/directory",
        "Set-Cookie": `${SESSION_COOKIE}; Path=/; HttpOnly; SameSite=Lax`,
      });
      res.end();
      return;
    }
    const body = `
      <section class="login-shell">
        <div class="banner" data-tone="info">
          <h2>Open the controlled non-production portal</h2>
          <p class="meta">
            This harness demonstrates environment isolation, secret-safe evidence capture, and manifest-owned
            readiness. It never renders raw secret locators in the UI.
          </p>
        </div>
        <form method="POST" action="/login">
          <label>
            Operator ID
            <input data-testid="portal-operator-id" name="operatorId" value="ops.366" />
          </label>
          <label>
            Review note
            <input data-testid="portal-review-note" name="reviewNote" value="rehearsal" />
          </label>
          <button type="submit" data-testid="portal-sign-in" data-variant="primary">Sign in to portal</button>
        </form>
      </section>
    `;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(pageShell("Pharmacy directory and dispatch portal", body, "login"));
    return;
  }

  if (!cookieAuthorized(req)) {
    redirect(res, "/login");
    return;
  }

  if (url.pathname === "/action/configure-directory" && req.method === "POST") {
    const body = await parseBody(req);
    await bootstrapDirectoryAndDispatchCredentials({
      outputDir,
      mode: "apply",
      sourceIds: body.sourceId ? [body.sourceId] : undefined,
    });
    redirect(res, "/portal/directory");
    return;
  }

  if (url.pathname === "/action/configure-dispatch" && req.method === "POST") {
    const body = await parseBody(req);
    await bootstrapDirectoryAndDispatchCredentials({
      outputDir,
      mode: "apply",
      bindingIds: body.bindingId ? [body.bindingId] : undefined,
    });
    redirect(res, "/portal/dispatch");
    return;
  }

  if (url.pathname === "/portal/directory") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await renderDirectoryPage(outputDir));
    return;
  }
  if (url.pathname === "/portal/dispatch") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await renderDispatchPage(outputDir));
    return;
  }
  if (url.pathname === "/portal/verification") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await renderVerificationPage(outputDir));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

export async function startDirectoryDispatchPortalHarness(
  outputDir = DEFAULT_RUNTIME_DIR,
  options: { readonly preserveExistingState?: boolean } = {},
): Promise<{ readonly server: http.Server; readonly baseUrl: string }> {
  fs.mkdirSync(outputDir, { recursive: true });
  if (!options.preserveExistingState) {
    await resetDirectoryAndDispatchRuntime(outputDir);
  }
  await readAndValidateDirectoryDispatchControlPlane();

  const server = await new Promise<http.Server>((resolve, reject) => {
    const candidate = http.createServer((req, res) => {
      router(outputDir, req, res).catch((error) => {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(String(error));
      });
    });
    candidate.once("error", reject);
    candidate.listen(0, "127.0.0.1", () => resolve(candidate));
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve directory/dispatch harness address.");
  }
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

export async function stopDirectoryDispatchPortalHarness(
  server: http.Server,
): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function loginToDirectoryDispatchPortal(
  page: {
    goto: (url: string, options?: { waitUntil?: "networkidle" }) => Promise<unknown>;
    getByTestId: (testId: string) => {
      fill: (value: string) => Promise<void>;
      click: () => Promise<void>;
    };
    waitForURL: (url: RegExp) => Promise<unknown>;
  },
  baseUrl: string,
): Promise<void> {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByTestId("portal-operator-id").fill("ops.366");
  await page.getByTestId("portal-review-note").fill("rehearsal");
  await page.getByTestId("portal-sign-in").click();
  await page.waitForURL(/\/portal\/directory$/);
}
