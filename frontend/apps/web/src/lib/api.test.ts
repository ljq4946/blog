import { afterEach, describe, expect, it, vi } from "vitest";

describe("publicApi.searchPosts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("builds search query params while preserving page zero", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 }),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { publicApi } = await import("./api");

    await publicApi.searchPosts({
      keyword: " vue ",
      year: 2026,
      category: "frontend",
      tag: "notes",
      page: 0,
      size: 10,
      sort: "publishedAt,desc"
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/v1/posts/search?keyword=vue&year=2026&category=frontend&tag=notes&page=0&size=10&sort=publishedAt%2Cdesc"
    );
  });

  it("omits empty search params", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 }),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { publicApi } = await import("./api");

    await publicApi.searchPosts({
      keyword: "",
      year: "",
      category: undefined,
      tag: "   ",
      page: undefined,
      size: 10,
      sort: ""
    });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/posts/search?size=10");
  });

  it("calls comment and like endpoints for a post slug", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ count: 4 }),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { publicApi } = await import("./api");

    await publicApi.comments("reader-upgrade");
    await publicApi.createComment("reader-upgrade", {
      nickname: "Ada",
      email: "ada@example.com",
      content: "Plain comment"
    });
    await publicApi.likes("reader-upgrade");
    await publicApi.likePost("reader-upgrade");

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method ?? "GET"])).toEqual([
      ["/api/v1/posts/reader-upgrade/comments", "GET"],
      ["/api/v1/posts/reader-upgrade/comments", "POST"],
      ["/api/v1/posts/reader-upgrade/likes", "GET"],
      ["/api/v1/posts/reader-upgrade/likes", "POST"]
    ]);
    expect(fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify({
      nickname: "Ada",
      email: "ada@example.com",
      content: "Plain comment"
    }));
  });
});
