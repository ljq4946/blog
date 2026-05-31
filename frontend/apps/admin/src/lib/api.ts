import {
  ApiClient,
  tokenStorage,
  type AdminComment,
  type AdminStatistics,
  type AuthResponse,
  type Category,
  type ContentGovernance,
  type HomeProfile,
  type HomeProfileInput,
  type KnowledgeExport,
  type KnowledgeRelation,
  type KnowledgeRelationInput,
  type MediaAsset,
  type MediaReferences,
  type OperationLog,
  type PageResponse,
  type Post,
  type PostContentType,
  type PostInput,
  type PostRevision,
  type PostVisibility,
  type Series,
  type SeriesInput,
  type SitePage,
  type Tag,
  type Topic,
  type TopicInput
} from "@blog/shared";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const api = new ApiClient({ baseUrl, getToken: () => tokenStorage.get() });

export interface PostFilters {
  visibility?: PostVisibility;
  contentType?: PostContentType;
}

export interface KnowledgeSearchFilters extends PostFilters {
  keyword?: string;
}

function withQuery(path: string, params: object) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export const adminApi = {
  login(username: string, password: string) {
    return api.post<AuthResponse>("/v1/auth/login", { username, password });
  },
  me() {
    return api.get<AuthResponse["user"]>("/v1/auth/me");
  },
  posts(filters: PostFilters = {}) {
    return api.get<Post[]>(withQuery("/v1/admin/posts", filters));
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
  postRevisions(id: number) {
    return api.get<PostRevision[]>(`/v1/admin/posts/${id}/revisions`);
  },
  restorePostRevision(postId: number, revisionId: number) {
    return api.post<Post>(`/v1/admin/posts/${postId}/revisions/${revisionId}/restore`);
  },
  convertNoteToArticle(id: number) {
    return api.post<Post>(`/v1/admin/posts/${id}/convert-to-article`);
  },
  knowledgeSearch(filters: KnowledgeSearchFilters = {}) {
    return api.get<PageResponse<Post>>(withQuery("/v1/admin/knowledge-search", filters));
  },
  knowledgeRelations(postId?: number) {
    return api.get<KnowledgeRelation[]>(withQuery("/v1/admin/knowledge-relations", { postId }));
  },
  createKnowledgeRelation(input: KnowledgeRelationInput) {
    return api.post<KnowledgeRelation>("/v1/admin/knowledge-relations", input);
  },
  deleteKnowledgeRelation(id: number) {
    return api.delete(`/v1/admin/knowledge-relations/${id}`);
  },
  exportKnowledge() {
    return api.get<KnowledgeExport>("/v1/admin/export");
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
  topics() {
    return api.get<Topic[]>("/v1/admin/topics");
  },
  saveTopic(topic: Partial<TopicInput> & { id?: number }) {
    return topic.id ? api.put<Topic>(`/v1/admin/topics/${topic.id}`, topic) : api.post<Topic>("/v1/admin/topics", topic);
  },
  deleteTopic(id: number) {
    return api.delete(`/v1/admin/topics/${id}`);
  },
  series() {
    return api.get<Series[]>("/v1/admin/series");
  },
  saveSeries(series: Partial<SeriesInput> & { id?: number }) {
    return series.id
      ? api.put<Series>(`/v1/admin/series/${series.id}`, series)
      : api.post<Series>("/v1/admin/series", series);
  },
  deleteSeries(id: number) {
    return api.delete(`/v1/admin/series/${id}`);
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
  mediaReferences(id: number) {
    return api.get<MediaReferences>(`/v1/admin/media/${id}/references`);
  },
  contentGovernance() {
    return api.get<ContentGovernance>("/v1/admin/content-governance");
  },
  statistics() {
    return api.get<AdminStatistics>("/v1/admin/statistics");
  },
  comments() {
    return api.get<AdminComment[]>("/v1/admin/comments");
  },
  updateCommentStatus(id: number, status: AdminComment["status"]) {
    return api.put<AdminComment>(`/v1/admin/comments/${id}/status`, { status });
  },
  deleteComment(id: number) {
    return api.delete(`/v1/admin/comments/${id}`);
  },
  about() {
    return api.get<SitePage>("/v1/admin/site-pages/about");
  },
  saveAbout(page: Pick<SitePage, "title" | "contentHtml">) {
    return api.put<SitePage>("/v1/admin/site-pages/about", page);
  },
  homeProfile() {
    return api.get<HomeProfile>("/v1/admin/home-profile");
  },
  saveHomeProfile(profile: HomeProfileInput) {
    return api.put<HomeProfile>("/v1/admin/home-profile", profile);
  },
  operationLogs() {
    return api.get<OperationLog[]>("/v1/admin/operation-logs");
  }
};
