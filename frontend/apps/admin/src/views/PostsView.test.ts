import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostsView from "./PostsView.vue";

const pushMock = vi.hoisted(() => vi.fn());
const postsMock = vi.hoisted(() => vi.fn());
const deletePostMock = vi.hoisted(() => vi.fn());

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock("../lib/api", () => ({
  adminApi: {
    posts: postsMock,
    deletePost: deletePostMock
  }
}));

const posts = [
  {
    id: 1,
    title: "Spring Draft",
    slug: "spring-draft",
    summary: "",
    status: "DRAFT",
    category: { id: 1, name: "Backend", slug: "backend" },
    topics: [{ id: 3, name: "Spring", slug: "spring" }],
    series: null,
    tags: [],
    publishedAt: null
  },
  {
    id: 2,
    title: "Vue Scheduled",
    slug: "vue-scheduled",
    summary: "",
    status: "SCHEDULED",
    category: { id: 2, name: "Frontend", slug: "frontend" },
    topics: [],
    series: { id: 4, name: "Vue Path", slug: "vue-path" },
    tags: [{ id: 5, name: "Vue", slug: "vue" }],
    publishedAt: "2026-06-01T08:00:00Z"
  },
  {
    id: 3,
    title: "Published Ops",
    slug: "published-ops",
    summary: "",
    status: "PUBLISHED",
    category: null,
    topics: [],
    series: null,
    tags: [],
    publishedAt: "2026-05-01T08:00:00Z"
  }
];

describe("PostsView", () => {
  beforeEach(() => {
    pushMock.mockReset();
    postsMock.mockReset();
    deletePostMock.mockReset();
    postsMock.mockResolvedValue(posts);
  });

  it("filters posts by keyword, status, and taxonomy", async () => {
    const wrapper = mount(PostsView, { global: { plugins: [ElementPlus] } });
    await flushPromises();

    expect(wrapper.text()).toContain("Spring Draft");
    expect(wrapper.text()).toContain("Vue Scheduled");
    expect(wrapper.text()).toContain("Published Ops");

    await wrapper.find('[data-test="post-search"]').setValue("vue");
    expect(wrapper.text()).not.toContain("Spring Draft");
    expect(wrapper.text()).toContain("Vue Scheduled");

    await wrapper.find('[data-test="post-search"]').setValue("");
    await wrapper.find('[data-test="status-filter"]').setValue("DRAFT");
    expect(wrapper.text()).toContain("Spring Draft");
    expect(wrapper.text()).not.toContain("Vue Scheduled");

    await wrapper.find('[data-test="status-filter"]').setValue("ALL");
    await wrapper.find('[data-test="taxonomy-filter"]').setValue("spring");
    expect(wrapper.text()).toContain("Spring Draft");
    expect(wrapper.text()).not.toContain("Published Ops");
  });

  it("shows scheduled status and quick edit entry points", async () => {
    const wrapper = mount(PostsView, { global: { plugins: [ElementPlus] } });
    await flushPromises();

    expect(wrapper.text()).toContain("已排期");
    expect(wrapper.text()).toContain("Vue Path");

    await wrapper.find('[data-test="new-post"]').trigger("click");
    expect(pushMock).toHaveBeenCalledWith("/posts/new");
  });
});
