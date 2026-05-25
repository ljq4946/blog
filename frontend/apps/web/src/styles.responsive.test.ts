import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync("src/styles.css", "utf8");

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escaped}\\s*\\{(?<body>[^}]+)\\}`));
  return match?.groups?.body ?? "";
}

function mediaBody(query: string) {
  const start = styles.indexOf(`@media ${query}`);
  if (start < 0) {
    return "";
  }
  const next = styles.indexOf("\n@media ", start + 1);
  return styles.slice(start, next === -1 ? undefined : next);
}

describe("responsive CSS", () => {
  it("uses shared responsive page spacing and clips accidental horizontal overflow", () => {
    const shellRule = ruleBody(".site-shell");
    const contentRule = ruleBody(".content-band,\n.article-wrap");

    expect(shellRule).toContain("--page-pad:");
    expect(shellRule).toContain("overflow-x: clip");
    expect(contentRule).toContain("calc(100% - var(--page-pad) - var(--page-pad))");
  });

  it("keeps the home poster bounded and anchors index text inside the stage", () => {
    const posterRule = ruleBody(".home-poster");
    const indexRule = ruleBody(".poster-index");
    const strikeRule = ruleBody(".poster-strike");
    const smallWedgeRule = ruleBody(".poster-wedge-small");

    expect(posterRule).toContain("--poster-next-peek:");
    expect(posterRule).toContain("--poster-block:");
    expect(posterRule).toContain("height: var(--poster-block)");
    expect(indexRule).toContain("right:");
    expect(indexRule).not.toContain("left: 88%");
    expect(strikeRule).toContain("width: 45%");
    expect(smallWedgeRule).toContain("translateX(calc(var(--poster-scroll, 0) * -1.2cqw))");
  });

  it("adds a tablet breakpoint for dense home, archive, and article layouts", () => {
    const tabletRule = mediaBody("(max-width: 900px)");

    expect(tabletRule).toContain(".home-interlude");
    expect(tabletRule).toContain("grid-template-columns: 1fr");
    expect(tabletRule).toContain(".archive-filters");
    expect(tabletRule).toContain("repeat(2, minmax(0, 1fr))");
    expect(tabletRule).toContain(".article-layout");
    expect(tabletRule).toContain(".article-sidebar");
    expect(tabletRule).toContain("position: static");
  });

  it("stacks tight mobile list items and control groups below phone widths", () => {
    const phoneRule = mediaBody("(max-width: 540px)");

    expect(phoneRule).toContain(".archive-discovery-item");
    expect(phoneRule).toContain("grid-template-columns: 1fr");
    expect(phoneRule).toContain(".section-head");
    expect(phoneRule).toContain("flex-direction: column");
    expect(phoneRule).toContain(".pagination-controls");
    expect(phoneRule).toContain("align-items: stretch");
  });

  it("keeps article media, code, tables, and forms within the viewport", () => {
    const mediaRule = ruleBody(".prose img,\n.prose video,\n.prose iframe");
    const tableRule = ruleBody(".prose table");
    const preRule = ruleBody(".prose pre");
    const formRule = ruleBody(".comment-form input,\n.comment-form textarea");

    expect(mediaRule).toContain("height: auto");
    expect(mediaRule).toContain("max-width: 100%");
    expect(tableRule).toContain("overflow-x: auto");
    expect(preRule).toContain("overflow-x: auto");
    expect(formRule).toContain("max-width: 100%");
  });
});
