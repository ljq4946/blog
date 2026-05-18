import { defineStore } from "pinia";
import { tokenStorage, type AuthUser } from "@blog/shared";
import { adminApi } from "../lib/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as AuthUser | null,
    loading: false
  }),
  actions: {
    async login(username: string, password: string) {
      this.loading = true;
      try {
        const response = await adminApi.login(username, password);
        tokenStorage.set(response.token);
        this.user = response.user;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      tokenStorage.clear();
      this.user = null;
    }
  }
});
