import { describe, expect, it } from "vitest";
import { postFormSnapshot, validatePostForm, wordCountFromHtml } from "./postForm";

describe("post form validation", () => {
  it("requires title, slug, and status", () => {
    expect(validatePostForm({ title: "", slug: "", status: "DRAFT", tagIds: [] })).toContain("请填写标题");
    expect(validatePostForm({ title: "Hello", slug: "hello", status: "PUBLISHED", tagIds: [] })).toEqual([]);
  });

  it("counts Chinese characters and latin words from editor HTML", () => {
    expect(wordCountFromHtml("<p>你好 world</p><p>Vue 3</p>")).toBe(5);
    expect(wordCountFromHtml("<p><br></p>")).toBe(0);
  });

  it("normalizes snapshots so equivalent tag order is not dirty", () => {
    expect(
      postFormSnapshot({
        title: " Hello ",
        slug: "hello",
        summary: "",
        contentHtml: "<p>Hello</p>",
        status: "DRAFT",
        categoryId: null,
        tagIds: [3, 1],
        coverMediaId: null
      })
    ).toEqual(
      postFormSnapshot({
        title: "Hello",
        slug: "hello",
        summary: "",
        contentHtml: "<p>Hello</p>",
        status: "DRAFT",
        categoryId: null,
        tagIds: [1, 3],
        coverMediaId: null
      })
    );
  });
});
