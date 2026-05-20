import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PostCard from "./PostCard.vue";

describe("PostCard", () => {
  it("shows the post cover before the card body when one is available", () => {
    const wrapper = mount(PostCard, {
      props: {
        post: {
          id: 1,
          title: "Covered Post",
          slug: "covered-post",
          summary: "Grid and content",
          coverMediaId: 7,
          coverMediaUrl: "/uploads/cover.png",
          status: "PUBLISHED",
          category: null,
          tags: [],
          publishedAt: "2026-05-17T01:00:00Z"
        }
      },
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>"
          }
        }
      }
    });

    const coverLink = wrapper.get(".post-card-cover-link");
    const cover = wrapper.get(".post-card-cover");

    expect(coverLink.attributes("href")).toBe("/posts/covered-post");
    expect(cover.attributes("src")).toBe("/uploads/cover.png");
    expect(cover.attributes("alt")).toBe("Covered Post");
    expect(Array.from(wrapper.get(".post-card").element.children).at(0)).toBe(coverLink.element);
  });

  it("renders category separately and groups all tags in one metadata box", () => {
    const wrapper = mount(PostCard, {
      props: {
        post: {
          id: 1,
          title: "Constructivist Systems",
          slug: "constructivist-systems",
          summary: "Grid and content",
          status: "PUBLISHED",
          category: { id: 1, name: "Essays", slug: "essays" },
          tags: [
            { id: 1, name: "Design", slug: "design" },
            { id: 2, name: "Vue", slug: "vue" }
          ],
          publishedAt: "2026-05-17T01:00:00Z"
        }
      },
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>"
          }
        }
      }
    });

    const body = wrapper.get(".post-card-body");

    expect(body.text()).toContain("Constructivist Systems");
    expect(body.get(".post-card-category").text()).toBe("Essays");
    expect(body.get(".post-card-category").attributes("href")).toBe("/categories/essays");

    const tagsBox = body.get(".post-card-tags");

    expect(wrapper.findAll(".post-card-tags")).toHaveLength(1);
    expect(tagsBox.findAll("a").map((tag) => tag.text().trim())).toEqual(["#Design", "#Vue"]);
    expect(tagsBox.text()).toBe("#Design #Vue");
    expect(tagsBox.get("a[href='/tags/design']").text()).toBe("#Design");
    expect(tagsBox.get("a[href='/tags/vue']").text()).toBe("#Vue");
  });

  it("shows fallback cover, category, and tag metadata when a post has none assigned", () => {
    const wrapper = mount(PostCard, {
      props: {
        post: {
          id: 2,
          title: "Unsorted Note",
          slug: "unsorted-note",
          summary: "",
          status: "PUBLISHED",
          category: null,
          tags: [],
          publishedAt: "2026-05-19T01:00:00Z"
        }
      },
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>"
          }
        }
      }
    });

    const cover = wrapper.get(".post-card-cover--empty");
    const meta = wrapper.get(".post-card-meta");

    expect(cover.attributes("aria-hidden")).toBe("true");
    expect(Array.from(wrapper.get(".post-card").element.children).at(0)).toBe(wrapper.get(".post-card-cover-link").element);
    expect(meta.get(".post-card-category-fallback").text()).toBe("未分类");
    expect(meta.get(".post-card-tags").text()).toBe("无标签");
  });
});
