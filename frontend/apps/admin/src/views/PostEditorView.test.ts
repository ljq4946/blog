import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostForm } from "../features/posts/postForm";
import postEditorSource from "./PostEditorView.vue?raw";
import PostEditorView from "./PostEditorView.vue";
import PostPublishPanel from "./PostPublishPanel.vue";

const pushMock = vi.hoisted(() => vi.fn());
const replaceMock = vi.hoisted(() => vi.fn());
const onBeforeRouteLeaveMock = vi.hoisted(() => vi.fn());
const routeMock = vi.hoisted(() => ({ params: {} as Record<string, string> }));
const createPostMock = vi.hoisted(() => vi.fn());
const updatePostMock = vi.hoisted(() => vi.fn());
const postsMock = vi.hoisted(() => vi.fn());
const categoriesMock = vi.hoisted(() => vi.fn());
const tagsMock = vi.hoisted(() => vi.fn());
const mediaMock = vi.hoisted(() => vi.fn());
const now = Date.parse("2026-05-19T12:00:00Z");
const editorState = vi.hoisted(() => ({
  selection: {
    empty: true,
    from: 0,
    to: 0
  },
  doc: {
    textBetween: vi.fn(() => "")
  }
}));
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
    extendMarkRange: vi.fn(),
    insertContent: vi.fn(),
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
    onBeforeRouteLeave: onBeforeRouteLeaveMock,
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
    getAttributes: () => ({}),
    state: editorState,
    isActive: () => false,
    destroy: vi.fn()
  };
  return {
    EditorContent: { template: '<div class="editor-surface"><div class="tiptap ProseMirror" role="textbox" /></div>' },
    useEditor: () => shallowRef(editor)
  };
});

const mountedWrappers: Array<{ unmount: () => void }> = [];

function mountEditor() {
  const wrapper = mount(PostEditorView, {
    attachTo: document.body,
    global: {
      plugins: [ElementPlus]
    }
  });
  mountedWrappers.push(wrapper);
  return wrapper;
}

async function setPublishSlug(wrapper: ReturnType<typeof mountEditor>, slug: string) {
  const publishPanel = wrapper.findComponent(PostPublishPanel);
  const slugInput = publishPanel.find('input[aria-label="URL 标识"]');
  await slugInput.setValue(slug);
  await flushPromises();
}

async function updatePublishForm(wrapper: ReturnType<typeof mountEditor>, patch: Partial<PostForm>) {
  const publishPanel = wrapper.findComponent(PostPublishPanel);
  publishPanel.vm.$emit("update:form", {
    ...(publishPanel.props("form") as PostForm),
    ...patch
  });
  await flushPromises();
}

