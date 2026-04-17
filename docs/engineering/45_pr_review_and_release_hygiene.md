# 45 PR Review And Release Hygiene

        Pull requests are the review surface where Vecells turns branch and commit signal into release-safe decisions.

        ## PR Size And Shape

        - Prefer one task-scoped concern per PR.
        - Keep behavior, generators, and docs together only when they represent one coherent task.
        - If a PR is large because codegen emitted many deterministic files, call that out explicitly in the summary.

        ## Required PR Contents

        - Task id and prompt link
        - Architecture refs touched
        - Exact validation commands run
        - Browser evidence when the work is browser-visible
        - Risk callout when route intent, release controls, trust posture, migrations, or boundary contracts move

        ## Review Checklist

        - Architecture: does the change preserve topology, ownership, and public contract seams?
        - Security: are secrets, tokens, provider identifiers, and logs still redacted and bounded?
        - Accessibility: does keyboard, focus, semantic structure, and reduced motion still hold?
        - Performance: did the change widen payloads, retries, render cost, or hot paths?
        - Testing: did the author run `pnpm check`, and if browser-visible work changed, `pnpm test:e2e`?

        ## Special Review Triggers

        | Trigger | Typical paths | Extra evidence |
        | --- | --- | --- |
        | Route intent or command acceptance | `services/command-api`, `packages/api-contracts`, route binding changes | Named reviewer plus browser and contract evidence |

| Release controls, parity, or watch posture | `packages/release-controls`, `services/api-gateway`, deploy or runbook changes | Release evidence, parity proof, and rollback posture |
| Trust posture, authz, or secret handling | `packages/authz-policy`, auth edge, redaction logic | Security review plus redaction proof |
| Boundary contract or topology drift | package exports, import rules, CODEOWNERS, topology manifest | Architecture review plus validator proof |
| Data or contract migration | migration scripts, schemas, compatibility windows | Migration plan, dry run, recovery plan, and explicit validation |

        ## Browser-Visible Work

        - UI work needs Playwright evidence attached in the PR body.
        - If a diagram, cockpit, atlas, or gallery changed, parity tables and reduced-motion posture need to be checked as part of review.

        ## Release And Migration Hygiene

        - Risky changes must be visibly marked in commit type, PR summary, and reviewer checklist.
        - Do not merge release-risk or migration work without a validation note that names the commands run and the rollback or fallback posture.
        - Changes that alter route intent, publication parity, trust posture, or live mutation controls must never hide inside “refactor” language.
