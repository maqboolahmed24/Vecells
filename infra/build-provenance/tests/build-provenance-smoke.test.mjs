import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: ${command} ${args.join(" ")}`);
  }
  return result;
}

const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-build-provenance-"));
try {
  run("pnpm", [
    "exec",
    "tsx",
    "./tools/release-provenance/run-build-provenance-rehearsal.ts",
    "--environment",
    "ci-preview",
    "--output-dir",
    outputDir,
    "--build-family",
    "bf_release_control_bundle",
  ]);

  assertCondition(
    fs.existsSync(path.join(outputDir, "build-provenance-record.json")),
    "Missing build provenance record output.",
  );
  assertCondition(
    fs.existsSync(path.join(outputDir, "attestation-envelopes.json")),
    "Missing attestation envelope output.",
  );
  assertCondition(
    fs.existsSync(path.join(outputDir, "runtime-binding-proof.json")),
    "Missing runtime-binding proof output.",
  );

  run("pnpm", [
    "exec",
    "tsx",
    "./tools/release-provenance/verify-build-provenance.ts",
    "--environment",
    "ci-preview",
    "--input-dir",
    outputDir,
  ]);

  run("pnpm", [
    "exec",
    "tsx",
    "./tools/release-provenance/promote-build-artifact.ts",
    "--target-ring",
    "integration",
    "--input-dir",
    outputDir,
  ]);

  const recordPath = path.join(outputDir, "build-provenance-record.json");
  const tampered = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  tampered.signature = `${tampered.signature}tampered`;
  fs.writeFileSync(recordPath, `${JSON.stringify(tampered, null, 2)}\n`, "utf8");

  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "tsx",
      "./tools/release-provenance/verify-build-provenance.ts",
      "--environment",
      "ci-preview",
      "--input-dir",
      outputDir,
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );
  assertCondition(result.status !== 0, "Tampered provenance unexpectedly verified.");
} finally {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
