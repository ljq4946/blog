import type { PostInput } from "@blog/shared";

export type PostForm = Partial<PostInput> & { title?: string; slug?: string; tagIds: number[] };

export function validatePostForm(form: PostForm) {
  const errors: string[] = [];
  if (!form.title?.trim()) {
    errors.push("请填写标题");
  }
  if (!form.slug?.trim()) {
    errors.push("请填写 URL 标识");
  }
  if (!form.status) {
    errors.push("请选择状态");
  }
  return errors;
}

export function toPostInput(form: PostForm): PostInput {
  return {
    title: form.title?.trim() ?? "",
    slug: form.slug?.trim() ?? "",
    summary: form.summary ?? "",
    contentHtml: form.contentHtml ?? "",
    coverMediaId: form.coverMediaId ?? null,
    status: form.status ?? "DRAFT",
    categoryId: form.categoryId ?? null,
    tagIds: form.tagIds ?? [],
    publishedAt: form.publishedAt ?? null
  };
}
