import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import TopicsView from "./TopicsView.vue";

vi.mock("../lib/api", () => ({
  adminApi: {
    topics: vi.fn(async () => [
      { id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 },
      { id: 2, name: "No Posts", slug: "no-posts", description: "Needs content", sortOrder: 1 }
    ]),
    contentGovernance: vi.fn(async () => ({
      metrics: {
        totalPosts: 2,
        published: 1,
        drafts: 1,
        scheduled: 0,
        missingSummary: 0,
        missingCover: 1,
        missingTopic: 0,
        emptyTopics: 1,
        seriesWithIssues: 0
      },
      postIssues: [],
      topicCoverage: [
        { id: 1, name: "Spring Boot", slug: "spring-boot", postCount: 2, latestPostUpdatedAt: "2026-05-30T00:00:00Z", empty: false },
        { id: 2, name: "No Posts", slug: "no-posts", postCount: 0, latestPostUpdatedAt: null, empty: true }
      ],
      seriesCoverage: []
    })),
    saveTopic: vi.fn(async () => ({ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 })),
    deleteTopic: vi.fn(async () => undefined)
  }
}));

describe("TopicsView", () => {
  it("loads and renders topics", async () => {
    const wrapper = mount(TopicsView, { global: { plugins: [ElementPlus] } });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("spring-boot");
    expect(wrapper.text()).toContain("2 篇文章");
    expect(wrapper.text()).toContain("No Posts");
    expect(wrapper.text()).toContain("空专题");
  });
});
