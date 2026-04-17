# Adapter Simulator Manifest Contracts

Seq_038 publishes the canonical simulator backlog at:

- `/Users/test/Code/V/data/analysis/adapter_simulator_contract_manifest.json`
- `/Users/test/Code/V/data/analysis/adapter_simulator_backlog.csv`
- `/Users/test/Code/V/data/analysis/adapter_real_provider_gap_map.json`

## Purpose

This folder is the contract boundary for local adapter simulators. It exists so later tasks can reuse one manifest for:

- generator-driven docs and internal studios
- validator and Playwright checks
- seed-data selection for simulator services
- live-provider replacement planning without mock drift

## Non-negotiable rules

- simulators preserve proof, ambiguity, degraded, expiry, and manual-fallback semantics
- live onboarding never changes those semantics without updating the manifest and delta register
- runtime success from a simulator is never treated as live external confirmation
- optional or deferred seams still need explicit replacement or fallback posture

## Update flow

1. Edit `tools/analysis/build_adapter_simulator_backlog.py`.
2. Re-run the generator.
3. Run `tools/analysis/validate_adapter_simulator_backlog.py`.
4. Run `tests/playwright/adapter-simulator-backlog-studio.spec.js --run`.

## Current summary

- simulator rows: `17`
- execution phases: `4`
- replacement modes: guarded `2`, hybrid `13`, permanent fallback `2`
