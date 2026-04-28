# 353 Urgent Return, No-Contact, and Loop Escalation Rules

## Urgent return

- `urgent_gp_return` and `safeguarding_concern` always force `urgent_bounce_back`.
- The reopen target is carried with `reopenPriorityBand = 3`.
- The engine resolves a direct urgent route profile and marks Update Record as forbidden for the urgent return channel.
- Duty-task reacquisition is used instead of quiet routine redispatch.

## No-contact and unable-to-complete

- `patient_not_contactable` sets `no_contact_return_pending` when contact severity crosses the frozen threshold.
- `pharmacy_unable_to_complete` and clinically outstanding `referral_expired` returns raise secondary reopen priority.
- Contact-dependent returns must refresh or reopen reachability repair. They cannot assume the previous patient route is still trustworthy.

## Supervisor escalation

- `loopRisk = min(bounceCount / 3, 1) * (1 - materialChange)`
- automatic escalation starts when `loopRisk >= 0.65`
- while escalation is unresolved:
  - automatic redispatch is blocked
  - automatic close is blocked
  - reopen from bounce-back is rejected

## Patient and practice truth

- patient messaging is generated from the bounce-back truth family, not from ad hoc queue text
- practice visibility remains minimum-necessary and carries the current triage re-entry, urgent return, and repair posture
- identity repair still suppresses patient-facing notification emission even when the bounce-back exists on the staff side

## Operational expectations carried from current NHS guidance

- urgent return and safeguarding do not travel through Update Record
- local professional routes such as telephone or monitored email remain the safety path for urgent actions or referrals back to general practice
- the dedicated monitored GP email address acts as the safety-net when GP Connect is unavailable or the pharmacy activity is not yet supported there
