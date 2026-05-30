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
      path: "/posts/reader-upgrade",
      image: "/uploads/cover.png",
      publishedTime: "2026-05-20T00:00:00Z",
      modifiedTime: "2026-05-21T00:00:00Z",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: "Reader Upgrade"
      }
    });

    expect(document.title).toBe("Reader Upgrade | 4946 Blog");
    expect(document.querySelector("meta[name='description']")?.getAttribute("content")).toBe("A better article page");
    expect(document.querySelector("link[rel='canonical']")?.getAttribute("href")).toBe("http://localhost:5174/posts/reader-upgrade");
    expect(document.querySelector("meta[property='og:title']")?.getAttribute("content")).toBe("Reader Upgrade | 4946 Blog");
    expect(document.querySelector("meta[property='og:description']")?.getAttribute("content")).toBe("A better article page");
    expect(document.querySelector("meta[property='og:image']")?.getAttribute("content")).toBe("http://localhost:5174/uploads/cover.png");
    expect(document.querySelector("meta[property='article:published_time']")?.getAttribute("content")).toBe("2026-05-20T00:00:00Z");
    expect(document.querySelector("meta[property='article:modified_time']")?.getAttribute("content")).toBe("2026-05-21T00:00:00Z");
    expect(document.querySelector("meta[name='twitter:card']")?.getAttribute("content")).toBe("summary_large_image");
    expect(document.querySelector("meta[name='twitter:title']")?.getAttribute("content")).toBe("Reader Upgrade | 4946 Blog");
    expect(document.querySelector("meta[name='twitter:image']")?.getAttribute("content")).toBe("http://localhost:5174/uploads/cover.png");
    expect(JSON.parse(document.querySelector("script[type='application/ld+json'][data-managed='site']")?.textContent || "{}"))
      .toMatchObject({ "@type": "BlogPosting", headline: "Reader Upgrade" });
  });

  it("updates managed tags without duplicates and clears article-only metadata", async () => {
    const { applySiteMetadata } = await import("./lib/siteMetadata");

    applySiteMetadata({
      title: "Reader Upgrade",
      description: "A better article page",
      path: "/posts/reader-upgrade",
      image: "/uploads/cover.png",
      publishedTime: "2026-05-20T00:00:00Z",
      structuredData: { "@context": "https://schema.org", "@type": "BlogPosting" }
    });
    applySiteMetadata({
      title: "Archive",
      description: "Browse articles",
      path: "/archive"
    });

    expect(document.querySelectorAll("meta[property='og:title']")).toHaveLength(1);
    expect(document.querySelectorAll("link[rel='canonical']")).toHaveLength(1);
    expect(document.querySelector("meta[property='og:type']")?.getAttribute("content")).toBe("website");
    expect(document.querySelector("meta[property='og:image']")).toBeNull();
    expect(document.querySelector("meta[property='article:published_time']")).toBeNull();
    expect(document.querySelector("script[type='application/ld+json'][data-managed='site']")).toBeNull();
  });
});
