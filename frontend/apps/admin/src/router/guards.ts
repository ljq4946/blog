export type GuardResult = { allow: true } | { redirect: string };

export function canEnterAdminRoute(path: string, token: string | null): GuardResult {
  if (path === "/login") {
    return token ? { redirect: "/" } : { allow: true };
  }
  return token ? { allow: true } : { redirect: "/login" };
}
