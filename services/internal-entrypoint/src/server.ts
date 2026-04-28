import fs from "node:fs";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { URLSearchParams } from "node:url";
import { type InternalEntrypointConfig, type InternalSurface } from "./config.js";
import {
  createSessionToken,
  serializeExpiredSessionCookie,
  serializeSessionCookie,
  verifyInternalPassword,
  verifySessionToken,
} from "./security.js";

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function send(
  response: ServerResponse,
  statusCode: number,
  body: string,
  headers: http.OutgoingHttpHeaders = {},
): void {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(body);
}

function redirect(
  response: ServerResponse,
  location: string,
  headers: http.OutgoingHttpHeaders = {},
): void {
  response.writeHead(303, {
    location,
    "cache-control": "no-store",
    ...headers,
  });
  response.end();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseCookie(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const chunk of (header ?? "").split(";")) {
    const [name, ...valueParts] = chunk.trim().split("=");
    if (name) {
      cookies[name] = valueParts.join("=");
    }
  }
  return cookies;
}

function isAuthenticated(request: IncomingMessage, config: InternalEntrypointConfig): boolean {
  const token = parseCookie(request.headers.cookie).vecells_internal_session;
  return verifySessionToken(token, config.sessionSecret);
}

async function readFormBody(request: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 8192) {
      throw new Error("REQUEST_TOO_LARGE");
    }
    chunks.push(buffer);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function renderLoginPage(message?: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vecells internal test</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f8fb; color: #18202f; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    section { width: min(100%, 380px); display: grid; gap: 18px; }
    h1 { margin: 0; font-size: 1.5rem; line-height: 1.2; }
    p { margin: 0; line-height: 1.5; color: #405068; }
    form { display: grid; gap: 12px; }
    label { display: grid; gap: 6px; font-weight: 700; }
    input { min-height: 42px; border: 1px solid #a9b5c6; border-radius: 6px; padding: 0 12px; font: inherit; }
    button { min-height: 42px; border: 0; border-radius: 6px; background: #155eef; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    .notice { border-left: 4px solid #155eef; background: #fff; padding: 12px; }
    .error { color: #a40024; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <section aria-labelledby="login-title">
      <h1 id="login-title">Internal test access</h1>
      <p class="notice">Internal testing only. Do not enter real patient data. This is not an official service.</p>
      ${message ? `<p class="error">${escapeHtml(message)}</p>` : ""}
      <form method="post" action="/login">
        <label>Shared password
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Continue</button>
      </form>
    </section>
  </main>
</body>
</html>`;
}

function renderMenuPage(config: InternalEntrypointConfig): string {
  const links = config.surfaces
    .map((surface) => `<li><a href="${surface.pathPrefix}">${escapeHtml(surface.label)}</a></li>`)
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vecells internal menu</title>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f8fb; color: #18202f; }
    header { background: #18202f; color: white; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    header p { margin: 0; font-weight: 700; }
    main { max-width: 920px; margin: 0 auto; padding: 28px 24px; display: grid; gap: 20px; }
    h1 { margin: 0; font-size: 1.75rem; }
    .banner { background: #fff3cd; border: 1px solid #e8c45d; color: #4f3b00; padding: 12px; border-radius: 6px; }
    ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    a { display: block; background: #fff; border: 1px solid #d7dee8; border-radius: 6px; padding: 14px; color: #174ea6; font-weight: 700; text-decoration: none; }
    button { border: 1px solid #d7dee8; border-radius: 6px; background: #fff; padding: 8px 12px; font: inherit; cursor: pointer; }
  </style>
</head>
<body>
  <header>
    <p>Vecells internal test environment</p>
    <form method="post" action="/logout"><button type="submit">Logout</button></form>
  </header>
  <main>
    <h1>Internal test menu</h1>
    <p class="banner">Synthetic and disposable data only. Do not enter real patient data. This deployment is not an official launch.</p>
    <form method="post" action="/reset-client-state"><button type="submit">Reset this browser state</button></form>
    <ul>${links}</ul>
  </main>
</body>
</html>`;
}

function renderClientResetPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset browser state</title>
</head>
<body>
  <p>Vecells internal test environment</p>
  <h1>Browser state reset</h1>
  <p>Synthetic local browser state for this internal entrypoint has been cleared.</p>
  <p><a href="/internal">Return to internal menu</a></p>
  <script>
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
    if ("indexedDB" in window && "databases" in indexedDB) {
      indexedDB.databases().then((databases) => {
        for (const database of databases) {
          if (database.name) indexedDB.deleteDatabase(database.name);
        }
      });
    }
  </script>
</body>
</html>`;
}

function renderMissingBuild(surface: InternalSurface): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(surface.label)}</title></head>
<body>
  <p>Vecells internal test environment</p>
  <h1>${escapeHtml(surface.label)}</h1>
  <p>This app build is missing. Run the app build before starting the internal entrypoint.</p>
</body>
</html>`;
}

function rewriteViteIndex(indexHtml: string, surface: InternalSurface): string {
  const prefix = surface.pathPrefix.replace(/\/$/, "");
  return indexHtml
    .replace(/(href|src)="\/assets\//g, `$1="${prefix}/assets/`)
    .replace(/(href|src)="\/vite.svg"/g, `$1="${prefix}/vite.svg"`)
    .replace(
      "<body>",
      `<body><div role="status" style="position:sticky;top:0;z-index:2147483647;background:#fff3cd;color:#4f3b00;border-bottom:1px solid #e8c45d;padding:8px 12px;font-family:system-ui,sans-serif;font-size:14px;">Internal test environment. Synthetic and disposable data only. Do not enter real patient data.</div>`,
    );
}

function safeJoin(root: string, relativePath: string): string | undefined {
  const resolved = path.resolve(root, relativePath);
  return resolved.startsWith(path.resolve(root)) ? resolved : undefined;
}

function serveFile(response: ServerResponse, filePath: string): void {
  const extension = path.extname(filePath);
  response.writeHead(200, {
    "content-type": MIME_TYPES[extension] ?? "application/octet-stream",
    "cache-control": extension === ".html" ? "no-store" : "public, max-age=3600",
  });
  fs.createReadStream(filePath).pipe(response);
}

function serveSurface(
  response: ServerResponse,
  pathname: string,
  surface: InternalSurface,
  config: InternalEntrypointConfig,
): void {
  const root = path.join(config.repoRoot, surface.distDir);
  const relative = decodeURIComponent(pathname.slice(surface.pathPrefix.length));
  const requestedPath = relative && !relative.endsWith("/") ? relative : "index.html";
  const candidate = safeJoin(root, requestedPath);

  if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    if (path.basename(candidate) === "index.html") {
      send(response, 200, rewriteViteIndex(fs.readFileSync(candidate, "utf8"), surface));
      return;
    }
    serveFile(response, candidate);
    return;
  }

  const indexPath = path.join(root, "index.html");
  if (fs.existsSync(indexPath)) {
    send(response, 200, rewriteViteIndex(fs.readFileSync(indexPath, "utf8"), surface));
    return;
  }

  send(response, 503, renderMissingBuild(surface));
}

export function createInternalEntrypointServer(config: InternalEntrypointConfig): http.Server {
  return http.createServer(async (request, response) => {
    const method = request.method?.toUpperCase() ?? "GET";
    const url = new URL(request.url ?? "/", "http://internal.entrypoint");
    const pathname = url.pathname;
    const authenticated = isAuthenticated(request, config);

    if (pathname === "/health") {
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(JSON.stringify({ ok: true, service: "internal-entrypoint" }));
      return;
    }

    if ((pathname === "/" || pathname === "/login") && method === "GET") {
      if (authenticated) {
        redirect(response, "/internal");
        return;
      }
      send(response, 200, renderLoginPage());
      return;
    }

    if (pathname === "/login" && method === "POST") {
      try {
        const form = await readFormBody(request);
        const password = form.get("password") ?? "";
        if (!verifyInternalPassword(password, config.passwordHash)) {
          send(response, 401, renderLoginPage("Access denied."));
          return;
        }
        const token = createSessionToken(config.sessionSecret);
        redirect(response, "/internal", {
          "set-cookie": serializeSessionCookie(token, config.cookieSecure),
        });
      } catch {
        send(response, 400, renderLoginPage("Unable to process the login request."));
      }
      return;
    }

    if (pathname === "/logout" && (method === "POST" || method === "GET")) {
      redirect(response, "/", {
        "set-cookie": serializeExpiredSessionCookie(config.cookieSecure),
      });
      return;
    }

    if (!authenticated) {
      send(response, 200, renderLoginPage());
      return;
    }

    if (pathname === "/internal" && method === "GET") {
      send(response, 200, renderMenuPage(config));
      return;
    }

    if (pathname === "/reset-client-state" && (method === "POST" || method === "GET")) {
      send(response, 200, renderClientResetPage());
      return;
    }

    const surface = config.surfaces.find((item) => pathname.startsWith(item.pathPrefix));
    if (surface && method === "GET") {
      serveSurface(response, pathname, surface, config);
      return;
    }

    send(response, 404, "<!doctype html><html><body><h1>Not found</h1></body></html>");
  });
}
