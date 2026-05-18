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
});
