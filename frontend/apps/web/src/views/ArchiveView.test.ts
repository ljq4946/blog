import { flushPromises, mount } from "@vue/test-utils";
import type { Category, PageResponse, Post, Tag } from "@blog/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ArchiveView from "./ArchiveView.vue";

const routeMock = vi.hoisted(() => ({ query: {} as Record<string, string> }));
const replaceMock = vi.hoisted(() => vi.fn());
const searchPostsMock = vi.hoisted(() => vi.fn());
const categoriesMock = vi.hoisted(() => vi.fn());
const tagsMock = vi.hoisted(() => vi.fn());

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => routeMock,
    useRouter: () => ({ replace: replaceMock })
  };
});

vi.mock("../lib/api", () => ({
  publicApi: {
    searchPosts: searchPostsMock,
    categories: categoriesMock,
    tags: tagsMock
  }
}));

const posts: Post[] = [
  {
    id: 1,
    title: "Reader Upgrade",
    slug: "reader-upgrade",
    summary: "Better discovery.",
    status: "PUBLISHED",
    publishedAt: "2026-05-20T00:00:00Z",
    category: { id: 1, name: "Engineering", slug: "engineering" },
    tags: [{ id: 2, name: "Vue", slug: "vue" }]
  }
];

const page: PageResponse<Post> = {
  content: posts,
  number: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1
};

const categories: Category[] = [{ id: 1, name: "Engineering", slug: "engineering", sortOrder: 0 }];
const tags: Tag[] = [{ id: 2, name: "Vue", slug: "vue" }];

function mountArchive() {
  return mount(ArchiveView, {
    global: {
      stubs: {
        RouterLink: { props: ["to"], template: "<a :href='to'><slot /></a>" }
      }
    }
  });
}

describe("ArchiveView", () => {
  beforeEach(() => {
    routeMock.query = {};
    replaceMock.mockReset();
    searchPostsMock.mockReset();
    categoriesMock.mockReset();
    tagsMock.mockReset();
    searchPostsMock.mockResolvedValue(page);
    categoriesMock.mockResolvedValue(categories);
    tagsMock.mockResolvedValue(tags);
  });

  it("loads default search results and taxonomy options", async () => {
    const wrapper = mountArchive();
    await flushPromises();

    expect(searchPostsMock).toHaveBeenCalledWith({ page: 0, size: 10, sort: "publishedAt,desc" });
    expect(categoriesMock).toHaveBeenCalled();
    expect(tagsMock).toHaveBeenCalled();
    expect(wrapper.text()).toContain("All Articles");
    expect(wrapper.text()).toContain("1 result");
    expect(wrapper.text()).toContain("Reader Upgrade");
  });

  it("restores filters from URL query", async () => {
    routeMock.query = {
      keyword: "vue",
      year: "2026",
      category: "engineering",
      tag: "vue",
      sort: "title,asc",
      page: "2"
    };

    mountArchive();
    await flushPromises();

    expect(searchPostsMock).toHaveBeenCalledWith({
      keyword: "vue",
      year: "2026",
      category: "engineering",
      tag: "vue",
      page: 2,
      size: 10,
      sort: "title,asc"
    });
  });

  it("updates the URL query when searching and resets page to zero", async () => {
    const wrapper = mountArchive();
    await flushPromises();

    await wrapper.get("#archive-keyword").setValue("spring");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(replaceMock).toHaveBeenCalledWith({
      query: { keyword: "spring", page: "0", size: "10", sort: "publishedAt,desc" }
    });
    expect(searchPostsMock).toHaveBeenLastCalledWith({
      keyword: "spring",
      page: 0,
      size: 10,
      sort: "publishedAt,desc"
    });
  });

  it("clears filters when reset is clicked", async () => {
    routeMock.query = { keyword: "vue", page: "1" };
    const wrapper = mountArchive();
    await flushPromises();

    await wrapper.get('[data-test="archive-reset"]').trigger("click");
    await flushPromises();

    expect(replaceMock).toHaveBeenCalledWith({ query: {} });
    expect(searchPostsMock).toHaveBeenLastCalledWith({ page: 0, size: 10, sort: "publishedAt,desc" });
  });

  it("keeps article search usable when taxonomy loading fails", async () => {
    categoriesMock.mockRejectedValue(new Error("categories failed"));
    tagsMock.mockRejectedValue(new Error("tags failed"));

    const wrapper = mountArchive();
    await flushPromises();

    expect(wrapper.text()).toContain("Reader Upgrade");
    expect(wrapper.find("#archive-category").exists()).toBe(false);
    expect(wrapper.find("#archive-tag").exists()).toBe(false);
  });
});
