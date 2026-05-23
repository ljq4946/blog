import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import ArticleRenderer from "./ArticleRenderer.vue";

describe("ArticleRenderer", () => {
  it("emits toc items and assigns duplicate heading ids", async () => {
    const wrapper = mount(ArticleRenderer, {
      props: {
        contentHtml: "<h2>Setup Guide</h2><p>Body</p><h3>Install Vue 3</h3><h2>Setup Guide</h2>"
      }
    });
    await flushPromises();

    expect(wrapper.emitted("toc-change")?.[0]?.[0]).toEqual([
      { id: "setup-guide", text: "Setup Guide", level: 2 },
      { id: "install-vue-3", text: "Install Vue 3", level: 3 },
      { id: "setup-guide-2", text: "Setup Guide", level: 2 }
    ]);
    expect(wrapper.find("#setup-guide").exists()).toBe(true);
    expect(wrapper.find("#setup-guide-2").exists()).toBe(true);
  });

  it("enhances code blocks with language labels and copy buttons", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const wrapper = mount(ArticleRenderer, {
      props: {
        contentHtml: '<pre><code class="language-ts">const answer: number = 42;</code></pre>'
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("ts");
    expect(wrapper.get('[data-test="copy-code"]').attributes("aria-label")).toBe("复制代码块");

    await wrapper.get('[data-test="copy-code"]').trigger("click");
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith("const answer: number = 42;");
    expect(wrapper.text()).toContain("已复制");
  });

  it("keeps code visible when no language class is present", async () => {
    const wrapper = mount(ArticleRenderer, {
      props: {
        contentHtml: "<pre><code>plain text</code></pre>"
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain("plain text");
    expect(wrapper.find('[data-test="copy-code"]').exists()).toBe(true);
  });
});
