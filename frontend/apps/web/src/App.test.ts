import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import App from "./App.vue";

describe("App", () => {
  it("uses the personal site name in the visitor shell", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: { template: "<a><slot /></a>" },
          RouterView: { template: "<main />" }
        }
      }
    });

    expect(wrapper.get(".wordmark").text()).toBe("4946个人站");
    expect(wrapper.text()).not.toContain("模块博客");
  });

  it("does not expose the posts listing page in the masthead navigation", () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>"
          },
          RouterView: { template: "<main />" }
        }
      }
    });

    expect(wrapper.find(".masthead nav a[href='/posts']").exists()).toBe(false);
    expect(wrapper.get(".masthead nav a[href='/archive']").text()).toBe("全部文章");
    expect(wrapper.get(".masthead nav").text()).not.toContain("归档");
    expect(wrapper.find(".masthead nav a[href='/about']").exists()).toBe(true);
  });
});
