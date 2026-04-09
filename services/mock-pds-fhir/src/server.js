import http from "node:http";
import { URL } from "node:url";

import { auditLog, health, metadata, read, search } from "./pdsCore.js";

const HOST = process.env.MOCK_PDS_HOST ?? "127.0.0.1";
const PORT = Number(process.env.MOCK_PDS_PORT ?? "4176");

function writeJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload, null, 2));
}

function writeHtml(response, html) {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  response.end(html);
}

function statusTone(status) {
  if (status >= 500) {
    return "blocked";
  }
  if (status >= 400) {
    return "warning";
  }
  return "success";
}

function playgroundHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vecells MOCK_PDS_SANDBOX</title>
    <style>
      :root {
        --canvas: #f4f7fb;
        --panel: #ffffff;
        --inset: #eef3f8;
        --text: #1d2939;
        --muted: #667085;
        --line: #d0d5dd;
        --primary: #0f5cc0;
        --secondary: #127a6a;
        --caution: #b54708;
        --blocked: #c24141;
        --success: #12b76a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(15, 92, 192, 0.14), transparent 28%),
          radial-gradient(circle at top right, rgba(18, 122, 106, 0.1), transparent 25%),
          var(--canvas);
      }
      button, input, select { font: inherit; }
      button, select, input {
        min-height: 44px;
        border-radius: 14px;
        border: 1px solid var(--line);
        padding: 0 14px;
        background: #fff;
      }
      button { cursor: pointer; }
      button:focus-visible, input:focus-visible, select:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      .shell {
        max-width: 1440px;
        margin: 0 auto;
        padding: 24px;
      }
      .header {
        position: sticky;
        top: 0;
        z-index: 3;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
        padding: 18px;
        border: 1px solid rgba(208, 213, 221, 0.95);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(14px);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .mark {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 700;
        background: linear-gradient(135deg, var(--primary), #6941c6);
      }
      .ribbon, .chip {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
      }
      .ribbon {
        color: var(--primary);
        background: rgba(15, 92, 192, 0.1);
      }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 380px);
        gap: 20px;
      }
      .panel {
        padding: 18px;
        border: 1px solid rgba(208, 213, 221, 0.95);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 18px 40px rgba(16, 24, 40, 0.08);
      }
      .controls {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      .field {
        display: grid;
        gap: 8px;
      }
      .field label {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
      }
      .actions button.primary {
        color: #fff;
        border-color: transparent;
        background: linear-gradient(135deg, var(--primary), #1b78e2);
      }
      .actions button.secondary {
        color: var(--secondary);
        background: rgba(18, 122, 106, 0.1);
      }
      h1, h2, h3, p, pre { margin: 0; }
      h1 { font-size: 28px; }
      h2 { font-size: 20px; margin-bottom: 12px; }
      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }
      .chip.success { color: var(--success); background: rgba(18, 183, 106, 0.1); }
      .chip.warning { color: var(--caution); background: rgba(181, 71, 8, 0.12); }
      .chip.blocked { color: var(--blocked); background: rgba(194, 65, 65, 0.12); }
      .result-list {
        display: grid;
        gap: 12px;
        margin-top: 16px;
      }
      .result-row {
        width: 100%;
        text-align: left;
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: var(--inset);
      }
      .result-row strong {
        display: block;
        margin-bottom: 4px;
      }
      pre {
        overflow: auto;
        padding: 16px;
        border-radius: 18px;
        background: #0f1728;
        color: #dce7f6;
        max-height: 420px;
      }
      .audit-list {
        display: grid;
        gap: 10px;
      }
      .audit-row {
        padding: 12px;
        border-radius: 18px;
        background: var(--inset);
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .note {
        margin-top: 14px;
        color: var(--muted);
      }
      @media (max-width: 980px) {
        .grid { grid-template-columns: 1fr; }
        .controls { grid-template-columns: 1fr; }
      }
      @media (prefers-reduced-motion: reduce) {
        * {
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell" data-testid="sandbox-shell">
      <header class="header">
        <div class="brand">
          <div class="mark" aria-hidden="true">V</div>
          <div>
            <div class="ribbon">MOCK_PDS_SANDBOX</div>
            <h1>Vecells PDS FHIR Sandbox</h1>
          </div>
        </div>
        <div class="mono" data-testid="sandbox-mode-label">search + read rehearsal only</div>
      </header>

      <section class="grid">
        <section class="panel">
          <h2>Search And Read</h2>
          <p>Run contract-level search and read traces against synthetic PDS demographics without implying durable identity authority.</p>
          <div class="controls">
            <div class="field">
              <label for="accessMode">Access mode</label>
              <select id="accessMode" data-testid="access-mode-select"></select>
            </div>
            <div class="field">
              <label for="scenario">Scenario</label>
              <select id="scenario" data-testid="scenario-select"></select>
            </div>
            <div class="field" style="grid-column: 1 / -1;">
              <label for="query">Search query</label>
              <input id="query" data-testid="query-input" value="meridian" />
            </div>
          </div>
          <div class="actions">
            <button class="primary" data-testid="search-button" id="searchButton">Search</button>
            <button class="secondary" data-testid="read-first-button" id="readFirstButton">Read first result</button>
          </div>
          <div class="summary" id="summaryChips" data-testid="result-summary"></div>
          <div class="result-list" id="resultList" data-testid="result-list"></div>
          <p class="note" data-testid="binding-proof-note">PDS success stays supporting evidence only. It never writes <span class="mono">Request.patientRef</span> directly.</p>
        </section>

        <aside class="panel">
          <h2>Result Inspector</h2>
          <pre data-testid="result-json" id="resultJson">{}</pre>
          <h3 style="margin: 18px 0 12px;">Masked Audit Log</h3>
          <div class="audit-list" id="auditList" data-testid="audit-log"></div>
        </aside>
      </section>
    </main>

    <script type="module">
      const state = {
        metadata: null,
        lastBundle: null,
      };

      const accessModeSelect = document.getElementById("accessMode");
      const scenarioSelect = document.getElementById("scenario");
      const queryInput = document.getElementById("query");
      const resultJson = document.getElementById("resultJson");
      const resultList = document.getElementById("resultList");
      const summaryChips = document.getElementById("summaryChips");
      const auditList = document.getElementById("auditList");

      function chip(text, tone) {
        const div = document.createElement("div");
        div.className = "chip " + tone;
        div.textContent = text;
        return div;
      }

      function renderAudit(payload) {
        auditList.innerHTML = "";
        for (const row of payload.events) {
          const div = document.createElement("div");
          div.className = "audit-row";
          div.innerHTML = "<strong class='mono'>" + row.eventType + "</strong><div>" +
            (row.patientMask ?? row.queryMask ?? "masked") + "</div><div class='note'>" + row.timestamp + "</div>";
          auditList.appendChild(div);
        }
        if (!payload.events.length) {
          auditList.appendChild(chip("No audit events yet", "warning"));
        }
      }

      function renderSummary(status, payload) {
        summaryChips.innerHTML = "";
        summaryChips.appendChild(chip("HTTP " + status, ${JSON.stringify(statusTone(200))}));
        const tone = status >= 500 ? "blocked" : status >= 400 ? "warning" : "success";
        summaryChips.firstChild.className = "chip " + tone;
        const resultClass = payload?.extension?.find?.((row) => row.url.includes("result-class"))?.valueCode;
        if (resultClass) {
          const resultChip = chip("class: " + resultClass, tone);
          resultChip.dataset.testid = "trace-class-" + resultClass;
          resultChip.setAttribute("data-testid", "trace-class-" + resultClass);
          summaryChips.appendChild(resultChip);
        }
        if (typeof payload?.total === "number") {
          summaryChips.appendChild(chip("entries: " + payload.total, tone));
        }
      }

      function renderResultList(bundle) {
        resultList.innerHTML = "";
        const entries = bundle?.entry ?? [];
        for (const entry of entries) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "result-row";
          button.dataset.testid = "result-row-" + entry.resource.id;
          button.setAttribute("data-testid", "result-row-" + entry.resource.id);
          button.innerHTML = "<strong>" + entry.resource.name?.[0]?.text + "</strong>" +
            "<div class='mono'>" + entry.resource.id + "</div>" +
            "<div>score " + String(entry.search?.score ?? "") + "</div>";
          button.addEventListener("click", () => readPatient(entry.resource.id));
          resultList.appendChild(button);
        }
        if (!entries.length) {
          resultList.appendChild(chip("No patient candidates returned", "warning"));
        }
      }

      async function refreshAudit() {
        const payload = await fetch("/audit").then((response) => response.json());
        renderAudit(payload);
      }

      async function runSearch() {
        const params = new URLSearchParams({
          accessMode: accessModeSelect.value,
          scenario: scenarioSelect.value,
          query: queryInput.value,
        });
        const response = await fetch("/Patient?" + params.toString());
        const payload = await response.json();
        state.lastBundle = payload;
        renderSummary(response.status, payload);
        renderResultList(payload);
        resultJson.textContent = JSON.stringify(payload, null, 2);
        await refreshAudit();
      }

      async function readPatient(patientId) {
        const params = new URLSearchParams({
          accessMode: accessModeSelect.value,
          scenario: scenarioSelect.value,
        });
        const response = await fetch("/Patient/" + patientId + "?" + params.toString());
        const payload = await response.json();
        renderSummary(response.status, payload);
        resultJson.textContent = JSON.stringify(payload, null, 2);
        await refreshAudit();
      }

      async function readFirst() {
        const firstId = state.lastBundle?.entry?.[0]?.resource?.id;
        if (firstId) {
          await readPatient(firstId);
        } else {
          await runSearch();
        }
      }

      async function init() {
        state.metadata = await fetch("/metadata").then((response) => response.json());
        for (const row of state.metadata.accessProfiles.filter((item) => item.access_mode !== "other_if_officially_supported")) {
          const option = document.createElement("option");
          option.value = row.access_mode;
          option.textContent = row.access_mode;
          accessModeSelect.appendChild(option);
        }
        for (const row of state.metadata.scenarios) {
          const option = document.createElement("option");
          option.value = row.scenario_id;
          option.textContent = row.label;
          scenarioSelect.appendChild(option);
        }
        document.getElementById("searchButton").addEventListener("click", runSearch);
        document.getElementById("readFirstButton").addEventListener("click", readFirst);
        await refreshAudit();
        await runSearch();
      }

      init().catch((error) => {
        resultJson.textContent = String(error);
      });
    </script>
  </body>
</html>`;
}

const server = http.createServer((request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end("Missing request URL");
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? `${HOST}:${PORT}`}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/") {
    writeHtml(response, playgroundHtml());
    return;
  }

  if (request.method === "GET" && url.pathname === "/favicon.ico") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    });
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/metadata") {
    writeJson(response, 200, metadata());
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    writeJson(response, 200, health());
    return;
  }

  if (request.method === "GET" && url.pathname === "/audit") {
    writeJson(response, 200, auditLog());
    return;
  }

  if (request.method === "GET" && url.pathname === "/Patient") {
    const result = search({
      accessMode: url.searchParams.get("accessMode") ?? undefined,
      scenario: url.searchParams.get("scenario") ?? undefined,
      query: url.searchParams.get("query") ?? undefined,
    });
    writeJson(response, result.status, result.body, result.headers);
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/Patient/")) {
    const patientId = decodeURIComponent(url.pathname.split("/").pop() ?? "");
    const result = read(patientId, {
      accessMode: url.searchParams.get("accessMode") ?? undefined,
      scenario: url.searchParams.get("scenario") ?? undefined,
      view: url.searchParams.get("view") ?? undefined,
    });
    writeJson(response, result.status, result.body, result.headers);
    return;
  }

  writeJson(response, 404, {
    resourceType: "OperationOutcome",
    issue: [{ severity: "error", code: "not-found", diagnostics: "Unknown mock PDS endpoint." }],
  });
});

server.listen(PORT, HOST, () => {
  console.log(`mock-pds-fhir listening on http://${HOST}:${PORT}`);
});
