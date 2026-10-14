import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Resolves the TypeScript path alias `@/*` -> `<repo>/src/*` for the Node test
 * runner.
 *
 * `node --test` loads the `.mjs` tests directly through Node's ESM loader, which
 * understands neither the `paths` mapping in `tsconfig.json` nor extensionless
 * TypeScript imports. Without this hook, any source module that imports through
 * the alias (for example `src/lib/validations/content.ts` importing
 * `@/lib/media/media-url`) fails with ERR_MODULE_NOT_FOUND under `npm test`
 * while compiling fine in Next and `tsc`.
 *
 * It is registered from the `test` script via `node --import ./tests/alias-hooks.mjs`
 * and only affects the test process; application code keeps the alias.
 */
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_ROOT = path.join(REPO_ROOT, "src");

/** Extensions tried in order when an alias import omits one. */
const RESOLVE_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

/** Resolution failure message, kept in one place so tests can assert on it. */
export function unresolvedAliasMessage(specifier) {
  return `Cannot resolve alias import "${specifier}" from the test process.`;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) {
      return nextResolve(specifier, context);
    }

    const base = path.join(SRC_ROOT, specifier.slice("@/".length));

    for (const extension of RESOLVE_EXTENSIONS) {
      const candidate = `${base}${extension}`;

      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }

    throw new Error(unresolvedAliasMessage(specifier));
  },
});