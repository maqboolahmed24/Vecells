import {
  materializeProviderSandboxArtifacts,
  verifyProviderCallbacks,
} from "./304_provider_sandbox_lib.ts";

interface CliOptions {
  outputDir?: string;
  sandboxIds?: string[];
}

function parseArgs(argv: readonly string[]): CliOptions {
  const sandboxIds: string[] = [];
  let outputDir: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir") {
      outputDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--sandbox-id") {
      const sandboxId = argv[index + 1];
      if (sandboxId) {
        sandboxIds.push(sandboxId);
      }
      index += 1;
    }
  }

  return {
    outputDir,
    sandboxIds: sandboxIds.length > 0 ? sandboxIds : undefined,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const materialized = await materializeProviderSandboxArtifacts();
  const result = await verifyProviderCallbacks(options);

  console.log(
    JSON.stringify(
      {
        taskId: result.taskId,
        sourceArtifacts: materialized,
        verification: result,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
