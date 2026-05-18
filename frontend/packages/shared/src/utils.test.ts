import { describe, expect, it } from "vitest";
import { formatDate, groupPostsByArchiveMonth, slugify } from "./utils";

describe("shared utilities", () => {
  it("formats dates and creates readable slugs", () => {
    expect(formatDate("2026-05-17T01:00:00Z")).toContain("2026");
    expect(slugify("Hello, Modular Blog!")).toBe("hello-modular-blog");
  });

  it("groups published posts by archive month", () => {
    const grouped = groupPostsByArchiveMonth([
      { id: 1, title: "One", slug: "one", status: "PUBLISHED", publishedAt: "2026-05-17T01:00:00Z" },
      { id: 2, title: "Two", slug: "two", status: "PUBLISHED", publishedAt: "2026-04-17T01:00:00Z" }
    ]);

    expect(grouped.map((entry) => entry.month)).toEqual(["2026-05", "2026-04"]);
  });
});
