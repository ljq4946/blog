import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeProfileView from "./HomeProfileView.vue";

const homeProfileMock = vi.hoisted(() => vi.fn());
const saveHomeProfileMock = vi.hoisted(() => vi.fn());
const mediaMock = vi.hoisted(() => vi.fn());
const uploadMediaMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  adminApi: {
    homeProfile: homeProfileMock,
    media: mediaMock,
    saveHomeProfile: saveHomeProfileMock,
    uploadMedia: uploadMediaMock
  }
}));

describe("HomeProfileView", () => {
  beforeEach(() => {
    homeProfileMock.mockReset();
    mediaMock.mockReset();
    saveHomeProfileMock.mockReset();
    uploadMediaMock.mockReset();
    homeProfileMock.mockResolvedValue({
      key: "home",
      musicTitle: "午后电台",
      musicSubtitle: "调试时听",
      musicMeta: "ambient / focus",
      musicAudioUrl: "/uploads/focus.mp3",
      aboutKicker: "About / Now",
      aboutTitle: "编辑后的 4946",
      aboutBody: "新的首页介绍",
      focusItems: [
        { label: "正在写", text: "首页配置" },
        { label: "正在听", text: "环境音乐" },
        { label: "正在改", text: "管理端" }
      ],
      updatedAt: "2026-05-24T00:00:00Z"
    });
    mediaMock.mockResolvedValue({
      content: [
        {
          id: 1,
          originalName: "focus.mp3",
          storedName: "focus.mp3",
          url: "/uploads/focus.mp3",
          mimeType: "audio/mpeg",
          size: 4096,
          createdAt: "2026-05-24T00:00:00Z"
        },
        {
          id: 2,
          originalName: "cover.png",
          storedName: "cover.png",
          url: "/uploads/cover.png",
          mimeType: "image/png",
          size: 1024,
          createdAt: "2026-05-24T00:00:00Z"
        }
      ],
      number: 0,
      size: 24,
      totalElements: 2,
      totalPages: 1
    });
    saveHomeProfileMock.mockResolvedValue({});
    uploadMediaMock.mockResolvedValue({
      id: 3,
      originalName: "night.mp3",
      storedName: "night.mp3",
      url: "/uploads/night.mp3",
      mimeType: "audio/mpeg",
      size: 8192,
      createdAt: "2026-05-24T00:00:00Z"
    });
  });

  it("loads editable home profile fields and saves changes", async () => {
    const wrapper = mount(HomeProfileView, {
      global: {
        plugins: [ElementPlus]
      }
    });
    await flushPromises();

    expect(homeProfileMock).toHaveBeenCalledTimes(1);
    expect((wrapper.get('[data-test="music-title"]').element as HTMLInputElement).value).toBe("午后电台");
    expect((wrapper.get('[data-test="about-title"]').element as HTMLInputElement).value).toBe("编辑后的 4946");
    expect((wrapper.get('[data-test="focus-0-text"]').element as HTMLInputElement).value).toBe("首页配置");

    await wrapper.get('[data-test="music-title"]').setValue("深夜电台");
    await wrapper.get('[data-test="music-audio-url"]').setValue("/uploads/night.mp3");
    await wrapper.get('[data-test="about-body"]').setValue("更新后的首页介绍");
    await wrapper.get('[data-test="focus-1-text"]').setValue("新的主题");
    await wrapper.get('[data-test="save-home-profile"]').trigger("click");
    await flushPromises();

    expect(saveHomeProfileMock).toHaveBeenCalledWith({
      musicTitle: "深夜电台",
      musicSubtitle: "调试时听",
      musicMeta: "ambient / focus",
      musicAudioUrl: "/uploads/night.mp3",
      aboutKicker: "About / Now",
      aboutTitle: "编辑后的 4946",
      aboutBody: "更新后的首页介绍",
      focusItems: [
        { label: "正在写", text: "首页配置" },
        { label: "正在听", text: "新的主题" },
        { label: "正在改", text: "管理端" }
      ]
    });
    expect(wrapper.text()).toContain("已保存");
  });
  it("uploads an audio file, previews it, and saves the returned URL", async () => {
    const wrapper = mount(HomeProfileView, {
      global: {
        plugins: [ElementPlus]
      }
    });
    await flushPromises();

    expect(mediaMock).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[data-test="music-audio-preview"]').attributes("src")).toBe("/uploads/focus.mp3");
    expect(wrapper.text()).toContain("focus.mp3");

    const file = new File(["audio"], "night.mp3", { type: "audio/mpeg" });
    const fileInput = wrapper.get('[data-test="music-audio-file"]');
    Object.defineProperty(fileInput.element, "files", {
      configurable: true,
      value: [file]
    });
    await fileInput.trigger("change");
    await flushPromises();

    expect(uploadMediaMock).toHaveBeenCalledWith(file);
    expect(mediaMock).toHaveBeenCalledTimes(2);
    expect((wrapper.get('[data-test="music-audio-url"]').element as HTMLInputElement).value).toBe("/uploads/night.mp3");
    expect(wrapper.get('[data-test="music-audio-preview"]').attributes("src")).toBe("/uploads/night.mp3");

    await wrapper.get('[data-test="save-home-profile"]').trigger("click");
    await flushPromises();

    expect(saveHomeProfileMock).toHaveBeenCalledWith(expect.objectContaining({ musicAudioUrl: "/uploads/night.mp3" }));
  });

  it("treats browser-playable mp4 media as selectable audio", async () => {
    homeProfileMock.mockResolvedValueOnce({
      key: "home",
      musicTitle: "Music",
      musicSubtitle: "Sub",
      musicMeta: "ambient",
      musicAudioUrl: "/uploads/ambient.mp4",
      aboutKicker: "About",
      aboutTitle: "About",
      aboutBody: "Body",
      focusItems: [
        { label: "A", text: "B" },
        { label: "C", text: "D" },
        { label: "E", text: "F" }
      ],
      updatedAt: "2026-05-24T00:00:00Z"
    });
    mediaMock.mockResolvedValueOnce({
      content: [
        {
          id: 9,
          originalName: "ambient.mp4",
          storedName: "ambient.mp4",
          url: "/uploads/ambient.mp4",
          mimeType: "video/mp4",
          size: 2048,
          createdAt: "2026-05-24T00:00:00Z"
        }
      ],
      number: 0,
      size: 24,
      totalElements: 1,
      totalPages: 1
    });

    const wrapper = mount(HomeProfileView, {
      global: {
        plugins: [ElementPlus]
      }
    });
    await flushPromises();

    expect(wrapper.get('[data-test="music-audio-preview"]').attributes("src")).toBe("/uploads/ambient.mp4");
    expect(wrapper.text()).toContain("ambient.mp4");
    expect(wrapper.text()).not.toContain("自定义音频");
  });
});
