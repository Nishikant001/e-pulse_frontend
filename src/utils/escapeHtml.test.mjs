import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "./escapeHtml.js";
test("escapes markup and quotes", () => {
  assert.equal(escapeHtml(`<img src=x onerror="a('b')">&`), "&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;");
});
test("null/undefined become empty", () => { assert.equal(escapeHtml(null), ""); assert.equal(escapeHtml(undefined), ""); assert.equal(escapeHtml(0), "0"); });
