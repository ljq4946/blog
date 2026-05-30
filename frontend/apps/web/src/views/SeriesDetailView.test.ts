import { RouterLinkStub, flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import SeriesDetailView from "./SeriesDetailView.vue";

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => ({ params: { slug: "build-blog" } })
  };
});

vi.mock("../lib/api", () => ({
  publicApi: {
    series: vi.fn(async () => ({
      series: {
        id: 1,
        name: "Build Blog",
        slug: "build-blog",
        description: "Project",
        primaryTopic: { id: 2, name: "Spring Boot", slug: "spring-boot" },
        sortOrder: 0
      },
      posts: [{ id: 3, title: "JWT Login", slug: "jwt-login", summary: "Auth", status: "PUBLISHED", seriesOrder: 1, publishedAt: "2026-05-20T00:00:00Z" }]
    }))
  }
}));

describe("SeriesDetailView", () => {
  it("renders ordered series posts", async () => {
    const wrapper = mount(SeriesDetailView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("JWT Login");
  });
});
