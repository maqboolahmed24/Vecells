# Hub shell seed routes

- Task: `par_118`
- Visual mode: `Hub_Shell_Seed_Routes`
- Shell: `hub-desk`
- Route families: `rf_hub_queue`, `rf_hub_case_management`

## Same-shell law

The hub shell keeps one continuity frame, `hub.queue`, across queue review, case management, alternatives, exceptions, and audit. The selected case, the current option truth, the CasePulse summary, and the DecisionDock explanation stay live together rather than splitting into detached pages.

## Canonical routes

- `/hub/queue` -> `rf_hub_queue` (queue) :: Queue-first coordination surface with ranked options and explicit hold truth.
- `/hub/exceptions` -> `rf_hub_queue` (exceptions) :: Exception board for confirmation debt, acknowledgement debt, and callback-transfer blockers.
- `/hub/case/:hubCoordinationCaseId` -> `rf_hub_case_management` (case) :: Case detail surface with selected option continuity and live fallback law.
- `/hub/alternatives/:offerSessionId` -> `rf_hub_case_management` (alternatives) :: Patient-choice review within the same shell; only held options may claim reserved language.
- `/hub/audit/:hubCoordinationCaseId` -> `rf_hub_case_management` (audit) :: Read-only audit rail with proof tuples, acknowledgement generations, and fallback evidence.

## Shell promises

1. Queue remains read-only and multi-user; case-management routes own the writable next step.
2. Alternatives and audit are same-shell views, not second applications.
3. Exceptions stay attached to the active case and current option truth instead of turning into a detached backlog.
