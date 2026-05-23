import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

describe("visitor site metadata", () => {
  afterEach(() => {
    document.head.querySelectorAll("meta[data-managed='site'], link[data-managed='site']").forEach((node) => node.remove());
    document.title = "";
  });

  it("uses the personal site name in the document title", () => {
    const indexPath = resolve(process.cwd(), "index.html");
    const indexHtml = readFileSync(indexPath, "utf8");

    expect(indexHtml).toContain("<title>4946个人站</title>");
    expect(indexHtml).not.toContain("模块博客");
  });
  it("applies title, description, canonical, and open graph tags", async () => {
    const { applySiteMetadata } = await import("./lib/siteMetadata");

    applySiteMetadata({
      title: "Reader Upgrade",
      description: "A better article page",
      path: "/posts/reader-upgrade"
    });

    expect(document.title).toBe("Reader Upgrade | 4946 Blog");
    expect(document.querySelector("meta[name='description']")?.getAttribute("content")).toBe("A better article page");
    expect(document.querySelector("link[rel='canonical']")?.getAttribute("href")).toBe("http://localhost:5174/posts/reader-upgrade");
    expect(document.querySelector("meta[property='og:title']")?.getAttribute("content")).toBe("Reader Upgrade | 4946 Blog");
    expect(document.querySelector("meta[property='og:description']")?.getAttribute("content")).toBe("A better article page");
  });
});
