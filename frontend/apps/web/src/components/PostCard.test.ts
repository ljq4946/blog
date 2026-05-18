import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PostCard from "./PostCard.vue";

describe("PostCard", () => {
  it("renders title, category, and tags", () => {
    const wrapper = mount(PostCard, {
      props: {
        post: {
          id: 1,
          title: "Constructivist Systems",
          slug: "constructivist-systems",
          summary: "Grid and content",
          status: "PUBLISHED",
          category: { id: 1, name: "Essays", slug: "essays" },
          tags: [{ id: 1, name: "Design", slug: "design" }],
          publishedAt: "2026-05-17T01:00:00Z"
        }
      },
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    expect(wrapper.text()).toContain("Constructivist Systems");
    expect(wrapper.text()).toContain("Essays");
    expect(wrapper.text()).toContain("Design");
  });
});
