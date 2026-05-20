<template>
  <article ref="articleRef" class="prose article-renderer" v-html="contentHtml"></article>
</template>

<script setup lang="ts">
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { nextTick, onMounted, ref, watch } from "vue";
import { applyHeadingIds, type TocItem } from "../../features/reading/articleEnhancements";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("vue", xml);
hljs.registerLanguage("xml", xml);

const props = defineProps<{
  contentHtml?: string | null;
}>();

const emit = defineEmits<{
  "toc-change": [items: TocItem[]];
}>();

const articleRef = ref<HTMLElement | null>(null);

function languageFromCode(code: HTMLElement) {
  const languageClass = Array.from(code.classList).find((className) => className.startsWith("language-"));
  return languageClass?.replace("language-", "") ?? "";
}

function highlightCode(code: HTMLElement, language: string) {
  const original = code.textContent ?? "";
  if (!original.trim()) {
    return original;
  }

  try {
    if (language && hljs.getLanguage(language)) {
      code.innerHTML = hljs.highlight(original, { language }).value;
    } else {
      code.innerHTML = hljs.highlightAuto(original).value;
    }
  } catch {
    code.textContent = original;
  }

  return original;
}

function createCodeHeader(language: string, codeText: string) {
  const header = document.createElement("div");
  header.className = "code-block-header";

  const label = document.createElement("span");
  label.className = "code-language";
  label.textContent = language || "code";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-code-button";
  button.dataset.test = "copy-code";
  button.setAttribute("aria-label", "Copy code block");
  button.textContent = "Copy";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard?.writeText(codeText);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }
  });

  header.append(label, button);
  return header;
}

function enhanceCodeBlocks(root: HTMLElement) {
  root.querySelectorAll("pre").forEach((pre) => {
    if (pre.parentElement?.classList.contains("code-block-shell")) {
      return;
    }

    const code = pre.querySelector("code");
    if (!(code instanceof HTMLElement)) {
      return;
    }

    const language = languageFromCode(code);
    const codeText = highlightCode(code, language);
    const shell = document.createElement("div");
    shell.className = "code-block-shell";
    shell.appendChild(createCodeHeader(language, codeText));

    pre.replaceWith(shell);
    shell.appendChild(pre);
  });
}

async function enhanceArticle() {
  await nextTick();
  const article = articleRef.value;
  if (!article) {
    emit("toc-change", []);
    return;
  }

  const tocItems = applyHeadingIds(article);
  enhanceCodeBlocks(article);
  emit("toc-change", tocItems);
}

onMounted(enhanceArticle);
watch(() => props.contentHtml, enhanceArticle);
</script>
