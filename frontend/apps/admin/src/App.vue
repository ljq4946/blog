<template>
  <RouterView v-if="isLogin" />
  <div v-else class="admin-shell admin-shell--constructivist">
    <aside class="sidebar">
      <RouterLink class="brand" to="/">
        <span class="brand-mark"></span>
        博客管理
      </RouterLink>
      <nav>
        <RouterLink to="/posts">文章</RouterLink>
        <RouterLink to="/home-profile">首页</RouterLink>
        <RouterLink to="/categories">分类</RouterLink>
        <RouterLink to="/tags">标签</RouterLink>
        <RouterLink to="/media">媒体</RouterLink>
        <RouterLink to="/comments">评论</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
      <button class="logout" type="button" @click="logout">退出登录</button>
    </aside>
    <main class="workspace">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "./stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const isLogin = computed(() => route.path === "/login");

function logout() {
  auth.logout();
  router.push("/login");
}
</script>
