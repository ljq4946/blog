import { flushPromises, mount } from "@vue/test-utils";
import type { ArchiveMonth } from "@blog/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ArchiveView from "./ArchiveView.vue";

const archiveMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  publicApi: {
    archive: archiveMock
  }
}));

describe("ArchiveView", () => {
  beforeEach(() => {
    archiveMock.mockReset();
  });

  it("groups each month post links in a single vertical list", async () => {
    archiveMock.mockResolvedValue([
      {
        month: "2026-05",
        posts: [
          { id: 1, title: "First", slug: "first", status: "PUBLISHED" },
          { id: 2, title: "Second", slug: "second", status: "PUBLISHED" },
          { id: 3, title: "Third", slug: "third", status: "PUBLISHED" }
        ]
      }
    ] satisfies ArchiveMonth[]);

    const wrapper = mount(ArchiveView, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>"
          }
        }
      }
    });
    await flushPromises();

    const month = wrapper.get(".archive-month");
    const postList = month.get(".archive-post-list");

    expect(postList.findAll(".archive-post-title").map((link) => link.text())).toEqual(["First", "Second", "Third"]);
    expect(Array.from(month.element.children).filter((child) => child.tagName === "A")).toHaveLength(0);
  });

  it("shows each post cover before the title and taxonomy metadata below it", async () => {
    archiveMock.mockResolvedValue([
      {
        month: "2026-05",
        posts: [
          {
            id: 1,
            title: "Covered Post",
            slug: "covered-post",
            status: "PUBLISHED",
            coverMediaId: 7,
            coverMediaUrl: "/uploads/cover.png",
            category: { id: 1, name: "Essays", slug: "essays" },
            tags: [{ id: 2, name: "Craft", slug: "craft" }]
          }
        ]
      }
    ] satisfies ArchiveMonth[]);

    const wrapper = mount(ArchiveView, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a :href='to'><slot /></a>"
          }
        }
      }
    });
    await flushPromises();

    const item = wrapper.get(".archive-post-item");
    const cover = item.get(".archive-post-cover");
    const title = item.get(".archive-post-title");
    const meta = item.get(".archive-post-meta");

    expect(cover.attributes("src")).toBe("/uploads/cover.png");
    expect(cover.attributes("alt")).toBe("Covered Post");
    expect(Array.from(item.element.children).at(0)).toBe(cover.element);
    expect(title.text()).toBe("Covered Post");
    expect(meta.text()).toContain("Essays");
    expect(meta.text()).toContain("#Craft");
    expect(meta.get("a[href='/categories/essays']").text()).toBe("Essays");
    expect(meta.get("a[href='/tags/craft']").text()).toBe("#Craft");
  });
});
