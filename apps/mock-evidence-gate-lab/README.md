# Mock Evidence Gate Lab

Local rehearsal app for seq_035. It visualizes transcript and scan project setup, policy posture, event timelines, and fail-closed live gates without touching real providers.

Default preview assumptions:
- transcription engine: `http://127.0.0.1:4200`
- artifact scan gateway: `http://127.0.0.1:4201`
- app preview: `http://127.0.0.1:4202`

The app consumes the generated pack from:
- `data/analysis/35_evidence_processing_lab_pack.json`
- `src/generated/evidenceGateLabPack.ts`

