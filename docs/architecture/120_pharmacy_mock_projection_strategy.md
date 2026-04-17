# Pharmacy mock projection strategy

The seed uses one shared mock projection set to drive the queue spine, validation board, checkpoint rail, decision dock, route examples, gallery, and validator. The shell always keeps a calm explanation visible, then changes posture truthfully instead of swapping shells.

## Seeded scenario coverage

- `ready_to_dispatch` / `PHC-2048` :: Consent, inventory, and proof lanes are aligned; the case can advance once the current checkpoint is confirmed.
- `proof_pending` / `PHC-2057` :: The referral is prepared, but the current proof chain is still waiting on external confirmation and must not read as settled.
- `contradictory_proof` / `PHC-2072` :: Transport and provider evidence disagree, so the shell freezes the handoff plane in place.
- `partial_supply` / `PHC-2081` :: Inventory truth is current but the selected pack can only be partially supplied without an explicit intervention.
- `clarification_required` / `PHC-2090` :: Consent checkpoint drift is explicit and blocks action safely inside the same shell.
- `urgent_return` / `PHC-2103` :: Urgent return has reopened the case for safety; quiet closure is forbidden until the return path settles.
- `weak_match_outcome` / `PHC-2124` :: Outcome evidence is present but weakly matched, so the case remains review-required rather than resolved.
- `manual_review_debt` / `PHC-2146` :: The case remains open because manual review debt still blocks quiet release or closure.

## Projection rules

1. Queue rows describe the highest consequence signal without pretending that local activity is final release or closure.
2. The validation board always keeps one active case, one active checkpoint, and one active line item visible.
3. Inventory truth downgrades from visual-plus-table to table-only or summary-only without swapping route family.
4. Weak-match, contradictory proof, clarification, and urgent-return cases stay procedurally explicit rather than cosmetically complete.

## Future-gap markers published in the seed

- `GAP_PHARMACY_PROVIDER_SPECIFIC_DISPATCH_BINDING_V1`
- `GAP_FUTURE_PHARMACY_FLOW_DIRECTORY_RESELECTION_V1`
- `GAP_TRUTHFUL_PHARMACY_POSTURE_CONSENT_DRIFT_V1`
- `GAP_TRUTHFUL_PHARMACY_POSTURE_PROOF_DISPUTE_V1`
- `GAP_TRUTHFUL_PHARMACY_POSTURE_WEAK_MATCH_V1`
- `GAP_TRUTHFUL_PHARMACY_POSTURE_REOPEN_SAFETY_V1`
