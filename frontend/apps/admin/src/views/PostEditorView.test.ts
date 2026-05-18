import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostEditorView from "./PostEditorView.vue";

const pushMock = vi.hoisted(() => vi.fn());
const replaceMock = vi.hoisted(() => vi.fn());
const routeMock = vi.hoisted(() => ({ params: {} as Record<string, string> }));
const createPostMock = vi.hoisted(() => vi.fn());
const updatePostMock = vi.hoisted(() => vi.fn());
const postsMock = vi.hoisted(() => vi.fn());
const categoriesMock = vi.hoisted(() => vi.fn());
const tagsMock = vi.hoisted(() => vi.fn());
const mediaMock = vi.hoisted(() => vi.fn());
const editorChain = vi.hoisted(() => {
  const chain = {
    focus: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleHeading: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleBlockquote: vi.fn(),
    toggleCodeBlock: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    setLink: vi.fn(),
    setImage: vi.fn(),
    unsetLink: vi.fn(),
    run: vi.fn(() => true),
    setContent: vi.fn()
  };
  Object.entries(chain).forEach(([name, command]) => {
    if (name !== "run" && name !== "setContent") {
      command.mockReturnValue(chain);
    }
  });
  return chain;
});

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    onBeforeRouteLeave: vi.fn(),
    useRoute: () => routeMock,
    useRouter: () => ({ push: pushMock, replace: replaceMock })
  };
});

vi.mock("../lib/api", () => ({
  adminApi: {
    posts: postsMock,
    createPost: createPostMock,
    updatePost: updatePostMock,
    categories: categoriesMock,
    tags: tagsMock,
    media: mediaMock
  }
}));

vi.mock("@tiptap/vue-3", async () => {
  const { shallowRef } = await import("vue");
  const editor = {
    chain: () => editorChain,
    commands: editorChain,
    getHTML: () => "<p>你好 world</p>",
    getText: () => "你好 world",
    isActive: () => false,
    destroy: vi.fn()
  };
  return {
    EditorContent: { template: '<div class="editor-surface" />' },
    useEditor: () => shallowRef(editor)
  };
});

function mountEditor() {
  return mount(PostEditorView, {
    attachTo: document.body,
    global: {
      plugins: [ElementPlus]
    }
  });
}

describe("PostEditorView", () => {
  beforeEach(() => {
    routeMock.params = {};
    pushMock.mockReset();
    replaceMock.mockReset();
    createPostMock.mockReset();
    updatePostMock.mockReset();
    postsMock.mockResolvedValue([]);
    categoriesMock.mockResolvedValue([{ id: 1, name: "Category", slug: "category", sortOrder: 0 }]);
    tagsMock.mockResolvedValue([{ id: 2, name: "Tag", slug: "tag" }]);
    mediaMock.mockResolvedValue({
      content: [
        {
          id: 7,
          originalName: "cover.png",
          storedName: "cover.png",
          url: "/uploads/cover.png",
          mimeType: "image/png",
          size: 100,
          createdAt: "2026-05-18T00:00:00Z"
        }
      ],
      number: 0,
      size: 24,
      totalElements: 1,
      totalPages: 1
    });
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("prompt", vi.fn(() => "https://example.com/image.png"));
  });

  it("renders the enhanced toolbar and writing metadata", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    expect(wrapper.text()).toContain("未保存");
    expect(wrapper.text()).toContain("封面图");
    expect(wrapper.text()).toContain("链接");
    expect(wrapper.text()).toContain("图片");
    expect(wrapper.text()).toContain("代码");
    expect(wrapper.text()).toContain("撤销");
    expect(wrapper.text()).toContain("重做");
  });

  it("stays on the editor and shows save feedback after creating a draft", async () => {
    createPostMock.mockResolvedValue({ id: 12 });
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Hello");
    await wrapper.find('input[aria-label="URL 标识"]').setValue("hello");
    await wrapper.find('[data-test="save-draft"]').trigger("click");
    await flushPromises();

    expect(createPostMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/posts/12");
    expect(wrapper.text()).toContain("已保存");
  });

  it("keeps content in place and shows an error when saving fails", async () => {
    createPostMock.mockRejectedValue(new Error("Slug already exists"));
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Hello");
    await wrapper.find('input[aria-label="URL 标识"]').setValue("hello");
    await wrapper.find('[data-test="save-draft"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Slug already exists");
    expect(pushMock).not.toHaveBeenCalledWith("/posts");
  });
});
