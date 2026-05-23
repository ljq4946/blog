import { flushPromises, mount } from "@vue/test-utils";
import type { Post } from "@blog/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostDetailView from "./PostDetailView.vue";

const routeMock = vi.hoisted(() => ({ params: { slug: "reader-upgrade" } }));
const postMock = vi.hoisted(() => vi.fn());
const commentsMock = vi.hoisted(() => vi.fn());
const createCommentMock = vi.hoisted(() => vi.fn());
const likesMock = vi.hoisted(() => vi.fn());
const likePostMock = vi.hoisted(() => vi.fn());

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => routeMock,
    RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
  };
});

vi.mock("../lib/api", () => ({
  publicApi: {
    post: postMock,
    comments: commentsMock,
    createComment: createCommentMock,
    likes: likesMock,
    likePost: likePostMock
  }
}));

const post: Post = {
  id: 1,
  title: "Reader Upgrade",
  slug: "reader-upgrade",
  summary: "A better long-form reading page.",
  contentHtml: "<h2>Setup Guide</h2><p>Hello reader.</p><pre><code>npm test</code></pre>",
  coverMediaUrl: "/uploads/cover.png",
  status: "PUBLISHED",
  publishedAt: "2026-05-20T00:00:00Z",
  category: { id: 1, name: "Engineering", slug: "engineering" },
  tags: [{ id: 2, name: "Vue", slug: "vue" }]
};

describe("PostDetailView", () => {
  beforeEach(() => {
    routeMock.params = { slug: "reader-upgrade" };
    postMock.mockReset();
    commentsMock.mockReset();
    createCommentMock.mockReset();
    likesMock.mockReset();
    likePostMock.mockReset();
    commentsMock.mockResolvedValue([]);
    createCommentMock.mockResolvedValue({
      id: 11,
      nickname: "Lin",
      content: "New comment",
      createdAt: "2026-05-21T00:00:00Z"
    });
    likesMock.mockResolvedValue({ count: 0 });
    likePostMock.mockResolvedValue({ count: 1 });
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("renders article metadata, cover, body, and reading controls", async () => {
    postMock.mockResolvedValue(post);

    const wrapper = mount(PostDetailView, {
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });
    await flushPromises();

    expect(postMock).toHaveBeenCalledWith("reader-upgrade");
    expect(wrapper.text()).toContain("Reader Upgrade");
    expect(wrapper.text()).toContain("A better long-form reading page.");
    expect(wrapper.text()).toContain("Engineering");
    expect(wrapper.text()).toContain("#Vue");
    expect(wrapper.get(".article-hero-cover").attributes("src")).toBe("/uploads/cover.png");
    expect(wrapper.text()).toContain("Setup Guide");
    expect(wrapper.text()).toContain("目录");
    expect(wrapper.find(".reading-progress").exists()).toBe(true);
    expect(wrapper.find(".reading-preferences").exists()).toBe(true);
    expect(wrapper.find('[data-test="back-to-top"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="back-to-top"]').text()).toBe("返回顶部");
  });

  it("renders comments and submits a plain-text comment", async () => {
    postMock.mockResolvedValue(post);
    likesMock.mockResolvedValue({ count: 3 });
    commentsMock.mockResolvedValue([
      {
        id: 10,
        nickname: "Ada",
        content: "<b>Not rendered as HTML</b>",
        createdAt: "2026-05-20T12:00:00Z"
      }
    ]);

    const wrapper = mount(PostDetailView, {
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });
    await flushPromises();

    expect(commentsMock).toHaveBeenCalledWith("reader-upgrade");
    expect(likesMock).toHaveBeenCalledWith("reader-upgrade");
    expect(wrapper.text()).toContain("Ada");
    expect(wrapper.text()).toContain("<b>Not rendered as HTML</b>");
    expect(wrapper.html()).not.toContain("<b>Not rendered as HTML</b>");
    expect(wrapper.get('[data-test="like-count"]').text()).toContain("3");

    await wrapper.get('[data-test="comment-nickname"]').setValue("Lin");
    await wrapper.get('[data-test="comment-email"]').setValue("lin@example.com");
    await wrapper.get('[data-test="comment-content"]').setValue("New comment");
    await wrapper.get('[data-test="comment-form"]').trigger("submit.prevent");
    await flushPromises();

    expect(createCommentMock).toHaveBeenCalledWith("reader-upgrade", {
      nickname: "Lin",
      email: "lin@example.com",
      content: "New comment"
    });
    expect(wrapper.text()).toContain("New comment");
  });

  it("likes once per browser and persists liked state locally", async () => {
    postMock.mockResolvedValue(post);
    likesMock.mockResolvedValue({ count: 0 });
    likePostMock.mockResolvedValue({ count: 1 });

    const wrapper = mount(PostDetailView, {
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });
    await flushPromises();

    await wrapper.get('[data-test="like-button"]').trigger("click");
    await flushPromises();

    expect(likePostMock).toHaveBeenCalledWith("reader-upgrade");
    expect(wrapper.get('[data-test="like-count"]').text()).toContain("1");
    expect(wrapper.get('[data-test="like-button"]').attributes("disabled")).toBeDefined();
    expect(localStorage.getItem("blog-liked-posts")).toContain("reader-upgrade");
  });

  it("keeps the article visible when interactions fail to load", async () => {
    postMock.mockResolvedValue(post);
    commentsMock.mockRejectedValue(new Error("comments down"));

    const wrapper = mount(PostDetailView, {
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Reader Upgrade");
    expect(wrapper.text()).toContain("互动数据暂时无法加载。");
    expect(wrapper.text()).not.toContain("文章暂不可用");
  });

  it("shows a clear error state when the article cannot load", async () => {
    postMock.mockRejectedValue(new Error("not found"));

    const wrapper = mount(PostDetailView, {
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("文章暂不可用");
    expect(wrapper.text()).toContain("返回全部文章");
  });
});
