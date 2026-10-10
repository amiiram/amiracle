import assert from "node:assert/strict";
import test from "node:test";

import { experienceSchema } from "../src/lib/validations/content.ts";

const validExperience = {
  slug: "Frontend Developer Example Studio",
  company: "Example Studio",
  role: "Frontend developer",
  location: "",
  summary: "",
  startDate: "2022-03-01",
  endDate: "",
  isCurrent: false,
  description: "",
  projectIds: [],
  technologyIds: [],
};

test("experience validation accepts optional fields and current roles", () => {
  const result = experienceSchema.safeParse({
    ...validExperience,
    isCurrent: true,
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.equal(result.data.startDate.toISOString(), "2022-03-01T00:00:00.000Z");
  assert.equal(result.data.endDate, null);
  assert.equal(result.data.slug, "frontend-developer-example-studio");
});

test("experience validation rejects impossible dates and inconsistent ranges", () => {
  assert.equal(
    experienceSchema.safeParse({
      ...validExperience,
      startDate: "2024-02-31",
    }).success,
    false,
  );
  assert.equal(
    experienceSchema.safeParse({
      ...validExperience,
      startDate: "2024-03-01",
      endDate: "2024-02-01",
    }).success,
    false,
  );
  assert.equal(
    experienceSchema.safeParse({
      ...validExperience,
      endDate: "2024-03-01",
      isCurrent: true,
    }).success,
    false,
  );
});

test("experience validation de-duplicates relation ids and limits summary text", () => {
  const result = experienceSchema.safeParse({
    ...validExperience,
    projectIds: ["project-1", "project-1"],
    technologyIds: ["technology-1", "technology-2"],
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.deepEqual(result.data.projectIds, ["project-1"]);
  assert.deepEqual(result.data.technologyIds, ["technology-1", "technology-2"]);
  assert.equal(
    experienceSchema.safeParse({
      ...validExperience,
      summary: "x".repeat(281),
    }).success,
    false,
  );
});
