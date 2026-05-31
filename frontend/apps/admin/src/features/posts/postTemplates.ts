import type { PostForm } from "./postForm";

export interface WritingTemplate {
  id: "project-case" | "technical-note" | "release-review";
  name: string;
  description: string;
  summary: string;
  contentHtml: string;
}

export const writingTemplates: WritingTemplate[] = [
  {
    id: "project-case",
    name: "项目案例",
    description: "适合沉淀作品集项目、技术选型和交付结果。",
    summary: "围绕项目背景、关键实现和最终结果整理这篇项目案例。",
    contentHtml: [
      "<h2>目标</h2>",
      "<p>说明项目背景、约束条件和希望解决的问题。</p>",
      "<h2>实现路径</h2>",
      "<p>记录关键设计、技术取舍、遇到的阻塞和解决方式。</p>",
      "<h2>结果</h2>",
      "<p>总结交付效果、可复用经验和后续可以继续优化的方向。</p>"
    ].join("")
  },
  {
    id: "technical-note",
    name: "技术笔记",
    description: "适合记录一个具体问题、判断过程和可复用结论。",
    summary: "记录问题、排查路径和最终结论，方便以后快速复用。",
    contentHtml: [
      "<h2>问题</h2>",
      "<p>描述触发场景、现象和影响范围。</p>",
      "<h2>分析</h2>",
      "<p>列出排查步骤、关键证据和被排除的假设。</p>",
      "<h2>结论</h2>",
      "<p>沉淀最终方案、适用边界和下次可以直接复用的检查项。</p>"
    ].join("")
  },
  {
    id: "release-review",
    name: "版本复盘",
    description: "适合记录一次版本交付、验证结果和后续计划。",
    summary: "复盘本次版本范围、验证结果、风险和后续计划。",
    contentHtml: [
      "<h2>版本范围</h2>",
      "<p>列出本次发布包含的核心变化。</p>",
      "<h2>验证结果</h2>",
      "<p>记录测试、构建、部署检查和人工冒烟结果。</p>",
      "<h2>后续计划</h2>",
      "<p>明确下一步要继续推进的能力和暂缓事项。</p>"
    ].join("")
  }
];

export function applyWritingTemplate(form: PostForm, templateId: WritingTemplate["id"]): PostForm {
  const template = writingTemplates.find((item) => item.id === templateId);
  if (!template) {
    return { ...form, topicIds: [...form.topicIds], tagIds: [...form.tagIds] };
  }

  const contentHtml = form.contentHtml?.trim()
    ? `${form.contentHtml}<hr>${template.contentHtml}`
    : template.contentHtml;

  return {
    ...form,
    summary: form.summary?.trim() ? form.summary : template.summary,
    contentHtml,
    topicIds: [...form.topicIds],
    tagIds: [...form.tagIds]
  };
}
