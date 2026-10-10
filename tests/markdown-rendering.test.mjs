import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createRequire } from "node:module";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(new URL("../package.json", import.meta.url));
const typescript = require("typescript");
const source = await readFile(
  new URL("../src/lib/markdown.tsx", import.meta.url),
  "utf8",
);
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    jsx: typescript.JsxEmit.ReactJSX,
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2022,
  },
});
const markdownModule = { exports: {} };
new Function("exports", "require", "module", outputText)(
  markdownModule.exports,
  require,
  markdownModule,
);

function render(markdown, options) {
  return renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      markdownModule.exports.renderMarkdown(markdown, options),
    ),
  );
}

test("experience Markdown renders supported blocks and line breaks", () => {
  const html = render(
    "# Role\nFirst line\nSecond **bold** line\n\n- One\n- Two\n\n1. First\n2. Second\n\n`code`",
    { headingOffset: 1, lineBreaks: true },
  );

  assert.match(html, /<h2>Role<\/h2>/);
  assert.doesNotMatch(html, /<h1>/);
  assert.match(html, /First line<br\/>Second <strong>bold<\/strong> line/);
  assert.match(html, /<ul><li>One<\/li><li>Two<\/li><\/ul>/);
  assert.match(html, /<ol><li>First<\/li><li>Second<\/li><\/ol>/);
  assert.match(html, /<code>code<\/code>/);
});

test("raw HTML is escaped and unsafe Markdown links are inert", () => {
  const html = render(
    '<script>alert("xss")</script>\n\n[unsafe](javascript:alert(1))\n\n[safe](https://example.com)',
  );

  assert.doesNotMatch(html, /<script>/i);
  assert.match(html, /&lt;script&gt;/i);
  assert.doesNotMatch(html, /href="javascript:/i);
  assert.match(html, /href="https:\/\/example\.com\/" rel="noreferrer"/);
});
