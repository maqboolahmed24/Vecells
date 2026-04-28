# 396 Redaction And Artifact Handling Rules

Browser automation may produce screenshots and traces only from redaction-safe local readiness pages. It must not capture live NHS App portals, raw NHS login callbacks, bearer tokens, `assertedLoginIdentity`, NHS numbers, patient identifiers, grant IDs, cookies, or session-bearing URLs.

Artifact export policy:

| Redaction class    | Handling                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `public`           | May be exported as-is.                                                                      |
| `internal`         | May be exported inside the internal evidence bundle.                                        |
| `sensitive`        | Export only after owner review and metadata minimization.                                   |
| `secret`           | Withhold raw artifact; export an index row only.                                            |
| `session_artifact` | Withhold raw artifact; regenerate from synthetic local state if proof is needed.            |
| `phi_url`          | Redact query values and export only an index row unless the owner approves a scrubbed copy. |

The redaction helper masks JWT-shaped values, bearer tokens, `assertedLoginIdentity`, `asserted_login_identity`, OAuth token fields, NHS numbers, patient identifiers, subject refs, grant IDs, and sensitive query parameters before SCAL export.
