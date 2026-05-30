import { createRouter, createWebHistory } from "vue-router";
import AboutView from "../views/AboutView.vue";
import ArchiveView from "../views/ArchiveView.vue";
import HomeView from "../views/HomeView.vue";
import PostDetailView from "../views/PostDetailView.vue";
import SeriesDetailView from "../views/SeriesDetailView.vue";
import SeriesIndexView from "../views/SeriesIndexView.vue";
import TaxonomyView from "../views/TaxonomyView.vue";
import TopicDetailView from "../views/TopicDetailView.vue";
import TopicIndexView from "../views/TopicIndexView.vue";
import { applySiteMetadata } from "../lib/siteMetadata";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomeView },
    { path: "/posts/:slug", component: PostDetailView },
    { path: "/categories/:slug", component: TaxonomyView, props: { type: "category" } },
    { path: "/tags/:slug", component: TaxonomyView, props: { type: "tag" } },
    { path: "/topics", component: TopicIndexView },
    { path: "/topics/:slug", component: TopicDetailView },
    { path: "/series", component: SeriesIndexView },
    { path: "/series/:slug", component: SeriesDetailView },
    { path: "/archive", component: ArchiveView },
    { path: "/about", component: AboutView }
  ]
});

router.afterEach((to) => {
  if (to.path.startsWith("/posts/")) {
    applySiteMetadata({ title: "Article", path: to.path });
    return;
  }

  const title = to.path === "/archive"
    ? "Archive"
    : to.path === "/about"
      ? "About"
      : undefined;
  const description = to.path === "/archive"
    ? "Browse articles by time, topic, and keyword."
    : undefined;
  applySiteMetadata({ title, description, path: to.path });
});
