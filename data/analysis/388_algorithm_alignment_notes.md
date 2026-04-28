# 388 Algorithm Alignment Notes

## Phase 2 Identity Rail

The entry corridor keeps the NHS login button visible and up front through the primary action. It does not customize the NHS login brand beyond surrounding layout. Consent decline maps to the patient-visible copy `You chose not to use your NHS login`, and local session reuse is blocked until `SessionMergeDecision` is `merge_local_session`.

## Phase 7 Embedded Shell Rules

The corridor runs before the embedded shell. It verifies route intent, selected anchor, route family, local session posture, and return disposition before revealing the shell route. Successful continuation uses the existing Phase 7 route tree and embedded shell URL builder instead of creating duplicate route content.

## URL And History Handling

Inbound authentication handoff data is accepted only long enough to derive a redacted binding reference. The browser URL is immediately replaced with a canonical entry URL containing only entry posture, route family, and channel. Successful handoff uses location replacement into the embedded shell so the sensitive inbound URL does not remain in history.

## Recovery Branches

- `consent_denied`: no shell handoff; patient is sent back to the NHS App.
- `expired`: previous local session is not reused; primary action restarts sign-in.
- `wrong_context`: shell stays closed; route label only.
- `safe_reentry`: trusted-origin recovery; route label only.
- `failure`: shell stays closed and asks for an NHS App retry.

## Canonical UI Contract Kernel

The implementation uses a single state card, named regions, visible button labels, safe-area action placement, and deterministic data attributes for route family and return disposition. Raw authentication plumbing is excluded from visible text, URL after scrub, console output, and rendered automation anchors.

