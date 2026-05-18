import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "./api";

describe("ApiClient", () => {
  it("builds URLs without duplicate slashes and sends bearer tokens", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    }));
    const client = new ApiClient({ baseUrl: "https://api.example.com/api/", getToken: () => "abc", fetcher });

    await client.get("/v1/posts");

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.example.com/api/v1/posts");
    expect((init?.headers as Headers).get("Authorization")).toBe("Bearer abc");
  });
});
