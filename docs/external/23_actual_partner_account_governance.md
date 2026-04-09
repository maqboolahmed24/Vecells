# 23 Actual Partner Account Governance

        ## Section A — `Mock_now_execution`

        Mock execution proves the same change seams now: redirect inventory, key custody, sender and number ownership, mailbox binding, and route publication. That rehearsal is what prevents later live onboarding from improvising security posture.

        ## Section B — `Actual_provider_strategy_later`

        Later live-provider setup follows one governed lifecycle:
        1. request and approval
        2. capture into quarantine or metadata review
        3. vault or registry ingest
        4. runtime or publication binding
        5. rotation or revocation evidence

        | Change event | Required roles | Required evidence |
| --- | --- | --- |
| Redirect URI or route-family addition | ROLE_IDENTITY_PARTNER_MANAGER + ROLE_SECURITY_LEAD + ROLE_PROGRAMME_ARCHITECT | Updated redirect matrix, route-family owner confirmation, dry-run callback proof, approval tuple |
| Client secret, private key, certificate, or mailbox credential rotation | owner + backup owner + ROLE_SECURITY_LEAD | Rotation settlement record, vault version diff, replay and callback verification, revocation proof |
| Sandpit to integration, preprod, or production environment addition | owner + approver + ROLE_PROGRAMME_ARCHITECT | Environment parity checklist, control-plane publication proof, gate clearance, fresh runbook binding |
| Sender identity or phone-number transfer | owner + ROLE_OPERATIONS_LEAD + ROLE_SUPPORT_LEAD | Wrong-recipient or wrong-number drill, support path confirmation, rollback number or sender plan |
| Mailbox or endpoint identifier change | owner + ROLE_SECURITY_LEAD + ROLE_OPERATIONS_LEAD | Transport authenticity proof, endpoint registry diff, replay-safe redrive plan |
| Provider offboarding or emergency revoke | owner + backup owner + approver | Revocation bundle, degraded-mode posture confirmation, published fallback activation, audit export |

        Governance consequences:
        - test and production accounts are segregated by environment, storage backend, and approval chain
        - redirect, sender, mailbox, and number changes are publication-affecting changes, not ticket-only updates
        - no shared production credential may remain single-owner or un-audited
