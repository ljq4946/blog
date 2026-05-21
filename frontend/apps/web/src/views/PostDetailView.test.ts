import { flushPromises, mount } from "@vue/test-utils";
import type { Post } from "@blog/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostDetailView from "./PostDetailView.vue";

const routeMock = vi.hoisted(() => ({ params: { slug: "reader-upgrade" } }));
const postMock = vi.hoisted(() => vi.fn());

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
    post: postMock
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
    expect(wrapper.text()).toContain("On this page");
    expect(wrapper.find(".reading-progress").exists()).toBe(true);
    expect(wrapper.find(".reading-preferences").exists()).toBe(true);
    expect(wrapper.find('[data-test="back-to-top"]').exists()).toBe(true);
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

    expect(wrapper.text()).toContain("Article unavailable");
    expect(wrapper.text()).toContain("Return to archive");
  });
});
