import { RouterLinkStub, flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import SeriesIndexView from "./SeriesIndexView.vue";

vi.mock("../lib/api", () => ({
  publicApi: {
    seriesList: vi.fn(async () => [{
      id: 1,
      name: "Build Blog",
      slug: "build-blog",
      description: "Project",
      primaryTopic: { id: 2, name: "Spring Boot", slug: "spring-boot" },
      sortOrder: 0
    }])
  }
}));

describe("SeriesIndexView", () => {
  afterEach(() => {
    document.head.querySelectorAll("meta[data-managed='site'], link[data-managed='site'], script[data-managed='site']")
      .forEach((node) => node.remove());
    document.title = "";
  });

  it("renders public series", async () => {
    const wrapper = mount(SeriesIndexView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("Spring Boot");
    expect(document.title).toBe("Series | 4946 Blog");
    expect(document.querySelector("meta[name='description']")?.getAttribute("content")).toBe("Read complete technical paths in order.");
  });
});
