import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import ContentMapView from "./ContentMapView.vue";

const contentGovernanceMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  adminApi: {
    contentGovernance: contentGovernanceMock
  }
}));

describe("ContentMapView", () => {
  it("turns governance data into a topic and series content map", async () => {
    contentGovernanceMock.mockResolvedValue({
      metrics: {
        totalPosts: 4,
        published: 2,
        drafts: 1,
        scheduled: 1,
        missingSummary: 1,
        missingCover: 2,
        missingTopic: 1,
        emptyTopics: 1,
        seriesWithIssues: 1
      },
      postIssues: [{
        id: 7,
        title: "Needs Polish",
        slug: "needs-polish",
        status: "DRAFT",
        issues: ["MISSING_SUMMARY", "MISSING_COVER"],
        updatedAt: "2026-05-30T00:00:00Z"
      }],
      topicCoverage: [
        { id: 1, name: "Spring Boot", slug: "spring-boot", postCount: 3, latestPostUpdatedAt: "2026-05-30T00:00:00Z", empty: false },
        { id: 2, name: "No Posts", slug: "no-posts", postCount: 0, latestPostUpdatedAt: null, empty: true }
      ],
      seriesCoverage: [{
        id: 3,
        name: "Build Blog",
        slug: "build-blog",
        postCount: 2,
        latestPostUpdatedAt: "2026-05-30T00:00:00Z",
        empty: false,
        orderConflict: false,
        missingOrders: [2]
      }]
    });

    const wrapper = mount(ContentMapView, { global: { plugins: [ElementPlus] } });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("内容地图");
    expect(wrapper.text()).toContain("为 No Posts 写首篇文章");
    expect(wrapper.text()).toContain("补齐 Build Blog 第 2 章");
    expect(wrapper.text()).toContain("完善 Needs Polish");
    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("3 篇文章");
    expect(wrapper.text()).toContain("空专题");
    expect(wrapper.text()).toContain("缺摘要");
    expect(wrapper.text()).toContain("缺封面");
  });
});
