<template>
  <section class="login-view">
    <form class="login-card" @submit.prevent="submit">
      <div class="page-head">
        <h1>博客管理</h1>
      </div>
      <label class="login-field">
        <span>用户名</span>
        <el-input v-model="username" autocomplete="username" />
      </label>
      <label class="login-field">
        <span>密码</span>
        <el-input v-model="password" type="password" autocomplete="current-password" show-password />
      </label>
      <el-alert v-if="error" type="error" :title="error" :closable="false" />
      <el-button native-type="submit" type="danger" :loading="auth.loading">登录</el-button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const username = ref("4946");
const password = ref("");
const error = ref("");

async function submit() {
  error.value = "";
  try {
    await auth.login(username.value, password.value);
    router.push("/");
  } catch {
    error.value = "登录失败，请检查账号或密码";
  }
}
</script>
