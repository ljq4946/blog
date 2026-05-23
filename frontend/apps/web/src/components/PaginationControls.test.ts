import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PaginationControls from "./PaginationControls.vue";

describe("PaginationControls", () => {
  it("renders current page and emits previous and next pages", async () => {
    const wrapper = mount(PaginationControls, {
      props: { page: 1, totalPages: 3 }
    });

    expect(wrapper.text()).toContain("第 2 / 3 页");

    const previous = wrapper.get('[data-test="previous-page"]');
    const next = wrapper.get('[data-test="next-page"]');
    expect(previous.text()).toBe("上一页");
    expect(next.text()).toBe("下一页");

    await previous.trigger("click");
    await next.trigger("click");

    expect(wrapper.emitted("change")).toEqual([[0], [2]]);
  });

  it("disables unavailable navigation", () => {
    const wrapper = mount(PaginationControls, {
      props: { page: 0, totalPages: 1 }
    });

    expect(wrapper.get('[data-test="previous-page"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-test="next-page"]').attributes("disabled")).toBeDefined();
  });
});
