import { ApiClient, type ArchiveMonth, type Category, type Post, type SitePage, type Tag } from "@blog/shared";

const api = new ApiClient({ baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api" });

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
  post(slug: string) {
    return api.get<Post>(`/v1/posts/${slug}`);
  },
  categories() {
    return api.get<Category[]>("/v1/categories");
  },
  tags() {
    return api.get<Tag[]>("/v1/tags");
  },
  archive() {
    return api.get<ArchiveMonth[]>("/v1/archive");
  },
  about() {
    return api.get<SitePage>("/v1/site-pages/about");
  }
};
