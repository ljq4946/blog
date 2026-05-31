import type { Post, Series, Topic } from "@blog/shared";

export interface ShowcaseLink {
  label: string;
  title: string;
  description: string;
  href: string;
}

const archiveLink: ShowcaseLink = {
  label: "完整索引",
  title: "全部文章",
  description: "按时间、分类、标签、专题和系列检索公开内容。",
  href: "/archive"
};

export function buildShowcaseLinks(posts: Post[], topics: Topic[], seriesItems: Series[]): ShowcaseLink[] {
  const links: ShowcaseLink[] = [];
  const latestPost = posts[0];
  const primaryTopic = topics[0];
  const primarySeries = seriesItems[0];

  if (latestPost) {
    links.push({
      label: "代表文章",
      title: latestPost.title,
      description: latestPost.summary || "从一篇公开文章进入完整技术脉络。",
      href: `/posts/${latestPost.slug}`
    });
  }

  if (primaryTopic) {
    links.push({
      label: "技术专题",
      title: primaryTopic.name,
      description: primaryTopic.description || "长期维护的技术知识地图。",
      href: `/topics/${primaryTopic.slug}`
    });
  }

  if (primarySeries) {
    links.push({
      label: "阅读系列",
      title: primarySeries.name,
      description: primarySeries.description || "按顺序阅读一组完整实践记录。",
      href: `/series/${primarySeries.slug}`
    });
  }

  return [...links, archiveLink];
}
