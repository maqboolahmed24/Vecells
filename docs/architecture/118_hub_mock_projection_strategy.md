# Hub mock projection strategy

The seed shell uses truthful mock projections with the same route topology, selected-anchor law, and fallback behavior that the live hub domain will need later. It is intentionally precise about option truth and acknowledgement debt rather than simulating a generic call-centre queue.

## Seeded projection families

- `hub-queue-held-option` at `/hub/queue` :: Queue view with one held option, one truthful nonexclusive alternative, and callback fallback held in reserve.
- `hub-case-confirmation-pending` at `/hub/case/hub-case-087` :: Case detail keeps the selected candidate visible while commit evidence is still weaker than booked truth.
- `hub-alternatives-open-choice` at `/hub/alternatives/ofs_104` :: Alternative review keeps response-window wording explicit and avoids fake exclusivity countdowns.
- `hub-exceptions-callback-transfer` at `/hub/exceptions` :: Exception board shows callback publication debt and stale-owner recovery without pretending a slot is still viable.
- `hub-audit-acknowledgement-debt` at `/hub/audit/hub-case-066` :: Audit rail keeps confirmed booking proof and generation-bound acknowledgement debt in one same-shell review surface.
- `hub-case-fallback-only` at `/hub/case/hub-case-052` :: Case detail truthfully pivots from slot ranking to callback-only continuation when safe supply disappears.

## Seeded case truths

- Held option with genuine exclusivity countdown
- Truthful nonexclusive offer with response-window wording only
- Native booking confirmation pending without calm booked posture
- Confirmed booking blocked by generation-bound practice acknowledgement debt
- Callback transfer pending after safe supply disappears
