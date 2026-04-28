import { verifyMeshRoutes } from "./335_mesh_mailbox_lib.ts";

interface CliOptions {
  outputDir?: string;
  routeIds?: string[];
}

function parseArgs(argv: readonly string[]): CliOptions {
  const routeIds: string[] = [];
  let outputDir: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir") {
      outputDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--route-id") {
      const routeId = argv[index + 1];
      if (routeId) {
        routeIds.push(routeId);
      }
      index += 1;
    }
  }

  return {
    outputDir,
    routeIds: routeIds.length > 0 ? routeIds : undefined,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await verifyMeshRoutes({
    outputDir: options.outputDir,
    routeIds: options.routeIds,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
