import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ArticleToc from "./ArticleToc.vue";

const items = [
  { id: "setup-guide", text: "Setup Guide", level: 2 as const },
  { id: "install-vue-3", text: "Install Vue 3", level: 3 as const }
];

describe("ArticleToc", () => {
  it("renders nested heading entries and active state", () => {
    const wrapper = mount(ArticleToc, {
      props: { items, activeId: "install-vue-3" }
    });

    expect(wrapper.text()).toContain("On this page");
    expect(wrapper.get('a[href="#setup-guide"]').text()).toBe("Setup Guide");
    expect(wrapper.get('a[href="#install-vue-3"]').classes()).toContain("is-active");
    expect(wrapper.get('a[href="#install-vue-3"]').classes()).toContain("toc-level-3");
  });

  it("emits navigate when an entry is clicked", async () => {
    const wrapper = mount(ArticleToc, {
      props: { items, activeId: "" }
    });

    await wrapper.get('a[href="#setup-guide"]').trigger("click");

    expect(wrapper.emitted("navigate")).toEqual([["setup-guide"]]);
  });

  it("does not render when there are no items", () => {
    const wrapper = mount(ArticleToc, {
      props: { items: [], activeId: "" }
    });

    expect(wrapper.find("nav").exists()).toBe(false);
  });
});
