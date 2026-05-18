import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import AboutView from "./AboutView.vue";

const aboutMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  publicApi: {
    about: aboutMock
  }
}));

describe("AboutView", () => {
  it("renders the loaded page title without the static about kicker", async () => {
    aboutMock.mockResolvedValue({
      key: "about",
      title: "测试",
      contentHtml: "<p>个人站内容</p>",
      updatedAt: "2026-05-18T00:00:00Z"
    });

    const wrapper = mount(AboutView);
    await flushPromises();

    expect(wrapper.text()).toContain("测试");
    expect(wrapper.text()).not.toContain("关于");
  });
});
