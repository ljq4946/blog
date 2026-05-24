import { tokenStorage } from "@blog/shared";
import { createRouter, createWebHistory } from "vue-router";
import AboutView from "../views/AboutView.vue";
import CategoriesView from "../views/CategoriesView.vue";
import CommentsView from "../views/CommentsView.vue";
import DashboardView from "../views/DashboardView.vue";
import HomeProfileView from "../views/HomeProfileView.vue";
import LoginView from "../views/LoginView.vue";
import MediaView from "../views/MediaView.vue";
import PostEditorView from "../views/PostEditorView.vue";
import PostsView from "../views/PostsView.vue";
import TagsView from "../views/TagsView.vue";
import { canEnterAdminRoute } from "./guards";

export const router = createRouter({
  history: createWebHistory("/admin"),
  routes: [
    { path: "/login", component: LoginView },
    { path: "/", component: DashboardView },
    { path: "/posts", component: PostsView },
    { path: "/posts/new", component: PostEditorView },
    { path: "/posts/:id", component: PostEditorView },
    { path: "/home-profile", component: HomeProfileView },
    { path: "/categories", component: CategoriesView },
    { path: "/tags", component: TagsView },
    { path: "/media", component: MediaView },
    { path: "/comments", component: CommentsView },
    { path: "/about", component: AboutView }
  ]
});

router.beforeEach((to) => {
  const result = canEnterAdminRoute(to.path, tokenStorage.get());
  return "redirect" in result ? result.redirect : true;
});
