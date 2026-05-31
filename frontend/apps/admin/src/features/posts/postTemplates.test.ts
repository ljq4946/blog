import { describe, expect, it } from "vitest";
import type { PostForm } from "./postForm";
import { applyWritingTemplate, writingTemplates } from "./postTemplates";

const emptyForm: PostForm = {
  title: "Build a search index",
  slug: "build-a-search-index",
  summary: "",
  seoTitle: "",
  seoDescription: "",
  contentHtml: "",
  coverMediaId: null,
  status: "DRAFT",
  categoryId: null,
  topicIds: [],
  seriesId: null,
  seriesOrder: null,
  tagIds: [],
  publishedAt: null
};

describe("writingTemplates", () => {
  it("provides focused templates for common blog writing jobs", () => {
    expect(writingTemplates.map((template) => template.id)).toEqual([
      "project-case",
      "technical-note",
      "release-review"
    ]);
  });

  it("applies a project case template without changing publishing metadata", () => {
    const next = applyWritingTemplate(emptyForm, "project-case");

    expect(next).toMatchObject({
      title: "Build a search index",
      slug: "build-a-search-index",
      status: "DRAFT",
      categoryId: null,
      topicIds: [],
      tagIds: []
    });
    expect(next.summary).toContain("项目背景");
    expect(next.contentHtml).toContain("目标");
    expect(next.contentHtml).toContain("实现路径");
    expect(next.contentHtml).toContain("结果");
  });

  it("preserves existing summary and appends the template to existing content", () => {
    const next = applyWritingTemplate(
      {
        ...emptyForm,
        summary: "Keep this summary",
        contentHtml: "<p>Existing note</p>"
      },
      "technical-note"
    );

    expect(next.summary).toBe("Keep this summary");
    expect(next.contentHtml).toContain("<p>Existing note</p>");
    expect(next.contentHtml).toContain("问题");
    expect(next.contentHtml).toContain("结论");
  });
});
