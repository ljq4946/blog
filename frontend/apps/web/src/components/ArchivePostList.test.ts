import { mount } from "@vue/test-utils";
import type { Post } from "@blog/shared";
import { describe, expect, it } from "vitest";
import ArchivePostList from "./ArchivePostList.vue";

const posts: Post[] = [
  {
    id: 1,
    title: "Reader Upgrade",
    slug: "reader-upgrade",
    summary: "Better archive discovery.",
    coverMediaUrl: "/uploads/cover.png",
    status: "PUBLISHED",
    publishedAt: "2026-05-20T00:00:00Z",
    category: { id: 1, name: "Engineering", slug: "engineering" },
    tags: [{ id: 2, name: "Vue", slug: "vue" }]
  }
];

describe("ArchivePostList", () => {
  it("renders dense article list entries", () => {
    const wrapper = mount(ArchivePostList, {
      props: { posts },
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });

    expect(wrapper.get(".archive-discovery-title").text()).toBe("Reader Upgrade");
    expect(wrapper.get("img").attributes("src")).toBe("/uploads/cover.png");
    expect(wrapper.get("a[href='/posts/reader-upgrade']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Better archive discovery.");
    expect(wrapper.text()).toContain("Engineering");
    expect(wrapper.text()).toContain("#Vue");
  });

  it("renders reset action for empty results", async () => {
    const wrapper = mount(ArchivePostList, {
      props: { posts: [] },
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
        }
      }
    });

    await wrapper.get('[data-test="empty-reset"]').trigger("click");

    expect(wrapper.text()).toContain("No matching articles");
    expect(wrapper.emitted("reset")).toHaveLength(1);
  });
});
