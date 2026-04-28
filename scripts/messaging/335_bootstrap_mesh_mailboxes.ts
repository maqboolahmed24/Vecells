import {
  bootstrapMeshMailboxes,
  materializeMeshTrackedArtifacts,
} from "./335_mesh_mailbox_lib.ts";

interface CliOptions {
  outputDir?: string;
  mailboxIds?: string[];
  materializeOnly?: boolean;
}

function parseArgs(argv: readonly string[]): CliOptions {
  const mailboxIds: string[] = [];
  let outputDir: string | undefined;
  let materializeOnly = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir") {
      outputDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--mailbox-id") {
      const mailboxId = argv[index + 1];
      if (mailboxId) {
        mailboxIds.push(mailboxId);
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
    mailboxIds: mailboxIds.length > 0 ? mailboxIds : undefined,
    materializeOnly,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const materialized = await materializeMeshTrackedArtifacts();
  const runtime = options.materializeOnly
    ? null
    : await bootstrapMeshMailboxes({
        outputDir: options.outputDir,
        mailboxIds: options.mailboxIds,
      });

  console.log(
    JSON.stringify(
      {
        taskId: "seq_335",
        sourceArtifacts: materialized,
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
