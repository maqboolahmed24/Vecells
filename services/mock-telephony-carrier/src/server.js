import http from "node:http";
import { URL } from "node:url";

import {
  PACK,
  advanceCall,
  assignNumber,
  getCall,
  health,
  listCalls,
  listNumbers,
  registry,
  releaseNumber,
  retryWebhook,
  simulateCall,
} from "./carrierCore.js";

const HOST = process.env.MOCK_TELEPHONY_HOST ?? "127.0.0.1";
const PORT = Number(process.env.MOCK_TELEPHONY_PORT ?? "4180");

function writeJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
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

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function playgroundHtml() {
  const numberOptions = PACK.number_inventory
    .filter((row) => row.voice_enabled === "yes")
    .map((row) => `<option value="${row.number_id}">${row.number_id} · ${row.e164_or_placeholder}</option>`)
    .join("");
  const scenarioOptions = PACK.call_scenarios
    .map((row) => `<option value="${row.scenario_id}">${row.label}</option>`)
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:," />
    <title>Vecells MOCK_TELEPHONY_SANDBOX</title>
    <style>
      :root {
        --canvas: #f5f7fa;
        --panel: #ffffff;
        --text: #1d2939;
        --muted: #667085;
        --line: #d0d5dd;
        --primary: #0b57d0;
        --voice: #7a5af8;
        --secondary: #0e9384;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(11, 87, 208, 0.12), transparent 30%),
          radial-gradient(circle at top right, rgba(122, 90, 248, 0.1), transparent 24%),
          var(--canvas);
      }
      h1, h2, p, pre { margin: 0; }
      button, select {
        font: inherit;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 0 14px;
        background: #fff;
      }
      button { cursor: pointer; }
      .shell {
        max-width: 1440px;
        margin: 0 auto;
        padding: 24px;
      }
      .header, .panel, .event {
        border: 1px solid rgba(208, 213, 221, 0.96);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 20px 48px rgba(16, 24, 40, 0.08);
      }
      .header {
        position: sticky;
        top: 0;
        z-index: 4;
        min-height: 72px;
        padding: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
      }
      .brand { display: flex; align-items: center; gap: 14px; }
      .mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 700;
        background: linear-gradient(135deg, var(--primary), var(--voice));
      }
      .ribbon, .chip {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
      }
      .ribbon { color: var(--primary); background: rgba(11, 87, 208, 0.1); }
      .chip { background: rgba(14, 147, 132, 0.1); }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(340px, 420px);
        gap: 20px;
      }
      .panel { padding: 18px; }
      .controls, .facts, .actions { display: flex; gap: 12px; flex-wrap: wrap; }
      .actions { margin-top: 16px; }
      .actions button.primary {
        color: #fff;
        border-color: transparent;
        background: linear-gradient(135deg, var(--primary), #3478ff);
      }
      .event-list { display: grid; gap: 12px; margin-top: 16px; }
      .event {
        padding: 14px;
        background: rgba(239, 242, 246, 0.72);
      }
      .event strong { display: block; margin-bottom: 4px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      pre {
        overflow: auto;
        max-height: 520px;
        padding: 16px;
        border-radius: 18px;
        background: #0f1728;
        color: #dce7f6;
      }
      @media (max-width: 980px) {
        .layout { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="shell" data-testid="telephony-sandbox-shell">
      <header class="header">
        <div class="brand">
          <div class="mark">V</div>
          <div>
            <div class="ribbon">MOCK_TELEPHONY_SANDBOX</div>
            <h1>Carrier twin sandbox</h1>
          </div>
        </div>
        <div class="facts" id="health-facts"></div>
      </header>
      <section class="layout">
        <article class="panel">
          <h2>Simulate a call</h2>
          <p>Exercise the carrier seam while preserving transport-vs-truth separation.</p>
          <div class="controls" style="margin-top:16px">
            <select id="number-id">${numberOptions}</select>
            <select id="scenario-id">${scenarioOptions}</select>
          </div>
          <div class="actions">
            <button class="primary" data-testid="simulate-button" id="simulate-button">Simulate call</button>
            <button id="advance-button">Advance lifecycle</button>
            <button id="retry-button">Retry webhook</button>
          </div>
          <div class="event-list" id="call-list"></div>
        </article>
        <aside class="panel">
          <h2>Selected call</h2>
          <p class="mono" id="selected-call-id">No call selected</p>
          <pre data-testid="call-json" id="call-json">Select or simulate a call to inspect it here.</pre>
        </aside>
      </section>
    </main>
    <script type="module">
      const state = { selectedCallId: null, calls: [] };

      async function fetchJson(url, options) {
        const response = await fetch(url, options);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Request failed");
        }
        return payload;
      }

      function renderFacts(health) {
        const facts = document.getElementById("health-facts");
        facts.innerHTML = "";
        [
          "active calls: " + health.active_calls,
          "assigned numbers: " + health.assigned_numbers,
          "webhook alerts: " + health.webhook_alerts,
        ].forEach((text) => {
          const chip = document.createElement("span");
          chip.className = "chip";
          chip.textContent = text;
          facts.appendChild(chip);
        });
      }

      function renderCallList() {
        const list = document.getElementById("call-list");
        list.innerHTML = "";
        state.calls.forEach((call) => {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "event";
          card.dataset.callId = call.call_id;
          card.innerHTML =
            "<strong>" +
            call.call_id +
            '</strong><span class="mono">' +
            call.status +
            "</span><p>" +
            call.summary +
            "</p>";
          card.addEventListener("click", () => selectCall(call.call_id));
          list.appendChild(card);
        });
      }

      function selectCall(callId) {
        state.selectedCallId = callId;
        const call = state.calls.find((row) => row.call_id === callId);
        document.getElementById("selected-call-id").textContent = callId;
        document.getElementById("call-json").textContent = JSON.stringify(call, null, 2);
      }

      async function refreshAll(selectNewest = false) {
        const [health, numberRows, callRows] = await Promise.all([
          fetchJson("/api/health"),
          fetchJson("/api/numbers"),
          fetchJson("/api/calls"),
        ]);
        renderFacts(health);
        state.calls = callRows.calls;
        renderCallList();
        if (selectNewest && state.calls[0]) {
          selectCall(state.calls[0].call_id);
        } else if (state.selectedCallId) {
          selectCall(state.selectedCallId);
        }
      }

      document.getElementById("simulate-button").addEventListener("click", async () => {
        const numberId = document.getElementById("number-id").value;
        const scenarioId = document.getElementById("scenario-id").value;
        await fetchJson("/api/calls/simulate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ number_id: numberId, scenario_id: scenarioId }),
        });
        await refreshAll(true);
      });

      document.getElementById("advance-button").addEventListener("click", async () => {
        if (!state.selectedCallId) {
          return;
        }
        await fetchJson("/api/calls/" + state.selectedCallId + "/advance", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        await refreshAll(false);
      });

      document.getElementById("retry-button").addEventListener("click", async () => {
        if (!state.selectedCallId) {
          return;
        }
        await fetchJson("/api/calls/" + state.selectedCallId + "/retry-webhook", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        await refreshAll(false);
      });

      refreshAll(true);
    </script>
  </body>
</html>`;
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (request.method === "GET" && url.pathname === "/") {
      writeHtml(response, playgroundHtml());
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/health") {
      writeJson(response, 200, health());
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/registry") {
      writeJson(response, 200, registry());
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/numbers") {
      writeJson(response, 200, { numbers: listNumbers() });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/calls") {
      writeJson(response, 200, { calls: listCalls() });
      return;
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/calls/")) {
      const callId = url.pathname.split("/").pop();
      const call = getCall(callId);
      if (!call) {
        writeJson(response, 404, { error: "Call not found." });
        return;
      }
      writeJson(response, 200, { call });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/numbers/assign") {
      const payload = await readBody(request);
      const result = assignNumber(payload);
      writeJson(response, result.status, result.ok ? result : { error: result.error });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/numbers/release") {
      const payload = await readBody(request);
      const result = releaseNumber(payload);
      writeJson(response, result.status, result.ok ? result : { error: result.error });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/calls/simulate") {
      const payload = await readBody(request);
      const result = simulateCall(payload);
      writeJson(response, result.status, result.ok ? result : { error: result.error });
      return;
    }
    if (request.method === "POST" && url.pathname.startsWith("/api/calls/") && url.pathname.endsWith("/advance")) {
      const callId = url.pathname.split("/")[3];
      const result = advanceCall(callId);
      writeJson(response, result.status, result.ok ? result : { error: result.error });
      return;
    }
    if (request.method === "POST" && url.pathname.startsWith("/api/calls/") && url.pathname.endsWith("/retry-webhook")) {
      const callId = url.pathname.split("/")[3];
      const result = retryWebhook(callId);
      writeJson(response, result.status, result.ok ? result : { error: result.error });
      return;
    }
    writeJson(response, 404, { error: "Not found." });
  } catch (error) {
    writeJson(response, 500, { error: error instanceof Error ? error.message : "Unexpected error." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`mock-telephony-carrier listening at http://${HOST}:${PORT}`);
});
