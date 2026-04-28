# 314 Phase 5 Parallel Open Gate

## Decision

Phase 5 implementation opens in a controlled way: the first backend wave (315 to 317) may start now, later backend and frontend work remains blocked until those implementations land, and operational tracks (335, 336) remain deferred until code consumers and non-production credential windows are both ready.

## Readiness Registry

| Track | Domain | Wave | Status | Depends on | Unlock rule |
| --- | --- | --- | --- | --- | --- |
| par_315 | backend | wave_1 | ready | frozen_contracts_only | ready_now |
| par_316 | backend | wave_1 | ready | frozen_contracts_only | ready_now |
| par_317 | backend | wave_1 | ready | frozen_contracts_only | ready_now |
| par_318 | backend | wave_2 | blocked | par_315, par_317 | Unlock after par_315 and par_317 pass their own validator and integration proof. |
| par_319 | backend | wave_2 | blocked | par_315, par_317, par_318 | Unlock after par_318 exposes stable candidate snapshot and proof outputs. |
| par_320 | backend | wave_2 | blocked | par_315, par_318, par_319 | Unlock after par_318 and par_319 publish stable candidate and queue feeds. |
| par_321 | backend | wave_2 | blocked | par_315, par_316, par_318, par_320 | Unlock after par_315, par_316, par_318, and par_320 are validated together. |
| par_322 | backend | wave_2 | blocked | par_316, par_321 | Unlock after par_321 exposes authoritative commit and truth-projection reducer outputs. |
| par_323 | backend | wave_2 | blocked | par_315, par_320, par_322 | Unlock after par_320 and par_322 publish offer and acknowledgement signals. |
| par_324 | backend | wave_2 | blocked | par_316, par_321, par_322 | Unlock after par_321 and par_322 expose stable truth and continuity feeds. |
| par_325 | backend | wave_2 | blocked | par_321, par_322, par_323, par_324 | Unlock after par_321 through par_324 provide the canonical evidence, continuity, fallback, and manage feeds. |
| par_326 | frontend | wave_3 | blocked | par_315, par_316, par_319, par_325 | Unlock after backend queue and exception projections are stable enough to mount in a real shell. |
| par_327 | frontend | wave_3 | blocked | par_318, par_319, par_326 | Unlock after par_318 and par_319 publish stable candidate and queue feeds. |
| par_328 | frontend | wave_3 | blocked | par_320, par_323, par_326 | Unlock after par_320 and par_323 publish stable patient-choice and fallback feeds. |
| par_329 | frontend | wave_3 | blocked | par_321, par_322, par_324, par_326 | Unlock after par_321, par_322, and par_324 expose stable confirmation and visibility feeds. |
| par_330 | frontend | wave_3 | blocked | par_322, par_324, par_329 | Unlock after par_322, par_324, and par_329 are stable together. |
| par_331 | frontend | wave_3 | blocked | par_323, par_325, par_326 | Unlock after par_323 and par_325 publish stable exception and worker-outcome feeds. |
| par_332 | frontend | wave_3 | blocked | par_316, par_326 | Unlock after par_316 and par_326 expose stable acting-context and shell contracts. |
| par_333 | frontend | wave_3 | blocked | par_326, par_327, par_329, par_332 | Unlock after shell, queue, confirmation, and acting-context surfaces are already stable on desktop. |
| par_334 | frontend | wave_3 | blocked | par_329, par_330, par_331, par_332, par_333 | Unlock after the wave-3 frontend family exists and is Playwright-proven. |
| seq_335 | ops | ops | deferred | par_322, par_324, par_329, par_334 | Unlock after par_322, par_324, par_329, and par_334 are merged and a non-production credential window is approved. |
| seq_336 | ops | ops | deferred | par_317, par_318, par_319, par_333 | Unlock after par_317, par_318, and par_319 are merged and a non-production partner credential window is approved. |
| seq_337 | integration | integration | blocked | par_326, par_327, par_328, par_329, par_330, par_331, par_332, par_333, par_334, seq_335, seq_336 | Unlock only after wave-2, wave-3, and operational tasks are complete. |
| seq_338 | testing | proof | blocked | par_315, par_316, par_317, par_318, par_319, par_326, par_327, par_332, seq_337 | Unlock after the pre-commit backend and frontend family is integrated by seq_337. |
| seq_339 | testing | proof | blocked | par_320, par_321, par_322, par_323, par_324, par_325, par_328, par_329, par_330, par_331, seq_335, seq_337, seq_338 | Unlock after the post-selection backend, frontend, and MESH route tracks are complete. |
| seq_340 | testing | proof | blocked | par_328, par_329, par_330, par_332, par_333, par_334, seq_337, seq_339 | Unlock after seq_337 and seq_339 are complete and the responsive frontend family is stable. |

## Operational Posture

- seq_335 is deferred because MESH route wiring is security-sensitive and should only open once continuity code, visibility surfaces, and a non-production credential window are ready together.
- seq_336 is deferred because partner capacity feeds and credentials are likewise security-sensitive and should only open once policy, ingestion, and mapping code exist.
- seq_337 to seq_340 remain blocked because integration and proof work only become meaningful after the backend, frontend, and operational layers exist together.

## Merge Law

- No track may rename frozen 311 to 313 object names, enums, route families, audience tiers, tuple hashes, or truth-state vocabulary.
- par_321 is the only canonical persisted writer for HubOfferToConfirmationTruthProjection; sibling tracks must emit typed deltas only.
- par_325 is the only owner of HubSupplierMirrorState; par_321 may emit bootstrap requests but may not persist mirror state.
- par_323 is the only owner and creator of canonical HubCoordinationException rows; par_325 may emit worker outcomes only.
- par_317 may not change rank order or frontier law that 312 already froze; service obligation and practice visibility remain non-ordering dimensions.
- par_326 through seq_340 must inherit ISSUE310_003 until browser-visible evidence proves the 200ms interaction support target.
- par_321 through par_325 must keep live, sandbox, unsupported, and future-network provider claims visibly separated.
- No blocked or deferred track may be marked ready until all of its upstream tracks are complete and the 314 validator is rerun.