describe("PostEditorView", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    window.localStorage.clear();
    routeMock.params = {};
    pushMock.mockReset();
    replaceMock.mockReset();
    onBeforeRouteLeaveMock.mockReset();
    createPostMock.mockReset();
    updatePostMock.mockReset();
    editorState.selection.empty = true;
    editorState.selection.from = 0;
    editorState.selection.to = 0;
    editorState.doc.textBetween.mockReturnValue("");
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

  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => {
      try {
        wrapper.unmount();
      } catch {
        // Some tests intentionally unmount before assertions.
      }
    });
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  function setRecoverySnapshot(updatedAt = now - 1000, key = "post-editor:new") {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        updatedAt,
        form: {
          title: "Recovered title",
          slug: "recovered-title",
          summary: "Recovered summary",
          contentHtml: "<p>Recovered content</p>",
          coverMediaId: null,
          status: "DRAFT",
          categoryId: null,
          tagIds: [],
          publishedAt: null
        }
      })
    );
  }

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
    expect(wrapper.find('button[aria-label="加粗"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="斜体"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="二级标题"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="撤销"]').exists()).toBe(true);
  });

  it("renders the writing workbench with the publish panel", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    expect(wrapper.find(".writing-workbench").exists()).toBe(true);
    expect(wrapper.find(".writing-main").exists()).toBe(true);
    expect(wrapper.find(".publish-panel").exists()).toBe(true);
    expect(wrapper.text()).toContain("\u53d1\u5e03\u68c0\u67e5");
    expect(wrapper.text()).toContain("\u53d1\u5e03\u8bbe\u7f6e");
  });

  it("stretches the editable textbox to the editor surface", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    const textbox = wrapper.find(".editor-surface .ProseMirror");

    expect(textbox.exists()).toBe(true);
    expect(postEditorSource).toMatch(/\.editor-surface\s*{[^}]*display:\s*grid;[^}]*padding:\s*0;/s);
    expect(postEditorSource).toMatch(
      /\.editor-surface\s+:deep\(\.ProseMirror\)\s*{[^}]*min-height:\s*100%;[^}]*padding:\s*14px;/s
    );
  });

  it("restores a newer local recovery draft", async () => {
    setRecoverySnapshot();
    const wrapper = mountEditor();
    await flushPromises();

    expect(wrapper.text()).toContain("恢复草稿");

    await wrapper.find('[data-test="restore-recovery"]').trigger("click");
    await flushPromises();

    expect((wrapper.find('input[aria-label="标题"]').element as HTMLInputElement).value).toBe("Recovered title");
  });

  it("ignores and clears a recovery draft older than the loaded server post", async () => {
    routeMock.params = { id: "5" };
    postsMock.mockResolvedValue([
      {
        id: 5,
        title: "Server title",
        slug: "server-title",
        summary: "Server summary",
        contentHtml: "<p>Server content</p>",
        coverMediaId: null,
        status: "DRAFT",
        category: null,
        tags: [],
        updatedAt: new Date(now).toISOString(),
        publishedAt: null
      }
    ]);
    setRecoverySnapshot(now - 1000, "post-editor:5");
    const wrapper = mountEditor();
    await flushPromises();

    expect(wrapper.find('[data-test="restore-recovery"]').exists()).toBe(false);
    expect(window.localStorage.getItem("post-editor:5")).toBeNull();
  });

  it("does not reset editor content when publish metadata changes without content changes", async () => {
    const wrapper = mountEditor();
    await flushPromises();
    editorChain.setContent.mockClear();

    await setPublishSlug(wrapper, "metadata-only");

    expect(editorChain.setContent).not.toHaveBeenCalled();
  });

  it("discards a local recovery draft", async () => {
    setRecoverySnapshot();
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('[data-test="discard-recovery"]').trigger("click");
    await flushPromises();

    expect(window.localStorage.getItem("post-editor:new")).toBeNull();
    expect(wrapper.find('[data-test="restore-recovery"]').exists()).toBe(false);
  });

  it("toggles between edit and preview modes", async () => {
    routeMock.params = { id: "5" };
    postsMock.mockResolvedValue([
      {
        id: 5,
        title: "Preview title",
        slug: "preview-title",
        summary: "Preview summary",
        contentHtml: "<p>Preview body</p>",
        coverMediaId: 7,
        status: "DRAFT",
        category: { id: 1, name: "Category", slug: "category" },
        tags: [{ id: 2, name: "Tag", slug: "tag" }],
        publishedAt: null
      }
    ]);
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('[data-test="preview-mode"]').trigger("click");
    await flushPromises();

    expect(wrapper.find(".editor-preview").exists()).toBe(true);
    expect(wrapper.find(".editor-preview.article-page").exists()).toBe(true);
    expect(wrapper.find(".article-hero").exists()).toBe(true);
    expect(wrapper.find(".prose.article-renderer").exists()).toBe(true);
    expect(wrapper.find(".article-toc").exists()).toBe(true);
    expect(wrapper.text()).toContain("Preview title");
    expect(wrapper.text()).toContain("Preview summary");
    expect(wrapper.text()).toContain("Category");
    expect(wrapper.text()).toContain("#Tag");
    expect(wrapper.text()).toContain("Preview body");
    expect(wrapper.find(".article-hero-cover").attributes("src")).toBe("/uploads/cover.png");
    expect(wrapper.find(".toolbar").exists()).toBe(false);

    await wrapper.find('[data-test="edit-mode"]').trigger("click");
    await flushPromises();

    expect(wrapper.find(".editor-preview").exists()).toBe(false);
    expect(wrapper.find(".toolbar").exists()).toBe(true);
  });

  it("inserts a visible link when no text is selected", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('button[aria-label="插入链接"]').trigger("click");
    await flushPromises();
    await wrapper.find('[data-test="link-text"]').setValue("Example");
    await wrapper.find('[data-test="link-href"]').setValue("https://example.com");
    await wrapper.find('[data-test="confirm-link"]').trigger("click");

    expect(editorChain.insertContent).toHaveBeenCalledWith('<a href="https://example.com">Example</a>');
  });

  it("applies a link to selected text without replacing the selection", async () => {
    editorState.selection.empty = false;
    editorState.selection.from = 1;
    editorState.selection.to = 8;
    editorState.doc.textBetween.mockReturnValue("Selected");
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('button[aria-label="插入链接"]').trigger("click");
    await flushPromises();
    await wrapper.find('[data-test="link-href"]').setValue("https://example.com");
    await wrapper.find('[data-test="confirm-link"]').trigger("click");

    expect(editorChain.extendMarkRange).toHaveBeenCalledWith("link");
    expect(editorChain.setLink).toHaveBeenCalledWith({ href: "https://example.com" });
  });

  it("inserts an inline image from the media library", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('button[aria-label="插入图片"]').trigger("click");
    await flushPromises();
    await wrapper.find('[data-test="image-asset-7"]').trigger("click");
    await wrapper.find('[data-test="confirm-image"]').trigger("click");

    expect(editorChain.setImage).toHaveBeenCalledWith({ src: "/uploads/cover.png", alt: "cover.png" });
  });

  it("stays on the editor and shows save feedback after creating a draft", async () => {
    createPostMock.mockResolvedValue({ id: 12 });
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Hello");
    await setPublishSlug(wrapper, "hello");
    await wrapper.find('[data-test="save-draft"]').trigger("click");
    await flushPromises();

    expect(createPostMock).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/posts/12");
    expect(wrapper.text()).toContain("已保存");
  });

  it("does not autosave a valid new draft after edits settle", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Manual save title");
    const slugInput = wrapper.find('input[aria-label="URL 标识"]');
    await slugInput.setValue("manual-save-title");
    await flushPromises();

    await vi.advanceTimersByTimeAsync(1300);
    await flushPromises();

    expect(createPostMock).not.toHaveBeenCalled();
    expect(updatePostMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("未保存");
    expect(window.localStorage.getItem("post-editor:new")).toContain('"title":"Manual save title"');
  });

  it("does not autosave existing post edits after they settle", async () => {
    routeMock.params = { id: "5" };
    postsMock.mockResolvedValue([
      {
        id: 5,
        title: "Published title",
        slug: "published-title",
        summary: "Published summary",
        contentHtml: "<p>Published body</p>",
        coverMediaId: null,
        status: "PUBLISHED",
        category: null,
        tags: [],
        publishedAt: "2026-05-18T00:00:00Z"
      }
    ]);
    const wrapper = mountEditor();
    await flushPromises();
    updatePostMock.mockClear();

    await wrapper.find('input[aria-label="标题"]').setValue("Published title updated");
    await vi.advanceTimersByTimeAsync(1300);
    await flushPromises();

    expect(updatePostMock).not.toHaveBeenCalled();
    expect(createPostMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("未保存");
    expect(window.localStorage.getItem("post-editor:5")).toContain('"title":"Published title updated"');
  });

  it("keeps invalid new draft edits local without autosaving", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Manual save title");
    await flushPromises();

    await vi.advanceTimersByTimeAsync(1300);
    await flushPromises();

    expect(createPostMock).not.toHaveBeenCalled();
    expect(updatePostMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("post-editor:new")).toContain('"title":"Manual save title"');
  });

  it("asks once when returning from a dirty draft", async () => {
    const confirmMock = vi.fn(() => true);
    vi.stubGlobal("confirm", confirmMock);
    pushMock.mockImplementation(async () => {
      const leaveGuard = onBeforeRouteLeaveMock.mock.calls[0]?.[0] as (() => boolean) | undefined;
      leaveGuard?.();
    });
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Manual save title");
    await wrapper.find(".editor-actions .el-button").trigger("click");
    await flushPromises();

    expect(pushMock).toHaveBeenCalledWith("/posts");
    expect(confirmMock).toHaveBeenCalledTimes(1);
  });

  it("keeps content in place and shows an error when saving fails", async () => {
    createPostMock.mockRejectedValue(new Error("Slug already exists"));
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Hello");
    await setPublishSlug(wrapper, "hello");
    await wrapper.find('[data-test="save-draft"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Slug already exists");
    expect(pushMock).not.toHaveBeenCalledWith("/posts");
  });

  it("blocks publishing when required publish checks fail", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('input[aria-label="标题"]').setValue("Hello");
    await setPublishSlug(wrapper, "hello");
    await wrapper.find('[data-test="publish-post"]').trigger("click");
    await flushPromises();

    expect(createPostMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("请先完成必填发布检查");
  });

  it("clears obsolete validation errors when publishing fails required checks", async () => {
    const wrapper = mountEditor();
    await flushPromises();

    await wrapper.find('[data-test="save-draft"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("请填写标题");
    expect(wrapper.text()).toContain("请填写 URL 标识");

    await wrapper.find('input[aria-label="标题"]').setValue("Hello");
    await setPublishSlug(wrapper, "hello");
    await wrapper.find('[data-test="publish-post"]').trigger("click");
    await flushPromises();

    expect(wrapper.text()).not.toContain("请填写标题");
    expect(wrapper.text()).not.toContain("请填写 URL 标识");
    expect(wrapper.text()).toContain("请先完成必填发布检查");
    expect(createPostMock).not.toHaveBeenCalled();
  });
});
