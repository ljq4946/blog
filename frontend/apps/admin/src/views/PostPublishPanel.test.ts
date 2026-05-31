import { mount } from "@vue/test-utils";
import ElementPlus, { ElDatePicker, ElInputNumber, ElSelect } from "element-plus";
import { describe, expect, it } from "vitest";
import PostPublishPanel from "./PostPublishPanel.vue";
import type { Category, MediaAsset, Series, Tag, Topic } from "@blog/shared";
import type { PostForm, PublishCheck } from "../features/posts/postForm";

const form: PostForm = {
  title: "标题样例",
  slug: "sample-title",
  summary: "",
  seoTitle: "SEO 标题",
  seoDescription: "SEO 描述",
  contentHtml: "",
  coverMediaId: 7,
  status: "DRAFT",
  categoryId: 1,
  topicIds: [3],
  seriesId: 4,
  seriesOrder: 1,
  tagIds: [2],
  visibility: "PUBLIC",
  contentType: "ARTICLE"
};

const checks: PublishCheck[] = [
  { key: "title", label: "标题", level: "required", passed: true },
  { key: "content", label: "正文", level: "required", passed: false },
  { key: "summary", label: "摘要", level: "recommended", passed: false }
];

const categories: Category[] = [{ id: 1, name: "随笔", slug: "notes", sortOrder: 0 }];
const topics: Topic[] = [{ id: 3, name: "Spring Boot", slug: "spring-boot", sortOrder: 0 }];
const series: Series[] = [{
  id: 4,
  name: "Build Blog",
  slug: "build-blog",
  description: "Project",
  primaryTopic: { id: 3, name: "Spring Boot", slug: "spring-boot" },
  sortOrder: 0
}];
const tags: Tag[] = [{ id: 2, name: "Vue", slug: "vue" }];
const mediaAssets: MediaAsset[] = [
  {
    id: 7,
    originalName: "cover.png",
    storedName: "cover.png",
    url: "/uploads/cover.png",
    mimeType: "image/png",
    size: 100,
    createdAt: "2026-05-18T00:00:00Z"
  }
];

function mountPanel(overrides: Partial<InstanceType<typeof PostPublishPanel>["$props"]> = {}) {
  return mount(PostPublishPanel, {
    props: {
      form,
      checks,
      categories,
      topics,
      series,
      tags,
      mediaAssets,
      selectedCover: mediaAssets[0],
      saveStatusText: "未保存 · 草稿",
      recoveryAvailable: true,
      ...overrides
    },
    global: {
      plugins: [ElementPlus]
    }
  });
}

describe("PostPublishPanel", () => {
  it("renders save status, publish checks, labels, and recovery actions", () => {
    const wrapper = mountPanel();

    expect(wrapper.text()).toContain("未保存 · 草稿");
    expect(wrapper.text()).toContain("发布检查");
    expect(wrapper.text()).toContain("标题");
    expect(wrapper.text()).toContain("正文");
    expect(wrapper.text()).toContain("专题");
    expect(wrapper.text()).toContain("系列");
    expect(wrapper.text()).toContain("SEO 标题");
    expect(wrapper.text()).toContain("Canonical");
    expect(wrapper.text()).toContain("建议完善");
    expect(wrapper.find('[data-test="restore-recovery"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="discard-recovery"]').exists()).toBe(true);
  });

  it("emits recovery actions when recovery buttons are clicked", async () => {
    const wrapper = mountPanel();

    await wrapper.find('[data-test="restore-recovery"]').trigger("click");
    await wrapper.find('[data-test="discard-recovery"]').trigger("click");

    expect(wrapper.emitted("restore-recovery")).toHaveLength(1);
    expect(wrapper.emitted("discard-recovery")).toHaveLength(1);
  });

  it("emits merged form updates when publish fields change", async () => {
    const wrapper = mountPanel();
    const selects = wrapper.findAllComponents(ElSelect);
    const datePickers = wrapper.findAllComponents(ElDatePicker);
    const slugInput = wrapper.find('input[aria-label="URL 标识"]');

    expect(slugInput.exists()).toBe(true);

    await slugInput.setValue("updated-title");
    await wrapper.find('[data-test="seo-title"]').setValue("Updated SEO");
    await wrapper.find('[data-test="seo-description"]').setValue("Updated SEO description");
    await selects[0].vm.$emit("update:modelValue", "PUBLISHED");
    await selects[0].vm.$emit("update:modelValue", "SCHEDULED");
    await selects[1].vm.$emit("update:modelValue", "PRIVATE");
    await selects[2].vm.$emit("update:modelValue", "NOTE");
    await datePickers[0].vm.$emit("update:modelValue", "2026-06-01T08:00:00Z");
    await selects[5].vm.$emit("update:modelValue", [3]);
    await selects[6].vm.$emit("update:modelValue", 4);
    await wrapper.findComponent(ElInputNumber).vm.$emit("update:modelValue", 2);
    await selects[7].vm.$emit("update:modelValue", [2, 3]);

    expect(wrapper.emitted("update:form")).toEqual([
      [{ ...form, slug: "updated-title" }],
      [{ ...form, seoTitle: "Updated SEO" }],
      [{ ...form, seoDescription: "Updated SEO description" }],
      [{ ...form, status: "PUBLISHED" }],
      [{ ...form, status: "SCHEDULED" }],
      [{ ...form, visibility: "PRIVATE" }],
      [{ ...form, contentType: "NOTE" }],
      [{ ...form, publishedAt: "2026-06-01T08:00:00Z" }],
      [{ ...form, topicIds: [3] }],
      [{ ...form, seriesId: 4 }],
      [{ ...form, seriesOrder: 2 }],
      [{ ...form, tagIds: [2, 3] }]
    ]);
  });

  it("emits quick-create requests from taxonomy fields", async () => {
    const wrapper = mountPanel();

    await wrapper.find('[data-test="quick-category"]').trigger("click");
    await wrapper.find('[data-test="quick-tag"]').trigger("click");
    await wrapper.find('[data-test="quick-topic"]').trigger("click");

    expect(wrapper.emitted("quick-create")).toEqual([["category"], ["tag"], ["topic"]]);
  });
});
