<template>
  <ReadingProgress />

  <main v-if="post" class="article-page">
    <header class="article-hero">
      <p class="kicker">{{ formatDate(post.publishedAt) }}</p>
      <div class="article-taxonomy">
        <RouterLink v-if="post.category" :to="`/categories/${post.category.slug}`">{{ post.category.name }}</RouterLink>
        <span v-for="tag in post.tags ?? []" :key="tag.id">#{{ tag.name }}</span>
      </div>
      <h1>{{ post.title }}</h1>
      <p v-if="post.summary" class="summary">{{ post.summary }}</p>
      <img v-if="post.coverMediaUrl" class="article-hero-cover" :src="post.coverMediaUrl" :alt="post.title" />
    </header>

    <div class="article-layout">
      <ArticleRenderer class="article-content" :content-html="post.contentHtml" @toc-change="tocItems = $event" />
      <aside class="article-sidebar">
        <ReadingPreferences />
        <ArticleToc :items="tocItems" :active-id="activeHeadingId" @navigate="navigateToHeading" />
      </aside>
    </div>

    <section class="article-interactions" aria-label="文章互动">
      <div class="like-panel">
        <div>
          <span>点赞</span>
          <strong data-test="like-count">{{ likeCount }} 次</strong>
        </div>
        <button data-test="like-button" type="button" :disabled="liked || liking" @click="likeCurrentPost">
          {{ liked ? "已点赞" : "点赞" }}
        </button>
      </div>

      <section class="comment-panel">
        <div class="comment-head">
          <h2>评论</h2>
          <span>{{ comments.length }} 条</span>
        </div>
        <p v-if="interactionError" class="interaction-error">{{ interactionError }}</p>
        <ol v-if="comments.length" class="comment-list">
          <li v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-meta">
              <strong>{{ comment.nickname }}</strong>
              <time>{{ formatDate(comment.createdAt) }}</time>
            </div>
            <p>{{ comment.content }}</p>
          </li>
        </ol>
        <p v-else class="comment-empty">暂无评论，留下第一条想法。</p>

        <form data-test="comment-form" class="comment-form" @submit.prevent="submitComment">
          <label>
            昵称
            <input data-test="comment-nickname" v-model="commentForm.nickname" maxlength="80" required />
          </label>
          <label>
            邮箱（可选，不公开）
            <input data-test="comment-email" v-model="commentForm.email" maxlength="160" type="email" />
          </label>
          <label class="comment-content-field">
            评论内容
            <textarea data-test="comment-content" v-model="commentForm.content" maxlength="1000" required></textarea>
          </label>
          <button type="submit" :disabled="commentSubmitting">{{ commentSubmitting ? "提交中" : "提交评论" }}</button>
        </form>
      </section>
    </section>

    <button data-test="back-to-top" class="back-to-top" type="button" @click="scrollToTop">返回顶部</button>
  </main>

  <main v-else-if="loadFailed" class="content-band article-error">
    <h1>文章暂不可用</h1>
    <p>这篇文章暂时无法加载，可能已经移动或尚未发布。</p>
    <RouterLink to="/archive">返回全部文章</RouterLink>
  </main>
</template>

<script setup lang="ts">
import { formatDate, type Post, type PublicComment } from "@blog/shared";
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import ArticleRenderer from "../components/reading/ArticleRenderer.vue";
import ArticleToc from "../components/reading/ArticleToc.vue";
import ReadingPreferences from "../components/reading/ReadingPreferences.vue";
import ReadingProgress from "../components/reading/ReadingProgress.vue";
import type { TocItem } from "../features/reading/articleEnhancements";
import { publicApi } from "../lib/api";
import { applySiteMetadata } from "../lib/siteMetadata";

const LIKED_POSTS_KEY = "blog-liked-posts";

const route = useRoute();
const post = ref<Post | null>(null);
const loadFailed = ref(false);
const tocItems = ref<TocItem[]>([]);
const activeHeadingId = ref("");
const comments = ref<PublicComment[]>([]);
const likeCount = ref(0);
const liked = ref(false);
const liking = ref(false);
const commentSubmitting = ref(false);
const interactionError = ref("");
const commentForm = reactive({
  nickname: "",
  email: "",
  content: ""
});

function navigateToHeading(id: string) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
  activeHeadingId.value = id;
}

function updateActiveHeading() {
  let activeId = "";
  for (const item of tocItems.value) {
    const heading = document.getElementById(item.id);
    if (heading && heading.getBoundingClientRect().top <= 120) {
      activeId = item.id;
    }
  }
  activeHeadingId.value = activeId || tocItems.value[0]?.id || "";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadInteractions(slug: string) {
  interactionError.value = "";
  const [loadedComments, loadedLikes] = await Promise.all([
    publicApi.comments(slug),
    publicApi.likes(slug)
  ]);
  comments.value = loadedComments;
  likeCount.value = loadedLikes.count;
  liked.value = readLikedPosts().includes(slug);
}

async function submitComment() {
  if (!post.value || commentSubmitting.value) {
    return;
  }
  const nickname = commentForm.nickname.trim();
  const content = commentForm.content.trim();
  const email = commentForm.email.trim();
  if (!nickname || !content) {
    interactionError.value = "请填写昵称和评论内容。";
    return;
  }

  commentSubmitting.value = true;
  interactionError.value = "";
  try {
    const created = await publicApi.createComment(post.value.slug, {
      nickname,
      email: email || null,
      content
    });
    comments.value = [...comments.value, created];
    commentForm.content = "";
  } catch {
    interactionError.value = "评论提交失败，请稍后重试。";
  } finally {
    commentSubmitting.value = false;
  }
}

async function likeCurrentPost() {
  if (!post.value || liked.value || liking.value) {
    return;
  }
  liking.value = true;
  interactionError.value = "";
  try {
    const response = await publicApi.likePost(post.value.slug);
    likeCount.value = response.count;
    liked.value = true;
    writeLikedPost(post.value.slug);
  } catch {
    interactionError.value = "点赞失败，请稍后重试。";
  } finally {
    liking.value = false;
  }
}

function readLikedPosts() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LIKED_POSTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeLikedPost(slug: string) {
  const next = Array.from(new Set([...readLikedPosts(), slug]));
  window.localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(next));
}

onMounted(async () => {
  const slug = String(route.params.slug);
  try {
    post.value = await publicApi.post(slug);
    applySiteMetadata({
      title: post.value.title,
      description: post.value.summary,
      path: `/posts/${post.value.slug}`,
      image: post.value.coverMediaUrl
    });
    try {
      await loadInteractions(slug);
    } catch {
      interactionError.value = "互动数据暂时无法加载。";
    }
    await nextTick();
    updateActiveHeading();
  } catch {
    loadFailed.value = true;
    post.value = null;
  }

  window.addEventListener("scroll", updateActiveHeading, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateActiveHeading);
});
</script>
