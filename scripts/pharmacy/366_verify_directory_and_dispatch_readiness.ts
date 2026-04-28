import { verifyDirectoryAndDispatchReadiness } from "./366_directory_dispatch_credentials_lib.ts";

async function main(): Promise<void> {
  const outputDirIndex = process.argv.indexOf("--output-dir");
  const outputDir =
    outputDirIndex >= 0 && process.argv[outputDirIndex + 1]
      ? process.argv[outputDirIndex + 1]
      : undefined;
  const summary = await verifyDirectoryAndDispatchReadiness(outputDir);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
