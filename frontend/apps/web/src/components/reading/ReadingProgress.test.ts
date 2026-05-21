import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ReadingProgress from "./ReadingProgress.vue";

describe("ReadingProgress", () => {
  it("updates the progress bar width on scroll", async () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 600 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2000 });

    const wrapper = mount(ReadingProgress);
    window.dispatchEvent(new Event("scroll"));
    await flushPromises();

    expect(wrapper.get(".reading-progress-bar").attributes("style")).toContain("width: 50%");
  });
});
