import { materializeTransportSandboxTrackedArtifacts } from "./367_update_record_transport_sandbox_lib.ts";

async function main(): Promise<void> {
  const tracked = await materializeTransportSandboxTrackedArtifacts();
  console.log(
    JSON.stringify(
      {
        taskId: "seq_367",
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
