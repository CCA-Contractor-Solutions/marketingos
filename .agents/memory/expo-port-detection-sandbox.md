---
name: Expo workflow port detection in the task-agent sandbox
description: Why an expo (expo-domain) artifact workflow fails with DIDNT_OPEN_A_PORT and can't be screenshotted in the isolated task-agent environment
---

An `expo` artifact (router = "expo-domain") workflow reliably fails with
`DIDNT_OPEN_A_PORT` in the task-agent sandbox even though Metro starts cleanly and
the dev server genuinely serves HTTP 200. Started detached and probed directly,
`curl http://127.0.0.1:<port>/status` returns 200, but `ss`/`netstat` show *nothing*
listening on that port — Metro's socket is invisible to kernel socket enumeration,
which is what the platform's port detector relies on. So the workflow never goes
healthy, the Expo dev domain proxy refuses to route (screenshot → PAGE_UNREACHABLE),
and Metro gets SIGKILLed when the blocking restart times out.

**Why this matters / what NOT to waste time on:**
- It is NOT a port-number problem. Both the system-assigned high port (e.g. 18115)
  and a "standard" port (e.g. 8000) fail identically. The standard-port fix in
  `artifact-port-assignment.md` is for path-router web artifacts and does NOT apply
  to expo-domain artifacts.
- It is NOT `--localhost` / IPv6: removing `--localhost` doesn't change the outcome.
  (Metro does bind IPv4 127.0.0.1 — curl 200 there — just not visibly to the detector.)
- `restart_workflow` blocks the entire turn AND tears down all other workflows +
  any background processes, so you cannot probe or screenshot a live Metro from a
  separate concurrent call. The only way to inspect a running Metro is to launch it
  yourself detached via `setsid` (supplying PORT/REACT_NATIVE_PACKAGER_HOSTNAME/
  EXPO_PACKAGER_PROXY_URL/EXPO_PUBLIC_* env) and curl 127.0.0.1:<port> — but the
  public expo dev domain still won't route to it because routing is gated on the
  workflow being "running".

**How to apply:** Verify an Expo build via `typecheck`, by confirming Metro serves
200 from a detached `setsid expo start` probe, and by curl-verifying the api-server it
talks to. Do not burn cycles re-running `restart_workflow` or retrying screenshots —
the dev-server preview/health check is an environment limitation here; it works in
the normal (merged) Replit environment. Keep the system-generated scaffold config
(port + `--localhost`) intact rather than editing it speculatively.
