export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface ReadingProgressInput {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
}

export type ReadingTheme = "light" | "dark";

export const READING_THEME_KEY = "blog-reading-theme";

function normalizeHeadingText(text: string | null | undefined) {
  const normalized = (text ?? "").replace(/\s+/g, " ").trim();
  return normalized || "Section";
}

function slugifyHeading(text: string) {
  const slug = text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "section";
}

function uniqueSlug(base: string, counts: Map<string, number>) {
  const previous = counts.get(base) ?? 0;
  const next = previous + 1;
  counts.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

export function applyHeadingIds(root: ParentNode): TocItem[] {
  const counts = new Map<string, number>();
  return Array.from(root.querySelectorAll("h2, h3")).map((heading) => {
    const text = normalizeHeadingText(heading.textContent);
    const id = uniqueSlug(slugifyHeading(text), counts);
    const level = heading.tagName.toLowerCase() === "h3" ? 3 : 2;

    if (heading instanceof HTMLElement) {
      heading.id = id;
      heading.tabIndex = -1;
    }

    return { id, text, level };
  });
}

export function calculateReadingProgress(input: ReadingProgressInput) {
  const scrollable = input.documentHeight - input.viewportHeight;
  if (scrollable <= 0) {
    return 100;
  }

  const rawProgress = (input.scrollY / scrollable) * 100;
  return Math.round(Math.min(100, Math.max(0, rawProgress)));
}

export function readStoredTheme(): ReadingTheme {
  try {
    return localStorage.getItem(READING_THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function writeStoredTheme(theme: ReadingTheme) {
  try {
    localStorage.setItem(READING_THEME_KEY, theme);
  } catch {
    // Theme still applies for the current page even when persistence is blocked.
  }
}
