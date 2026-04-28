import http from "node:http";
import { URL } from "node:url";

import { PACK, health, listJobs, registry, retryWebhook, simulateJob, supersedeJob } from "./transcriptionCore.js";

const HOST = process.env.MOCK_TRANSCRIPTION_HOST ?? "127.0.0.1";
const PORT = Number(process.env.MOCK_TRANSCRIPTION_PORT ?? "4200");

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
  const profileOptions = registry()
    .profiles.map((row) => `<option value="${row.job_profile_id}">${row.profile_label}</option>`)
    .join("");
  const scenarioOptions = registry()
    .scenarios.map((row) => `<option value="${row.scenario_id}">${row.label}</option>`)
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:," />
    <title>Vecells MOCK_TRANSCRIPTION_ENGINE</title>
    <style>
      :root {
        --canvas: #f6f8fb;
        --panel: #ffffff;
        --text: #1d2939;
        --muted: #667085;
        --line: #d0d5dd;
        --primary: #155eef;
        --secondary: #7a5af8;
        --transcript: #0e9384;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(21, 94, 239, 0.1), transparent 28%),
          radial-gradient(circle at top right, rgba(122, 90, 248, 0.08), transparent 18%),
          var(--canvas);
      }
      button, select {
        font: inherit;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 14px;
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        min-height: 72px;
        padding: 18px;
        margin-bottom: 20px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: white;
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
      .ribbon { color: var(--primary); background: rgba(21, 94, 239, 0.1); }
      .chip { color: var(--transcript); background: rgba(14, 147, 132, 0.1); }
      .layout {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(360px, 420px);
        gap: 20px;
      }
      .panel { padding: 18px; }
      .controls, .actions, .facts { display: flex; gap: 12px; flex-wrap: wrap; }
      .actions { margin-top: 16px; }
      .actions .primary {
        color: white;
        border-color: transparent;
        background: linear-gradient(135deg, var(--primary), #4f7cff);
      }
      .actions .secondary {
        color: white;
        border-color: transparent;
        background: linear-gradient(135deg, var(--transcript), #10b2a0);
      }
      .job-list { display: grid; gap: 12px; margin-top: 16px; }
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
    <main class="shell" data-testid="transcription-sandbox-shell">
      <header class="header">
        <div class="brand">
          <div class="mark">V</div>
          <div>
            <div class="ribbon">MOCK_TRANSCRIPTION_ENGINE</div>
            <h1>Transcript sandbox</h1>
          </div>
        </div>
        <div class="facts" id="health-facts"></div>
      </header>
      <section class="layout">
        <article class="panel">
          <h2>Simulate a transcript job</h2>
          <p>Exercise partial, failed, signature-retry, and supersession behavior without live providers.</p>
          <div class="controls" style="margin-top:16px">
            <select id="profile-id">${profileOptions}</select>
            <select id="scenario-id">${scenarioOptions}</select>
          </div>
          <div class="actions">
            <button class="primary" data-testid="simulate-button" id="simulate-button">Simulate</button>
            <button class="secondary" id="retry-button">Retry webhook</button>
            <button id="supersede-button">Supersede</button>
          </div>
          <div class="job-list" id="job-list"></div>
        </article>
        <aside class="panel">
          <h2>Selected job</h2>
          <p class="mono" id="selected-job-id">No job selected</p>
          <pre data-testid="job-json" id="job-json">Select or simulate a job to inspect it here.</pre>
        </aside>
      </section>
    </main>
    <script type="module">
      const state = { selectedJobId: null, jobs: [] };

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
          "jobs: " + health.job_count,
          "partial: " + health.partial_count,
          "callback alerts: " + health.callback_alert_count,
        ].forEach((label) => {
          const chip = document.createElement("span");
          chip.className = "chip";
          chip.textContent = label;
          facts.appendChild(chip);
        });
      }

      function renderSelection() {
        const job = state.jobs.find((row) => row.job_id === state.selectedJobId);
        document.getElementById("selected-job-id").textContent = job ? job.job_id : "No job selected";
        document.getElementById("job-json").textContent = job
          ? JSON.stringify(job, null, 2)
          : "Select or simulate a job to inspect it here.";
      }

      function renderJobs(jobs) {
        state.jobs = jobs;
        if (!state.selectedJobId && jobs.length) {
          state.selectedJobId = jobs[0].job_id;
        }
        const container = document.getElementById("job-list");
        container.innerHTML = "";
        jobs.forEach((job) => {
          const button = document.createElement("button");
          button.className = "event";
          button.type = "button";
          button.textContent = job.job_id + " · " + job.transcript_state + " · " + job.readiness_state;
          button.addEventListener("click", () => {
            state.selectedJobId = job.job_id;
            renderSelection();
          });
          container.appendChild(button);
        });
        renderSelection();
      }

      async function sync() {
        const [healthPayload, jobsPayload] = await Promise.all([
          fetchJson("/api/health"),
          fetchJson("/api/jobs"),
        ]);
        renderFacts(healthPayload.health);
        renderJobs(jobsPayload.jobs);
      }

      document.getElementById("simulate-button").addEventListener("click", async () => {
        const payload = await fetchJson("/api/jobs/simulate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            job_profile_id: document.getElementById("profile-id").value,
            scenario_id: document.getElementById("scenario-id").value,
          }),
        });
        state.selectedJobId = payload.job.job_id;
        renderJobs(payload.jobs);
        await sync();
      });

      document.getElementById("retry-button").addEventListener("click", async () => {
        if (!state.selectedJobId) return;
        const payload = await fetchJson("/api/jobs/" + state.selectedJobId + "/retry-webhook", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        state.selectedJobId = payload.job.job_id;
        renderJobs(payload.jobs);
        await sync();
      });

      document.getElementById("supersede-button").addEventListener("click", async () => {
        if (!state.selectedJobId) return;
        const payload = await fetchJson("/api/jobs/" + state.selectedJobId + "/supersede", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        state.selectedJobId = payload.job.job_id;
        renderJobs(payload.jobs);
        await sync();
      });

      sync().catch((error) => {
        document.getElementById("job-json").textContent = String(error);
      });
    </script>
  </body>
</html>`;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    response.end();
    return;
  }

  try {
    if (request.method === "GET" && url.pathname === "/") {
      writeHtml(response, playgroundHtml());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      writeJson(response, 200, { health: health() });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/jobs") {
      writeJson(response, 200, { jobs: listJobs() });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/registry") {
      writeJson(response, 200, registry());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/jobs/simulate") {
      const payload = await readBody(request);
      const result = simulateJob(payload);
      writeJson(response, result.status, result);
      return;
    }

    if (request.method === "POST" && url.pathname.endsWith("/retry-webhook")) {
      const jobId = url.pathname.split("/")[3];
      const result = retryWebhook(jobId);
      writeJson(response, result.status, result);
      return;
    }

    if (request.method === "POST" && url.pathname.endsWith("/supersede")) {
      const jobId = url.pathname.split("/")[3];
      const result = supersedeJob(jobId);
      writeJson(response, result.status, result);
      return;
    }

    writeJson(response, 404, { error: "Not found." });
  } catch (error) {
    writeJson(response, 500, { error: error instanceof Error ? error.message : "Unknown server error." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`mock-transcription-engine listening on http://${HOST}:${PORT}`);
});
