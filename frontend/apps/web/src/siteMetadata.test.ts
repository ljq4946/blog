import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("visitor site metadata", () => {
  it("uses the personal site name in the document title", () => {
    const indexPath = resolve(process.cwd(), "index.html");
    const indexHtml = readFileSync(indexPath, "utf8");

    expect(indexHtml).toContain("<title>4946个人站</title>");
    expect(indexHtml).not.toContain("模块博客");
  });
});
