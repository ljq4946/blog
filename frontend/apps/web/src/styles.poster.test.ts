import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync("src/styles.css", "utf8");

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escaped}\\s*\\{(?<body>[^}]+)\\}`));
  return match?.groups?.body ?? "";
}

function ruleBodies(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Array.from(styles.matchAll(new RegExp(`${escaped}\\s*\\{(?<body>[^}]+)\\}`, "g")))
    .map((match) => match.groups?.body ?? "");
}

describe("poster CSS composition", () => {
  it("sizes the poster to fill the viewport below the masthead", () => {
    const posterRule = ruleBody(".home-poster");
    const stageRules = ruleBodies(".poster-stage");

    expect(posterRule).toContain("--masthead-block: 76px");
    expect(posterRule).toContain("height: calc(100svh - var(--masthead-block))");
    expect(posterRule).not.toMatch(/\bmin-height\s*:/);
    expect(stageRules.some((rule) => rule.includes("calc(56.25vw - 27px)"))).toBe(true);
  });

  it("uses one fixed-ratio stage for the visible poster composition", () => {
    const stageRule = ruleBody(".poster-stage");
    const copyRule = ruleBody(".poster-copy");
    const strikeRule = ruleBody(".poster-strike");
    const blueRule = ruleBody(".poster-rule-blue");
    const yellowRule = ruleBody(".poster-rule-yellow");

    expect(stageRule).toContain("aspect-ratio: 16 / 9");
    expect(stageRule).toContain("container-type: inline-size");
    expect(copyRule).toContain("left: 3.8%");
    expect(strikeRule).toContain("left: 50%");
    expect(blueRule).toContain("left: 0");
    expect(yellowRule).toContain("right: 6%");
  });

  it("scales poster elements from the stage instead of independent size clamps", () => {
    const stageRule = ruleBody(".poster-stage");
    const stageScaledRules = [
      stageRule,
      ruleBody(".home-poster h1"),
      ruleBody(".poster-tagline"),
      ruleBody(".poster-kicker"),
      ruleBody(".poster-index"),
      ruleBody(".poster-circle")
    ];

    expect(stageRule).toContain("height: min(100%");
    expect(stageRule).toContain("max-width: 100%");
    expect(stageRule).toContain("width: auto");
    expect(stageRule).not.toMatch(/max-width:\s*\d+px/);
    for (const rule of stageScaledRules) {
      expect(rule).not.toContain("clamp(");
    }
  });

  it("keeps the red wedge at a stable aspect ratio across breakpoints", () => {
    const wedgeRule = ruleBody(".poster-wedge-main");
    const wedgeRules = ruleBodies(".poster-wedge-main");

    expect(wedgeRule).toContain("aspect-ratio: 16 / 5");
    expect(wedgeRules.length).toBeGreaterThan(1);
    for (const rule of wedgeRules) {
      expect(rule).not.toMatch(/\bheight\s*:/);
    }
  });

  it("anchors the red wedge and white circle in a shared stable coordinate system", () => {
    const strikeRule = ruleBody(".poster-strike");
    const wedgeRule = ruleBody(".poster-wedge-main");
    const circleRule = ruleBody(".poster-circle");

    expect(strikeRule).toContain("aspect-ratio: 16 / 5");
    expect(wedgeRule).toContain("left: 0");
    expect(circleRule).toContain("left: 67%");
    expect(wedgeRule).not.toMatch(/\b(left|right):\s*clamp/);
    expect(circleRule).not.toMatch(/\b(right):\s*clamp/);
  });
});
