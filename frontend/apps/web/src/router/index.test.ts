import { describe, expect, it } from "vitest";
import { router } from "./index";

describe("web router", () => {
  it("removes the posts listing route while preserving post details", () => {
    const paths = router.getRoutes().map((route) => route.path);

    expect(paths).not.toContain("/posts");
    expect(paths).toContain("/posts/:slug");
  });

  it("includes topic and series routes", () => {
    expect(router.getRoutes().map((route) => route.path)).toEqual(expect.arrayContaining([
      "/topics",
      "/topics/:slug",
      "/series",
      "/series/:slug"
    ]));
  });
});
