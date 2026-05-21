import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { READING_THEME_KEY } from "../../features/reading/articleEnhancements";
import ReadingPreferences from "./ReadingPreferences.vue";

describe("ReadingPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts from the stored dark theme", () => {
    localStorage.setItem(READING_THEME_KEY, "dark");

    const wrapper = mount(ReadingPreferences);

    expect(wrapper.get("button").text()).toContain("Light mode");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggles and stores dark mode", async () => {
    const wrapper = mount(ReadingPreferences);

    expect(document.documentElement.dataset.theme).toBe("light");
    await wrapper.get("button").trigger("click");

    expect(localStorage.getItem(READING_THEME_KEY)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(wrapper.get("button").text()).toContain("Light mode");
  });
});
