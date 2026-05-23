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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the personal poster hero with the default tagline", () => {
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    expect(wrapper.get(".home-poster").text()).toContain("4946个人站");
    expect(wrapper.get(".home-poster").text()).toContain("In solitude, where we are least alone");
    expect(wrapper.text()).not.toContain("模块博客");
    expect(wrapper.text()).not.toContain("公开阅读系统");
  });

  it("renders segmented poster cells for the hero composition", () => {
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    expect(wrapper.find(".poster-cells").exists()).toBe(true);
    expect(wrapper.findAll(".poster-cell")).toHaveLength(6);
  });

  it("keeps the visible poster elements in one proportional stage", () => {
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    const stage = wrapper.get(".poster-stage");
    expect(stage.find(".poster-copy").exists()).toBe(true);
    expect(stage.find(".poster-index").exists()).toBe(true);
    expect(stage.find(".poster-strike").exists()).toBe(true);
    expect(stage.find(".poster-wedge-small").exists()).toBe(true);
    expect(stage.find(".poster-rule-blue").exists()).toBe(true);
    expect(stage.find(".poster-rule-yellow").exists()).toBe(true);
  });

  it("keeps the red wedge and white circle in one poster strike group", () => {
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    const strike = wrapper.get(".poster-strike");
    expect(strike.find(".poster-wedge-main").exists()).toBe(true);
    expect(strike.find(".poster-circle").exists()).toBe(true);
  });

  it("lets wheel scrolling use the browser default while the poster is visible", () => {
    postsMock.mockResolvedValue([]);
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });
    Object.defineProperty(wrapper.get(".home-poster").element, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 760, height: 760, top: 0 })
    });

    const event = new Event("wheel", { cancelable: true }) as WheelEvent;
    Object.defineProperty(event, "deltaY", { value: 240 });
    const preventDefault = vi.spyOn(event, "preventDefault");
    wrapper.get(".home-poster").element.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("keeps the poster hero free of article cards and extra homepage modules", () => {
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

    expect(wrapper.find(".home-poster .post-card").exists()).toBe(false);
    expect(wrapper.find("[data-test='home-taxonomy-module']").exists()).toBe(false);
    expect(wrapper.find("[data-test='home-about-module']").exists()).toBe(false);
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
