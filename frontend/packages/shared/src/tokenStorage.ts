const DEFAULT_TOKEN_KEY = "blog:admin-token";

export interface TokenStorage {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

export function createTokenStorage(key = DEFAULT_TOKEN_KEY): TokenStorage {
  return {
    get() {
      if (typeof window === "undefined") {
        return null;
      }
      return window.localStorage.getItem(key);
    },
    set(token: string) {
      window.localStorage.setItem(key, token);
    },
    clear() {
      window.localStorage.removeItem(key);
    }
  };
}

export const tokenStorage = createTokenStorage();
