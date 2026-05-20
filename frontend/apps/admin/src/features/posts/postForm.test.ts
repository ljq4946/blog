import { describe, expect, it } from "vitest";
import {
  postFormSnapshot,
  postRecoveryKey,
  postRecoverySnapshot,
  publishChecklist,
  toPostInput,
  validatePostForm,
  wordCountFromHtml
} from "./postForm";

describe("post form validation", () => {
  it("requires title, slug, and status", () => {
    expect(validatePostForm({ title: "", slug: "", status: "DRAFT", tagIds: [] })).toContain("请填写标题");
    expect(validatePostForm({ title: "Hello", slug: "hello", status: "PUBLISHED", tagIds: [] })).toEqual([]);
  });

  it("counts Chinese characters, latin letters, and digits from editor HTML", () => {
    expect(wordCountFromHtml("<p>\u4f60\u597d world</p><p>Vue 3</p>")).toBe(11);
    expect(wordCountFromHtml("<p>111\u4e0a\u5347abc123\u8d8b\u52bf</p>")).toBe(13);
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

describe("publishChecklist", () => {
  it("marks title, slug, and content as required failures", () => {
    const checks = publishChecklist({
      title: "",
      slug: "",
      summary: "",
      contentHtml: "<p></p>",
      coverMediaId: null,
      status: "DRAFT",
      categoryId: null,
      tagIds: []
    });

    expect(checks.filter((check) => check.level === "required" && !check.passed).map((check) => check.key)).toEqual([
      "title",
      "slug",
      "content"
    ]);
  });

  it("marks summary, category, tags, and cover as recommended failures", () => {
    const checks = publishChecklist({
      title: "Readable article",
      slug: "readable-article",
      summary: "",
      contentHtml: "<p>正文内容</p>",
      coverMediaId: null,
      status: "DRAFT",
      categoryId: null,
      tagIds: []
    });

    expect(checks.filter((check) => check.level === "recommended" && !check.passed).map((check) => check.key)).toEqual([
      "summary",
      "category",
      "tags",
      "cover"
    ]);
  });

  it("passes every check when the post is ready to publish", () => {
    const checks = publishChecklist({
      title: "Readable article",
      slug: "readable-article",
      summary: "A useful summary",
      contentHtml: "<p>正文内容</p>",
      coverMediaId: 7,
      status: "DRAFT",
      categoryId: 1,
      tagIds: [2]
    });

    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("normalizes form input before submit", () => {
    expect(toPostInput({ title: "  Ready  ", slug: "ready", status: "DRAFT", tagIds: [] }).title).toBe("Ready");
  });
});

describe("post recovery helpers", () => {
  it("uses a stable key for new and existing posts", () => {
    expect(postRecoveryKey()).toBe("post-editor:new");
    expect(postRecoveryKey(12)).toBe("post-editor:12");
  });

  it("creates a serializable recovery snapshot with normalized form data", () => {
    const snapshot = postRecoverySnapshot(
      {
        title: "  Hello  ",
        slug: "hello",
        summary: "Summary",
        contentHtml: "<p>正文</p>",
        coverMediaId: null,
        status: "DRAFT",
        categoryId: null,
        tagIds: [3, 1],
        publishedAt: null
      },
      1779012492167
    );

    expect(snapshot.updatedAt).toBe(1779012492167);
    expect(snapshot.form.title).toBe("Hello");
    expect(snapshot.form.tagIds).toEqual([1, 3]);
  });
});
