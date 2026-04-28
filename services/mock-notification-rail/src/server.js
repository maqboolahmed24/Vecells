import http from "node:http";
import { URL } from "node:url";

import {
  PACK,
  health,
  listMessages,
  registry,
  repairMessage,
  retryWebhook,
  settleMessage,
  simulateMessage,
} from "./railCore.js";

const HOST = process.env.MOCK_NOTIFICATION_HOST ?? "127.0.0.1";
const PORT = Number(process.env.MOCK_NOTIFICATION_PORT ?? "4190");

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
  const templateOptions = PACK.template_registry
    .map((row) => `<option value="${row.template_id}">${row.template_id} · ${row.channel}</option>`)
    .join("");
  const scenarioOptions = PACK.delivery_scenarios
    .map((row) => `<option value="${row.scenario_id}">${row.label}</option>`)
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:," />
    <title>Vecells MOCK_NOTIFICATION_RAIL</title>
    <style>
      :root {
        --canvas: #f7f8fa;
        --panel: #fff;
        --text: #1d2939;
        --muted: #667085;
        --line: #d0d5dd;
        --primary: #2457f5;
        --secondary: #c11574;
        --email: #7a5af8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(36, 87, 245, 0.12), transparent 32%),
          radial-gradient(circle at top right, rgba(193, 21, 116, 0.08), transparent 22%),
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
        background: rgba(255, 255, 255, 0.95);
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
        background: linear-gradient(135deg, var(--primary), var(--secondary));
      }
      .ribbon, .chip {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
      }
      .ribbon { color: var(--primary); background: rgba(36, 87, 245, 0.1); }
      .chip { background: rgba(122, 90, 248, 0.1); color: var(--email); }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(360px, 420px);
        gap: 20px;
      }
      .panel { padding: 18px; }
      .controls, .actions, .facts { display: flex; gap: 12px; flex-wrap: wrap; }
      .actions { margin-top: 16px; }
      .actions .primary {
        color: #fff;
        border-color: transparent;
        background: linear-gradient(135deg, var(--primary), #4f7cff);
      }
      .actions .secondary {
        color: #fff;
        border-color: transparent;
        background: linear-gradient(135deg, var(--secondary), #dc4e94);
      }
      .message-list { display: grid; gap: 12px; margin-top: 16px; }
      .event {
        padding: 14px;
        background: rgba(239, 242, 246, 0.72);
      }
      .event strong { display: block; margin-bottom: 4px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      pre {
        overflow: auto;
        max-height: 560px;
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
    <main class="shell" data-testid="notification-sandbox-shell">
      <header class="header">
        <div class="brand">
          <div class="mark">V</div>
          <div>
            <div class="ribbon">MOCK_NOTIFICATION_RAIL</div>
            <h1>Notification rail sandbox</h1>
          </div>
        </div>
        <div class="facts" id="health-facts"></div>
      </header>
      <section class="layout">
        <article class="panel">
          <h2>Simulate a notification</h2>
          <p>Exercise provider acceptance, delivery evidence, dispute, and repair semantics without using live providers.</p>
          <div class="controls" style="margin-top:16px">
            <select id="template-id">${templateOptions}</select>
            <select id="scenario-id">${scenarioOptions}</select>
          </div>
          <div class="actions">
            <button class="primary" data-testid="simulate-button" id="simulate-button">Simulate</button>
            <button class="secondary" id="retry-button">Retry webhook</button>
            <button id="repair-button">Repair</button>
            <button id="settle-button">Settle</button>
          </div>
          <div class="message-list" id="message-list"></div>
        </article>
        <aside class="panel">
          <h2>Selected message</h2>
          <p class="mono" id="selected-message-id">No message selected</p>
          <pre data-testid="message-json" id="message-json">Select or simulate a message to inspect it here.</pre>
        </aside>
      </section>
    </main>
    <script type="module">
      const state = { selectedMessageId: null, messages: [] };

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
          "messages: " + health.message_count,
          "repair open: " + health.repair_open_count,
          "webhook alerts: " + health.webhook_alert_count,
        ].forEach((label) => {
          const chip = document.createElement("span");
          chip.className = "chip";
          chip.textContent = label;
          facts.appendChild(chip);
        });
      }

      function renderSelection() {
        const message = state.messages.find((row) => row.message_id === state.selectedMessageId);
        document.getElementById("selected-message-id").textContent = message ? message.message_id : "No message selected";
        document.getElementById("message-json").textContent = message
          ? JSON.stringify(message, null, 2)
          : "Select or simulate a message to inspect it here.";
      }

      function renderMessages(messages) {
        state.messages = messages;
        if (!state.selectedMessageId && messages.length) {
          state.selectedMessageId = messages[0].message_id;
        }
        const root = document.getElementById("message-list");
        root.innerHTML = "";
        messages.forEach((message) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "event";
          button.innerHTML =
            "<strong>" + message.message_id + "</strong>" +
            "<div>" + message.summary + "</div>" +
            "<div class='mono'>" + message.delivery_evidence_state + " / " + message.authoritative_outcome_state + "</div>";
          button.addEventListener("click", () => {
            state.selectedMessageId = message.message_id;
            renderSelection();
          });
          root.appendChild(button);
        });
        renderSelection();
      }

      async function refresh() {
        const [healthPayload, messagesPayload] = await Promise.all([
          fetchJson("/api/health"),
          fetchJson("/api/messages"),
        ]);
        renderFacts(healthPayload);
        renderMessages(messagesPayload.messages);
      }

      async function mutate(url, body) {
        const payload = await fetchJson(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
        renderMessages(payload.messages);
        renderSelection();
        const healthPayload = await fetchJson("/api/health");
        renderFacts(healthPayload);
      }

      document.getElementById("simulate-button").addEventListener("click", () => {
        mutate("/api/messages/simulate", {
          template_id: document.getElementById("template-id").value,
          scenario_id: document.getElementById("scenario-id").value,
        }).catch((error) => window.alert(error.message));
      });

      document.getElementById("retry-button").addEventListener("click", () => {
        if (!state.selectedMessageId) return;
        mutate("/api/messages/" + state.selectedMessageId + "/retry-webhook").catch((error) => window.alert(error.message));
      });

      document.getElementById("repair-button").addEventListener("click", () => {
        if (!state.selectedMessageId) return;
        mutate("/api/messages/" + state.selectedMessageId + "/repair").catch((error) => window.alert(error.message));
      });

      document.getElementById("settle-button").addEventListener("click", () => {
        if (!state.selectedMessageId) return;
        mutate("/api/messages/" + state.selectedMessageId + "/settle").catch((error) => window.alert(error.message));
      });

      refresh().catch((error) => {
        document.getElementById("message-json").textContent = error.message;
      });
    </script>
  </body>
</html>`;
}

async function handleMutatingRequest(response, request, handler, messageId = null) {
  try {
    const body = await readBody(request);
    const result = handler(messageId ?? body, body);
    if (!result.ok) {
      writeJson(response, result.status, { error: result.error });
      return;
    }
    writeJson(response, result.status, result);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : "Request failed." });
  }
}

const server = http.createServer(async (request, response) => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${HOST}:${PORT}`}`);
  const pathname = url.pathname;

  if (method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    response.end();
    return;
  }

  if (method === "GET" && pathname === "/") {
    writeHtml(response, playgroundHtml());
    return;
  }
  if (method === "GET" && pathname === "/api/health") {
    writeJson(response, 200, health());
    return;
  }
  if (method === "GET" && pathname === "/api/registry") {
    writeJson(response, 200, registry());
    return;
  }
  if (method === "GET" && pathname === "/api/messages") {
    writeJson(response, 200, { messages: listMessages() });
    return;
  }
  if (method === "POST" && pathname === "/api/messages/simulate") {
    await handleMutatingRequest(response, request, (_unused, body) => simulateMessage(body));
    return;
  }

  const retryMatch = pathname.match(/^\/api\/messages\/([^/]+)\/retry-webhook$/);
  if (method === "POST" && retryMatch) {
    await handleMutatingRequest(response, request, (messageId) => retryWebhook(messageId), retryMatch[1]);
    return;
  }

  const repairMatch = pathname.match(/^\/api\/messages\/([^/]+)\/repair$/);
  if (method === "POST" && repairMatch) {
    await handleMutatingRequest(response, request, (messageId) => repairMessage(messageId), repairMatch[1]);
    return;
  }

  const settleMatch = pathname.match(/^\/api\/messages\/([^/]+)\/settle$/);
  if (method === "POST" && settleMatch) {
    await handleMutatingRequest(response, request, (messageId) => settleMessage(messageId), settleMatch[1]);
    return;
  }

  writeJson(response, 404, { error: "Not found." });
});

server.listen(PORT, HOST, () => {
  console.log(`mock-notification-rail listening on http://${HOST}:${PORT}`);
});
