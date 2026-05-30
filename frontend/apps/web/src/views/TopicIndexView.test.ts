import { RouterLinkStub, flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import TopicIndexView from "./TopicIndexView.vue";

vi.mock("../lib/api", () => ({
  publicApi: {
    topics: vi.fn(async () => [{ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 }])
  }
}));

describe("TopicIndexView", () => {
  it("renders public topics", async () => {
    const wrapper = mount(TopicIndexView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("Backend");
  });
});
