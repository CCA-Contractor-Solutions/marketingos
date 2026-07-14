import { timingSafeEqual } from "crypto";
import type { CorsOptions } from "cors";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// CORS — restrict browser origins to the Replit app domains.
//
// Native mobile clients, server-to-server calls, and curl send no Origin
// header and are allowed. Same-origin web requests (served through the Replit
// proxy) carry a *.replit.dev / *.replit.app origin and are allowed. Arbitrary
// third-party browser origins are rejected.
// ---------------------------------------------------------------------------

const ALLOWED_HOST_SUFFIXES = [
  ".replit.dev",
  ".replit.app",
  ".repl.co",
  ".replit.com",
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // native apps, curl, server-to-server, same-origin
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin ?? undefined));
  },
};

// ---------------------------------------------------------------------------
// Shared app-token guard for mutating + AI endpoints.
//
// Read (GET/HEAD) endpoints stay public to preserve existing behavior. Every
// mutating request must present `Authorization: Bearer <API_ACCESS_TOKEN>`.
//
// NOTE: this token is shipped to web/mobile clients (VITE_/EXPO_PUBLIC_ env)
// so it is NOT a per-user secret. It gates anonymous public abuse but is not a
// substitute for real authentication, which is a separate approved feature.
// ---------------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function requireApiToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  const configured = process.env["API_ACCESS_TOKEN"];
  if (!configured) {
    // Fail CLOSED. Previously this path called next() when the token was
    // unset, leaving every mutating endpoint unprotected. In production we now
    // refuse the request; in local development we warn and allow so devs are
    // not blocked without a token configured.
    if (process.env["NODE_ENV"] === "production") {
      logger.error(
        "API_ACCESS_TOKEN is not configured — refusing mutating request (fail-closed)",
      );
      res.status(503).json({ error: "Server auth not configured" });
      return;
    }
    logger.warn(
      "API_ACCESS_TOKEN is not configured — allowing mutation in non-production only",
    );
    next();
    return;
  }

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (token && safeEqual(token, configured)) {
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}

// ---------------------------------------------------------------------------
// Lightweight in-memory rate limiter (fixed window, per client IP).
//
// Protects the AI endpoint from runaway OpenAI spend / abuse. No external
// dependency. Keyed on req.ip (Express resolves this from X-Forwarded-For
// when `trust proxy` is enabled).
// ---------------------------------------------------------------------------

type Bucket = { count: number; resetAt: number };

function createRateLimiter(options: { windowMs: number; max: number }) {
  const { windowMs, max } = options;
  const buckets = new Map<string, Bucket>();

  return function rateLimiter(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const now = Date.now();
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";

    // Opportunistic cleanup so the map cannot grow unbounded.
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) {
        if (now > b.resetAt) buckets.delete(k);
      }
    }

    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res
        .status(429)
        .json({ error: "Too many requests. Please slow down and try again." });
      return;
    }

    bucket.count += 1;
    next();
  };
}

// AI endpoint: 15 requests per 5-minute window, per IP.
export const aiRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 15,
});
