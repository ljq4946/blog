import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import DashboardView from "./DashboardView.vue";

const contentGovernanceMock = vi.hoisted(() => vi.fn());
const operationLogsMock = vi.hoisted(() => vi.fn());
const statisticsMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  adminApi: {
    contentGovernance: contentGovernanceMock,
    statistics: statisticsMock,
    operationLogs: operationLogsMock
  }
}));

describe("DashboardView", () => {
  it("renders governance metrics, post issues, topic coverage, and series gaps", async () => {
    contentGovernanceMock.mockResolvedValue({
      metrics: {
        totalPosts: 3,
        published: 1,
        drafts: 1,
        scheduled: 1,
        missingSummary: 1,
        missingCover: 2,
        missingTopic: 1,
        emptyTopics: 1,
        seriesWithIssues: 1
      },
      postIssues: [{
        id: 2,
        title: "Needs Work",
        slug: "needs-work",
        status: "DRAFT",
        issues: ["MISSING_SUMMARY", "MISSING_COVER", "MISSING_TOPIC"],
        updatedAt: "2026-05-30T00:00:00Z"
      }],
      topicCoverage: [
        { id: 1, name: "Spring Boot", slug: "spring-boot", postCount: 2, latestPostUpdatedAt: "2026-05-30T00:00:00Z", empty: false },
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
    statisticsMock.mockResolvedValue({
      metrics: {
        totalViews: 18,
        totalLikes: 7,
        totalComments: 4,
        pendingComments: 2,
        approvedComments: 1,
        rejectedComments: 1
      },
      popularPosts: [{
        id: 1,
        title: "Popular One",
        slug: "popular-one",
        viewCount: 12,
        likeCount: 5,
        commentCount: 3,
        publishedAt: "2026-05-30T00:00:00Z"
      }]
    });
    operationLogsMock.mockResolvedValue([]);

    const wrapper = mount(DashboardView, { global: { plugins: [ElementPlus] } });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("内容治理");
    expect(wrapper.text()).toContain("缺封面");
    expect(wrapper.text()).toContain("Needs Work");
    expect(wrapper.text()).toContain("缺摘要");
    expect(wrapper.text()).toContain("No Posts");
    expect(wrapper.text()).toContain("空专题");
    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("缺失章节 2");
    expect(wrapper.text()).toContain("反馈统计");
    expect(wrapper.text()).toContain("18");
    expect(wrapper.text()).toContain("总浏览");
    expect(wrapper.text()).toContain("Popular One");
    expect(wrapper.text()).toContain("12 浏览");
    expect(wrapper.text()).toContain("5 点赞");
    expect(wrapper.text()).toContain("3 评论");
  });
});
