# 123 Supplier Capability And Pairing Assumptions

This document captures the supplier-capability law for `par_123`: what Vecells wants to do, what the current IM1 twins simulate, and what cannot be claimed until supplier-specific pairing evidence exists.

## Mock_now_execution

- Supplier assumptions are explicit and versioned.
- The simulator twin is allowed to prove architecture and truth handling.
- No supplier-specific claim is treated as accepted until the real provider pack exists.

## Actual_production_strategy_later

- Optum and TPP are tracked separately.
- Provider-specific capability claims stay explicit and never collapse into generic IM1 success language.
- Supplier-specific PIPs and compatibility review remain mandatory.
- The Model Interface Licence is a distinct legal gate.
- Unsupported test, supported test, assurance, and live remain separate by supplier and environment.

## Matrix excerpt

| Supplier | Capability family | Mock posture | Actual posture |
| --- | --- | --- | --- |
| Optum (EMISWeb) | patient_api_booking_visibility | simulated_or_bounded_only | provider_pack_pending |
| Optum (EMISWeb) | staff_transaction_support | simulated_or_bounded_only | provider_pack_pending |
| Optum (EMISWeb) | confirmation_and_slot_truth | simulated_or_bounded_only | provider_pack_pending |
| Optum (EMISWeb) | gp_practice_linkage_and_account_binding | simulated_or_bounded_only | provider_pack_pending |
| Optum (EMISWeb) | pairing_pack_and_environment_access | simulated_or_bounded_only | provider_pack_pending |

## Supplier assumptions reviewed on `2026-04-14`

- The current official IM1 material still names Optum (EMISWeb) and TPP (SystmOne) as the foundation system providers.
- The Pairing Integration Pack (PIP) remains supplier-specific and arrives after feasibility assessment and acceptance.
- Transaction and appointment behaviour can vary by supplier, and some appointment functionality may only be available via GP Connect depending on the provider PIP.
- IM1 remains live and is not treated here as deprecated.
