// Regression: Distributor Customers and Reports use the shared list hook OUTSIDE <AdminSessionRoot>; it must not require an admin session.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

describe("shared list hook works in the Distributor portal", () => {
  it("useMastersList uses the optional admin session (never the throwing one)", () => {
    const src = read("features/adminMasters/hooks/useMastersList.js");
    assert.match(src, /useOptionalAdminSession/);
    assert.doesNotMatch(src, /useAdminSession\(\)/);
  });
  it("the optional hook returns null instead of throwing when there is no provider", () => {
    const src = read("features/adminAuth/adminSessionContext.js");
    const fn = src.slice(src.indexOf("export function useOptionalAdminSession"));
    assert.doesNotMatch(fn, /throw/);
  });
});
