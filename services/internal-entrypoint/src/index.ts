import { fileURLToPath } from "node:url";
import { loadInternalEntrypointConfig } from "./config.js";
import { createInternalEntrypointServer } from "./server.js";

export async function main(): Promise<void> {
  const config = loadInternalEntrypointConfig();
  const server = createInternalEntrypointServer(config);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, () => {
      server.removeListener("error", reject);
      console.log(
        JSON.stringify({
          event: "internal_entrypoint_started",
          host: config.host,
          port: config.port,
          environment: config.environment,
          dataMode: config.dataMode,
          surfaceCount: config.surfaces.length,
        }),
      );
      resolve();
    });
  });
}

const entrypoint = process.argv[1];
if (entrypoint && fileURLToPath(import.meta.url) === entrypoint) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
