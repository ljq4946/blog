import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import KnowledgeBaseView from "./KnowledgeBaseView.vue";

const knowledgeSearchMock = vi.hoisted(() => vi.fn());
const createPostMock = vi.hoisted(() => vi.fn());
const convertNoteToArticleMock = vi.hoisted(() => vi.fn());
const pushMock = vi.hoisted(() => vi.fn());

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock("../lib/api", () => ({
  adminApi: {
    knowledgeSearch: knowledgeSearchMock,
    createPost: createPostMock,
    convertNoteToArticle: convertNoteToArticleMock,
    exportKnowledge: vi.fn()
  }
}));

describe("KnowledgeBaseView", () => {
  beforeEach(() => {
    knowledgeSearchMock.mockReset();
    createPostMock.mockReset();
    convertNoteToArticleMock.mockReset();
    pushMock.mockReset();
    knowledgeSearchMock.mockResolvedValue({
      content: [
        {
          id: 1,
          title: "Inbox Note",
          slug: "inbox-note",
          summary: "Private source",
          status: "DRAFT",
          visibility: "PRIVATE",
          contentType: "NOTE",
          tags: [],
          topics: []
        }
      ],
      number: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1
    });
    createPostMock.mockResolvedValue({ id: 2, title: "New Note", slug: "new-note" });
    convertNoteToArticleMock.mockResolvedValue({ id: 9, title: "Inbox Note", slug: "inbox-note-article" });
  });

  it("loads private notes and can create a quick inbox note", async () => {
    const wrapper = mount(KnowledgeBaseView, { global: { plugins: [ElementPlus] } });
    await flushPromises();

    expect(knowledgeSearchMock).toHaveBeenCalledWith({ visibility: "PRIVATE", contentType: "NOTE" });
    expect(wrapper.text()).toContain("Inbox Note");

    await wrapper.find('[data-test="note-title"]').setValue("New Note");
    await wrapper.find('[data-test="note-slug"]').setValue("new-note");
    await wrapper.find('[data-test="note-summary"]').setValue("Captured thought");
    await wrapper.find('[data-test="note-content"]').setValue("Private body");
    await wrapper.find('[data-test="create-note"]').trigger("click");
    await flushPromises();

    expect(createPostMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "New Note",
      slug: "new-note",
      visibility: "PRIVATE",
      contentType: "NOTE",
      status: "DRAFT"
    }));
  });

  it("converts a private note to a public article draft and opens it", async () => {
    const wrapper = mount(KnowledgeBaseView, { global: { plugins: [ElementPlus] } });
    await flushPromises();

    await wrapper.find('[data-test="convert-note-1"]').trigger("click");
    await flushPromises();

    expect(convertNoteToArticleMock).toHaveBeenCalledWith(1);
    expect(pushMock).toHaveBeenCalledWith("/posts/9");
  });
});
