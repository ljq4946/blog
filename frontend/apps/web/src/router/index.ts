import { createRouter, createWebHistory } from "vue-router";
import AboutView from "../views/AboutView.vue";
import ArchiveView from "../views/ArchiveView.vue";
import HomeView from "../views/HomeView.vue";
import PostDetailView from "../views/PostDetailView.vue";
import TaxonomyView from "../views/TaxonomyView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomeView },
    { path: "/posts/:slug", component: PostDetailView },
    { path: "/categories/:slug", component: TaxonomyView, props: { type: "category" } },
    { path: "/tags/:slug", component: TaxonomyView, props: { type: "tag" } },
    { path: "/archive", component: ArchiveView },
    { path: "/about", component: AboutView }
  ]
});
