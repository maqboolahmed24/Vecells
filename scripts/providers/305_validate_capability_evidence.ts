import {
  materializeProviderCapabilityEvidenceArtifacts,
  validateProviderCapabilityEvidence,
} from "./305_provider_capability_evidence_lib.ts";

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
  const materialized = await materializeProviderCapabilityEvidenceArtifacts();
  const validation = await validateProviderCapabilityEvidence(options);

  console.log(
    JSON.stringify(
      {
        taskId: validation.taskId,
        sourceArtifacts: materialized,
        validation,
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
