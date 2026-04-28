# 15 Security Control And Secret Management Baseline

        The baseline is KMS-backed secret custody plus a policy-gated scanner suite, with provenance and SBOM publication treated as live security controls rather than compliance attachments.

        ## Chosen Baselines

        | Family | Chosen baseline | UK hosting | Proof | Decision |
| --- | --- | --- | --- | --- |
| Provenance, signing, and SBOM attestation lane | SLSA or in-toto-compatible provenance attester, DSSE-style signature envelope, SPDX or CycloneDX SBOM publication, and immutable artifact registry | 5 | 5 | Chosen because build identity, SBOM, signature, design-contract publication, and runtime consumption must remain part of one exact candidate tuple. |
| Security control, secret management, and policy gate | Managed secret store or KMS, short-lived workload identity, multi-mode scanner suite, and policy-as-code gate wired into stage settlement | 5 | 5 | Chosen because secret custody, short-lived identity, scanner coverage, and policy exceptions all need stage-bound evidence, not local CI variables or dashboard badges. |

        ## Control Matrix

        | Control | Domain | Family | Enforcement point | Evidence |
| --- | --- | --- | --- | --- |
| Public ingress enforces rate limit, origin policy, TLS, and attack-surface filtering before the gateway. | ingress_hardening | FAM_SECURITY_POLICY_GATE | public edge and published gateway | ingress policy bundle; edge policy conformance suite |
| Patient and staff sessions use separate secure cookie scopes, CSRF posture, and expiry behavior. | session_security | FAM_SECURITY_POLICY_GATE | gateway and auth policy | session policy compile proof; identity and session regression suites |
| Browser-delivered surfaces publish CSP, frame-ancestor, referrer, and download handling policy explicitly. | browser_hardening | FAM_SECURITY_POLICY_GATE | runtime publication and browser surface build | browser header conformance pack; embedded and artifact route posture proof |
| Secrets come only from managed secret store or KMS-backed custody, never from source control or long-lived CI variables. | secret_management | FAM_SECURITY_POLICY_GATE | build, deploy, runtime, and operator actions | secret access policy bundle; credential sourcing attestations |
| Transactional stores, backups, object storage, queue persistence, and audit exports are encrypted at rest. | data_protection | FAM_SECURITY_POLICY_GATE | data and backup stores | storage encryption conformance suite; backup manifest encryption attestations |
| Logs, traces, metrics, and UI telemetry carry correlation IDs but never raw PHI beyond the task-010 disclosure ceiling. | telemetry_redaction | FAM_SIGNAL_PIPELINE | collector, UI telemetry fence, and alert exporter | telemetry schema allow-list; redaction regression suite |
| Service identities follow least privilege and egress is allow-listed per workload family. | service_identity | FAM_SECURITY_POLICY_GATE | workload identity and network policy | egress policy pack; trust-zone conformance suite |
| Artifact signing, provenance, and SBOM generation are mandatory rather than optional release attachments. | supply_chain | FAM_PROVENANCE_SIGNING_SBOM | sbom_sign pipeline stage and runtime publication gate | signed artifact digest set; SBOM publication bundle; provenance verification verdict |
| Run SAST, dependency, IaC, container, and secret scanning with policy gate enforcement. | scanner_coverage | FAM_SECURITY_POLICY_GATE | static_gate, sbom_sign, and preprod security gate | scanner decision record; watchlist hash; exception approval bundle |
| Every posture-changing pipeline stage settles through an authoritative stage record and policy gate. | policy_gate | FAM_RELEASE_TUPLE_ORCHESTRATION | every live posture changing stage | stage settlement chain; policy decision bundle; release tuple digest |
| No hotfix or emergency movement may bypass release recording, rollback evidence, runtime publication, or emergency-exception capture. | exception_governance | FAM_SECURITY_POLICY_GATE | publish, canary, widen, rollback, and recovery activation | exception approval bundle; follow-up record; permitted recovery disposition list |
| Break-glass, support replay, and tenant-switch actions emit heightened audit and alerting signals. | heightened_audit | FAM_INCIDENT_CAPA_WORKFLOW | audit and incident workflows | audit timeline; alert routing; review adequacy pack |
| Security incidents and near misses require reportability assessment, evidence preservation, and CAPA linkage. | incident_governance | FAM_INCIDENT_CAPA_WORKFLOW | incident desk and assurance ledger writeback | incident timeline; reportability checklist; CAPA action set |
| Stale rehearsal evidence never counts as live recovery authority. | resilience_authority | FAM_RESILIENCE_RECOVERY_EVIDENCE | readiness snapshot and recovery control posture evaluation | restore run; failover run; chaos run; recovery evidence pack |

        ## Control Law

        - No secret material enters source control, build output, logs, artifacts, or long-lived CI variables.
        - Public ingress, browser policy headers, session separation, least-privilege workload identity, and egress allow-lists are all enforced before live publication.
        - Scanner findings, watchlist exceptions, and emergency release exceptions stay candidate-bound and immutable.
        - Break-glass, tenant switch, and support replay are heightened audit classes and route into both incident handling and assurance export.
        - The unresolved HSM provisioning seam is explicit and remains a provisioning blocker, not an architectural omission.
