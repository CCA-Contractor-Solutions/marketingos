---
name: Artifact workflow port detection
description: Why an artifact workflow can fail with DIDNT_OPEN_A_PORT even though the dev server serves 200 locally
---

A react-vite (or any) artifact whose `artifact.toml` `localPort`/`PORT` is a non-standard
high port (e.g. 22333) will have its workflow fail with `DIDNT_OPEN_A_PORT` — the platform's
`waitForPort` detection never sees the listener — even though the dev server is genuinely
listening and `curl 127.0.0.1:<port>/` returns 200.

**Why:** The platform only reliably detects/forwards a known set of standard ports
(3000-3003, 4200, 5000, 5173, 6000, 6800, 8000, 8008, 8080, 8099, 9000). Working artifacts
in this repo use standard ports (api-server=8080, mockup-sandbox=8081). A high random port
is not picked up by the detection layer regardless of `.replit [[ports]]`.

**How to apply:** If an artifact workflow fails with DIDNT_OPEN_A_PORT but the server serves
200 manually, change the service `localPort` and `services.env.PORT` to a free standard port
via the validated `verifyAndReplaceArtifactToml` flow (write a full sibling `artifact.edit.toml`,
then call the callback — never edit `artifact.toml` in place). Then restart the workflow.
