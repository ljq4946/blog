import { RouterLinkStub, flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
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
  it("renders topic related series and posts", async () => {
    const wrapper = mount(TopicDetailView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("JWT Login");
  });
});
