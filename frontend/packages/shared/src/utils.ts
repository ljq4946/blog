import type { Post } from "./types";

export function formatDate(value?: string | null, locale = "zh-CN") {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function groupPostsByArchiveMonth(posts: Array<Pick<Post, "publishedAt"> & Post>) {
  const map = new Map<string, Post[]>();
  for (const post of posts) {
    if (!post.publishedAt) {
      continue;
    }
    const month = post.publishedAt.slice(0, 7);
    map.set(month, [...(map.get(month) ?? []), post]);
  }
  return [...map.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([month, groupedPosts]) => ({ month, posts: groupedPosts }));
}
