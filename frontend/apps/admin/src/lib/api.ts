import {
  ApiClient,
  tokenStorage,
  type AdminComment,
  type AuthResponse,
  type Category,
  type MediaAsset,
  type PageResponse,
  type Post,
  type PostInput,
  type SitePage,
  type Tag
} from "@blog/shared";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const api = new ApiClient({ baseUrl, getToken: () => tokenStorage.get() });

export const adminApi = {
  login(username: string, password: string) {
    return api.post<AuthResponse>("/v1/auth/login", { username, password });
  },
  me() {
    return api.get<AuthResponse["user"]>("/v1/auth/me");
  },
  posts() {
    return api.get<Post[]>("/v1/admin/posts");
  },
  createPost(input: PostInput) {
    return api.post<Post>("/v1/admin/posts", input);
  },
  updatePost(id: number, input: PostInput) {
    return api.put<Post>(`/v1/admin/posts/${id}`, input);
  },
  deletePost(id: number) {
    return api.delete(`/v1/admin/posts/${id}`);
  },
  categories() {
    return api.get<Category[]>("/v1/admin/categories");
  },
  saveCategory(category: Partial<Category>) {
    return category.id
      ? api.put<Category>(`/v1/admin/categories/${category.id}`, category)
      : api.post<Category>("/v1/admin/categories", category);
  },
  deleteCategory(id: number) {
    return api.delete(`/v1/admin/categories/${id}`);
  },
  tags() {
    return api.get<Tag[]>("/v1/admin/tags");
  },
  saveTag(tag: Partial<Tag>) {
    return tag.id ? api.put<Tag>(`/v1/admin/tags/${tag.id}`, tag) : api.post<Tag>("/v1/admin/tags", tag);
  },
  deleteTag(id: number) {
    return api.delete(`/v1/admin/tags/${id}`);
  },
  media(page = 0) {
    return api.get<PageResponse<MediaAsset>>(`/v1/admin/media?page=${page}&size=24`);
  },
  uploadMedia(file: File) {
    const form = new FormData();
    form.set("file", file);
    return api.upload<MediaAsset>("/v1/admin/media", form);
  },
  deleteMedia(id: number) {
    return api.delete(`/v1/admin/media/${id}`);
  },
  comments() {
    return api.get<AdminComment[]>("/v1/admin/comments");
  },
  deleteComment(id: number) {
    return api.delete(`/v1/admin/comments/${id}`);
  },
  about() {
    return api.get<SitePage>("/v1/admin/site-pages/about");
  },
  saveAbout(page: Pick<SitePage, "title" | "contentHtml">) {
    return api.put<SitePage>("/v1/admin/site-pages/about", page);
  }
};
