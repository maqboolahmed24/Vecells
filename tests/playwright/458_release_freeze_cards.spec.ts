import { runRoleScopeStudioFreezeSuite } from "./458_role_scope_studio.helpers";

if (process.argv.includes("--run")) {
  await runRoleScopeStudioFreezeSuite();
}
