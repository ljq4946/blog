import { mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import SeriesView from "./SeriesView.vue";

vi.mock("../lib/api", () => ({
  adminApi: {
    topics: vi.fn(async () => [{ id: 1, name: "Spring Boot", slug: "spring-boot", description: "Backend", sortOrder: 0 }]),
    series: vi.fn(async () => [{
      id: 2,
      name: "Build Blog",
      slug: "build-blog",
      description: "Project",
      primaryTopic: { id: 1, name: "Spring Boot", slug: "spring-boot" },
      sortOrder: 0
    }]),
    saveSeries: vi.fn(async () => ({
      id: 2,
      name: "Build Blog",
      slug: "build-blog",
      description: "Project",
      primaryTopic: null,
      sortOrder: 0
    })),
    deleteSeries: vi.fn(async () => undefined)
  }
}));

describe("SeriesView", () => {
  it("loads series and primary topic options", async () => {
    const wrapper = mount(SeriesView, { global: { plugins: [ElementPlus] } });
    await vi.dynamicImportSettled();

    expect(wrapper.text()).toContain("Build Blog");
    expect(wrapper.text()).toContain("Spring Boot");
  });
});
