/**
 * Brute-force protection for the admin login.
 *
 * The limiter is deliberately in-memory and per-instance: this portfolio runs
 * as a single Node process (or a single serverless region), so a module-scope
 * Map is enough to slow credential stuffing against `/admin/login`. It is *not*
 * a substitute for an edge/WAF rate limit, and it does not share counters
 * across instances — if the site is ever deployed behind a load balancer with
 * several instances, back this with a shared store (for example Upstash Redis)
 * instead of this module.
 *
 * Failures are counted per key so an attacker cannot lock out the real admin by
 * spraying unknown emails: only the key they are hammering is throttled.
 */

/** Sliding window length. */
const WINDOW_MS = 15 * 60 * 1000;
/** Attempts allowed inside the window before the key is throttled. */
const MAX_ATTEMPTS = 5;
/** Upper bound on tracked keys so the map cannot grow without limit. */
const MAX_TRACKED_KEYS = 10_000;

type AttemptRecord = {
  /** Timestamps (epoch ms) of recent failures inside the current window. */
  timestamps: number[];
};

const attempts = new Map<string, AttemptRecord>();

/**
 * Prunes old entries and evicts the oldest key once the map is full. Called
 * lazily from the hot path so no separate timer is needed.
 */
function prune() {
  if (attempts.size <= MAX_TRACKED_KEYS) {
    return;
  }

  // Evict the keys with the least recent activity first.
  const oldestFirst = [...attempts.entries()].sort(
    (left, right) =>
      (right[1].timestamps.at(-1) ?? 0) - (left[1].timestamps.at(-1) ?? 0),
  );

  for (const [key] of oldestFirst.slice(MAX_TRACKED_KEYS)) {
    attempts.delete(key);
  }
}

export type LoginThrottleState = {
  /** Whether the key is currently locked out. */
  throttled: boolean;
  /** Seconds until the next attempt is allowed, or 0 when not throttled. */
  retryAfterSeconds: number;
};

/**
 * Reads the current state for a key without recording a failure.
 *
 * Used before doing any work so an already-throttled caller is rejected
 * without spending a PBKDF2 round.
 */
export function peekLoginThrottle(key: string, now = Date.now()): LoginThrottleState {
  const record = attempts.get(key);

  if (!record) {
    return { throttled: false, retryAfterSeconds: 0 };
  }

  const windowStart = now - WINDOW_MS;
  const recent = record.timestamps.filter((timestamp) => timestamp > windowStart);

  if (recent.length < MAX_ATTEMPTS) {
    return { throttled: false, retryAfterSeconds: 0 };
  }

  // The oldest of the recent failures is what frees a slot first.
  const oldestRecent = recent[0];
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((oldestRecent + WINDOW_MS - now) / 1000),
  );

  return { throttled: true, retryAfterSeconds };
}

/**
 * Records a failed attempt for a key and returns its updated state.
 *
 * Successful logins call {@link clearLoginThrottle} instead, so a legitimate
 * user who mistypes a few times is not penalised after they get in.
 */
export function recordLoginFailure(key: string, now = Date.now()): LoginThrottleState {
  const windowStart = now - WINDOW_MS;
  const record = attempts.get(key) ?? { timestamps: [] };
  const recent = record.timestamps.filter((timestamp) => timestamp > windowStart);

  recent.push(now);
  record.timestamps = recent;
  attempts.set(key, record);

  prune();

  if (recent.length < MAX_ATTEMPTS) {
    return { throttled: false, retryAfterSeconds: 0 };
  }

  const oldestRecent = recent[0];
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((oldestRecent + WINDOW_MS - now) / 1000),
  );

  return { throttled: true, retryAfterSeconds };
}

/** Drops all failures for a key, called after a successful authentication. */
export function clearLoginThrottle(key: string): void {
  attempts.delete(key);
}

/** Test hook: empties all tracked attempts. Never called by application code. */
export function resetLoginThrottle(): void {
  attempts.clear();
}