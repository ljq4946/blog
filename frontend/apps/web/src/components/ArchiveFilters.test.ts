import { mount } from "@vue/test-utils";
import type { Category, Series, Tag, Topic } from "@blog/shared";
import { describe, expect, it } from "vitest";
import ArchiveFilters from "./ArchiveFilters.vue";

const categories: Category[] = [{ id: 1, name: "Engineering", slug: "engineering", sortOrder: 0 }];
const tags: Tag[] = [{ id: 2, name: "Vue", slug: "vue" }];
const topics: Topic[] = [{ id: 3, name: "Spring Boot", slug: "spring-boot", sortOrder: 0 }];
const series: Series[] = [{
  id: 4,
  name: "Build Blog",
  slug: "build-blog",
  description: "Project",
  primaryTopic: null,
  sortOrder: 0
}];

function mountFilters() {
  return mount(ArchiveFilters, {
    props: {
      filters: {
        keyword: "vue",
        year: "2026",
        category: "engineering",
        tag: "vue",
        topic: "spring-boot",
        series: "build-blog",
        sort: "publishedAt,desc"
      },
      years: ["2026", "2025"],
      categories,
      tags,
      topics,
      series,
      taxonomyAvailable: true
    }
  });
}

describe("ArchiveFilters", () => {
  it("renders filter controls and emits search with edited values", async () => {
    const wrapper = mountFilters();

    expect(wrapper.get("label[for='archive-keyword']").text()).toContain("关键词");
    expect(wrapper.get(".archive-filter-actions").text()).toContain("搜索");
    expect(wrapper.get(".archive-filter-actions").text()).toContain("重置");
    await wrapper.get("#archive-keyword").setValue("spring");
    await wrapper.get("form").trigger("submit");

    expect(wrapper.emitted("search")?.[0]?.[0]).toMatchObject({
      keyword: "spring",
      year: "2026",
      topic: "spring-boot",
      series: "build-blog"
    });
  });

  it("emits reset from the reset button", async () => {
    const wrapper = mountFilters();

    await wrapper.get('[data-test="archive-reset"]').trigger("click");

    expect(wrapper.emitted("reset")).toHaveLength(1);
  });

  it("hides taxonomy selects when taxonomy options are unavailable", () => {
    const wrapper = mount(ArchiveFilters, {
      props: {
        filters: { keyword: "", year: "", category: "", tag: "", topic: "", series: "", sort: "publishedAt,desc" },
        years: [],
        categories: [],
        tags: [],
        topics: [],
        series: [],
        taxonomyAvailable: false
      }
    });

    expect(wrapper.find("#archive-category").exists()).toBe(false);
    expect(wrapper.find("#archive-tag").exists()).toBe(false);
    expect(wrapper.find("#archive-topic").exists()).toBe(false);
    expect(wrapper.find("#archive-series").exists()).toBe(false);
  });
});
