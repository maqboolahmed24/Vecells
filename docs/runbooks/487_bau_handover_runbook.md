# BAU Handover Runbook

Generated: 2026-04-28T00:00:00.000Z

## Authority

Use `data/bau/487_bau_handover_pack.json`, `data/bau/487_support_rota_matrix.json`, `data/bau/487_service_owner_acceptance_register.json`, and `data/bau/487_bau_open_actions_register.json` as the handover authority. Do not accept BAU transfer from a narrative report, meeting note, or dashboard-only label.

## Handover sequence

1. Confirm each launch-critical domain has an owner, deputy, escalation path, out-of-hours rota, bank-holiday cover, runbook transfer, and competency evidence.
2. Confirm incident command, supplier escalation, release/wave monitoring, assistive trust monitoring, NHS App monthly data, records/archive, clinical safety, privacy, and security have named BAU ownership.
3. Confirm every open action is classified as release-blocking, constrained, or BAU follow-up. Release-blocking work cannot move to BAU follow-up.
4. Confirm the acceptance command carries role authorization, tenant/cohort/channel scope, idempotency key, purpose binding, injected clock, and WORM audit refs.
5. Settle BAU handover as accepted, accepted with constraints, or blocked.

## Active result

- Pack: bau_handover_pack_487_accepted-with-constraints
- Verdict: accepted_with_constraints
- Release-to-BAU record: release_to_bau_record_487_accepted-with-constraints
- Rota coverage: exact
- Open blockers: 0
