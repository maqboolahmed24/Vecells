# 425 External Reference Notes

## Selected Provider

The selected provider for current implementation is the repository-local `vecells_assistive_vendor_watch_shadow_twin`; it has no external vendor account documentation. Live providers remain optional and blocked.

## OpenAI Optional Provider References

These official OpenAI references were reviewed only to shape a future optional manifest for projects, service identities, scoped API keys, and safe handling. They do not imply OpenAI is selected.

- OpenAI project API keys API reference: https://developers.openai.com/api/reference/resources/organization/subresources/projects/subresources/api_keys/methods/list
- OpenAI RBAC and project administration guide: https://developers.openai.com/api/docs/guides/rbac
- OpenAI API authentication overview: https://developers.openai.com/api/reference/overview#authentication
- OpenAI API key safety help article: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety

Applied constraints:

- API keys are secrets and must not appear in client-side code.
- Project and organization headers are explicit request scoping primitives.
- Project administration and service-account management require bounded project permissions.
- Keys should be unique, least-privilege, regularly reviewed, and rotated.

## Playwright References

- Browser contexts and isolation: https://playwright.dev/docs/browser-contexts
- Trace viewer and trace retention choices: https://playwright.dev/docs/trace-viewer
- Screenshot capture controls: https://playwright.dev/docs/screenshots

Applied constraints:

- Browser automation uses isolated contexts.
- Tracing is only useful after a run and can include DOM, console, and network state, so task 425 captures only redacted harness state.
- Screenshots are taken only after secret locators and raw values have been removed from page content.

## Repo Security Guidance

- `blueprint/platform-runtime-and-release-blueprint.md#Security baseline contract`
- `infra/secrets-kms/README.md`
- `data/analysis/secret_ownership_map.json`
- `docs/engineering/45_coding_standards.md`

Applied constraints:

- Secrets come from a managed secret store or KMS-backed mechanism.
- Logs, traces, metrics, screenshots, and source cannot emit raw secrets.
- Browser automation consumes references only after governance gates; raw capture goes through quarantine and vault ingest.
