import assert from "node:assert/strict";
import test from "node:test";

import { isPublicProject } from "../src/lib/project-visibility.mjs";

test("only published public projects are visible", () => {
  assert.equal(
    isPublicProject({ status: "published", visibility: "PUBLIC" }),
    true,
  );
  assert.equal(
    isPublicProject({ status: "published", visibility: "UNLISTED" }),
    false,
  );
  assert.equal(
    isPublicProject({ status: "published", visibility: "PRIVATE" }),
    false,
  );
  assert.equal(
    isPublicProject({ status: "draft", visibility: "PUBLIC" }),
    false,
  );
  assert.equal(isPublicProject(null), false);
  assert.equal(isPublicProject(undefined), false);
});
