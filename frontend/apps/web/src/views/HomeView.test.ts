import { flushPromises, mount } from "@vue/test-utils";
import type { Post } from "@blog/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeView from "./HomeView.vue";

const postsMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  publicApi: {
    posts: postsMock
  }
}));

describe("HomeView", () => {
  beforeEach(() => {
    postsMock.mockReset();
  });

  it("renders the personal site hero title without the public reading system kicker", () => {
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    expect(wrapper.text()).toContain("4946个人站");
    expect(wrapper.text()).not.toContain("模块博客");
    expect(wrapper.text()).not.toContain("公开阅读系统");
  });

  it("does not render an all-posts button in the latest-post section", () => {
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>"
          }
        }
      }
    });

    expect(wrapper.get(".section-head").find("a[href='/posts']").exists()).toBe(false);
  });

  it("renders only the three latest posts", async () => {
    postsMock.mockResolvedValue(
      Array.from({ length: 6 }, (_, index): Post => {
        const postNumber = index + 1;

        return {
          id: postNumber,
          title: `Post ${postNumber}`,
          slug: `post-${postNumber}`,
          summary: `Summary ${postNumber}`,
          status: "PUBLISHED",
          publishedAt: `2026-05-${20 - index}T00:00:00Z`
        };
      })
    );

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Post 1");
    expect(wrapper.text()).toContain("Post 2");
    expect(wrapper.text()).toContain("Post 3");
    expect(wrapper.text()).not.toContain("Post 4");
    expect(wrapper.text()).not.toContain("Post 5");
    expect(wrapper.text()).not.toContain("Post 6");
  });
});
