import { describe, expect, it } from "vitest";
import { router } from "./index";

describe("admin router", () => {
  it("lazy-loads protected route views to keep the login entry lightweight", () => {
    const protectedPaths = ["/", "/posts", "/posts/new", "/home-profile", "/media", "/comments", "/about"];

    for (const path of protectedPaths) {
      const route = router.getRoutes().find((candidate) => candidate.path === path);
      expect(route, path).toBeDefined();
      expect(typeof route?.components?.default, path).toBe("function");
    }
  });
});
