import {
  ApiClient,
  type ArchiveMonth,
  type Category,
  type CommentInput,
  type HomeProfile,
  type LikeResponse,
  type PageResponse,
  type Post,
  type PublicComment,
  type Series,
  type SeriesDetail,
  type SitePage,
  type Tag,
  type Topic,
  type TopicDetail
} from "@blog/shared";

const api = new ApiClient({ baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api" });

export interface PostSearchParams {
  keyword?: string | null;
  year?: string | number | null;
  category?: string | null;
  tag?: string | null;
  topic?: string | null;
  series?: string | null;
  page?: number | null;
  size?: number | null;
  sort?: string | null;
}

export function cleanPostSearchParams(params: PostSearchParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === "string") {
      const text = value.trim();
      if (!text) {
        return;
      }
      query.set(key, text);
      return;
    }
    query.set(key, String(value));
  });
  return query;
}

export const publicApi = {
  posts(params: { category?: string; tag?: string } = {}) {
    const query = new URLSearchParams();
    if (params.category) {
      query.set("category", params.category);
    }
    if (params.tag) {
      query.set("tag", params.tag);
    }
    return api.get<Post[]>(`/v1/posts${query.size ? `?${query}` : ""}`);
  },
  searchPosts(params: PostSearchParams = {}) {
    const query = cleanPostSearchParams(params);
    return api.get<PageResponse<Post>>(`/v1/posts/search${query.size ? `?${query}` : ""}`);
  },
  post(slug: string) {
    return api.get<Post>(`/v1/posts/${slug}`);
  },
  comments(slug: string) {
    return api.get<PublicComment[]>(`/v1/posts/${slug}/comments`);
  },
  createComment(slug: string, input: CommentInput) {
    return api.post<PublicComment>(`/v1/posts/${slug}/comments`, input);
  },
  likes(slug: string) {
    return api.get<LikeResponse>(`/v1/posts/${slug}/likes`);
  },
  likePost(slug: string) {
    return api.post<LikeResponse>(`/v1/posts/${slug}/likes`);
  },
  categories() {
    return api.get<Category[]>("/v1/categories");
  },
  tags() {
    return api.get<Tag[]>("/v1/tags");
  },
  topics() {
    return api.get<Topic[]>("/v1/topics");
  },
  topic(slug: string) {
    return api.get<TopicDetail>(`/v1/topics/${slug}`);
  },
  seriesList() {
    return api.get<Series[]>("/v1/series");
  },
  series(slug: string) {
    return api.get<SeriesDetail>(`/v1/series/${slug}`);
  },
  archive() {
    return api.get<ArchiveMonth[]>("/v1/archive");
  },
  about() {
    return api.get<SitePage>("/v1/site-pages/about");
  },
  homeProfile() {
    return api.get<HomeProfile>("/v1/home-profile");
  }
};
