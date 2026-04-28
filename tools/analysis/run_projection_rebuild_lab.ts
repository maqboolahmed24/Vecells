#!/usr/bin/env node

import { runProjectionRebuildSimulation } from "../../packages/release-controls/src/projection-rebuild";

void (async () => {
  const report = await runProjectionRebuildSimulation();
  console.log(JSON.stringify(report, null, 2));
})();
