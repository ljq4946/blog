const SITE_NAME = "4946 Blog";
const DEFAULT_DESCRIPTION = "Personal notebook";
const DEFAULT_BASE_URL = "http://localhost:5174";

export interface SiteMetadataInput {
  title?: string;
  description?: string | null;
  path?: string;
  image?: string | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  structuredData?: Record<string, unknown> | null;
}

export function applySiteMetadata(input: SiteMetadataInput = {}) {
  const description = input.description?.trim() || DEFAULT_DESCRIPTION;
  const title = input.title?.trim() ? `${input.title.trim()} | ${SITE_NAME}` : SITE_NAME;
  const url = absoluteUrl(input.path || "/");
  const image = input.image ? absoluteUrl(input.image) : "";
  const type = input.path?.startsWith("/posts/") ? "article" : "website";

  document.title = title;
  setMeta("name", "description", description);
  setLink("canonical", url);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:type", type);
  setOptionalMeta("property", "og:image", image || null);
  setOptionalMeta("property", "article:published_time", type === "article" ? input.publishedTime : null);
  setOptionalMeta("property", "article:modified_time", type === "article" ? input.modifiedTime : null);
  setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setOptionalMeta("name", "twitter:image", image || null);
  setStructuredData(input.structuredData ?? null);
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const baseUrl = (import.meta.env.VITE_SITE_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector(`meta[${attribute}='${key}']`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    element.setAttribute("data-managed", "site");
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setOptionalMeta(attribute: "name" | "property", key: string, content?: string | null) {
  if (!content) {
    document.head.querySelector(`meta[${attribute}='${key}']`)?.remove();
    return;
  }
  setMeta(attribute, key, content);
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel='${rel}']`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    element.setAttribute("data-managed", "site");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function setStructuredData(data: Record<string, unknown> | null) {
  const selector = "script[type='application/ld+json'][data-managed='site']";
  let element = document.head.querySelector<HTMLScriptElement>(selector);
  if (!data) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.setAttribute("data-managed", "site");
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}
