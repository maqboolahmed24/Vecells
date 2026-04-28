import {
  bootstrapPartnerFeeds,
  materializePartnerFeedTrackedArtifacts,
} from "./336_partner_feed_lib.ts";

interface CliOptions {
  outputDir?: string;
  feedIds?: string[];
  materializeOnly: boolean;
}

function parseArgs(argv: readonly string[]): CliOptions {
  const feedIds: string[] = [];
  let outputDir: string | undefined;
  let materializeOnly = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir") {
      outputDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--feed-id") {
      const feedId = argv[index + 1];
      if (feedId) {
        feedIds.push(feedId);
      }
      index += 1;
      continue;
    }
    if (arg === "--materialize-only") {
      materializeOnly = true;
    }
  }

  return {
    outputDir,
    feedIds: feedIds.length > 0 ? feedIds : undefined,
    materializeOnly,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const tracked = await materializePartnerFeedTrackedArtifacts();
  if (options.materializeOnly) {
    console.log(
      JSON.stringify(
        {
          taskId: "seq_336",
          mode: "materialize_only",
          tracked,
        },
        null,
        2,
      ),
    );
    return;
  }

  const runtime = await bootstrapPartnerFeeds({
    outputDir: options.outputDir,
    feedIds: options.feedIds,
  });

  console.log(
    JSON.stringify(
      {
        taskId: runtime.taskId,
        tracked,
        runtime,
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
