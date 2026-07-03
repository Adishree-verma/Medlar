---
name: Port conflict between medlar and API server workflows
description: How the workflow system assigns PORT env vars and how to fix EADDRINUSE conflicts
---

The workflow system uses the `localPort` value in `artifact.toml` to set the `PORT` environment variable for the workflow process — this overrides any `[services.env]` PORT setting.

**Why:** Both medlar (`paths=["/"]`, localPort=8080) and API server (localPort=8080) were competing for the same port. The medlar dev workflow always starts first and won the race.

**Fix:** Change medlar's `localPort` to 8082. Now the workflow system passes PORT=8082 to dev-server.mjs, freeing 8080 for the API server. The proxy routes "/" to 8082 (medlar static frontend) and "/api" to 8080 (API server).

**How to apply:** Always use `verifyAndReplaceArtifactToml()` to change localPort — never edit artifact.toml directly. Write to a `.edit.toml` sibling file first, then call the callback.

**Current port layout:**
- medlar dev-server: 8082 (serves built frontend from dist/public)
- API server: 8080 (handles /api routes + serves frontend as fallback for production)
