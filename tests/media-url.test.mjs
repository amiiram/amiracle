import assert from "node:assert/strict";
import test from "node:test";

import {
  INVALID_MEDIA_URL_MESSAGE,
  isValidMediaUrl,
} from "@/lib/media/media-url";

test("application-relative media paths are accepted", () => {
  assert.equal(isValidMediaUrl("/media/projects/video-platform/demo.mp4"), true);
  assert.equal(isValidMediaUrl("/media/projects/persian-calendar/banner.svg"), true);
  assert.equal(isValidMediaUrl("/media/cover.PNG"), true);
  assert.equal(isValidMediaUrl("/media/preview.webp?width=800#top"), true);
});

test("absolute http(s) media URLs are accepted", () => {
  assert.equal(isValidMediaUrl("https://example.com/cover.png"), true);
  assert.equal(isValidMediaUrl("http://example.com/cover.png"), true);
  assert.equal(isValidMediaUrl("  https://example.com/cover.png  "), true);
});

test("unsafe and malformed media URLs are rejected", () => {
  const rejected = [
    "",
    "   ",
    // Protocol-relative and non-http schemes.
    "//example.com/cover.png",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,AAAA",
    "file:///etc/passwd",
    // Local filesystem paths.
    "C:\\media\\cover.png",
    "C:/media/cover.png",
    "/media/../secrets.png",
    "/media/./cover.png",
    "/media/a/../b.png",
    // Extensionless blobs cannot be rendered by the browser as-is.
    "/media/cover",
    "/media/cover.",
    // Not a path at all.
    "media/cover.png",
  ];

  for (const value of rejected) {
    assert.equal(isValidMediaUrl(value), false, `expected rejection for ${JSON.stringify(value)}`);
  }
});

test("rejected URLs share one canonical message", () => {
  assert.equal(typeof INVALID_MEDIA_URL_MESSAGE, "string");
  assert.match(INVALID_MEDIA_URL_MESSAGE, /https?:\/\//);
});