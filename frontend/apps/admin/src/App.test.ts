import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/" }),
  useRouter: () => ({ push: vi.fn() })
}));

vi.mock("./stores/auth", () => ({
  useAuthStore: () => ({ logout: vi.fn() })
}));

import App from "./App.vue";

describe("Admin App", () => {
  it("renders the restrained constructivist admin shell with core navigation", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" },
          RouterView: { template: "<section data-test='router-view' />" }
        }
      }
    });

    expect(wrapper.get(".admin-shell").classes()).toContain("admin-shell--constructivist");
    expect(wrapper.get(".brand").text()).toContain("博客管理");
    expect(wrapper.find(".brand-mark").exists()).toBe(true);
    expect(wrapper.get(".sidebar").text()).toContain("文章");
    expect(wrapper.get(".sidebar").text()).toContain("内容地图");
    expect(wrapper.get(".sidebar").text()).toContain("首页");
    expect(wrapper.get(".sidebar").text()).toContain("分类");
    expect(wrapper.get(".sidebar").text()).toContain("标签");
    expect(wrapper.get(".sidebar").text()).toContain("媒体");
    expect(wrapper.get(".sidebar").text()).toContain("评论");
    expect(wrapper.get(".sidebar").text()).toContain("关于");
    expect(wrapper.find("a[href='/topics']").exists()).toBe(true);
    expect(wrapper.find("a[href='/series']").exists()).toBe(true);
    expect(wrapper.find("a[href='/content-map']").exists()).toBe(true);
    expect(wrapper.find("[data-test='router-view']").exists()).toBe(true);
  });
});
