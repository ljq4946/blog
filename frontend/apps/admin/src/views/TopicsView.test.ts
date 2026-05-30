import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import TopicsView from "./TopicsView.vue";

vi.mock("../lib/api", () => ({
  adminApi: {
    topics: vi.fn(async () => [{ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 }]),
    saveTopic: vi.fn(async () => ({ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 })),
    deleteTopic: vi.fn(async () => undefined)
  }
}));

describe("TopicsView", () => {
  it("loads and renders topics", async () => {
    const wrapper = mount(TopicsView, { global: { plugins: [ElementPlus] } });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("Spring Boot");
    expect(wrapper.text()).toContain("spring-boot");
  });
});
