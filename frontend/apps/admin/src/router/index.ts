import { tokenStorage } from "@blog/shared";
import { createRouter, createWebHistory } from "vue-router";
import { canEnterAdminRoute } from "./guards";

export const router = createRouter({
  history: createWebHistory("/admin"),
  routes: [
    { path: "/login", component: () => import("../views/LoginView.vue") },
    { path: "/", component: () => import("../views/DashboardView.vue") },
    { path: "/posts", component: () => import("../views/PostsView.vue") },
    { path: "/posts/new", component: () => import("../views/PostEditorView.vue") },
    { path: "/posts/:id", component: () => import("../views/PostEditorView.vue") },
    { path: "/home-profile", component: () => import("../views/HomeProfileView.vue") },
    { path: "/categories", component: () => import("../views/CategoriesView.vue") },
    { path: "/tags", component: () => import("../views/TagsView.vue") },
    { path: "/topics", component: () => import("../views/TopicsView.vue") },
    { path: "/series", component: () => import("../views/SeriesView.vue") },
    { path: "/media", component: () => import("../views/MediaView.vue") },
    { path: "/comments", component: () => import("../views/CommentsView.vue") },
    { path: "/about", component: () => import("../views/AboutView.vue") }
  ]
});

router.beforeEach((to) => {
  const result = canEnterAdminRoute(to.path, tokenStorage.get());
  return "redirect" in result ? result.redirect : true;
});
