import { resetPartnerFeeds } from "./336_partner_feed_lib.ts";

interface CliOptions {
  outputDir?: string;
}

function parseArgs(argv: readonly string[]): CliOptions {
  let outputDir: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--output-dir") {
      outputDir = argv[index + 1];
      index += 1;
    }
  }
  return { outputDir };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await resetPartnerFeeds({ outputDir: options.outputDir });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
