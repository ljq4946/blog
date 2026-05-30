import { RouterLinkStub, flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import TopicIndexView from "./TopicIndexView.vue";

vi.mock("../lib/api", () => ({
  publicApi: {
    topics: vi.fn(async () => [{ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 }])
  }
}));

describe("TopicIndexView", () => {
  afterEach(() => {
    document.head.querySelectorAll("meta[data-managed='site'], link[data-managed='site'], script[data-managed='site']")
      .forEach((node) => node.remove());
    document.title = "";
  });

  it("renders public topics", async () => {
    const wrapper = mount(TopicIndexView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("Backend");
    expect(document.title).toBe("Topics | 4946 Blog");
    expect(document.querySelector("meta[name='description']")?.getAttribute("content")).toBe("Browse long-lived technical topics.");
  });
});
