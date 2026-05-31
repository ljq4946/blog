import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MediaView from "./MediaView.vue";

const mediaMock = vi.hoisted(() => vi.fn());
const mediaReferencesMock = vi.hoisted(() => vi.fn());
const deleteMediaMock = vi.hoisted(() => vi.fn());
const uploadMediaMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  adminApi: {
    media: mediaMock,
    mediaReferences: mediaReferencesMock,
    deleteMedia: deleteMediaMock,
    uploadMedia: uploadMediaMock
  }
}));

const assets = [
  {
    id: 1,
    originalName: "cover.png",
    storedName: "cover.png",
    url: "/uploads/cover.png",
    mimeType: "image/png",
    size: 1024,
    width: 100,
    height: 100,
    createdAt: "2026-05-20T00:00:00Z"
  },
  {
    id: 2,
    originalName: "theme.mp3",
    storedName: "theme.mp3",
    url: "/uploads/theme.mp3",
    mimeType: "audio/mpeg",
    size: 2048,
    createdAt: "2026-05-20T00:00:00Z"
  }
];

describe("MediaView", () => {
  beforeEach(() => {
    mediaMock.mockReset();
    mediaReferencesMock.mockReset();
    deleteMediaMock.mockReset();
    uploadMediaMock.mockReset();
    mediaMock.mockResolvedValue({ content: assets, number: 0, size: 24, totalElements: 2, totalPages: 1 });
    mediaReferencesMock.mockResolvedValue({ count: 1, posts: [{ id: 10, title: "Cover Post", slug: "cover-post", referenceType: "cover" }] });
    vi.stubGlobal("confirm", vi.fn(() => false));
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  });

  it("previews media and filters by type", async () => {
    const wrapper = mount(MediaView, { global: { plugins: [ElementPlus] } });
    await flushPromises();

    expect(wrapper.find('img[alt="cover.png"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("theme.mp3");

    await wrapper.find('[data-test="media-type-filter"]').setValue("image");
    expect(wrapper.text()).toContain("cover.png");
    expect(wrapper.text()).not.toContain("theme.mp3");
  });

  it("checks references before deleting media", async () => {
    const wrapper = mount(MediaView, { global: { plugins: [ElementPlus] } });
    await flushPromises();

    await wrapper.find('[data-test="delete-media-1"]').trigger("click");
    await flushPromises();

    expect(mediaReferencesMock).toHaveBeenCalledWith(1);
    expect(wrapper.text()).toContain("Cover Post");
    expect(deleteMediaMock).not.toHaveBeenCalled();
  });

  it("copies media URLs", async () => {
    const wrapper = mount(MediaView, { global: { plugins: [ElementPlus] } });
    await flushPromises();

    await wrapper.find('[data-test="copy-media-1"]').trigger("click");

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("/uploads/cover.png");
  });
});
