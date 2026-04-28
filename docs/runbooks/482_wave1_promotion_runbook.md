# 482 Wave 1 Promotion Runbook

## Preconditions

Confirm the nine preflight lanes are exact: scorecard, migration, BAU, wave plan, signoffs, dependencies, dress rehearsal, UAT, and DR smoke. Confirm the operator has `role:release-manager`, the idempotency key is bound to the Wave 1 tuple, and rollback binding `wrb_476_wave1_feature_surface_and_cutover` is present.

## Promotion

1. Run `pnpm run test:programme:482-wave1-promotion`.
2. Review `data/release/482_wave1_promotion_command.json`.
3. Confirm `data/release/482_wave1_promotion_settlement.json` settled with `result = applied`.
4. Confirm `data/release/482_wave1_publication_parity_after_promotion.json` has `parityState = exact`.
5. Notify the release room from `data/evidence/482_wave1_promotion_evidence.json`.

## Fail Closed

- Expired signoff: stop and reissue the signoff register.
- Stale migration readiness: stop and rerun projection readiness.
- Tenant regrouping/widened selector: stop and publish a new eligibility snapshot.
- Duplicate idempotency key: return the original settlement.
- Publication parity mismatch: keep Wave 1 inactive and republish parity.
- Operator role denial: require a release-manager actor.
- Missing rollback binding: stop until route-family rollback is bound.
