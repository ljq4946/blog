export type PostStatus = "DRAFT" | "PUBLISHED";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  contentHtml?: string | null;
  coverMediaId?: number | null;
  coverMediaUrl?: string | null;
  status: PostStatus;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  tags?: Array<Pick<Tag, "id" | "name" | "slug">>;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface PostInput {
  title: string;
  slug: string;
  summary?: string;
  contentHtml?: string;
  coverMediaId?: number | null;
  status: PostStatus;
  categoryId?: number | null;
  tagIds: number[];
  publishedAt?: string | null;
}

export interface MediaAsset {
  id: number;
  originalName: string;
  storedName: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
}

export interface SitePage {
  key: string;
  title: string;
  contentHtml: string;
  updatedAt: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: "ADMIN";
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ArchiveMonth {
  month: string;
  posts: Post[];
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
