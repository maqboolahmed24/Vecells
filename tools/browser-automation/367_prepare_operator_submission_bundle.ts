import {
  materializeTransportSandboxTrackedArtifacts,
  prepareOperatorSubmissionBundle,
} from "../../scripts/pharmacy/367_update_record_transport_sandbox_lib.ts";

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1]
    ? process.argv[index + 1]
    : undefined;
}

function readRepeatedFlag(name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) {
      values.push(process.argv[index + 1]!);
    }
  }
  return values;
}

async function main(): Promise<void> {
  await materializeTransportSandboxTrackedArtifacts();
  const outputDir = readFlag("--output-dir");
  const requestIds = readRepeatedFlag("--request-id");
  const prepared = await prepareOperatorSubmissionBundle({
    outputDir,
    requestIds: requestIds.length > 0 ? requestIds : undefined,
  });
  console.log(
    JSON.stringify(
      {
        taskId: "seq_367",
        outputPath: prepared.outputPath,
        requestIds: prepared.bundle.requestIds,
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
