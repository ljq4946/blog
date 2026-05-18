import { describe, expect, it } from "vitest";
import { createTokenStorage } from "./tokenStorage";

describe("token storage", () => {
  it("stores, reads, and clears the admin token", () => {
    const storage = createTokenStorage("blog:test-token");

    storage.set("secret");
    expect(storage.get()).toBe("secret");

    storage.clear();
    expect(storage.get()).toBeNull();
  });
});
