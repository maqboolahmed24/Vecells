import { fileURLToPath } from "node:url";
import { loadConfig } from "./config";
import { createRuntime } from "./runtime";

type ShutdownSignal = "SIGINT" | "SIGTERM";

export async function main(): Promise<void> {
  const runtime = createRuntime(loadConfig());
  await runtime.start();

  let stopping = false;
  const shutdown = async (signal: ShutdownSignal): Promise<void> => {
    if (stopping) {
      return;
    }
    stopping = true;
    runtime.logger.info("shutdown_signal_received", { signal });
    await runtime.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

const entrypoint = process.argv[1];
if (entrypoint && fileURLToPath(import.meta.url) === entrypoint) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
