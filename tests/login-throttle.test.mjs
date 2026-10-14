import assert from "node:assert/strict";
import test from "node:test";

import {
  clearLoginThrottle,
  peekLoginThrottle,
  recordLoginFailure,
  resetLoginThrottle,
} from "@/lib/auth/login-throttle";

test("a key is not throttled before it reaches the failure limit", () => {
  resetLoginThrottle();
  const key = "1.2.3.4:user@example.com";

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const state = recordLoginFailure(key);
    assert.equal(state.throttled, false);
  }

  assert.equal(peekLoginThrottle(key).throttled, false);
});

test("a key is throttled once it reaches the failure limit", () => {
  resetLoginThrottle();
  const key = "5.6.7.8:locked@example.com";

  let finalState;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    finalState = recordLoginFailure(key);
  }

  assert.equal(finalState.throttled, true);
  assert.ok(finalState.retryAfterSeconds > 0);
  assert.equal(peekLoginThrottle(key).throttled, true);
});

test("failures are isolated per key", () => {
  resetLoginThrottle();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    recordLoginFailure("9.9.9.9:attacker@example.com");
  }

  assert.equal(peekLoginThrottle("9.9.9.9:attacker@example.com").throttled, true);
  assert.equal(peekLoginThrottle("9.9.9.9:victim@example.com").throttled, false);
});

test("clearing a key removes its throttle state", () => {
  resetLoginThrottle();
  const key = "2.2.2.2:reset@example.com";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    recordLoginFailure(key);
  }

  assert.equal(peekLoginThrottle(key).throttled, true);

  clearLoginThrottle(key);
  assert.equal(peekLoginThrottle(key).throttled, false);
});

test("failures outside the window stop counting toward the limit", () => {
  resetLoginThrottle();
  const key = "3.3.3.3:window@example.com";
  const now = Date.now();

  // Four failures well outside the 15-minute window, then a fifth inside it.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    recordLoginFailure(key, now - 16 * 60 * 1000 + attempt);
  }

  const state = recordLoginFailure(key, now);
  assert.equal(
    state.throttled,
    false,
    "failures older than the window must not throttle",
  );
});