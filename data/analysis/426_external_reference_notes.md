# 426 External Reference Notes

Reviewed on 2026-04-27. External references support the local blueprint; they do not override it.

## Selected Provider

The selected provider is the local `vecells_assistive_vendor_watch_shadow_twin`, so no external vendor dashboard was configured. The repository-owned 425 manifests are the binding source for current provider selection.

## OpenAI Placeholder References

- `https://platform.openai.com/docs/api-reference/audit-logs?lang=go`
  - Borrowed: audit-log objects and organization event visibility are treated as future verification surfaces.
  - Rejected for current config: no live OpenAI organization is selected, so no OpenAI audit posture is asserted.
- `https://platform.openai.com/docs/guides/rbac`
  - Borrowed: project-scoped roles, service accounts, and verification posture inform the future placeholder mapping.
  - Rejected for current config: the baseline does not create OpenAI roles or project members.
- `https://platform.openai.com/docs/models/how-we-use-your-data`
  - Borrowed: retention and abuse-monitoring concepts are recorded as future checks.
  - Rejected for current config: no OpenAI retention setting is claimed without provider selection.
- `https://platform.openai.com/docs/api-reference/moderations?lang=python`
  - Borrowed: moderation as a future safety-control surface.
  - Rejected for current config: local synthetic policy gates remain the current verified guardrail.
- `https://platform.openai.com/docs/safety-best-practices/understanding-safety-risks`
  - Borrowed: human review, adversarial testing, constrained output, and safety identifiers align with Phase 8 human-control law.
  - Rejected for current config: generic safety advice is not treated as evidence that a vendor-side setting is configured.

## Playwright References

- `https://playwright.dev/docs/browser-contexts`
  - Borrowed: isolated browser contexts per environment.
- `https://playwright.dev/docs/trace-viewer`
  - Borrowed: trace capture for local redacted harness evidence.
- `https://playwright.dev/docs/screenshots`
  - Borrowed: screenshots as secondary evidence only, never the sole proof.

## Repository Security Guidance

Task 426 follows the task 425 secret-reference rules: managed references only, no raw API keys, no privileged browser storage state, no raw prompts, no raw outputs, and no raw audit payloads.

