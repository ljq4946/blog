import { describe, expect, it } from "vitest";
import { router } from "./index";

describe("web router", () => {
  it("removes the posts listing route while preserving post details", () => {
    const paths = router.getRoutes().map((route) => route.path);

    expect(paths).not.toContain("/posts");
    expect(paths).toContain("/posts/:slug");
  });
});
