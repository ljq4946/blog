import { flushPromises, mount } from "@vue/test-utils";
import type { Post, Series, Topic } from "@blog/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeView from "./HomeView.vue";

const postsMock = vi.hoisted(() => vi.fn());
const homeProfileMock = vi.hoisted(() => vi.fn());
const topicsMock = vi.hoisted(() => vi.fn());
const seriesListMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  publicApi: {
    posts: postsMock,
    homeProfile: homeProfileMock,
    topics: topicsMock,
    seriesList: seriesListMock
  }
}));

describe("HomeView", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    postsMock.mockReset();
    homeProfileMock.mockReset();
    topicsMock.mockReset();
    seriesListMock.mockReset();
    homeProfileMock.mockResolvedValue({
      key: "home",
      musicTitle: "私人电台",
      musicSubtitle: "深夜写作清单",
      musicMeta: "lo-fi / city rain / quiet loop",
      musicAudioUrl: "",
      aboutKicker: "About / 4946",
      aboutTitle: "我是 4946",
      aboutBody: "这里像一本公开笔记：记录技术实战、写作训练和日常观察，也保留问题被解决前后的纹理。",
      focusItems: [
        { label: "正在写", text: "设计模式与工程经验" },
        { label: "正在读", text: "代码、散文与城市噪声" },
        { label: "正在收集", text: "可复用的问题清单" }
      ],
      updatedAt: "2026-05-24T00:00:00Z"
    });
    topicsMock.mockResolvedValue([]);
    seriesListMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.head.querySelectorAll("meta[data-managed='site'], link[data-managed='site'], script[data-managed='site']")
      .forEach((node) => node.remove());
    document.title = "";
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

  it("sets website structured data for the public homepage", async () => {
    postsMock.mockResolvedValue([]);

    mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });
    await flushPromises();

    expect(JSON.parse(document.querySelector("script[type='application/ld+json'][data-managed='site']")?.textContent || "{}"))
      .toMatchObject({
        "@type": "WebSite",
        name: "4946 Blog",
        url: "http://localhost:5174/"
      });
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

  it("adds a personal interlude between the poster and latest posts", () => {
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

    const poster = wrapper.get(".home-poster");
    const interlude = wrapper.get("[data-test='home-interlude']");
    const latest = wrapper.get(".latest-posts");
    const siblings = Array.from(wrapper.get(".home-page").element.children);
    const interludeModules = interlude.findAll(".interlude-module");

    expect(siblings.indexOf(poster.element)).toBeLessThan(siblings.indexOf(interlude.element));
    expect(siblings.indexOf(interlude.element)).toBeLessThan(siblings.indexOf(latest.element));
    expect(interludeModules.map((module) => module.attributes("data-test"))).toEqual([
      "home-about-module",
      "home-music-module"
    ]);
    expect(interlude.get("[data-test='home-music-module']").text()).toContain("私人电台");
    expect(interlude.get("[data-test='home-about-module']").text()).toContain("我是 4946");
    expect(wrapper.find(".home-poster .post-card").exists()).toBe(false);
    expect(wrapper.find("[data-test='home-taxonomy-module']").exists()).toBe(false);
    expect(wrapper.get(".section-head").find("a[href='/posts']").exists()).toBe(false);
  });

  it("lets visitors toggle the homepage music module state", async () => {
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    const musicModule = wrapper.get("[data-test='home-music-module']");
    const toggle = wrapper.get("[data-test='home-music-toggle']");

    expect(musicModule.classes()).not.toContain("is-playing");
    expect(toggle.text()).toContain("播放");

    await toggle.trigger("click");

    expect(musicModule.classes()).toContain("is-playing");
    expect(toggle.text()).toContain("暂停");
  });

  it("advances the visible music progress while the demo player is playing", async () => {
    vi.useFakeTimers();
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    const progress = wrapper.get("[data-test='home-music-progress']");
    const bar = progress.get("span");

    expect(progress.attributes("aria-valuenow")).toBe("0");
    expect(bar.attributes("style")).toContain("width: 0%;");

    await wrapper.get("[data-test='home-music-toggle']").trigger("click");
    vi.advanceTimersByTime(3_000);
    await wrapper.vm.$nextTick();

    expect(progress.attributes("aria-valuenow")).toBe("5");
    expect(bar.attributes("style")).toContain("width: 5%;");
  });

  it("keeps the progress moving if the configured audio cannot start", async () => {
    vi.useFakeTimers();
    postsMock.mockResolvedValue([]);
    homeProfileMock.mockResolvedValue({
      key: "home",
      musicTitle: "午后电台",
      musicSubtitle: "调试时听",
      musicMeta: "ambient / focus",
      musicAudioUrl: "/uploads/focus.mp3",
      aboutKicker: "About / Now",
      aboutTitle: "编辑后的 4946",
      aboutBody: "新的首页介绍",
      focusItems: [
        { label: "正在写", text: "首页配置" },
        { label: "正在听", text: "环境音乐" },
        { label: "正在改", text: "管理端" }
      ],
      updatedAt: "2026-05-24T00:00:00Z"
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("play blocked"));

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });
    await flushPromises();

    const progress = wrapper.get("[data-test='home-music-progress']");
    await wrapper.get("[data-test='home-music-toggle']").trigger("click");
    await flushPromises();
    vi.advanceTimersByTime(3_000);
    await wrapper.vm.$nextTick();

    expect(wrapper.get("[data-test='home-music-toggle']").attributes("aria-pressed")).toBe("true");
    expect(progress.attributes("aria-valuenow")).toBe("5");
  });

  it("replaces the hard-coded music card time with the current local time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 24, 10, 8, 0));
    postsMock.mockResolvedValue([]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });

    const kicker = wrapper.get("[data-test='home-music-module'] .module-kicker");

    expect(kicker.text()).toBe("Now listening / 10:08 AM");
    expect(kicker.text()).not.toContain("02:46 AM");
  });

  it("renders configured home profile content and audio source", async () => {
    postsMock.mockResolvedValue([]);
    homeProfileMock.mockResolvedValue({
      key: "home",
      musicTitle: "午后电台",
      musicSubtitle: "调试时听",
      musicMeta: "ambient / focus",
      musicAudioUrl: "/uploads/focus.mp3",
      aboutKicker: "About / Now",
      aboutTitle: "编辑后的 4946",
      aboutBody: "新的首页介绍",
      focusItems: [
        { label: "正在写", text: "首页配置" },
        { label: "正在听", text: "环境音乐" },
        { label: "正在改", text: "管理端" }
      ],
      updatedAt: "2026-05-24T00:00:00Z"
    });

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" }
        }
      }
    });
    await flushPromises();

    expect(wrapper.get("[data-test='home-music-module']").text()).toContain("午后电台");
    expect(wrapper.get("[data-test='home-music-module']").text()).toContain("ambient / focus");
    expect(wrapper.get("[data-test='home-about-module']").text()).toContain("新的首页介绍");
    expect(wrapper.get("[data-test='home-about-module']").text()).toContain("环境音乐");
    expect(wrapper.get("[data-test='home-music-audio']").attributes("src")).toBe("/uploads/focus.mp3");
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

  it("refreshes homepage discovery with topics, ongoing series, and an archive entry", async () => {
    postsMock.mockResolvedValue(
      Array.from({ length: 4 }, (_, index): Post => ({
        id: index + 1,
        title: `Post ${index + 1}`,
        slug: `post-${index + 1}`,
        summary: `Summary ${index + 1}`,
        status: "PUBLISHED",
        publishedAt: `2026-05-${20 - index}T00:00:00Z`
      }))
    );
    topicsMock.mockResolvedValue([
      { id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend practice", sortOrder: 0 },
      { id: 2, name: "Vue", slug: "vue", description: "Frontend notes", sortOrder: 1 },
      { id: 3, name: "Ops", slug: "ops", description: "", sortOrder: 2 },
      { id: 4, name: "Postgres", slug: "postgres", description: "Database", sortOrder: 3 }
    ] satisfies Topic[]);
    seriesListMock.mockResolvedValue([
      {
        id: 1,
        name: "Build Blog",
        slug: "build-blog",
        description: "Ship a modular blog",
        primaryTopic: { id: 1, name: "Spring Boot", slug: "spring-boot" },
        sortOrder: 0
      },
      { id: 2, name: "Reader UX", slug: "reader-ux", description: "Reading flow", primaryTopic: null, sortOrder: 1 },
      { id: 3, name: "Deploy Notes", slug: "deploy-notes", description: "", primaryTopic: null, sortOrder: 2 },
      { id: 4, name: "Database Diary", slug: "database-diary", description: "", primaryTopic: null, sortOrder: 3 }
    ] satisfies Series[]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href=\"typeof to === 'string' ? to : to.path\"><slot /></a>"
          }
        }
      }
    });
    await flushPromises();

    const discovery = wrapper.get("[data-test='home-discovery']");
    expect(discovery.text()).toContain("重点专题");
    expect(discovery.text()).toContain("Spring Boot");
    expect(discovery.text()).toContain("Vue");
    expect(discovery.text()).toContain("Ops");
    expect(discovery.text()).not.toContain("Postgres");
    expect(discovery.text()).toContain("进行中的系列");
    expect(discovery.text()).toContain("Build Blog");
    expect(discovery.text()).toContain("Reader UX");
    expect(discovery.text()).toContain("Deploy Notes");
    expect(discovery.text()).not.toContain("Database Diary");
    expect(discovery.find("a[href='/topics/spring-boot']").exists()).toBe(true);
    expect(discovery.find("a[href='/series/build-blog']").exists()).toBe(true);
    expect(discovery.find("a[href='/archive']").exists()).toBe(true);
  });

  it("renders a portfolio showcase path from existing content structures", async () => {
    postsMock.mockResolvedValue([
      {
        id: 1,
        title: "Full Stack Blog",
        slug: "full-stack-blog",
        summary: "A production-style personal blog case.",
        status: "PUBLISHED",
        publishedAt: "2026-05-30T00:00:00Z"
      }
    ] satisfies Post[]);
    topicsMock.mockResolvedValue([
      { id: 2, name: "Spring Boot", slug: "spring-boot", description: "Backend knowledge map", sortOrder: 0 }
    ] satisfies Topic[]);
    seriesListMock.mockResolvedValue([
      { id: 3, name: "Build From Zero", slug: "build-from-zero", description: "Ordered implementation notes", primaryTopic: null, sortOrder: 0 }
    ] satisfies Series[]);

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href=\"typeof to === 'string' ? to : to.path\"><slot /></a>"
          }
        }
      }
    });
    await flushPromises();

    const showcase = wrapper.get("[data-test='home-showcase']");
    expect(showcase.text()).toContain("作品集路径");
    expect(showcase.text()).toContain("代表文章");
    expect(showcase.text()).toContain("Full Stack Blog");
    expect(showcase.text()).toContain("技术专题");
    expect(showcase.text()).toContain("Spring Boot");
    expect(showcase.text()).toContain("阅读系列");
    expect(showcase.text()).toContain("Build From Zero");
    expect(showcase.find("a[href='/posts/full-stack-blog']").exists()).toBe(true);
    expect(showcase.find("a[href='/topics/spring-boot']").exists()).toBe(true);
    expect(showcase.find("a[href='/series/build-from-zero']").exists()).toBe(true);
    expect(showcase.find("a[href='/archive']").exists()).toBe(true);
  });
});
