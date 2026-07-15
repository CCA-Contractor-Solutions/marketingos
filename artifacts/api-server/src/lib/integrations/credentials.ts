// ---------------------------------------------------------------------------
// Phase 4 — Credential resolution.
//
// The whole security model: the database (`integrations.credentialsReference`
// / `config`) stores only a NAME (an env var / vault-key name) — never a raw
// secret value. At runtime, connectors resolve that name to an actual value
// via `resolveCredential`, which reads `process.env` ONLY. Nothing here ever
// logs, stores, or echoes a resolved value — only the reference name is safe
// to log.
// ---------------------------------------------------------------------------

export function resolveCredential(ref: string | null | undefined): string | undefined {
  if (!ref) return undefined;
  const value = process.env[ref];
  if (!value) {
    // Safe: logs the reference NAME only, never a value.
    // eslint-disable-next-line no-console
    console.warn(`missing credential: ${ref}`);
    return undefined;
  }
  return value;
}

/**
 * Resolve a list of required credential reference names, returning which
 * ones are missing (by name only — never values). Used by `validateAuth`
 * implementations and `POST /integrations/:id/connect`.
 */
export function checkRequiredCredentials(refs: string[]): { ok: boolean; missing: string[] } {
  const missing = refs.filter((ref) => resolveCredential(ref) === undefined);
  return { ok: missing.length === 0, missing };
}
