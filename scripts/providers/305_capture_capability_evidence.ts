import {
  captureProviderCapabilityEvidence,
  materializeProviderCapabilityEvidenceArtifacts,
} from "./305_provider_capability_evidence_lib.ts";

interface CliOptions {
  outputDir?: string;
  sandboxOutputDir?: string;
}

function parseArgs(argv: readonly string[]): CliOptions {
  let outputDir: string | undefined;
  let sandboxOutputDir: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir") {
      outputDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--sandbox-output-dir") {
      sandboxOutputDir = argv[index + 1];
      index += 1;
    }
  }

  return { outputDir, sandboxOutputDir };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const materialized = await materializeProviderCapabilityEvidenceArtifacts();
  const capture = await captureProviderCapabilityEvidence(options);

  console.log(
    JSON.stringify(
      {
        taskId: capture.taskId,
        sourceArtifacts: materialized,
        capture,
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
