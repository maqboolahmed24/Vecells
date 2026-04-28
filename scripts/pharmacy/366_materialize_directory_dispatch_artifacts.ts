import { materializeDirectoryDispatchTrackedArtifacts } from "./366_directory_dispatch_credentials_lib.ts";

async function main(): Promise<void> {
  const tracked = await materializeDirectoryDispatchTrackedArtifacts();
  console.log(
    JSON.stringify(
      {
        taskId: "seq_366",
        tracked,
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
