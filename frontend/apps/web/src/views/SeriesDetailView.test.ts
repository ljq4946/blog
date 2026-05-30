import { RouterLinkStub, flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  afterEach(() => {
    document.head.querySelectorAll("meta[data-managed='site'], link[data-managed='site'], script[data-managed='site']")
      .forEach((node) => node.remove());
    document.title = "";
  });

  it("renders ordered series posts", async () => {
    const wrapper = mount(SeriesDetailView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("JWT Login");
    expect(document.title).toBe("Build Blog | 4946 Blog");
    expect(document.querySelector("meta[name='description']")?.getAttribute("content")).toBe("Project");
    expect(JSON.parse(document.querySelector("script[type='application/ld+json'][data-managed='site']")?.textContent || "{}"))
      .toMatchObject({
        "@type": "CollectionPage",
        name: "Build Blog",
        description: "Project",
        url: "http://localhost:5174/series/build-blog"
      });
  });
});
