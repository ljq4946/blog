import { flushPromises, mount } from "@vue/test-utils";
import ElementPlus from "element-plus";
import { describe, expect, it, vi } from "vitest";
import CrudPanel from "./CrudPanel.vue";

const fields = [
  { key: "name", label: "Name" },
  { key: "slug", label: "Slug" }
];

function mountPanel(saveRow = vi.fn()) {
  return mount(CrudPanel, {
    attachTo: document.body,
    props: {
      title: "Items",
      rows: [],
      fields,
      saveRow,
      deleteRow: vi.fn()
    },
    global: {
      plugins: [ElementPlus]
    }
  });
}

describe("CrudPanel", () => {
  it("waits for save to finish before closing the dialog", async () => {
    const saveRow = vi.fn(() => Promise.resolve());
    const wrapper = mountPanel(saveRow);

    await wrapper.find(".page-head button").trigger("click");
    await wrapper.findAll("input")[0].setValue("News");
    await wrapper.findAll("input")[1].setValue("news");
    await wrapper.find(".el-dialog .el-form button").trigger("click");
    await flushPromises();

    expect(saveRow).toHaveBeenCalledWith({ name: "News", slug: "news" });
    expect(wrapper.find(".el-dialog").isVisible()).toBe(false);
  });

  it("keeps the dialog open and shows an error when save fails", async () => {
    const saveRow = vi.fn(() => Promise.reject(new Error("Slug already exists")));
    const wrapper = mountPanel(saveRow);

    await wrapper.find(".page-head button").trigger("click");
    await wrapper.findAll("input")[0].setValue("News");
    await wrapper.findAll("input")[1].setValue("news");
    await wrapper.find(".el-dialog .el-form button").trigger("click");
    await flushPromises();

    expect(wrapper.find(".el-dialog").isVisible()).toBe(true);
    expect(wrapper.text()).toContain("Slug already exists");
  });
});
