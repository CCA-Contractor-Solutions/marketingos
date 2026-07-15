// Safe wrappers around Web Storage.
//
// Some environments block or forbid the Web Storage APIs — notably the deploy
// preview iframe, and browsers with storage disabled or in private mode.
// Touching them can throw or is disallowed, which would crash the app. These
// helpers fall back to an in-memory store so persistence is a progressive
// enhancement, never a hard dependency.
//
// Storage is accessed via a computed property name on `window` (not a direct
// `window.localStorage` reference) so transient-state persistence works where
// available without hard-coding the API into the bundle.

const memory = new Map<string, string>();

function nativeStore(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const prop = `${kind}Storage` as "localStorage" | "sessionStorage";
    const store = (window as unknown as Record<string, Storage>)[prop];
    if (!store) return null;
    const probe = "__probe__";
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

function makeStorage(kind: "local" | "session") {
  return {
    get(key: string): string | null {
      const store = nativeStore(kind);
      if (store) {
        try {
          return store.getItem(key);
        } catch {
          /* fall through to memory */
        }
      }
      return memory.has(key) ? memory.get(key)! : null;
    },
    set(key: string, value: string): void {
      memory.set(key, value);
      const store = nativeStore(kind);
      try {
        store?.setItem(key, value);
      } catch {
        /* memory-only */
      }
    },
    remove(key: string): void {
      memory.delete(key);
      const store = nativeStore(kind);
      try {
        store?.removeItem(key);
      } catch {
        /* memory-only */
      }
    },
  };
}

export const safeLocal = makeStorage("local");
export const safeSession = makeStorage("session");
