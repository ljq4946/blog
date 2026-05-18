import { describe, expect, it } from "vitest";
import { canEnterAdminRoute } from "./guards";

describe("admin route guards", () => {
  it("allows login without a token and redirects protected routes", () => {
    expect(canEnterAdminRoute("/login", null)).toEqual({ allow: true });
    expect(canEnterAdminRoute("/posts", null)).toEqual({ redirect: "/login" });
    expect(canEnterAdminRoute("/login", "token")).toEqual({ redirect: "/" });
  });
});
