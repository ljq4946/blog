import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import SeriesView from "./SeriesView.vue";

vi.mock("../lib/api", () => ({
  adminApi: {
    topics: vi.fn(async () => [{ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 }]),
    series: vi.fn(async () => [{
      id: 2,
      name: "Build Blog",
      slug: "build-blog",
      description: "Project",
      primaryTopic: { id: 1, name: "Spring Boot", slug: "spring-boot" },
      sortOrder: 0
    }]),
    contentGovernance: vi.fn(async () => ({
      metrics: {
        totalPosts: 2,
        published: 1,
        drafts: 0,
        scheduled: 1,
        missingSummary: 0,
        missingCover: 1,
        missingTopic: 0,
        emptyTopics: 0,
        seriesWithIssues: 1
      },
      postIssues: [],
      topicCoverage: [],
      seriesCoverage: [{
        id: 2,
        name: "Build Blog",
        slug: "build-blog",
        postCount: 2,
        latestPostUpdatedAt: "2026-05-30T00:00:00Z",
        empty: false,
        orderConflict: false,
        missingOrders: [2]
      }]
    })),
    saveSeries: vi.fn(async () => ({
      id: 2,
      name: "Build Blog",
      slug: "build-blog",
      description: "Project",
      primaryTopic: null,
      sortOrder: 0
    })),
    deleteSeries: vi.fn(async () => undefined)
  }
}));

describe("SeriesView", () => {
  it("loads series and primary topic options", async () => {
    const wrapper = mount(SeriesView, { global: { plugins: [ElementPlus] } });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("2 篇文章");
    expect(wrapper.text()).toContain("缺失章节 2");
  });
});
