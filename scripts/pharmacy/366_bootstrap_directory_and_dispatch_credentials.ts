import {
  bootstrapDirectoryAndDispatchCredentials,
  type DirectoryDispatchMode,
} from "./366_directory_dispatch_credentials_lib.ts";

function parseArgs(argv: readonly string[]): {
  readonly mode?: DirectoryDispatchMode;
  readonly outputDir?: string;
} {
  let mode: DirectoryDispatchMode | undefined;
  let outputDir: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode") {
      const next = argv[index + 1] as DirectoryDispatchMode | undefined;
      mode = next;
      index += 1;
      continue;
    }
    if (arg === "--output-dir") {
      outputDir = argv[index + 1];
      index += 1;
    }
  }

  return { mode, outputDir };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await bootstrapDirectoryAndDispatchCredentials(options);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
