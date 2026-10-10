/**
 * Only published public projects are exposed on the public site.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPublicProject(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const project = /** @type {{ status?: unknown; visibility?: unknown }} */ (
    value
  );

  return project.status === "published" && project.visibility === "PUBLIC";
}
