import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import HomeView from "./HomeView.vue";

const postsMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  publicApi: {
    posts: postsMock
  }
}));

describe("HomeView", () => {
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
});
