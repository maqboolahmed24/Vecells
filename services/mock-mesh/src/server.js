import http from "node:http";
import { URL } from "node:url";

import {
  PACK,
  advanceMessage,
  dispatchMessage,
  getMessage,
  health,
  listMessages,
  registry,
  replayMessage,
  validateWorkflowChoice,
} from "./meshCore.js";

const HOST = process.env.MOCK_MESH_HOST ?? "127.0.0.1";
const PORT = Number(process.env.MOCK_MESH_PORT ?? "4178");

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
  const mailboxOptions = PACK.mailboxes
    .map(
      (row) =>
        `<option value="${row.mailbox_key}">${row.display_name} (${row.owner_ods})</option>`,
    )
    .join("");
  const workflowOptions = PACK.workflow_rows
    .map((row) => `<option value="${row.workflow_id}">${row.workflow_id}</option>`)
    .join("");
  const scenarioOptions = PACK.mock_service.scenarios
    .map((row) => `<option value="${row.scenario_id}">${row.label}</option>`)
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:," />
    <title>Vecells MOCK_MESH_SANDBOX</title>
    <style>
      :root {
        --canvas: #f6f7f9;
        --panel: #ffffff;
        --inset: #eef1f4;
        --text: #1d2939;
        --muted: #667085;
        --line: #d0d5dd;
        --primary: #155eef;
        --secondary: #0e9384;
        --delivery: #7a5af8;
        --caution: #b54708;
        --blocked: #c24141;
        --success: #12b76a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(21, 94, 239, 0.12), transparent 30%),
          radial-gradient(circle at top right, rgba(14, 147, 132, 0.1), transparent 26%),
          var(--canvas);
      }
      h1, h2, h3, p, pre { margin: 0; }
      button, input, select {
        font: inherit;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 0 14px;
        background: #fff;
      }
      button { cursor: pointer; }
      button:focus-visible, select:focus-visible, input:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
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
        background: linear-gradient(135deg, var(--primary), var(--delivery));
      }
      .ribbon, .chip {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
      }
      .ribbon { color: var(--primary); background: rgba(21, 94, 239, 0.1); }
      .chip { background: var(--inset); }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(340px, 420px);
        gap: 20px;
      }
      .panel { padding: 18px; }
      .controls, .facts, .row, .actions {
        display: flex;
        gap: 12px;
      }
      .controls { flex-wrap: wrap; }
      .facts { flex-wrap: wrap; margin-top: 12px; }
      .actions { margin-top: 16px; }
      .actions button.primary {
        color: #fff;
        border-color: transparent;
        background: linear-gradient(135deg, var(--primary), #2b7fff);
      }
      .event-list {
        display: grid;
        gap: 12px;
        margin-top: 16px;
      }
      .event {
        padding: 14px;
        background: var(--inset);
      }
      .event strong { display: block; margin-bottom: 4px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      pre {
        overflow: auto;
        max-height: 480px;
        padding: 16px;
        border-radius: 18px;
        background: #0f1728;
        color: #dce7f6;
      }
      @media (max-width: 980px) {
        .layout { grid-template-columns: 1fr; }
      }
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell" data-testid="mesh-sandbox-shell">
      <header class="header">
        <div class="brand">
          <div class="mark">V</div>
          <div>
            <div class="ribbon">MOCK_MESH_SANDBOX</div>
            <h1>Signal transport sandbox</h1>
          </div>
        </div>
        <div class="facts" id="health-facts"></div>
      </header>

      <section class="layout">
        <article class="panel">
          <h2>Dispatch</h2>
          <p>Exercise the transport seam without claiming business completion.</p>
          <div class="controls" style="margin-top:16px">
            <select id="from-mailbox">${mailboxOptions}</select>
            <select id="to-mailbox">${mailboxOptions}</select>
            <select id="workflow-id">${workflowOptions}</select>
            <select id="scenario-id">${scenarioOptions}</select>
          </div>
          <div class="actions">
            <button class="primary" data-testid="dispatch-button" id="dispatch-button">Dispatch</button>
            <button id="advance-button">Advance lifecycle</button>
            <button id="replay-button">Apply replay guard</button>
          </div>
          <div class="event-list" id="message-list"></div>
        </article>

        <aside class="panel">
          <h2>Selected message</h2>
          <p class="mono" id="selected-message-id">No message selected</p>
          <pre data-testid="message-json" id="message-json">Select or dispatch a message to inspect it here.</pre>
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

      async function refreshHealth() {
        const payload = await fetchJson("/api/health");
        const facts = document.getElementById("health-facts");
        facts.innerHTML = [
          ["mailboxes", payload.mailbox_count],
          ["workflows", payload.workflow_count],
          ["messages", payload.message_count],
          ["degraded", payload.degraded_message_count],
        ].map(([label, value]) => \`<span class="chip">\${label}: \${value}</span>\`).join("");
      }

      function renderMessages() {
        const list = document.getElementById("message-list");
        list.innerHTML = state.messages.map((message) => {
          const selected = message.message_id === state.selectedMessageId ? "border-color: var(--primary)" : "";
          return \`<button class="event" style="\${selected}" data-message-id="\${message.message_id}">
            <strong>\${message.message_id}</strong>
            <div>\${message.workflow_id} · \${message.status}</div>
            <div>\${message.summary}</div>
          </button>\`;
        }).join("");

        for (const button of list.querySelectorAll("[data-message-id]")) {
          button.addEventListener("click", async () => {
            state.selectedMessageId = button.dataset.messageId;
            const payload = await fetchJson(\`/api/messages/\${state.selectedMessageId}\`);
            document.getElementById("selected-message-id").textContent = payload.message_id;
            document.getElementById("message-json").textContent = JSON.stringify(payload, null, 2);
            renderMessages();
          });
        }
      }

      async function refreshMessages() {
        const payload = await fetchJson("/api/messages");
        state.messages = payload.messages;
        if (!state.selectedMessageId && state.messages.length) {
          state.selectedMessageId = state.messages[0].message_id;
          document.getElementById("selected-message-id").textContent = state.selectedMessageId;
          document.getElementById("message-json").textContent = JSON.stringify(state.messages[0], null, 2);
        }
        renderMessages();
      }

      document.getElementById("dispatch-button").addEventListener("click", async () => {
        const body = {
          from_mailbox_key: document.getElementById("from-mailbox").value,
          to_mailbox_key: document.getElementById("to-mailbox").value,
          workflow_id: document.getElementById("workflow-id").value,
          scenario_id: document.getElementById("scenario-id").value,
          summary: "Sandbox dispatch",
        };
        try {
          const payload = await fetchJson("/api/dispatch", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          state.selectedMessageId = payload.payload.message_id;
          await refreshMessages();
        } catch (error) {
          document.getElementById("message-json").textContent = String(error.message || error);
        }
      });

      document.getElementById("advance-button").addEventListener("click", async () => {
        if (!state.selectedMessageId) return;
        const payload = await fetchJson(\`/api/messages/\${state.selectedMessageId}/advance\`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        document.getElementById("message-json").textContent = JSON.stringify(payload.payload, null, 2);
        await refreshMessages();
      });

      document.getElementById("replay-button").addEventListener("click", async () => {
        if (!state.selectedMessageId) return;
        const payload = await fetchJson(\`/api/messages/\${state.selectedMessageId}/replay\`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        document.getElementById("message-json").textContent = JSON.stringify(payload.payload, null, 2);
        await refreshMessages();
      });

      refreshHealth();
      refreshMessages();
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

  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);

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

    if (request.method === "GET" && url.pathname === "/api/messages") {
      const mailboxKey = url.searchParams.get("mailbox") ?? "";
      writeJson(response, 200, { messages: listMessages(mailboxKey) });
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/messages/")) {
      const messageId = url.pathname.split("/").filter(Boolean)[2];
      const message = getMessage(messageId);
      if (!message) {
        writeJson(response, 404, { error: "Message not found." });
        return;
      }
      writeJson(response, 200, message);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/validate") {
      const body = await readBody(request);
      writeJson(response, 200, validateWorkflowChoice(body.mailbox_key, body.workflow_id));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/dispatch") {
      const body = await readBody(request);
      const result = dispatchMessage(body);
      writeJson(response, result.status, result.ok ? result : { error: result.error });
      return;
    }

    if (request.method === "POST" && url.pathname.endsWith("/advance")) {
      const messageId = url.pathname.split("/").filter(Boolean)[2];
      const result = advanceMessage(messageId);
      writeJson(response, result.status, result.ok ? result : { error: result.error });
      return;
    }

    if (request.method === "POST" && url.pathname.endsWith("/replay")) {
      const messageId = url.pathname.split("/").filter(Boolean)[2];
      const result = replayMessage(messageId);
      writeJson(response, result.status, result.ok ? result : { error: result.error });
      return;
    }

    writeJson(response, 404, { error: "Not found." });
  } catch (error) {
    writeJson(response, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error.",
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`mock-mesh listening on http://${HOST}:${PORT}`);
});
