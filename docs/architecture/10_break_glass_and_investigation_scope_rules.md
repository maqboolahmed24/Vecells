# 10 Break-Glass And Investigation Scope Rules

Break-glass is now a governed purpose-of-use row with one `InvestigationScopeEnvelope`, one selected anchor, one diagnostic question, explicit expiry, and read-only restore semantics.

## Reason Codes

| Reason code | Summary | Allowed anchor classes |
| --- | --- | --- |
| wrong_patient_investigation | Investigate suspected wrong-patient binding or release. | RequestLineage<br>IdentityRepairCase<br>IdentityRepairFreezeRecord |
| clinical_safety_incident | Investigate a patient-safety, urgent-diversion, booking, or pharmacy incident. | Request<br>BookingCase<br>PharmacyCase<br>SupportReplaySession |
| security_incident_response | Investigate a security, access, or policy violation with scope-bounded evidence. | AuditQuerySession<br>AssuranceLedgerEntry<br>BreakGlassReviewRecord |
| data_subject_trace | Trace disclosures, exports, or lifecycle actions for a bounded data-subject question. | DataSubjectTrace<br>DeletionCertificate<br>ArchiveManifest |
| restore_or_degradation_investigation | Investigate recovery posture, replay divergence, or continuity drift affecting safe operation. | OperationalReadinessSnapshot<br>SupportReplaySession<br>InvestigationScopeEnvelope |
| regulatory_or_legal_export | Prepare a governed regulator, legal, or assurance export from the admissible evidence graph. | GovernanceReviewPackage<br>AssurancePack<br>InvestigationScopeEnvelope |

## Core Rules

| Rule | Title | Purpose row | Masking ceiling rule | Expiry rule |
| --- | --- | --- | --- | --- |
| BG_RULE_ENVELOPE_REQUIRED | Investigation scope envelope is mandatory | investigation_break_glass | Every break-glass, replay, and export flow binds one current masking ceiling and disclosure ceiling before materialization. | The session must carry explicit expiresAt and auto-revoke on expiry or supersession. |
| BG_RULE_SUPPORT_PIVOT | Support replay pivots rather than widening in place | investigation_break_glass | Support replay stays at masked timeline detail unless a governance-governed investigation envelope supersedes it. | Support pivots inherit the envelope expiresAt and auto-revoke requirements. |
| BG_RULE_NO_POST_HYDRATION_WIDENING | No post-hydration widening | investigation_break_glass | A lower-trust materialized payload cannot be widened after browser delivery; a new purpose row must be re-materialized server-side. | Older lower-trust payloads remain stale, expire immediately, and must be invalidated when the new row is materialized. |
| BG_RULE_WRONG_PATIENT_SUPPRESSION | Wrong-patient hold suppresses cached PHI | investigation_break_glass | When IdentityRepairFreezeRecord is active, only recovery-safe summary or governance investigation rows remain lawful. | Cached PHI expires immediately on hold entry and may not revive on refresh. |
| BG_RULE_RETENTION_WITNESS_SEPARATION | Retention witnesses stay separate from ordinary docs | investigation_break_glass | Deletion and archive witnesses expose governance-safe summaries unless the envelope explicitly needs supporting evidence detail. | Witness exports are bound to the active completeness verdict and expire when superseded. |

## Scope Guarantees

- Ordinary support, ops, and patient sessions do not silently widen into break-glass detail.
- Replay, diff, export, and break-glass share the same selected anchor and masking ceiling.
- Wrong-patient hold invalidates cached PHI and forces revalidation before live resume.
