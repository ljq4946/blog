import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync("src/styles.css", "utf8");

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escaped}\\s*\\{(?<body>[^}]+)\\}`));
  return match?.groups?.body ?? "";
}

describe("home page CSS", () => {
  it("keeps decorative interlude layers from blocking controls", () => {
    expect(ruleBody(".home-music-module::before")).toContain("pointer-events: none");
    expect(ruleBody(".home-about-module::before")).toContain("pointer-events: none");
  });
});
