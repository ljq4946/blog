import { afterEach, describe, expect, it, vi } from "vitest";

describe("adminApi comments", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("calls admin comment list, status, and delete endpoints", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify([]),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { adminApi } = await import("./api");

    await adminApi.comments();
    await adminApi.updateCommentStatus(7, "APPROVED");
    await adminApi.deleteComment(7);

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method ?? "GET"])).toEqual([
      ["/api/v1/admin/comments", "GET"],
      ["/api/v1/admin/comments/7/status", "PUT"],
      ["/api/v1/admin/comments/7", "DELETE"]
    ]);
  });

  it("calls revision, media reference, governance, statistics, and operation log endpoints", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify([]),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { adminApi } = await import("./api");

    await adminApi.postRevisions(5);
    await adminApi.restorePostRevision(5, 9);
    await adminApi.mediaReferences(3);
    await adminApi.contentGovernance();
    await adminApi.statistics();
    await adminApi.operationLogs();

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method ?? "GET"])).toEqual([
      ["/api/v1/admin/posts/5/revisions", "GET"],
      ["/api/v1/admin/posts/5/revisions/9/restore", "POST"],
      ["/api/v1/admin/media/3/references", "GET"],
      ["/api/v1/admin/content-governance", "GET"],
      ["/api/v1/admin/statistics", "GET"],
      ["/api/v1/admin/operation-logs", "GET"]
    ]);
  });

  it("calls admin home profile load and save endpoints", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({
        key: "home",
        musicTitle: "私人电台",
        musicSubtitle: "深夜写作清单",
        musicMeta: "lo-fi",
        musicAudioUrl: "/uploads/focus.mp3",
        aboutKicker: "About / 4946",
        aboutTitle: "我是 4946",
        aboutBody: "公开笔记",
        focusItems: [{ label: "正在写", text: "首页配置" }],
        updatedAt: "2026-05-24T00:00:00Z"
      }),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { adminApi } = await import("./api");

    await adminApi.homeProfile();
    await adminApi.saveHomeProfile({
      musicTitle: "私人电台",
      musicSubtitle: "深夜写作清单",
      musicMeta: "lo-fi",
      musicAudioUrl: "/uploads/focus.mp3",
      aboutKicker: "About / 4946",
      aboutTitle: "我是 4946",
      aboutBody: "公开笔记",
      focusItems: [{ label: "正在写", text: "首页配置" }]
    });

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method ?? "GET"])).toEqual([
      ["/api/v1/admin/home-profile", "GET"],
      ["/api/v1/admin/home-profile", "PUT"]
    ]);
  });

  it("calls admin topic and series endpoints", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify([]),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { adminApi } = await import("./api");

    await adminApi.topics();
    await adminApi.saveTopic({ name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 });
    await adminApi.deleteTopic(3);
    await adminApi.series();
    await adminApi.saveSeries({
      name: "Build Blog",
      slug: "build-blog",
      description: "Project",
      primaryTopicId: 3,
      sortOrder: 0
    });
    await adminApi.deleteSeries(4);

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method ?? "GET"])).toEqual([
      ["/api/v1/admin/topics", "GET"],
      ["/api/v1/admin/topics", "POST"],
      ["/api/v1/admin/topics/3", "DELETE"],
      ["/api/v1/admin/series", "GET"],
      ["/api/v1/admin/series", "POST"],
      ["/api/v1/admin/series/4", "DELETE"]
    ]);
  });
});
