# Telephony Identifier Vaulting And Masking Rules

Telephony verification handles identifiers that are high-risk in logs, metrics, support views, and tests. The security rule is simple: raw values belong in `IdentityEvidenceVault`; all broad telephony records keep only refs, hashes, and masked fragments.

## Raw Values

The following values must never appear in broad-access telephony tables, logs, traces, analytics labels, screenshots, URLs, or test snapshots:

- full NHS number
- full date of birth
- full surname
- full postcode
- full caller number or caller-ID hint
- verified callback payloads
- handset step-up proof payloads
- IVR consistency raw payloads
- operator correction raw payloads

`TelephonyIdentifierCaptureAttempt` stores `vaultEvidenceRef`, `vaultRef`, `evidenceEnvelopeRef`, `normalizedValueHash`, and `maskedFragment`. Raw values are written with purpose `identity_binding_authority` and retention class `identity_binding_evidence`.

## Masking

Masked fragments are only operational hints, not proof. Examples include a DOB year, a surname initial, a postcode outward fragment, or a phone suffix. They must not be used as scoring input after capture. Scoring uses hashes and boolean proof postures.

## Caller-ID Boundary

Caller ID is always weak bounded evidence. The v1 cap is `0.25`, and caller-ID-only evidence emits `TEL_VERIFY_189_CALLER_ID_ONLY_BLOCKED`. This protects against number reuse, CLI spoofing, shared family phones, and NHS login contact-data confusion.

## Destination Boundary

Destination confidence is separate from identity confidence. A high `P_id` does not imply the SMS destination is safe. Seeded continuation requires `LCB_dest_alpha >= tau_dest` and `P_seed_lower >= tau_seeded` or a future jointly calibrated seed lower bound.

## Binding Boundary

Telephony verification may submit `TelephonyCandidateEvidencePackage` to `IdentityBindingAuthority`, but it may not mutate durable binding locally. `TelephonyVerificationDecision.localBindingMutation` is always `forbidden`.

If `IdentityBindingAuthority` is unavailable, the pipeline emits `TEL_VERIFY_189_AUTHORITY_UNAVAILABLE_NON_BINDING_FALLBACK`, downgrades seeded posture to challenge, and does not cache a local binding.

## Audit And Retention

Every decision carries:

- threshold profile ref
- calibration version refs
- identity assessment ref
- destination assessment ref
- candidate set ref
- capture attempt refs through the evidence package
- vault evidence refs
- reason codes

This is enough to reconstruct why the caller was seeded, challenged, held for manual follow-up, or failed closed without disclosing raw identifiers.
