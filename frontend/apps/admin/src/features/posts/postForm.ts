import type { PostInput } from "@blog/shared";

export type PostForm = Partial<PostInput> & { title?: string; slug?: string; tagIds: number[]; topicIds: number[] };

export type PublishCheckLevel = "required" | "recommended";

export interface PublishCheck {
  key: "title" | "slug" | "content" | "summary" | "category" | "tags" | "cover" | "seo" | "schedule" | "topic" | "series";
  label: string;
  level: PublishCheckLevel;
  passed: boolean;
}

export interface PostRecoverySnapshot {
  form: ReturnType<typeof toPostInput>;
  updatedAt: number;
}

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
  if (form.status === "SCHEDULED" && !form.publishedAt) {
    errors.push("请选择排期发布时间");
  }
  if (form.seriesId !== null && form.seriesId !== undefined && (!form.seriesOrder || form.seriesOrder < 1)) {
    errors.push("请选择系列序号");
  }
  return errors;
}

export function toPostInput(form: PostForm): PostInput {
  return {
    title: form.title?.trim() ?? "",
    slug: form.slug?.trim() ?? "",
    summary: form.summary ?? "",
    seoTitle: form.seoTitle?.trim() ?? "",
    seoDescription: form.seoDescription?.trim() ?? "",
    contentHtml: form.contentHtml ?? "",
    coverMediaId: form.coverMediaId ?? null,
    status: form.status ?? "DRAFT",
    visibility: form.visibility ?? "PUBLIC",
    contentType: form.contentType ?? "ARTICLE",
    categoryId: form.categoryId ?? null,
    topicIds: form.topicIds ?? [],
    seriesId: form.seriesId ?? null,
    seriesOrder: form.seriesId === null || form.seriesId === undefined ? null : form.seriesOrder ?? null,
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

  const wordCharacters = text.match(/[\p{L}\p{N}]/gu) ?? [];
  return wordCharacters.length;
}

export function postFormSnapshot(form: PostForm) {
  return JSON.stringify({
    title: form.title?.trim() ?? "",
    slug: form.slug?.trim() ?? "",
    summary: form.summary ?? "",
    seoTitle: form.seoTitle ?? "",
    seoDescription: form.seoDescription ?? "",
    contentHtml: form.contentHtml ?? "",
    coverMediaId: form.coverMediaId ?? null,
    status: form.status ?? "DRAFT",
    visibility: form.visibility ?? "PUBLIC",
    contentType: form.contentType ?? "ARTICLE",
    categoryId: form.categoryId ?? null,
    topicIds: [...(form.topicIds ?? [])].sort((left, right) => left - right),
    seriesId: form.seriesId ?? null,
    seriesOrder: form.seriesId === null || form.seriesId === undefined ? null : form.seriesOrder ?? null,
    tagIds: [...(form.tagIds ?? [])].sort((left, right) => left - right),
    publishedAt: form.publishedAt ?? null
  });
}

export function publishChecklist(form: PostForm): PublishCheck[] {
  const contentWords = wordCountFromHtml(form.contentHtml);
  return [
    { key: "title", label: "标题", level: "required", passed: Boolean(form.title?.trim()) },
    { key: "slug", label: "URL 标识", level: "required", passed: Boolean(form.slug?.trim()) },
    { key: "content", label: "正文", level: "required", passed: contentWords > 0 },
    { key: "summary", label: "摘要", level: "recommended", passed: Boolean(form.summary?.trim()) },
    { key: "category", label: "分类", level: "recommended", passed: form.categoryId !== null && form.categoryId !== undefined },
    { key: "topic", label: "专题", level: "recommended", passed: (form.topicIds ?? []).length > 0 },
    { key: "seo", label: "SEO 描述", level: "recommended", passed: Boolean(form.seoTitle?.trim() && form.seoDescription?.trim()) },
    { key: "schedule", label: "排期", level: "recommended", passed: form.status !== "SCHEDULED" || Boolean(form.publishedAt) },
    { key: "tags", label: "标签", level: "recommended", passed: (form.tagIds ?? []).length > 0 },
    { key: "cover", label: "封面", level: "recommended", passed: form.coverMediaId !== null && form.coverMediaId !== undefined }
  ];
}

export function postRecoveryKey(postId?: number | string | null) {
  return postId === undefined || postId === null ? "post-editor:new" : `post-editor:${postId}`;
}

export function postRecoverySnapshot(form: PostForm, updatedAt = Date.now()): PostRecoverySnapshot {
  return {
    form: toPostInput({
      ...form,
      topicIds: [...(form.topicIds ?? [])].sort((left, right) => left - right),
      tagIds: [...(form.tagIds ?? [])].sort((left, right) => left - right)
    }),
    updatedAt
  };
}
