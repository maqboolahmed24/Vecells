import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { URL, URLSearchParams } from "node:url";

import {
  buildMaskedFingerprint,
  buildTransportSandboxManifest,
  buildUpdateRecordObservationManifest,
  materializeTransportSandboxTrackedArtifacts,
  prepareOperatorSubmissionBundle,
  readAndValidateTransportSandboxControlPlane,
  resetTransportSandboxRuntime,
  transitionSandboxRequestState,
  verifyUpdateRecordAndTransportSandboxReadiness,
  type SandboxCheck,
  type SandboxReadinessSummary,
  type TransportSandboxEntry,
  type UpdateRecordObservationEntry,
} from "../../scripts/pharmacy/367_update_record_transport_sandbox_lib.ts";
import { assertSecretSafeText } from "./367_redaction_helpers.ts";

export const ROOT = path.resolve(process.cwd());
export const DEFAULT_RUNTIME_DIR = path.join(
  ROOT,
  "output",
  "playwright",
  "367-transport-sandbox-state",
);

const SESSION_COOKIE = "pharmacy_transport_sandbox_portal=active";

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

type ActivePage = "login" | "requests" | "status";

function pageShell(title: string, body: string, activePage: ActivePage): string {
  const navLink = (
    href: string,
    label: string,
    testId: string,
    key: Exclude<ActivePage, "login">,
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
        --bg: #f5f8fb;
        --panel: #ffffff;
        --ink: #11263a;
        --muted: #587086;
        --line: #d7e2eb;
        --brand: #0b6a88;
        --success: #0b7a4b;
        --warn: #986600;
        --danger: #b42318;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(11, 106, 136, 0.12), transparent 40%),
          linear-gradient(180deg, #fbfdff 0%, var(--bg) 100%);
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
        box-shadow: 0 24px 52px rgba(17, 38, 58, 0.08);
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
        max-width: 1000px;
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
        border-color: rgba(11, 106, 136, 0.3);
        background: rgba(11, 106, 136, 0.08);
      }
      main {
        padding: 22px 24px;
        display: grid;
        gap: 18px;
      }
      .banner {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #f6fafc;
        padding: 16px;
      }
      .banner[data-tone="success"] { background: #eef9f2; }
      .banner[data-tone="warn"] { background: #fff8ef; }
      .banner[data-tone="danger"] { background: #fef1f0; }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }
      .stat, .request-card {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fcfdff;
        padding: 16px;
        min-width: 0;
      }
      .stat strong {
        display: block;
        margin-top: 4px;
        font-size: 24px;
      }
      .section-title {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
        flex-wrap: wrap;
      }
      .request-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 14px;
      }
      .request-card h3 {
        margin: 0;
        font-size: 22px;
      }
      .meta {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
        font-size: 14px;
      }
      .kv {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      .kv div {
        border: 1px solid #edf2f6;
        border-radius: 14px;
        padding: 12px;
        background: white;
        min-width: 0;
      }
      .kv strong {
        display: block;
        font-size: 12px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 6px;
      }
      .pill-row, .actions {
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
        max-width: 100%;
        overflow-wrap: anywhere;
      }
      .pill[data-tone="success"] {
        color: var(--success);
        border-color: rgba(11, 122, 75, 0.28);
        background: rgba(11, 122, 75, 0.08);
      }
      .pill[data-tone="warn"] {
        color: var(--warn);
        border-color: rgba(152, 102, 0, 0.28);
        background: rgba(152, 102, 0, 0.08);
      }
      .pill[data-tone="danger"] {
        color: var(--danger);
        border-color: rgba(180, 35, 24, 0.28);
        background: rgba(180, 35, 24, 0.08);
      }
      form.inline {
        display: inline-flex;
      }
      button, input, textarea {
        font: inherit;
      }
      button {
        border: 1px solid rgba(11, 106, 136, 0.22);
        border-radius: 999px;
        background: rgba(11, 106, 136, 0.08);
        color: var(--brand);
        font-weight: 700;
        padding: 10px 14px;
        cursor: pointer;
      }
      button[disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }
      code {
        font-size: 12px;
        background: #eff5f8;
        padding: 2px 6px;
        border-radius: 6px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 12px 10px;
        border-bottom: 1px solid #edf2f6;
        vertical-align: top;
        text-align: left;
      }
      th {
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .login-card {
        display: grid;
        gap: 14px;
        max-width: 540px;
      }
      .field {
        display: grid;
        gap: 6px;
      }
      .field input,
      .field textarea {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 12px 14px;
        background: white;
        width: 100%;
      }
      .field textarea {
        min-height: 120px;
        resize: vertical;
      }
      @media (max-width: 620px) {
        .shell {
          width: calc(100vw - 18px);
          margin: 10px auto 24px;
        }
        header, main {
          border-radius: 18px;
          padding-inline: 16px;
        }
        .request-grid, .stats {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="eyebrow">Seq 367 sandbox readiness</div>
        <h1>${escapeHtml(title)}</h1>
        <p class="subhead">Governed non-production request packs for Update Record observation and referral transports. The portal proves draft, operator handoff, submission, and status-check paths without claiming external approval or outbound Update Record authority.</p>
        ${
          activePage === "login"
            ? ""
            : `<nav>
                ${navLink("/portal/requests", "Request packs", "nav-requests", "requests")}
                ${navLink("/portal/status", "Status and evidence", "nav-status", "status")}
              </nav>`
        }
      </header>
      <main>${body}</main>
    </div>
  </body>
</html>`;
}

function stateTone(
  state: string,
): "success" | "warn" | "danger" {
  if (state === "approved") {
    return "success";
  }
  if (state === "blocked" || state === "expired") {
    return "danger";
  }
  return "warn";
}

async function renderLoginPage(): Promise<string> {
  return pageShell(
    "Transport sandbox operator sign-in",
    `<section class="login-card">
      <div class="banner" data-tone="warn">
        This harness is local-only. It mirrors request-pack and status-check flows without storing real onboarding credentials or claiming NHS-side approval.
      </div>
      <form method="post" action="/login">
        <div class="field">
          <label for="operatorId">Operator ID</label>
          <input id="operatorId" name="operatorId" data-testid="portal-operator-id" autocomplete="off" />
        </div>
        <div class="field">
          <label for="reviewNote">Review note</label>
          <textarea id="reviewNote" name="reviewNote" data-testid="portal-review-note"></textarea>
        </div>
        <button type="submit" data-testid="portal-sign-in">Open request console</button>
      </form>
    </section>`,
    "login",
  );
}

function renderActionNotice(searchParams: URLSearchParams): string {
  const action = searchParams.get("action");
  const requestId = searchParams.get("requestId");
  const bundle = searchParams.get("bundle");
  if (!action && !bundle) {
    return "";
  }
  if (bundle) {
    return `<div class="banner" data-testid="requests-banner" data-tone="success" data-action="bundle_prepared">
      <strong>Operator bundle prepared</strong>
      <p class="meta">The handoff bundle for <code>${escapeHtml(
        requestId ?? "unknown-request",
      )}</code> was written as <code>${escapeHtml(bundle)}</code>.</p>
    </div>`;
  }

  const tone =
    action === "submitted"
      ? "success"
      : action === "manual_stop_required" || action === "blocked"
        ? "warn"
        : "info";
  return `<div class="banner" data-testid="requests-banner" data-tone="${tone}" data-action="${escapeHtml(
    action ?? "unknown",
  )}">
    <strong>Last action: ${escapeHtml(action ?? "unknown")}</strong>
    <p class="meta">Request <code>${escapeHtml(
      requestId ?? "unknown-request",
    )}</code> stayed within the governed local sandbox flow. Manual approvals remain evidence-bound.</p>
  </div>`;
}

function renderRequestActions(
  requestId: string,
  state: string,
  automationMode: string,
): string {
  const disableDraft = state === "approved";
  const disableSubmit = automationMode === "not_required" || state === "approved";
  return `<div class="actions">
    <form class="inline" method="post" action="/actions/prepare-bundle">
      <input type="hidden" name="requestId" value="${escapeHtml(requestId)}" />
      <button type="submit" data-testid="prepare-bundle-${escapeHtml(requestId)}">Prepare operator bundle</button>
    </form>
    <form class="inline" method="post" action="/actions/prepare-draft">
      <input type="hidden" name="requestId" value="${escapeHtml(requestId)}" />
      <button type="submit" data-testid="prepare-draft-${escapeHtml(requestId)}"${disableDraft ? " disabled" : ""}>Prepare draft</button>
    </form>
    <form class="inline" method="post" action="/actions/submit-request">
      <input type="hidden" name="requestId" value="${escapeHtml(requestId)}" />
      <button type="submit" data-testid="submit-request-${escapeHtml(requestId)}"${disableSubmit ? " disabled" : ""}>Submit or checkpoint</button>
    </form>
  </div>`;
}

function renderSecretPills(secretRefs: readonly string[]): string {
  if (secretRefs.length === 0) {
    return `<span class="pill" data-tone="success">no stored secret refs</span>`;
  }
  return secretRefs
    .map(
      (secretRef) =>
        `<span class="pill">${escapeHtml(buildMaskedFingerprint(secretRef))}</span>`,
    )
    .join("");
}

function renderUpdateRecordCard(
  entry: UpdateRecordObservationEntry,
  check: SandboxCheck | undefined,
): string {
  const requestState = check?.requestState ?? entry.requestState;
  return `<article
      class="request-card"
      data-testid="request-row-${escapeHtml(entry.requestId)}"
      data-request-state="${escapeHtml(requestState)}"
      data-automation-mode="${escapeHtml(entry.automationMode)}"
      data-kind="update_record"
    >
      <div class="section-title">
        <h3>${escapeHtml(entry.environmentLabel)}</h3>
        <div class="pill-row">
          <span class="pill" data-testid="request-state-${escapeHtml(entry.requestId)}" data-tone="${stateTone(
            requestState,
          )}">${escapeHtml(requestState)}</span>
          <span class="pill">${escapeHtml(entry.automationMode)}</span>
          <span class="pill">gp_connect_update_record</span>
        </div>
      </div>
      <p class="meta">Update Record observation only. Consultation summaries may be prepared for filing, but urgent return and referral transport remain outside this channel.</p>
      <div class="kv">
        <div>
          <strong>Request path</strong>
          <span>${escapeHtml(entry.requestPathKind)}</span>
        </div>
        <div>
          <strong>Service set</strong>
          <span>${escapeHtml(entry.supportedServiceSet.join(", "))}</span>
        </div>
        <div>
          <strong>Portal reference</strong>
          <code>${escapeHtml(entry.portalUrlRef)}</code>
        </div>
        <div>
          <strong>Pack hash</strong>
          <code>${escapeHtml(entry.requestPackHash)}</code>
        </div>
      </div>
      <p class="meta"><strong>Decision classes:</strong> ${escapeHtml(
        check?.decisionClasses.join(", ") ?? "pending",
      )}</p>
      <p class="meta"><strong>Evidence:</strong> ${escapeHtml(entry.evidenceRefs.join(", "))}</p>
      <div class="pill-row">${renderSecretPills(entry.secretRefs)}</div>
      <p class="meta">${escapeHtml(entry.notes.join(" "))}</p>
      ${renderRequestActions(entry.requestId, requestState, entry.automationMode)}
    </article>`;
}

function renderTransportCard(
  entry: TransportSandboxEntry,
  check: SandboxCheck | undefined,
): string {
  const requestState = check?.requestState ?? entry.requestState;
  return `<article
      class="request-card"
      data-testid="request-row-${escapeHtml(entry.requestId)}"
      data-request-state="${escapeHtml(requestState)}"
      data-automation-mode="${escapeHtml(entry.automationMode)}"
      data-kind="transport"
    >
      <div class="section-title">
        <h3>${escapeHtml(entry.environmentLabel)}</h3>
        <div class="pill-row">
          <span class="pill" data-testid="request-state-${escapeHtml(entry.requestId)}" data-tone="${stateTone(
            requestState,
          )}">${escapeHtml(requestState)}</span>
          <span class="pill">${escapeHtml(entry.transportMode)}</span>
          <span class="pill">${escapeHtml(entry.transportPurpose)}</span>
        </div>
      </div>
      <p class="meta">Transport onboarding stays separate from Update Record observation. Request packs prove environment readiness only and do not imply patient-safe completion.</p>
      <div class="kv">
        <div>
          <strong>Request path</strong>
          <span>${escapeHtml(entry.requestPathKind)}</span>
        </div>
        <div>
          <strong>Endpoint or mailbox</strong>
          <code>${escapeHtml(entry.endpointOrMailboxRef)}</code>
        </div>
        <div>
          <strong>Binding</strong>
          <span>${escapeHtml(entry.boundDispatchBindingId ?? "not required")}</span>
        </div>
        <div>
          <strong>Pack hash</strong>
          <code>${escapeHtml(entry.requestPackHash)}</code>
        </div>
      </div>
      <p class="meta"><strong>Decision classes:</strong> ${escapeHtml(
        check?.decisionClasses.join(", ") ?? "pending",
      )}</p>
      <p class="meta"><strong>Evidence:</strong> ${escapeHtml(entry.evidenceRefs.join(", "))}</p>
      <div class="pill-row">${renderSecretPills(entry.secretRefs)}</div>
      <p class="meta">${escapeHtml(entry.notes.join(" "))}</p>
      ${renderRequestActions(entry.requestId, requestState, entry.automationMode)}
    </article>`;
}

async function renderRequestsPage(
  outputDir: string,
  searchParams: URLSearchParams,
): Promise<string> {
  const updateManifest = await buildUpdateRecordObservationManifest();
  const transportManifest = await buildTransportSandboxManifest();
  const summary = await verifyUpdateRecordAndTransportSandboxReadiness(outputDir);
  const updateChecks = new Map(
    summary.updateRecordChecks.map((entry) => [entry.requestId, entry]),
  );
  const transportChecks = new Map(
    summary.transportChecks.map((entry) => [entry.requestId, entry]),
  );

  return pageShell(
    "Request packs and operator checkpoints",
    `${renderActionNotice(searchParams)}
     <section class="banner" data-tone="warn">
       <strong>Boundary reminder</strong>
       <p class="meta">Update Record rows stay observation-only. Urgent return remains a monitored mailbox or direct professional communication channel and is never collapsed into Update Record.</p>
     </section>
     <section>
       <div class="section-title">
         <h2>Update Record observation readiness</h2>
         <span class="meta">${updateManifest.observations.length} request packs</span>
       </div>
       <div class="request-grid">
         ${updateManifest.observations
           .map((entry) => renderUpdateRecordCard(entry, updateChecks.get(entry.requestId)))
           .join("")}
       </div>
     </section>
     <section>
       <div class="section-title">
         <h2>Referral transport readiness</h2>
         <span class="meta">${transportManifest.transports.length} request packs</span>
       </div>
       <div class="request-grid">
         ${transportManifest.transports
           .map((entry) => renderTransportCard(entry, transportChecks.get(entry.requestId)))
           .join("")}
       </div>
     </section>`,
    "requests",
  );
}

function renderStatusRow(
  requestId: string,
  environmentId: string,
  kind: string,
  requestState: string,
  decisionClasses: readonly string[],
): string {
  return `<tr data-testid="verification-request-${escapeHtml(requestId)}">
    <td><code>${escapeHtml(requestId)}</code></td>
    <td>${escapeHtml(kind)}</td>
    <td>${escapeHtml(environmentId)}</td>
    <td><span class="pill" data-tone="${stateTone(requestState)}">${escapeHtml(requestState)}</span></td>
    <td>${escapeHtml(decisionClasses.join(", "))}</td>
  </tr>`;
}

async function renderStatusPage(outputDir: string): Promise<string> {
  const summary = await verifyUpdateRecordAndTransportSandboxReadiness(outputDir);
  const rows = [
    ...summary.updateRecordChecks.map((entry) =>
      renderStatusRow(
        entry.requestId,
        entry.environmentId,
        entry.kind,
        entry.requestState,
        entry.decisionClasses,
      ),
    ),
    ...summary.transportChecks.map((entry) =>
      renderStatusRow(
        entry.requestId,
        entry.environmentId,
        entry.kind,
        entry.requestState,
        entry.decisionClasses,
      ),
    ),
  ].join("");

  return pageShell(
    "Status checks and machine-readable evidence",
    `<section class="stats">
       ${summary.byEnvironment
         .map(
           (entry) => `<article class="stat" data-testid="verification-env-${escapeHtml(
             entry.environmentId,
           )}">
             <span class="eyebrow">${escapeHtml(entry.environmentLabel)}</span>
             <strong>${entry.approvedCount} approved</strong>
             <p class="meta">Drafted: ${entry.draftedCount}<br />Submitted or awaiting: ${entry.submittedOrAwaitingCount}<br />Blocked or expired: ${entry.blockedOrExpiredCount}</p>
           </article>`,
         )
         .join("")}
     </section>
     <section class="banner" data-tone="warn">
       <strong>Status evidence boundary</strong>
       <p class="meta">This page proves request posture, environment tuple, and captured evidence. It does not claim external approval, patient-safe completion, or authoritative outcome truth.</p>
     </section>
     <section>
       <div class="section-title">
         <h2>Sandbox readiness matrix</h2>
         <span class="meta">Runtime summary writes to <code>${escapeHtml(
           path.join(outputDir, "367_sandbox_readiness_summary.json"),
         )}</code></span>
       </div>
       <table>
         <thead>
           <tr>
             <th>Request</th>
             <th>Kind</th>
             <th>Environment</th>
             <th>State</th>
             <th>Decision classes</th>
           </tr>
         </thead>
         <tbody>${rows}</tbody>
       </table>
     </section>`,
    "status",
  );
}

function hasSession(req: http.IncomingMessage): boolean {
  return (req.headers.cookie ?? "").includes(SESSION_COOKIE);
}

function redirect(res: http.ServerResponse, target: string): void {
  res.writeHead(302, { Location: target });
  res.end();
}

async function readForm(req: http.IncomingMessage): Promise<Record<string, string>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const params = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  return Object.fromEntries(params.entries());
}

async function sendHtml(
  res: http.ServerResponse,
  html: string,
  label: string,
): Promise<void> {
  await assertSecretSafeText(html, label);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

async function router(
  outputDir: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");

  if (req.method === "GET" && url.pathname === "/") {
    redirect(res, "/login");
    return;
  }

  if (req.method === "GET" && url.pathname === "/login") {
    await sendHtml(res, await renderLoginPage(), "367-login-page");
    return;
  }

  if (req.method === "POST" && url.pathname === "/login") {
    const body = await readForm(req);
    const cookieValue = `${SESSION_COOKIE}; Path=/; HttpOnly`;
    res.writeHead(302, {
      Location: "/portal/requests",
      "Set-Cookie": cookieValue,
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end(`${body.operatorId ?? "operator"} signed in`);
    return;
  }

  if (url.pathname.startsWith("/portal") || url.pathname.startsWith("/actions")) {
    if (!hasSession(req)) {
      redirect(res, "/login");
      return;
    }
  }

  if (req.method === "POST" && url.pathname === "/actions/prepare-bundle") {
    const body = await readForm(req);
    const { outputPath: bundlePath } = await prepareOperatorSubmissionBundle({
      outputDir,
      requestIds: body.requestId ? [body.requestId] : undefined,
    });
    redirect(
      res,
      `/portal/requests?requestId=${encodeURIComponent(
        body.requestId ?? "",
      )}&bundle=${encodeURIComponent(path.basename(bundlePath))}`,
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/actions/prepare-draft") {
    const body = await readForm(req);
    const result = await transitionSandboxRequestState({
      requestId: body.requestId ?? "",
      action: "prepare_draft",
      outputDir,
    });
    redirect(
      res,
      `/portal/requests?requestId=${encodeURIComponent(
        result.requestId,
      )}&action=${encodeURIComponent(result.action)}`,
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/actions/submit-request") {
    const body = await readForm(req);
    const result = await transitionSandboxRequestState({
      requestId: body.requestId ?? "",
      action: "submit_request",
      outputDir,
    });
    redirect(
      res,
      `/portal/requests?requestId=${encodeURIComponent(
        result.requestId,
      )}&action=${encodeURIComponent(result.action)}`,
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/portal/requests") {
    await sendHtml(
      res,
      await renderRequestsPage(outputDir, url.searchParams),
      "367-requests-page",
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/portal/status") {
    await sendHtml(
      res,
      await renderStatusPage(outputDir),
      "367-status-page",
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

export async function startTransportSandboxPortalHarness(
  outputDir = DEFAULT_RUNTIME_DIR,
  options: { readonly preserveExistingState?: boolean } = {},
): Promise<{ readonly server: http.Server; readonly baseUrl: string }> {
  fs.mkdirSync(outputDir, { recursive: true });
  await materializeTransportSandboxTrackedArtifacts(ROOT);
  if (!options.preserveExistingState) {
    await resetTransportSandboxRuntime(outputDir);
  }
  await readAndValidateTransportSandboxControlPlane();

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
    throw new Error("Failed to resolve transport sandbox harness address.");
  }
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

export async function stopTransportSandboxPortalHarness(
  server: http.Server,
): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function loginToTransportSandboxPortal(
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
  await page.getByTestId("portal-operator-id").fill("ops.367");
  await page.getByTestId("portal-review-note").fill(
    "Prepare non-production request packs without overclaiming approval.",
  );
  await page.getByTestId("portal-sign-in").click();
  await page.waitForURL(/\/portal\/requests$/);
}

export async function readStatusSummary(
  outputDir = DEFAULT_RUNTIME_DIR,
): Promise<SandboxReadinessSummary> {
  return verifyUpdateRecordAndTransportSandboxReadiness(outputDir);
}
