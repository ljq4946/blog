import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeProfileView from "./HomeProfileView.vue";

const homeProfileMock = vi.hoisted(() => vi.fn());
const saveHomeProfileMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", () => ({
  adminApi: {
    homeProfile: homeProfileMock,
    saveHomeProfile: saveHomeProfileMock
  }
}));

describe("HomeProfileView", () => {
  beforeEach(() => {
    homeProfileMock.mockReset();
    saveHomeProfileMock.mockReset();
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
    saveHomeProfileMock.mockResolvedValue({});
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
});
