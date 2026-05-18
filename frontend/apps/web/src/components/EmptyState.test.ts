import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState.vue";

describe("EmptyState", () => {
  it("renders compact empty copy", () => {
    expect(mount(EmptyState, { props: { title: "暂无文章" } }).text()).toContain("暂无文章");
  });
});
