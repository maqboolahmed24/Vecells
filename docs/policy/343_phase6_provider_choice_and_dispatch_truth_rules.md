# 343 Phase 6 Provider Choice And Dispatch Truth Rules

## Full choice law

- Recommended frontier must be a subset of the full visible provider set.
- `manual_supported` providers stay visible with warning unless a stronger safety rule suppresses them.
- No implementation may compute a hidden top-K shortlist and present that as the patient choice surface.

## Consent binding law

- Consent binds to provider, pathway or lane, choice proof, selected explanation, referral scope, channel, and `selectionBindingHash`.
- Provider change, pathway change, material scope drift, superseded proof, or mismatched package fingerprint invalidates earlier consent.
- Calm reassurance and dispatch are forbidden when the current `PharmacyConsentCheckpoint` is non-satisfied.

## Dispatch truth law

- Dispatch is a post-submit mutation that must traverse `ScopedMutationGate`.
- Transport acceptance, provider acceptance, and delivery hints are supportive evidence only.
- Only `authoritativeProofSourceRef` may satisfy live referral truth for the current attempt.
- Settlement copy and proof-envelope state must not diverge under retry, replay, or later dispute.

## Outcome truth law

- Dispatch truth and outcome truth are separate authorities.
- Exact or semantic replay returns `duplicate_ignored` and must not reopen or close the case again.
- Weak, ambiguous, contradictory, email-ingested, or manual-capture outcomes must stop at reconciliation unless stronger policy conditions are satisfied.
- Absence of Update Record, absence of email, or elapsed time may not imply completion.

## Explicit prohibitions

- No hidden recommended provider that the user cannot inspect.
- No dispatch plan that lacks the current consent binding.
- No live referral truth from mailbox download or weak receipt alone.
- No auto-close from weak email or manual outcome ingest.
- No patient-safe calmness while proof, reconciliation, or continuity evidence is stale or blocked.
