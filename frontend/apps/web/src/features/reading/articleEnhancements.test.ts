import { describe, expect, it, vi } from "vitest";
import {
  READING_THEME_KEY,
  applyHeadingIds,
  calculateReadingProgress,
  readStoredTheme,
  writeStoredTheme
} from "./articleEnhancements";

describe("applyHeadingIds", () => {
  it("extracts h2 and h3 headings and assigns stable duplicate ids", () => {
    const host = document.createElement("article");
    host.innerHTML = `
      <h1>Ignored title</h1>
      <h2>Setup Guide</h2>
      <p>Body</p>
      <h3>Install Vue 3</h3>
      <h2>Setup Guide</h2>
      <h4>Ignored deep heading</h4>
    `;

    const items = applyHeadingIds(host);

    expect(items).toEqual([
      { id: "setup-guide", text: "Setup Guide", level: 2 },
      { id: "install-vue-3", text: "Install Vue 3", level: 3 },
      { id: "setup-guide-2", text: "Setup Guide", level: 2 }
    ]);
    expect(host.querySelectorAll("h2")[0].id).toBe("setup-guide");
    expect(host.querySelector("h3")?.id).toBe("install-vue-3");
    expect(host.querySelectorAll("h2")[1].id).toBe("setup-guide-2");
  });

  it("uses fallback ids for empty headings", () => {
    const host = document.createElement("article");
    host.innerHTML = "<h2><span></span></h2><h3>   </h3>";

    expect(applyHeadingIds(host)).toEqual([
      { id: "section", text: "Section", level: 2 },
      { id: "section-2", text: "Section", level: 3 }
    ]);
  });
});

describe("calculateReadingProgress", () => {
  it("clamps progress between 0 and 100", () => {
    expect(calculateReadingProgress({ scrollY: -20, viewportHeight: 800, documentHeight: 2000 })).toBe(0);
    expect(calculateReadingProgress({ scrollY: 600, viewportHeight: 800, documentHeight: 2000 })).toBe(50);
    expect(calculateReadingProgress({ scrollY: 5000, viewportHeight: 800, documentHeight: 2000 })).toBe(100);
  });

  it("returns full progress when there is no scrollable distance", () => {
    expect(calculateReadingProgress({ scrollY: 0, viewportHeight: 1000, documentHeight: 800 })).toBe(100);
  });
});

describe("reading theme storage", () => {
  it("reads and writes the stored theme", () => {
    localStorage.clear();

    expect(readStoredTheme()).toBe("light");
    writeStoredTheme("dark");

    expect(localStorage.getItem(READING_THEME_KEY)).toBe("dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("falls back to light when localStorage throws", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readStoredTheme()).toBe("light");
    getItem.mockRestore();
  });
});
