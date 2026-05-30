import { RouterLinkStub, flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import TopicDetailView from "./TopicDetailView.vue";

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => ({ params: { slug: "spring-boot" } })
  };
});

vi.mock("../lib/api", () => ({
  publicApi: {
    topic: vi.fn(async () => ({
      topic: { id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 },
      relatedSeries: [{ id: 2, name: "Build Blog", slug: "build-blog", description: "Project", primaryTopic: null, sortOrder: 0 }],
      posts: [{ id: 3, title: "JWT Login", slug: "jwt-login", summary: "Auth", status: "PUBLISHED", publishedAt: "2026-05-20T00:00:00Z" }]
    }))
  }
}));

describe("TopicDetailView", () => {
  afterEach(() => {
    document.head.querySelectorAll("meta[data-managed='site'], link[data-managed='site'], script[data-managed='site']")
      .forEach((node) => node.remove());
    document.title = "";
  });

  it("renders topic related series and posts", async () => {
    const wrapper = mount(TopicDetailView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("JWT Login");
    expect(document.title).toBe("Spring Boot | 4946 Blog");
    expect(document.querySelector("meta[name='description']")?.getAttribute("content")).toBe("Backend");
    expect(JSON.parse(document.querySelector("script[type='application/ld+json'][data-managed='site']")?.textContent || "{}"))
      .toMatchObject({
        "@type": "CollectionPage",
        name: "Spring Boot",
        description: "Backend",
        url: "http://localhost:5174/topics/spring-boot"
      });
  });
});
