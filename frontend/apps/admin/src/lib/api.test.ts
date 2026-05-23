import { afterEach, describe, expect, it, vi } from "vitest";

describe("adminApi comments", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("calls admin comment list and delete endpoints", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify([]),
      { headers: { "Content-Type": "application/json" } }
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { adminApi } = await import("./api");

    await adminApi.comments();
    await adminApi.deleteComment(7);

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method ?? "GET"])).toEqual([
      ["/api/v1/admin/comments", "GET"],
      ["/api/v1/admin/comments/7", "DELETE"]
    ]);
  });
});
