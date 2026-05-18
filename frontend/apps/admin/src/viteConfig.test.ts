import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = resolve(__dirname, "..");

describe("admin Vite config", () => {
  it("uses the TypeScript config with API proxy enabled", () => {
    expect(existsSync(resolve(appRoot, "vite.config.js"))).toBe(false);
    expect(existsSync(resolve(appRoot, "vite.config.d.ts"))).toBe(false);
    const configSource = readFileSync(resolve(appRoot, "vite.config.ts"), "utf8");
    expect(configSource).toContain('"/api": "http://localhost:8080"');
    expect(configSource).toContain('"/uploads": "http://localhost:8080"');
  });
});
