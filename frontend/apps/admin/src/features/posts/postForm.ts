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

export function wordCountFromHtml(html?: string | null) {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return 0;
  }

  const latinWords = text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? [];
  const cjkCharacters = text.match(/[\u3400-\u9fff]/g) ?? [];
  return latinWords.length + cjkCharacters.length;
}

export function postFormSnapshot(form: PostForm) {
  return JSON.stringify({
    title: form.title?.trim() ?? "",
    slug: form.slug?.trim() ?? "",
    summary: form.summary ?? "",
    contentHtml: form.contentHtml ?? "",
    coverMediaId: form.coverMediaId ?? null,
    status: form.status ?? "DRAFT",
    categoryId: form.categoryId ?? null,
    tagIds: [...(form.tagIds ?? [])].sort((left, right) => left - right),
    publishedAt: form.publishedAt ?? null
  });
}
