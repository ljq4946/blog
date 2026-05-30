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

export interface Topic {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
}

export interface TopicInput {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
}

export interface Series {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  primaryTopic?: Pick<Topic, "id" | "name" | "slug"> | null;
  sortOrder: number;
}

export interface SeriesInput {
  name: string;
  slug: string;
  description?: string | null;
  primaryTopicId?: number | null;
  sortOrder: number;
}

export interface SeriesPostSummary {
  id: number;
  title: string;
  slug: string;
  seriesOrder?: number | null;
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
  topics?: Array<Pick<Topic, "id" | "name" | "slug">>;
  series?: Pick<Series, "id" | "name" | "slug" | "primaryTopic"> | null;
  seriesOrder?: number | null;
  previousSeriesPost?: SeriesPostSummary | null;
  nextSeriesPost?: SeriesPostSummary | null;
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
  topicIds: number[];
  seriesId?: number | null;
  seriesOrder?: number | null;
  tagIds: number[];
  publishedAt?: string | null;
}

export interface TopicDetail {
  topic: Topic;
  relatedSeries: Series[];
  posts: Post[];
}

export interface SeriesDetail {
  series: Series;
  posts: Post[];
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

export interface HomeProfileFocusItem {
  label: string;
  text: string;
}

export interface HomeProfileInput {
  musicTitle: string;
  musicSubtitle: string;
  musicMeta: string;
  musicAudioUrl: string;
  aboutKicker: string;
  aboutTitle: string;
  aboutBody: string;
  focusItems: HomeProfileFocusItem[];
}

export interface HomeProfile extends HomeProfileInput {
  key: string;
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

export interface CommentInput {
  nickname: string;
  email?: string | null;
  content: string;
}

export interface PublicComment {
  id: number;
  nickname: string;
  content: string;
  createdAt: string;
}

export interface AdminComment extends PublicComment {
  postId: number;
  postTitle: string;
  postSlug: string;
  email?: string | null;
}

export interface LikeResponse {
  count: number;
}
