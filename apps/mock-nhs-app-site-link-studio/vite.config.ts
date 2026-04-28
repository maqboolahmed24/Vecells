import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function wellKnownHeaders(): Plugin {
  const cacheControl = "public, max-age=60, must-revalidate";
  const applyHeaders = (url: string | undefined, res: { setHeader(name: string, value: string): void }) => {
    if (!url || !url.startsWith("/.well-known/")) {
      return;
    }
    if (url === "/.well-known/assetlinks.json" || url === "/.well-known/apple-app-site-association") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", cacheControl);
    }
  };

  return {
    name: "seq030-well-known-headers",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        applyHeaders(req.url, res);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        applyHeaders(req.url, res);
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), wellKnownHeaders()],
  server: {
    host: "127.0.0.1",
    port: 4181,
  },
  preview: {
    host: "127.0.0.1",
    port: 4181,
  },
});
