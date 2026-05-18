import { describe, expect, it } from "vitest";
import { validatePostForm } from "./postForm";

describe("post form validation", () => {
  it("requires title, slug, and status", () => {
    expect(validatePostForm({ title: "", slug: "", status: "DRAFT", tagIds: [] })).toContain("请填写标题");
    expect(validatePostForm({ title: "Hello", slug: "hello", status: "PUBLISHED", tagIds: [] })).toEqual([]);
  });
});
