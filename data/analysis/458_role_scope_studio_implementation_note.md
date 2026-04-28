# Phase 9 Role Scope Studio Implementation Note

Task 458 adds `/ops/access/role-scope-studio` to the governance console. The surface binds a persistent scope ribbon, role-scope matrix, effective access preview, mask diff, break-glass/elevation summary, release-freeze card rail, denied-action explainer, tuple inspector, telemetry disclosure fence, and return context strip.

A dedicated canonical frontend access-preview read model is not present in the repository, so the task records `PHASE9_BATCH_458_472_INTERFACE_GAP_458_ACCESS_PREVIEW_READ_MODEL.json` and uses a preview-only adapter over canonical acting-scope, visibility, minimum-necessary, release-freeze, and settlement refs.

The studio is fail-closed: navigation is not authorization, hidden fields are not rendered, masked fields use deterministic synthetic labels, export and role approval remain blocked, break-glass is not flattened into a role toggle, and stale/frozen/degraded/permission-missing states are visible.
