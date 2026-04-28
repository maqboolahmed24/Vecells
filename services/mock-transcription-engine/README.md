# Mock Transcription Engine

Local provider twin for seq_035. It preserves `queued`, `partial`, `ready`, `failed`, and `superseded` transcript states plus callback-signature retry and evidence-readiness hold behavior.

Run with:

```bash
node src/server.js
```

